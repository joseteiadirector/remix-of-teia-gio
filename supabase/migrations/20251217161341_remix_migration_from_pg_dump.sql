CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: alert_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.alert_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: task_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_category AS ENUM (
    'geo',
    'seo',
    'technical',
    'content',
    'performance'
);


--
-- Name: task_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_priority AS ENUM (
    'high',
    'medium',
    'low'
);


--
-- Name: task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_status AS ENUM (
    'pending',
    'in_progress',
    'completed'
);


--
-- Name: auto_create_brand_automations(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_create_brand_automations() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Cria automação de coleta de menções (diária)
  INSERT INTO automation_configs (user_id, brand_id, automation_type, frequency, enabled, schedule_time, next_run)
  VALUES (NEW.user_id, NEW.id, 'mentions_collection', 'daily', true, '08:00:00', NOW() + INTERVAL '1 day');
  
  -- Cria automação de métricas GEO (diária)
  INSERT INTO automation_configs (user_id, brand_id, automation_type, frequency, enabled, schedule_time, next_run)
  VALUES (NEW.user_id, NEW.id, 'geo_metrics', 'daily', true, '09:00:00', NOW() + INTERVAL '1 day');
  
  -- Cria automação de análise SEO (semanal)
  INSERT INTO automation_configs (user_id, brand_id, automation_type, frequency, enabled, schedule_time, next_run)
  VALUES (NEW.user_id, NEW.id, 'seo_analysis', 'weekly', true, '10:00:00', NOW() + INTERVAL '7 days');
  
  -- Cria automação de verificação de alertas (horária)
  INSERT INTO automation_configs (user_id, brand_id, automation_type, frequency, enabled, schedule_time, next_run)
  VALUES (NEW.user_id, NEW.id, 'alerts_check', 'hourly', true, NULL, NOW() + INTERVAL '1 hour');
  
  RETURN NEW;
END;
$$;


--
-- Name: auto_create_welcome_alert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_create_welcome_alert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO alerts_history (user_id, brand_id, alert_type, title, message, priority, read)
  VALUES (
    NEW.user_id, 
    NEW.id, 
    'system_welcome', 
    'Nova Marca Configurada: ' || NEW.name,
    'A marca ' || NEW.name || ' foi configurada com sucesso. Automações de coleta de menções, métricas GEO, análise SEO e alertas foram ativadas automaticamente.',
    'low',
    false
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: calculate_cpi_from_igo(numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_cpi_from_igo(p_ice numeric, p_gap numeric, p_stability numeric) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- GAP usa lógica inversa: menor GAP = melhor performance
  -- Normaliza GAP: (100 - GAP) para alinhar com lógica direta
  RETURN ROUND(
    (COALESCE(p_ice, 0) * 0.35) + 
    ((100 - COALESCE(p_gap, 0)) * 0.30) + 
    (COALESCE(p_stability, 0) * 0.35),
    1
  );
END;
$$;


--
-- Name: calculate_next_run(text, time without time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_next_run(frequency text, schedule_time time without time zone, last_run timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS timestamp with time zone
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  base_time TIMESTAMPTZ;
  next_time TIMESTAMPTZ;
BEGIN
  base_time := COALESCE(last_run, now());
  
  CASE frequency
    WHEN 'hourly' THEN
      next_time := base_time + INTERVAL '1 hour';
    WHEN 'daily' THEN
      next_time := (base_time::date + INTERVAL '1 day')::date + schedule_time;
      IF next_time <= base_time THEN
        next_time := next_time + INTERVAL '1 day';
      END IF;
    WHEN 'weekly' THEN
      next_time := (base_time::date + INTERVAL '7 days')::date + schedule_time;
      IF next_time <= base_time THEN
        next_time := next_time + INTERVAL '7 days';
      END IF;
    WHEN 'monthly' THEN
      next_time := (base_time::date + INTERVAL '1 month')::date + schedule_time;
      IF next_time <= base_time THEN
        next_time := next_time + INTERVAL '1 month';
      END IF;
    ELSE
      next_time := base_time + INTERVAL '1 hour';
  END CASE;
  
  RETURN next_time;
END;
$$;


--
-- Name: cascade_metric_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cascade_metric_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  brand_name TEXT;
  brand_user_id UUID;
  old_score NUMERIC;
  score_change NUMERIC;
BEGIN
  -- Busca informações da marca
  SELECT name, user_id INTO brand_name, brand_user_id
  FROM brands WHERE id = NEW.brand_id;
  
  -- Busca score anterior
  SELECT score INTO old_score
  FROM geo_scores 
  WHERE brand_id = NEW.brand_id AND id != NEW.id
  ORDER BY computed_at DESC LIMIT 1;
  
  -- Se houver mudança significativa (>5%), cria alerta
  IF old_score IS NOT NULL THEN
    score_change := ((NEW.score - old_score) / old_score) * 100;
    
    IF ABS(score_change) >= 5 THEN
      INSERT INTO alerts_history (user_id, brand_id, alert_type, title, message, priority)
      VALUES (
        brand_user_id,
        NEW.brand_id,
        CASE WHEN score_change > 0 THEN 'score_increase' ELSE 'score_decrease' END,
        CASE WHEN score_change > 0 
          THEN 'GEO Score em Alta: ' || brand_name
          ELSE 'GEO Score em Queda: ' || brand_name
        END,
        'O GEO Score mudou ' || ROUND(score_change, 1) || '% (de ' || ROUND(old_score, 1) || ' para ' || ROUND(NEW.score, 1) || ')',
        CASE WHEN ABS(score_change) >= 10 THEN 'high'::alert_priority ELSE 'medium'::alert_priority END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: clean_expired_cache(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clean_expired_cache() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  DELETE FROM public.llm_query_cache WHERE expires_at < now();
END;
$$;


--
-- Name: clean_old_function_logs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clean_old_function_logs() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  DELETE FROM public.function_calls_log 
  WHERE created_at < (now() - INTERVAL '1 hour');
END;
$$;


--
-- Name: cleanup_old_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_data() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  deleted_cache INT;
  deleted_logs INT;
  deleted_old_jobs INT;
BEGIN
  -- Authorization check: Only admins can perform cleanup
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Limpa cache expirado
  DELETE FROM llm_query_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_cache = ROW_COUNT;
  
  -- Limpa logs de funções antigos (mais de 24h)
  DELETE FROM function_calls_log WHERE created_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS deleted_logs = ROW_COUNT;
  
  -- Limpa jobs de automação concluídos há mais de 30 dias
  DELETE FROM automation_jobs WHERE completed_at < NOW() - INTERVAL '30 days' AND status = 'completed';
  GET DIAGNOSTICS deleted_old_jobs = ROW_COUNT;
  
  RETURN json_build_object(
    'timestamp', NOW(),
    'deleted_cache_entries', deleted_cache,
    'deleted_function_logs', deleted_logs,
    'deleted_old_jobs', deleted_old_jobs
  );
END;
$$;


--
-- Name: get_platform_health(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_platform_health() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  result JSON;
BEGIN
  -- Authorization check: Only admins can view platform health
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  SELECT json_build_object(
    'timestamp', NOW(),
    'status', 'healthy',
    'metrics', json_build_object(
      'total_brands', (SELECT COUNT(*) FROM brands),
      'active_brands', (SELECT COUNT(*) FROM brands WHERE is_visible = true),
      'total_automations', (SELECT COUNT(*) FROM automation_configs WHERE enabled = true),
      'total_alerts', (SELECT COUNT(*) FROM alerts_history),
      'unread_alerts', (SELECT COUNT(*) FROM alerts_history WHERE read = false),
      'total_mentions', (SELECT COUNT(*) FROM mentions_llm),
      'total_geo_scores', (SELECT COUNT(*) FROM geo_scores),
      'total_igo_metrics', (SELECT COUNT(*) FROM igo_metrics_history)
    ),
    'last_activities', json_build_object(
      'last_mention', (SELECT MAX(collected_at) FROM mentions_llm),
      'last_geo_score', (SELECT MAX(computed_at) FROM geo_scores),
      'last_igo_metric', (SELECT MAX(calculated_at) FROM igo_metrics_history),
      'last_automation_run', (SELECT MAX(last_run) FROM automation_configs)
    )
  ) INTO result;
  
  RETURN result;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: log_gsc_operation(text, uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_gsc_operation(_operation text, _brand_id uuid, _edge_function text, _metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  _audit_id UUID;
BEGIN
  INSERT INTO public.gsc_queries_audit (
    operation,
    brand_id,
    edge_function,
    metadata
  ) VALUES (
    _operation,
    _brand_id,
    _edge_function,
    _metadata
  )
  RETURNING id INTO _audit_id;
  
  RETURN _audit_id;
END;
$$;


--
-- Name: sync_brand_statistics(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_brand_statistics(p_brand_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  result JSON;
BEGIN
  -- Authorization check: User must own the brand OR be admin
  IF NOT EXISTS (
    SELECT 1 FROM brands 
    WHERE id = p_brand_id AND user_id = auth.uid()
  ) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: You do not have access to this brand';
  END IF;

  SELECT json_build_object(
    'brand_id', p_brand_id,
    'synced_at', NOW(),
    'statistics', json_build_object(
      'total_mentions', (SELECT COUNT(*) FROM mentions_llm WHERE brand_id = p_brand_id),
      'positive_mentions', (SELECT COUNT(*) FROM mentions_llm WHERE brand_id = p_brand_id AND mentioned = true),
      'latest_geo_score', (SELECT score FROM geo_scores WHERE brand_id = p_brand_id ORDER BY computed_at DESC LIMIT 1),
      'latest_cpi', (SELECT cpi FROM geo_scores WHERE brand_id = p_brand_id ORDER BY computed_at DESC LIMIT 1),
      'latest_ice', (SELECT ice FROM igo_metrics_history WHERE brand_id = p_brand_id ORDER BY calculated_at DESC LIMIT 1),
      'latest_gap', (SELECT gap FROM igo_metrics_history WHERE brand_id = p_brand_id ORDER BY calculated_at DESC LIMIT 1),
      'latest_stability', (SELECT cognitive_stability FROM igo_metrics_history WHERE brand_id = p_brand_id ORDER BY calculated_at DESC LIMIT 1),
      'active_automations', (SELECT COUNT(*) FROM automation_configs WHERE brand_id = p_brand_id AND enabled = true)
    )
  ) INTO result;
  
  RETURN result;
END;
$$;


--
-- Name: sync_cpi_on_geo_score_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_cpi_on_geo_score_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  latest_cpi NUMERIC;
BEGIN
  -- Busca o CPI mais recente da igo_metrics_history para esta brand
  SELECT cpi INTO latest_cpi
  FROM igo_metrics_history
  WHERE brand_id = NEW.brand_id
  ORDER BY calculated_at DESC
  LIMIT 1;
  
  -- Se encontrou CPI, atualiza o registro
  IF latest_cpi IS NOT NULL AND latest_cpi > 0 THEN
    NEW.cpi := latest_cpi;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: sync_cpi_on_igo_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_cpi_on_igo_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  calculated_cpi NUMERIC;
BEGIN
  -- Calcula CPI usando a fórmula padronizada
  calculated_cpi := calculate_cpi_from_igo(NEW.ice, NEW.gap, NEW.cognitive_stability);
  
  -- Atualiza o CPI no registro mais recente de geo_scores para esta brand
  UPDATE geo_scores
  SET cpi = calculated_cpi
  WHERE brand_id = NEW.brand_id
  AND computed_at = (
    SELECT MAX(computed_at) 
    FROM geo_scores 
    WHERE brand_id = NEW.brand_id
  );
  
  -- Se não houver geo_score para esta brand, o CPI será 0 até criar um
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: validate_gsc_access(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_gsc_access() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Validar que o brand_id pertence ao usuário autenticado
  IF NOT EXISTS (
    SELECT 1 FROM public.brands 
    WHERE id = NEW.brand_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to brand data';
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: validate_platform_consistency(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_platform_consistency() RETURNS TABLE(check_name text, status text, details text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Authorization check: Only admins can run platform validation
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Check 1: Brands sem automações
  RETURN QUERY
  SELECT 
    'brands_without_automations'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END::TEXT,
    ('Brands sem automações: ' || COUNT(*))::TEXT
  FROM brands b
  WHERE NOT EXISTS (SELECT 1 FROM automation_configs ac WHERE ac.brand_id = b.id);
  
  -- Check 2: GEO scores sem CPI
  RETURN QUERY
  SELECT 
    'geo_scores_without_cpi'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END::TEXT,
    ('GEO scores com CPI=0: ' || COUNT(*))::TEXT
  FROM geo_scores WHERE cpi IS NULL OR cpi = 0;
  
  -- Check 3: Brands sem menções
  RETURN QUERY
  SELECT 
    'brands_without_mentions'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'INFO' END::TEXT,
    ('Brands sem menções: ' || COUNT(*))::TEXT
  FROM brands b
  WHERE NOT EXISTS (SELECT 1 FROM mentions_llm m WHERE m.brand_id = b.id);
  
  -- Check 4: Automações pendentes vencidas
  RETURN QUERY
  SELECT 
    'overdue_automations'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END::TEXT,
    ('Automações vencidas: ' || COUNT(*))::TEXT
  FROM automation_configs 
  WHERE enabled = true AND next_run < NOW() - INTERVAL '1 day';
END;
$$;


--
-- Name: verify_admin_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_admin_role() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;


SET default_table_access_method = heap;

--
-- Name: ai_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    content jsonb NOT NULL,
    brand_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_insights_type_check CHECK ((type = ANY (ARRAY['prediction'::text, 'suggestion'::text, 'report'::text, 'summary'::text])))
);


--
-- Name: alert_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alert_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    score_decrease boolean DEFAULT true,
    score_increase boolean DEFAULT true,
    weekly_report boolean DEFAULT true,
    new_mention boolean DEFAULT false,
    threshold_alert boolean DEFAULT true,
    threshold_value numeric DEFAULT 15.0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    priority public.alert_priority DEFAULT 'medium'::public.alert_priority NOT NULL
);


--
-- Name: alerts_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid,
    alert_type text NOT NULL,
    priority public.alert_priority DEFAULT 'medium'::public.alert_priority NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: automation_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid,
    automation_type text NOT NULL,
    enabled boolean DEFAULT true,
    frequency text NOT NULL,
    schedule_time time without time zone,
    last_run timestamp with time zone,
    next_run timestamp with time zone,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT automation_configs_automation_type_check CHECK ((automation_type = ANY (ARRAY['mentions_collection'::text, 'seo_analysis'::text, 'geo_metrics'::text, 'weekly_report'::text, 'alerts_check'::text]))),
    CONSTRAINT automation_configs_frequency_check CHECK ((frequency = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text, 'monthly'::text])))
);


--
-- Name: automation_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_id uuid,
    user_id uuid NOT NULL,
    brand_id uuid,
    job_type text NOT NULL,
    status text NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    duration_ms integer,
    result jsonb DEFAULT '{}'::jsonb,
    error text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT automation_jobs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: backup_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    backup_date timestamp with time zone DEFAULT now() NOT NULL,
    status text NOT NULL,
    total_tables integer DEFAULT 0 NOT NULL,
    total_records bigint DEFAULT 0 NOT NULL,
    failed_tables text[] DEFAULT ARRAY[]::text[],
    duration_ms integer,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT backup_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text, 'partial'::text])))
);


--
-- Name: brand_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer NOT NULL,
    mime_type text DEFAULT 'application/pdf'::text NOT NULL,
    status text DEFAULT 'processing'::text NOT NULL,
    total_chunks integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT brand_documents_status_check CHECK ((status = ANY (ARRAY['processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    domain text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    description text,
    context text,
    is_visible boolean DEFAULT true NOT NULL
);


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);


--
-- Name: competitor_comparisons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competitor_comparisons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    main_url text NOT NULL,
    competitor_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    analysis_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dashboard_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    widgets jsonb DEFAULT '[]'::jsonb NOT NULL,
    layout jsonb DEFAULT '{"cols": 12, "rowHeight": 100}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    content_length integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: function_calls_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.function_calls_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    function_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: generated_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    report_type text NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    email_sent boolean DEFAULT false NOT NULL,
    CONSTRAINT generated_reports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: geo_pillars_monthly; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_pillars_monthly (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_id uuid NOT NULL,
    month_year date NOT NULL,
    base_tecnica numeric(5,2) NOT NULL,
    estrutura_semantica numeric(5,2) NOT NULL,
    relevancia_conversacional numeric(5,2) NOT NULL,
    autoridade_cognitiva numeric(5,2) NOT NULL,
    inteligencia_estrategica numeric(5,2) NOT NULL,
    geo_score_final numeric(5,2) NOT NULL,
    total_mentions integer DEFAULT 0,
    total_queries integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: geo_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_scores (
    id bigint NOT NULL,
    brand_id uuid NOT NULL,
    score numeric NOT NULL,
    breakdown jsonb NOT NULL,
    computed_at timestamp with time zone DEFAULT now(),
    cpi numeric DEFAULT 0
);

ALTER TABLE ONLY public.geo_scores REPLICA IDENTITY FULL;


--
-- Name: geo_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.geo_scores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: geo_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.geo_scores_id_seq OWNED BY public.geo_scores.id;


--
-- Name: gsc_queries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gsc_queries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_id uuid NOT NULL,
    query text NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    impressions integer DEFAULT 0 NOT NULL,
    ctr numeric DEFAULT 0 NOT NULL,
    "position" numeric DEFAULT 0 NOT NULL,
    collected_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gsc_queries_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gsc_queries_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    operation text NOT NULL,
    brand_id uuid NOT NULL,
    edge_function text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hallucination_detections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hallucination_detections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    execution_id uuid,
    brand_id uuid,
    user_id uuid NOT NULL,
    detection_results jsonb NOT NULL,
    critical_count integer DEFAULT 0,
    avg_risk_score numeric(5,2),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: igo_metrics_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.igo_metrics_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_id uuid NOT NULL,
    ice numeric DEFAULT 0 NOT NULL,
    gap numeric DEFAULT 0 NOT NULL,
    cpi numeric DEFAULT 0 NOT NULL,
    cognitive_stability numeric DEFAULT 0 NOT NULL,
    confidence_interval numeric,
    metadata jsonb DEFAULT '{}'::jsonb,
    calculated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: llm_query_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_query_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    query_hash text NOT NULL,
    query_text text NOT NULL,
    provider text NOT NULL,
    response text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    hit_count integer DEFAULT 1 NOT NULL,
    user_id uuid
);


--
-- Name: mentions_llm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentions_llm (
    id bigint NOT NULL,
    brand_id uuid NOT NULL,
    provider text NOT NULL,
    query text NOT NULL,
    mentioned boolean NOT NULL,
    confidence numeric NOT NULL,
    answer_excerpt text,
    collected_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.mentions_llm REPLICA IDENTITY FULL;


--
-- Name: mentions_llm_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mentions_llm_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mentions_llm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mentions_llm_id_seq OWNED BY public.mentions_llm.id;


--
-- Name: nucleus_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nucleus_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    query_id uuid,
    brand_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    results jsonb DEFAULT '{}'::jsonb,
    total_queries integer DEFAULT 0,
    total_mentions integer DEFAULT 0,
    llms_used jsonb DEFAULT '[]'::jsonb,
    error text,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT nucleus_executions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: nucleus_queries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nucleus_queries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid,
    title text NOT NULL,
    query_text text NOT NULL,
    keywords jsonb DEFAULT '[]'::jsonb,
    selected_llms jsonb DEFAULT '["chatgpt", "gemini", "claude", "perplexity"]'::jsonb,
    is_template boolean DEFAULT false,
    is_active boolean DEFAULT true,
    category text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    company text,
    job_title text,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: recommendation_checklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recommendation_checklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid,
    recommendation_type text NOT NULL,
    recommendation_title text NOT NULL,
    recommendation_description text,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    estimated_impact numeric,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT recommendation_checklist_priority_check CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text, 'info'::text]))),
    CONSTRAINT recommendation_checklist_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'dismissed'::text])))
);


