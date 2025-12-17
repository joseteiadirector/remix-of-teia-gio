-- =============================================
-- ATUALIZAR RLS POLICIES COM NOVOS ROLES
-- =============================================

-- =============================================
-- 1. PROFILES - Adicionar DELETE e melhorar com roles
-- =============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.can_manage(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE USING (auth.uid() = id);

-- =============================================
-- 2. BRANDS - Managers podem ver todas
-- =============================================
DROP POLICY IF EXISTS "Users can view their own brands" ON public.brands;
CREATE POLICY "Users can view their own brands" ON public.brands
FOR SELECT USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can update their own brands" ON public.brands;
CREATE POLICY "Users can update their own brands" ON public.brands
FOR UPDATE USING (
  (auth.uid() = user_id AND public.can_edit(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can delete their own brands" ON public.brands;
CREATE POLICY "Users can delete their own brands" ON public.brands
FOR DELETE USING (
  (auth.uid() = user_id AND public.can_edit(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- =============================================
-- 3. GEO_SCORES - Analysts podem ver, editors podem editar
-- =============================================
DROP POLICY IF EXISTS "Users can view GEO scores for their brands" ON public.geo_scores;
CREATE POLICY "Users can view GEO scores for their brands" ON public.geo_scores
FOR SELECT USING (
  EXISTS (SELECT 1 FROM brands WHERE brands.id = geo_scores.brand_id AND brands.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can create GEO scores for their brands" ON public.geo_scores;
CREATE POLICY "Users can create GEO scores for their brands" ON public.geo_scores
FOR INSERT WITH CHECK (
  (EXISTS (SELECT 1 FROM brands WHERE brands.id = geo_scores.brand_id AND brands.user_id = auth.uid()) AND public.can_edit(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can update GEO scores for their brands" ON public.geo_scores;
CREATE POLICY "Users can update GEO scores for their brands" ON public.geo_scores
FOR UPDATE USING (
  (EXISTS (SELECT 1 FROM brands WHERE brands.id = geo_scores.brand_id AND brands.user_id = auth.uid()) AND public.can_edit(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- =============================================
-- 4. IGO_METRICS_HISTORY - Mesmo padrão
-- =============================================
DROP POLICY IF EXISTS "Users can view IGO metrics for their brands" ON public.igo_metrics_history;
CREATE POLICY "Users can view IGO metrics for their brands" ON public.igo_metrics_history
FOR SELECT USING (
  EXISTS (SELECT 1 FROM brands WHERE brands.id = igo_metrics_history.brand_id AND brands.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can update IGO metrics for their brands" ON public.igo_metrics_history;
CREATE POLICY "Users can update IGO metrics for their brands" ON public.igo_metrics_history
FOR UPDATE USING (
  (EXISTS (SELECT 1 FROM brands WHERE brands.id = igo_metrics_history.brand_id AND brands.user_id = auth.uid()) AND public.can_edit(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- =============================================
-- 5. MENTIONS_LLM - Mesmo padrão
-- =============================================
DROP POLICY IF EXISTS "Users can view LLM mentions for their brands" ON public.mentions_llm;
CREATE POLICY "Users can view LLM mentions for their brands" ON public.mentions_llm
FOR SELECT USING (
  EXISTS (SELECT 1 FROM brands WHERE brands.id = mentions_llm.brand_id AND brands.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can create LLM mentions for their brands" ON public.mentions_llm;
CREATE POLICY "Users can create LLM mentions for their brands" ON public.mentions_llm
FOR INSERT WITH CHECK (
  (EXISTS (SELECT 1 FROM brands WHERE brands.id = mentions_llm.brand_id AND brands.user_id = auth.uid()) AND public.can_edit(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can update LLM mentions for their brands" ON public.mentions_llm;
CREATE POLICY "Users can update LLM mentions for their brands" ON public.mentions_llm
FOR UPDATE USING (
  (EXISTS (SELECT 1 FROM brands WHERE brands.id = mentions_llm.brand_id AND brands.user_id = auth.uid()) AND public.can_edit(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- =============================================
-- 6. ALERTS_HISTORY - Viewers podem ver
-- =============================================
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.alerts_history;
CREATE POLICY "Users can view their own alerts" ON public.alerts_history
FOR SELECT USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can update their own alerts" ON public.alerts_history;
CREATE POLICY "Users can update their own alerts" ON public.alerts_history
FOR UPDATE USING (
  (auth.uid() = user_id AND public.can_edit(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- =============================================
-- 7. GENERATED_REPORTS - Analysts podem ver e criar
-- =============================================
DROP POLICY IF EXISTS "Users can view their own generated reports" ON public.generated_reports;
CREATE POLICY "Users can view their own generated reports" ON public.generated_reports
FOR SELECT USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can create their own generated reports" ON public.generated_reports;
CREATE POLICY "Users can create their own generated reports" ON public.generated_reports
FOR INSERT WITH CHECK (
  (auth.uid() = user_id AND public.can_analyze(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- =============================================
-- 8. SCIENTIFIC_REPORTS - Analysts podem ver e criar
-- =============================================
DROP POLICY IF EXISTS "Users can view scientific reports" ON public.scientific_reports;
CREATE POLICY "Users can view scientific reports" ON public.scientific_reports
FOR SELECT USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can create scientific reports" ON public.scientific_reports;
CREATE POLICY "Users can create scientific reports" ON public.scientific_reports
FOR INSERT WITH CHECK (
  (auth.uid() = user_id AND public.can_analyze(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- =============================================
-- 9. AUTOMATION_CONFIGS - Editors podem gerenciar
-- =============================================
DROP POLICY IF EXISTS "Users can view their own automation configs" ON public.automation_configs;
CREATE POLICY "Users can view their own automation configs" ON public.automation_configs
FOR SELECT USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can create their own automation configs" ON public.automation_configs;
CREATE POLICY "Users can create their own automation configs" ON public.automation_configs
FOR INSERT WITH CHECK (
  (auth.uid() = user_id AND public.can_edit(auth.uid()) AND 
   (brand_id IS NULL OR EXISTS (SELECT 1 FROM brands WHERE brands.id = automation_configs.brand_id AND brands.user_id = auth.uid())))
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can update their own automation configs" ON public.automation_configs;
CREATE POLICY "Users can update their own automation configs" ON public.automation_configs
FOR UPDATE USING (
  (auth.uid() = user_id AND public.can_edit(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- =============================================
-- 10. BACKUP_LOGS - Apenas admin
-- =============================================
DROP POLICY IF EXISTS "Admins can view backup logs" ON public.backup_logs;
CREATE POLICY "Admins can view backup logs" ON public.backup_logs
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "backup_logs_admin_insert" ON public.backup_logs;
CREATE POLICY "backup_logs_admin_insert" ON public.backup_logs
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "backup_logs_admin_update" ON public.backup_logs;
CREATE POLICY "backup_logs_admin_update" ON public.backup_logs
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "backup_logs_admin_delete" ON public.backup_logs;
CREATE POLICY "backup_logs_admin_delete" ON public.backup_logs
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));