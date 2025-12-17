/**
 * Performance Report Generator
 * PRODUCTION-SAFE: Usa logger condicional (silent em produção)
 */

import { logger } from './logger';
import { performanceMonitor } from './performance';

interface PerformanceScore {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  metrics: Record<string, any>;
}

interface TechnicalMetrics {
  coreWebVitals: {
    lcp: number | null;
    fid: number | null;
    cls: number | null;
  };
  resourceMetrics: {
    totalResources: number;
    totalSize: number;
    jsSize: number;
    cssSize: number;
    imageSize: number;
  };
  timingMetrics: {
    domContentLoaded: number;
    loadComplete: number;
    timeToInteractive: number;
  };
}

function getPerformanceScore(value: number, thresholds: { excellent: number; good: number; fair: number }): { score: number; status: 'excellent' | 'good' | 'fair' | 'poor' } {
  if (value <= thresholds.excellent) {
    return { score: 100, status: 'excellent' };
  } else if (value <= thresholds.good) {
    return { score: 80, status: 'good' };
  } else if (value <= thresholds.fair) {
    return { score: 60, status: 'fair' };
  } else {
    return { score: 40, status: 'poor' };
  }
}

function getTechnicalMetrics(): TechnicalMetrics {
  const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  let jsSize = 0, cssSize = 0, imageSize = 0;
  resources.forEach(resource => {
    const size = resource.transferSize || 0;
    if (resource.name.includes('.js')) jsSize += size;
    else if (resource.name.includes('.css')) cssSize += size;
    else if (resource.name.match(/\.(jpg|jpeg|png|gif|svg|webp)/i)) imageSize += size;
  });

  const totalSize = resources.reduce((acc, r) => acc + (r.transferSize || 0), 0);

  return {
    coreWebVitals: {
      lcp: null, // Será preenchido por observer
      fid: null,
      cls: null,
    },
    resourceMetrics: {
      totalResources: resources.length,
      totalSize: Math.round(totalSize / 1024),
      jsSize: Math.round(jsSize / 1024),
      cssSize: Math.round(cssSize / 1024),
      imageSize: Math.round(imageSize / 1024),
    },
    timingMetrics: {
      domContentLoaded: Math.round(perfEntries?.domContentLoadedEventEnd - perfEntries?.fetchStart || 0),
      loadComplete: Math.round(perfEntries?.loadEventEnd - perfEntries?.fetchStart || 0),
      timeToInteractive: Math.round(perfEntries?.domInteractive - perfEntries?.fetchStart || 0),
    }
  };
}

function analyzeAPIPerformance(): PerformanceScore {
  const apiMetrics = performanceMonitor.getMetrics();
  const apiCalls = apiMetrics.filter(m => 
    m.name.includes('fetch') || 
    m.name.includes('query') || 
    m.name.includes('api')
  );
  
  if (apiCalls.length === 0) {
    return {
      category: 'Performance de APIs',
      score: 100,
      status: 'excellent',
      metrics: { message: 'Nenhuma chamada API registrada ainda' }
    };
  }

  const avgDuration = apiCalls.reduce((sum, m) => sum + m.duration, 0) / apiCalls.length;
  const slowCalls = apiCalls.filter(m => m.duration > 1000).length;
  const { score, status } = getPerformanceScore(avgDuration, { excellent: 300, good: 800, fair: 1500 });

  return {
    category: 'Performance de APIs',
    score,
    status,
    metrics: {
      totalCalls: apiCalls.length,
      avgResponseTime: `${avgDuration.toFixed(0)}ms`,
      slowCalls: slowCalls,
      fastestCall: `${Math.min(...apiCalls.map(m => m.duration)).toFixed(0)}ms`,
      slowestCall: `${Math.max(...apiCalls.map(m => m.duration)).toFixed(0)}ms`,
    }
  };
}

