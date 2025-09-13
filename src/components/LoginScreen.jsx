import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Dice5, Swords, UserCircle2 } from 'lucide-react'
import { useAppStore } from '../store'

/**
 * „Hero“ login: logo, avatar pick (FB-like overlay), unos imena i Start.
 * Mobile-first, čiste animacije, bez komplikovanog cropa (brz ulaz).
 */
export default function LoginScreen() {
  const login = useAppStore(s => s.login)
  const setUserName = useAppStore(s => s.setUserName)
  const setUserAvatar = useAppStore(s => s.setUserAvatar)

  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(null) // dataURL preview

  const fileRef = useRef(null)

  // Prefill ako postoji nešto u localStorage (poželjno, ali ne kritično)
  useEffect(() => {
    const stored = useAppStore.getState().user
    if (stored?.name) setName(stored.name)
    if (stored?.avatar) setAvatar(stored.avatar)
  }, [])

  const onPickAvatar = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result)
    reader.readAsDataURL(f)
  }

  const randomNames = ['Adventurer', 'Hero', 'Ranger', 'Mage', 'Voyager', 'Seeker']
  const setRandom = () => setName(randomNames[Math.floor(Math.random() * randomNames.length)])

  const onStart = (e) => {
    e.preventDefault()
    const finalName = name.trim() || 'Adventurer'
    setUserName(finalName)
    if (avatar) setUserAvatar(avatar)
    // većina store-ova ignoriše višak argumenata; ako tvoj login prima nešto, super – ako ne, ok.
    login?.(finalName)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          'radial-gradient(1200px 800px at 50% -10%, rgba(var(--accent),.12), transparent 60%), var(--bg)',
      }}
    >
      <motion.form
        onSubmit={onStart}
        className="w-full max-w-md card p-6 overflow-hidden"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        {/* Header sa logom */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl border overflow-hidden flex items-center justify-center"
               style={{ borderColor:'var(--card-border)', background:'var(--card)' }}>
            <img src="/logo.png" alt="logo" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight">LifeQuest</div>
            <div className="text-[11px]" style={{ color:'var(--muted)' }}>
              gamify your life
            </div>
          </div>
        </div>

        {/* Avatar pick (okrugao, sa overlay kamerom) */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden shrink-0 border"
               style={{ borderColor:'var(--card-border)', background:'var(--card)' }}>
            {avatar ? (
              <img src={avatar} className="h-full w-full object-cover" alt="avatar preview" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <UserCircle2 className="h-8 w-8" style={{ color:'var(--muted)' }} />
              </div>
            )}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Promeni sliku"
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition bg-black/45"
            >
              <div className="rounded-full p-2" style={{ background:'rgba(255,255,255,.12)' }}>
                <Camera className="h-5 w-5" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
          </div>

          <div className="flex-1 min-w-0">
            <label className="block text-sm mb-1">Kako te zovemo?</label>
            <div className="flex items-center gap-2">
              <input
                className="input flex-1"
                value={name}
                onChange={(e)=>setName(e.target.value)}
                placeholder="npr. Marko"
              />
              <button type="button" title="Nasumično ime" onClick={setRandom} className="btn btn-ghost">
                <Dice5 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 grid grid-cols-1 gap-2">
          <button type="submit" className="btn btn-primary h-11 text-base">
            <Swords className="h-5 w-5" /> Započni avanturu
          </button>
          {/* Ako želiš „Continue without avatar“, ostavi samo Start, ovo je dovoljno. */}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs" style={{ color:'var(--muted)' }}>
          Savet: možeš promeniti ime i sliku kasnije u <span className="font-medium">Profile</span>.
        </div>
      </motion.form>
    </div>
  )
}
