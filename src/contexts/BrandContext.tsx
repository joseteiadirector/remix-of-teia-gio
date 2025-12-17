import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME } from '@/config/brandVisibility';

interface Brand {
  id: string;
  name: string;
  domain: string;
  description: string | null;
}

interface BrandContextType {
  selectedBrandId: string | null;
  setSelectedBrandId: (brandId: string | null) => void;
  brands: Brand[];
  isLoading: boolean;
  selectedBrand: Brand | null;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const STORAGE_KEY = 'teia-selected-brand-id';

export function BrandProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [selectedBrandId, setSelectedBrandIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });
  const { toast } = useToast();
  // Removido hasAutoSelectedRef - não necessário mais

  // Usar React Query para carregar marcas
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands', USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME],
    queryFn: async () => {
      if (!user) return [];
      
      // Query base
      let query = supabase
        .from('brands')
        .select('id, name, domain, description')
        .eq('user_id', user.id);
      
      // ✅ FILTRO CONTROLADO PELO CÓDIGO (não pelo banco)
      if (USE_CODE_BASED_VISIBILITY) {
        // Filtrar pela marca definida no código
        query = query.eq('name', VISIBLE_BRAND_NAME);
        logger.info('Usando filtro de visibilidade por CÓDIGO', { marca: VISIBLE_BRAND_NAME });
      } else {
        // Usar configuração do banco de dados
        query = query.eq('is_visible', true);
      }
      
      query = query.order('name');

      const { data, error } = await query;

      if (error) {
        logger.error('Falha ao carregar marcas', { error });
        throw error;
      }

      logger.info('Marcas carregadas', { 
        total: data?.length || 0, 
        marcas: data?.map(b => b.name) 
      });

      return data || [];
    },
    enabled: !!user && !authLoading,
    staleTime: 30 * 1000,
  });

  // Auto-selecionar marca apenas UMA VEZ quando necessário
  useEffect(() => {
    if (isLoading || !brands || brands.length === 0) return;

    const currentBrandId = selectedBrandId;
    
    // Se não há marca selecionada, selecionar a primeira
    if (!currentBrandId) {
      const firstBrandId = brands[0].id;
      logger.info('Nenhuma marca selecionada, auto-selecionando primeira', { firstBrandId, brandName: brands[0].name });
      setSelectedBrandIdState(firstBrandId);
      localStorage.setItem(STORAGE_KEY, firstBrandId);
      return;
    }

    // ✅ CORREÇÃO CRÍTICA: Se a marca selecionada não existe na lista filtrada, FORÇAR seleção da primeira
    const brandExists = currentBrandId === 'all' || brands.some(b => b.id === currentBrandId);
    if (!brandExists) {
      const firstBrandId = brands[0].id;
      logger.warn('Marca selecionada não disponível, forçando seleção de marca visível', { 
        oldBrandId: currentBrandId, 
        newBrandId: firstBrandId,
        newBrandName: brands[0].name 
      });
      // Limpar localStorage e forçar nova seleção
      localStorage.removeItem(STORAGE_KEY);
      setSelectedBrandIdState(firstBrandId);
      localStorage.setItem(STORAGE_KEY, firstBrandId);
    }
  // ⚠️ CRÍTICO: NÃO adicionar selectedBrandId nas dependências - causa loop infinito e tela preta
  // Ver memória: architecture/brand-context-dependency-array-fix
  }, [brands, isLoading]);

  // Função para definir a marca selecionada (com persistência)
  const setSelectedBrandId = (brandId: string | null) => {
    logger.debug('Marca alterada', { brandId });
    setSelectedBrandIdState(brandId);
    
    if (brandId) {
      localStorage.setItem(STORAGE_KEY, brandId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    // Log para debug com nome da marca
    setTimeout(() => {
      const brandName = brandId === 'all' 
        ? 'Todas as marcas'
        : brands.find(b => b.id === brandId)?.name || `ID: ${brandId}`;
      
      logger.info('Marca selecionada', { brandId, brandName });
    }, 100);
  };

  // Obter a marca selecionada atual
  const selectedBrand = selectedBrandId && selectedBrandId !== 'all'
    ? brands.find(b => b.id === selectedBrandId) || null
    : null;

  return (
    <BrandContext.Provider
      value={{
        selectedBrandId,
        setSelectedBrandId,
        brands,
        isLoading,
        selectedBrand,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
