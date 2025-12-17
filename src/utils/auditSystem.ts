import { supabase } from "@/integrations/supabase/client";
import type { ValidationResult } from "@/utils/auditReportGenerator";
import { logger } from "@/utils/logger";

export interface AuditMetric extends ValidationResult {
  name: string;
}

export interface AuditResult {
  success: boolean;
  audit_id?: string;
  validation_results: AuditMetric[];
  inconsistencies_found: number;
  max_divergence_percentage: number;
  status: 'consistent' | 'warning' | 'critical' | 'unknown';
  message: string;
  report_sources?: string[];
  trends?: MonthlyTrendData[];
}

export interface MonthlyTrendData {
  month_year: string;
  geo_score: number;
  base_tecnica: number;
  estrutura_semantica: number;
  relevancia_conversacional: number;
  autoridade_cognitiva: number;
  inteligencia_estrategica: number;
  total_mentions?: number;
  total_queries?: number;
}

export interface MonthlyPillarData {
  month_year: string;
  base_tecnica: number;
  estrutura_semantica: number;
  relevancia_conversacional: number;
  autoridade_cognitiva: number;
  inteligencia_estrategica: number;
  geo_score_final: number;
  total_mentions: number;
  total_queries: number;
}

// Configuração do módulo de auditoria (conforme especificação JSON)
const AUDIT_CONFIG = {
  enabled: true,
  trigger: "on_pdf_generated_or_updated",
  validate_consistency: {
    fields: ["geo_score", "seo_score", "ctr", "conversion_rate", "avg_position"],
    allowed_variance_percent: 5,
    report_sources: [
      "KPIs_PDF",
      "SEO_Metrics_PDF",
      "GEO_Metrics_PDF",
      "Relatorio_GEO_Completo"
    ],
    alert_on_inconsistency: true
  },
  trend_analysis: {
    enabled: true,
    data_window: "monthly",
    metrics: [
      "base_tecnica",
      "estrutura_semantica",
      "relevancia_conversacional",
      "autoridade_cognitiva",
      "inteligencia_estrategica",
      "geo_score"
    ]
  },
  calculation_reference: {
    source_documents: [
      "FORMULAS_PADRONIZADAS.md",
      "CALCULATION_SPEC.md"
    ],
    geo_score_formula: "(BT * 0.20) + (ES * 0.15) + (RC * 0.25) + (AC * 0.25) + (IE * 0.15)"
  }
};

/**
 * Sistema Central de Auditoria
 * Garante consistência matemática em toda a plataforma
 */
export class AuditSystem {
  /**
   * Executa auditoria completa para uma marca com validação avançada
   */
  static async executeAudit(brandId: string, userId: string): Promise<AuditResult> {
    try {
      // Validar configuração
      if (!AUDIT_CONFIG.enabled) {
        throw new Error('Módulo de auditoria está desabilitado');
      }

      // Executar função de auditoria no backend
      const { data: auditResult, error: auditError } = await supabase.functions.invoke('audit-report-data', {
        body: { 
          brandId, 
          userId,
          config: AUDIT_CONFIG
        }
      });

      if (auditError) {
        throw new Error(`Audit function error: ${auditError.message}`);
      }

      if (!auditResult) {
        throw new Error('No audit result returned');
      }

      // Buscar dados de tendências se habilitado
      let trends: MonthlyTrendData[] = [];
      if (AUDIT_CONFIG.trend_analysis.enabled) {
        trends = await this.getMonthlyTrends(brandId);
      }

      // Determinar status geral
      const status = this.determineAuditStatus(
        auditResult.inconsistencies_found || 0,
        auditResult.max_divergence_percentage || 0
      );

      const result: AuditResult = {
        success: true,
        audit_id: auditResult.audit_id,
        validation_results: auditResult.validation_results || [],
        inconsistencies_found: auditResult.inconsistencies_found || 0,
        max_divergence_percentage: auditResult.max_divergence_percentage || 0,
        status,
        message: this.getAuditMessage(
          auditResult.inconsistencies_found || 0,
          auditResult.max_divergence_percentage || 0
        ),
        report_sources: AUDIT_CONFIG.validate_consistency.report_sources,
        trends
      };

      // Alertar em caso de inconsistência (se configurado)
      if (AUDIT_CONFIG.validate_consistency.alert_on_inconsistency && 
          result.inconsistencies_found > 0) {
        logger.warn('Inconsistências detectadas na auditoria', {
          brandId,
          total: result.inconsistencies_found,
          maxDivergence: `${result.max_divergence_percentage}%`
        });
      }

      return result;
    } catch (error) {
      logger.error('Erro na execução da auditoria', { error, brandId });
      return {
        success: false,
        validation_results: [],
        inconsistencies_found: 0,
        max_divergence_percentage: 0,
        status: 'critical',
        message: 'Erro ao executar auditoria'
      };
    }
  }

