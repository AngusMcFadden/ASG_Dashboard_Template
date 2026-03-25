import React from 'react'

/**
 * Toolbar
 * Top bar with: title, zoom controls, weekend toggle, reset button.
 * Props: state, dispatch
 */
export default function Toolbar({ state, dispatch }) {
  const { showWeekends, zoomLevel } = state

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200 shrink-0 z-40">
      {/* Logo + Title */}
      <div className="flex items-center gap-2 mr-auto">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="3"  y1="9"  x2="21" y2="9"  />
            <line x1="9"  y1="4"  x2="9"  y2="9"  />
            <line x1="15" y1="4"  x2="15" y2="9"  />
            <line x1="7"  y1="14" x2="13" y2="14" />
            <line x1="7"  y1="18" x2="11" y2="18" />
          </svg>
        </div>
        <span className="text-sm font-bold text-slate-800 tracking-tight">Gantt 2026</span>
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
        {[
          { label: 'Day',   value: 'day'   },
          { label: 'Week',  value: 'week'  },
          { label: 'Month', value: 'month' },
        ].map(z => (
          <button
            key={z.value}
            onClick={() => dispatch({ type: 'SET_ZOOM', payload: z.value })}
            className={[
              'px-2.5 py-1 rounded-md text-xs font-semibold transition-all',
              zoomLevel === z.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {z.label}
          </button>
        ))}
      </div>

      {/* Weekend toggle */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_WEEKENDS' })}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all',
          showWeekends
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700',
        ].join(' ')}
      >
        <span>{showWeekends ? '☑' : '☐'}</span>
        Weekends
      </button>

      {/* Reset */}
      <button
        onClick={() => dispatch({ type: 'RESET' })}
        className="px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
        title="Reset to sample data"
      >
        Reset
      </button>
    </div>
  )
}
