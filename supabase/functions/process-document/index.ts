import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Split text into chunks for RAG
function splitIntoChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);
    
    // Try to end at a sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
      }
    }
    
    chunks.push(chunk.trim());
    start = start + chunk.length - overlap;
    
    if (start >= text.length - overlap) break;
  }
  
  return chunks.filter(c => c.length > 50); // Filter out very short chunks
}

// Basic PDF text extraction (simplified - extracts readable text)
async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  // Convert to string and extract text between stream objects
  const decoder = new TextDecoder('latin1');
  const pdfString = decoder.decode(pdfBytes);
  
  // Extract text from PDF streams (simplified extraction)
  const textParts: string[] = [];
  
  // Look for text in BT...ET blocks (PDF text objects)
  const btEtRegex = /BT[\s\S]*?ET/g;
  const matches = pdfString.match(btEtRegex) || [];
  
  for (const match of matches) {
    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(match)) !== null) {
      textParts.push(tjMatch[1]);
    }
    
    // Extract from TJ arrays
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrayMatch;
    while ((tjArrayMatch = tjArrayRegex.exec(match)) !== null) {
      const content = tjArrayMatch[1];
      const stringRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = stringRegex.exec(content)) !== null) {
        textParts.push(strMatch[1]);
      }
    }
  }
  
  // Also try to extract plain text content
  const plainTextRegex = /stream\s*([\s\S]*?)\s*endstream/g;
  let streamMatch;
  while ((streamMatch = plainTextRegex.exec(pdfString)) !== null) {
    const content = streamMatch[1];
    // Filter to readable ASCII text
    const readable = content.replace(/[^\x20-\x7E\n\r]/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim();
    if (readable.length > 50 && /[a-zA-Z]{3,}/.test(readable)) {
      textParts.push(readable);
    }
  }
  
  let text = textParts.join(' ');
  
  // Clean up the text
  text = text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return text;
}

// Use Lovable AI to extract/summarize content if needed
async function enhanceExtraction(rawText: string, fileName: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY || rawText.length < 100) {
    return rawText;
  }
  
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um assistente que organiza e limpa texto extraído de documentos. Mantenha todas as informações importantes, remova caracteres estranhos e formate o texto de forma legível. Retorne apenas o texto limpo, sem comentários adicionais."
          },
          {
            role: "user",
            content: `Limpe e organize este texto extraído do documento "${fileName}":\n\n${rawText.slice(0, 8000)}`
          }
        ],
        max_tokens: 4000,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || rawText;
    }
  } catch (error) {
    console.error("Error enhancing extraction:", error);
  }
  
  return rawText;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { documentId } = await req.json();

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    console.log(`Processing document: ${documentId}`);

    // Get document info
    const { data: document, error: docError } = await supabaseClient
      .from('brand_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Update status to processing
    await supabaseClient
      .from('brand_documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('brand-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file');
    }

    console.log(`Downloaded file: ${document.file_name}, size: ${fileData.size}`);

    // Extract text based on file type
    let extractedText = '';
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (document.mime_type === 'application/pdf') {
      extractedText = await extractTextFromPDF(bytes);
    } else if (document.mime_type === 'text/plain') {
      extractedText = new TextDecoder().decode(bytes);
    } else {
      // For Word docs, try basic text extraction
      const decoder = new TextDecoder('utf-8', { fatal: false });
      extractedText = decoder.decode(bytes).replace(/[^\x20-\x7E\n\r\u00C0-\u00FF]/g, ' ');
    }

    console.log(`Extracted ${extractedText.length} characters`);

    // Enhance extraction with AI if text is substantial
    if (extractedText.length > 200) {
      extractedText = await enhanceExtraction(extractedText, document.file_name);
    }

    if (extractedText.length < 50) {
      await supabaseClient
        .from('brand_documents')
        .update({ status: 'error', total_chunks: 0 })
        .eq('id', documentId);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Could not extract meaningful text from document' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Split into chunks
    const chunks = splitIntoChunks(extractedText);
    console.log(`Created ${chunks.length} chunks`);

    // Delete existing chunks for this document
    await supabaseClient
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    // Insert new chunks
    const chunkInserts = chunks.map((content, index) => ({
      document_id: documentId,
      brand_id: document.brand_id,
      chunk_index: index,
      content,
      content_length: content.length,
    }));

    const { error: insertError } = await supabaseClient
      .from('document_chunks')
      .insert(chunkInserts);

    if (insertError) {
      console.error('Error inserting chunks:', insertError);
      throw new Error('Failed to save document chunks');
    }

    // Update document status
    await supabaseClient
      .from('brand_documents')
      .update({ 
        status: 'completed', 
        total_chunks: chunks.length 
      })
      .eq('id', documentId);

    console.log(`Document processed successfully: ${chunks.length} chunks created`);

    return new Response(JSON.stringify({ 
      success: true, 
      chunks: chunks.length,
      extractedLength: extractedText.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
