import React, { useReducer, useState } from 'react'
import { appReducer, initialState, makeTask, makeResource } from './data/model'
import Toolbar    from './components/Toolbar'
import InputPanel from './components/InputPanel'
import GanttChart from './components/GanttChart'

export default function App() {
  const [state, dispatch]         = useReducer(appReducer, initialState)
  const [sidebarOpen, setSidebar] = useState(true)
  const [selectedTask, setTask]   = useState(null)
  const [cmdStatus, setCmdStatus] = useState({ status: 'idle', message: '' })

  const handleCommand = async (cmd) => {
    setCmdStatus({ status: 'loading', message: '' })
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, resources: state.resources, tasks: state.tasks }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const action = data.action
      if (action.type === 'ERROR') {
        setCmdStatus({ status: 'error', message: action.message })
        return
      }
      if (action.type === 'ADD_TASK')     action.payload = makeTask(action.payload)
      if (action.type === 'ADD_RESOURCE') action.payload = makeResource(action.payload)

      dispatch(action)
      setCmdStatus({ status: 'success', message: 'Done!' })
      setTimeout(() => setCmdStatus({ status: 'idle', message: '' }), 2500)
    } catch (err) {
      setCmdStatus({ status: 'error', message: err.message })
      setTimeout(() => setCmdStatus({ status: 'idle', message: '' }), 4000)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Top bar */}
      <Toolbar state={state} dispatch={dispatch} onCommand={handleCommand} cmdStatus={cmdStatus} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar toggle tab */}
        <button
          onClick={() => setSidebar(v => !v)}
          className="absolute top-1/2 -translate-y-1/2 z-30 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md flex items-center justify-center transition-all"
          style={{ left: sidebarOpen ? 280 : 0, width: 14, height: 44 }}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className="text-[9px]">{sidebarOpen ? '◀' : '▶'}</span>
        </button>

        {/* Sidebar */}
        {sidebarOpen && (
          <div
            className="shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden"
            style={{ width: 280 }}
          >
            <InputPanel state={state} dispatch={dispatch} />
          </div>
        )}

        {/* Gantt */}
        <div className="flex flex-1 overflow-hidden">
          <GanttChart state={state} onTaskClick={setTask} />
        </div>
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          resources={state.resources}
          dispatch={dispatch}
          onClose={() => setTask(null)}
        />
      )}
    </div>
  )
}

// ── Task detail modal ─────────────────────────────────────────────────────────

function TaskModal({ task, resources, dispatch, onClose }) {
  const [pct,   setPct]   = useState(task.percentComplete)
  const [start, setStart] = useState(task.startDate)
  const [end,   setEnd]   = useState(task.endDate)
  const owners = resources.filter(r => task.resourceIds.includes(r.id))

  const handleClose = () => {
    const changed = {}
    if (pct   !== task.percentComplete) changed.percentComplete = pct
    if (start !== task.startDate)       changed.startDate       = start
    if (end   !== task.endDate)         changed.endDate         = end
    if (Object.keys(changed).length) {
      dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, ...changed } })
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-[modal-in_0.18s_ease]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 leading-tight pr-4">{task.name}</h2>
            <button onClick={handleClose} className="text-slate-300 hover:text-slate-600 text-xl leading-none shrink-0">×</button>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Start</p>
              <input
                type="date"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">End</p>
              <input
                type="date"
                value={end}
                min={start}
                onChange={e => setEnd(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Progress slider */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</span>
              <span className="text-sm font-bold text-slate-700">{pct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              onChange={e => setPct(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Assigned people */}
          {owners.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Assigned to</p>
              <div className="flex flex-wrap gap-2">
                {owners.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: r.color + '20', color: r.color, border: `1px solid ${r.color}44` }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ background: r.color }}
                    >
                      {r.initials}
                    </div>
                    {r.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-colors"
              onClick={() => { dispatch({ type: 'DELETE_TASK', payload: task.id }); onClose() }}
            >
              Delete
            </button>
            <button
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              onClick={handleClose}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

