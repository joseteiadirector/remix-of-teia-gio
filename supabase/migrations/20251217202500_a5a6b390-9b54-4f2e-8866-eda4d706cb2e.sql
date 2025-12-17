-- PARTE 2: Funções helper para verificação de roles

-- Função para verificar múltiplos roles de uma vez
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Função: pode editar (admin, agency_manager, editor)
CREATE OR REPLACE FUNCTION public.can_edit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT public.has_any_role(_user_id, ARRAY['admin', 'agency_manager', 'editor']::app_role[])
$$;

-- Função: pode visualizar (qualquer role)
CREATE OR REPLACE FUNCTION public.can_view(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Função: pode gerenciar (admin, agency_manager)
CREATE OR REPLACE FUNCTION public.can_manage(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT public.has_any_role(_user_id, ARRAY['admin', 'agency_manager']::app_role[])
$$;

-- Função: pode analisar (admin, agency_manager, editor, analyst)
CREATE OR REPLACE FUNCTION public.can_analyze(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT public.has_any_role(_user_id, ARRAY['admin', 'agency_manager', 'editor', 'analyst']::app_role[])
$$;