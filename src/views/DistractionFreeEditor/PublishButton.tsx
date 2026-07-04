'use client'

import { useCallback, useState } from 'react'

export interface PublishButtonProps {
  postId: string | null
  slug: string
}

export function PublishButton({ postId, slug }: PublishButtonProps) {
  const [publishStatus, setPublishStatus] = useState<
    'draft' | 'publishing' | 'published' | 'error'
  >('draft')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isDisabled =
    postId === null || publishStatus === 'publishing' || publishStatus === 'published'

  const handlePublish = useCallback(async () => {
    if (!postId || publishStatus !== 'draft') return

    setPublishStatus('publishing')
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ _status: 'published' }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.errors?.[0]?.message ?? `Error ${response.status}`
        throw new Error(message)
      }

      setPublishStatus('published')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo publicar el post'
      setErrorMessage(message)
      setPublishStatus('error')
    }
  }, [postId, publishStatus])

  const handleRetry = useCallback(() => {
    setPublishStatus('draft')
    setErrorMessage(null)
  }, [])

  if (publishStatus === 'published') {
    return (
      <span style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        <span style={{ color: '#059669' }}>Publicado</span>
        {' '}
        <a href={`/posts/${slug}`} style={{ color: '#6b7280', textDecoration: 'underline' }}>Ver →</a>
      </span>
    )
  }

  const buttonLabel =
    publishStatus === 'publishing' ? 'Publicando...' :
    publishStatus === 'error' ? 'Reintentar' : 'Publicar'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        type="button"
        onClick={publishStatus === 'error' ? handleRetry : handlePublish}
        disabled={isDisabled}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '0.6875rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '0.375rem 0.875rem',
          borderRadius: '9999px',
          border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'opacity 150ms',
          ...(publishStatus === 'error'
            ? { backgroundColor: '#dc2626', color: '#ffffff', opacity: 1 }
            : { backgroundColor: '#111827', color: '#ffffff', opacity: isDisabled ? 0.35 : 1 }
          ),
        }}
        aria-label={buttonLabel}
      >
        {buttonLabel}
      </button>
      {errorMessage && (
        <span style={{ fontSize: '0.625rem', color: '#dc2626' }} role="alert">
          {errorMessage}
        </span>
      )}
    </span>
  )
}
