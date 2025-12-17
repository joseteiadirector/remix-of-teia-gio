/**
 * Sistema Unificado de Captura de Charts
 * USA Edge Function no backend (sem problemas de CORS)
 */

import { supabase } from '@/integrations/supabase/client';
import { ChartCapture } from '../types';
import { CHART_IDS, isValidChartId, ChartId } from '../config/chartIds';
import { logger } from '@/utils/logger';

/**
 * Captura charts usando Edge Function (backend) - SOLUÇÃO DEFINITIVA
 */
export async function captureMultipleCharts(chartIds: ChartId[]): Promise<ChartCapture[]> {
  logger.info('🚀 Capturando gráficos via Edge Function (backend)', { count: chartIds.length, chartIds });
  
  try {
    // Valida IDs
    const validIds = chartIds.filter(id => isValidChartId(id));
    if (validIds.length !== chartIds.length) {
      logger.warn('Alguns IDs de chart são inválidos', { 
        invalid: chartIds.filter(id => !isValidChartId(id)) 
      });
    }

    // Chama Edge Function no backend para capturar gráficos
    const { data, error } = await supabase.functions.invoke('capture-charts-for-pdf', {
      body: {
        chartIds: validIds,
        appUrl: window.location.origin + window.location.pathname
      }
    });

    if (error) throw error;

    if (!data || !data.success) {
      throw new Error('Edge Function retornou erro');
    }

    logger.info('✅ Gráficos capturados com sucesso via backend', {
      total: data.stats.total,
      captured: data.stats.captured,
      failed: data.stats.failed
    });

    // Converte resposta para formato ChartCapture
    return data.captures.map((capture: any) => ({
      id: capture.id,
      dataUrl: capture.dataUrl,
      width: 800,
      height: 400
    }));

  } catch (error) {
    logger.error('❌ Erro ao capturar gráficos via Edge Function', { error });
    
    // Fallback: retorna capturas vazias
    return chartIds.map(id => ({
      id,
      dataUrl: null
    }));
  }
}

/**
 * Captura um chart individual (usa captureMultipleCharts internamente)
 */
export async function captureChart(chartId: ChartId): Promise<ChartCapture> {
  const captures = await captureMultipleCharts([chartId]);
  return captures[0] || { id: chartId, dataUrl: null };
}

/**
 * Captura todos os charts de uma categoria
 */
export async function captureChartsByCategory(
  category: 'geo' | 'seo' | 'igo' | 'cpi' | 'llm' | 'dashboard'
): Promise<ChartCapture[]> {
  const chartIds = Object.entries(CHART_IDS)
    .filter(([key]) => key.toLowerCase().startsWith(category))
    .map(([, value]) => value);

  return captureMultipleCharts(chartIds);
}

/**
 * Valida se chart foi capturado com sucesso
 */
export function isChartCaptured(capture: ChartCapture): boolean {
  return capture.dataUrl !== null && capture.dataUrl.length > 0;
}

/**
 * Filtra apenas charts capturados com sucesso
 */
export function getValidCaptures(captures: ChartCapture[]): ChartCapture[] {
  return captures.filter(isChartCaptured);
}
