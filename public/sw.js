self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  self.clients.claim()
})

self.addEventListener('message', async (event) => {
  const data = event.data || {}
  if (data.type === 'notify' && data.title) {
    const options = {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: data.tag || undefined,
      requireInteraction: false
    }
    try {
      await self.registration.showNotification(data.title, options)
    } catch (e) {
      // no-op
    }
  }
})
