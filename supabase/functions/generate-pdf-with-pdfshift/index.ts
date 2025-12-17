/**
 * Edge Function: Generate PDF with PDFShift
 * Usa PDFShift API para gerar PDFs profissionais com charts perfeitos
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDFShiftRequest {
  html: string;
  filename?: string;
  options?: {
    landscape?: boolean;
    format?: string;
    margin?: {
      top?: string;
      bottom?: string;
      left?: string;
      right?: string;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando geração de PDF com PDFShift');

    // Validar API Key
    const apiKey = Deno.env.get('PDFSHIFT_API_KEY');
    if (!apiKey) {
      throw new Error('PDFSHIFT_API_KEY não configurada');
    }

    // Parse request
    const body: PDFShiftRequest = await req.json();
    const { html, filename = 'document.pdf', options = {} } = body;

    if (!html) {
      throw new Error('HTML é obrigatório');
    }

    console.log('📄 HTML recebido:', { 
      length: html.length, 
      filename,
      options 
    });

    // Configuração PDFShift (apenas campos válidos!)
    const pdfShiftPayload = {
      source: html,
      landscape: options.landscape || false,
      format: options.format || 'A4',
      margin: options.margin || {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
      use_print: false,
      // Aguardar render completo (networkidle aguarda todo o HTML/CSS/JS carregar)
      delay: 2000, // 2 segundos para garantir render
    };

    console.log('🔧 Configuração PDFShift:', pdfShiftPayload);

    // Chamar PDFShift API
    const pdfShiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      },
      body: JSON.stringify(pdfShiftPayload),
    });

    if (!pdfShiftResponse.ok) {
      const errorText = await pdfShiftResponse.text();
      console.error('❌ Erro PDFShift:', errorText);
      throw new Error(`PDFShift API error: ${pdfShiftResponse.status} - ${errorText}`);
    }

    // Obter PDF como bytes
    const pdfBytes = await pdfShiftResponse.arrayBuffer();
    console.log('✅ PDF gerado com sucesso:', { 
      size: pdfBytes.byteLength,
      filename 
    });

    // Retornar PDF
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
