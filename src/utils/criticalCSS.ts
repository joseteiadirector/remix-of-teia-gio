/**
 * Critical CSS Inline
 * Extrai e injeta CSS crítico para first paint
 */

import { logger } from "./logger";

/**
 * CSS crítico para first paint - Above the fold
 * Mantém estilos mínimos necessários para renderizar o viewport inicial
 */
export const CRITICAL_CSS = `
  /* Reset e Base */
  *,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:currentColor}
  html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:Inter,system-ui,sans-serif;tab-size:4}
  body{margin:0;line-height:inherit}
  
  /* Layout Crítico - cores fixas para garantir renderização */
  body{
    background:#0f172a;
    color:#f1f5f9;
    font-feature-settings:"rlig" 1,"calt" 1
  }
  
  #root{
    min-height:100vh;
  }
  
  /* Loading state crítico */
  .loading-spinner{
    border:4px solid rgba(139,92,246,0.1);
    border-left-color:#8B5CF6;
    border-radius:50%;
    width:40px;height:40px;
    animation:spin 1s linear infinite
  }
  
  @keyframes spin{to{transform:rotate(360deg)}}
`;

/**
 * Injetar CSS crítico no <head>
 * Chamar no index.html ou main.tsx
 */
export const injectCriticalCSS = () => {
  try {
    if (typeof document === 'undefined') return;
    
    // Verificar se já foi injetado
    if (document.getElementById('critical-css')) return;
    
    const style = document.createElement('style');
    style.id = 'critical-css';
    style.textContent = CRITICAL_CSS;
    
    // Inserir no head
    document.head.appendChild(style);
  } catch (e) {
    // Silenciar erros para não quebrar a aplicação
    console.warn('Critical CSS injection failed:', e);
  }
};

/**
 * Marcar conteúdo below-fold para lazy rendering
 * Usar em componentes que não aparecem no viewport inicial
 */
export const useBelowFold = () => {
  return { className: 'below-fold' };
};
