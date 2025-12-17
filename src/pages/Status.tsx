import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Status = () => {
  const version = import.meta.env.VITE_APP_VERSION || "1.0.0";
  const buildTime = typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : "";

  const displayMode = useMemo(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any).standalone === true;

    return standalone ? "app_instalado" : "navegador";
  }, []);

  useEffect(() => {
    document.title = "Status — Teia GEO";

    const ensureMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const ensureCanonical = (href: string) => {
      let link = document.querySelector(`link[rel="canonical"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    ensureMeta(
      "description",
      "Status do sistema Teia GEO: online, versão e build em produção."
    );

    ensureCanonical(`${window.location.origin}/status`);
  }, []);

  const displayModeLabel = displayMode === "app_instalado" ? "App instalado" : "Navegador";

  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      // Unregister all service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      // Clear caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear IndexedDB databases
      if ("indexedDB" in window) {
        const databases = await indexedDB.databases?.();
        if (databases) {
          databases.forEach((db) => {
            if (db.name) indexedDB.deleteDatabase(db.name);
          });
        }
      }

      // Force reload from server
      window.location.reload();
    } catch (e) {
      console.error("Erro ao limpar cache:", e);
      setClearing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <section
        className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center space-y-6"
        aria-labelledby="status-title"
      >
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-primary" aria-hidden />
        </div>

        <h1 id="status-title" className="text-2xl font-bold text-foreground">
          Teia GEO — Online
        </h1>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex justify-between border-b border-border pb-2">
            <span>Status:</span>
            <span className="text-primary font-medium">Operacional</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span>Versão:</span>
            <span className="font-mono">{version}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span>Build:</span>
            <span className="font-mono text-xs">{buildTime}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span>Ambiente:</span>
            <span className="font-mono">{import.meta.env.MODE}</span>
          </div>
          <div className="flex justify-between">
            <span>Modo:</span>
            <span className="font-mono">{displayModeLabel}</span>
          </div>
        </div>

        {displayMode === "app_instalado" && (
          <p className="text-xs text-muted-foreground">
            Para abrir como site normal, remova a instalação/atalho do app e limpe os dados do
            site.
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCache}
          disabled={clearing}
          className="w-full"
        >
          {clearing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Limpar cache e recarregar
        </Button>

        <nav>
          <a href="/" className="inline-block mt-2 text-primary hover:underline text-sm">
            ← Voltar para a plataforma
          </a>
        </nav>
      </section>
    </main>
  );
};

export default Status;
