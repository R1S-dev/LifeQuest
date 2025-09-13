import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store'
import XPBar from './components/XPBar'
import AddTaskModal from './components/AddTaskModal'
import LevelUpModal from './components/LevelUpModal'
import { breakdownXP } from './utils/leveling'
import TaskItem from './components/TaskItem'
import SplashScreen from './components/SplashScreen'
import LoginScreen from './components/LoginScreen'
import SettingsModal from './components/SettingsModal'
import ProfileModal from './components/ProfileModal'
import JournalModal from './components/JournalModal'
import StatsView from './components/StatsView'
import TabBar from './components/TabBar'
import { t } from './utils/i18n'

export default function App() {
  // --- Store ---
  const lang = useAppStore(s => s.language)
  const theme = useAppStore(s => s.theme)
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const user = useAppStore(s => s.user)

  const tasks = useAppStore(s => s.tasks)
  const totalXP = useAppStore(s => s.totalXP)
  const lastLevelSeen = useAppStore(s => s.lastLevelSeen)
  const setLastLevelSeen = useAppStore(s => s.setLastLevelSeen)
  const runDailyTick = useAppStore(s => s.runDailyTick)

  // --- Local ---
  const [openAdd, setOpenAdd] = useState(false)
  const [openSettings, setOpenSettings] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const [openJournal, setOpenJournal] = useState(false)
  const [activeTab, setActiveTab] = useState('main') // 'main' | 'side' | 'self' | 'stats'

  const [showDoneMain, setShowDoneMain] = useState(false)
  const [showDoneSide, setShowDoneSide] = useState(false)

  const { level, xpIntoLevel, xpForThisLevel, progress } = useMemo(
    () => breakdownXP(totalXP),
    [totalXP]
  )

  const prevLevel = useRef(level)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  // Tema
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)')
      const apply = () => root.setAttribute('data-theme', mq.matches ? 'light' : 'dark')
      apply()
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  // Splash
  useEffect(() => {
    const tmr = setTimeout(() => setShowSplash(false), 900)
    return () => clearTimeout(tmr)
  }, [])

  // Auto tick
  useEffect(() => {
    runDailyTick()
    const id = setInterval(() => runDailyTick(), 60000)
    return () => clearInterval(id)
  }, [runDailyTick])

  // Level up modal trigger
  useEffect(() => {
    if (level > prevLevel.current) {
      setShowLevelUp(true)
      setLastLevelSeen(level)
    }
    prevLevel.current = level
  }, [level, setLastLevelSeen])

  // Body lock kad je neki modal otvoren
  const anyModalOpen =
    openAdd || openSettings || openProfile || openJournal ||
    (showLevelUp && level > Math.max(1, lastLevelSeen - 1))
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = anyModalOpen ? 'hidden' : prev || ''
    return () => { document.body.style.overflow = prev || '' }
  }, [anyModalOpen, level, lastLevelSeen, showLevelUp])

  // Early returns
  if (showSplash) return <SplashScreen show={true} />
  if (!isAuthenticated) return <LoginScreen />

  // Liste
  const openMain = tasks.filter(t => t.type === 'main' && !t.isCompleted)
  const doneMain  = tasks.filter(t => t.type === 'main' && t.isCompleted)
  const openSide = tasks.filter(t => t.type === 'side' && !t.isCompleted)
  const doneSide  = tasks.filter(t => t.type === 'side' && t.isCompleted)

  return (
    <div className="page mx-auto max-w-xl px-4 pt-4 sm:max-w-2xl md:max-w-3xl">
      {/* Header */}
      <header className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setOpenProfile(true)}
          className="flex items-center gap-3 focus:outline-none"
          title={t('profile', lang)}
        >
          <div
            className="h-10 w-10 rounded-2xl border overflow-hidden flex items-center justify-center"
            style={{ borderColor:'var(--card-border)', background:'var(--card)' }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <img src="/logo.png" alt="logo" className="h-7 w-7 object-contain" />
            )}
          </div>
          <div className="min-w-0 text-left">
            <h1 className="text-lg font-extrabold tracking-tight truncate">
              {user?.name || 'Adventurer'}
            </h1>
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {t('xp', lang)}: {totalXP.toLocaleString('sr-RS')}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button onClick={() => setOpenAdd(true)} className="btn btn-primary h-9 px-3 text-sm">
            <Plus className="h-4 w-4" />
            {t('new', lang)}
          </button>
          <button
            onClick={() => setOpenSettings(true)}
            className="btn btn-ghost h-9 px-3"
            title={t('settings', lang)}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* XP bar — SAMO NA MAIN & SIDE TABOVIMA */}
      {(activeTab === 'main' || activeTab === 'side') && (
        <div className="mb-4">
          <XPBar
            level={level}
            xpIntoLevel={xpIntoLevel}
            xpForThisLevel={xpForThisLevel}
            progress={progress}
          />
        </div>
      )}

      {/* Content */}
      <div className="mb-4">
        {/* MAIN */}
        {activeTab === 'main' && (
          <>
            <Section title={t('open_main', lang)} count={openMain.length}>
              <List items={openMain} />
            </Section>

            <CompletedSection
              title={t('done_main', lang)}
              count={doneMain.length}
              open={showDoneMain}
              onToggle={() => setShowDoneMain(v => !v)}
              items={doneMain}
              lang={lang}
            />
          </>
        )}

        {/* SIDE */}
        {activeTab === 'side' && (
          <>
            <Section title={t('open_side', lang)} count={openSide.length}>
              <List items={openSide} />
            </Section>

            <CompletedSection
              title={t('done_side', lang)}
              count={doneSide.length}
              open={showDoneSide}
              onToggle={() => setShowDoneSide(v => !v)}
              items={doneSide}
              lang={lang}
            />
          </>
        )}

        {/* SELF-WORK */}
        {activeTab === 'self' && <SelfWorkTab onAdd={() => setOpenJournal(true)} />}

        {/* STATS */}
        {activeTab === 'stats' && <StatsView />}
      </div>

      {/* Modals */}
      <AddTaskModal open={openAdd} onClose={() => setOpenAdd(false)} />
      <LevelUpModal
        open={showLevelUp && level > Math.max(1, lastLevelSeen - 1)}
        level={level}
        onClose={() => setShowLevelUp(false)}
      />
      <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} />
      <ProfileModal open={openProfile} onClose={() => setOpenProfile(false)} />
      <JournalModal open={openJournal} onClose={() => setOpenJournal(false)} />

      {/* Bottom TabBar */}
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

