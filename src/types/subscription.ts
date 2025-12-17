/**
 * Subscription and billing types
 */

export type PlanType = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'trialing' | 'past_due';

export interface PlanLimits {
  brands: number;
  analyses_per_month: number;
  api_calls_per_month: number;
  reports_per_month: number;
  insights_per_month: number;
  team_members: number;
  data_retention_days: number;
  support_level: 'basic' | 'priority' | 'dedicated';
  features: string[];
}

export interface PlanFeatures {
  name: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  limits: PlanLimits;
  popular?: boolean;
  recommended?: boolean;
}

export interface UsageData {
  brands_used: number;
  analyses_used: number;
  api_calls_used: number;
  reports_used: number;
  insights_used: number;
  reset_date: string;
}

export interface TierData {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  stripePriceId?: string;
}
