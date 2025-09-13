import { startOfDay } from './utils/date'
import { sendSWNotification, ensureNotificationPermission } from './pwa'
import { useAppStore } from './store'

let intervalId = null
let notifiedToday = new Set()
let lastDayKey = startOfDay(Date.now())

function resetDailyMemory() {
  const todayKey = startOfDay(Date.now())
  if (todayKey !== lastDayKey) {
    notifiedToday.clear()
    lastDayKey = todayKey
  }
}

export async function startDueNotifier() {
  stopDueNotifier()
  // lazy permission
  const enabled = useAppStore.getState().notificationsEnabled
  if (!enabled) return
  const perm = await ensureNotificationPermission()
  if (perm !== 'granted') return

  intervalId = setInterval(checkAndNotify, 30 * 1000)
  // run immediately
  checkAndNotify()
}

export function stopDueNotifier() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function checkAndNotify() {
  resetDailyMemory()
  const state = useAppStore.getState()
  if (!state.notificationsEnabled) return

  const now = Date.now()
  const in5min = now + 5 * 60 * 1000

  state.tasks.forEach((t) => {
    if (t.isCompleted || !t.dueAt) return
    // Build a unique key (per day)
    const key = `${t.id}-${startOfDay(now)}`
    const dueToday = new Date(t.dueAt)
    const dueTs = new Date().setHours(dueToday.getHours(), dueToday.getMinutes(), 0, 0)

    if (dueTs >= now && dueTs <= in5min && !notifiedToday.has(key)) {
      notifiedToday.add(key)
      sendSWNotification({
        title: `Quest due: ${t.title}`,
        body: `Due @ ${String(dueToday.getHours()).padStart(2,'0')}:${String(dueToday.getMinutes()).padStart(2,'0')} · +${t.xp} XP`
      })
    }
  })
}
