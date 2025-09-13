import { useEffect, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Dice5, Swords, Sparkles, PencilLine, Tag, Leaf, Target, Flame,
  Clock, Sun, CalendarDays, Repeat, BadgePlus, Star, Ban
} from 'lucide-react'
import { useAppStore } from '../store'
import { difficultyXP } from '../utils/leveling'
import { t } from '../utils/i18n'

/** helpers */
function fmtTimeInput(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
function parseDueAtFromTime(str) {
  if (!str) return null
  const [hh, mm] = str.split(':').map(Number)
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null
  const now = new Date()
  const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0)
  return dt.getTime()
}

/** Random quest generator (ugrađeno u modal da ne dodajemo nove fajlove) */
function randomQuest() {
  const types = ['main', 'side']
  const categories = ['Dom', 'Zdravlje', 'Fitness', 'Učenje', 'Posao', 'Navike', 'Finansije', 'Higijena', 'Veštine']
  const mainTitles = [
    'Operi sudove', 'Sredi sobu', '30 min trening', 'Prošetaj 20 min',
    'Spremi zdrav obrok', 'Sat vremena učenja', 'Odvoji 15 min za meditaciju',
    'Sortiraj dokumenta', 'Napravi plan za sutra', 'Pročitaj 10 strana'
  ]
  const sideTitles = [
    'Popij 2 čaše vode', 'Pošalji poruku prijatelju', 'Uradi 20 čučnjeva',
    'Pospremi sto', 'Zameni posteljinu', 'Raširi veš',
    'Izađi na svež vazduh', 'Napravi listu kupovine', 'Očisti inbox'
  ]
  const diffPool = ['easy', 'easy', 'easy', 'medium', 'medium', 'hard'] // težine „weighted“
  const repeatPool = ['none', 'none', 'none', 'daily', 'weekly']         // ponavljanje „weighted“

  const type = types[Math.floor(Math.random() * types.length)]
  const title = (type === 'main' ? mainTitles : sideTitles)[Math.floor(Math.random() * (type === 'main' ? mainTitles.length : sideTitles.length))]
  const category = categories[Math.floor(Math.random() * categories.length)]
  const difficulty = diffPool[Math.floor(Math.random() * diffPool.length)]
  const repeat = repeatPool[Math.floor(Math.random() * repeatPool.length)]
  const xp = difficultyXP[difficulty] ?? 10

  // ~50% šanse da dodelimo due time u naredna 3h
  let dueAt = null
  if (Math.random() < 0.5) {
    const now = new Date()
    const minutes = Math.floor(Math.random() * 180) // 0-180 min
    const dt = new Date(now.getTime() + minutes * 60000)
    dt.setSeconds(0, 0)
    dueAt = dt.getTime()
  }

  return {
    title, category, difficulty, repeat, dueAt, type, xp, origin: 'random'
  }
}

