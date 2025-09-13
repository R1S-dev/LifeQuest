import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function LevelUpModal({ open, level, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="card max-w-md w-full p-6 text-center relative overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          >
            {/* Subtle corner glow */}
            <div className="pointer-events-none absolute -inset-1 rounded-3xl" style={{ boxShadow: '0 0 60px rgba(239,68,68,0.25) inset' }} />
            <div className="relative">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                   style={{ backgroundColor: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.35)' }}>
                <Sparkles className="h-7 w-7" style={{ color: 'rgb(var(--accent-400))' }}/>
              </div>
              <h3 className="text-xl font-bold mb-1">Novi nivo!</h3>
              <p className="text-zinc-300">Stigao si na <span className="font-semibold">Level {level}</span>. Nastavi sa questovima!</p>
              <button onClick={onClose} className="btn btn-primary mt-5 w-full">Idemo dalje</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
