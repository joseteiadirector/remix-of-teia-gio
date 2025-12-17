/**
 * LLM Mention Analyzer
 * Analyzes brand mentions using AI to determine sentiment, context, and relevance
 */

interface AnalysisResult {
  mentioned: boolean;
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  context: 'relevant' | 'irrelevant' | 'partial';
  excerpt: string;
  reasoning: string;
}

export async function analyzeMentionWithAI(
  answer: string,
  brandName: string,
  domain: string,
  lovableApiKey: string
): Promise<AnalysisResult> {
  
  // Input validation
  if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
    console.error('❌ Invalid answer input for AI analysis');
    return {
      mentioned: false,
      confidence: 0,
      sentiment: 'neutral',
      context: 'irrelevant',
      excerpt: '',
      reasoning: 'Invalid input: empty answer'
    };
  }

  if (!brandName || typeof brandName !== 'string' || brandName.trim().length === 0) {
    console.error('❌ Invalid brandName input for AI analysis');
    return {
      mentioned: false,
      confidence: 0,
      sentiment: 'neutral',
      context: 'irrelevant',
      excerpt: answer.substring(0, 200),
      reasoning: 'Invalid input: empty brand name'
    };
  }

  if (!lovableApiKey || typeof lovableApiKey !== 'string' || lovableApiKey.trim().length === 0) {
    console.error('❌ Invalid API key, falling back to basic analysis');
    const basicAnalysis = basicTextAnalysis(answer, brandName, domain);
    return enhanceBasicAnalysis(basicAnalysis, answer);
  }

  console.log(`🤖 Starting AI analysis for brand: ${brandName}`);
  
  // First, do basic text analysis
  const basicAnalysis = basicTextAnalysis(answer, brandName, domain);
  
  // If not mentioned at all, skip AI analysis
  if (!basicAnalysis.mentioned) {
    return {
      mentioned: false,
      confidence: 0,
      sentiment: 'neutral',
      context: 'irrelevant',
      excerpt: answer.substring(0, 200),
      reasoning: 'Brand not mentioned in response'
    };
  }

  // Use AI for deep analysis
  try {
    console.log(`  → Calling AI gateway for analysis...`);
    const startTime = Date.now();
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a brand mention analyst. Analyze if a brand is mentioned in a text and evaluate:
1. Sentiment (positive/negative/neutral)
2. Context (relevant/irrelevant/partial)
3. Confidence (0-100)

Return ONLY valid JSON with this structure:
{
  "mentioned": boolean,
  "confidence": number (0-100),
  "sentiment": "positive" | "negative" | "neutral",
  "context": "relevant" | "irrelevant" | "partial",
  "reasoning": "brief explanation"
}`
          },
          {
            role: 'user',
            content: `Analyze this response about "${brandName}" (domain: ${domain}):

"${answer}"

Is the brand mentioned? What's the sentiment and context?`
          }
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    console.log(`  ✓ AI response received (${duration}ms)`);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`  ❌ AI Gateway error: ${aiResponse.status}`, errorText);
      
      if (aiResponse.status === 429) {
        console.error('  ⚠️ Rate limit exceeded');
      } else if (aiResponse.status === 402) {
        console.error('  ⚠️ Payment required');
      }
      
      console.log('  → Falling back to basic analysis');
      return enhanceBasicAnalysis(basicAnalysis, answer);
    }

    const aiData = await aiResponse.json();
    
    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      console.error('  ❌ Invalid AI response structure');
      return enhanceBasicAnalysis(basicAnalysis, answer);
    }
    
    const aiContent = aiData.choices[0].message.content;
    
    if (!aiContent || typeof aiContent !== 'string') {
      console.error('  ❌ Empty or invalid AI content');
      return enhanceBasicAnalysis(basicAnalysis, answer);
    }
    
    console.log(`  ✓ AI content received: ${aiContent.substring(0, 100)}...`);
    
    // Parse AI response
    let aiAnalysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
        console.log(`  ✓ Successfully parsed AI analysis`);
      } else {
        console.error('  ❌ No JSON found in AI response');
        throw new Error('No JSON found in AI response');
      }
    } catch (e) {
      console.error('  ❌ Failed to parse AI analysis:', e);
      return enhanceBasicAnalysis(basicAnalysis, answer);
    }

    // Validate AI analysis structure
    if (typeof aiAnalysis.mentioned !== 'boolean') {
      console.error('  ❌ Invalid "mentioned" field in AI response');
      aiAnalysis.mentioned = basicAnalysis.mentioned;
    }

    if (typeof aiAnalysis.confidence !== 'number' || isNaN(aiAnalysis.confidence)) {
      console.error('  ⚠️ Invalid "confidence" field, using basic analysis value');
      aiAnalysis.confidence = basicAnalysis.confidence;
    }

    if (!['positive', 'negative', 'neutral'].includes(aiAnalysis.sentiment)) {
      console.error('  ⚠️ Invalid "sentiment" field, defaulting to neutral');
      aiAnalysis.sentiment = 'neutral';
    }

    if (!['relevant', 'irrelevant', 'partial'].includes(aiAnalysis.context)) {
      console.error('  ⚠️ Invalid "context" field, defaulting to relevant');
      aiAnalysis.context = 'relevant';
    }

    // Extract excerpt around mention
    const excerpt = extractExcerpt(answer, brandName, domain);

    const result = {
      mentioned: aiAnalysis.mentioned !== false,
      confidence: Math.min(100, Math.max(0, aiAnalysis.confidence || basicAnalysis.confidence)),
      sentiment: aiAnalysis.sentiment || 'neutral',
      context: aiAnalysis.context || 'relevant',
      excerpt,
      reasoning: aiAnalysis.reasoning || 'AI analysis completed'
    };

    console.log(`  ✓ Final analysis:`, {
      mentioned: result.mentioned,
      confidence: result.confidence,
      sentiment: result.sentiment,
      context: result.context
    });

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Critical error in AI analysis: ${errorMessage}`);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('  ⚠️ Request timeout (30s exceeded)');
    }
    
    console.log('  → Using fallback basic analysis');
    return enhanceBasicAnalysis(basicAnalysis, answer);
  }
}

function basicTextAnalysis(answer: string, brandName: string, domain: string) {
  const lowerAnswer = answer.toLowerCase();
  const lowerBrand = brandName.toLowerCase();
  const lowerDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');

  let mentioned = false;
  let confidence = 0;

  // Direct brand name mention
  if (lowerAnswer.includes(lowerBrand)) {
    mentioned = true;
    confidence = 85;
  }

  // Domain mention
  if (lowerAnswer.includes(lowerDomain)) {
    mentioned = true;
    confidence = Math.max(confidence, 80);
  }

  // Partial match (fuzzy)
  const words = lowerBrand.split(' ');
  const matchedWords = words.filter(word => word.length > 3 && lowerAnswer.includes(word));
  if (matchedWords.length >= words.length * 0.7 && matchedWords.length > 0) {
    mentioned = true;
    confidence = Math.max(confidence, 60);
  }

  return { mentioned, confidence };
}

function enhanceBasicAnalysis(basicAnalysis: any, answer: string): AnalysisResult {
  // Simple sentiment detection based on keywords
  const lowerAnswer = answer.toLowerCase();
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  
  const positiveWords = ['excelente', 'ótimo', 'bom', 'melhor', 'recomendo', 'confiável', 'qualidade', 'líder'];
  const negativeWords = ['ruim', 'problema', 'péssimo', 'falha', 'não recomendo', 'cuidado', 'evite'];
  
  const positiveCount = positiveWords.filter(word => lowerAnswer.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerAnswer.includes(word)).length;
  
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';

  return {
    ...basicAnalysis,
    sentiment,
    context: 'relevant',
    excerpt: answer.substring(0, 200),
    reasoning: 'Basic text analysis'
  };
}

function extractExcerpt(answer: string, brandName: string, domain: string): string {
  const sentences = answer.split(/[.!?]+/);
  const lowerBrand = brandName.toLowerCase();
  const lowerDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    if (lowerSentence.includes(lowerBrand) || lowerSentence.includes(lowerDomain)) {
      return sentence.trim();
    }
  }
  
  return answer.substring(0, 200) + (answer.length > 200 ? '...' : '');
}
