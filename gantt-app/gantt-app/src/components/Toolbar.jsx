import React, { useState, useRef, useEffect } from 'react'

/**
 * Toolbar
 * Top bar with: title, zoom controls, weekend toggle, reset, AI command bar + mic.
 * Props: state, dispatch, onCommand, cmdStatus
 */
export default function Toolbar({ state, dispatch, onCommand, cmdStatus }) {
  const { showWeekends, zoomLevel } = state
  const [cmd, setCmd]           = useState('')
  const [listening, setListening] = useState(false)
  const [micError, setMicError]   = useState('')
  const recognitionRef = useRef(null)

  // Clean up on unmount
  useEffect(() => () => recognitionRef.current?.abort(), [])

  const toggleMic = () => {
    setMicError('')

    // Stop if already listening
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMicError('Speech recognition not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart  = () => setListening(true)
    recognition.onend    = () => setListening(false)
    recognition.onerror  = (e) => {
      setListening(false)
      if (e.error !== 'no-speech') setMicError(`Mic error: ${e.error}`)
    }

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim()
      if (!transcript) return
      // Submit directly — same path as typing + clicking Ask
      onCommand(transcript)
      setCmd('')
    }

    recognition.start()
  }

  const submitCmd = (e) => {
    e.preventDefault()
    const trimmed = cmd.trim()
    if (!trimmed || cmdStatus.status === 'loading') return
    onCommand(trimmed)
    setCmd('')
  }

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

      {/* ── AI Command Bar ── */}
      <form onSubmit={submitCmd} className="flex items-center gap-1.5 ml-2">
        <div className="relative flex items-center">
          {/* Lightning bolt icon */}
          <span className="absolute left-2 text-violet-400 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z"/>
            </svg>
          </span>
          <input
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            placeholder={listening ? 'Listening…' : 'e.g. assign UAT to Alice, move kickoff to Feb 1…'}
            disabled={cmdStatus.status === 'loading'}
            className={[
              'pl-6 pr-3 py-1.5 w-72 rounded-l-md border border-r-0 text-xs focus:outline-none focus:ring-2 disabled:opacity-50 placeholder:text-slate-300',
              listening
                ? 'border-red-300 focus:ring-red-400 placeholder:text-red-400'
                : 'border-slate-200 focus:ring-violet-400',
            ].join(' ')}
          />
        </div>

        {/* Mic button */}
        <button
          type="button"
          onClick={toggleMic}
          title={listening ? 'Stop listening' : 'Speak a command'}
          className={[
            'px-2.5 py-1.5 border text-xs font-bold transition-all flex items-center gap-1',
            listening
              ? 'bg-red-500 border-red-500 text-white animate-pulse'
              : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300',
          ].join(' ')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="9" y="2" width="6" height="12" rx="3"/>
            <path d="M5 11a7 7 0 0 0 14 0"/>
            <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8"  y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Ask button */}
        <button
          type="submit"
          disabled={!cmd.trim() || cmdStatus.status === 'loading'}
          className="px-3 py-1.5 rounded-r-md bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold transition-colors border border-violet-600"
        >
          {cmdStatus.status === 'loading' ? '…' : 'Ask'}
        </button>

        {/* Status feedback */}
        {cmdStatus.status === 'success' && (
          <span className="text-xs font-semibold text-green-600">✓ {cmdStatus.message}</span>
        )}
        {cmdStatus.status === 'error' && (
          <span className="text-xs font-semibold text-red-500" title={cmdStatus.message}>
            ✕ {cmdStatus.message.slice(0, 40)}{cmdStatus.message.length > 40 ? '…' : ''}
          </span>
        )}
        {micError && (
          <span className="text-xs font-semibold text-orange-500">{micError}</span>
        )}
      </form>
    </div>
  )
}
