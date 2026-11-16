# Streakly

Streakly is a private, single-owner daily discipline app. It gathers your full 8 AM–midnight
routine, habits, interview preparation, calendar, reflections, gratitude, manifestation notes,
analytics, reminders, and account settings in one calm place.

Everything is persisted in MongoDB. There are no mock screens: every tick, note, study session,
journal entry, streak, and chart is calculated from your saved records.

---

## What is included

### Nine pages

| Page | What it does |
| --- | --- |
| **Dashboard** | Today's greeting, completion ring, streak, weekly/monthly rhythm, habit and interview summaries, full daily schedule, and reflection prompt. |
| **Daily Routine** | The complete 8 AM–midnight schedule grouped by block, date navigation, per-activity notes, mark-all-complete, study logging, and custom task management. |
| **Habit Tracker** | All 13 default habits, 7-day and 30-day grids, daily check-ins, per-habit streaks, consistency, and create/edit/archive. |
| **Interview Preparation** | All 14 subjects, topic/subtopic trees, completion status, daily/weekly study targets, study sessions, problem counts, and difficult questions. |
| **Calendar & Streaks** | Green/yellow/red/grey month calendar, twelve-week heatmap, streak totals, and a full day detail panel with completed/missed activities, study time, and journal content. |
| **Journal & Gratitude** | Daily completion review, achievements, four gratitude prompts, five reflection prompts, manifestation fields, and date-keyed auto-save. |
| **Manifestation** | Vision, future-self, affirmations, visualization, tomorrow's intentions, and a manifestation history timeline. |
| **Analytics** | Real range-filtered charts: daily completion, weekly productivity, monthly consistency, study hours, habit strength, interview subject progress, reflection frequency, and range totals. |
| **Settings** | Profile, email, timezone, password change, browser notification permission, reminder CRUD, fixed streak rules, JSON export, and sign-out. |

### The default routine

37 required activities across nine scheduled blocks:

- Morning routine — 8:00–9:00 AM
- Interview preparation block 1 — 9:00 AM–1:00 PM
- Lunch break — 1:00–2:00 PM
- Interview preparation block 2 — 2:00–5:00 PM
- Evening break — 5:00–6:00 PM
- Interview preparation block 3 — 6:00–8:00 PM
- Dinner and break — 8:00–9:00 PM
- Revision — 9:00–11:00 PM
- Night routine — 11:00 PM–12:00 AM

Also seeded automatically:

- **13 habits** with individual streaks
- **7 reminders** with optional browser notifications
- **14 interview subjects** with starter topics and study targets

Default activities cannot be deleted. Custom tasks are additive.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, Vite 7, React Router 7 |
| Styling | Tailwind CSS 3 with a custom cream/sage/forest design system |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Backend | Node.js, Express 4 (ES modules) |
| Database | MongoDB with Mongoose 8 |
| Auth | bcrypt password hashing + JWT in an httpOnly, sameSite=lax cookie |
| Security | Helmet, CORS with credentials, rate-limited auth routes, server-side validation |

The repository is an npm-workspaces monorepo:

```text
Streakly/
  package.json            root scripts and workspaces
  server/
    src/
      config/             environment configuration
      middleware/         auth and error plumbing
      models/             Mongoose schemas
      routes/             REST endpoints
      seed/               default activities, habits, reminders, subjects
      services/           daily logs, streaks, stats, habits, interview logic
      utils/              dates, validation, streak math
    scripts/smoke-test.mjs
    .env.example
  client/
    src/
      components/         UI primitives, layout, calendar, charts, forms
      context/            auth and toast providers
      hooks/              API fetching, local today, reminder notifications, journal autosave
      lib/                API client, date helpers, constants
      pages/              the nine app pages plus auth and 404
```

---

## Requirements

- **Node.js 20 or newer** (tested on Node 24)
- **MongoDB** running locally or a connection string for MongoDB Atlas
- npm 10 or newer

---

## Setup

### 1. Install dependencies

From the repository root:

```bash
npm install
```

This installs both workspaces.

### 2. Configure the server

Copy the example environment file:

```powershell
Copy-Item server\.env.example server\.env
```

On macOS/Linux:

```bash
cp server/.env.example server/.env
```

Then edit `server/.env`:

```dotenv
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/streakly
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
ALLOW_SIGNUP=true
```

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Start MongoDB

If installed as a local service:

```powershell
Get-Service MongoDB | Start-Service
```

Or run MongoDB with Docker:

```bash
docker run -d --name streakly-mongo -p 27017:27017 -v streakly-mongo:/data/db mongo:7
```

### 4. Run in development

```bash
npm run dev
```

- Client: <http://localhost:5173>
- API: <http://localhost:4000>
- Vite proxies `/api` to the API server.

The first time you open the app, choose **Create your personal space**. Your account is seeded with
the full routine, habits, reminders, and interview subjects immediately.

### 5. Build and run for production

```bash
npm run build
npm run start
```

`npm run build` creates `client/dist`. The Express server serves that folder automatically, including
SPA fallback for client-side routes. Open <http://localhost:4000>.

For production set:

```dotenv
NODE_ENV=production
CLIENT_URL=https://your-domain.example
```

Use HTTPS behind a reverse proxy so the secure auth cookie is sent correctly.