/* ---------- Helpers ---------- */

function Section({ title, count, children }) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}

function List({ items }) {
  if (items.length === 0) {
    return <div className="text-sm" style={{ color: 'var(--muted)' }} />
  }
  return (
    <div className="grid gap-3">
      {items.map(t => (
        <TaskItem key={t.id} task={t} />
      ))}
    </div>
  )
}

function CompletedSection({ title, count, open, onToggle, items, lang }) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        <button className="btn btn-ghost h-8 px-3 text-sm" onClick={onToggle}>
          {open ? '▲ ' : '▼ '}
          {count}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="card p-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {items.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                {t('none_open', lang)}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {items.map(it => (
                  <button
                    key={it.id}
                    className="badge"
                    title="Undo"
                    onClick={() => useAppStore.getState().toggleTask(it.id)}
                  >
                    {it.title}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SelfWorkTab({ onAdd }) {
  const lang = useAppStore(s => s.language)
  const journal = useAppStore(s => s.journal)
  const remove = useAppStore(s => s.removeJournalEntry)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('selfwork', lang)}</h2>
        <button className="btn btn-primary h-9 px-3 text-sm" onClick={onAdd}>
          {t('new_entry', lang)}
        </button>
      </div>
      <div className="grid gap-3">
        {journal.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Još nema unosa.
          </div>
        ) : (
          journal.map(entry => (
            <motion.div
              key={entry.id}
              className="card p-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{entry.mood}</div>
                  <div style={{ color: 'var(--muted)' }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                  {entry.note && <div className="mt-1">{entry.note}</div>}
                </div>
                <button className="btn btn-ghost" onClick={() => remove(entry.id)}>
                  {t('delete', lang)}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