--
-- Name: recommendation_impact; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recommendation_impact (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recommendation_id uuid,
    brand_id uuid,
    user_id uuid NOT NULL,
    metric_name text NOT NULL,
    before_value numeric,
    after_value numeric,
    improvement_percentage numeric,
    measured_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: report_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    audit_date timestamp with time zone DEFAULT now() NOT NULL,
    kpi_data jsonb,
    seo_metrics_data jsonb,
    geo_metrics_data jsonb,
    complete_report_data jsonb,
    validation_results jsonb DEFAULT '[]'::jsonb NOT NULL,
    inconsistencies_found integer DEFAULT 0 NOT NULL,
    max_divergence_percentage numeric(5,2) DEFAULT 0,
    status text DEFAULT 'completed'::text NOT NULL,
    audit_pdf_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT report_audits_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: scheduled_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid,
    notification_type text NOT NULL,
    enabled boolean DEFAULT true,
    frequency text NOT NULL,
    schedule_day integer,
    schedule_time time without time zone NOT NULL,
    last_sent timestamp with time zone,
    next_send timestamp with time zone,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT scheduled_notifications_frequency_check CHECK ((frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text]))),
    CONSTRAINT scheduled_notifications_notification_type_check CHECK ((notification_type = ANY (ARRAY['weekly_report'::text, 'alert'::text, 'milestone'::text, 'threshold_breach'::text]))),
    CONSTRAINT scheduled_notifications_schedule_day_check CHECK (((schedule_day >= 0) AND (schedule_day <= 6)))
);