---

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Express API port. |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/streakly` | MongoDB database connection string. |
| `JWT_SECRET` | insecure dev fallback | Secret used to sign session tokens. **Set a long random value.** |
| `JWT_EXPIRES_IN` | `30d` | Session lifetime. Rotation reissues the cookie after password changes. |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin and the client URL during development. |
| `NODE_ENV` | `development` | `production` enables static caching and hides internal 500 errors. |
| `ALLOW_SIGNUP` | `false` | When `false`, only the first account can register. Set `true` to permit additional accounts. |

The **first account is always allowed** even when `ALLOW_SIGNUP=false`. For a strictly personal
deployment, register your account first, then set `ALLOW_SIGNUP=false` and restart the server.

Never commit `server/.env`. It is ignored by `.gitignore`.

---

## How streaks work

The rules are intentionally strict so the number stays meaningful:

1. A day counts toward the routine streak **only when every required activity is complete**.
2. Default routine activities are required. Custom tasks default to optional; if you mark one
   **Counts toward the daily streak**, it joins the required set for the dates it applies to.
3. A missed day breaks the current streak. While today is still open, a complete yesterday keeps the
   streak visible until the day ends.
4. Editing a historical day immediately recalculates completion and streaks.
5. The longest streak is retained forever, even after a break.
6. Historical daily records are never deleted. Deleting a custom task or habit archives it, preserving
   the statuses and check-ins already recorded.
7. Habit streaks are independent. They keep the same open-today behavior and preserve their longest
   streak.
8. Calendar statuses are `complete` (green), `partial` (yellow), `missed` (red), `future`, and
   `untracked` (grey). Days before your tracking start are not counted as failures.

### Timezone behavior

Dates are calculated in **your account timezone**, not the server's clock. `trackingStart` is the local
date on which the account was created and is immutable. Change the timezone in **Settings → Profile**
if you move; all future date calculations follow it.

---

## Reminders and notifications

- Reminders are stored in MongoDB, follow your timezone, and support selected weekdays.
- In-app reminders are checked every 20 seconds while the app is open.
- A reminder fires at most once per day on a device (tracked in `localStorage`).
- Browser notifications require explicit permission from **Settings → Browser notifications**.
- Browsers cannot deliver web notifications after the tab is closed without a service-worker push
  server. Streakly intentionally stays local and honest about this limitation.

---

## Data and backup

**Settings → Your data → Export** downloads a full JSON backup containing:

- profile (without password hash)
- activities and custom tasks
- daily logs and statuses
- habits and habit entries
- journals
- interview topics, sessions, and targets
- reminders

There is no cloud sync or third-party analytics. The database is the source of truth.

---

## API overview

All routes except auth and health require the session cookie.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check. |
| `POST` | `/api/auth/register` | First account / allowed signup; seeds defaults. |
| `POST` | `/api/auth/login` | Sign in. |
| `POST` | `/api/auth/logout` | Clear session. |
| `GET` | `/api/auth/session` | Public session probe: returns the user or `{ user: null }`. |
| `GET` | `/api/auth/me` | Current user and local today (requires a session). |
| `PATCH` | `/api/auth/profile` | Name, email, timezone. |
| `POST` | `/api/auth/password` | Change password. |
| `GET` | `/api/day?date=YYYY-MM-DD` | Activities, statuses, stats, sessions, journal, streaks. |
| `PATCH` | `/api/day/:date/activities/:id` | Toggle completion or save notes. |
| `POST` | `/api/day/:date/complete-all` | Complete or reopen a day. |
| `GET` | `/api/stats/overview` | Dashboard summary. |
| `GET` | `/api/stats/trends?from=&to=` | Range analytics. |
| `GET` | `/api/stats/calendar?month=YYYY-MM` | Month calendar and summary. |
| `GET/POST` | `/api/habits` | List with range data / create. |
| `PATCH/DELETE` | `/api/habits/:id` | Edit / archive. |
| `PATCH` | `/api/habits/:id/entries/:date` | Check in or out. |
| `GET` | `/api/journal?date=` | One journal entry. |
| `PUT` | `/api/journal/:date` | Upsert one entry. |
| `GET` | `/api/journal/entries` | Archive list. |
| `GET` | `/api/interview` | Subjects, topics, sessions, summary. |
| `POST/PATCH/DELETE` | `/api/interview/topics` | Topic CRUD and archive. |
| `POST/DELETE` | `/api/interview/sessions` | Study session CRUD. |
| `PUT` | `/api/interview/targets` | Daily/weekly targets per subject. |
| `GET/POST` | `/api/tasks` | Custom task list / create. |
| `PATCH/DELETE` | `/api/tasks/:id` | Edit / archive. |
| `POST` | `/api/tasks/:id/reschedule` | Move once, or copy recurring to a one-time task. |
| `GET/POST` | `/api/reminders` | List / create. |
| `PATCH/DELETE` | `/api/reminders/:id` | Edit / delete. |
| `GET` | `/api/account/export` | Full JSON backup. |

---

## Verification

Run the automated API smoke test:

```bash
npm run smoke
```

It starts an isolated server on port `4100` against a disposable database
(`streakly_smoke_test`), then verifies authentication, the 37 activity seeds, streak completion,
historical recalculation, 13 habits, journals, 14 interview subjects, sessions, targets, custom task
lifecycle, reminders, calendar/trends analytics, export, logout, and password rotation. The database
is dropped at the end.

Build verification:

```bash
npm run build
```

---

## Troubleshooting

**`ECONNREFUSED 127.0.0.1:27017`**
MongoDB is not running. Start the service or update `MONGODB_URI`.

**Login succeeds but subsequent requests return 401**
The cookie is httpOnly and `sameSite=lax`. Open the app through the same host you use in the
browser (`localhost` vs `127.0.0.1` are different cookie hosts). Behind HTTPS, ensure the reverse
proxy forwards cookies.

**Registration says it is closed**
An account already exists and `ALLOW_SIGNUP=false`. Set `ALLOW_SIGNUP=true` temporarily to create
another account, or use the existing account.

**Notifications do not appear**
Allow notifications in the browser, keep the Streakly tab open, and confirm the reminder is enabled
for today's weekday. Some browsers require a direct user gesture before showing notifications.

**Charts look empty**
Analytics reads only saved records inside the selected range. Complete activities or log study time
first, or widen the range. Days before `trackingStart` are intentionally excluded.

**Port already in use**
Change `PORT` in `server/.env` for the API. For the dev client, change `server.port` and the proxy
target in `client/vite.config.js`.

---

## License

Private personal project. No license is granted for redistribution.
