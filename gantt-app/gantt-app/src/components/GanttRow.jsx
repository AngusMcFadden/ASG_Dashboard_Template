import React, { useMemo } from 'react'
import GanttBar from './GanttBar'
import { getBarPosition } from '../hooks/useWorkdays'

const TASK_ROW_H = 40   // height of each individual task row
const EMPTY_ROW_H = 44  // height when person has no tasks

/**
 * GanttRow
 * Renders one person label that spans all their task sub-rows.
 * Each task gets its own dedicated row in the chart area.
 */
export default function GanttRow({
  resource,
  tasks,
  allResources,
  visibleDays,
  dayWidth,
  onTaskClick,
  labelWidth = 220,
  isEven = false,
  todayIndex = -1,
}) {
  const myTasks = useMemo(
    () => tasks.filter(t => t.resourceIds.includes(resource.id)),
    [tasks, resource.id]
  )

  const barsMap = useMemo(() => {
    const map = {}
    myTasks.forEach(task => {
      const pos = getBarPosition(task.startDate, task.endDate, visibleDays)
      if (pos) map[task.id] = pos
    })
    return map
  }, [myTasks, visibleDays])

  const totalWidth  = visibleDays.length * dayWidth
  const totalHeight = myTasks.length > 0 ? myTasks.length * TASK_ROW_H : EMPTY_ROW_H
  const rowBg       = isEven ? '#ffffff' : '#f8fafc'

  return (
    <div
      className="flex border-b-2 border-slate-200"
      style={{ minWidth: labelWidth + totalWidth, background: rowBg }}
    >
      {/* ── Person label — spans all task rows ── */}
      <div
        className="shrink-0 flex items-start gap-2.5 px-3 pt-2.5 border-r border-slate-200 sticky left-0 z-10"
        style={{
          width: labelWidth,
          height: totalHeight,
          background: rowBg,
          borderLeft: `3px solid ${resource.color}`,
        }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 mt-0.5"
          style={{ background: resource.color }}
        >
          {resource.initials}
        </div>
        <div className="overflow-hidden min-w-0 flex-1">
          <div className="text-xs font-semibold text-slate-700 truncate leading-tight">
            {resource.name}
          </div>
          {resource.role && (
            <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
              {resource.role}
            </div>
          )}
          {myTasks.length > 0 && (
            <div
              className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: resource.color + 'cc' }}
            >
              {myTasks.length} task{myTasks.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Task sub-rows ── */}
      <div className="flex flex-col" style={{ width: totalWidth }}>
        {myTasks.length === 0 ? (
          /* Empty row */
          <div
            className="relative flex items-center px-4"
            style={{ height: EMPTY_ROW_H, width: totalWidth }}
          >
            <GridLines
              visibleDays={visibleDays}
              dayWidth={dayWidth}
              todayIndex={todayIndex}
              height={EMPTY_ROW_H}
            />
            <span className="text-[10px] text-slate-300 italic relative z-10">
              No tasks assigned
            </span>
          </div>
        ) : (
          myTasks.map((task) => {
            const barPos = barsMap[task.id]
            return (
              <div
                key={task.id}
                className="relative border-b border-slate-100 last:border-b-0"
                style={{ height: TASK_ROW_H, width: totalWidth }}
              >
                <GridLines
                  visibleDays={visibleDays}
                  dayWidth={dayWidth}
                  todayIndex={todayIndex}
                  height={TASK_ROW_H}
                />

                {barPos && (
                  <GanttBar
                    task={task}
                    resources={allResources}
                    startIndex={barPos.startIndex}
                    span={barPos.span}
                    dayWidth={dayWidth}
                    rowHeight={TASK_ROW_H}
                    color={resource.color}
                    onClick={onTaskClick}
                  />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/**
 * GridLines — weekend shading, week separators, today line.
 * Rendered as an absolute overlay inside each task row.
 */
function GridLines({ visibleDays, dayWidth, todayIndex }) {
  return (
    <>
      {visibleDays.map((day, i) =>
        day.isWeekend ? (
          <div
            key={day.dateStr}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: i * dayWidth, width: dayWidth, background: 'rgba(148,163,184,0.07)' }}
          />
        ) : day.dayLabel === 'Mon' ? (
          <div
            key={day.dateStr}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: i * dayWidth, width: 1, background: 'rgba(148,163,184,0.2)' }}
          />
        ) : null
      )}

      {todayIndex >= 0 && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-10"
          style={{
            left: todayIndex * dayWidth + dayWidth / 2 - 1,
            width: 2,
            background: '#ef4444',
            opacity: 0.5,
          }}
        />
      )}
    </>
  )
}

export { TASK_ROW_H, EMPTY_ROW_H }
