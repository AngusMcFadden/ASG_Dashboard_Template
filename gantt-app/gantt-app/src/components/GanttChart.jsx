import React, { useRef, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import TimelineHeader from './TimelineHeader'
import GanttRow from './GanttRow'
import { useAllDays2026 } from '../hooks/useWorkdays'

const LABEL_WIDTH = 220

const DAY_WIDTH = { day: 28, week: 14, month: 8 }

/**
 * GanttChart
 * Props: state, onTaskClick
 */
export default function GanttChart({ state, onTaskClick }) {
  const { resources, tasks, showWeekends, zoomLevel } = state
  const dayWidth   = DAY_WIDTH[zoomLevel] ?? 28
  const visibleDays = useAllDays2026(showWeekends)
  const scrollRef  = useRef(null)

  const todayIndex = useMemo(() => {
    const str = format(new Date(), 'yyyy-MM-dd')
    return visibleDays.findIndex(d => d.dateStr === str)
  }, [visibleDays])

  // Scroll to today on mount / zoom change
  useEffect(() => {
    if (!scrollRef.current) return
    const idx = todayIndex >= 0 ? todayIndex : 0
    scrollRef.current.scrollLeft = Math.max(
      0,
      LABEL_WIDTH + idx * dayWidth - scrollRef.current.clientWidth / 2
    )
  }, [todayIndex, dayWidth])

  const totalWidth = LABEL_WIDTH + visibleDays.length * dayWidth

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto bg-white">
      <div style={{ minWidth: totalWidth }}>
        <TimelineHeader
          visibleDays={visibleDays}
          dayWidth={dayWidth}
          labelWidth={LABEL_WIDTH}
        />

        {/* Today line in header gap */}
        {todayIndex >= 0 && (
          <TodayPin left={LABEL_WIDTH + todayIndex * dayWidth + dayWidth / 2} />
        )}

        {resources.length === 0 ? (
          <EmptyState />
        ) : (
          resources.map((resource, i) => (
            <GanttRow
              key={resource.id}
              resource={resource}
              tasks={tasks}
              allResources={resources}
              visibleDays={visibleDays}
              dayWidth={dayWidth}
              showWeekends={showWeekends}
              onTaskClick={onTaskClick}
              labelWidth={LABEL_WIDTH}
              isEven={i % 2 === 0}
              todayIndex={todayIndex}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TodayPin({ left }) {
  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{ left: left - 1, top: 0, width: 2, height: 56, background: '#ef4444' }}
    >
      <div
        className="absolute -translate-x-1/2 top-0 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-b"
        style={{ left: 1, whiteSpace: 'nowrap' }}
      >
        TODAY
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8"  y1="2" x2="8"  y2="6" />
        <line x1="3"  y1="10" x2="21" y2="10" />
      </svg>
      <p className="text-sm font-medium">No people added yet</p>
      <p className="text-xs mt-1 opacity-70">Add people and tasks using the sidebar</p>
    </div>
  )
}

export { LABEL_WIDTH }
