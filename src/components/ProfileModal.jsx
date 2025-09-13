import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Camera, Image as ImageIcon, Trophy, Award, Sparkles, Star, Target, Crown
} from 'lucide-react'
import { useAppStore } from '../store'
import { t } from '../utils/i18n'

/* ---------------- AvatarCropper (FB-like) ---------------- */
function AvatarCropper({ file, onCancel, onSave }) {
  const [img, setImg] = useState(null)
  const containerSize = 280
  const outSize = 512

  useEffect(() => {
    if (!file) return
    const url = typeof file === 'string' ? file : URL.createObjectURL(file)
    const im = new Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => setImg(im)
    im.src = url
    return () => { if (typeof file !== 'string') URL.revokeObjectURL(url) }
  }, [file])

  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const baseScale = useMemo(() => {
    if (!img) return 1
    return Math.max(containerSize / img.width, containerSize / img.height)
  }, [img])

  function clampOffset(nextTx, nextTy) {
    if (!img) return { tx: nextTx, ty: nextTy }
    const drawW = img.width * baseScale * scale
    const drawH = img.height * baseScale * scale
    const maxX = Math.max(0, (drawW - containerSize) / 2)
    const maxY = Math.max(0, (drawH - containerSize) / 2)
    return {
      tx: Math.min(maxX, Math.max(-maxX, nextTx)),
      ty: Math.min(maxY, Math.max(-maxY, nextTy)),
    }
  }

  const onPointerDown = (e) => {
    dragging.current = true
    const p = ('touches' in e) ? e.touches[0] : e
    last.current = { x: p.clientX, y: p.clientY }
  }
  const onPointerMove = (e) => {
    if (!dragging.current) return
    const p = ('touches' in e) ? e.touches[0] : e
    const dx = p.clientX - last.current.x
    const dy = p.clientY - last.current.y
    last.current = { x: p.clientX, y: p.clientY }
    const next = clampOffset(tx + dx, ty + dy)
    setTx(next.tx); setTy(next.ty)
  }
  const onPointerUp = () => { dragging.current = false }
  const onWheel = (e) => {
    e.preventDefault()
    const next = Math.min(3, Math.max(1, scale + (e.deltaY < 0 ? 0.1 : -0.1)))
    setScale(next)
    const cl = clampOffset(tx, ty); setTx(cl.tx); setTy(cl.ty)
  }

  const handleSave = () => {
    if (!img) return
    const cvs = document.createElement('canvas')
    cvs.width = outSize; cvs.height = outSize
    const ctx = cvs.getContext('2d')

    const drawW = img.width * baseScale * scale
    const drawH = img.height * baseScale * scale
    const topLeftX = (containerSize - drawW) / 2 + tx
    const topLeftY = (containerSize - drawH) / 2 + ty
    const factor = outSize / containerSize

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, outSize, outSize)
    ctx.drawImage(img, topLeftX * factor, topLeftY * factor, drawW * factor, drawH * factor)
    onSave?.(cvs.toDataURL('image/png'))
  }

  return (
    <motion.div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onWheel={onWheel}
    >
      <motion.div
        className="card w-[min(96vw,640px)] p-0 overflow-hidden"
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-5 py-4"
             style={{ background:'var(--card)', borderBottom:'1px solid var(--card-border)' }}>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" /><span className="text-base font-semibold">Uredi profilnu sliku</span>
          </div>
          <button className="btn btn-ghost" onClick={onCancel}><X className="h-5 w-5" /></button>
        </div>

        <div className="px-5 py-5">
          <div className="mx-auto" style={{ width: 280, height: 280 }}>
            <div
              className="relative rounded-full overflow-hidden border"
              style={{ width: 280, height: 280, borderColor:'var(--card-border)', background:'#0b0b0f', touchAction:'none', cursor:'grab' }}
              onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
              onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
            >
              {img ? (
                <img
                  src={img.src}
                  alt="editing"
                  draggable={false}
                  style={{
                    position:'absolute',
                    left:'50%', top:'50%',
                    transform:`translate(-50%,-50%) translate(${tx}px,${ty}px) scale(${baseScale*scale})`,
                    transformOrigin:'center center',
                    userSelect:'none', pointerEvents:'none',
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ImageIcon className="h-7 w-7" style={{ color:'var(--muted)' }} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 justify-center">
            <span className="text-xs" style={{color:'var(--muted)'}}>Zoom</span>
            <input type="range" min="1" max="3" step="0.01" value={scale} onChange={(e)=>setScale(Number(e.target.value))} className="w-64" />
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            <button className="btn btn-ghost" onClick={onCancel}>Otkaži</button>
            <button className="btn btn-primary" onClick={handleSave}>Sačuvaj</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------------- Achievements helpers ---------------- */
function ProgressBar({ value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="w-full h-2 rounded-full" style={{ background:'var(--input)' }}>
      <div className="h-2 rounded-full" style={{ width:`${pct}%`, background: color }} />
    </div>
  )
}

function Achievement({ icon:Icon, title, goal, value, color }) {
  const unlocked = value >= goal
  return (
    <div className={`card p-3 flex flex-col gap-2 ${unlocked ? '' : 'opacity-85'}`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl border flex items-center justify-center shrink-0"
             style={{ borderColor: unlocked ? `${color}55` : 'var(--card-border)', background: unlocked ? `${color}22` : 'var(--card)' }}>
          <Icon className="h-5 w-5" style={{ color: unlocked ? color : 'var(--muted)' }} />
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{title}</div>
          <div className="text-[11px]" style={{ color:'var(--muted)' }}>
            {unlocked ? 'Unlocked' : `${value}/${goal}`}
          </div>
        </div>
      </div>
      {!unlocked && <ProgressBar value={value} max={goal} color={color} />}
    </div>
  )
}

/* ---------------- ProfileModal ---------------- */
export default function ProfileModal({ open, onClose }) {
  const user = useAppStore(s => s.user)
  const setUserName = useAppStore(s => s.setUserName)
  const setUserAvatar = useAppStore(s => s.setUserAvatar)
  const removeUserAvatar = useAppStore(s => s.removeUserAvatar)

  const lang = useAppStore(s => s.language)
  const tasks = useAppStore(s => s.tasks)
  const totalXP = useAppStore(s => s.totalXP)
  const journal = useAppStore(s => s.journal)

  const [name, setName] = useState(user?.name || '')
  const [pendingFile, setPendingFile] = useState(null)
  const fileRef = useRef(null)

  // Lock scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev || '' }
  }, [open])

  // Metrics
  const completed = tasks.filter(t => t.isCompleted).length
  const mainCompleted = tasks.filter(t => t.isCompleted && t.type === 'main').length
  const sideCompleted = tasks.filter(t => t.isCompleted && t.type === 'side').length
  const journalCount = journal.length

  // Achievements (ciljevi sa progresom)
  const achievements = [
    { icon: Trophy,  title: 'First Steps',          goal: 1,   value: completed,     color: '#22c55e' },
    { icon: Trophy,  title: 'Task Tamer',           goal: 10,  value: completed,     color: '#38bdf8' },
    { icon: Trophy,  title: 'Quest Crusher',        goal: 50,  value: completed,     color: '#0ea5e9' },
    { icon: Award,   title: 'Main Master',          goal: 10,  value: mainCompleted, color: '#f59e0b' },
    { icon: Award,   title: 'Side Specialist',      goal: 10,  value: sideCompleted, color: '#a78bfa' },
    { icon: Star,    title: 'Leveling Up',          goal: 500, value: totalXP,       color: '#ef4444' },
    { icon: Star,    title: 'Epic Grinder',         goal: 2000,value: totalXP,       color: '#fb7185' },
    { icon: Sparkles,title: 'Mindful',              goal: 5,   value: journalCount,  color: '#10b981' },
    { icon: Target,  title: 'Consistency',          goal: 20,  value: journalCount,  color: '#84cc16' },
    { icon: Crown,   title: 'Hero in the Making',   goal: 100, value: completed,     color: '#eab308' },
  ]

  const saveName = () => { setUserName(name.trim() || 'Adventurer'); onClose?.() }
  const handleAvatarPick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPendingFile(f)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="card w-[min(96vw,760px)] max-h-[90vh] p-0 overflow-hidden flex flex-col"
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3"
                   style={{ background:'var(--card)', borderBottom:'1px solid var(--card-border)' }}>
                <span className="text-base font-semibold">{t('profile', lang) || 'Profile'}</span>
                <button className="btn btn-ghost" onClick={onClose}><X className="h-5 w-5" /></button>
              </div>

              {/* Body (scroll area) */}
              <div
                className="px-5 pt-5 pb-[calc(16px+env(safe-area-inset-bottom))] overflow-y-auto"
                style={{ maxHeight: 'calc(90vh - 48px)' }} // 48px ~= header
              >
                {/* Hero block (FB-like header) */}
                <div className="mb-6 rounded-2xl border overflow-hidden"
                     style={{ borderColor:'var(--card-border)', background:'linear-gradient(135deg, rgba(var(--accent),.15), transparent 60%)' }}>
                  <div className="flex items-center gap-4 p-4">
                    {/* Avatar */}
                    <div className="relative h-20 w-20 rounded-full overflow-hidden shrink-0 border"
                         style={{ borderColor:'var(--card-border)', background:'var(--card)' }}>
                      {user?.avatar ? (
                        <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ImageIcon className="h-7 w-7" style={{ color:'var(--muted)' }} />
                        </div>
                      )}
                      <button
                        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition bg-black/45"
                        onClick={()=>fileRef.current?.click()}
                        title="Promeni sliku"
                      >
                        <div className="rounded-full p-2" style={{ background:'rgba(255,255,255,.12)' }}>
                          <Camera className="h-5 w-5" />
                        </div>
                      </button>
                    </div>

                    {/* Name + actions */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm mb-1">{t('your_name', lang) || 'Your name'}</label>
                      <div className="flex items-center gap-2">
                        <input className="input flex-1" value={name} onChange={(e)=>setName(e.target.value)} />
                        <button className="btn btn-primary" onClick={saveName}>{t('save', lang) || 'Save'}</button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button className="btn btn-ghost" onClick={()=>fileRef.current?.click()}>
                          <Camera className="h-4 w-4" /> {t('change', lang) || 'Change photo'}
                        </button>
                        {user?.avatar && (
                          <button className="btn btn-ghost" onClick={removeUserAvatar}>
                            {t('remove', lang) || 'Remove photo'}
                          </button>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <section className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm" style={{color:'var(--muted)'}}>
                    <Trophy className="h-4 w-4" /> Achievements
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {achievements.map((a, i) => (
                      <Achievement key={i} icon={a.icon} title={a.title} goal={a.goal} value={a.value} color={a.color} />
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop modal */}
      <AnimatePresence>
        {pendingFile && (
          <AvatarCropper
            file={pendingFile}
            onCancel={()=>setPendingFile(null)}
            onSave={(dataUrl)=>{ setUserAvatar(dataUrl); setPendingFile(null) }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
