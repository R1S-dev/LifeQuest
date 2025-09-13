import { motion } from 'framer-motion'
import { Swords, Sparkles, NotebookPen, BarChart3 } from 'lucide-react'

const tabs = [
  { key:'main', icon: Swords, label:'Main' },
  { key:'side', icon: Sparkles, label:'Side' },
  { key:'self', icon: NotebookPen, label:'Self' },
  { key:'stats', icon: BarChart3, label:'Stats' },
]

export default function TabBar({ active, onChange }) {
  return (
    <div className="tabbar-wrap">
      <div className="tabbar">
        {tabs.map(t => {
          const Icon = t.icon
          const isActive = active === t.key
          return (
            <button
              key={t.key}
              className={`tabbtn ${isActive ? 'active' : ''}`}
              onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); onChange(t.key) }}
              title={t.label}
            >
              <motion.div
                initial={false}
                animate={{ scale: isActive ? 1.05 : 1, opacity: 1 }}
                transition={{ type:'spring', stiffness: 300, damping: 18 }}
              >
                <Icon className="h-6 w-6" style={{ color: isActive ? `rgb(var(--accent))` : 'var(--fg)' }}/>
              </motion.div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
