import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Cleanup old service worker / caches (prevents stale publish causing blank/black screen)
const cleanupLegacyServiceWorker = async () => {
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined") return;

  const flagKey = "__teia_sw_cleanup_done__";
  if (window.localStorage?.getItem(flagKey) === "1") return;

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore cleanup errors
  } finally {
    try {
      window.localStorage?.setItem(flagKey, "1");
    } catch {
      // ignore
    }
  }
};

void cleanupLegacyServiceWorker();

// Simple bootstrap
const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}

