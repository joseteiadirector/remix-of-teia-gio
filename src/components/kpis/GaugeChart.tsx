import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface GaugeChartProps {
  value: number;
  maxValue?: number;
  title: string;
  subtitle?: string;
  color?: string;
  size?: number;
}

export function GaugeChart({ 
  value, 
  maxValue = 100, 
  title, 
  subtitle,
  color = 'hsl(var(--primary))',
  size = 200 
}: GaugeChartProps) {
  // Normalizar valor para 0-100
  const normalizedValue = Math.min(Math.max(value, 0), maxValue);
  const percentage = (normalizedValue / maxValue) * 100;
  
  // Dados para o gráfico (semicírculo)
  const data = [
    { name: 'value', value: percentage },
    { name: 'remaining', value: 100 - percentage }
  ];

  // Cores baseadas no valor com gradientes
  const getGradientColors = () => {
    if (percentage >= 80) return { 
      primary: '#10b981', 
      secondary: '#059669',
      glow: 'rgba(16, 185, 129, 0.3)' 
    };
    if (percentage >= 60) return { 
      primary: '#f59e0b', 
      secondary: '#d97706',
      glow: 'rgba(245, 158, 11, 0.3)' 
    };
    if (percentage >= 40) return { 
      primary: '#f97316', 
      secondary: '#ea580c',
      glow: 'rgba(249, 115, 22, 0.3)' 
    };
    return { 
      primary: '#ef4444', 
      secondary: '#dc2626',
      glow: 'rgba(239, 68, 68, 0.3)' 
    };
  };

  const colors = color === 'hsl(var(--primary))' ? getGradientColors() : {
    primary: color,
    secondary: color,
    glow: `${color}50`
  };

  // Calcular ângulo do ponteiro
  const needleAngle = 180 - (percentage * 1.8);

  return (
    <motion.div 
      className="flex flex-col items-center justify-center gap-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Valor acima do gráfico */}
      <motion.div 
        className="text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div 
          className="text-6xl font-bold tracking-tight"
          style={{ 
            color: colors.primary,
            textShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}`
          }}
        >
          {normalizedValue.toFixed(1)}
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            {subtitle}
          </div>
        )}
      </motion.div>
      
      {/* Gráfico velocímetro com efeito 3D */}
      <div 
        className="relative" 
        style={{ 
          width: size, 
          height: size * 0.5,
          filter: `drop-shadow(0 4px 12px ${colors.glow})`
        }}
      >
        {/* Fundo do gauge com gradiente */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 100%, ${colors.glow} 0%, transparent 70%)`,
            borderRadius: '50% 50% 0 0'
          }}
        />
        
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Camada de sombra */}
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.primary} />
                <stop offset="100%" stopColor={colors.secondary} />
              </linearGradient>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={size * 0.32}
              outerRadius={size * 0.46}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              <Cell fill={`url(#gradient-${title})`} />
              <Cell fill="hsl(var(--muted) / 0.3)" />
            </Pie>
            {/* Borda interna */}
            <Pie
              data={[{ value: 100 }]}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={size * 0.3}
              outerRadius={size * 0.32}
              dataKey="value"
              stroke="none"
              fill="hsl(var(--border))"
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Ponteiro do medidor */}
        <motion.div
          className="absolute bottom-0 left-1/2 origin-bottom"
          style={{
            width: '3px',
            height: size * 0.35,
            background: `linear-gradient(to top, ${colors.primary}, transparent)`,
            transform: `translateX(-50%) rotate(${needleAngle}deg)`,
            boxShadow: `0 0 10px ${colors.glow}`
          }}
          initial={{ rotate: 180 }}
          animate={{ rotate: needleAngle }}
          transition={{ delay: 0.3, duration: 1.5, ease: "easeOut" }}
        >
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: colors.primary,
              boxShadow: `0 0 15px ${colors.glow}, inset 0 0 5px rgba(255,255,255,0.5)`,
              border: '2px solid hsl(var(--background))'
            }}
          />
        </motion.div>
        
        {/* Marcações do medidor com glow */}
        <div className="absolute inset-0">
          {[0, 25, 50, 75, 100].map((mark, i) => {
            const angle = 180 - (mark * 1.8);
            const radius = size * 0.48;
            const x = radius * Math.cos((angle * Math.PI) / 180);
            const y = radius * Math.sin((angle * Math.PI) / 180);
            
            return (
              <div
                key={mark}
                className="absolute text-[10px] font-bold"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(100% - ${Math.abs(y)}px)`,
                  transform: 'translate(-50%, 50%)',
                  color: colors.primary,
                  textShadow: `0 0 8px ${colors.glow}, 0 0 12px ${colors.glow}`
                }}
              >
                {mark}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Título abaixo com linha decorativa */}
      <div className="text-center relative">
        <div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full"
          style={{ 
            background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)`,
            boxShadow: `0 0 8px ${colors.glow}`
          }}
        />
        <h3 className="font-bold text-sm text-foreground pt-2">{title}</h3>
      </div>
    </motion.div>
  );
}
