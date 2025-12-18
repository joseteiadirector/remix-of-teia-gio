-- =====================================================
-- SECURITY FIX: Limpar políticas duplicadas e garantir segurança
-- =====================================================

-- 1. Remover políticas duplicadas em alert_configs (manter as com nomes descritivos)
DROP POLICY IF EXISTS "alert_configs_delete_own" ON public.alert_configs;
DROP POLICY IF EXISTS "alert_configs_insert_own" ON public.alert_configs;
DROP POLICY IF EXISTS "alert_configs_select_own" ON public.alert_configs;
DROP POLICY IF EXISTS "alert_configs_update_own" ON public.alert_configs;

-- 2. Garantir que RLS está habilitado em todas tabelas sensíveis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_query_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- 3. Forçar RLS para todos (incluindo table owner) nas tabelas mais sensíveis
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- 4. Adicionar comentários de segurança para documentação
COMMENT ON TABLE public.profiles IS 'User profiles - contains PII. RLS enforces owner-only access.';
COMMENT ON TABLE public.alert_configs IS 'Alert configurations with email - RLS enforces owner-only access.';
COMMENT ON TABLE public.audit_logs IS 'System audit logs - admin-only access via RLS.';