import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-14 md:h-16 items-center justify-between">
          {/* Logo */}
          <a 
            href="/" 
            className="flex items-center gap-2 md:gap-3 group cursor-pointer"
            aria-label="Teia GEO - Página Inicial"
          >
            <span className="text-base md:text-xl font-display font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              <span className="hidden sm:inline">Teia GEO — IA Generativa Observacional</span>
              <span className="sm:hidden">Teia GEO</span>
            </span>
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Navegação principal">
            <a href="#framework" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.framework')}
            </a>
            <a href="#modules" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.modules')}
            </a>
            <a href="/documentation" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.documentation')}
            </a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2 md:gap-3" role="navigation" aria-label="Ações do usuário">
            <LanguageSelector />
            <ThemeToggle />
            {user ? (
              <>
                <a href="/dashboard" className="hidden sm:inline">
                  <Button variant="outline" size="sm" className="font-medium" aria-label="Ir para o dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t('nav.dashboard')}
                  </Button>
                </a>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="font-medium"
                  onClick={handleSignOut}
                  aria-label="Sair da conta"
                >
                  <LogOut className="w-4 h-4 md:mr-2" aria-hidden="true" />
                  <span className="hidden md:inline">{t('nav.signOut')}</span>
                </Button>
              </>
            ) : (
              <>
                <a href="/auth" className="hidden sm:inline">
                  <Button variant="ghost" size="sm" className="font-medium" aria-label="Fazer login">
                    {t('nav.login')}
                  </Button>
                </a>
                <a href="/auth">
                  <Button size="sm" className="shadow-md hover:shadow-lg transition-all hover:scale-105 font-medium" aria-label="Começar grátis">
                    <span className="hidden sm:inline">{t('nav.getStarted')}</span>
                    <span className="sm:hidden">{t('nav.login')}</span>
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