--
-- Name: scheduled_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    report_type text NOT NULL,
    frequency text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    last_run timestamp with time zone,
    next_run timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scheduled_reports_frequency_check CHECK ((frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text]))),
    CONSTRAINT scheduled_reports_report_type_check CHECK ((report_type = ANY (ARRAY['comprehensive'::text, 'weekly'::text, 'monthly'::text])))
);


--
-- Name: scientific_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scientific_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid,
    report_type text NOT NULL,
    period_days integer NOT NULL,
    report_data jsonb NOT NULL,
    generated_at timestamp with time zone DEFAULT now()
);


--
-- Name: seo_metrics_daily; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_metrics_daily (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_id uuid NOT NULL,
    date date NOT NULL,
    organic_traffic integer,
    ctr numeric,
    avg_position numeric,
    conversion_rate numeric,
    total_clicks integer,
    total_impressions integer,
    collected_at timestamp with time zone DEFAULT now() NOT NULL,
    seo_score numeric DEFAULT 0
);

ALTER TABLE ONLY public.seo_metrics_daily REPLICA IDENTITY FULL;


--
-- Name: signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signals (
    id bigint NOT NULL,
    brand_id uuid NOT NULL,
    kind text NOT NULL,
    metric text NOT NULL,
    value numeric NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb,
    collected_at timestamp with time zone DEFAULT now()
);


--
-- Name: signals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.signals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: signals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.signals_id_seq OWNED BY public.signals.id;


--
-- Name: url_analysis_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.url_analysis_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    url text NOT NULL,
    overall_score numeric NOT NULL,
    geo_score numeric NOT NULL,
    seo_score numeric NOT NULL,
    summary text,
    analysis_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    brand_id uuid
);


--
-- Name: url_monitoring_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.url_monitoring_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    url text NOT NULL,
    frequency text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    last_run timestamp with time zone,
    next_run timestamp with time zone,
    alert_on_drop boolean DEFAULT true NOT NULL,
    alert_threshold numeric DEFAULT 10.0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: url_optimization_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.url_optimization_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    analysis_id uuid,
    url text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    priority public.task_priority DEFAULT 'medium'::public.task_priority NOT NULL,
    category public.task_category NOT NULL,
    status public.task_status DEFAULT 'pending'::public.task_status NOT NULL,
    estimated_impact numeric,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: geo_scores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_scores ALTER COLUMN id SET DEFAULT nextval('public.geo_scores_id_seq'::regclass);


--
-- Name: mentions_llm id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentions_llm ALTER COLUMN id SET DEFAULT nextval('public.mentions_llm_id_seq'::regclass);


--
-- Name: signals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signals ALTER COLUMN id SET DEFAULT nextval('public.signals_id_seq'::regclass);


