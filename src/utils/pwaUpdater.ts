import { registerSW } from 'virtual:pwa-register';

/**
 * Registra o Service Worker com auto-update.
 * Quando detecta uma nova versão, força reload imediato (evita "Carregando..." infinito).
 */
export function setupPWAUpdater() {
  if (!('serviceWorker' in navigator)) return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Nova versão disponível - recarrega automaticamente
      console.log('[PWA] Nova versão detectada, recarregando...');
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[PWA] App pronto para uso offline');
    },
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service Worker registrado:', swUrl);
      
      // Verifica atualizações a cada 60 segundos
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Erro ao registrar Service Worker:', error);
    },
  });

  // Listener para mensagens do SW (ex: SKIP_WAITING)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] Controller mudou, recarregando página...');
    window.location.reload();
  });
}
