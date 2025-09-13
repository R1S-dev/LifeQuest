import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Download, Upload, LogOut, RotateCcw,
  Bell, Sun, Moon, Monitor, Globe
} from 'lucide-react'
import { useAppStore } from '../store'
import { languages, t } from '../utils/i18n'
import { ensureNotificationPermission } from '../pwa'
import { startDueNotifier, stopDueNotifier } from '../notifications'

export default function SettingsModal({ open, onClose }) {
  // Store
  const lang = useAppStore(s => s.language)
  const setLanguage = useAppStore(s => s.setLanguage)
  const theme = useAppStore(s => s.theme)
  const setTheme = useAppStore(s => s.setTheme)
  const resetAll = useAppStore(s => s.resetAll)
  const logout = useAppStore(s => s.logout)
  const notificationsEnabled = useAppStore(s => s.notificationsEnabled)
  const setNotificationsEnabled = useAppStore(s => s.setNotificationsEnabled)

  // Local
  const importRef = useRef(null)

  // Lock scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev || '' }
  }, [open])

  // Backup/Import
  const LS_KEY = 'lifequest-store'
  const doExport = () => {
    const payload = localStorage.getItem(LS_KEY) ?? '{}'
    const blob = new Blob([payload], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'lifequest-backup.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const doImport = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        JSON.parse(reader.result)
        localStorage.setItem(LS_KEY, reader.result)
        window.location.reload()
      } catch {
        alert('Nevalidan backup fajl.')
      }
    }
    reader.readAsText(f)
  }

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const perm = await ensureNotificationPermission()
      if (perm !== 'granted') return
      setNotificationsEnabled(true)
      startDueNotifier()
    } else {
      setNotificationsEnabled(false)
      stopDueNotifier()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="card w-[min(96vw,720px)] max-h-[90vh] overflow-hidden p-0 flex flex-col"
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3"
                 style={{ background:'var(--card)', borderBottom:'1px solid var(--card-border)' }}>
              <span className="text-base font-semibold">{t('settings', lang)}</span>
              <button className="btn btn-ghost" onClick={onClose}><X className="h-5 w-5" /></button>
            </div>

            {/* Body (scroll area) */}
            <div
              className="px-5 pt-5 pb-[calc(16px+env(safe-area-inset-bottom))] grid gap-6 overflow-y-auto"
              style={{ maxHeight: 'calc(90vh - 48px)' }} // ~48px header
            >
              {/* Language & Theme */}
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm" style={{color:'var(--muted)'}}>
                    <Globe className="h-4 w-4" /> {t('language', lang)}
                  </div>
                  <select className="select" value={lang} onChange={(e)=>setLanguage(e.target.value)}>
                    {Object.entries(languages).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm" style={{color:'var(--muted)'}}>
                    <Monitor className="h-4 w-4" /> {t('theme', lang)}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button className={`btn btn-ghost ${theme==='system'?'outline':''}`} onClick={()=>setTheme('system')}>
                      <Monitor className="h-4 w-4" /> {t('theme_system', lang)}
                    </button>
                    <button className={`btn btn-ghost ${theme==='light'?'outline':''}`} onClick={()=>setTheme('light')}>
                      <Sun className="h-4 w-4" /> {t('theme_light', lang)}
                    </button>
                    <button className={`btn btn-ghost ${theme==='dark'?'outline':''}`} onClick={()=>setTheme('dark')}>
                      <Moon className="h-4 w-4" /> {t('theme_dark', lang)}
                    </button>
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section className="grid gap-2">
                <div className="flex items-center gap-2 text-sm" style={{color:'var(--muted)'}}>
                  <Bell className="h-4 w-4" /> {t('notifications', lang)}
                </div>
                <button className="btn btn-ghost w-max" onClick={toggleNotifications}>
                  <Bell className="h-4 w-4" />
                  {notificationsEnabled ? 'On' : 'Off'}
                </button>
              </section>

              {/* Backup */}
              <section className="grid gap-2">
                <div className="text-sm" style={{color:'var(--muted)'}}>Backup</div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-ghost" onClick={doExport}>
                    <Download className="h-4 w-4" /> {t('export', lang)}
                  </button>
                  <button className="btn btn-ghost" onClick={()=>importRef.current?.click()}>
                    <Upload className="h-4 w-4" /> {t('import', lang)}
                  </button>
                  <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={doImport} />
                </div>
              </section>

              {/* Danger zone */}
              <section className="grid gap-2">
                <div className="text-sm" style={{color:'var(--muted)'}}>Danger zone</div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn btn-ghost" onClick={resetAll}>
                    <RotateCcw className="h-4 w-4" /> Reset data
                  </button>
                  <button className="btn btn-ghost" onClick={logout}>
                    <LogOut className="h-4 w-4" /> {t('logout', lang)}
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
