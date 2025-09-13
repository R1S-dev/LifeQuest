export async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    } catch (e) {
      console.warn('SW register failed', e)
    }
  }
}

export async function ensureNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const res = await Notification.requestPermission()
    return res
  } catch {
    return 'denied'
  }
}

export function sendSWNotification(payload) {
  if (!navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({ type: 'notify', ...payload })
}
