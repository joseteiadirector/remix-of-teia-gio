# REQUISITOS CRÍTICOS DA PLATAFORMA TEIA GEO

## Data: 2025-12-04

## REGRA FUNDAMENTAL: AUTONOMIA DA PLATAFORMA

A plataforma DEVE ser 100% autônoma:

### 1. Consistência de Cálculos
- **TODAS as marcas** (existentes e futuras) DEVEM usar os MESMOS cálculos
- Fórmulas KAPI: ICE, GAP, CPI, Stability - centralizadas em `src/config/kapiMetrics.ts`
- Fórmulas GEO/SEO/IGO - mesma lógica para qualquer marca
- **A RECEITA NÃO MUDA** independente da marca

### 2. Visibilidade ≠ Lógica
- `is_visible` é apenas um FILTRO de exibição
- Mudar visibilidade NÃO afeta cálculos
- Deletar uma marca NÃO quebra a plataforma
- Adicionar nova marca → triggers automáticos aplicam MESMA configuração

### 3. Sincronização Obrigatória
- **SEMPRE** sincronizar código E banco de dados simultaneamente
- **NUNCA** fazer mudança parcial (código sem banco ou vice-versa)
- Arquivos de configuração:
  - `src/config/brandVisibility.ts` - controle de código
  - `brands.is_visible` - controle de banco

### 4. Triggers Automáticos (já implementados)
- `auto_create_brand_automations` - cria automações para nova marca
- `auto_create_welcome_alert` - cria alerta de boas-vindas
- `sync_cpi_on_igo` - sincroniza CPI quando IGO muda
- `cascade_metric_changes` - propaga mudanças de métricas

## COMPROMISSO
Este documento serve como referência permanente para garantir consistência da plataforma.
