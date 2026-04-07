# Gantt Chart App — Build Notes

## Overview

A React + Vite Gantt chart application embedded within the existing Node.js/Express CSV Dashboard project. Users can manage people (resources) and tasks through a sidebar form or via natural language voice/text commands powered by the Claude API.

---

## Architecture

```
ASG_Dashboard_Template-1/
├── server.js                        # Express backend (port 3000)
│   ├── /upload                      # CSV import routes
│   ├── /tables                      # Table management routes
│   └── /api/command                 # Claude AI command proxy
├── .env                             # API keys and DB config
└── gantt-app/gantt-app/             # React + Vite frontend (port 5175)
    ├── vite.config.js               # Proxy: /api → localhost:3000
    ├── src/
    │   ├── App.jsx                  # Root component, state, modal
    │   ├── data/
    │   │   └── model.js             # Reducer, seed data, makeTask/makeResource
    │   ├── hooks/
    │   │   └── useWorkdays.js       # 2026 calendar, bar positioning
    │   └── components/
    │       ├── Toolbar.jsx          # Title, zoom, weekends, AI command bar, mic
    │       ├── InputPanel.jsx       # Sidebar: People + Tasks forms
    │       ├── GanttChart.jsx       # Scroll container, row orchestration
    │       ├── GanttRow.jsx         # Per-person rows with task sub-rows
    │       ├── GanttBar.jsx         # Individual task bars with progress
    │       └── TimelineHeader.jsx   # Month + day header with weekend shading
```

**Two servers run simultaneously:**
- `node server.js` — Express on port 3000
- `npm run dev` (inside `gantt-app/gantt-app`) — Vite on port 5175

Vite proxies `/api/*` requests to Express so the frontend never hits CORS issues.

---

## Features

### Gantt Chart
- **2026 calendar** — Mon–Fri work week by default, weekends toggleable
- **Per-person rows** — each resource gets its own row; each task within that row gets its own sub-row (no overlapping bars)
- **Zoom levels** — Day (28px/day), Week (14px/day), Month (8px/day)
- **Auto-scroll to today** on initial load
- **Weekend shading** — dark gray columns when weekends are shown

### Task Bars
- Solid colored bars with white text labels
- **Progress overlay** — dark fill shows percentage complete
- **Stripe pattern** at 100% complete
- Hover: brightness + lift + glow

### Person Label
- Avatar circle with initials
- Name + role
- **Task count badge** — shows number of *incomplete* tasks only (decrements when a task hits 100%)
- **Red flag icon** — shown when more than 2 tasks overlap on the same day (sweep-line algorithm)

### Task Click Modal
- Edit start date, end date, and percentage complete
- Changes saved on close or clicking Save
- Delete task button

### Sidebar (InputPanel)
- **People tab** — add name, role, pick from 8 color swatches; list with delete
- **Tasks tab** — add name, date range, assign to one or more people, set initial progress; list with delete

### AI Command Bar (text)
Type natural language commands, e.g.:
- *"Assign UAT to Alice"*
- *"Move kickoff to February 1"*
- *"Add a task called Security Review starting March 10 ending March 20"*
- *"Delete the Frontend Build task"*

Commands are sent to `/api/command` on the Express server, which forwards them to Claude (claude-haiku-4-5) and returns a structured JSON action that is dispatched into the React reducer.

### Voice Commands (microphone)
Click the mic button in the toolbar to speak a command. The browser's built-in Web Speech API (no additional API key required) transcribes speech and submits it through the same path as the text command bar.

- Works natively in **Chrome** and **Edge**
- Firefox: enable `media.webspeech.recognition.enable` in `about:config`
- Button pulses red while listening; placeholder changes to "Listening…"

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (for the CSV dashboard; not required for Gantt-only use)
- Anthropic API key with active billing

### Environment Variables

Create `.env` in the project root:

```
ANTHROPIC_API_KEY=sk-ant-api03-...
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=csv_dashboard
PORT=3000
```

### Install Dependencies

**Express backend:**
```bash
cd ASG_Dashboard_Template-1
npm install
```

**React frontend:**
```bash
cd gantt-app/gantt-app
npm install
```

### Run

Open two terminals:

```bash
# Terminal 1 — Express server
node server.js
# or with auto-restart:
npx nodemon server.js
```

```bash
# Terminal 2 — Vite dev server
cd gantt-app/gantt-app
npm run dev
```

Open `http://localhost:5175` in Chrome or Edge.

---

## Key Implementation Details

### State Management
`useReducer` with a single `appState` object containing `resources`, `tasks`, `showWeekends`, and `zoomLevel`. Actions: `ADD/UPDATE/DELETE_RESOURCE`, `ADD/UPDATE/DELETE_TASK`, `TOGGLE_WEEKENDS`, `SET_ZOOM`, `RESET`.

### Calendar Generation (`useWorkdays.js`)
Generates all 365 days of 2026 with `eachDayOfInterval` (date-fns). Each day carries `{ dateStr, dayLabel, monthLabel, isWeekend }`. Filtered by `showWeekends` flag. `getBarPosition` maps a task's start/end dates to pixel column indices.

### Overload Detection (`GanttRow.jsx — isOverloaded`)
Sweep-line algorithm over task start/end events sorted by date. Increments a counter on start events, decrements on end events. Returns `true` if counter exceeds 2 at any point.

### AI Command Flow
1. User types or speaks a command
2. Frontend POSTs `{ command, resources, tasks }` to `/api/command`
3. Express sends a system prompt + state snapshot to `claude-haiku-4-5`
4. Claude returns a JSON action object (e.g. `{ type: "UPDATE_TASK", payload: { id: "...", startDate: "2026-02-01" } }`)
5. Server strips any markdown code fences from the response
6. Frontend parses the action; for `ADD_TASK`/`ADD_RESOURCE`, calls `makeTask()`/`makeResource()` to attach a nanoid and derived fields (initials, color)
7. Action is dispatched to the reducer

### Row Height Fix
Person label divs use `minHeight: totalHeight` (not `height`) so the label can grow beyond the calculated task row height when content (name + role + badge) exceeds the fixed 40px task row size. This prevents adjacent rows from visually overlapping.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `✕ Unexpected token '<'` | `/api/command` returning HTML (404) | Restart both servers; confirm proxy in `vite.config.js` |
| `400` from `/api/command` | Zero Anthropic credit balance | Add funds at `platform.claude.com/settings/billing` |
| Port 3000 in use | Previous node process not killed | `netstat -ano \| findstr :3000` → `taskkill /F /PID <pid>` |
| Mic button does nothing | Browser not supported | Use Chrome or Edge |
| Mic button shows orange error | Permission denied | Allow microphone access in browser site settings |
| Rows overlapping visually | Old build cached | Hard-refresh (`Ctrl+Shift+R`) in browser |

---

## Sample Seed Data

| Person | Role | Color |
|---|---|---|
| Alice Chen | Project Manager | Blue `#1D6FEB` |
| Bob Martinez | Engineer | Red `#E0302A` |
| Carol Smith | Designer | Green `#18A349` |

| Task | Start | End | Assigned |
|---|---|---|---|
| Project Kickoff | 2026-01-05 | 2026-01-09 | Alice, Bob, Carol |
| UX Research | 2026-01-12 | 2026-01-30 | Carol |
| API Development | 2026-01-19 | 2026-02-20 | Bob |
| Frontend Build | 2026-02-02 | 2026-03-06 | Alice, Bob, Carol |
| UAT & Launch | 2026-03-09 | 2026-03-27 | Alice |
