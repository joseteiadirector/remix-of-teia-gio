/**
 * Sistema de Estimativas Inteligentes
 * Calcula métricas SEO mais precisas baseadas em análise de IA
 */

export interface TechnicalAnalysis {
  overallScore: number;
  seo: {
    score: number;
    title: string;
    description: string;
    h1Count: number;
  };
  performance: {
    score: number;
  };
  structure: {
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
  };
}

export interface AIAnalysis {
  overall_score: number;
  seo_score: number;
  geo_score: number;
  analysis_data?: {
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: any[];
  };
}

interface EstimatedMetrics {
  organic_traffic: number;
  total_clicks: number;
  total_impressions: number;
  ctr: number; // decimal 0.00-0.05
  avg_position: number;
  conversion_rate: number; // decimal 0.00-0.03
  confidence_level: 'low' | 'medium' | 'high';
}

/**
 * Calcula multiplicador baseado em pontos fracos
 */
function calculateWeaknessMultiplier(weaknesses: string[] = []): number {
  let multiplier = 1.0;
  
  const penaltyMap: Record<string, number> = {
    'h1': -0.30, // Ausência de H1 é crítica
    'meta description': -0.20,
    'title': -0.25,
    'structured data': -0.15,
    'schema': -0.15,
    'autoridade': -0.20,
    'credibilidade': -0.15,
    'profundidade': -0.10,
    'conteúdo superficial': -0.15,
    'palavras-chave': -0.10,
  };
  
  weaknesses.forEach(weakness => {
    const lowerWeakness = weakness.toLowerCase();
    Object.entries(penaltyMap).forEach(([keyword, penalty]) => {
      if (lowerWeakness.includes(keyword)) {
        multiplier += penalty;
      }
    });
  });
  
  return Math.max(0.3, multiplier); // Mínimo 30% do potencial
}

/**
 * Calcula multiplicador baseado em pontos fortes
 */
function calculateStrengthMultiplier(strengths: string[] = []): number {
  let multiplier = 1.0;
  
  const bonusMap: Record<string, number> = {
    'título': 0.15,
    'title': 0.15,
    'meta description': 0.10,
    'estrutura': 0.10,
    'schema': 0.20,
    'structured data': 0.20,
    'conteúdo': 0.15,
    'autoridade': 0.25,
    'credibilidade': 0.20,
    'palavras-chave': 0.10,
  };
  
  strengths.forEach(strength => {
    const lowerStrength = strength.toLowerCase();
    Object.entries(bonusMap).forEach(([keyword, bonus]) => {
      if (lowerStrength.includes(keyword)) {
        multiplier += bonus;
      }
    });
  });
  
  return Math.min(1.5, multiplier); // Máximo 150% do potencial
}

/**
 * Calcula estimativas inteligentes baseadas em análise técnica
 * Adiciona variação natural diária para simular flutuação realista
 */
