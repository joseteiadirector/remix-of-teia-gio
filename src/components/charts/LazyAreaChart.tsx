import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AreaChart = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.AreaChart 
  }))
);

const Area = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.Area 
  }))
);

const XAxis = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.XAxis 
  }))
);

const YAxis = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.YAxis 
  }))
);

const CartesianGrid = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.CartesianGrid 
  }))
);

const Tooltip = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.Tooltip 
  }))
);

const Legend = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.Legend 
  }))
);

const ResponsiveContainer = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.ResponsiveContainer 
  }))
);

interface LazyAreaChartProps {
  data: any[];
  dataKeys: string[];
  height?: number;
  colors?: string[];
}

export function LazyAreaChart({ data, dataKeys, height = 300, colors = ['#8884d8', '#82ca9d'] }: LazyAreaChartProps) {
  return (
    <Suspense fallback={<Skeleton className="w-full" style={{ height }} />}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Suspense>
  );
}
