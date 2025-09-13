export function startOfDay(ts = Date.now()) {
  const d = new Date(ts)
  d.setHours(0,0,0,0)
  return d.getTime()
}
export function isSameDay(a, b) {
  return startOfDay(a) === startOfDay(b)
}
export function isNextDay(prevTs, currentTs) {
  const d1 = startOfDay(prevTs)
  const d2 = startOfDay(currentTs)
  return (d2 - d1) === 24*60*60*1000
}
export function isSameWeek(a, b) {
  const da = new Date(a), db = new Date(b)
  // simple: same ISO week rough approx (Mon-Sun)
  const day = (d)=> {
    const tmp = new Date(d); const n = tmp.getDay() || 7
    tmp.setHours(0,0,0,0)
    tmp.setDate(tmp.getDate() + (1 - n))
    return tmp.getTime()
  }
  return day(a) === day(b)
}
