import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Não autorizado');
    }

    const { reportType } = await req.json();

    console.log(`[MANUAL-REPORT] Generating ${reportType} report for user ${user.email}`);

    // Get user's brands
    const { data: brands, error: brandsError } = await supabaseClient
      .from('brands')
      .select('id, name')
      .eq('user_id', user.id);

    if (brandsError || !brands || brands.length === 0) {
      throw new Error('Nenhuma marca encontrada');
    }

    // Determine report title with brand name
    const brandName = brands.length === 1 ? brands[0].name : null;
    let reportTitle = "";
    
    if (reportType === 'weekly') {
      reportTitle = brandName ? `${brandName} - Relatório Semanal` : "Relatório Semanal";
    } else if (reportType === 'monthly') {
      reportTitle = brandName ? `${brandName} - Relatório Mensal` : "Relatório Mensal";
    } else if (reportType === 'daily') {
      reportTitle = brandName ? `${brandName} - Relatório Diário` : "Relatório Diário";
    }

    // Calculate date range based on report type
    const endDate = new Date();
    const startDate = new Date();
    
    if (reportType === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (reportType === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (reportType === 'daily') {
      startDate.setDate(startDate.getDate() - 1);
    }

    // Get mentions for each brand
    const brandSummaries = [];
    let totalMentions = 0;

    for (const brand of brands) {
      const { data: mentions, error: mentionsError } = await supabaseClient
        .from('llm_mentions')
        .select('id, relevance_score')
        .eq('brand_id', brand.id)
        .gte('created_at', startDate.toISOString());

      if (mentionsError) {
        console.error(`Error fetching mentions for brand ${brand.name}:`, mentionsError);
        continue;
      }

      const currentScore = mentions && mentions.length > 0
        ? mentions.reduce((sum, m) => sum + (m.relevance_score || 0), 0) / mentions.length
        : 0;

      const mentionCount = mentions?.length || 0;
      totalMentions += mentionCount;

      brandSummaries.push({
        name: brand.name,
        score: Math.round(currentScore * 10) / 10,
        mentions: mentionCount,
      });
    }

    // Save generated report with brand-specific title
    const { data: report, error: reportError } = await supabaseClient
      .from('generated_reports')
      .insert({
        user_id: user.id,
        report_type: reportType,
        content: {
          title: reportTitle,
          brandName: brandName,
          brands: brandSummaries,
          totalMentions,
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        },
        status: 'completed',
        email_sent: false
      })
      .select()
      .single();

    if (reportError) {
      throw reportError;
    }

    console.log(`[MANUAL-REPORT] Report generated successfully for user ${user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        report,
        message: 'Relatório gerado com sucesso'
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('[MANUAL-REPORT] ❌ Error:', error);
    
    const errorMessage = error.message || 'Erro desconhecido ao gerar relatório manual';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});