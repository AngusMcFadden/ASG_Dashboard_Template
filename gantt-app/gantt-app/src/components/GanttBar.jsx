import React, { useState } from 'react'

/**
 * GanttBar
 * Renders a single task bar inside a GanttRow.
 * Props: task, resources, startIndex, span, dayWidth, rowHeight, color, onClick
 */
export default function GanttBar({
  task,
  resources,
  startIndex,
  span,
  dayWidth,
  rowHeight = 46,
  color,
  onClick,
}) {
  const [hovered, setHovered] = useState(false)

  const BAR_H = Math.round(rowHeight * 0.58)
  const barTop = Math.round((rowHeight - BAR_H) / 2)
  const left   = startIndex * dayWidth
  const width  = Math.max(span * dayWidth - 2, 6)
  const completionW = Math.round((task.percentComplete / 100) * width)

  const assignedNames = resources
    .filter(r => task.resourceIds.includes(r.id))
    .map(r => r.name)
    .join(', ')

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top: barTop,
        width,
        height: BAR_H,
        borderRadius: 5,
        backgroundColor: color,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s, transform 0.12s, filter 0.15s',
        boxShadow: hovered
          ? `0 4px 14px ${color}88, 0 2px 6px rgba(0,0,0,0.2)`
          : '0 1px 4px rgba(0,0,0,0.15)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        filter: hovered ? 'brightness(1.1)' : 'brightness(1)',
        zIndex: hovered ? 10 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick?.(task)}
      title={`${task.name}\n${assignedNames}\n${task.startDate} → ${task.endDate}\n${task.percentComplete}% complete`}
    >
      {/* Completion fill */}
      {task.percentComplete > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: completionW,
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.22)',
            borderRadius: 'inherit',
            transition: 'width 0.3s ease',
          }}
        />
      )}

      {/* Stripe overlay when 100% done */}
      {task.percentComplete === 100 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.15) 5px, rgba(255,255,255,0.15) 10px)',
          }}
        />
      )}

      {/* Label */}
      {width > 28 && (
        <span
          style={{
            position: 'absolute',
            left: 7,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: width - 14,
            lineHeight: 1,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {task.percentComplete > 0 ? `${task.percentComplete}% · ` : ''}
          {task.name}
        </span>
      )}
    </div>
  )
}
