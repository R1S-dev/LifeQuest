import { motion } from 'framer-motion'

export default function XPBar({ level, xpIntoLevel, xpForThisLevel, progress }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-zinc-400">Level</div>
        <div className="text-lg font-semibold">{level}</div>
      </div>
      <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          className="h-full"
          style={{ backgroundColor: 'rgb(var(--accent) / 1)' }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        />
      </div>
      <div className="mt-1 text-xs text-zinc-400">
        {xpIntoLevel} / {xpForThisLevel} XP
      </div>
    </div>
  )
}