--
-- Name: ai_insights ai_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_pkey PRIMARY KEY (id);


--
-- Name: alert_configs alert_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_configs
    ADD CONSTRAINT alert_configs_pkey PRIMARY KEY (id);


--
-- Name: alert_configs alert_configs_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_configs
    ADD CONSTRAINT alert_configs_user_id_key UNIQUE (user_id);


--
-- Name: alerts_history alerts_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts_history
    ADD CONSTRAINT alerts_history_pkey PRIMARY KEY (id);


--
-- Name: automation_configs automation_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_configs
    ADD CONSTRAINT automation_configs_pkey PRIMARY KEY (id);


--
-- Name: automation_jobs automation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_jobs
    ADD CONSTRAINT automation_jobs_pkey PRIMARY KEY (id);


--
-- Name: backup_logs backup_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_logs
    ADD CONSTRAINT backup_logs_pkey PRIMARY KEY (id);


--
-- Name: brand_documents brand_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_documents
    ADD CONSTRAINT brand_documents_pkey PRIMARY KEY (id);


--
-- Name: brands brands_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_domain_key UNIQUE (domain);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: competitor_comparisons competitor_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitor_comparisons
    ADD CONSTRAINT competitor_comparisons_pkey PRIMARY KEY (id);


--
-- Name: dashboard_configs dashboard_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_configs
    ADD CONSTRAINT dashboard_configs_pkey PRIMARY KEY (id);


--
-- Name: dashboard_configs dashboard_configs_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_configs
    ADD CONSTRAINT dashboard_configs_user_id_key UNIQUE (user_id);


--
-- Name: document_chunks document_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_pkey PRIMARY KEY (id);


--
-- Name: function_calls_log function_calls_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.function_calls_log
    ADD CONSTRAINT function_calls_log_pkey PRIMARY KEY (id);


--
-- Name: generated_reports generated_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_reports
    ADD CONSTRAINT generated_reports_pkey PRIMARY KEY (id);


--
-- Name: geo_pillars_monthly geo_pillars_monthly_brand_id_month_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_pillars_monthly
    ADD CONSTRAINT geo_pillars_monthly_brand_id_month_year_key UNIQUE (brand_id, month_year);


--
-- Name: geo_pillars_monthly geo_pillars_monthly_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_pillars_monthly
    ADD CONSTRAINT geo_pillars_monthly_pkey PRIMARY KEY (id);


--
-- Name: geo_scores geo_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_scores
    ADD CONSTRAINT geo_scores_pkey PRIMARY KEY (id);


--
-- Name: gsc_queries_audit gsc_queries_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_queries_audit
    ADD CONSTRAINT gsc_queries_audit_pkey PRIMARY KEY (id);


--
-- Name: gsc_queries gsc_queries_brand_id_query_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_queries
    ADD CONSTRAINT gsc_queries_brand_id_query_key UNIQUE (brand_id, query);


--
-- Name: gsc_queries gsc_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_queries
    ADD CONSTRAINT gsc_queries_pkey PRIMARY KEY (id);


--
-- Name: hallucination_detections hallucination_detections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hallucination_detections
    ADD CONSTRAINT hallucination_detections_pkey PRIMARY KEY (id);


--
-- Name: igo_metrics_history igo_metrics_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.igo_metrics_history
    ADD CONSTRAINT igo_metrics_history_pkey PRIMARY KEY (id);


--
-- Name: llm_query_cache llm_query_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_query_cache
    ADD CONSTRAINT llm_query_cache_pkey PRIMARY KEY (id);


--
-- Name: llm_query_cache llm_query_cache_query_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_query_cache
    ADD CONSTRAINT llm_query_cache_query_hash_key UNIQUE (query_hash);


--
-- Name: mentions_llm mentions_llm_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentions_llm
    ADD CONSTRAINT mentions_llm_pkey PRIMARY KEY (id);


--
-- Name: nucleus_executions nucleus_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nucleus_executions
    ADD CONSTRAINT nucleus_executions_pkey PRIMARY KEY (id);


--
-- Name: nucleus_queries nucleus_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nucleus_queries
    ADD CONSTRAINT nucleus_queries_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: recommendation_checklist recommendation_checklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_checklist
    ADD CONSTRAINT recommendation_checklist_pkey PRIMARY KEY (id);


--
-- Name: recommendation_impact recommendation_impact_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_impact
    ADD CONSTRAINT recommendation_impact_pkey PRIMARY KEY (id);


--
-- Name: report_audits report_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_audits
    ADD CONSTRAINT report_audits_pkey PRIMARY KEY (id);


--
-- Name: scheduled_notifications scheduled_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_notifications
    ADD CONSTRAINT scheduled_notifications_pkey PRIMARY KEY (id);


--
-- Name: scheduled_reports scheduled_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reports
    ADD CONSTRAINT scheduled_reports_pkey PRIMARY KEY (id);


--
-- Name: scientific_reports scientific_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scientific_reports
    ADD CONSTRAINT scientific_reports_pkey PRIMARY KEY (id);


--
-- Name: seo_metrics_daily seo_metrics_daily_brand_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_metrics_daily
    ADD CONSTRAINT seo_metrics_daily_brand_id_date_key UNIQUE (brand_id, date);


--
-- Name: seo_metrics_daily seo_metrics_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_metrics_daily
    ADD CONSTRAINT seo_metrics_daily_pkey PRIMARY KEY (id);


--
-- Name: signals signals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signals
    ADD CONSTRAINT signals_pkey PRIMARY KEY (id);


--
-- Name: url_analysis_history url_analysis_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.url_analysis_history
    ADD CONSTRAINT url_analysis_history_pkey PRIMARY KEY (id);


--
-- Name: url_monitoring_schedules url_monitoring_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.url_monitoring_schedules
    ADD CONSTRAINT url_monitoring_schedules_pkey PRIMARY KEY (id);


--
-- Name: url_optimization_tasks url_optimization_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.url_optimization_tasks
    ADD CONSTRAINT url_optimization_tasks_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_ai_insights_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_insights_brand_id ON public.ai_insights USING btree (brand_id);


--
-- Name: idx_ai_insights_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_insights_created_at ON public.ai_insights USING btree (created_at DESC);


--
-- Name: idx_ai_insights_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_insights_type ON public.ai_insights USING btree (type);


--
-- Name: idx_ai_insights_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_insights_user_created ON public.ai_insights USING btree (user_id, created_at DESC);


--
-- Name: idx_ai_insights_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_insights_user_id ON public.ai_insights USING btree (user_id);


--
-- Name: idx_ai_insights_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_insights_user_type ON public.ai_insights USING btree (user_id, type, created_at DESC);


--
-- Name: idx_alert_configs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alert_configs_user_id ON public.alert_configs USING btree (user_id);


--
-- Name: idx_alerts_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_history_created_at ON public.alerts_history USING btree (created_at DESC);


--
-- Name: idx_alerts_history_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_history_priority ON public.alerts_history USING btree (priority, created_at DESC);


--
-- Name: idx_alerts_history_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_history_read ON public.alerts_history USING btree (read) WHERE (read = false);


--
-- Name: idx_alerts_history_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_history_user_created ON public.alerts_history USING btree (user_id, created_at DESC);


--
-- Name: idx_alerts_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_history_user_id ON public.alerts_history USING btree (user_id);


--
-- Name: idx_alerts_history_user_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_history_user_read ON public.alerts_history USING btree (user_id, read);


--
-- Name: idx_automation_configs_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_configs_brand_id ON public.automation_configs USING btree (brand_id);


--
-- Name: idx_automation_configs_next_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_configs_next_run ON public.automation_configs USING btree (next_run) WHERE (enabled = true);


--
-- Name: idx_automation_configs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_configs_user_id ON public.automation_configs USING btree (user_id);


--
-- Name: idx_automation_jobs_config_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_jobs_config_id ON public.automation_jobs USING btree (config_id);


--
-- Name: idx_automation_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_jobs_status ON public.automation_jobs USING btree (status);


--
-- Name: idx_automation_jobs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_jobs_user_id ON public.automation_jobs USING btree (user_id);


--
-- Name: idx_backup_logs_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backup_logs_date ON public.backup_logs USING btree (backup_date DESC);


