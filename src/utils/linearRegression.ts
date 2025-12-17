/**
 * Linear Regression utilities for predictive analytics
 */

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  correlation: number;
}

export interface Prediction {
  date: string;
  value: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface PredictionResult {
  regression: RegressionResult;
  predictions: Prediction[];
  currentTrend: 'crescente' | 'decrescente' | 'estável';
  confidence: number;
}

/**
 * Calculate linear regression for time series data
 */
export function calculateLinearRegression(
  data: Array<{ timestamp: string; value: number }>
): RegressionResult {
  if (data.length < 2) {
    throw new Error('Insufficient data for regression analysis');
  }

  // Convert timestamps to days since first data point
  const baseTime = new Date(data[0].timestamp).getTime();
  const points = data.map(d => ({
    x: (new Date(d.timestamp).getTime() - baseTime) / (1000 * 60 * 60 * 24),
    y: d.value
  }));

  const n = points.length;
  
  // Calculate means
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;

  // Calculate slope (m) and intercept (b) for y = mx + b
  let numerator = 0;
  let denominator = 0;
  
  for (const point of points) {
    numerator += (point.x - meanX) * (point.y - meanY);
    denominator += Math.pow(point.x - meanX, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  // Calculate R² (coefficient of determination)
  const predictions = points.map(p => slope * p.x + intercept);
  const ssRes = points.reduce((sum, p, i) => sum + Math.pow(p.y - predictions[i], 2), 0);
  const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

  // Calculate correlation coefficient
  const correlation = Math.sqrt(Math.abs(rSquared)) * Math.sign(slope);

  return {
    slope,
    intercept,
    rSquared,
    correlation
  };
}

/**
 * Calculate confidence interval for predictions
 */
export function calculateConfidenceInterval(
  data: Array<{ timestamp: string; value: number }>,
  regression: RegressionResult,
  predictionX: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  const baseTime = new Date(data[0].timestamp).getTime();
  const points = data.map(d => ({
    x: (new Date(d.timestamp).getTime() - baseTime) / (1000 * 60 * 60 * 24),
    y: d.value
  }));

  const n = points.length;
  
  // Calculate residual standard error
  const predictions = points.map(p => regression.slope * p.x + regression.intercept);
  const residuals = points.map((p, i) => p.y - predictions[i]);
  const sse = residuals.reduce((sum, r) => sum + r * r, 0);
  const mse = sse / (n - 2); // degrees of freedom = n - 2 for linear regression
  const standardError = Math.sqrt(mse);

  // Calculate standard error of prediction
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const sxx = points.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0);
  
  const predictionStdError = standardError * Math.sqrt(
    1 + (1 / n) + Math.pow(predictionX - meanX, 2) / sxx
  );

  // t-value for 95% confidence (approximation using z-score for large n)
  const tValue = n > 30 ? 1.96 : 2.0; // Conservative estimate
  
  const predictedValue = regression.slope * predictionX + regression.intercept;
  const margin = tValue * predictionStdError;

  return {
    lower: Math.max(0, predictedValue - margin), // Scores can't be negative
    upper: Math.min(100, predictedValue + margin) // Max score is 100
  };
}

/**
 * Generate predictions for future dates
 */
export function generatePredictions(
  data: Array<{ timestamp: string; value: number }>,
  daysAhead: number[]
): PredictionResult {
  const regression = calculateLinearRegression(data);
  
  const baseTime = new Date(data[0].timestamp).getTime();
  const lastTimestamp = new Date(data[data.length - 1].timestamp).getTime();
  const daysSinceStart = (lastTimestamp - baseTime) / (1000 * 60 * 60 * 24);

  const predictions: Prediction[] = daysAhead.map(days => {
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

  // Calculate confidence (based on R²)
  const confidence = Math.round(regression.rSquared * 100);

  return {
    regression,
    predictions,
    currentTrend,
    confidence
  };
}

/**
 * Detect anomalies in time series data
 */
export function detectAnomalies(
  data: Array<{ timestamp: string; value: number }>,
  standardDeviations: number = 2
): Array<{ timestamp: string; value: number; isAnomaly: boolean }> {
  const regression = calculateLinearRegression(data);
  const baseTime = new Date(data[0].timestamp).getTime();

  const predictions = data.map(d => {
    const x = (new Date(d.timestamp).getTime() - baseTime) / (1000 * 60 * 60 * 24);
    return regression.slope * x + regression.intercept;
  });

  const residuals = data.map((d, i) => d.value - predictions[i]);
  const meanResidual = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
  const stdDev = Math.sqrt(
    residuals.reduce((sum, r) => sum + Math.pow(r - meanResidual, 2), 0) / residuals.length
  );

  const threshold = standardDeviations * stdDev;

  return data.map((d, i) => ({
    ...d,
    isAnomaly: Math.abs(residuals[i]) > threshold
  }));
}
