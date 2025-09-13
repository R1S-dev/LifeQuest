# LifeQuest (React + Vite + Tailwind v4, bez backend-a)

Gamifikovana to-do aplikacija sa XP, nivoima i lepim animacijama. Podaci se čuvaju u `localStorage`.

## Pokretanje

```bash
npm install
npm run dev
```

Otvoriti URL koji ispiše Vite (npr. http://localhost:5173).

## Ako Tailwind ne radi na Windowsu
- Proveri da `postcss.config.js` sadrži **@tailwindcss/postcss**
- U `src/index.css` se nalaze samo `@tailwind` direktive + utility klase
- Po potrebi: obriši `.vite/`, `node_modules/`, `package-lock.json`, pa `npm install`

## Stack
- React 18 + Vite
- Tailwind v4 (`@tailwindcss/postcss`)
- Zustand (persist)
- Framer Motion (animacije)
- lucide-react ikonice
- nanoid, date-fns

## Struktura
- `src/App.jsx` - UI, XP bar, liste taskova
- `src/store.js` - Zustand store (persist u localStorage)
- `src/utils/leveling.js` - XP kriva i pomoćne funkcije
- `src/components/*` - XPBar, modal za dodavanje, itemi, level-up modal