--
-- Name: idx_backup_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backup_logs_status ON public.backup_logs USING btree (status);


--
-- Name: idx_brand_documents_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brand_documents_brand_id ON public.brand_documents USING btree (brand_id);


--
-- Name: idx_brand_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brand_documents_status ON public.brand_documents USING btree (status);


--
-- Name: idx_brand_documents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brand_documents_user_id ON public.brand_documents USING btree (user_id);


--
-- Name: idx_brands_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_created_at ON public.brands USING btree (created_at DESC);


--
-- Name: idx_brands_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_domain ON public.brands USING btree (domain);


--
-- Name: idx_brands_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_user_id ON public.brands USING btree (user_id);


--
-- Name: idx_chat_conversations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_conversations_user ON public.chat_conversations USING btree (user_id, created_at DESC);


--
-- Name: idx_chat_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_conversation ON public.chat_messages USING btree (conversation_id, created_at);


--
-- Name: idx_competitor_comparisons_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_competitor_comparisons_user ON public.competitor_comparisons USING btree (user_id);


--
-- Name: idx_document_chunks_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_chunks_brand_id ON public.document_chunks USING btree (brand_id);


--
-- Name: idx_document_chunks_content_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_chunks_content_gin ON public.document_chunks USING gin (to_tsvector('portuguese'::regconfig, content));


--
-- Name: idx_document_chunks_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_chunks_document_id ON public.document_chunks USING btree (document_id);


--
-- Name: idx_function_calls_user_function_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_function_calls_user_function_time ON public.function_calls_log USING btree (user_id, function_name, created_at DESC);


--
-- Name: idx_geo_pillars_brand_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_geo_pillars_brand_month ON public.geo_pillars_monthly USING btree (brand_id, month_year DESC);


--
-- Name: idx_geo_scores_brand_computed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_geo_scores_brand_computed ON public.geo_scores USING btree (brand_id, computed_at DESC);


--
-- Name: idx_geo_scores_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_geo_scores_brand_id ON public.geo_scores USING btree (brand_id);


--
-- Name: idx_geo_scores_computed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_geo_scores_computed_at ON public.geo_scores USING btree (computed_at DESC);


--
-- Name: idx_gsc_queries_audit_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_queries_audit_brand_id ON public.gsc_queries_audit USING btree (brand_id);


--
-- Name: idx_gsc_queries_audit_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_queries_audit_created_at ON public.gsc_queries_audit USING btree (created_at DESC);


--
-- Name: idx_gsc_queries_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_queries_brand_id ON public.gsc_queries USING btree (brand_id);


--
-- Name: idx_gsc_queries_collected_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_queries_collected_at ON public.gsc_queries USING btree (collected_at DESC);


--
-- Name: idx_hallucination_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hallucination_brand ON public.hallucination_detections USING btree (brand_id);


--
-- Name: idx_hallucination_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hallucination_user ON public.hallucination_detections USING btree (user_id);


--
-- Name: idx_igo_metrics_brand_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_igo_metrics_brand_date ON public.igo_metrics_history USING btree (brand_id, calculated_at DESC);


--
-- Name: idx_llm_cache_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_cache_expires ON public.llm_query_cache USING btree (expires_at);


--
-- Name: idx_llm_cache_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_cache_expires_at ON public.llm_query_cache USING btree (expires_at);


--
-- Name: idx_llm_cache_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_cache_hash ON public.llm_query_cache USING btree (query_hash);


--
-- Name: idx_llm_cache_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_cache_provider ON public.llm_query_cache USING btree (provider);


--
-- Name: idx_llm_cache_query_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_cache_query_hash ON public.llm_query_cache USING btree (query_hash);


--
-- Name: idx_mentions_llm_brand_collected; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mentions_llm_brand_collected ON public.mentions_llm USING btree (brand_id, collected_at DESC);


--
-- Name: idx_mentions_llm_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mentions_llm_brand_id ON public.mentions_llm USING btree (brand_id);


--
-- Name: idx_mentions_llm_collected_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mentions_llm_collected_at ON public.mentions_llm USING btree (collected_at DESC);


--
-- Name: idx_mentions_llm_mentioned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mentions_llm_mentioned ON public.mentions_llm USING btree (mentioned) WHERE (mentioned = true);


--
-- Name: idx_mentions_llm_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mentions_llm_provider ON public.mentions_llm USING btree (provider);


--
-- Name: idx_nucleus_executions_query_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nucleus_executions_query_id ON public.nucleus_executions USING btree (query_id);


--
-- Name: idx_nucleus_executions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nucleus_executions_user_id ON public.nucleus_executions USING btree (user_id);


--
-- Name: idx_nucleus_queries_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nucleus_queries_brand_id ON public.nucleus_queries USING btree (brand_id);


--
-- Name: idx_nucleus_queries_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nucleus_queries_user_id ON public.nucleus_queries USING btree (user_id);


--
-- Name: idx_report_audits_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_report_audits_date ON public.report_audits USING btree (audit_date DESC);


--
-- Name: idx_report_audits_user_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_report_audits_user_brand ON public.report_audits USING btree (user_id, brand_id);


--
-- Name: idx_scheduled_notifications_next_send; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_notifications_next_send ON public.scheduled_notifications USING btree (next_send) WHERE (enabled = true);


--
-- Name: idx_scheduled_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_notifications_user_id ON public.scheduled_notifications USING btree (user_id);


--
-- Name: idx_scheduled_reports_next_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_reports_next_run ON public.scheduled_reports USING btree (next_run) WHERE (enabled = true);


--
-- Name: idx_scheduled_reports_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_reports_user ON public.scheduled_reports USING btree (user_id);


--
-- Name: idx_scientific_reports_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scientific_reports_brand ON public.scientific_reports USING btree (brand_id);


--
-- Name: idx_scientific_reports_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scientific_reports_user ON public.scientific_reports USING btree (user_id);


--
-- Name: idx_seo_metrics_brand_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_metrics_brand_date ON public.seo_metrics_daily USING btree (brand_id, date DESC);


--
-- Name: idx_url_analysis_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_url_analysis_brand_id ON public.url_analysis_history USING btree (brand_id);


--
-- Name: idx_url_analysis_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_url_analysis_created_at ON public.url_analysis_history USING btree (created_at DESC);


--
-- Name: idx_url_analysis_history_user_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_url_analysis_history_user_url ON public.url_analysis_history USING btree (user_id, url, created_at DESC);


--
-- Name: idx_url_analysis_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_url_analysis_url ON public.url_analysis_history USING btree (url);


--
-- Name: idx_url_analysis_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_url_analysis_user_id ON public.url_analysis_history USING btree (user_id);


--
-- Name: idx_url_monitoring_schedules_next_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_url_monitoring_schedules_next_run ON public.url_monitoring_schedules USING btree (next_run) WHERE (enabled = true);


--
-- Name: idx_url_monitoring_schedules_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_url_monitoring_schedules_user ON public.url_monitoring_schedules USING btree (user_id);


--
-- Name: idx_url_optimization_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_url_optimization_tasks_status ON public.url_optimization_tasks USING btree (status);


--
-- Name: idx_url_optimization_tasks_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_url_optimization_tasks_url ON public.url_optimization_tasks USING btree (url);


--
-- Name: idx_url_optimization_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_url_optimization_tasks_user_id ON public.url_optimization_tasks USING btree (user_id);


--
-- Name: geo_scores sync_cpi_on_geo_score_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_cpi_on_geo_score_insert BEFORE INSERT ON public.geo_scores FOR EACH ROW EXECUTE FUNCTION public.sync_cpi_on_geo_score_insert();


--
-- Name: brands trigger_auto_create_automations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_create_automations AFTER INSERT ON public.brands FOR EACH ROW EXECUTE FUNCTION public.auto_create_brand_automations();


--
-- Name: brands trigger_auto_welcome_alert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_welcome_alert AFTER INSERT ON public.brands FOR EACH ROW EXECUTE FUNCTION public.auto_create_welcome_alert();


--
-- Name: geo_scores trigger_cascade_geo_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_cascade_geo_changes AFTER INSERT ON public.geo_scores FOR EACH ROW EXECUTE FUNCTION public.cascade_metric_changes();


