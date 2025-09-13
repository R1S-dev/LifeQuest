import { useMemo, useState } from 'react'
import { useAppStore } from '../store'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import {
  Gauge, Flame, PartyPopper, CalendarCheck2, Smile, Leaf, Sparkles, AlertTriangle, Frown
} from 'lucide-react'
import { t } from '../utils/i18n'

/** Definicija emocija (usaglašeno sa JournalModal) */
const MOODS = [
  { key: 'happy',    labelEn: 'Happy',    labelSr: 'Srećno',      Icon: Smile,         color: '#22c55e' },
  { key: 'calm',     labelEn: 'Calm',     labelSr: 'Smireno',     Icon: Leaf,          color: '#38bdf8' },
  { key: 'excited',  labelEn: 'Excited',  labelSr: 'Uzbuđeno',    Icon: Sparkles,      color: '#a78bfa' },
  { key: 'stressed', labelEn: 'Stressed', labelSr: 'Pod stresom', Icon: AlertTriangle, color: '#f59e0b' },
  { key: 'sad',      labelEn: 'Sad',      labelSr: 'Tužno',       Icon: Frown,         color: '#ef4444' },
]
const ORDER = MOODS.map(m => m.key)
const COLOR = Object.fromEntries(MOODS.map(m => [m.key, m.color]))

/* ---------- Helpers ---------- */
const startOfToday = () => { const d=new Date(); d.setHours(0,0,0,0); return d.getTime() }
const startOfNDaysAgo = (n) => { const d=new Date(); d.setDate(d.getDate()-n); d.setHours(0,0,0,0); return d.getTime() }
const startOfMonth = () => { const d=new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.getTime() }

