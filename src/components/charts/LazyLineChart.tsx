import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const LineChart = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.LineChart 
  }))
);

const Line = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.Line 
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

interface LazyLineChartProps {
  data: any[];
  dataKeys: string[];
  height?: number;
  colors?: string[];
}

export function LazyLineChart({ data, dataKeys, height = 300, colors = ['#8884d8', '#82ca9d'] }: LazyLineChartProps) {
  return (
    <Suspense fallback={<Skeleton className="w-full" style={{ height }} />}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Suspense>
  );
}
