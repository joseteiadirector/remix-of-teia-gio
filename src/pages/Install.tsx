import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, Check, Share, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">App Instalado!</CardTitle>
            <CardDescription>
              O Teia GEO já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard">
              <Button className="w-full">Ir para o Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Download className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-serif">Instalar Teia GEO</CardTitle>
          <CardDescription>
            Instale o app para acesso rápido e experiência otimizada em seu dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Smartphone className="w-5 h-5 text-primary" />
              <span className="text-sm">Acesso offline</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Monitor className="w-5 h-5 text-primary" />
              <span className="text-sm">Tela cheia</span>
            </div>
          </div>

          {/* Install Instructions */}
          {isIOS ? (
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="font-medium text-sm">Como instalar no iOS:</p>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">1</span>
                  <span>Toque no ícone <Share className="inline w-4 h-4 mx-1" /> Compartilhar na barra do Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">2</span>
                  <span>Role e toque em <Plus className="inline w-4 h-4 mx-1" /> "Adicionar à Tela de Início"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">3</span>
                  <span>Toque em "Adicionar" para confirmar</span>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} size="lg" className="w-full gap-2">
              <Download className="w-5 h-5" />
              Instalar Agora
            </Button>
          ) : (
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="font-medium text-sm">Como instalar:</p>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">1</span>
                  <span>No Chrome: Clique no menu (⋮) no canto superior direito</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">2</span>
                  <span>Selecione "Instalar app" ou "Adicionar à tela inicial"</span>
                </li>
              </ol>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <Link to="/">
              <Button variant="ghost" className="w-full">
                Voltar para o site
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
