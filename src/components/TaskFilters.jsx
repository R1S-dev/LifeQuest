import { useState, useEffect } from 'react'
import { Filter, Search, Swords, Sparkles } from 'lucide-react'

export default function TaskFilters({ onChange }) {
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')     // all | main | side
  const [difficulty, setDifficulty] = useState('all') // all | easy | medium | hard

  useEffect(() => {
    const t = setTimeout(() => onChange({ q, type, difficulty }), 150)
    return () => clearTimeout(t)
  }, [q, type, difficulty, onChange])

  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
        <Filter className="h-4 w-4" /> Filters
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-zinc-500" />
          <input className="input pl-9" placeholder="Search…" value={q} onChange={(e)=>setQ(e.target.value)} />
        </div>
        <div className="relative">
          <select className="select" value={type} onChange={(e)=>setType(e.target.value)}>
            <option value="all">All types</option>
            <option value="main">Main <Swords /></option>
            <option value="side">Side <Sparkles /></option>
          </select>
        </div>
        <div className="relative">
          <select className="select" value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}>
            <option value="all">Any difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
    </div>
  )
}
