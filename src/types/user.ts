/**
 * User and authentication types
 */

import { BaseEntity } from './common';

export interface User extends BaseEntity {
  email: string;
  name?: string;
  avatar_url?: string;
  role?: UserRole;
}

export type UserRole = 'admin' | 'user' | 'viewer';

export interface Profile extends BaseEntity {
  user_id: string;
  full_name?: string;
  company?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  notifications_enabled?: boolean;
}

export interface AuthContextType {
  user: any;
  loading: boolean;
  subscription: SubscriptionData | null;
  checkSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export interface SubscriptionData {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'canceled' | 'trialing';
  current_period_end?: string;
  stripe_customer_id?: string;
}