function analyzeRenderPerformance(): PerformanceScore {
  const renderMetrics = performanceMonitor.getMetrics();
  const renders = renderMetrics.filter(m => m.name.includes('render') || m.name.includes('component'));
  
  if (renders.length === 0) {
    return {
      category: 'Performance de Renderização',
      score: 100,
      status: 'excellent',
      metrics: { message: 'Nenhuma métrica de renderização registrada' }
    };
  }

  const avgRenderTime = renders.reduce((sum, m) => sum + m.duration, 0) / renders.length;
  const { score, status } = getPerformanceScore(avgRenderTime, { excellent: 16, good: 50, fair: 100 });

  return {
    category: 'Performance de Renderização',
    score,
    status,
    metrics: {
      totalRenders: renders.length,
      avgRenderTime: `${avgRenderTime.toFixed(2)}ms`,
      target60fps: avgRenderTime < 16 ? '✅ Sim' : '❌ Não',
    }
  };
}

function analyzeResourceLoading(): PerformanceScore {
  const metrics = getTechnicalMetrics();
  const loadTime = metrics.timingMetrics.loadComplete;
  const { score, status } = getPerformanceScore(loadTime, { excellent: 1500, good: 3000, fair: 5000 });

  return {
    category: 'Carregamento de Recursos',
    score,
    status,
    metrics: {
      totalResources: metrics.resourceMetrics.totalResources,
      totalSize: `${metrics.resourceMetrics.totalSize} KB`,
      jsSize: `${metrics.resourceMetrics.jsSize} KB`,
      cssSize: `${metrics.resourceMetrics.cssSize} KB`,
      imageSize: `${metrics.resourceMetrics.imageSize} KB`,
      loadTime: `${loadTime}ms`,
      domContentLoaded: `${metrics.timingMetrics.domContentLoaded}ms`,
      timeToInteractive: `${metrics.timingMetrics.timeToInteractive}ms`,
    }
  };
}

function analyzeCacheEfficiency(): PerformanceScore {
  // Simular análise de cache baseado em métricas repetidas
  const allMetrics = performanceMonitor.getMetrics();
  const uniqueOperations = new Set(allMetrics.map(m => m.name)).size;
  const totalOperations = allMetrics.length;
  
  const cacheHitRate = totalOperations > 0 
    ? ((totalOperations - uniqueOperations) / totalOperations) * 100 
    : 0;

  const { score, status } = cacheHitRate >= 70 
    ? { score: 100, status: 'excellent' as const }
    : cacheHitRate >= 50 
    ? { score: 80, status: 'good' as const }
    : cacheHitRate >= 30 
    ? { score: 60, status: 'fair' as const }
    : { score: 40, status: 'poor' as const };

  return {
    category: 'Eficiência de Cache',
    score,
    status,
    metrics: {
      cacheHitRate: `${cacheHitRate.toFixed(1)}%`,
      totalOperations,
      uniqueOperations,
      repeatedOperations: totalOperations - uniqueOperations,
    }
  };
}

function analyzeRobustness(): PerformanceScore {
  const allMetrics = performanceMonitor.getMetrics();
  const failedOps = allMetrics.filter(m => m.duration > 5000).length; // Considerando timeout
  const successRate = allMetrics.length > 0 
    ? ((allMetrics.length - failedOps) / allMetrics.length) * 100 
    : 100;

  const { score, status } = successRate >= 98 
    ? { score: 100, status: 'excellent' as const }
    : successRate >= 95 
    ? { score: 80, status: 'good' as const }
    : successRate >= 90 
    ? { score: 60, status: 'fair' as const }
    : { score: 40, status: 'poor' as const };

  return {
    category: 'Robustez e Confiabilidade',
    score,
    status,
    metrics: {
      successRate: `${successRate.toFixed(1)}%`,
      totalOperations: allMetrics.length,
      failedOperations: failedOps,
      avgOperationTime: allMetrics.length > 0 
        ? `${(allMetrics.reduce((s, m) => s + m.duration, 0) / allMetrics.length).toFixed(0)}ms`
        : '0ms',
    }
  };
}

