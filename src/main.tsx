import { createRoot } from "react-dom/client";
import "./index.css";

function showPrebootError(title: string, err?: unknown) {
  try {
    const prebootText = document.getElementById("preboot-text");
    if (prebootText) prebootText.textContent = title;

    const help = document.getElementById("preboot-help");
    if (help) help.style.display = "block";

    // Debug (não quebra se o elemento não existir)
    const details = document.getElementById("preboot-debug");
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err ?? "");
    if (details && message) details.textContent = message;

    // Log sempre para facilitar suporte
    // eslint-disable-next-line no-console
    console.error("[BOOT]", title, err);
  } catch {
    // ignore
  }
}

async function bootstrap() {
  try {
    // Importa i18n de forma segura (evita travar o boot)
    await import("./i18n");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("i18n init failed:", e);
  }

  try {
    const { injectCriticalCSS } = await import("./utils/criticalCSS");
    injectCriticalCSS();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Critical CSS failed:", e);
  }

  try {
    if (import.meta.env.PROD) {
      const { initSentry } = await import("./lib/sentry");
      initSentry();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Sentry init failed:", e);
  }

  // Importante: se variáveis do backend não estiverem presentes no build publicado,
  // o app não consegue inicializar. Mostramos isso claramente em vez de travar.
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    showPrebootError(
      "Falha no deploy: configuração do backend ausente. Publique novamente (Publish → Update)."
    );
    return;
  }

  // Registra PWA com auto-update (força reload quando há nova versão)
  try {
    const { setupPWAUpdater } = await import("./utils/pwaUpdater");
    setupPWAUpdater();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("PWA updater setup failed:", e);
  }

  try {
    const { default: App } = await import("./App");
    const rootEl = document.getElementById("root");
    if (!rootEl) throw new Error("Root element not found");

    createRoot(rootEl).render(<App />);

    (window as any).__APP_BOOTED__ = true;
    const preboot = document.getElementById("preboot");
    if (preboot) preboot.style.display = "none";
  } catch (e) {
    showPrebootError("Falha ao iniciar o app (erro no bundle).", e);
  }
}

bootstrap();

