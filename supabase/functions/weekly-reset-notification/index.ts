import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get all users with brands
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) throw usersError;

    let notificationsSent = 0;

    for (const user of users.users) {
      // Check if user has brands
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name')
        .eq('user_id', user.id);

      if (brandsError || !brands || brands.length === 0) continue;

      // Get last week's data for each brand
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const brandSummaries = [];

      for (const brand of brands) {
        const { data: currentWeekScores } = await supabase
          .from('geo_scores')
          .select('score')
          .eq('brand_id', brand.id)
          .gte('computed_at', sevenDaysAgo.toISOString())
          .order('computed_at', { ascending: false });

        const { data: previousWeekScores } = await supabase
          .from('geo_scores')
          .select('score')
          .eq('brand_id', brand.id)
          .gte('computed_at', fourteenDaysAgo.toISOString())
          .lt('computed_at', sevenDaysAgo.toISOString())
          .order('computed_at', { ascending: false });

        if (currentWeekScores && currentWeekScores.length > 0) {
          const currentAvg = currentWeekScores.reduce((acc, s) => acc + Number(s.score), 0) / currentWeekScores.length;
          const previousAvg = previousWeekScores && previousWeekScores.length > 0
            ? previousWeekScores.reduce((acc, s) => acc + Number(s.score), 0) / previousWeekScores.length
            : currentAvg;
          
          const change = currentAvg - previousAvg;
          const percentChange = previousAvg > 0 ? ((change / previousAvg) * 100).toFixed(2) : '0.00';

          brandSummaries.push({
            name: brand.name,
            currentScore: currentAvg.toFixed(2),
            previousScore: previousAvg.toFixed(2),
            change: change.toFixed(2),
            percentChange,
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
          });
        }
      }

      // Create alert notification for the user
      if (brandSummaries.length > 0) {
        const message = brandSummaries.map(b => 
          `${b.name}: ${b.currentScore} (${Number(b.percentChange) >= 0 ? '+' : ''}${b.percentChange}%)`
        ).join(' | ');

        await supabase.from('alerts_history').insert({
          user_id: user.id,
          alert_type: 'weekly_summary',
          title: '📊 Resumo Semanal - Nova Semana Iniciada',
          message: `Variações da última semana: ${message}`,
          priority: 'low',
          metadata: { brands: brandSummaries },
        });

        notificationsSent++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Weekly reset notifications sent to ${notificationsSent} users`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in weekly-reset-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