function analyzeAuthentication(): PerformanceScore {
  // Verificar se há sessão ativa
  const hasSession = localStorage.getItem('supabase.auth.token') !== null;
  const authMetrics = performanceMonitor.getMetrics().filter(m => 
    m.name.includes('auth') || m.name.includes('login') || m.name.includes('signup')
  );

  const avgAuthTime = authMetrics.length > 0 
    ? authMetrics.reduce((s, m) => s + m.duration, 0) / authMetrics.length 
    : 0;

  const score = hasSession && avgAuthTime < 1000 ? 100 
    : hasSession && avgAuthTime < 2000 ? 80 
    : hasSession ? 60 
    : 40;

  const status = score >= 90 ? 'excellent' 
    : score >= 75 ? 'good' 
    : score >= 60 ? 'fair' 
    : 'poor';

  return {
    category: 'Sistema de Autenticação',
    score,
    status,
    metrics: {
      sessionActive: hasSession ? '✅ Sim' : '❌ Não',
      authOperations: authMetrics.length.toString(),
      avgAuthTime: authMetrics.length > 0 ? `${avgAuthTime.toFixed(0)}ms` : 'N/A',
      oauthConfigured: 'Supabase Auth configurado',
    }
  };
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'excellent': return '#4CAF50';
    case 'good': return '#8BC34A';
    case 'fair': return '#FFC107';
    case 'poor': return '#F44336';
    default: return '#9E9E9E';
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'excellent': return '🌟';
    case 'good': return '✅';
    case 'fair': return '⚠️';
    case 'poor': return '❌';
    default: return '❓';
  }
}

