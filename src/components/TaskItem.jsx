import { motion } from 'framer-motion'
import { useAppStore } from '../store'
import { t } from '../utils/i18n'
import {
  Check,
  Undo2,
  Clock,
  Repeat,
  Swords,
  Sparkles,
  BadgePlus,
} from 'lucide-react'

/** Boje za težinu (koristimo Tailwind paletu – već je tu) */
const diffCls = {
  easy:   'border-emerald-500/35 text-emerald-300',
  medium: 'border-amber-500/35 text-amber-300',
  hard:   'border-rose-500/35 text-rose-300',
}

function fmtTime(ts) {
  if (!ts) return null
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2,'0')
  const mm = String(d.getMinutes()).padStart(2,'0')
  return `${hh}:${mm}`
}

export default function TaskItem({ task }) {
  const lang = useAppStore(s => s.language)
  const toggleTask = useAppStore(s => s.toggleTask)

  const TypeIcon = task.type === 'main' ? Swords : Sparkles
  const isDone = !!task.isCompleted
  const due = fmtTime(task.dueAt)

  const onToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleTask(task.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="card p-3 relative overflow-hidden"
      style={{ opacity: isDone ? 0.78 : 1 }}
    >
      {/* Subtle accent glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition"
        aria-hidden
      />

      <div className="flex items-center gap-3">
        {/* Left icon pill */}
        <div
          className="h-10 w-10 rounded-xl border flex items-center justify-center shrink-0"
          style={{ borderColor:'rgba(var(--accent),.35)', background:'rgba(var(--accent),.10)' }}
        >
          <TypeIcon className="h-5 w-5" style={{ color:'rgb(var(--accent))' }} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className={`font-medium truncate ${isDone ? 'line-through opacity-80' : ''}`}>
            {task.title}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color:'var(--muted)' }}>
            {task.category && <span className="badge">{task.category}</span>}
            <span className={`badge border ${diffCls[task.difficulty] || ''}`}>
              {String(task.difficulty || '').toUpperCase() || 'EASY'}
            </span>
            <span className="badge border">
              <BadgePlus className="h-3.5 w-3.5 mr-1" />+{task.xp} XP
            </span>

            {task.repeat !== 'none' && (
              <span className="badge border">
                <Repeat className="h-3.5 w-3.5 mr-1" />
                {task.repeat === 'daily' ? t('daily', lang) : t('weekly', lang)}
              </span>
            )}

            {due && (
              <span className="badge border">
                <Clock className="h-3.5 w-3.5 mr-1" />
                {due}
              </span>
            )}
          </div>
        </div>

        {/* Toggle button (check/undo) */}
        <button
          onClick={onToggle}
          className="h-10 w-10 shrink-0 rounded-xl relative overflow-hidden transition active:translate-y-[1px]"
          aria-pressed={isDone}
          title={isDone ? 'Undo' : 'Done'}
          style={{
            border: '1px solid var(--card-border)',
            background: isDone ? 'rgba(34,197,94,.12)' : 'var(--input)',
          }}
        >
          {/* ring/halo on hover */}
          <span className="absolute inset-0 pointer-events-none" style={{ boxShadow: isDone ? 'inset 0 0 0 1px rgba(34,197,94,.35)' : 'inset 0 0 0 1px rgba(var(--accent),.28)' }} />
          <div className="h-full w-full flex items-center justify-center">
            {isDone ? (
              <Undo2 className="h-5 w-5" style={{ color: '#86efac' }} />
            ) : (
              <Check className="h-5 w-5" style={{ color: 'rgb(var(--accent))' }} />
            )}
          </div>
        </button>
      </div>
    </motion.div>
  )
}
