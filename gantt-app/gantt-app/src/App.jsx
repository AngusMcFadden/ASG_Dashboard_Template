import React, { useReducer, useState } from 'react'
import { appReducer, initialState } from './data/model'
import Toolbar    from './components/Toolbar'
import InputPanel from './components/InputPanel'
import GanttChart from './components/GanttChart'

export default function App() {
  const [state, dispatch]       = useReducer(appReducer, initialState)
  const [sidebarOpen, setSidebar] = useState(true)
  const [selectedTask, setTask]  = useState(null)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Top bar */}
      <Toolbar state={state} dispatch={dispatch} />

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
  const owners = resources.filter(r => task.resourceIds.includes(r.id))

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-[modal-in_0.18s_ease]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 leading-tight pr-4">{task.name}</h2>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-600 text-xl leading-none shrink-0">×</button>
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-sm mb-4">
            <Row label="Start"    value={task.startDate} />
            <Row label="End"      value={task.endDate} />
            <Row label="Progress" value={`${task.percentComplete}%`} />
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${task.percentComplete}%` }}
            />
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
              className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-slate-400 w-16 shrink-0 text-xs">{label}</span>
      <span className="text-slate-700 font-medium text-xs">{value}</span>
    </div>
  )
}
