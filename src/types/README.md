# TypeScript Types & Interfaces

Tipagens TypeScript centralizadas para todo o projeto.

## 📁 Estrutura

```
src/types/
├── index.ts              # Export central de todos os tipos
├── common.ts             # Tipos comuns e reutilizáveis
├── brand.ts              # Tipos relacionados a marcas
├── user.ts               # Tipos de usuário e autenticação
├── analytics.ts          # Métricas e analytics
├── api.ts                # Requisições e respostas de API
├── dashboard.ts          # Dashboard e widgets
├── insights.ts           # Insights e IA
├── subscription.ts       # Assinaturas e planos
├── alerts.ts             # Alertas e notificações
└── url-analysis.ts       # Análise de URLs
```

## 🎯 Como Usar

### Import Individual
```tsx
import { Brand, GeoScore } from '@/types/brand';
import { User, Profile } from '@/types/user';
```

### Import Central (Recomendado)
```tsx
import { Brand, User, AlertPriority, ApiResponse } from '@/types';
```

## 📝 Exemplos de Uso

### Componentes
```tsx
import { Brand, GeoScore } from '@/types';

interface BrandCardProps {
  brand: Brand;
  score: GeoScore;
  onEdit: (brand: Brand) => void;
}

export function BrandCard({ brand, score, onEdit }: BrandCardProps) {
  return (
    <Card>
      <h3>{brand.name}</h3>
      <p>Score: {score.overall_score}</p>
      <Button onClick={() => onEdit(brand)}>Edit</Button>
    </Card>
  );
}
```

### API Calls
```tsx
import { ApiResponse, Brand } from '@/types';
import { supabase } from '@/integrations/supabase/client';

async function fetchBrands(): Promise<ApiResponse<Brand[]>> {
  const { data, error } = await supabase
    .from('brands')
    .select('*');
    
  if (error) {
    return { data: [], error: error.message };
  }
  
  return { data: data as Brand[] };
}
```

### Hooks
```tsx
import { Brand, GeoScore } from '@/types';
import { useState } from 'react';

export function useBrandData() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [scores, setScores] = useState<GeoScore[]>([]);
  
  // ... resto do hook
  
  return { brands, scores };
}
```

## 🔄 Tipos Reutilizáveis

### Common Types
- `Priority`: 'low' | 'medium' | 'high' | 'critical'
- `Status`: 'pending' | 'in_progress' | 'completed' | 'failed'
- `DataSource`: 'manual' | 'google_analytics' | 'google_search_console' | 'api'
- `ErrorSeverity`: 'low' | 'medium' | 'high' | 'critical'

### Base Entities
```tsx
interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}
```

Todos os tipos principais estendem `BaseEntity` para garantir consistência.

## ✅ Benefícios

1. **Type Safety**: Detecta erros em tempo de compilação
2. **Autocomplete**: Melhor DX com sugestões automáticas
3. **Documentação**: Tipos servem como documentação viva
4. **Refatoração**: Mudanças propagam automaticamente
5. **Consistência**: Estruturas de dados unificadas
6. **Manutenibilidade**: Fácil localizar e atualizar tipos

## 🚀 Boas Práticas

1. **Sempre use tipos importados** ao invés de definir inline
2. **Prefira interfaces para objetos** e types para unions
3. **Estenda BaseEntity** quando apropriado
4. **Use tipos específicos** ao invés de `any`
5. **Documente tipos complexos** com JSDoc
6. **Agrupe tipos relacionados** no mesmo arquivo

## 📚 Referências

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
