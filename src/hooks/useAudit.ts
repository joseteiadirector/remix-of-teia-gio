import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuditSystem, type AuditResult } from '@/utils/auditSystem';
import { generateAuditPDF, type AuditData } from '@/utils/auditReportGenerator';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface UseAuditOptions {
  brandId?: string;
  onSuccess?: (result: AuditResult) => void;
  onError?: (error: Error) => void;
  autoGeneratePDF?: boolean;
}

/**
 * Hook centralizado para auditoria de métricas
 * Garante consistência matemática em toda a plataforma
 */
export function useAudit(options: UseAuditOptions = {}) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAuditResult, setLastAuditResult] = useState<AuditResult | null>(null);
  const { toast } = useToast();

  const executeAudit = async (brandId: string, brandName?: string) => {
    if (!brandId) {
      toast({
        title: "Erro",
        description: "Por favor selecione uma marca primeiro",
        variant: "destructive"
      });
      return null;
    }

    setIsAuditing(true);
    try {
      // Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Executar auditoria
      const auditResult = await AuditSystem.executeAudit(brandId, user.id);
      
      if (!auditResult.success) {
        throw new Error(auditResult.message);
      }

      setLastAuditResult(auditResult);

      // Gerar PDF se solicitado
      if (options.autoGeneratePDF && brandName) {
        const monthlyPillars = await AuditSystem.getMonthlyPillars(brandId);
        
        const auditData: AuditData = {
          brand_name: brandName,
          audit_date: new Date().toISOString(),
          validation_results: auditResult.validation_results,
          inconsistencies_found: auditResult.inconsistencies_found,
          max_divergence_percentage: auditResult.max_divergence_percentage,
          monthly_pillars: monthlyPillars
        };

        generateAuditPDF(auditData);
      }

      // Mostrar toast baseado no status
      const toastVariant = auditResult.status === 'critical' ? 'destructive' : 'default';
      
      toast({
        title: "Auditoria Completa",
        description: auditResult.message,
        variant: toastVariant
      });

      options.onSuccess?.(auditResult);
      return auditResult;

    } catch (error) {
      logger.error('Erro na execução de auditoria', { error, brandId: options.brandId });
      
      toast({
        title: "Erro na Auditoria",
        description: error instanceof Error ? error.message : "Erro durante o processo de auditoria",
        variant: "destructive"
      });

      options.onError?.(error instanceof Error ? error : new Error('Unknown error'));
      return null;

    } finally {
      setIsAuditing(false);
    }
  };

  return {
    executeAudit,
    isAuditing,
    lastAuditResult,
    isAcceptable: lastAuditResult ? AuditSystem.isAuditAcceptable(lastAuditResult) : null
  };
}