--
-- Name: igo_metrics_history trigger_sync_cpi_on_igo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_cpi_on_igo AFTER INSERT ON public.igo_metrics_history FOR EACH ROW EXECUTE FUNCTION public.sync_cpi_on_igo_insert();


--
-- Name: alert_configs update_alert_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_alert_configs_updated_at BEFORE UPDATE ON public.alert_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: automation_configs update_automation_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_automation_configs_updated_at BEFORE UPDATE ON public.automation_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: brand_documents update_brand_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_brand_documents_updated_at BEFORE UPDATE ON public.brand_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_conversations update_chat_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: competitor_comparisons update_competitor_comparisons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_competitor_comparisons_updated_at BEFORE UPDATE ON public.competitor_comparisons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dashboard_configs update_dashboard_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dashboard_configs_updated_at BEFORE UPDATE ON public.dashboard_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recommendation_checklist update_recommendation_checklist_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_recommendation_checklist_updated_at BEFORE UPDATE ON public.recommendation_checklist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scheduled_notifications update_scheduled_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scheduled_notifications_updated_at BEFORE UPDATE ON public.scheduled_notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scheduled_reports update_scheduled_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scheduled_reports_updated_at BEFORE UPDATE ON public.scheduled_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: url_monitoring_schedules update_url_monitoring_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_url_monitoring_schedules_updated_at BEFORE UPDATE ON public.url_monitoring_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: url_optimization_tasks update_url_optimization_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_url_optimization_tasks_updated_at BEFORE UPDATE ON public.url_optimization_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: gsc_queries validate_gsc_access_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_gsc_access_trigger BEFORE INSERT OR UPDATE ON public.gsc_queries FOR EACH ROW EXECUTE FUNCTION public.validate_gsc_access();


--
-- Name: ai_insights ai_insights_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: automation_configs automation_configs_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_configs
    ADD CONSTRAINT automation_configs_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: automation_configs automation_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_configs
    ADD CONSTRAINT automation_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: automation_jobs automation_jobs_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_jobs
    ADD CONSTRAINT automation_jobs_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: automation_jobs automation_jobs_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_jobs
    ADD CONSTRAINT automation_jobs_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.automation_configs(id) ON DELETE CASCADE;


--
-- Name: automation_jobs automation_jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_jobs
    ADD CONSTRAINT automation_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: brand_documents brand_documents_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_documents
    ADD CONSTRAINT brand_documents_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: brands brands_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: document_chunks document_chunks_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: document_chunks document_chunks_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.brand_documents(id) ON DELETE CASCADE;


--
-- Name: function_calls_log function_calls_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.function_calls_log
    ADD CONSTRAINT function_calls_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: geo_scores geo_scores_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_scores
    ADD CONSTRAINT geo_scores_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: gsc_queries_audit gsc_queries_audit_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_queries_audit
    ADD CONSTRAINT gsc_queries_audit_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: gsc_queries gsc_queries_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_queries
    ADD CONSTRAINT gsc_queries_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: hallucination_detections hallucination_detections_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hallucination_detections
    ADD CONSTRAINT hallucination_detections_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: hallucination_detections hallucination_detections_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hallucination_detections
    ADD CONSTRAINT hallucination_detections_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.nucleus_executions(id) ON DELETE CASCADE;


--
-- Name: igo_metrics_history igo_metrics_history_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.igo_metrics_history
    ADD CONSTRAINT igo_metrics_history_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: llm_query_cache llm_query_cache_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_query_cache
    ADD CONSTRAINT llm_query_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: mentions_llm mentions_llm_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentions_llm
    ADD CONSTRAINT mentions_llm_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: nucleus_executions nucleus_executions_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nucleus_executions
    ADD CONSTRAINT nucleus_executions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: nucleus_executions nucleus_executions_query_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nucleus_executions
    ADD CONSTRAINT nucleus_executions_query_id_fkey FOREIGN KEY (query_id) REFERENCES public.nucleus_queries(id) ON DELETE CASCADE;


--
-- Name: nucleus_executions nucleus_executions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nucleus_executions
    ADD CONSTRAINT nucleus_executions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: nucleus_queries nucleus_queries_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nucleus_queries
    ADD CONSTRAINT nucleus_queries_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: nucleus_queries nucleus_queries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nucleus_queries
    ADD CONSTRAINT nucleus_queries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: recommendation_checklist recommendation_checklist_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_checklist
    ADD CONSTRAINT recommendation_checklist_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: recommendation_impact recommendation_impact_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_impact
    ADD CONSTRAINT recommendation_impact_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: recommendation_impact recommendation_impact_recommendation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_impact
    ADD CONSTRAINT recommendation_impact_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES public.recommendation_checklist(id) ON DELETE CASCADE;


--
-- Name: scheduled_notifications scheduled_notifications_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_notifications
    ADD CONSTRAINT scheduled_notifications_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: scheduled_notifications scheduled_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_notifications
    ADD CONSTRAINT scheduled_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: scientific_reports scientific_reports_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scientific_reports
    ADD CONSTRAINT scientific_reports_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: signals signals_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signals
    ADD CONSTRAINT signals_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: url_analysis_history url_analysis_history_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.url_analysis_history
    ADD CONSTRAINT url_analysis_history_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: url_optimization_tasks url_optimization_tasks_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.url_optimization_tasks
    ADD CONSTRAINT url_optimization_tasks_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.url_analysis_history(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gsc_queries_audit Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.gsc_queries_audit FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: backup_logs Admins can view backup logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view backup logs" ON public.backup_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: document_chunks Service can delete chunks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can delete chunks" ON public.document_chunks FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = document_chunks.brand_id))));


--
-- Name: gsc_queries Service can delete validated gsc_queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can delete validated gsc_queries" ON public.gsc_queries FOR DELETE TO service_role USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = gsc_queries.brand_id))));


--
-- Name: document_chunks Service can insert chunks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert chunks" ON public.document_chunks FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = document_chunks.brand_id))));


--
-- Name: geo_pillars_monthly Service can insert validated geo_pillars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert validated geo_pillars" ON public.geo_pillars_monthly FOR INSERT TO service_role WITH CHECK ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = geo_pillars_monthly.brand_id))));


--
-- Name: gsc_queries Service can insert validated gsc_queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert validated gsc_queries" ON public.gsc_queries FOR INSERT TO service_role WITH CHECK ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = gsc_queries.brand_id))));


--
-- Name: igo_metrics_history Service can insert validated igo_metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert validated igo_metrics" ON public.igo_metrics_history FOR INSERT TO service_role WITH CHECK ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = igo_metrics_history.brand_id))));


--
-- Name: seo_metrics_daily Service can insert validated seo_metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert validated seo_metrics" ON public.seo_metrics_daily FOR INSERT TO service_role WITH CHECK ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = seo_metrics_daily.brand_id))));


--
-- Name: geo_pillars_monthly Service can update validated geo_pillars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can update validated geo_pillars" ON public.geo_pillars_monthly FOR UPDATE TO service_role USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = geo_pillars_monthly.brand_id))));


--
-- Name: gsc_queries Service can update validated gsc_queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can update validated gsc_queries" ON public.gsc_queries FOR UPDATE TO service_role USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = gsc_queries.brand_id))));


--
-- Name: seo_metrics_daily Service can update validated seo_metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can update validated seo_metrics" ON public.seo_metrics_daily FOR UPDATE TO service_role USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = seo_metrics_daily.brand_id))));


--
-- Name: geo_pillars_monthly Service delete geo_pillars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service delete geo_pillars" ON public.geo_pillars_monthly FOR DELETE TO service_role USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = geo_pillars_monthly.brand_id))));


--
-- Name: igo_metrics_history Service delete igo_metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service delete igo_metrics" ON public.igo_metrics_history FOR DELETE TO service_role USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = igo_metrics_history.brand_id))));


--
-- Name: seo_metrics_daily Service delete seo_metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service delete seo_metrics" ON public.seo_metrics_daily FOR DELETE TO service_role USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE (brands.id = seo_metrics_daily.brand_id))));


