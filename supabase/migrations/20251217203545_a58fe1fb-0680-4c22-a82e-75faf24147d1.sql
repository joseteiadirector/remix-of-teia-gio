-- =============================================
-- PARTE 1: CRIAR ENUMs PARA STATUS
-- =============================================

-- Enum para status de jobs/execuções
CREATE TYPE public.job_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Enum para status de documentos
CREATE TYPE public.document_status AS ENUM ('processing', 'completed', 'failed');

-- Enum para status de relatórios
CREATE TYPE public.report_status AS ENUM ('pending', 'generating', 'completed', 'failed');

-- =============================================
-- PARTE 2: FUNÇÃO - Auto set completed_at
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_set_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Se status mudou para 'completed' ou 'failed', preenche completed_at
  IF (NEW.status IN ('completed', 'failed')) AND 
     (OLD.status IS DISTINCT FROM NEW.status) AND
     (NEW.completed_at IS NULL) THEN
    NEW.completed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- =============================================
-- PARTE 3: FUNÇÃO - Auto calculate duration
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_calculate_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Se completou e tem started_at, calcula duration_ms
  IF (NEW.status IN ('completed', 'failed')) AND 
     (OLD.status IS DISTINCT FROM NEW.status) AND
     (NEW.started_at IS NOT NULL) AND
     (NEW.duration_ms IS NULL) THEN
    NEW.duration_ms := EXTRACT(EPOCH FROM (NOW() - NEW.started_at)) * 1000;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =============================================
-- PARTE 4: FUNÇÃO - Alerta automático em falha
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_alert_on_job_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  brand_name TEXT;
BEGIN
  -- Se status mudou para 'failed', cria alerta
  IF (NEW.status = 'failed') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Busca nome da marca se existir
    IF NEW.brand_id IS NOT NULL THEN
      SELECT name INTO brand_name FROM brands WHERE id = NEW.brand_id;
    END IF;
    
    INSERT INTO alerts_history (
      user_id, 
      brand_id, 
      alert_type, 
      title, 
      message, 
      priority,
      metadata
    ) VALUES (
      NEW.user_id,
      NEW.brand_id,
      'job_failure',
      'Falha na Automação: ' || NEW.job_type,
      COALESCE('Erro ao executar ' || NEW.job_type || ' para ' || brand_name || ': ' || NEW.error, 
               'Erro ao executar ' || NEW.job_type || ': ' || COALESCE(NEW.error, 'Erro desconhecido')),
      'high'::alert_priority,
      jsonb_build_object(
        'job_id', NEW.id,
        'job_type', NEW.job_type,
        'error', NEW.error,
        'started_at', NEW.started_at,
        'failed_at', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- =============================================
-- PARTE 5: FUNÇÃO - Validar transição de status
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_job_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Validar transições permitidas
  -- pending -> running
  -- running -> completed | failed
  -- completed/failed -> (não pode mudar)
  
  IF OLD.status = 'completed' OR OLD.status = 'failed' THEN
    -- Não permite mudar status de jobs finalizados
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Não é possível alterar status de job finalizado (% -> %)', OLD.status, NEW.status;
    END IF;
  END IF;
  
  IF OLD.status = 'pending' AND NEW.status NOT IN ('pending', 'running', 'failed') THEN
    RAISE EXCEPTION 'Transição de status inválida: pending -> %', NEW.status;
  END IF;
  
  IF OLD.status = 'running' AND NEW.status NOT IN ('running', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Transição de status inválida: running -> %', NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =============================================
-- PARTE 6: CRIAR TRIGGERS EM automation_jobs
-- =============================================

-- Trigger: auto completed_at
DROP TRIGGER IF EXISTS trg_auto_completed_at_jobs ON public.automation_jobs;
CREATE TRIGGER trg_auto_completed_at_jobs
  BEFORE UPDATE ON public.automation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_completed_at();

-- Trigger: auto duration
DROP TRIGGER IF EXISTS trg_auto_duration_jobs ON public.automation_jobs;
CREATE TRIGGER trg_auto_duration_jobs
  BEFORE UPDATE ON public.automation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_duration();

-- Trigger: alerta em falha
DROP TRIGGER IF EXISTS trg_alert_on_failure_jobs ON public.automation_jobs;
CREATE TRIGGER trg_alert_on_failure_jobs
  AFTER UPDATE ON public.automation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_alert_on_job_failure();

-- Trigger: validar transição
DROP TRIGGER IF EXISTS trg_validate_status_jobs ON public.automation_jobs;
CREATE TRIGGER trg_validate_status_jobs
  BEFORE UPDATE ON public.automation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_job_status_transition();

-- =============================================
-- PARTE 7: CRIAR TRIGGERS EM nucleus_executions
-- =============================================

-- Trigger: auto completed_at
DROP TRIGGER IF EXISTS trg_auto_completed_at_nucleus ON public.nucleus_executions;
CREATE TRIGGER trg_auto_completed_at_nucleus
  BEFORE UPDATE ON public.nucleus_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_completed_at();

-- Trigger: validar transição
DROP TRIGGER IF EXISTS trg_validate_status_nucleus ON public.nucleus_executions;
CREATE TRIGGER trg_validate_status_nucleus
  BEFORE UPDATE ON public.nucleus_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_job_status_transition();