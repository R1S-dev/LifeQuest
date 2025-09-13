import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { difficultyXP } from './utils/leveling'
import { startOfDay, isSameDay, isNextDay, isSameWeek } from './utils/date'
import { startDueNotifier, stopDueNotifier } from './notifications'

const BONUS_XP_STREAK_3 = 25
const BONUS_XP_STREAK_7 = 80

export const useAppStore = create(
  persist(
    (set, get) => ({
      /* --- Theme / i18n / auth --- */
      theme: 'system', // system | light | dark
      language: 'sr',
      isAuthenticated: false,
      notificationsEnabled: false,
      user: { name: 'Adventurer', avatar: null },

      setTheme: (theme) => set(() => ({ theme })),
      setLanguage: (lang) => set(() => ({ language: lang || 'sr' })),
      setNotificationsEnabled: (val) => {
        set(() => ({ notificationsEnabled: !!val }))
        if (val) startDueNotifier(); else stopDueNotifier()
      },

      login: (name) => set(() => ({
        isAuthenticated: true,
        user: { ...get().user, name: name?.trim() || get().user.name },
      })),
      logout: () => set(() => ({ isAuthenticated: false })),

      setUserName: (name) => set((s) => ({ user: { ...s.user, name: name?.trim() || s.user.name } })),
      setUserAvatar: (dataUrl) => set((s) => ({ user: { ...s.user, avatar: dataUrl } })),
      removeUserAvatar: () => set((s) => ({ user: { ...s.user, avatar: null } })),

      /* --- Tasks --- */
      tasks: [],
      totalXP: 0,
      lastLevelSeen: 1,

      dailyStreak: 0,
      lastCompletionDate: null,
      achievements: [], // xp_500, xp_1000, streak_7, main_10, side_10, hard_10, daily_15

      addTask: ({ title, category = 'General', difficulty = 'easy', xp, repeat = 'none', dueAt, type = 'main', origin='user' }) => {
        const value = typeof xp === 'number' ? xp : (difficultyXP[difficulty] ?? 10)
        const task = {
          id: nanoid(),
          type, origin, // origin: 'system' | 'user'
          title: title?.trim() || 'Untitled',
          category, difficulty,
          xp: value,
          isCompleted: false,
          createdAt: Date.now(),
          completedAt: undefined,
          repeat, // none | daily | weekly
          dueAt: dueAt || null,
          lastResetOn: startOfDay(Date.now()),
        }
        set((state) => ({ tasks: [task, ...state.tasks] }))
      },

      toggleTask: (id) => {
        set((state) => {
          const t = state.tasks.find((x) => x.id === id)
          if (!t) return state

          const now = Date.now()
          const nowCompleted = !t.isCompleted
          const updated = { ...t, isCompleted: nowCompleted, completedAt: nowCompleted ? now : undefined }
          const tasks = state.tasks.map((x) => (x.id === id ? updated : x))
          let delta = nowCompleted ? t.xp : -t.xp
          let totalXP = Math.max(0, state.totalXP + delta)

          let dailyStreak = state.dailyStreak
          let lastCompletionDate = state.lastCompletionDate

          if (nowCompleted) {
            if (lastCompletionDate == null) dailyStreak = 1
            else if (isSameDay(lastCompletionDate, now)) { /* no change */ }
            else if (isNextDay(lastCompletionDate, now)) dailyStreak = state.dailyStreak + 1
            else dailyStreak = 1
            lastCompletionDate = now
            if (dailyStreak === 3) totalXP += BONUS_XP_STREAK_3
            if (dailyStreak === 7) totalXP += BONUS_XP_STREAK_7
          }

          // achievements
          const achievements = new Set(state.achievements)
          const totalMainDone = tasks.filter(x => x.type==='main' && x.isCompleted).length
          const totalSideDone = tasks.filter(x => x.type==='side' && x.isCompleted).length
          const totalHardDone = tasks.filter(x => x.difficulty==='hard' && x.isCompleted).length
          const totalDailyDone = tasks.filter(x => x.repeat==='daily' && x.isCompleted).length

          if (totalXP >= 500) achievements.add('xp_500')
          if (totalXP >= 1000) achievements.add('xp_1000')
          if (dailyStreak >= 7) achievements.add('streak_7')
          if (totalMainDone >= 10) achievements.add('main_10')
          if (totalSideDone >= 10) achievements.add('side_10')
          if (totalHardDone >= 10) achievements.add('hard_10')
          if (totalDailyDone >= 15) achievements.add('daily_15')

          return { tasks, totalXP, dailyStreak, lastCompletionDate, achievements: [...achievements] }
        })
      },

      removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((x) => x.id !== id) })),
      setLastLevelSeen: (lvl) => set(() => ({ lastLevelSeen: lvl })),
      resetAll: () => set(() => ({
        tasks: [],
        totalXP: 0,
        lastLevelSeen: 1,
        dailyStreak: 0,
        lastCompletionDate: null,
        achievements: [],
      })),

      /* --- Backup helpers (koristi ih Settings) --- */
      exportData: () => {
        const s = get()
        const payload = {
          meta: { app: 'lifequest', version: 1, exportedAt: Date.now() },
          data: {
            theme: s.theme,
            language: s.language,
            notificationsEnabled: s.notificationsEnabled,
            user: s.user,
            tasks: s.tasks,
            totalXP: s.totalXP,
            lastLevelSeen: s.lastLevelSeen,
            dailyStreak: s.dailyStreak,
            lastCompletionDate: s.lastCompletionDate,
            achievements: s.achievements,
            lastDayCheck: s.lastDayCheck,
            journal: s.journal,
          }
        }
        return JSON.stringify(payload, null, 2)
      },
      importData: (json) => {
        try {
          const parsed = JSON.parse(json)
          if (!parsed?.data) throw new Error('Invalid file')
          const d = parsed.data
          set(() => ({
            theme: d.theme ?? 'system',
            language: d.language ?? 'sr',
            notificationsEnabled: !!d.notificationsEnabled,
            user: d.user ?? { name: 'Adventurer', avatar: null },
            tasks: Array.isArray(d.tasks) ? d.tasks : [],
            totalXP: Number(d.totalXP || 0),
            lastLevelSeen: Number(d.lastLevelSeen || 1),
            dailyStreak: Number(d.dailyStreak || 0),
            lastCompletionDate: d.lastCompletionDate ?? null,
            achievements: Array.isArray(d.achievements) ? d.achievements : [],
            lastDayCheck: d.lastDayCheck ?? startOfDay(Date.now()),
            journal: Array.isArray(d.journal) ? d.journal : [],
          }))
        } catch (e) {
          console.warn('Import failed:', e)
        }
      },

      /* --- Auto reset ponavljajućih --- */
      lastDayCheck: startOfDay(Date.now()),
      runDailyTick: () => {
        const now = Date.now()
        const today = startOfDay(now)
        const last = get().lastDayCheck
        if (today === last) return
        set((state) => {
          const updated = state.tasks.map(task => {
            if (task.repeat === 'daily') {
              return { ...task, isCompleted: false, completedAt: undefined, lastResetOn: today }
            }
            if (task.repeat === 'weekly') {
              const shouldReset = !isSameWeek(task.lastResetOn ?? 0, now)
              if (shouldReset) {
                return { ...task, isCompleted: false, completedAt: undefined, lastResetOn: today }
              }
            }
            return task
          })
          return { tasks: updated, lastDayCheck: today }
        })
      },

      /* --- Journal (5 emocija) --- */
      journal: [], // {id, mood: 'happy|calm|excited|stressed|sad', note, createdAt}
      addJournalEntry: ({ mood, note }) => {
        const entry = { id: nanoid(), mood, note: (note || '').trim(), createdAt: Date.now() }
        set((s) => ({ journal: [entry, ...s.journal] }))
      },
      removeJournalEntry: (id) => set((s)=>({ journal: s.journal.filter(e=>e.id!==id) })),
    }),
    {
      name: 'lifequest-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        isAuthenticated: state.isAuthenticated,
        notificationsEnabled: state.notificationsEnabled,
        user: state.user,

        tasks: state.tasks,
        totalXP: state.totalXP,
        lastLevelSeen: state.lastLevelSeen,
        dailyStreak: state.dailyStreak,
        lastCompletionDate: state.lastCompletionDate,
        achievements: state.achievements,
        lastDayCheck: state.lastDayCheck,

        journal: state.journal,
      }),
      onRehydrateStorage: () => (state) => {
        // Seed sistemskih questova (samo ako nema ničega)
        if (state && state.tasks && state.tasks.length === 0 && state.totalXP === 0) {
          const now = Date.now()
          const daily = (title, cat, diff, type) => ({
            id: nanoid(), type, origin:'system', title, category:cat, difficulty:diff,
            xp: difficultyXP[diff], isCompleted:false, createdAt: now, repeat:'daily', dueAt:null, lastResetOn:startOfDay(now)
          })
          const weekly = (title, cat, diff, type) => ({
            id: nanoid(), type, origin:'system', title, category:cat, difficulty:diff,
            xp: difficultyXP[diff], isCompleted:false, createdAt: now, repeat:'weekly', dueAt:null, lastResetOn:startOfDay(now)
          })
          const once = (title, cat, diff, type) => ({
            id: nanoid(), type, origin:'system', title, category:cat, difficulty:diff,
            xp: difficultyXP[diff], isCompleted:false, createdAt: now, repeat:'none', dueAt:null, lastResetOn:startOfDay(now)
          })
          state.tasks.push(
            daily('Jutarnje raspremanje', 'Dom', 'easy', 'main'),
            daily('10 min istezanja', 'Zdravlje', 'easy', 'main'),
            weekly('Trening 3x', 'Zdravlje', 'hard', 'main'),
            once('Sortiraj fajlove na desktopu', 'Organizacija', 'medium', 'main'),

            daily('Prošetaj 15 min', 'Navike', 'easy', 'side'),
            weekly('Pozovi prijatelja', 'Društvo', 'medium', 'side'),
            once('Napravi vision board', 'Ciljevi', 'medium', 'side'),
          )
        }
      },
    }
  )
)