--
-- Name: geo_scores Users can create GEO scores for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create GEO scores for their brands" ON public.geo_scores FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = geo_scores.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: mentions_llm Users can create LLM mentions for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create LLM mentions for their brands" ON public.mentions_llm FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = mentions_llm.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: brand_documents Users can create documents for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create documents for their brands" ON public.brand_documents FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = brand_documents.brand_id) AND (brands.user_id = auth.uid()))))));


--
-- Name: chat_messages Users can create messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages in their conversations" ON public.chat_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.user_id = auth.uid())))));


--
-- Name: signals Users can create signals for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create signals for their brands" ON public.signals FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = signals.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: alert_configs Users can create their own alert configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own alert configs" ON public.alert_configs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: alerts_history Users can create their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own alerts" ON public.alerts_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: url_analysis_history Users can create their own analysis history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own analysis history" ON public.url_analysis_history FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((brand_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = url_analysis_history.brand_id) AND (brands.user_id = auth.uid())))))));


--
-- Name: report_audits Users can create their own audits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own audits" ON public.report_audits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: automation_configs Users can create their own automation configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own automation configs" ON public.automation_configs FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((brand_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = automation_configs.brand_id) AND (brands.user_id = auth.uid())))))));


--
-- Name: brands Users can create their own brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own brands" ON public.brands FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: competitor_comparisons Users can create their own comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own comparisons" ON public.competitor_comparisons FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can create their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own conversations" ON public.chat_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: dashboard_configs Users can create their own dashboard config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own dashboard config" ON public.dashboard_configs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: nucleus_executions Users can create their own executions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own executions" ON public.nucleus_executions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: generated_reports Users can create their own generated reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own generated reports" ON public.generated_reports FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: recommendation_impact Users can create their own impact data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own impact data" ON public.recommendation_impact FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_insights Users can create their own insights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own insights" ON public.ai_insights FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: nucleus_queries Users can create their own queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own queries" ON public.nucleus_queries FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: recommendation_checklist Users can create their own recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own recommendations" ON public.recommendation_checklist FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: scheduled_notifications Users can create their own scheduled notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own scheduled notifications" ON public.scheduled_notifications FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((brand_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = scheduled_notifications.brand_id) AND (brands.user_id = auth.uid())))))));


--
-- Name: scheduled_reports Users can create their own scheduled reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own scheduled reports" ON public.scheduled_reports FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: url_monitoring_schedules Users can create their own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own schedules" ON public.url_monitoring_schedules FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: url_optimization_tasks Users can create their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tasks" ON public.url_optimization_tasks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: geo_scores Users can delete GEO scores for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete GEO scores for their brands" ON public.geo_scores FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = geo_scores.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: mentions_llm Users can delete LLM mentions for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete LLM mentions for their brands" ON public.mentions_llm FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = mentions_llm.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: chat_messages Users can delete messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete messages in their conversations" ON public.chat_messages FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.user_id = auth.uid())))));


--
-- Name: signals Users can delete signals for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete signals for their brands" ON public.signals FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = signals.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: alert_configs Users can delete their own alert configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own alert configs" ON public.alert_configs FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: alerts_history Users can delete their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own alerts" ON public.alerts_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: url_analysis_history Users can delete their own analysis history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own analysis history" ON public.url_analysis_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: automation_configs Users can delete their own automation configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own automation configs" ON public.automation_configs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: brands Users can delete their own brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own brands" ON public.brands FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: competitor_comparisons Users can delete their own comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own comparisons" ON public.competitor_comparisons FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversations" ON public.chat_conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: dashboard_configs Users can delete their own dashboard config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own dashboard config" ON public.dashboard_configs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: brand_documents Users can delete their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own documents" ON public.brand_documents FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: generated_reports Users can delete their own generated reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own generated reports" ON public.generated_reports FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ai_insights Users can delete their own insights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own insights" ON public.ai_insights FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: nucleus_queries Users can delete their own queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own queries" ON public.nucleus_queries FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: recommendation_checklist Users can delete their own recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own recommendations" ON public.recommendation_checklist FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: scheduled_notifications Users can delete their own scheduled notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own scheduled notifications" ON public.scheduled_notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: scheduled_reports Users can delete their own scheduled reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own scheduled reports" ON public.scheduled_reports FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: url_monitoring_schedules Users can delete their own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own schedules" ON public.url_monitoring_schedules FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: url_optimization_tasks Users can delete their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tasks" ON public.url_optimization_tasks FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: geo_pillars_monthly Users can insert pillars for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert pillars for their brands" ON public.geo_pillars_monthly FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = geo_pillars_monthly.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: hallucination_detections Users can insert their own hallucination detections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own hallucination detections" ON public.hallucination_detections FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: scientific_reports Users can insert their own scientific reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own scientific reports" ON public.scientific_reports FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: geo_scores Users can update GEO scores for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update GEO scores for their brands" ON public.geo_scores FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = geo_scores.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: igo_metrics_history Users can update IGO metrics for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update IGO metrics for their brands" ON public.igo_metrics_history FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = igo_metrics_history.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: mentions_llm Users can update LLM mentions for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update LLM mentions for their brands" ON public.mentions_llm FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = mentions_llm.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: ai_insights Users can update insights from their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update insights from their brands" ON public.ai_insights FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = ai_insights.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: signals Users can update signals for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update signals for their brands" ON public.signals FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = signals.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: alert_configs Users can update their own alert configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own alert configs" ON public.alert_configs FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: alerts_history Users can update their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own alerts" ON public.alerts_history FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: url_analysis_history Users can update their own analysis history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own analysis history" ON public.url_analysis_history FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: automation_configs Users can update their own automation configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own automation configs" ON public.automation_configs FOR UPDATE USING (((auth.uid() = user_id) AND ((brand_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = automation_configs.brand_id) AND (brands.user_id = auth.uid())))))));


--
-- Name: brands Users can update their own brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own brands" ON public.brands FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: competitor_comparisons Users can update their own comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own comparisons" ON public.competitor_comparisons FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.chat_conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: dashboard_configs Users can update their own dashboard config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own dashboard config" ON public.dashboard_configs FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: brand_documents Users can update their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own documents" ON public.brand_documents FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: nucleus_executions Users can update their own executions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own executions" ON public.nucleus_executions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: generated_reports Users can update their own generated reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own generated reports" ON public.generated_reports FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: nucleus_queries Users can update their own queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own queries" ON public.nucleus_queries FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: recommendation_checklist Users can update their own recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own recommendations" ON public.recommendation_checklist FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: scheduled_notifications Users can update their own scheduled notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own scheduled notifications" ON public.scheduled_notifications FOR UPDATE USING (((auth.uid() = user_id) AND ((brand_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = scheduled_notifications.brand_id) AND (brands.user_id = auth.uid())))))));


--
-- Name: scheduled_reports Users can update their own scheduled reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own scheduled reports" ON public.scheduled_reports FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: url_monitoring_schedules Users can update their own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own schedules" ON public.url_monitoring_schedules FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: url_optimization_tasks Users can update their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tasks" ON public.url_optimization_tasks FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: geo_scores Users can view GEO scores for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view GEO scores for their brands" ON public.geo_scores FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = geo_scores.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: gsc_queries Users can view GSC queries for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view GSC queries for their brands" ON public.gsc_queries FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = gsc_queries.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: igo_metrics_history Users can view IGO metrics for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view IGO metrics for their brands" ON public.igo_metrics_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = igo_metrics_history.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: mentions_llm Users can view LLM mentions for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view LLM mentions for their brands" ON public.mentions_llm FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = mentions_llm.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: seo_metrics_daily Users can view SEO metrics for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view SEO metrics for their brands" ON public.seo_metrics_daily FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = seo_metrics_daily.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: gsc_queries_audit Users can view audit logs for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view audit logs for their brands" ON public.gsc_queries_audit FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = gsc_queries_audit.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: document_chunks Users can view chunks for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view chunks for their brands" ON public.document_chunks FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = document_chunks.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: brand_documents Users can view documents for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view documents for their brands" ON public.brand_documents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = brand_documents.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: chat_messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.user_id = auth.uid())))));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: geo_pillars_monthly Users can view pillars for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view pillars for their brands" ON public.geo_pillars_monthly FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = geo_pillars_monthly.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: signals Users can view signals for their brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view signals for their brands" ON public.signals FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = signals.brand_id) AND (brands.user_id = auth.uid())))));


