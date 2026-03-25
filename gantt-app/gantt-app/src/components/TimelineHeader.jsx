import React, { useMemo } from 'react'
import { format } from 'date-fns'

/**
 * TimelineHeader
 * Props: visibleDays, dayWidth, labelWidth
 *
 * Renders two sticky rows:
 *   Row 1 – month spans (e.g. "Jan 2026")
 *   Row 2 – day numbers (or week labels at smaller zoom)
 */
export default function TimelineHeader({ visibleDays, dayWidth, labelWidth }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  // Group days into month buckets
  const months = useMemo(() => {
    const groups = []
    visibleDays.forEach(day => {
      const key = day.monthYear
      if (!groups.length || groups[groups.length - 1].key !== key) {
        groups.push({ key, label: key, count: 1 })
      } else {
        groups[groups.length - 1].count++
      }
    })
    return groups
  }, [visibleDays])

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-slate-200 select-none">
      {/* Month row */}
      <div className="flex" style={{ paddingLeft: labelWidth }}>
        {months.map(m => (
          <div
            key={m.key}
            className="shrink-0 border-r border-slate-200 bg-slate-50 px-2 py-1 overflow-hidden"
            style={{ width: m.count * dayWidth, minWidth: m.count * dayWidth }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
              {m.count * dayWidth > 40 ? m.label : m.label.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>

      {/* Day row */}
      <div className="flex" style={{ paddingLeft: labelWidth }}>
        {visibleDays.map(day => {
          const isToday = day.dateStr === todayStr
          return (
            <div
              key={day.dateStr}
              className={[
                'shrink-0 border-r text-center py-0.5 overflow-hidden',
                isToday
                  ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold'
                  : day.isWeekend
                  ? 'bg-slate-400 border-slate-400 text-slate-200'
                  : 'border-slate-100 text-slate-400',
              ].join(' ')}
              style={{ width: dayWidth, minWidth: dayWidth }}
            >
              {dayWidth >= 14 && (
                <span className="text-[9px] font-medium leading-none">
                  {day.dayNum}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
