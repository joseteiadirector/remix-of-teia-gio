import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decision Tree implementation (same as client-side)
type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

interface AlertMetrics {
  score: number;
  trend: number;
  frequency: number;
  velocity: number;
  duration: number;
}

interface DecisionNode {
  feature: keyof AlertMetrics;
  threshold: number;
  leftChild?: DecisionNode | AlertSeverity;
  rightChild?: DecisionNode | AlertSeverity;
}

const ALERT_DECISION_TREE: DecisionNode = {
  feature: 'score',
  threshold: 30,
  leftChild: {
    feature: 'trend',
    threshold: -10,
    leftChild: {
      feature: 'velocity',
      threshold: -5,
      leftChild: 'critical',
      rightChild: 'high'
    },
    rightChild: {
      feature: 'frequency',
      threshold: 5,
      leftChild: 'medium',
      rightChild: 'high'
    }
  },
  rightChild: {
    feature: 'score',
    threshold: 60,
    leftChild: {
      feature: 'trend',
      threshold: -15,
      leftChild: {
        feature: 'velocity',
        threshold: -8,
        leftChild: 'high',
        rightChild: 'medium'
      },
      rightChild: {
        feature: 'frequency',
        threshold: 10,
        leftChild: 'low',
        rightChild: 'medium'
      }
    },
    rightChild: {
      feature: 'trend',
      threshold: -20,
      leftChild: {
        feature: 'frequency',
        threshold: 7,
        leftChild: 'medium',
        rightChild: 'high'
      },
      rightChild: {
        feature: 'duration',
        threshold: 7,
        leftChild: 'low',
        rightChild: 'medium'
      }
    }
  }
};

function traverseTree(node: DecisionNode | AlertSeverity, metrics: AlertMetrics): AlertSeverity {
  if (typeof node === 'string') return node;
  const value = metrics[node.feature] ?? 0;
  return value <= node.threshold 
    ? traverseTree(node.leftChild!, metrics)
    : traverseTree(node.rightChild!, metrics);
}

function classifyAlertSeverity(metrics: AlertMetrics): AlertSeverity {
  return traverseTree(ALERT_DECISION_TREE, {
    score: Math.max(0, Math.min(100, metrics.score)),
    trend: Math.max(-100, Math.min(100, metrics.trend)),
    frequency: Math.max(0, metrics.frequency),
    velocity: metrics.velocity,
    duration: Math.max(0, metrics.duration)
  });
}

function getClassificationReason(metrics: AlertMetrics, severity: AlertSeverity): string {
  const { score, trend, frequency, velocity } = metrics;

  if (severity === 'critical') {
    return `Score crítico (${score.toFixed(1)}) com declínio rápido (${trend.toFixed(1)} pontos, velocidade ${velocity.toFixed(2)}/dia)`;
  }
  if (severity === 'high') {
    if (score <= 30) return `Score baixo (${score.toFixed(1)}) com ${frequency} ocorrências frequentes`;
    if (trend <= -15) return `Declínio significativo (${trend.toFixed(1)} pontos) com velocidade ${velocity.toFixed(2)}/dia`;
    return `Score em risco (${score.toFixed(1)}) com tendência negativa (${trend.toFixed(1)})`;
  }
  if (severity === 'medium') {
    if (score > 60 && trend <= -20) return `Score bom (${score.toFixed(1)}) mas com declínio preocupante (${trend.toFixed(1)} pontos)`;
    if (frequency > 10) return `${frequency} ocorrências frequentes requerem atenção`;
    return `Score moderado (${score.toFixed(1)}) com tendência ${trend > 0 ? 'positiva' : 'negativa'} (${trend.toFixed(1)})`;
  }
  return score > 60 ? `Score saudável (${score.toFixed(1)}) com tendência estável` : `Situação sob monitoramento, score ${score.toFixed(1)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { brandId, limit = 10 } = await req.json();

    console.log(`[classify-alerts] Processing for brand: ${brandId}`);

    // Get recent scores
    const { data: scores, error: scoresError } = await supabaseClient
      .from('geo_scores')
      .select('*')
      .eq('brand_id', brandId)
      .order('computed_at', { ascending: false })
      .limit(10);

    if (scoresError) throw scoresError;

    // Get recent alerts
    const { data: alerts, error: alertsError } = await supabaseClient
      .from('alerts_history')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (alertsError) throw alertsError;

    // Calculate metrics and classify
    const classified = alerts?.map(alert => {
      const currentScore = scores?.[0]?.score ?? 50;
      const previousScore = scores?.[1]?.score ?? currentScore;
      const trend = currentScore - previousScore;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const frequency = alerts.filter(a => new Date(a.created_at) >= thirtyDaysAgo).length;

      const daysDiff = scores && scores.length > 1
        ? Math.max(1, Math.abs((new Date(scores[0].computed_at).getTime() - new Date(scores[1].computed_at).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;

      const velocity = trend / daysDiff;

      const firstAlert = alerts[alerts.length - 1];
      const duration = firstAlert
        ? Math.max(1, (Date.now() - new Date(firstAlert.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 1;

      const metrics: AlertMetrics = { score: currentScore, trend, frequency, velocity, duration };
      const severity = classifyAlertSeverity(metrics);
      const reason = getClassificationReason(metrics, severity);

      return {
        alert,
        severity,
        reason,
        metrics,
        shouldNotify: severity === 'critical' || (severity === 'high' && frequency < 2)
      };
    }) ?? [];

    const stats = {
      total: classified.length,
      bySeverity: classified.reduce((acc, { severity }) => {
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {} as Record<AlertSeverity, number>),
      notificationsPending: classified.filter(a => a.shouldNotify).length
    };

    console.log(`[classify-alerts] Classified ${classified.length} alerts:`, stats);

    return new Response(
      JSON.stringify({ classified, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[classify-alerts] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