--
-- Name: alert_configs Users can view their own alert configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own alert configs" ON public.alert_configs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: alerts_history Users can view their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own alerts" ON public.alerts_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: url_analysis_history Users can view their own analysis history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own analysis history" ON public.url_analysis_history FOR SELECT USING (((auth.uid() = user_id) AND ((brand_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = url_analysis_history.brand_id) AND (brands.user_id = auth.uid())))))));


--
-- Name: report_audits Users can view their own audits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own audits" ON public.report_audits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: automation_configs Users can view their own automation configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own automation configs" ON public.automation_configs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: automation_jobs Users can view their own automation jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own automation jobs" ON public.automation_jobs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: brands Users can view their own brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own brands" ON public.brands FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: competitor_comparisons Users can view their own comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own comparisons" ON public.competitor_comparisons FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.chat_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: dashboard_configs Users can view their own dashboard config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own dashboard config" ON public.dashboard_configs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: nucleus_executions Users can view their own executions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own executions" ON public.nucleus_executions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: function_calls_log Users can view their own function calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own function calls" ON public.function_calls_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: generated_reports Users can view their own generated reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own generated reports" ON public.generated_reports FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: hallucination_detections Users can view their own hallucination detections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own hallucination detections" ON public.hallucination_detections FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: recommendation_impact Users can view their own impact data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own impact data" ON public.recommendation_impact FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_insights Users can view their own insights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own insights" ON public.ai_insights FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: nucleus_queries Users can view their own queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own queries" ON public.nucleus_queries FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: recommendation_checklist Users can view their own recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own recommendations" ON public.recommendation_checklist FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: scheduled_notifications Users can view their own scheduled notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own scheduled notifications" ON public.scheduled_notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: scheduled_reports Users can view their own scheduled reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own scheduled reports" ON public.scheduled_reports FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: url_monitoring_schedules Users can view their own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own schedules" ON public.url_monitoring_schedules FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: scientific_reports Users can view their own scientific reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own scientific reports" ON public.scientific_reports FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: url_optimization_tasks Users can view their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tasks" ON public.url_optimization_tasks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: hallucination_detections Users delete own hallucination_detections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own hallucination_detections" ON public.hallucination_detections FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: nucleus_executions Users delete own nucleus_executions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own nucleus_executions" ON public.nucleus_executions FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: report_audits Users delete own report_audits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own report_audits" ON public.report_audits FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: scientific_reports Users delete own scientific_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own scientific_reports" ON public.scientific_reports FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: ai_insights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

--
-- Name: alert_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alert_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: alert_configs alert_configs_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY alert_configs_delete_own ON public.alert_configs FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: alert_configs alert_configs_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY alert_configs_insert_own ON public.alert_configs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: alert_configs alert_configs_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY alert_configs_select_own ON public.alert_configs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: alert_configs alert_configs_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY alert_configs_update_own ON public.alert_configs FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: alerts_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alerts_history ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_jobs automation_jobs_user_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY automation_jobs_user_delete ON public.automation_jobs FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: automation_jobs automation_jobs_user_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY automation_jobs_user_update ON public.automation_jobs FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: automation_jobs automation_jobs_validated_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY automation_jobs_validated_insert ON public.automation_jobs FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND ((brand_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = automation_jobs.brand_id) AND (brands.user_id = auth.uid())))))));


--
-- Name: backup_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: backup_logs backup_logs_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY backup_logs_admin_delete ON public.backup_logs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: backup_logs backup_logs_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY backup_logs_admin_insert ON public.backup_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: backup_logs backup_logs_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY backup_logs_admin_update ON public.backup_logs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: brand_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brand_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: brands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages chat_messages_user_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chat_messages_user_update ON public.chat_messages FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.user_id = auth.uid())))));


--
-- Name: competitor_comparisons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.competitor_comparisons ENABLE ROW LEVEL SECURITY;

--
-- Name: dashboard_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dashboard_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: document_chunks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

--
-- Name: function_calls_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.function_calls_log ENABLE ROW LEVEL SECURITY;

--
-- Name: function_calls_log function_calls_log_immutable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY function_calls_log_immutable ON public.function_calls_log FOR UPDATE TO authenticated USING (false);


--
-- Name: function_calls_log function_calls_log_no_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY function_calls_log_no_delete ON public.function_calls_log FOR DELETE TO authenticated USING (false);


--
-- Name: function_calls_log function_calls_user_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY function_calls_user_insert ON public.function_calls_log FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: generated_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: geo_pillars_monthly; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.geo_pillars_monthly ENABLE ROW LEVEL SECURITY;

--
-- Name: geo_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.geo_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: gsc_queries_audit gsc_audit_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gsc_audit_admin_delete ON public.gsc_queries_audit FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gsc_queries_audit gsc_audit_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gsc_audit_admin_insert ON public.gsc_queries_audit FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gsc_queries_audit gsc_audit_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gsc_audit_admin_update ON public.gsc_queries_audit FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gsc_queries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gsc_queries ENABLE ROW LEVEL SECURITY;

--
-- Name: gsc_queries_audit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gsc_queries_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: gsc_queries gsc_queries_delete_validated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gsc_queries_delete_validated ON public.gsc_queries FOR DELETE TO authenticated USING (((collected_at < (now() - '90 days'::interval)) AND (EXISTS ( SELECT 1
   FROM public.brands
  WHERE ((brands.id = gsc_queries.brand_id) AND (brands.user_id = auth.uid()))))));


--
-- Name: hallucination_detections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hallucination_detections ENABLE ROW LEVEL SECURITY;

--
-- Name: hallucination_detections hallucination_detections_no_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hallucination_detections_no_update ON public.hallucination_detections FOR UPDATE TO authenticated USING (false);


--
-- Name: igo_metrics_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.igo_metrics_history ENABLE ROW LEVEL SECURITY;

--
-- Name: llm_query_cache llm_cache_delete_expired_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY llm_cache_delete_expired_own ON public.llm_query_cache FOR DELETE TO authenticated USING (((user_id = auth.uid()) AND (expires_at < now())));


--
-- Name: llm_query_cache llm_cache_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY llm_cache_insert_own ON public.llm_query_cache FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: llm_query_cache llm_cache_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY llm_cache_select_own ON public.llm_query_cache FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: llm_query_cache llm_cache_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY llm_cache_update_own ON public.llm_query_cache FOR UPDATE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: llm_query_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.llm_query_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: mentions_llm; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mentions_llm ENABLE ROW LEVEL SECURITY;

--
-- Name: nucleus_executions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nucleus_executions ENABLE ROW LEVEL SECURITY;

--
-- Name: nucleus_queries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nucleus_queries ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: recommendation_checklist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recommendation_checklist ENABLE ROW LEVEL SECURITY;

--
-- Name: recommendation_impact; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recommendation_impact ENABLE ROW LEVEL SECURITY;

--
-- Name: recommendation_impact recommendation_impact_user_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recommendation_impact_user_delete ON public.recommendation_impact FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: recommendation_impact recommendation_impact_user_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recommendation_impact_user_update ON public.recommendation_impact FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: report_audits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.report_audits ENABLE ROW LEVEL SECURITY;

--
-- Name: report_audits report_audits_no_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY report_audits_no_update ON public.report_audits FOR UPDATE TO authenticated USING (false);


--
-- Name: scheduled_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: scheduled_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: scientific_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scientific_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: scientific_reports scientific_reports_no_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY scientific_reports_no_update ON public.scientific_reports FOR UPDATE TO authenticated USING (false);


--
-- Name: seo_metrics_daily; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_metrics_daily ENABLE ROW LEVEL SECURITY;

--
-- Name: signals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

--
-- Name: url_analysis_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.url_analysis_history ENABLE ROW LEVEL SECURITY;

--
-- Name: url_monitoring_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.url_monitoring_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: url_optimization_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.url_optimization_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles user_roles_no_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_no_update ON public.user_roles FOR UPDATE TO authenticated USING (false);


--
-- PostgreSQL database dump complete
--


