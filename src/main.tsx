import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Inicialização segura
const init = async () => {
  try {
    // Injetar CSS crítico
    const { injectCriticalCSS } = await import("./utils/criticalCSS");
    injectCriticalCSS();
  } catch (e) {
    console.warn("Critical CSS failed:", e);
  }

  try {
    // Inicializar Sentry apenas em produção
    if (import.meta.env.PROD) {
      const { initSentry } = await import("./lib/sentry");
      initSentry();
    }
  } catch (e) {
    console.warn("Sentry init failed:", e);
  }

  // Desregistrar qualquer Service Worker existente (PWA desativado)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
};

// Executar inicialização
init();

// Renderizar app
try {
  createRoot(document.getElementById("root")!).render(<App />);
  (window as any).__APP_BOOTED__ = true;
  const preboot = document.getElementById("preboot");
  if (preboot) preboot.style.display = "none";
} catch (e) {
  console.error("Boot failed:", e);
  const prebootText = document.getElementById("preboot-text");
  if (prebootText) prebootText.textContent = "Falha ao iniciar. Clique em 'Limpar cache e recarregar'.";
}