  /**
   * Busca tendências mensais dos pilares GEO
   */
  static async getMonthlyTrends(brandId: string, limit: number = 12): Promise<MonthlyTrendData[]> {
    try {
      const { data, error } = await supabase
        .from('geo_pillars_monthly')
        .select('*')
        .eq('brand_id', brandId)
        .order('month_year', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        month_year: item.month_year,
        geo_score: item.geo_score_final,
        base_tecnica: item.base_tecnica,
        estrutura_semantica: item.estrutura_semantica,
        relevancia_conversacional: item.relevancia_conversacional,
        autoridade_cognitiva: item.autoridade_cognitiva,
        inteligencia_estrategica: item.inteligencia_estrategica,
        total_mentions: item.total_mentions || 0,
        total_queries: item.total_queries || 0
      }));
    } catch (error) {
      logger.error('Erro ao buscar tendências mensais', { error, brandId });
      return [];
    }
  }

  /**
   * Busca histórico de pilares mensais
   */
  static async getMonthlyPillars(brandId: string, limit: number = 12): Promise<MonthlyPillarData[]> {
    const { data, error } = await supabase
      .from('geo_pillars_monthly')
      .select('*')
      .eq('brand_id', brandId)
      .order('month_year', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Erro ao buscar pilares mensais', { error, brandId });
      return [];
    }

    return data || [];
  }

  /**
   * Determina status da auditoria baseado em divergências
   * Usa a variância permitida configurada (5%)
   */
  private static determineAuditStatus(
    inconsistencies: number,
    maxDivergence: number
  ): 'consistent' | 'warning' | 'critical' {
    const allowedVariance = AUDIT_CONFIG.validate_consistency.allowed_variance_percent;
    
    if (inconsistencies === 0 && maxDivergence < allowedVariance * 0.4) {
      return 'consistent'; // < 2% de divergência
    } else if (inconsistencies <= 2 && maxDivergence <= allowedVariance) {
      return 'warning'; // Entre 2% e 5%
    } else {
      return 'critical'; // > 5% de divergência
    }
  }

  /**
   * Gera mensagem de auditoria baseada no status
   */
  private static getAuditMessage(inconsistencies: number, maxDivergence: number): string {
    const allowedVariance = AUDIT_CONFIG.validate_consistency.allowed_variance_percent;
    
    if (inconsistencies === 0 && maxDivergence < allowedVariance * 0.4) {
      return `✅ Certificação matemática aprovada. Divergência máxima: ${maxDivergence.toFixed(2)}% (limite: ${allowedVariance}%)`;
    } else if (inconsistencies <= 2 && maxDivergence <= allowedVariance) {
      return `⚠️ ${inconsistencies} alerta(s) de atenção. Divergência: ${maxDivergence.toFixed(2)}% (dentro do limite de ${allowedVariance}%)`;
    } else {
      return `❌ CRÍTICO: ${inconsistencies} inconsistências detectadas. Divergência: ${maxDivergence.toFixed(2)}% (excede limite de ${allowedVariance}%)`;
    }
  }

  /**
   * Verifica se a auditoria está dentro dos padrões aceitáveis
   */
  static isAuditAcceptable(result: AuditResult): boolean {
    return result.status === 'consistent' || result.status === 'warning';
  }

  /**
   * Obtém cor do badge baseado no status
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'consistent':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
    }
  }

  /**
   * Formata divergência para exibição
   */
  static formatDivergence(divergence: number): string {
    return `${divergence.toFixed(2)}%`;
  }

  /**
   * Retorna a configuração atual do módulo de auditoria
   */
  static getAuditConfig() {
    return AUDIT_CONFIG;
  }
}
