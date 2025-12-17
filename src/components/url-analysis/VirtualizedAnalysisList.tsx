import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalysisItem {
  id: string;
  url: string;
  created_at: string;
  overall_score: number;
  geo_score: number;
  seo_score: number;
  summary: string;
}

interface VirtualizedAnalysisListProps {
  items: AnalysisItem[];
  onItemClick?: (item: AnalysisItem) => void;
}

export function VirtualizedAnalysisList({ items, onItemClick }: VirtualizedAnalysisListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 5,
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreTrend = (geoScore: number, seoScore: number) => {
    const diff = geoScore - seoScore;
    if (diff > 10) return { icon: TrendingUp, color: 'text-green-600', label: 'GEO > SEO' };
    if (diff < -10) return { icon: TrendingDown, color: 'text-red-600', label: 'SEO > GEO' };
    return { icon: Minus, color: 'text-gray-600', label: 'Equilibrado' };
  };

  return (
    <div
      ref={parentRef}
      className="max-h-[600px] overflow-auto space-y-4"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          const trend = getScoreTrend(item.geo_score, item.seo_score);
          const TrendIcon = trend.icon;

          return (
            <Card
              key={virtualRow.key}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onClick={() => onItemClick?.(item)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={item.url}>
                      {item.url}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <TrendIcon className={`w-3 h-3 ${trend.color}`} />
                      <span className="text-xs">{trend.label}</span>
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Overall</p>
                    <p className={`text-xl font-bold ${getScoreColor(item.overall_score)}`}>
                      {item.overall_score}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">GEO</p>
                    <p className={`text-xl font-bold ${getScoreColor(item.geo_score)}`}>
                      {item.geo_score}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">SEO</p>
                    <p className={`text-xl font-bold ${getScoreColor(item.seo_score)}`}>
                      {item.seo_score}
                    </p>
                  </div>
                </div>

                <Progress value={item.overall_score} className="h-2" />

                {item.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.summary}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
