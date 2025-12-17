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
    <main className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <section
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:border-primary/40"
        aria-labelledby="status-title"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
              <CheckCircle className="h-12 w-12 text-primary" aria-hidden />
            </div>
          </div>

          <h1 id="status-title" className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Teia GEO — Online
          </h1>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between border-b border-primary/20 pb-2">
              <span>Status:</span>
              <span className="text-primary font-medium">Operacional</span>
            </div>
            <div className="flex justify-between border-b border-primary/20 pb-2">
              <span>Versão:</span>
              <span className="font-mono">{version}</span>
            </div>
            <div className="flex justify-between border-b border-primary/20 pb-2">
              <span>Build:</span>
              <span className="font-mono text-xs">{buildTime}</span>
            </div>
            <div className="flex justify-between border-b border-primary/20 pb-2">
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
            className="w-full border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            {clearing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Limpar cache e recarregar
          </Button>

          <nav>
            <a href="/" className="inline-block mt-2 text-primary hover:text-primary/80 transition-colors text-sm">
              ← Voltar para a plataforma
            </a>
          </nav>
        </div>
      </section>
    </main>
  );
};

export default Status;
