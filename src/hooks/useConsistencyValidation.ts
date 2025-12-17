/**
 * Hook para validação automática de consistência matemática
 * 
 * Executa validação em tempo real e alerta sobre divergências
 */

import { useEffect, useState, useCallback } from 'react';
import { validateBrandConsistency, validateAllBrandsConsistency, ConsistencyValidationResult } from '@/utils/consistencyValidator';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface UseConsistencyValidationOptions {
  brandId?: string;
  brandName?: string;
  autoValidate?: boolean;
  validateInterval?: number; // em milissegundos
  showToasts?: boolean;
}

export function useConsistencyValidation(options: UseConsistencyValidationOptions = {}) {
  const {
    brandId,
    brandName,
    autoValidate = false,
    validateInterval = 30000, // 30 segundos
    showToasts = true,
  } = options;

  const [validationResult, setValidationResult] = useState<ConsistencyValidationResult | null>(null);
  const [allResults, setAllResults] = useState<ConsistencyValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  /**
   * Valida consistência de uma marca específica
   */
  const validateBrand = useCallback(async (targetBrandId?: string, targetBrandName?: string) => {
    const effectiveBrandId = targetBrandId || brandId;
    const effectiveBrandName = targetBrandName || brandName || 'Marca';

    if (!effectiveBrandId) {
      logger.warn('[useConsistencyValidation] BrandId não fornecido');
      return null;
    }

    setIsValidating(true);
    try {
      const result = await validateBrandConsistency(effectiveBrandId, effectiveBrandName);
      setValidationResult(result);
      setLastValidation(new Date());

      if (showToasts) {
        if (result.isConsistent) {
          toast.success('✅ Validação matemática aprovada', {
            description: `Todos os scores de ${effectiveBrandName} estão consistentes`,
            duration: 3000,
          });
        } else {
          toast.error('⚠️ Inconsistência detectada!', {
            description: `${result.divergences.length} divergência(s) em ${effectiveBrandName}`,
            duration: 5000,
            action: {
              label: 'Ver Detalhes',
              onClick: () => {
                console.log('Divergências:', result.divergences);
              },
            },
          });
        }
      }

      return result;
    } catch (error) {
      logger.error('[useConsistencyValidation] Erro na validação', { error });
      if (showToasts) {
        toast.error('Erro na validação de consistência');
      }
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [brandId, brandName, showToasts]);

  /**
   * Valida consistência de todas as marcas
   */
  const validateAll = useCallback(async () => {
    setIsValidating(true);
    try {
      const results = await validateAllBrandsConsistency();
      setAllResults(results);
      setLastValidation(new Date());

      if (showToasts) {
        const inconsistentCount = results.filter(r => !r.isConsistent).length;
        if (inconsistentCount === 0) {
          toast.success('✅ Sistema 100% consistente', {
            description: `Todas as ${results.length} marca(s) validadas com sucesso`,
            duration: 4000,
          });
        } else {
          toast.warning('⚠️ Inconsistências detectadas', {
            description: `${inconsistentCount} de ${results.length} marca(s) com divergências`,
            duration: 5000,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('[useConsistencyValidation] Erro na validação completa', { error });
      if (showToasts) {
        toast.error('Erro na validação do sistema');
      }
      return [];
    } finally {
      setIsValidating(false);
    }
  }, [showToasts]);

  /**
   * Validação automática periódica
   */
  useEffect(() => {
    if (!autoValidate) return;

    // Validação inicial
    if (brandId && brandName) {
      validateBrand();
    } else {
      validateAll();
    }

    // Validação periódica
    const interval = setInterval(() => {
      if (brandId && brandName) {
        validateBrand();
      } else {
        validateAll();
      }
    }, validateInterval);

    return () => clearInterval(interval);
  }, [autoValidate, brandId, brandName, validateInterval, validateBrand, validateAll]);

  return {
    validationResult,
    allResults,
    isValidating,
    lastValidation,
    validateBrand,
    validateAll,
    isConsistent: validationResult?.isConsistent ?? true,
    divergenceCount: validationResult?.divergences.length ?? 0,
  };
}
