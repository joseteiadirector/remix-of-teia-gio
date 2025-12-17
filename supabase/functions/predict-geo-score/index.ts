import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  correlation: number;
}

interface Prediction {
  date: string;
  value: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

function calculateLinearRegression(data: Array<{ timestamp: string; value: number }>): RegressionResult {
  if (data.length < 2) {
    throw new Error('Insufficient data for regression analysis');
  }

  const baseTime = new Date(data[0].timestamp).getTime();
  const points = data.map(d => ({
    x: (new Date(d.timestamp).getTime() - baseTime) / (1000 * 60 * 60 * 24),
    y: d.value
  }));

  const n = points.length;
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;

  let numerator = 0;
  let denominator = 0;
  
  for (const point of points) {
    numerator += (point.x - meanX) * (point.y - meanY);
    denominator += Math.pow(point.x - meanX, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  const predictions = points.map(p => slope * p.x + intercept);
  const ssRes = points.reduce((sum, p, i) => sum + Math.pow(p.y - predictions[i], 2), 0);
  const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

  const correlation = Math.sqrt(Math.abs(rSquared)) * Math.sign(slope);

  return { slope, intercept, rSquared, correlation };
}

function calculateConfidenceInterval(
  data: Array<{ timestamp: string; value: number }>,
  regression: RegressionResult,
  predictionX: number
): { lower: number; upper: number } {
  const baseTime = new Date(data[0].timestamp).getTime();
  const points = data.map(d => ({
    x: (new Date(d.timestamp).getTime() - baseTime) / (1000 * 60 * 60 * 24),
    y: d.value
  }));

  const n = points.length;
  const predictions = points.map(p => regression.slope * p.x + regression.intercept);
  const residuals = points.map((p, i) => p.y - predictions[i]);
  const sse = residuals.reduce((sum, r) => sum + r * r, 0);
  const mse = sse / (n - 2);
  const standardError = Math.sqrt(mse);

  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const sxx = points.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0);
  
  const predictionStdError = standardError * Math.sqrt(
    1 + (1 / n) + Math.pow(predictionX - meanX, 2) / sxx
  );

  const tValue = n > 30 ? 1.96 : 2.0;
  const predictedValue = regression.slope * predictionX + regression.intercept;
  const margin = tValue * predictionStdError;

  return {
    lower: Math.max(0, predictedValue - margin),
    upper: Math.min(100, predictedValue + margin)
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { brandId, daysAhead = [7, 14, 30] } = await req.json();

    console.log('[PREDICT-GEO-SCORE] Starting prediction', { userId: user.id, brandId });

    // Get historical GEO scores (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: geoScores, error: geoError } = await supabase
      .from('geo_scores')
      .select('score, calculated_at')
      .eq('brand_id', brandId)
      .gte('calculated_at', ninetyDaysAgo.toISOString())
      .order('calculated_at', { ascending: true });

    if (geoError) {
      console.error('[PREDICT-GEO-SCORE] Error fetching GEO scores:', geoError);
      throw geoError;
    }

    if (!geoScores || geoScores.length < 7) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient historical data',
          message: 'At least 7 days of data required for predictions'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare data for regression
    const data = geoScores.map(s => ({
      timestamp: s.calculated_at,
      value: s.score
    }));

    console.log('[PREDICT-GEO-SCORE] Data points:', data.length);

    // Calculate regression
    const regression = calculateLinearRegression(data);
    console.log('[PREDICT-GEO-SCORE] Regression:', regression);

    // Generate predictions
    const baseTime = new Date(data[0].timestamp).getTime();
    const lastTimestamp = new Date(data[data.length - 1].timestamp).getTime();
    const daysSinceStart = (lastTimestamp - baseTime) / (1000 * 60 * 60 * 24);

    const predictions: Prediction[] = daysAhead.map((days: number) => {
      const predictionX = daysSinceStart + days;
      const predictedValue = regression.slope * predictionX + regression.intercept;
      const confidenceInterval = calculateConfidenceInterval(data, regression, predictionX);
      
      const futureDate = new Date(lastTimestamp + days * 24 * 60 * 60 * 1000);

      return {
        date: futureDate.toISOString(),
        value: Math.max(0, Math.min(100, predictedValue)),
        confidenceInterval
      };
    });

    // Determine trend
    let currentTrend: 'crescente' | 'decrescente' | 'estável';
    if (Math.abs(regression.slope) < 0.1) {
      currentTrend = 'estável';
    } else if (regression.slope > 0) {
      currentTrend = 'crescente';
    } else {
      currentTrend = 'decrescente';
    }

    const confidence = Math.round(regression.rSquared * 100);

    // Detect anomalies in recent data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentData = data.filter(d => new Date(d.timestamp) >= thirtyDaysAgo);
    const recentRegression = calculateLinearRegression(recentData);
    
    const anomalies = recentData.map((d, i) => {
      const x = (new Date(d.timestamp).getTime() - new Date(recentData[0].timestamp).getTime()) / (1000 * 60 * 60 * 24);
      const predicted = recentRegression.slope * x + recentRegression.intercept;
      const residual = d.value - predicted;
      return { ...d, residual, predicted };
    });

    const residuals = anomalies.map(a => a.residual);
    const meanResidual = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
    const stdDev = Math.sqrt(
      residuals.reduce((sum, r) => sum + Math.pow(r - meanResidual, 2), 0) / residuals.length
    );

    const threshold = 2 * stdDev;
    const detectedAnomalies = anomalies.filter(a => Math.abs(a.residual) > threshold);

    console.log('[PREDICT-GEO-SCORE] Predictions generated:', predictions.length);
    console.log('[PREDICT-GEO-SCORE] Anomalies detected:', detectedAnomalies.length);

    return new Response(
      JSON.stringify({
        regression: {
          slope: regression.slope,
          intercept: regression.intercept,
          rSquared: regression.rSquared,
          correlation: regression.correlation
        },
        predictions,
        currentTrend,
        confidence,
        anomalies: detectedAnomalies.length,
        dataPoints: data.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[PREDICT-GEO-SCORE] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
