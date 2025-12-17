/**
 * Sistema de Prefetching Inteligente
 * Carrega rotas baseado em analytics e padrões de navegação
 */

import { preloadRoute } from './routePreloader';

interface RouteAnalytics {
  route: string;
  visits: number;
  avgTimeToNavigate: number; // ms até usuário navegar para essa rota
  lastVisit: number;
}

const STORAGE_KEY = 'teia_route_analytics';
const PREFETCH_THRESHOLD = 3; // Preload após 3 visitas
const ANALYTICS_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

class IntelligentPrefetch {
  private analytics: Map<string, RouteAnalytics> = new Map();
  private currentRoute: string = '/';
  private routeStartTime: number = Date.now();
  private prefetched: Set<string> = new Set();

  constructor() {
    this.loadAnalytics();
    this.cleanOldAnalytics();
  }

  /**
   * Registrar navegação para uma rota
   */
  trackNavigation(route: string): void {
    const now = Date.now();
    const timeToNavigate = now - this.routeStartTime;

    const analytics = this.analytics.get(route) || {
      route,
      visits: 0,
      avgTimeToNavigate: 0,
      lastVisit: 0,
    };

    // Calcular média móvel do tempo de navegação
    analytics.avgTimeToNavigate = 
      (analytics.avgTimeToNavigate * analytics.visits + timeToNavigate) / 
      (analytics.visits + 1);
    
    analytics.visits += 1;
    analytics.lastVisit = now;

    this.analytics.set(route, analytics);
    this.currentRoute = route;
    this.routeStartTime = now;

    this.saveAnalytics();
    this.triggerIntelligentPrefetch();
  }

  /**
   * Carregar rotas que provavelmente serão acessadas
   */
  private triggerIntelligentPrefetch(): void {
    const candidates = this.getTopCandidates(3);
    
    candidates.forEach(({ route }) => {
      if (!this.prefetched.has(route)) {
        this.prefetchIfMapped(route);
        this.prefetched.add(route);
      }
    });
  }

  /**
   * Obter rotas candidatas para prefetch
   */
  private getTopCandidates(limit: number): RouteAnalytics[] {
    return Array.from(this.analytics.values())
      .filter(a => a.visits >= PREFETCH_THRESHOLD)
      .filter(a => a.route !== this.currentRoute)
      .sort((a, b) => {
        // Priorizar por frequência e recência
        const scoreA = a.visits * 0.7 + (1 / (Date.now() - a.lastVisit)) * 0.3;
        const scoreB = b.visits * 0.7 + (1 / (Date.now() - b.lastVisit)) * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Fazer prefetch se a rota estiver mapeada
   */
  private prefetchIfMapped(route: string): void {
    const routeMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/brands': 'Brands',
      '/analytics': 'Analytics',
      '/reports': 'Reports',
      '/llm-mentions': 'LLMMentions',
      '/scores': 'Scores',
      '/geo-metrics': 'GeoMetrics',
      '/seo-metrics': 'SeoMetrics',
      '/insights': 'Insights',
      '/alerts': 'Alerts',
    };

    const routeName = routeMap[route];
    if (routeName) {
      console.log(`[PREFETCH] 🎯 Carregando ${routeName} inteligentemente`);
      preloadRoute(routeName as any);
    }
  }

  /**
   * Salvar analytics no localStorage
   */
  private saveAnalytics(): void {
    try {
      const data = Array.from(this.analytics.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[PREFETCH] Não foi possível salvar analytics', e);
    }
  }

  /**
   * Carregar analytics do localStorage
   */
  private loadAnalytics(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const entries = JSON.parse(data);
        this.analytics = new Map(entries);
      }
    } catch (e) {
      console.warn('[PREFETCH] Não foi possível carregar analytics', e);
    }
  }

  /**
   * Limpar analytics antigas
   */
  private cleanOldAnalytics(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [route, analytics] of this.analytics.entries()) {
      if (now - analytics.lastVisit > ANALYTICS_MAX_AGE) {
        this.analytics.delete(route);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[PREFETCH] 🧹 Limpou ${cleaned} rotas antigas`);
      this.saveAnalytics();
    }
  }

  /**
   * Obter estatísticas para debugging
   */
  getStats(): RouteAnalytics[] {
    return Array.from(this.analytics.values())
      .sort((a, b) => b.visits - a.visits);
  }

  /**
   * Limpar todos os dados (útil para testes)
   */
  clear(): void {
    this.analytics.clear();
    this.prefetched.clear();
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const intelligentPrefetch = new IntelligentPrefetch();

// Expor globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).__intelligentPrefetch = intelligentPrefetch;
}
