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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[DAILY-REPORTS] Starting daily report generation...');

    // Get all users with their emails
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) throw authError;

    console.log(`[DAILY-REPORTS] Found ${authUsers.users.length} users`);

    // Últimas 24 horas para relatório diário
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 48 horas atrás para comparação (dia anterior)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const results = [];

    for (const authUser of authUsers.users) {
      try {
        // Get user's brands
        const { data: brands, error: brandsError } = await supabaseAdmin
          .from('brands')
          .select('id, name')
          .eq('user_id', authUser.id);

        if (brandsError || !brands || brands.length === 0) {
          console.log(`[DAILY-REPORTS] User ${authUser.email} has no brands, skipping`);
          continue;
        }

        // Get mentions for each brand from last 24 hours
        const brandSummaries = [];
        let totalMentions = 0;

        for (const brand of brands) {
          // 🐛 FIX: Tabela correta é mentions_llm, não llm_mentions
          // 🐛 FIX: Coluna correta é collected_at, não created_at
          // 🐛 FIX: Coluna correta é confidence, não relevance_score
          const { data: mentions, error: mentionsError } = await supabaseAdmin
            .from('mentions_llm')
            .select('id, confidence, mentioned')
            .eq('brand_id', brand.id)
            .eq('mentioned', true) // Apenas menções positivas
            .gte('collected_at', yesterday.toISOString());

          if (mentionsError) {
            console.error(`[DAILY-REPORTS] Error fetching mentions for brand ${brand.name}:`, mentionsError);
            console.error(`[DAILY-REPORTS] Error details:`, mentionsError);
            continue;
          }

          console.log(`[DAILY-REPORTS] Brand ${brand.name}: ${mentions?.length || 0} mentions found (last 24h)`);

          const currentScore = mentions && mentions.length > 0
            ? mentions.reduce((sum, m) => sum + (m.confidence || 0), 0) / mentions.length
            : 0;

          // Get previous day's score for comparison (24-48h atrás)
          const { data: prevMentions, error: prevError } = await supabaseAdmin
            .from('mentions_llm')
            .select('confidence, mentioned')
            .eq('brand_id', brand.id)
            .eq('mentioned', true)
            .gte('collected_at', twoDaysAgo.toISOString())
            .lt('collected_at', yesterday.toISOString());

          if (prevError) {
            console.error(`[DAILY-REPORTS] Error fetching previous mentions:`, prevError);
          }

          const previousScore = prevMentions && prevMentions.length > 0
            ? prevMentions.reduce((sum, m) => sum + (m.confidence || 0), 0) / prevMentions.length
            : 0;

          const mentionCount = mentions?.length || 0;
          totalMentions += mentionCount;

          // Calcular trend baseado na diferença de score
          // Confidence vai de 0 a 1, então usamos 0.1 (10%) como threshold
          let trend: "up" | "down" | "stable" = "stable";
          if (currentScore > previousScore + 0.1) trend = "up";
          else if (currentScore < previousScore - 0.1) trend = "down";

          // Converter confidence (0-1) para score de 0-100 para display
          const currentScoreDisplay = currentScore * 100;
          const previousScoreDisplay = previousScore * 100;

          console.log(`[DAILY-REPORTS] Brand ${brand.name}: Current=${currentScoreDisplay.toFixed(1)}, Previous=${previousScoreDisplay.toFixed(1)}, Trend=${trend}, Mentions=${mentionCount}`);

          brandSummaries.push({
            name: brand.name,
            currentScore: Math.round(currentScoreDisplay * 10) / 10,
            previousScore: Math.round(previousScoreDisplay * 10) / 10,
            mentions: mentionCount,
            trend
          });
        }

        console.log(`[DAILY-REPORTS] User ${authUser.email}: ${brandSummaries.length} brands processed, ${totalMentions} total mentions`);

        // Send daily report email
        const today = new Date();
        const dateRange = `${yesterday.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;

        const { error: emailError } = await supabaseAdmin.functions.invoke('send-weekly-report', {
          body: {
            userEmail: authUser.email,
            userName: authUser.user_metadata?.name,
            brands: brandSummaries,
            totalMentions,
            weekRange: dateRange // Mesmo nome da prop, mas agora é range diário
          }
        });

        if (emailError) {
          console.error(`[DAILY-REPORTS] Failed to send email to ${authUser.email}:`, emailError);
          results.push({ email: authUser.email, status: 'failed', error: emailError.message });
        } else {
          console.log(`[DAILY-REPORTS] Successfully sent report to ${authUser.email}`);
          results.push({ email: authUser.email, status: 'sent', brandCount: brands.length, mentions: totalMentions });
        }

      } catch (userError) {
        console.error(`[DAILY-REPORTS] Error processing user ${authUser.email}:`, userError);
        results.push({ email: authUser.email, status: 'error', error: String(userError) });
      }
    }

    console.log('[DAILY-REPORTS] Completed daily report generation');

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: authUsers.users.length,
        results 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('[DAILY-REPORTS] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
