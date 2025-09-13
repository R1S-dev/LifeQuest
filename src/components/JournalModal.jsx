import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, NotebookPen, Smile, Leaf, Sparkles, AlertTriangle, Frown,
  Star, Quote, Clock, Heart, Sun, Zap, BookOpen, Music
} from 'lucide-react'
import { useAppStore } from '../store'
import { t } from '../utils/i18n'

/** Konstante za raspoloženja (usaglašeno sa StatsView) */
const MOODS = [
  { key: 'happy',    labelEn: 'Happy',    labelSr: 'Srećno',     Icon: Smile,         color: '#22c55e' },
  { key: 'calm',     labelEn: 'Calm',     labelSr: 'Smireno',    Icon: Leaf,          color: '#38bdf8' },
  { key: 'excited',  labelEn: 'Excited',  labelSr: 'Uzbuđeno',   Icon: Sparkles,      color: '#a78bfa' },
  { key: 'stressed', labelEn: 'Stressed', labelSr: 'Pod stresom',Icon: AlertTriangle, color: '#f59e0b' },
  { key: 'sad',      labelEn: 'Sad',      labelSr: 'Tužno',      Icon: Frown,         color: '#ef4444' },
]

const QUICK_CHIPS = [
  { textEn:'Grateful',   textSr:'Zahvalan',   Icon: Heart },
  { textEn:'Sunny day',  textSr:'Sunčan dan', Icon: Sun },
  { textEn:'Focused',    textSr:'Fokus',      Icon: BookOpen },
  { textEn:'Energized',  textSr:'Energija',   Icon: Zap },
  { textEn:'Music',      textSr:'Muzika',     Icon: Music },
]

function nowClockString() {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2,'0')
  const mm = String(d.getMinutes()).padStart(2,'0')
  return `${hh}:${mm}`
}

export default function JournalModal({ open, onClose }) {
  const lang = useAppStore(s => s.language)
  const addEntry = useAppStore(s => s.addJournalEntry)

  // Lokalni state
  const [mood, setMood] = useState(null)           // 'happy' | 'calm' | ...
  const [intensity, setIntensity] = useState(3)    // 1–5
  const [note, setNote] = useState('')

  // Reset forme kada se modal otvori
  useEffect(() => {
    if (!open) return
    setMood(null)
    setIntensity(3)
    setNote('')
  }, [open])

  const labels = useMemo(() => ({
    title:           t('new_entry', lang) || 'New Entry',
    pickMood:        t('pick_mood', lang) || 'How do you feel?',
    intensityLabel:  t('intensity', lang) || 'Intensity',
    noteLabel:       t('note', lang) || 'Add a note',
    save:            t('save', lang) || 'Save',
    cancel:          t('cancel', lang) || 'Cancel',
    timestampInfo:   t('timestamp_info', lang) || 'Time will be recorded automatically',
  }), [lang])

  const moodLabel = (m) => {
    const def = MOODS.find(x => x.key === m)
    if (!def) return ''
    return lang === 'sr' ? def.labelSr : def.labelEn
  }

  const addChip = (txt) => {
    setNote((prev) => prev ? `${prev} ${txt}` : txt)
  }

  const onSubmit = (e) => {
    e?.preventDefault?.()
    if (!mood) return
    addEntry({
      mood,
      intensity,
      note: note.trim(),
      createdAt: Date.now(),
    })
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
            onSubmit={onSubmit}
            className="card w-[min(96vw,680px)] p-0 overflow-hidden"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
              style={{ background:'var(--card)', borderBottom:'1px solid var(--card-border)' }}
            >
              <div className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4" />
                <h3 className="text-base font-semibold">{labels.title}</h3>
              </div>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 grid gap-6">
              {/* Mood pick — velike ikonice */}
              <section className="grid gap-2">
                <div className="flex items-center gap-2 text-sm" style={{ color:'var(--muted)' }}>
                  <Smile className="h-4 w-4" /> {labels.pickMood}
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {MOODS.map(({ key, Icon, color }) => {
                    const active = mood === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setMood(key)}
                        className={`rounded-2xl border p-3 flex flex-col items-center gap-1 transition ${
                          active ? 'outline' : ''
                        }`}
                        title={moodLabel(key)}
                        style={{
                          borderColor: active ? `${color}66` : 'var(--card-border)',
                          background:  active ? `${color}22` : 'var(--card)',
                        }}
                      >
                        <Icon className="h-6 w-6" style={{ color: active ? color : 'var(--muted)' }} />
                        <span className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                          {moodLabel(key)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Intensity slider */}
              <section className="grid gap-2">
                <div className="flex items-center gap-2 text-sm" style={{ color:'var(--muted)' }}>
                  <Star className="h-4 w-4" /> {labels.intensityLabel}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={intensity}
                    onChange={(e)=>setIntensity(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="h-7 min-w-[2.5rem] rounded-md px-2 text-sm flex items-center justify-center"
                       style={{ background:'var(--input)' }}>
                    {intensity}/5
                  </div>
                </div>
              </section>

              {/* Quick chips */}
              <section className="grid gap-2">
                <div className="flex items-center gap-2 text-sm" style={{ color:'var(--muted)' }}>
                  <Quote className="h-4 w-4" /> {lang==='sr' ? 'Brze beleške' : 'Quick notes'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_CHIPS.map(({ textEn, textSr, Icon }) => (
                    <button
                      key={textEn}
                      type="button"
                      className="badge border"
                      onClick={()=>addChip(lang==='sr' ? textSr : textEn)}
                      title={lang==='sr' ? textSr : textEn}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1" />
                      {lang==='sr' ? textSr : textEn}
                    </button>
                  ))}
                </div>
              </section>

              {/* Note */}
              <section className="grid gap-2">
                <div className="flex items-center gap-2 text-sm" style={{ color:'var(--muted)' }}>
                  <Quote className="h-4 w-4" /> {labels.noteLabel}
                </div>
                <textarea
                  className="input min-h-[96px]"
                  placeholder={lang==='sr' ? 'Dodatni kontekst (opciono)…' : 'Additional context (optional)…'}
                  value={note}
                  onChange={(e)=>setNote(e.target.value)}
                />
                <div className="flex items-center gap-2 text-[11px]" style={{ color:'var(--muted)' }}>
                  <Clock className="h-3.5 w-3.5" />
                  {labels.timestampInfo}: <span className="font-medium ml-1">{nowClockString()}</span>
                </div>
              </section>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  {labels.cancel}
                </button>
                <button type="submit" className="btn btn-primary" disabled={!mood}>
                  {labels.save}
                </button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