const hourKey = (ts) => String(new Date(ts).getHours()).padStart(2,'0') + ':00'
const dayKey  = (ts) => {
  const d = new Date(ts)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}`
}

function moodLabel(key, lang){ const m=MOODS.find(x=>x.key===key); if(!m) return key; return lang==='sr'?m.labelSr:m.labelEn }

/** izračun trenutnog streak-a (broj uzastopnih dana sa unosima zaključno sa danas) */
function computeStreak(entries){
  if(entries.length===0) return 0
  // set dana sa unosom (na 00:00)
  const set = new Set(entries.map(e=>{ const d=new Date(e.createdAt); d.setHours(0,0,0,0); return d.getTime() }))
  let streak = 0
  let cursor = startOfToday()
  while (set.has(cursor)) {
    streak += 1
    cursor -= 24*60*60*1000
  }
  return streak
}

/** kreira sve X tickove (zbog lepih osa i praznih dana/sati) */
function buildBuckets(mode){
  if (mode==='today') {
    const arr = []
    for (let h=0; h<24; h++) arr.push(String(h).padStart(2,'0') + ':00')
    return arr
  }
  if (mode==='week'){
    const arr = []
    for (let i=6; i>=0; i--) arr.push(dayKey(Date.now() - i*24*3600*1000))
    return arr
  }
  // month
  const now = new Date()
  const last = now.getDate()
  const arr = []
  for (let d=1; d<=last; d++){
    const ts = new Date(now.getFullYear(), now.getMonth(), d).getTime()
    arr.push(dayKey(ts))
  }
  return arr
}

/* ---------- Component ---------- */
export default function StatsView() {
  const lang = useAppStore(s=>s.language)
  const entries = useAppStore(s=>s.journal)
  const tasks = useAppStore(s=>s.tasks)

  const [mode, setMode] = useState('week') // 'today' | 'week' | 'month'

  // Filter by period
  const rangeStart = useMemo(() => {
    if (mode==='today') return startOfToday()
    if (mode==='week')  return startOfNDaysAgo(6)
    return startOfMonth()
  }, [mode])

  const inRange = useMemo(() => {
    return entries.filter(e=> e.createdAt >= rangeStart).sort((a,b)=>a.createdAt-b.createdAt)
  }, [entries, rangeStart])

  // KPI metrics
  const streak = useMemo(()=>computeStreak(entries), [entries])
  const mostFrequentMood = useMemo(()=>{
    if (inRange.length===0) return null
    const c = {}; for (const m of ORDER) c[m]=0
    inRange.forEach(e=>{ c[e.mood] = (c[e.mood]||0) + 1 })
    return Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0] || null
  }, [inRange])

  const avgIntensity = useMemo(()=>{
    if (inRange.length===0) return 0
    const sum = inRange.reduce((acc,e)=>acc+(e.intensity||3),0)
    return Math.round((sum / inRange.length) * 10) / 10
  }, [inRange])

  // Time series (stacked by mood) — hourly for today, daily for week/month
  const series = useMemo(()=>{
    const buckets = buildBuckets(mode)
    const map = new Map(buckets.map(k=>[k, { name:k }]))
    inRange.forEach(e=>{
      const k = (mode==='today') ? hourKey(e.createdAt) : dayKey(e.createdAt)
      const row = map.get(k) || { name:k }
      row[e.mood] = (row[e.mood]||0) + 1
      map.set(k, row)
    })
    return Array.from(map.values())
  }, [inRange, mode])

  // Totals per mood (for donut)
  const totals = useMemo(()=>{
    const c = {}; for (const m of ORDER) c[m]=0
    inRange.forEach(e=>{ c[e.mood]++ })
    return ORDER.map(k=>({ name: moodLabel(k,lang), key:k, value: c[k], fill: COLOR[k] }))
  }, [inRange, lang])

  // Intensity per mood (stacked bars 1..5)
  const intensityData = useMemo(()=>{
    const rows = ORDER.map(k=>({ mood: moodLabel(k,lang), key:k, i1:0,i2:0,i3:0,i4:0,i5:0 }))
    const idx = Object.fromEntries(ORDER.map((k,i)=>[k,i]))
    inRange.forEach(e=>{
      const row = rows[idx[e.mood]]
      const ii = Math.max(1, Math.min(5, e.intensity || 3))
      row['i'+ii] += 1
    })
    return rows
  }, [inRange, lang])

  // Quest snapshot (sadašnje stanje — jednostavno)
  const openMain = tasks.filter(t=>t.type==='main' && !t.isCompleted).length
  const openSide = tasks.filter(t=>t.type==='side' && !t.isCompleted).length
  const doneMain = tasks.filter(t=>t.type==='main' && t.isCompleted).length
  const doneSide = tasks.filter(t=>t.type==='side' && t.isCompleted).length

  /* ---------- UI ---------- */
  return (
    <div className="grid gap-4">
      {/* Header row: title + mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm" style={{ color:'var(--muted)' }}>
          <Gauge className="h-4 w-4" />
          {t('stats', lang) || 'Stats'}
        </div>
        <select className="select w-auto" value={mode} onChange={(e)=>setMode(e.target.value)}>
          <option value="today">{t('period_today', lang) || 'Today'}</option>
          <option value="week">{t('period_week', lang) || 'This Week'}</option>
          <option value="month">{t('period_month', lang) || 'This Month'}</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI
          icon={CalendarCheck2}
          label={lang==='sr' ? 'Broj unosa' : 'Entries'}
          value={inRange.length}
        />
        <KPI
          icon={Flame}
          label={lang==='sr' ? 'Trenutni streak' : 'Current streak'}
          value={streak}
        />
        <KPI
          icon={PartyPopper}
          label={lang==='sr' ? 'Najčešće raspoloženje' : 'Top mood'}
          value={mostFrequentMood ? moodLabel(mostFrequentMood, lang) : '—'}
        />
        <KPI
          icon={Gauge}
          label={lang==='sr' ? 'Prosečna jačina' : 'Avg intensity'}
          value={avgIntensity || 0}
        />
      </div>

      {/* Area over time */}
      <div className="card p-3">
        <div className="mb-2 text-sm" style={{ color:'var(--muted)' }}>
          {lang==='sr' ? 'Raspoloženja kroz vreme' : 'Moods over time'}
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#a1a1aa" />
              <YAxis allowDecimals={false} stroke="#a1a1aa" />
              <Tooltip contentStyle={{ background:'#111016', border:'1px solid #27272a', borderRadius:12, color:'#e4e4e7' }}/>
              <Legend />
              {ORDER.map((m)=>(
                <Area
                  key={m}
                  type="monotone"
                  dataKey={m}
                  stackId="em"
                  stroke={COLOR[m]}
                  fill={COLOR[m]}
                  fillOpacity={0.25}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution + Intensity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Donut per mood */}
        <div className="card p-3">
          <div className="mb-2 text-sm" style={{ color:'var(--muted)' }}>
            {lang==='sr' ? 'Raspodela emocija' : 'Mood distribution'}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totals}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  stroke="#1f1f24"
                >
                  {totals.map((e,i)=><Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'#111016', border:'1px solid #27272a', borderRadius:12, color:'#e4e4e7' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend sa ikonicama */}
          <div className="mt-2 flex flex-wrap gap-2">
            {MOODS.map(({key, Icon})=>(
              <span key={key} className="badge border" title={moodLabel(key,lang)}>
                <Icon className="h-3.5 w-3.5 mr-1" style={{ color: COLOR[key] }}/>
                {moodLabel(key,lang)}
              </span>
            ))}
          </div>
        </div>

        {/* Intensity stacked bars */}
        <div className="card p-3">
          <div className="mb-2 text-sm" style={{ color:'var(--muted)' }}>
            {lang==='sr' ? 'Intenzitet po emocijama' : 'Intensity by mood'}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intensityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="mood" stroke="#a1a1aa" />
                <YAxis allowDecimals={false} stroke="#a1a1aa" />
                <Tooltip contentStyle={{ background:'#111016', border:'1px solid #27272a', borderRadius:12, color:'#e4e4e7' }}/>
                <Legend />
                <Bar dataKey="i1" stackId="i" name="1" fill="#525252" />
                <Bar dataKey="i2" stackId="i" name="2" fill="#6b7280" />
                <Bar dataKey="i3" stackId="i" name="3" fill="#9ca3af" />
                <Bar dataKey="i4" stackId="i" name="4" fill="#cbd5e1" />
                <Bar dataKey="i5" stackId="i" name="5" fill="#e5e7eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quest snapshot (sažeto) */}
      <div className="card p-3">
        <div className="mb-2 text-sm" style={{ color:'var(--muted)' }}>
          {lang==='sr' ? 'Quest pregled' : 'Quest snapshot'}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <MiniStat label={lang==='sr'?'Main (otvoreno)':'Main (open)'} value={openMain} color="rgba(var(--accent),.9)"/>
          <MiniStat label={lang==='sr'?'Side (otvoreno)':'Side (open)'} value={openSide} color="#38bdf8"/>
          <MiniStat label={lang==='sr'?'Main (urađeno)':'Main (done)'} value={doneMain} color="#22c55e"/>
          <MiniStat label={lang==='sr'?'Side (urađeno)':'Side (done)'} value={doneSide} color="#a78bfa"/>
        </div>
      </div>
    </div>
  )
}

/* ---------- Small presentational pieces ---------- */
function KPI({ icon:Icon, label, value }) {
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl border flex items-center justify-center"
           style={{ borderColor:'var(--card-border)', background:'var(--card)' }}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px]" style={{ color:'var(--muted)' }}>{label}</div>
        <div className="text-base font-semibold truncate">{String(value)}</div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor:'var(--card-border)', background:'var(--card)' }}>
      <div className="text-[11px] mb-1" style={{ color:'var(--muted)' }}>{label}</div>
      <div className="text-lg font-semibold" style={{ color }}>{value}</div>
    </div>
  )
}
