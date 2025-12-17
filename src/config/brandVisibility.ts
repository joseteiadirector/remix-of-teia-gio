/**
 * CONFIGURAÇÃO DEFINITIVA DE VISIBILIDADE DE MARCAS
 * 
 * Esta configuração é controlada pelo CÓDIGO, não pelo banco de dados.
 * Isso garante que a plataforma sempre funcione corretamente,
 * independente de alterações no banco de dados.
 * 
 * PARA ALTERAR QUAL MARCA É VISÍVEL:
 * 1. Altere o valor de VISIBLE_BRAND_NAME abaixo
 * 2. A plataforma automaticamente filtrará para mostrar apenas essa marca
 */

// ============================================
// MARCA VISÍVEL NA PLATAFORMA
// ============================================
// Altere este valor para definir qual marca será exibida
// Opções: 'IFOOD', 'Magalu', 'FMU', 'WYSE', 'PROPHET', 'DEPOT', 'Teia Studio'
export const VISIBLE_BRAND_NAME = 'Magalu';

// ============================================
// CONFIGURAÇÕES AVANÇADAS
// ============================================

// Se true, mostra apenas a marca definida acima
// Se false, usa a configuração is_visible do banco de dados
export const USE_CODE_BASED_VISIBILITY = false;

// Lista de marcas que NUNCA devem aparecer em comparações
// (mesmo que sejam a marca selecionada)
export const BRANDS_EXCLUDED_FROM_COMPARISON: string[] = [];

// Se true, a comparação entre marcas é desabilitada
// e apenas a marca atual é mostrada
export const DISABLE_MULTI_BRAND_COMPARISON = true;

/**
 * Função para verificar se uma marca deve ser visível
 * baseado na configuração de código
 */
export function shouldBrandBeVisible(brandName: string): boolean {
  if (!USE_CODE_BASED_VISIBILITY) {
    return true; // Usa configuração do banco
  }
  
  return brandName === VISIBLE_BRAND_NAME;
}

/**
 * Função para filtrar marcas baseado na configuração
 */
export function filterVisibleBrands<T extends { name: string }>(brands: T[]): T[] {
  if (!USE_CODE_BASED_VISIBILITY) {
    return brands;
  }
  
  return brands.filter(brand => brand.name === VISIBLE_BRAND_NAME);
}
