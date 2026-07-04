'use client'

export interface StatusIndicatorProps {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: Date | null
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export function StatusIndicator({ saveStatus, lastSavedAt }: StatusIndicatorProps) {
  if (saveStatus === 'idle') return null

  return (
    <span
      style={{
        fontSize: '0.625rem',
        letterSpacing: '0.05em',
        color: saveStatus === 'error' ? '#dc2626' : '#9ca3af',
        whiteSpace: 'nowrap',
      }}
      role={saveStatus === 'error' ? 'alert' : undefined}
      aria-live="polite"
    >
      {saveStatus === 'saving' && 'Guardando...'}
      {saveStatus === 'saved' && lastSavedAt && `Guardado ${formatTime(lastSavedAt)}`}
      {saveStatus === 'error' && 'Error'}
    </span>
  )
}