export function calculateIntelligentEstimates(
  technical: TechnicalAnalysis,
  aiAnalysis?: AIAnalysis,
  addDailyVariation: boolean = true
): EstimatedMetrics {
  console.log('[Intelligent Estimates] Iniciando cálculo...');
  
  // Score base (0-100)
  const baseScore = technical.overallScore;
  
  // Análise de IA disponível?
  const strengths = aiAnalysis?.analysis_data?.strengths || [];
  const weaknesses = aiAnalysis?.analysis_data?.weaknesses || [];
  const seoScore = aiAnalysis?.seo_score || baseScore;
  const geoScore = aiAnalysis?.geo_score || baseScore * 0.5;
  
  // Multiplicadores inteligentes
  const weaknessMultiplier = calculateWeaknessMultiplier(weaknesses);
  const strengthMultiplier = calculateStrengthMultiplier(strengths);
  const qualityMultiplier = weaknessMultiplier * strengthMultiplier;
  
  console.log('[Intelligent Estimates] Multiplicadores:', {
    weakness: weaknessMultiplier,
    strength: strengthMultiplier,
    quality: qualityMultiplier,
  });
  
  // === CTR (Click-Through Rate) - CALCULADO PRIMEIRO ===
  // Base: 1-5% dependendo do score SEO (valores realistas para web)
  // Fórmula: Score 50-100 → CTR 1.5-4.5%
  let baseCTR = 0.01 + (seoScore / 100) * 0.035; // Score 50→1.75%, 70→2.45%, 100→4.5%
  
  // Ajustes específicos para CTR baseados em fatores técnicos
  let ctrMultiplier = 1.0;
  
  // Título otimizado aumenta CTR significativamente
  if (technical.seo.title && technical.seo.title.length >= 30 && technical.seo.title.length <= 60) {
    ctrMultiplier *= 1.25; // +25% CTR
  } else if (!technical.seo.title || technical.seo.title.length < 30) {
    ctrMultiplier *= 0.7; // -30% CTR se título ruim
  }
  
  // Meta description influencia CTR
  if (technical.seo.description && technical.seo.description.length >= 120) {
    ctrMultiplier *= 1.2; // +20% CTR
  } else if (!technical.seo.description) {
    ctrMultiplier *= 0.8; // -20% CTR se sem description
  }
  
  // H1 ausente prejudica CTR (menor relevância percebida)
  if (technical.seo.h1Count === 0) {
    ctrMultiplier *= 0.85; // -15% CTR
  }
  
  // Aplicar multiplicadores de qualidade (strengths/weaknesses)
  ctrMultiplier *= qualityMultiplier;
  
  // CTR final: mínimo 0.8%, máximo 5%
  const ctr = Math.max(0.008, Math.min(0.05, baseCTR * ctrMultiplier));
  
  // === CLICKS ===
  // Base: Score * 2 cliques/dia (70 score = 140 clicks base)
  const baseClicks = Math.round(baseScore * 2);
  const clicks = Math.round(baseClicks * qualityMultiplier);
  
  // === IMPRESSÕES ===
  // CRÍTICO: Calcular impressões baseado em clicks e CTR para garantir consistência
  // Impressões = Clicks ÷ CTR
  const impressions = Math.round(clicks / ctr);
  
  // === POSIÇÃO MÉDIA ===
  // Quanto maior o score, melhor a posição (1-30)
  let avgPosition = Math.max(1, Math.round((100 - baseScore) / 3));
  
  // Penalidades por problemas estruturais
  if (technical.seo.h1Count === 0) avgPosition += 3;
  if (technical.seo.h1Count > 1) avgPosition += 2;
  if (!technical.structure.hasSitemap) avgPosition += 2;
  if (!technical.structure.hasRobotsTxt) avgPosition += 1;
  
  avgPosition = Math.min(30, avgPosition); // Max posição 30
  
  // === TRÁFEGO ORGÂNICO ===
  // Base: Score * 15, ajustado pela qualidade
  const baseTraffic = Math.round(baseScore * 15);
  const organicTraffic = Math.round(baseTraffic * qualityMultiplier);
  
  // === TAXA DE CONVERSÃO ===
  // Base: 0.5-3% dependendo do performance e GEO score
  // Performance bom + Conteúdo GEO bom = maior conversão
  let baseCR = 0.005 + (technical.performance.score / 100) * 0.015; // 0.5-2%
  
  // GEO score influencia conversão (melhor conteúdo = mais conversões)
  const geoMultiplier = Math.max(0.5, geoScore / 100); // Mínimo 0.5x
  
  // Aplicar multiplicadores
  let conversionRate = baseCR * geoMultiplier * qualityMultiplier;
  
  // Limites realistas: 0.3% a 3%
  conversionRate = Math.max(0.003, Math.min(0.03, conversionRate));
  
  // === NÍVEL DE CONFIANÇA ===
  let confidenceLevel: 'low' | 'medium' | 'high' = 'low';
  if (aiAnalysis && strengths.length > 3) {
    confidenceLevel = 'medium';
  }
  if (aiAnalysis && strengths.length > 5 && weaknesses.length < 3) {
    confidenceLevel = 'high';
  }
  
  
  // === VARIAÇÃO NATURAL DIÁRIA ===
  // Adiciona flutuação realista (±5-10%) para simular comportamento real
  let finalTraffic = organicTraffic;
  let finalClicks = clicks;
  let finalImpressions = impressions;
  let finalCTR = ctr;
  let finalPosition = avgPosition;
  let finalConversionRate = conversionRate;
  
  if (addDailyVariation) {
    // Gerar variação pseudo-aleatória baseada na data (determinística)
    const today = new Date();
    const seed = today.getDate() + today.getMonth() * 31 + today.getFullYear() * 372;
    const random = (Math.sin(seed) + 1) / 2; // 0-1 determinístico baseado na data
    
    // Variação entre -7.5% e +7.5%
    const variation = 0.925 + (random * 0.15); // 0.925 a 1.075
    
    console.log('[Intelligent Estimates] Aplicando variação diária:', {
      date: today.toISOString().split('T')[0],
      variation: `${((variation - 1) * 100).toFixed(1)}%`,
    });
    
    // Aplicar variação mantendo consistência matemática
    finalTraffic = Math.round(organicTraffic * variation);
    finalClicks = Math.round(clicks * variation);
    finalCTR = ctr * (0.95 + random * 0.1); // CTR varia -5% a +5%
    finalImpressions = Math.round(finalClicks / finalCTR); // Recalcular para manter consistência
    finalPosition = Math.max(1, Math.min(30, avgPosition + Math.round((random - 0.5) * 2))); // ±1 posição
    finalConversionRate = conversionRate * (0.9 + random * 0.2); // -10% a +10%
  }
  
  const estimates: EstimatedMetrics = {
    organic_traffic: finalTraffic,
    total_clicks: finalClicks,
    total_impressions: finalImpressions,
    ctr: Number(finalCTR.toFixed(4)),
    avg_position: finalPosition,
    conversion_rate: Number(finalConversionRate.toFixed(4)),
    confidence_level: confidenceLevel,
  };
  
  console.log('[Intelligent Estimates] Estimativas finais:', estimates);
  
  return estimates;
}
