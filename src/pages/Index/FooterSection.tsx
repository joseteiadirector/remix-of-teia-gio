import { useTranslation } from 'react-i18next';

export const FooterSection = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t border-border/50 py-12" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="font-display text-lg text-foreground mb-1">Teia GEO</p>
            <p className="text-sm text-muted-foreground">© 2025 Teia Studio. {t('footer.rights')}.</p>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a 
              href="https://www.teiastudio.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              teiastudio.com
            </a>
            <span className="text-border">|</span>
            <a 
              href="mailto:contato@wwwteiastudio.com" 
              className="hover:text-primary transition-colors"
            >
              contato@teiastudio.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
