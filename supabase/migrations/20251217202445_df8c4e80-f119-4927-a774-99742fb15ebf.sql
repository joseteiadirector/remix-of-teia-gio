-- PARTE 1: Apenas adicionar os novos roles ao enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'analyst';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- Comentário documentando os roles
COMMENT ON TYPE public.app_role IS 'Roles: admin (tudo), agency_manager (gerencia múltiplas marcas), editor (cria/edita), analyst (visualiza/relatórios), viewer (apenas leitura)';