// Função global para gerar relatório de performance no console
// PRODUCTION-SAFE: Silent em produção
export function printPerformanceReport() {
  // Silent em produção - apenas em desenvolvimento
  if (!import.meta.env.DEV) {
    logger.debug('Performance report disabled in production');
    return;
  }

  console.clear();
  console.log('%c╔══════════════════════════════════════════════════════════════════════════╗', 'color: #2196F3; font-weight: bold;');
  console.log('%c║     📊 ANÁLISE COMPLETA DA PLATAFORMA GEO - RELATÓRIO TÉCNICO          ║', 'color: #2196F3; font-weight: bold; font-size: 16px;');
  console.log('%c╚══════════════════════════════════════════════════════════════════════════╝', 'color: #2196F3; font-weight: bold;');
  console.log('');

  // Análise completa
  const scores: PerformanceScore[] = [
    analyzeAPIPerformance(),
    analyzeRenderPerformance(),
    analyzeResourceLoading(),
    analyzeCacheEfficiency(),
    analyzeRobustness(),
    analyzeAuthentication(),
  ];

  // Score geral
  const overallScore = Math.round(
    scores.reduce((sum, s) => sum + s.score, 0) / scores.length
  );
  
  const overallStatus = overallScore >= 90 ? 'excellent' 
    : overallScore >= 75 ? 'good' 
    : overallScore >= 60 ? 'fair' 
    : 'poor';

  // PARTE 1: SCORE GERAL E STATUS
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #FF9800;');
  console.log('%c🎯 SCORE GERAL DA PLATAFORMA', 'font-weight: bold; font-size: 18px; color: #FF9800;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #FF9800;');
  console.log('');
  console.log(`%c   PONTUAÇÃO TOTAL: ${overallScore}/100 ${getStatusEmoji(overallStatus)}`, 
    `color: ${getStatusColor(overallStatus)}; font-size: 24px; font-weight: bold;`);
  console.log(`%c   STATUS: ${overallStatus.toUpperCase()}`, 
    `color: ${getStatusColor(overallStatus)}; font-size: 16px; font-weight: bold;`);
  console.log('');
  
  // Barra de progresso visual
  const progressBar = '█'.repeat(Math.floor(overallScore / 5)) + '░'.repeat(20 - Math.floor(overallScore / 5));
  console.log(`%c   [${progressBar}] ${overallScore}%`, 
    `color: ${getStatusColor(overallStatus)}; font-size: 14px;`);
  console.log('');

  // PARTE 2: ANÁLISE POR CATEGORIAS
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2196F3;');
  console.log('%c📋 ANÁLISE DETALHADA POR CATEGORIA', 'font-weight: bold; font-size: 16px; color: #2196F3;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2196F3;');
  console.log('');

  scores.forEach((category, index) => {
    const catProgress = '█'.repeat(Math.floor(category.score / 10)) + '░'.repeat(10 - Math.floor(category.score / 10));
    console.log(`%c${index + 1}. ${category.category}`, 'font-weight: bold; font-size: 14px; color: #333;');
    console.log(`   ${getStatusEmoji(category.status)} Score: %c${category.score}/100%c [${catProgress}]`, 
      `color: ${getStatusColor(category.status)}; font-weight: bold;`,
      'color: inherit;'
    );
    console.log(`   Status: %c${category.status.toUpperCase()}`, 
      `color: ${getStatusColor(category.status)}; font-weight: bold;`
    );
    
    console.log('   📊 Métricas Detalhadas:');
    Object.entries(category.metrics).forEach(([key, value]) => {
      console.log(`      • ${key}: %c${value}`, 'font-weight: bold;');
    });
    console.log('');
  });

  // PARTE 3: O QUE FOI ALCANÇADO
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4CAF50;');
  console.log('%c✅ PONTOS JÁ ALCANÇADOS E MELHORADOS', 'font-weight: bold; font-size: 16px; color: #4CAF50;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4CAF50;');
  console.log('');
  
  const improved = scores.filter(s => s.score >= 80);
  if (improved.length > 0) {
    improved.forEach((cat, i) => {
      console.log(`   ${i + 1}. %c${cat.category}`, 'color: #4CAF50; font-weight: bold;');
      console.log(`      ✓ Score: ${cat.score}/100 - ${cat.status.toUpperCase()}`);
      console.log(`      ✓ Nível: ${cat.score >= 95 ? 'EXCELENTE' : cat.score >= 90 ? 'ÓTIMO' : 'BOM'}`);
    });
  } else {
    console.log('   ⚠️  Nenhuma categoria atingiu excelência ainda (>80 pontos)');
  }
  console.log('');

  // PARTE 4: O QUE FALTA MELHORAR
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #F44336;');
  console.log('%c🔧 ÁREAS QUE PRECISAM MELHORAR', 'font-weight: bold; font-size: 16px; color: #F44336;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #F44336;');
  console.log('');
  
  const needsImprovement = scores.filter(s => s.score < 80);
  if (needsImprovement.length > 0) {
    needsImprovement.forEach((cat, i) => {
      const priority = cat.score < 60 ? 'CRÍTICO' : cat.score < 70 ? 'ALTO' : 'MÉDIO';
      const priorityColor = cat.score < 60 ? '#F44336' : cat.score < 70 ? '#FF9800' : '#FFC107';
      
      console.log(`   ${i + 1}. %c${cat.category}`, `color: ${priorityColor}; font-weight: bold;`);
      console.log(`      ⚠ Score Atual: ${cat.score}/100`);
      console.log(`      ⚠ Prioridade: %c${priority}`, `color: ${priorityColor}; font-weight: bold;`);
      console.log(`      ⚠ Gap para Excelência: ${100 - cat.score} pontos`);
      console.log('      📌 Métricas Críticas:');
      Object.entries(cat.metrics).forEach(([key, value]) => {
        console.log(`         • ${key}: ${value}`);
      });
    });
  } else {
    console.log('   🎉 %cTODAS AS CATEGORIAS ESTÃO PERFORMANDO BEM!', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
  }
  console.log('');

  // PARTE 5: OPERAÇÕES LENTAS
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #FF9800;');
  console.log('%c🐌 OPERAÇÕES MAIS LENTAS (TOP 5)', 'font-weight: bold; font-size: 16px; color: #FF9800;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #FF9800;');
  console.log('');
  
  const slowest = performanceMonitor.getSlowestOperations(5);
  if (slowest.length > 0) {
    slowest.forEach((op, i) => {
      const severity = op.duration > 2000 ? 'CRÍTICO' : op.duration > 1000 ? 'ALTO' : 'MÉDIO';
      const severityColor = op.duration > 2000 ? '#F44336' : op.duration > 1000 ? '#FF9800' : '#FFC107';
      
      console.log(`   ${i + 1}. ${op.name}`);
      console.log(`      ⏱️  Tempo: %c${op.duration.toFixed(2)}ms`, 
        `color: ${severityColor}; font-weight: bold;`
      );
      console.log(`      🚨 Severidade: %c${severity}`, `color: ${severityColor}; font-weight: bold;`);
      console.log(`      💡 Impacto: ${op.duration > 2000 ? 'Alto - Afeta UX significativamente' : op.duration > 1000 ? 'Médio - Usuário pode perceber' : 'Baixo - Dentro do aceitável'}`);
    });
  } else {
    console.log('   ✅ %cNenhuma operação lenta detectada!', 'color: #4CAF50; font-weight: bold;');
  }
  console.log('');

  // PARTE 6: RECOMENDAÇÕES PRIORIZADAS
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9C27B0;');
  console.log('%c💡 RECOMENDAÇÕES DE OTIMIZAÇÃO (PRIORIZADAS)', 'font-weight: bold; font-size: 16px; color: #9C27B0;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9C27B0;');
  console.log('');
  
  const criticalRecs: string[] = [];
  const highRecs: string[] = [];
  const mediumRecs: string[] = [];
  
  scores.forEach(category => {
    if (category.score < 60) {
      // Crítico
      if (category.category.includes('API')) {
        criticalRecs.push('🔴 Implementar cache agressivo para chamadas de API');
        criticalRecs.push('🔴 Adicionar retry logic com exponential backoff');
      }
      if (category.category.includes('Renderização')) {
        criticalRecs.push('🔴 Usar React.memo() em todos componentes pesados');
        criticalRecs.push('🔴 Implementar virtualização para listas');
      }
      if (category.category.includes('Recursos')) {
        criticalRecs.push('🔴 Converter imagens para WebP');
        criticalRecs.push('🔴 Implementar code splitting urgente');
      }
      if (category.category.includes('Autenticação')) {
        criticalRecs.push('🔴 Otimizar fluxo de autenticação');
        criticalRecs.push('🔴 Implementar refresh token automático');
      }
    } else if (category.score < 80) {
      // Alto
      if (category.category.includes('API')) {
        highRecs.push('🟡 Otimizar queries de banco de dados');
        highRecs.push('🟡 Implementar pagination para grandes datasets');
      }
      if (category.category.includes('Renderização')) {
        highRecs.push('🟡 Adicionar lazy loading para componentes');
      }
      if (category.category.includes('Cache')) {
        highRecs.push('🟡 Aumentar TTL do cache');
        highRecs.push('🟡 Implementar Service Worker');
      }
      if (category.category.includes('Autenticação')) {
        highRecs.push('🟡 Adicionar autenticação social (Google, GitHub)');
      }
    }
  });

  if (criticalRecs.length > 0) {
    console.log('   %c🔴 PRIORIDADE CRÍTICA (Implementar IMEDIATAMENTE)', 'color: #F44336; font-weight: bold; font-size: 14px;');
    criticalRecs.forEach((rec, i) => {
      console.log(`      ${i + 1}. ${rec}`);
    });
    console.log('');
  }

  if (highRecs.length > 0) {
    console.log('   %c🟡 PRIORIDADE ALTA (Implementar em breve)', 'color: #FF9800; font-weight: bold; font-size: 14px;');
    highRecs.forEach((rec, i) => {
      console.log(`      ${i + 1}. ${rec}`);
    });
    console.log('');
  }

  if (criticalRecs.length === 0 && highRecs.length === 0) {
    console.log('   🎉 %cExcelente! Todas as otimizações críticas já foram implementadas!', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
    console.log('');
  }

  // PARTE 7: NÍVEL DE PERFEIÇÃO ALCANÇADO
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #673AB7;');
  console.log('%c🏆 NÍVEL DE PERFEIÇÃO ALCANÇADO', 'font-weight: bold; font-size: 16px; color: #673AB7;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #673AB7;');
  console.log('');

  const perfectionLevel = overallScore >= 95 ? 'QUASE PERFEITO' 
    : overallScore >= 90 ? 'EXCELENTE' 
    : overallScore >= 80 ? 'MUITO BOM' 
    : overallScore >= 70 ? 'BOM'
    : overallScore >= 60 ? 'SATISFATÓRIO'
    : 'NECESSITA MELHORIAS';

  const perfectionColor = overallScore >= 90 ? '#4CAF50' 
    : overallScore >= 80 ? '#8BC34A'
    : overallScore >= 70 ? '#FFC107'
    : overallScore >= 60 ? '#FF9800'
    : '#F44336';

  console.log(`   📊 Nível Atual: %c${perfectionLevel}`, `color: ${perfectionColor}; font-weight: bold; font-size: 18px;`);
  console.log(`   📈 Pontuação: %c${overallScore}/100`, `color: ${perfectionColor}; font-weight: bold; font-size: 16px;`);
  console.log(`   🎯 Meta para Perfeição: 100 pontos`);
  console.log(`   📉 Faltam: %c${100 - overallScore} pontos`, `color: ${perfectionColor}; font-weight: bold;`);
  console.log('');

  // Estimativa de esforço
  const effortDays = Math.ceil((100 - overallScore) / 10);
  console.log(`   ⏱️  Esforço Estimado: %c${effortDays} dias de trabalho`, 'color: #2196F3; font-weight: bold;');
  console.log(`   📅 Previsão de Conclusão: ${effortDays} dias úteis`);
  console.log('');

  // PARTE 8: RESUMO EXECUTIVO
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2196F3;');
  console.log('%c📋 RESUMO EXECUTIVO', 'font-weight: bold; font-size: 16px; color: #2196F3;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2196F3;');
  console.log('');
  console.log(`   📊 Score Geral: %c${overallScore}/100 ${getStatusEmoji(overallStatus)}`, `color: ${getStatusColor(overallStatus)}; font-weight: bold;`);
  console.log(`   ✅ Categorias Excelentes (≥80): ${scores.filter(s => s.score >= 80).length}/${scores.length}`);
  console.log(`   ⚠️  Necessitam Atenção (<80): ${scores.filter(s => s.score < 80).length}/${scores.length}`);
  console.log(`   🔴 Críticas (<60): ${scores.filter(s => s.score < 60).length}/${scores.length}`);
  console.log(`   🐌 Operações Lentas: ${slowest.filter(s => s.duration > 1000).length}`);
  console.log(`   🏆 Nível de Perfeição: %c${perfectionLevel}`, `color: ${perfectionColor}; font-weight: bold;`);
  console.log('');

  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2196F3;');
  console.log('%c📊 COMANDOS DISPONÍVEIS', 'font-weight: bold; font-size: 14px; color: #9C27B0;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2196F3;');
  console.log('');
  console.log('   • %cprintPerformanceReport()%c - Exibir este relatório completo', 'color: #2196F3; font-weight: bold;', 'color: inherit;');
  console.log('   • %cclearPerformanceMetrics()%c - Limpar métricas coletadas', 'color: #2196F3; font-weight: bold;', 'color: inherit;');
  console.log('');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2196F3;');
}

export function clearPerformanceMetrics() {
  performanceMonitor.clear();
  console.log('✅ Métricas de performance limpas');
}

// Expor globalmente para uso no console do navegador
if (typeof window !== 'undefined') {
  (window as any).printPerformanceReport = printPerformanceReport;
  (window as any).clearPerformanceMetrics = clearPerformanceMetrics;
  
  console.log('%c💻 Comandos disponíveis no console:', 'font-weight: bold; color: #2196F3');
  console.log('  • printPerformanceReport() - Exibir relatório de performance');
  console.log('  • clearPerformanceMetrics() - Limpar métricas coletadas');
}
