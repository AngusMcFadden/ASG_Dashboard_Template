import { nanoid } from 'nanoid'

// ── Colors ────────────────────────────────────────────────────────────────────
export const COLORS = [
  '#1D6FEB', // blue
  '#E0302A', // red
  '#18A349', // green
  '#E8750A', // orange
  '#8A35D4', // purple
  '#0E9B8D', // teal
  '#D42B8A', // magenta
  '#6DB30F', // lime
]

let colorCursor = 0
export function nextColor() {
  return COLORS[colorCursor++ % COLORS.length]
}

export function makeInitials(name) {
  return name
    .split(' ')
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Factories ─────────────────────────────────────────────────────────────────
export function makeResource({ name, color, role = '' }) {
  return {
    id: nanoid(),
    name,
    color: color || nextColor(),
    initials: makeInitials(name),
    role,
  }
}

export function makeTask({ name, startDate, endDate, resourceIds = [], percentComplete = 0 }) {
  return {
    id: nanoid(),
    name,
    startDate,
    endDate,
    resourceIds,
    percentComplete: Math.min(100, Math.max(0, Number(percentComplete))),
  }
}

// ── Seed data ─────────────────────────────────────────────────────────────────
function buildSeed() {
  const alice = makeResource({ name: 'Alice Chen',   color: '#1D6FEB', role: 'Product Manager' })
  const bob   = makeResource({ name: 'Bob Martinez', color: '#E0302A', role: 'Engineer' })
  const carol = makeResource({ name: 'Carol Smith',  color: '#18A349', role: 'Designer' })

  const tasks = [
    makeTask({ name: 'Project Kickoff',  startDate: '2026-01-05', endDate: '2026-01-09', resourceIds: [alice.id, bob.id],           percentComplete: 100 }),
    makeTask({ name: 'UX Research',      startDate: '2026-01-12', endDate: '2026-01-30', resourceIds: [carol.id],                   percentComplete: 80  }),
    makeTask({ name: 'API Development',  startDate: '2026-01-26', endDate: '2026-02-20', resourceIds: [bob.id],                     percentComplete: 55  }),
    makeTask({ name: 'Frontend Build',   startDate: '2026-02-09', endDate: '2026-03-13', resourceIds: [bob.id, carol.id],           percentComplete: 30  }),
    makeTask({ name: 'UAT & Launch',     startDate: '2026-03-16', endDate: '2026-03-31', resourceIds: [alice.id, bob.id, carol.id], percentComplete: 0   }),
  ]

  return { resources: [alice, bob, carol], tasks }
}

// ── Initial state ─────────────────────────────────────────────────────────────
const seed = buildSeed()

export const initialState = {
  resources: seed.resources,
  tasks: seed.tasks,
  showWeekends: false,
  zoomLevel: 'day', // 'day' | 'week' | 'month'
}

// ── Reducer ───────────────────────────────────────────────────────────────────
export function appReducer(state, action) {
  switch (action.type) {
    case 'ADD_RESOURCE':
      return { ...state, resources: [...state.resources, action.payload] }
    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: state.resources.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
      }
    case 'DELETE_RESOURCE':
      return {
        ...state,
        resources: state.resources.filter(r => r.id !== action.payload),
        tasks: state.tasks.map(t => ({
          ...t,
          resourceIds: t.resourceIds.filter(id => id !== action.payload),
        })),
      }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) }
    case 'TOGGLE_WEEKENDS':
      return { ...state, showWeekends: !state.showWeekends }
    case 'SET_ZOOM':
      return { ...state, zoomLevel: action.payload }
    case 'RESET': {
      const fresh = buildSeed()
      return { ...state, resources: fresh.resources, tasks: fresh.tasks }
    }
    default:
      return state
  }
}
