import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[AUTOMATION-ORCHESTRATOR] Iniciando orquestração de automações...');

    const now = new Date().toISOString();
    
    // Buscar automações pendentes
    const { data: pendingConfigs, error: configsError } = await supabase
      .from('automation_configs')
      .select('*')
      .eq('enabled', true)
      .lte('next_run', now);

    if (configsError) {
      throw configsError;
    }

    console.log(`[AUTOMATION-ORCHESTRATOR] Encontradas ${pendingConfigs?.length || 0} automações pendentes`);

    const results = [];

    for (const config of pendingConfigs || []) {
      const startTime = Date.now();
      
      // Criar job
      const { data: job, error: jobError } = await supabase
        .from('automation_jobs')
        .insert({
          config_id: config.id,
          user_id: config.user_id,
          brand_id: config.brand_id,
          job_type: config.automation_type,
          status: 'running',
        })
        .select()
        .single();

      if (jobError) {
        console.error(`[AUTOMATION-ORCHESTRATOR] Erro ao criar job:`, jobError);
        continue;
      }

      try {
        let result: any = {};
        let retries = 0;
        const maxRetries = 3;
        let lastError: any = null;

        // Executar automação com retry logic
        while (retries < maxRetries) {
          try {
            console.log(`[AUTOMATION-ORCHESTRATOR] Tentativa ${retries + 1}/${maxRetries} para ${config.automation_type}`);
            
            switch (config.automation_type) {
              case 'mentions_collection':
                result = await runMentionsCollection(supabase, config);
                break;
              case 'seo_analysis':
                result = await runSeoAnalysis(supabase, config);
                break;
              case 'geo_metrics':
                result = await runGeoMetrics(supabase, config);
                break;
              case 'weekly_report':
                result = await runWeeklyReport(supabase, config);
                break;
              case 'alerts_check':
                result = await runAlertsCheck(supabase, config);
                break;
              default:
                throw new Error(`Tipo de automação desconhecido: ${config.automation_type}`);
            }
            
            console.log(`[AUTOMATION-ORCHESTRATOR] ✅ ${config.automation_type} executado com sucesso`);
            break; // Sucesso, sair do loop
            
          } catch (error) {
            lastError = error;
            retries++;
            
            if (retries < maxRetries) {
              const delay = Math.pow(2, retries) * 1000; // Exponential backoff
              console.warn(`[AUTOMATION-ORCHESTRATOR] ⚠️ Erro na tentativa ${retries}. Tentando novamente em ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              console.error(`[AUTOMATION-ORCHESTRATOR] ❌ Falha após ${maxRetries} tentativas:`, error);
              throw error;
            }
          }
        }

        const duration = Date.now() - startTime;

        // Atualizar job como completo
        await supabase
          .from('automation_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            result,
          })
          .eq('id', job.id);

        // Calcular próxima execução
        const nextRun = calculateNextRun(config.frequency, config.schedule_time);
        
        // Atualizar config
        await supabase
          .from('automation_configs')
          .update({
            last_run: now,
            next_run: nextRun.toISOString(),
          })
          .eq('id', config.id);

        results.push({
          config_id: config.id,
          job_id: job.id,
          type: config.automation_type,
          success: true,
          duration_ms: duration,
          result,
        });

      } catch (error: any) {
        console.error(`[AUTOMATION-ORCHESTRATOR] Erro ao executar ${config.automation_type}:`, error);
        
        const duration = Date.now() - startTime;

        // Atualizar job como falho
        await supabase
          .from('automation_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            error: error.message,
          })
          .eq('id', job.id);

        results.push({
          config_id: config.id,
          job_id: job.id,
          type: config.automation_type,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`[AUTOMATION-ORCHESTRATOR] Processadas ${results.length} automações`);

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[AUTOMATION-ORCHESTRATOR] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper para executar coleta de menções com autenticação service role
async function runMentionsCollection(supabase: any, config: any) {
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', config.brand_id)
    .single();

  if (!brand) {
    throw new Error('Marca não encontrada');
  }

  // Chamada HTTP direta com service role key para autenticação
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/collect-llm-mentions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ brandId: brand.id }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[MENTIONS-COLLECTION] Erro HTTP ${response.status}: ${errorText}`);
    throw new Error(`Falha na coleta de menções: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[MENTIONS-COLLECTION] ✅ Coletadas ${data?.mentionsAdded || data?.collected || 0} menções para ${brand.name}`);
  
  return { mentions_collected: data?.mentionsAdded || data?.collected || 0 };
}

// Helper para executar análise SEO com autenticação service role
async function runSeoAnalysis(supabase: any, config: any) {
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', config.brand_id)
    .single();

  if (!brand) {
    throw new Error('Marca não encontrada');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/collect-seo-metrics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ brandId: brand.id }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[SEO-ANALYSIS] Erro HTTP ${response.status}: ${errorText}`);
    throw new Error(`Falha na análise SEO: ${response.status}`);
  }

  console.log(`[SEO-ANALYSIS] ✅ Métricas coletadas para ${brand.name}`);
  return { metrics_collected: true };
}

// Helper para executar cálculo de métricas GEO com autenticação service role
async function runGeoMetrics(supabase: any, config: any) {
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', config.brand_id)
    .single();

  if (!brand) {
    throw new Error('Marca não encontrada');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/calculate-geo-metrics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ 
      brandId: brand.id,
      userId: config.user_id 
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[GEO-METRICS] Erro HTTP ${response.status}: ${errorText}`);
    throw new Error(`Falha no cálculo GEO: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[GEO-METRICS] ✅ Score calculado para ${brand.name}: ${data?.finalScore || 0}`);
  return { geo_score: data?.finalScore || 0 };
}

// Helper para enviar relatório semanal
async function runWeeklyReport(supabase: any, config: any) {
  // Buscar dados do usuário
  const { data: user } = await supabase.auth.admin.getUserById(config.user_id);
  
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Buscar marcas do usuário
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', config.user_id);

  if (!brands || brands.length === 0) {
    throw new Error('Nenhuma marca encontrada');
  }

  const brandsSummary = [];
  let totalMentions = 0;

  for (const brand of brands) {
    const { data: scores } = await supabase
      .from('geo_scores')
      .select('final_score')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })
      .limit(2);

    const { data: mentions, count } = await supabase
      .from('mentions_llm')
      .select('*', { count: 'exact' })
      .eq('brand_id', brand.id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const currentScore = scores?.[0]?.final_score || 0;
    const previousScore = scores?.[1]?.final_score || 0;
    const mentionsCount = count || 0;
    totalMentions += mentionsCount;

    brandsSummary.push({
      name: brand.name,
      currentScore,
      previousScore,
      mentions: mentionsCount,
      trend: currentScore > previousScore ? 'up' : currentScore < previousScore ? 'down' : 'stable',
    });
  }

  // Invocar função de envio de email
  const { error } = await supabase.functions.invoke('send-weekly-report', {
    body: {
      userEmail: user.user?.email,
      userName: user.user?.user_metadata?.name,
      brands: brandsSummary,
      totalMentions,
      weekRange: `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')} - ${new Date().toLocaleDateString('pt-BR')}`,
    },
  });

  if (error) throw error;

  return { report_sent: true, brands_count: brands.length };
}

// Helper para verificar alertas
async function runAlertsCheck(supabase: any, config: any) {
  console.log('[ALERTS-CHECK] Iniciando verificação de alertas...');

  // Buscar configurações de alertas do usuário
  const { data: alertConfig } = await supabase
    .from('alert_configs')
    .select('*')
    .eq('user_id', config.user_id)
    .single();

  if (!alertConfig) {
    console.log('[ALERTS-CHECK] Nenhuma configuração de alerta encontrada');
    return { alerts_created: 0, emails_sent: 0 };
  }

  // Buscar dados do usuário para email
  const { data: user } = await supabase.auth.admin.getUserById(config.user_id);
  const userEmail = user?.user?.email || alertConfig.email;
  const userName = user?.user?.user_metadata?.name;

  // Buscar scores recentes
  const { data: recentScores } = await supabase
    .from('geo_scores')
    .select('*, brands(*)')
    .eq('brands.user_id', config.user_id)
    .order('computed_at', { ascending: false })
    .limit(10);

  let alertsCreated = 0;
  let emailsSent = 0;

  for (const score of recentScores || []) {
    // Verificar se já existe alerta recente para evitar duplicatas
    const { data: existingAlert } = await supabase
      .from('alerts_history')
      .select('id')
      .eq('brand_id', score.brand_id)
      .eq('user_id', config.user_id)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // última hora
      .limit(1);

    if (existingAlert && existingAlert.length > 0) {
      console.log(`[ALERTS-CHECK] Alerta recente já existe para marca ${score.brands.name}`);
      continue;
    }

    // Buscar score anterior
    const { data: previousScore } = await supabase
      .from('geo_scores')
      .select('score')
      .eq('brand_id', score.brand_id)
      .lt('computed_at', score.computed_at)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    if (!previousScore) continue;

    const scoreDifference = score.score - previousScore.score;
    const threshold = alertConfig.threshold_value || 10;

    // Verificar queda no score
    if (alertConfig.score_decrease && scoreDifference <= -threshold) {
      console.log(`[ALERTS-CHECK] Queda detectada: ${score.brands.name} (${scoreDifference.toFixed(1)} pontos)`);

      // Criar registro de alerta
      await supabase.from('alerts_history').insert({
        user_id: config.user_id,
        brand_id: score.brand_id,
        alert_type: 'score_decrease',
        title: 'Queda de Score Detectada',
        message: `O score GEO de ${score.brands.name} caiu ${Math.abs(scoreDifference).toFixed(1)} pontos`,
        priority: Math.abs(scoreDifference) >= 20 ? 'critical' : 'high',
        metadata: {
          previous_score: previousScore.score,
          current_score: score.score,
          difference: scoreDifference,
        },
      });
      alertsCreated++;

      // Enviar email de notificação
      try {
        const { error: emailError } = await supabase.functions.invoke('send-alert-notification', {
          body: {
            userEmail,
            userName,
            alertType: 'score_decrease',
            brandName: score.brands.name,
            currentScore: score.score,
            previousScore: previousScore.score,
            scoreDifference,
            priority: Math.abs(scoreDifference) >= 20 ? 'critical' : 'high',
            message: `O score GEO de ${score.brands.name} caiu ${Math.abs(scoreDifference).toFixed(1)} pontos. Recomendamos revisar as estratégias de otimização.`,
            metadata: {
              'Data da Queda': new Date(score.computed_at).toLocaleString('pt-BR'),
              'Score Anterior': previousScore.score.toFixed(1),
              'Score Atual': score.score.toFixed(1),
              'Variação Percentual': `${((scoreDifference / previousScore.score) * 100).toFixed(1)}%`
            }
          }
        });

        if (!emailError) {
          emailsSent++;
          console.log(`[ALERTS-CHECK] Email de queda enviado para ${userEmail}`);
        } else {
          console.error('[ALERTS-CHECK] Erro ao enviar email:', emailError);
        }
      } catch (emailError) {
        console.error('[ALERTS-CHECK] Falha ao invocar send-alert-notification:', emailError);
      }
    }

    // Verificar aumento no score
    if (alertConfig.score_increase && scoreDifference >= threshold) {
      console.log(`[ALERTS-CHECK] Aumento detectado: ${score.brands.name} (+${scoreDifference.toFixed(1)} pontos)`);

      // Criar registro de alerta
      await supabase.from('alerts_history').insert({
        user_id: config.user_id,
        brand_id: score.brand_id,
        alert_type: 'score_increase',
        title: 'Aumento de Score Detectado',
        message: `O score GEO de ${score.brands.name} aumentou ${scoreDifference.toFixed(1)} pontos`,
        priority: scoreDifference >= 20 ? 'high' : 'medium',
        metadata: {
          previous_score: previousScore.score,
          current_score: score.score,
          difference: scoreDifference,
        },
      });
      alertsCreated++;

      // Enviar email de notificação
      try {
        const { error: emailError } = await supabase.functions.invoke('send-alert-notification', {
          body: {
            userEmail,
            userName,
            alertType: 'score_increase',
            brandName: score.brands.name,
            currentScore: score.score,
            previousScore: previousScore.score,
            scoreDifference,
            priority: scoreDifference >= 20 ? 'high' : 'medium',
            message: `Excelente! O score GEO de ${score.brands.name} aumentou ${scoreDifference.toFixed(1)} pontos. Continue com as estratégias atuais!`,
            metadata: {
              'Data do Aumento': new Date(score.computed_at).toLocaleString('pt-BR'),
              'Score Anterior': previousScore.score.toFixed(1),
              'Score Atual': score.score.toFixed(1),
              'Variação Percentual': `+${((scoreDifference / previousScore.score) * 100).toFixed(1)}%`
            }
          }
        });

        if (!emailError) {
          emailsSent++;
          console.log(`[ALERTS-CHECK] Email de aumento enviado para ${userEmail}`);
        } else {
          console.error('[ALERTS-CHECK] Erro ao enviar email:', emailError);
        }
      } catch (emailError) {
        console.error('[ALERTS-CHECK] Falha ao invocar send-alert-notification:', emailError);
      }
    }
  }

  console.log(`[ALERTS-CHECK] Concluído: ${alertsCreated} alertas criados, ${emailsSent} emails enviados`);
  return { alerts_created: alertsCreated, emails_sent: emailsSent };
}

// Helper para calcular próxima execução
function calculateNextRun(frequency: string, scheduleTime?: string): Date {
  const now = new Date();
  const next = new Date();

  if (scheduleTime) {
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    next.setHours(hours, minutes, 0, 0);
  }

  switch (frequency) {
    case 'hourly':
      next.setHours(next.getHours() + 1);
      break;
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}