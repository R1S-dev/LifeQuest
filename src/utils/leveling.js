// Jednostavna kriva napredovanja: svaka sledeća "traka" XP je ~25% teža
export const xpForLevelBand = (level) => Math.round(100 * Math.pow(1.25, Math.max(0, level - 1)))

export function breakdownXP(totalXP) {
  let lvl = 1
  let remaining = totalXP
  while (remaining >= xpForLevelBand(lvl)) {
    remaining -= xpForLevelBand(lvl)
    lvl += 1
  }
  const band = xpForLevelBand(lvl)
  const progress = band === 0 ? 0 : remaining / band
  return { level: lvl, xpIntoLevel: remaining, xpForThisLevel: band, progress }
}

export const difficultyXP = { easy: 10, medium: 25, hard: 50 }
