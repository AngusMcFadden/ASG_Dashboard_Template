import React, { useState } from 'react'
import { makeResource, makeTask, COLORS } from '../data/model'

/**
 * InputPanel
 * Left sidebar with two collapsible sections:
 *   1. People  – list existing + add new
 *   2. Tasks   – list existing + add new
 */
export default function InputPanel({ state, dispatch }) {
  const { resources, tasks } = state
  const [section, setSection] = useState('people') // 'people' | 'tasks'

  return (
    <div className="flex flex-col h-full text-slate-700 text-sm">
      {/* Section tabs */}
      <div className="flex border-b border-slate-200 shrink-0">
        {['people', 'tasks'].map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={[
              'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors',
              section === s
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/60'
                : 'text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            {s === 'people' ? `People (${resources.length})` : `Tasks (${tasks.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {section === 'people' ? (
          <PeopleSection resources={resources} dispatch={dispatch} />
        ) : (
          <TasksSection tasks={tasks} resources={resources} dispatch={dispatch} />
        )}
      </div>
    </div>
  )
}

// ── People Section ────────────────────────────────────────────────────────────

function PeopleSection({ resources, dispatch }) {
  const [name, setName]   = useState('')
  const [role, setRole]   = useState('')
  const [color, setColor] = useState(COLORS[0])

  const handleAdd = e => {
    e.preventDefault()
    if (!name.trim()) return
    dispatch({ type: 'ADD_RESOURCE', payload: makeResource({ name: name.trim(), role: role.trim(), color }) })
    setName('')
    setRole('')
    setColor(COLORS[resources.length % COLORS.length])
  }

  return (
    <div className="p-3 space-y-4">
      {/* Add form */}
      <form onSubmit={handleAdd} className="space-y-2">
        <Label>Name</Label>
        <input
          className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <Label>Role (optional)</Label>
        <input
          className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="e.g. Engineer"
          value={role}
          onChange={e => setRole(e.target.value)}
        />
        <Label>Colour</Label>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                background: c,
                borderColor: color === c ? '#1e293b' : 'transparent',
                boxShadow: color === c ? `0 0 0 2px #fff, 0 0 0 3px ${c}` : 'none',
              }}
            />
          ))}
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 transition-colors"
        >
          + Add Person
        </button>
      </form>

      {/* List */}
      {resources.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
            Team ({resources.length})
          </p>
          {resources.map(r => (
            <div
              key={r.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 group"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ background: r.color }}
              >
                {r.initials}
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <div className="text-xs font-semibold truncate text-slate-700">{r.name}</div>
                {r.role && <div className="text-[10px] text-slate-400 truncate">{r.role}</div>}
              </div>
              <button
                onClick={() => dispatch({ type: 'DELETE_RESOURCE', payload: r.id })}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity text-xs leading-none px-1"
                title="Remove person"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tasks Section ─────────────────────────────────────────────────────────────

function TasksSection({ tasks, resources, dispatch }) {
  const today = new Date().toISOString().slice(0, 10)
  const [name,       setName]       = useState('')
  const [startDate,  setStartDate]  = useState(today)
  const [endDate,    setEndDate]    = useState(today)
  const [assigned,   setAssigned]   = useState([])
  const [pct,        setPct]        = useState(0)

  const toggleResource = id =>
    setAssigned(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

  const handleAdd = e => {
    e.preventDefault()
    if (!name.trim() || endDate < startDate) return
    dispatch({
      type: 'ADD_TASK',
      payload: makeTask({
        name: name.trim(),
        startDate,
        endDate,
        resourceIds: assigned,
        percentComplete: pct,
      }),
    })
    setName('')
    setAssigned([])
    setPct(0)
  }

  return (
    <div className="p-3 space-y-4">
      {/* Add form */}
      <form onSubmit={handleAdd} className="space-y-2">
        <Label>Task name</Label>
        <input
          className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Task name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Start</Label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label>End</Label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <Label>Assign to</Label>
        {resources.length === 0 ? (
          <p className="text-[10px] text-slate-400 italic">Add people first</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {resources.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleResource(r.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border-2 transition-all"
                style={{
                  borderColor: r.color,
                  background: assigned.includes(r.id) ? r.color : 'transparent',
                  color: assigned.includes(r.id) ? '#fff' : r.color,
                }}
              >
                {r.initials}
              </button>
            ))}
          </div>
        )}

        <Label>Progress – {pct}%</Label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={pct}
          onChange={e => setPct(Number(e.target.value))}
          className="w-full accent-blue-600"
        />

        <button
          type="submit"
          disabled={!name.trim() || endDate < startDate}
          className="w-full rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold py-2 transition-colors"
        >
          + Add Task
        </button>
      </form>

      {/* Task list */}
      {tasks.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
            All tasks ({tasks.length})
          </p>
          {tasks.map(t => {
            const owners = resources.filter(r => t.resourceIds.includes(r.id))
            return (
              <div
                key={t.id}
                className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 group"
              >
                {/* colour dots */}
                <div className="flex gap-0.5 pt-0.5 shrink-0">
                  {owners.length > 0
                    ? owners.map(r => (
                        <div
                          key={r.id}
                          className="w-2 h-2 rounded-full mt-0.5"
                          style={{ background: r.color }}
                          title={r.name}
                        />
                      ))
                    : <div className="w-2 h-2 rounded-full mt-0.5 bg-slate-200" />}
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate text-slate-700">{t.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {t.startDate} → {t.endDate}
                    {t.percentComplete > 0 && ` · ${t.percentComplete}%`}
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'DELETE_TASK', payload: t.id })}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity text-xs leading-none px-1 shrink-0"
                  title="Delete task"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2 mb-0.5">
      {children}
    </p>
  )
}
