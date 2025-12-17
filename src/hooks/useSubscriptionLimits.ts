import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { logger } from "@/utils/logger";

export interface PlanLimits {
  name: string;
  maxBrands: number;
  maxAnalysesPerMonth: number;
  hasAI: boolean;
  hasAPI: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  "prod_TaYIyO9s7b04U1": {
    name: "Básico",
    maxBrands: 2,
    maxAnalysesPerMonth: 100,
    hasAI: false,
    hasAPI: false,
  },
  "prod_TaYIG3Xcysq7zC": {
    name: "Profissional",
    maxBrands: 5,
    maxAnalysesPerMonth: 300,
    hasAI: true,
    hasAPI: false,
  },
  "prod_TaYIMTXlNTLZwc": {
    name: "Agência",
    maxBrands: 50,
    maxAnalysesPerMonth: 1000,
    hasAI: true,
    hasAPI: true,
  },
  "prod_TaYJVPctHiC4XA": {
    name: "Enterprise",
    maxBrands: -1, // unlimited
    maxAnalysesPerMonth: -1, // unlimited
    hasAI: true,
    hasAPI: true,
  },
};

const ADMIN_LIMITS: PlanLimits = {
  name: "Desenvolvedor (Admin)",
  maxBrands: -1, // unlimited
  maxAnalysesPerMonth: -1, // unlimited
  hasAI: true,
  hasAPI: true,
};

const FREE_LIMITS: PlanLimits = {
  name: "FREE (Trial 7 dias)",
  maxBrands: 3,
  maxAnalysesPerMonth: 10,
  hasAI: false,
  hasAPI: false,
};

export function useSubscriptionLimits() {
  const { subscription, user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        logger.error('Erro ao verificar status admin', { error, userId: user.id });
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    };

    checkAdminStatus();
  }, [user]);

  const currentLimits = isAdmin
    ? ADMIN_LIMITS
    : subscription?.subscribed && subscription.product_id
    ? PLAN_LIMITS[subscription.product_id] || FREE_LIMITS
    : FREE_LIMITS;

  const planName = currentLimits.name;

  // Count current brands
  const { data: brandsCount = 0 } = useQuery({
    queryKey: ["brands-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("brands")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Count analyses this month
  const { data: analysesCount = 0 } = useQuery({
    queryKey: ["analyses-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from("url_analysis_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const checkLimit = useCallback(async (type: 'brands' | 'analyses'): Promise<boolean> => {
    if (!user) return false;
    
    // Admins have unlimited access
    if (isAdmin) return true;
    
    const limit = type === 'brands' ? currentLimits.maxBrands : currentLimits.maxAnalysesPerMonth;
    const current = type === 'brands' ? brandsCount : analysesCount;
    
    if (current >= limit) {
      toast({
        title: "Limite atingido",
        description: `Você atingiu o limite de ${limit} ${type === 'brands' ? 'marcas' : 'análises mensais'} do plano ${planName}. Faça upgrade em /subscription`,
        variant: "destructive",
      });
      
      // Send warning email in background
      supabase.functions.invoke('send-limit-warning', {
        body: {
          userEmail: user.email!,
          limitType: type,
          currentUsage: current,
          limit,
          planName
        }
        }).catch(err => logger.error('Falha ao enviar email de limite', { error: err }));
      
      return false;
    }
    
    // Send warning at 80% and 90%
    const percentage = (current / limit) * 100;
    if (percentage >= 80 && percentage < 100) {
      const shouldWarn = percentage >= 90 || current === Math.floor(limit * 0.8);
      
      if (shouldWarn) {
        supabase.functions.invoke('send-limit-warning', {
          body: {
            userEmail: user.email!,
            limitType: type,
            currentUsage: current,
            limit,
            planName
          }
        }).catch(err => logger.error('Falha ao enviar email de limite', { error: err }));
      }
    }
    
    return true;
  }, [user, currentLimits, brandsCount, analysesCount, planName, toast, isAdmin]);

  // Admin tem acesso ilimitado (-1), ou verifica o limite
  const canAddBrand = isAdmin || currentLimits.maxBrands === -1 || brandsCount < currentLimits.maxBrands;
  const canAnalyze = isAdmin || currentLimits.maxAnalysesPerMonth === -1 || analysesCount < currentLimits.maxAnalysesPerMonth;

  const brandsUsagePercent = currentLimits.maxBrands === -1 ? 0 : (brandsCount / currentLimits.maxBrands) * 100;
  const analysesUsagePercent = currentLimits.maxAnalysesPerMonth === -1 ? 0 : (analysesCount / currentLimits.maxAnalysesPerMonth) * 100;

  return {
    limits: currentLimits,
    usage: {
      brands: brandsCount,
      analyses: analysesCount,
    },
    canAddBrand,
    canAnalyze,
    brandsUsagePercent,
    analysesUsagePercent,
    isSubscribed: subscription?.subscribed || false,
    checkLimit,
    planName,
    isAdmin,
  };
}