import { useMemo } from 'react'
import { eachDayOfInterval, format, isWeekend, startOfYear, endOfYear } from 'date-fns'

// Build all 365 days of 2026 once
const ALL_2026 = eachDayOfInterval({
  start: startOfYear(new Date(2026, 0, 1)),
  end:   endOfYear(new Date(2026, 0, 1)),
}).map(date => ({
  date,
  dateStr:    format(date, 'yyyy-MM-dd'),
  isWeekend:  isWeekend(date),
  dayLabel:   format(date, 'EEE'),   // Mon, Tue …
  dayNum:     format(date, 'd'),     // 1, 2 …
  monthLabel: format(date, 'MMM'),   // Jan, Feb …
  monthYear:  format(date, 'MMM yyyy'),
  monthIdx:   date.getMonth(),
}))

/** Returns the array of visible day objects for 2026. */
export function useAllDays2026(showWeekends) {
  return useMemo(
    () => (showWeekends ? ALL_2026 : ALL_2026.filter(d => !d.isWeekend)),
    [showWeekends]
  )
}

/**
 * Given a task's start/end date strings and the visible days array,
 * returns { startIndex, span } or null if the task is outside the range.
 */
export function getBarPosition(startDate, endDate, visibleDays) {
  if (!visibleDays.length) return null

  let startIdx = -1
  let endIdx   = -1

  for (let i = 0; i < visibleDays.length; i++) {
    if (startIdx === -1 && visibleDays[i].dateStr >= startDate) startIdx = i
    if (visibleDays[i].dateStr <= endDate) endIdx = i
  }

  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return null

  return { startIndex: startIdx, span: endIdx - startIdx + 1 }
}

/** Count visible workdays between two date strings (inclusive). */
export function countWorkdays(startDate, endDate, showWeekends) {
  return ALL_2026.filter(
    d => d.dateStr >= startDate && d.dateStr <= endDate && (showWeekends || !d.isWeekend)
  ).length
}
