import { z } from 'zod';

// Schema para validação de insights
export const insightSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['prediction', 'suggestion', 'report', 'summary']),
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.any(),
  created_at: z.string(),
  brand_id: z.string().uuid().optional().nullable(),
});

// Schema para validação de relatórios
export const reportContentSchema = z.object({
  title: z.string().optional(),
  executiveSummary: z.string().optional(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string().optional(),
    metrics: z.array(z.any()).optional(),
    insights: z.array(z.any()).optional(),
  })).optional(),
  keyMetrics: z.object({
    totalMentions: z.number().optional(),
    averageScore: z.number().optional(),
    topPerformingBrand: z.string().optional(),
    growthRate: z.string().optional(),
  }).optional(),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
  })).optional(),
});

// Schema para validação de análises preditivas
export const predictionContentSchema = z.object({
  predictions: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    confidence: z.enum(['high', 'medium', 'low']),
    timeframe: z.string().optional(),
    dataPoints: z.array(z.string()).optional(),
  })).optional(),
  suggestions: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']),
  })).optional(),
});

// Função auxiliar para validar dados
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; 
  data: T 
} | { 
  success: false; 
  errors: z.ZodError 
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Validação específica para insights
export function validateInsight(data: unknown) {
  return validateData(insightSchema, data);
}

// Validação específica para conteúdo de relatórios
export function validateReportContent(data: unknown) {
  return validateData(reportContentSchema, data);
}

// Validação específica para conteúdo de predições
export function validatePredictionContent(data: unknown) {
  return validateData(predictionContentSchema, data);
}

// Sanitizar dados antes de salvar
export function sanitizeHTML(html: string): string {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

// Validar URLs
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
