import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardWidget } from './DashboardWidget';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME } from '@/config/brandVisibility';

interface WidgetBrandsOverviewProps {
  onRemove?: () => void;
}

function WidgetBrandsOverviewComponent({ onRemove }: WidgetBrandsOverviewProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: brandsData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['widget-brands', user?.id, USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME],
    queryFn: async () => {
      let query = supabase
        .from('brands')
        .select('id, name', { count: 'exact' })
        .eq('user_id', user!.id);
      
      // ✅ FILTRO CONTROLADO PELO CÓDIGO
      if (USE_CODE_BASED_VISIBILITY) {
        query = query.eq('name', VISIBLE_BRAND_NAME);
      } else {
        query = query.eq('is_visible', true);
      }
      
      const { data: brands, count } = await query.limit(50);

      if (!brands?.length) return { total: 0, topBrands: [] };

      const brandsWithScores = await Promise.all(
        brands.slice(0, 3).map(async (brand) => {
          const { data: scores } = await supabase
            .from('geo_scores')
            .select('score, computed_at')
            .eq('brand_id', brand.id)
            .order('computed_at', { ascending: false })
            .limit(1);

          return {
            name: brand.name,
            score: scores?.[0] ? Number(scores[0].score) : 0,
          };
        })
      );

      return {
        total: count || 0,
        topBrands: brandsWithScores,
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutos - dados de marcas são relativamente estáveis
  });

  return (
    <DashboardWidget
      id="brands-widget"
      title="Suas Marcas"
      lastUpdated={dataUpdatedAt}
      icon={<Building2 className="w-5 h-5 text-primary" />}
      onRemove={onRemove}
    >
      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : brandsData && brandsData.total > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{brandsData.total}</p>
              <p className="text-sm text-muted-foreground">Marcas cadastradas</p>
            </div>
            <Button onClick={() => navigate('/brands')} variant="outline" size="sm">
              Ver todas
            </Button>
          </div>

          {brandsData.topBrands.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium">Top 3 por Score:</p>
              {brandsData.topBrands.map((brand, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-accent/5">
                  <span className="text-sm">{brand.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{brand.score}</span>
                    {brand.score >= 50 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma marca cadastrada</p>
          <Button onClick={() => navigate('/brands')} className="mt-4" size="sm">
            Adicionar Marca
          </Button>
        </div>
      )}
    </DashboardWidget>
  );
}

export const WidgetBrandsOverview = memo(WidgetBrandsOverviewComponent);
