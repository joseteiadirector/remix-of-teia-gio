/**
 * Alert Classification System using Decision Tree
 * Integrates with existing alert infrastructure
 */

import { classifyAlertSeverity, getClassificationReason, type AlertMetrics, type AlertSeverity } from './decisionTree';
import type { Database } from '@/integrations/supabase/types';

type Alert = Database['public']['Tables']['alerts_history']['Row'];
type GeoScore = Database['public']['Tables']['geo_scores']['Row'];

interface ClassifiedAlert {
  alert: Alert;
  severity: AlertSeverity;
  reason: string;
  shouldNotify: boolean;
}

/**
 * Calculate metrics from alert and historical data
 */
export function calculateAlertMetrics(
  alert: Alert,
  recentScores: GeoScore[],
  previousAlerts: Alert[]
): AlertMetrics {
  // Get current and previous scores
  const currentScore = recentScores[0]?.score ?? 50;
  const previousScore = recentScores[1]?.score ?? currentScore;
  
  // Calculate trend (change in score)
  const trend = currentScore - previousScore;
  
  // Calculate frequency (occurrences in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const frequency = previousAlerts.filter(a => 
    new Date(a.created_at) >= thirtyDaysAgo
  ).length;
  
  // Calculate velocity (rate of change)
  const daysDiff = recentScores.length > 1 
    ? Math.max(1, Math.abs(
        (new Date(recentScores[0].computed_at).getTime() - 
         new Date(recentScores[1].computed_at).getTime()) / (1000 * 60 * 60 * 24)
      ))
    : 1;
  
  const velocity = trend / daysDiff;
  
  // Calculate duration (days since first similar alert)
  const firstAlert = previousAlerts[previousAlerts.length - 1];
  const duration = firstAlert
    ? Math.max(1, (Date.now() - new Date(firstAlert.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  return {
    score: currentScore,
    trend,
    frequency,
    velocity,
    duration
  };
}

/**
 * Classify single alert using Decision Tree
 */
export function classifyAlert(
  alert: Alert,
  recentScores: GeoScore[],
  previousAlerts: Alert[]
): ClassifiedAlert {
  const metrics = calculateAlertMetrics(alert, recentScores, previousAlerts);
  const severity = classifyAlertSeverity(metrics);
  const reason = getClassificationReason(metrics, severity);
  
  // Determine if notification should be sent
  const shouldNotify = shouldSendNotification(severity, alert, previousAlerts);
  
  return {
    alert,
    severity,
    reason,
    shouldNotify
  };
}

/**
 * Determine if notification should be sent based on severity and history
 */
function shouldSendNotification(
  severity: AlertSeverity,
  currentAlert: Alert,
  previousAlerts: Alert[]
): boolean {
  // Always notify for critical alerts
  if (severity === 'critical') return true;
  
  // Check if we already sent a notification recently for this severity
  const recentNotifications = previousAlerts.filter(a => {
    const hoursSince = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60);
    return hoursSince < 24; // Within last 24 hours
  });
  
  // Notification thresholds by severity
  const thresholds: Record<string, number> = {
    high: 1,      // Max 1 notification per 24h
    medium: 0.5,  // Max 1 notification per 12h
    low: 0.25     // Max 1 notification per 6h
  };
  
  const threshold = thresholds[severity] ?? 1;
  
  return recentNotifications.length < threshold;
}

/**
 * Batch classify alerts with intelligent filtering
 */
export function classifyAndFilterAlerts(
  alerts: Alert[],
  scoresByBrand: Map<string, GeoScore[]>,
  alertHistoryByBrand: Map<string, Alert[]>
): ClassifiedAlert[] {
  return alerts
    .map(alert => {
      const brandId = alert.brand_id;
      const recentScores = scoresByBrand.get(brandId) ?? [];
      const previousAlerts = alertHistoryByBrand.get(brandId) ?? [];
      
      return classifyAlert(alert, recentScores, previousAlerts);
    })
    .sort((a, b) => {
      // Sort by severity priority (critical first)
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] - severityOrder[a.severity]);
    });
}

/**
 * Get alert statistics for monitoring
 */
export function getAlertStatistics(classifiedAlerts: ClassifiedAlert[]): {
  total: number;
  bySeverity: Record<AlertSeverity, number>;
  notificationsPending: number;
  averageScore: number;
} {
  const bySeverity = classifiedAlerts.reduce((acc, { severity }) => {
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<AlertSeverity, number>);

  const notificationsPending = classifiedAlerts.filter(a => a.shouldNotify).length;
  
  const averageScore = classifiedAlerts.length > 0
    ? classifiedAlerts.reduce((sum, a) => {
        const score = (a.alert.metadata as any)?.score;
        return sum + (typeof score === 'number' ? score : 50);
      }, 0) / classifiedAlerts.length
    : 0;

  return {
    total: classifiedAlerts.length,
    bySeverity,
    notificationsPending,
    averageScore
  };
}

/**
 * Format alert for notification
 */
export function formatAlertNotification(classified: ClassifiedAlert): {
  title: string;
  message: string;
  priority: number;
} {
  const { alert, severity, reason } = classified;
  const brandName = (alert.metadata as any)?.brand_name ?? 'Marca';
  
  const titles = {
    critical: `🚨 CRÍTICO: ${brandName}`,
    high: `⚠️ ALERTA: ${brandName}`,
    medium: `📊 Atenção: ${brandName}`,
    low: `ℹ️ Info: ${brandName}`
  };
  
  return {
    title: titles[severity],
    message: reason,
    priority: { critical: 4, high: 3, medium: 2, low: 1 }[severity]
  };
}
