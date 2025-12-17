/**
 * Decision Tree Algorithm for Alert Classification
 * Classifies alert severity based on multiple metrics
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertMetrics {
  score: number;           // GEO score (0-100)
  trend: number;           // Score variation (-100 to +100)
  frequency: number;       // Number of occurrences in period
  velocity: number;        // Rate of change (points per day)
  duration: number;        // Days since first occurrence
  previousSeverity?: AlertSeverity;
}

export interface DecisionNode {
  feature: keyof AlertMetrics;
  threshold: number;
  leftChild?: DecisionNode | AlertSeverity;
  rightChild?: DecisionNode | AlertSeverity;
}

/**
 * Pre-trained Decision Tree for Alert Classification
 * Features used: score, trend, frequency, velocity, duration
 */
const ALERT_DECISION_TREE: DecisionNode = {
  feature: 'score',
  threshold: 30,
  leftChild: {
    // score <= 30 (very low score)
    feature: 'trend',
    threshold: -10,
    leftChild: {
      // trend <= -10 (declining fast)
      feature: 'velocity',
      threshold: -5,
      leftChild: 'critical',  // score low + declining fast
      rightChild: 'high'
    },
    rightChild: {
      // trend > -10 (stable or improving)
      feature: 'frequency',
      threshold: 5,
      leftChild: 'medium',
      rightChild: 'high'     // low score + frequent occurrences
    }
  },
  rightChild: {
    // score > 30
    feature: 'score',
    threshold: 60,
    leftChild: {
      // 30 < score <= 60 (medium score)
      feature: 'trend',
      threshold: -15,
      leftChild: {
        // trend <= -15 (significant decline)
        feature: 'velocity',
        threshold: -8,
        leftChild: 'high',   // medium score + rapid decline
        rightChild: 'medium'
      },
      rightChild: {
        // trend > -15 (minor decline or stable)
        feature: 'frequency',
        threshold: 10,
        leftChild: 'low',
        rightChild: 'medium'
      }
    },
    rightChild: {
      // score > 60 (high score)
      feature: 'trend',
      threshold: -20,
      leftChild: {
        // trend <= -20 (major decline)
        feature: 'frequency',
        threshold: 7,
        leftChild: 'medium',
        rightChild: 'high'   // good score but declining frequently
      },
      rightChild: {
        // trend > -20 (stable or improving)
        feature: 'duration',
        threshold: 7,
        leftChild: 'low',    // recent issue, monitoring
        rightChild: 'medium' // persistent but not critical
      }
    }
  }
};

/**
 * Traverse decision tree to classify alert severity
 */
function traverseTree(node: DecisionNode | AlertSeverity, metrics: AlertMetrics): AlertSeverity {
  // Leaf node - return severity
  if (typeof node === 'string') {
    return node;
  }

  const value = Number(metrics[node.feature] ?? 0);
  
  // Navigate tree based on threshold
  if (value <= node.threshold) {
    return traverseTree(node.leftChild!, metrics);
  } else {
    return traverseTree(node.rightChild!, metrics);
  }
}

/**
 * Calculate velocity (rate of change in score)
 */
function calculateVelocity(currentScore: number, previousScore: number, daysDiff: number): number {
  if (daysDiff === 0) return 0;
  return (currentScore - previousScore) / daysDiff;
}

/**
 * Classify alert severity using Decision Tree
 */
export function classifyAlertSeverity(metrics: AlertMetrics): AlertSeverity {
  // Validate metrics
  const validatedMetrics: AlertMetrics = {
    score: Math.max(0, Math.min(100, metrics.score)),
    trend: Math.max(-100, Math.min(100, metrics.trend)),
    frequency: Math.max(0, metrics.frequency),
    velocity: metrics.velocity,
    duration: Math.max(0, metrics.duration)
  };

  return traverseTree(ALERT_DECISION_TREE, validatedMetrics);
}

/**
 * Get human-readable explanation for classification
 */
export function getClassificationReason(metrics: AlertMetrics, severity: AlertSeverity): string {
  const { score, trend, frequency, velocity } = metrics;

  if (severity === 'critical') {
    return `Score crítico (${score.toFixed(1)}) com declínio rápido (${trend.toFixed(1)} pontos, velocidade ${velocity.toFixed(2)}/dia)`;
  }

  if (severity === 'high') {
    if (score <= 30) {
      return `Score baixo (${score.toFixed(1)}) com ${frequency} ocorrências frequentes`;
    }
    if (trend <= -15) {
      return `Declínio significativo (${trend.toFixed(1)} pontos) com velocidade ${velocity.toFixed(2)}/dia`;
    }
    return `Score em risco (${score.toFixed(1)}) com tendência negativa (${trend.toFixed(1)})`;
  }

  if (severity === 'medium') {
    if (score > 60 && trend <= -20) {
      return `Score bom (${score.toFixed(1)}) mas com declínio preocupante (${trend.toFixed(1)} pontos)`;
    }
    if (frequency > 10) {
      return `${frequency} ocorrências frequentes requerem atenção`;
    }
    return `Score moderado (${score.toFixed(1)}) com tendência ${trend > 0 ? 'positiva' : 'negativa'} (${trend.toFixed(1)})`;
  }

  // low
  if (score > 60) {
    return `Score saudável (${score.toFixed(1)}) com tendência estável`;
  }
  return `Situação sob monitoramento, score ${score.toFixed(1)}`;
}

/**
 * Batch classify multiple alerts
 */
export function classifyAlerts(alertsMetrics: AlertMetrics[]): Array<{
  metrics: AlertMetrics;
  severity: AlertSeverity;
  reason: string;
}> {
  return alertsMetrics.map(metrics => {
    const severity = classifyAlertSeverity(metrics);
    const reason = getClassificationReason(metrics, severity);
    return { metrics, severity, reason };
  });
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: AlertSeverity): string {
  const colors = {
    low: 'text-blue-600 bg-blue-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50'
  };
  return colors[severity];
}

/**
 * Get severity priority (for sorting)
 */
export function getSeverityPriority(severity: AlertSeverity): number {
  const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
  return priorities[severity];
}
