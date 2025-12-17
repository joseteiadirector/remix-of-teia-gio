-- =============================================
-- TRIGGER: Atribuir role 'viewer' no signup
-- =============================================

CREATE OR REPLACE FUNCTION public.auto_assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Atribui role 'viewer' como padrão para novos usuários
  -- Apenas se o usuário ainda não tiver nenhum role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger no profiles (criado após signup via handle_new_user)
DROP TRIGGER IF EXISTS trg_auto_assign_role ON public.profiles;
CREATE TRIGGER trg_auto_assign_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_default_role();