export default function AddTaskModal({ open, onClose }) {
  const lang = useAppStore(s => s.language)
  const addTask = useAppStore(s => s.addTask)

  // form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState('main') // main | side
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('easy') // easy | medium | hard
  const [repeat, setRepeat] = useState('none') // none | daily | weekly
  const [time, setTime] = useState('') // "HH:MM"
  const [xp, setXp] = useState('')

  // reset forme kad se modal otvori
  useEffect(() => {
    if (!open) return
    setTitle('')
    setType('main')
    setCategory('')
    setDifficulty('easy')
    setRepeat('none')
    setTime('')
    setXp('')
  }, [open])

  const defaultXP = useMemo(() => difficultyXP[difficulty] ?? 10, [difficulty])

  const submit = (e) => {
    e.preventDefault()
    const realXP = xp.trim() === '' ? defaultXP : Math.max(0, Number(xp))
    const dueAt = parseDueAtFromTime(time)

    addTask({
      title: title || 'Untitled',
      category: category || (type === 'main' ? 'General' : 'Side'),
      difficulty,
      xp: realXP,
      repeat,
      dueAt,
      type,
      origin: 'user',
    })
    onClose?.()
  }

  const handleAddRandom = () => {
    const q = randomQuest()
    addTask(q)
    onClose?.()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.form
            onSubmit={submit}
            className="card w-[min(96vw,680px)] p-0 overflow-hidden"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
              style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}
            >
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                <h3 className="text-base font-semibold">{t('new_task', lang) || 'New Quest'}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleAddRandom}
                  title="Add Random Quest"
                >
                  <Dice5 className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Random</span>
                </button>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-5 grid gap-5">
              {/* Title */}
              <div>
                <label className="block text-sm mb-1">
                  <span className="inline-flex items-center gap-1">
                    <PencilLine className="h-4 w-4" /> {t('name', lang) || 'Title'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    className="input pl-10"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Npr. Operi sudove"
                  />
                  <PencilLine className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                </div>
              </div>

              {/* Type (segmented icon toggle) */}
              <div>
                <label className="block text-sm mb-2">
                  <span className="inline-flex items-center gap-1">
                    {type === 'main' ? <Swords className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    Tip
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`btn btn-ghost ${type === 'main' ? 'outline' : ''}`}
                    onClick={() => setType('main')}
                    title="Main Quest"
                  >
                    <Swords className="h-4 w-4" /> Main
                  </button>
                  <button
                    type="button"
                    className={`btn btn-ghost ${type === 'side' ? 'outline' : ''}`}
                    onClick={() => setType('side')}
                    title="Side Quest"
                  >
                    <Sparkles className="h-4 w-4" /> Side
                  </button>
                </div>
              </div>

              {/* Category & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-sm mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Tag className="h-4 w-4" /> {t('category', lang) || 'Category'}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      className="input pl-10"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Dom, Zdravlje…"
                    />
                    <Tag className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                  </div>
                </div>

                {/* Difficulty segmented (icons) */}
                <div>
                  <label className="block text-sm mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-4 w-4" /> {t('difficulty', lang) || 'Difficulty'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      className={`btn btn-ghost ${difficulty === 'easy' ? 'outline' : ''}`}
                      onClick={() => setDifficulty('easy')}
                      title={t('easy', lang) || 'Easy'}
                    >
                      <Leaf className="h-4 w-4" /> {t('easy', lang) || 'Easy'}
                    </button>
                    <button
                      type="button"
                      className={`btn btn-ghost ${difficulty === 'medium' ? 'outline' : ''}`}
                      onClick={() => setDifficulty('medium')}
                      title={t('medium', lang) || 'Medium'}
                    >
                      <Target className="h-4 w-4" /> {t('medium', lang) || 'Medium'}
                    </button>
                    <button
                      type="button"
                      className={`btn btn-ghost ${difficulty === 'hard' ? 'outline' : ''}`}
                      onClick={() => setDifficulty('hard')}
                      title={t('hard', lang) || 'Hard'}
                    >
                      <Flame className="h-4 w-4" /> {t('hard', lang) || 'Hard'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recurrence & Due time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Repeat className="h-4 w-4" /> {t('recurrence', lang) || 'Recurrence'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      className={`btn btn-ghost ${repeat === 'none' ? 'outline' : ''}`}
                      onClick={() => setRepeat('none')}
                      title={t('none', lang) || 'None'}
                    >
                      <Ban className="h-4 w-4" /> {t('none', lang) || 'None'}
                    </button>
                    <button
                      type="button"
                      className={`btn btn-ghost ${repeat === 'daily' ? 'outline' : ''}`}
                      onClick={() => setRepeat('daily')}
                      title={t('daily', lang) || 'Daily'}
                    >
                      <Sun className="h-4 w-4" /> {t('daily', lang) || 'Daily'}
                    </button>
                    <button
                      type="button"
                      className={`btn btn-ghost ${repeat === 'weekly' ? 'outline' : ''}`}
                      onClick={() => setRepeat('weekly')}
                      title={t('weekly', lang) || 'Weekly'}
                    >
                      <CalendarDays className="h-4 w-4" /> {t('weekly', lang) || 'Weekly'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {t('due_time', lang) || 'Due time'}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      className="input pl-10"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                    <Clock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                  </div>
                </div>
              </div>

              {/* XP */}
              <div>
                <label className="block text-sm mb-1">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4" /> {t('custom_xp', lang) || 'Custom XP'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    className="input pl-10"
                    type="number"
                    min="0"
                    placeholder={`Default: ${defaultXP}`}
                    value={xp}
                    onChange={(e) => setXp(e.target.value)}
                  />
                  <BadgePlus className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button type="submit" className="btn btn-primary">
                  <Swords className="h-4 w-4" /> {t('save', lang) || 'Add Quest'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleAddRandom}>
                  <Dice5 className="h-4 w-4" /> Add Random
                </button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
