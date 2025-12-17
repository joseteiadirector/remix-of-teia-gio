// Service Worker autodestrutivo - remove PWA antigo e limpa caches
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', async (event) => {
  event.waitUntil(
    (async () => {
      // Limpar TODOS os caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // Desregistrar este SW
      const registration = await self.registration;
      await registration.unregister();
      
      // Forçar reload de todos os clientes
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => client.navigate(client.url));
    })()
  );
});

// Não interceptar NADA - deixar passar direto para a rede
self.addEventListener('fetch', () => {});
