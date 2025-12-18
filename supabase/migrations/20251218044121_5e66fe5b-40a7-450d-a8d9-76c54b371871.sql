-- =====================================================
-- AUDIT LOGGING SYSTEM FOR SENSITIVE TABLES
-- =====================================================

-- 1. Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL, -- INSERT, UPDATE, DELETE, SELECT
  record_id text,
  user_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 4. System can insert logs (via triggers with service role)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- 5. Audit logs are immutable - no updates or deletes
CREATE POLICY "Audit logs are immutable"
ON public.audit_logs FOR UPDATE
USING (false);

CREATE POLICY "Audit logs cannot be deleted"
ON public.audit_logs FOR DELETE
USING (false);

-- 6. Create indexes for efficient querying
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_operation ON public.audit_logs(operation);

-- 7. Create audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_id text;
  old_record jsonb := NULL;
  new_record jsonb := NULL;
BEGIN
  -- Determine record ID
  IF TG_OP = 'DELETE' THEN
    record_id := OLD.id::text;
    old_record := to_jsonb(OLD);
  ELSIF TG_OP = 'INSERT' THEN
    record_id := NEW.id::text;
    new_record := to_jsonb(NEW);
  ELSE -- UPDATE
    record_id := NEW.id::text;
    old_record := to_jsonb(OLD);
    new_record := to_jsonb(NEW);
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    table_name,
    operation,
    record_id,
    user_id,
    old_data,
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    record_id,
    auth.uid(),
    old_record,
    new_record
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 8. Create triggers for profiles table
CREATE TRIGGER audit_profiles_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_profiles_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_profiles_delete
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 9. Create triggers for brands table
CREATE TRIGGER audit_brands_insert
  AFTER INSERT ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_brands_update
  AFTER UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_brands_delete
  AFTER DELETE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 10. Create triggers for gsc_queries table
CREATE TRIGGER audit_gsc_queries_insert
  AFTER INSERT ON public.gsc_queries
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_gsc_queries_update
  AFTER UPDATE ON public.gsc_queries
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_gsc_queries_delete
  AFTER DELETE ON public.gsc_queries
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 11. Helper function to query audit logs
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  p_table_name text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_operation text DEFAULT NULL,
  p_limit int DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  table_name text,
  operation text,
  record_id text,
  user_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can query audit logs
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.table_name,
    al.operation,
    al.record_id,
    al.user_id,
    al.old_data,
    al.new_data,
    al.created_at
  FROM public.audit_logs al
  WHERE 
    (p_table_name IS NULL OR al.table_name = p_table_name)
    AND (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_operation IS NULL OR al.operation = p_operation)
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 12. Cleanup function for old logs (keep 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Only admins can cleanup
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;