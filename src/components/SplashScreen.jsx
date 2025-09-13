import { motion } from 'framer-motion'

/**
 * Minimalan, prezentacioni splash (loading) ekran.
 * App ga prikazuje kratko pri startu – nema state, samo animacije.
 */
export default function SplashScreen() {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{
        background:
          'radial-gradient(1200px 800px at 50% -20%, rgba(var(--accent),.12), transparent 60%), var(--bg)',
      }}
    >
      <div className="flex flex-col items-center">
        {/* Logo + pulsirajući oreol */}
        <div className="relative h-28 w-28 flex items-center justify-center">
          {/* glow */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'rgba(var(--accent),.18)', filter: 'blur(22px)' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* kružni „XP ring“ */}
          <svg width="120" height="120" viewBox="0 0 120 120" className="absolute">
            <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,.08)" strokeWidth="6" fill="none" />
            <motion.circle
              cx="60"
              cy="60"
              r="50"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              style={{ stroke: 'rgb(var(--accent))' }}
              strokeDasharray="314"
              strokeDashoffset="314"
              animate={{ strokeDashoffset: [314, 0, 314] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>

          {/* sam logo */}
          <div className="h-16 w-16 rounded-2xl border overflow-hidden flex items-center justify-center"
               style={{ borderColor:'var(--card-border)', background:'var(--card)' }}>
            <img src="/logo.png" alt="logo" className="h-10 w-10 object-contain" />
          </div>
        </div>

        {/* Naziv i taglajn */}
        <div className="mt-5 text-center">
          <div className="text-xl font-extrabold tracking-tight">LifeQuest</div>
          <div className="text-sm mt-1" style={{ color:'var(--muted)' }}>
            turn your day into a game
          </div>
        </div>

        {/* Loading traka */}
        <div className="mt-6 h-2 w-56 rounded-full overflow-hidden" style={{ background:'var(--input)' }}>
          <motion.div
            className="h-full"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(var(--accent),.6), transparent)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  )
}
