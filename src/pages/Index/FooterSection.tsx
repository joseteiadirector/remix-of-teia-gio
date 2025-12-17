import { useTranslation } from 'react-i18next';

export const FooterSection = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t py-8" role="contentinfo">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-2">
        <p>© 2025 Teia Studio GEO. {t('footer.rights')}.</p>
        <p>
          {t('footer.managedBy')}{" "}
          <a 
            href="https://www.teiastudio.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            www.teiastudio.com
          </a>
        </p>
        <p>
          {t('footer.contact')}:{" "}
          <a 
            href="mailto:contato@wwwteiastudio.com" 
            className="text-primary hover:underline"
          >
            contato@wwwteiastudio.com
          </a>
        </p>
      </div>
    </footer>
  );
};
