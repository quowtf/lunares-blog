'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
} from '@payloadcms/richtext-lexical/lexical'

/**
 * Lexical plugin that listens for "/image" typed on a line.
 * When detected, opens a modal to upload an image to /api/media.
 * After upload, inserts a Payload-compatible upload node into the editor state
 * so it renders correctly in Payload's editor and live preview.
 */
export function ImageUploadPlugin() {
  const [editor] = useLexicalComposerContext()
  const [showModal, setShowModal] = useState(false)

  // Listen for text content changes to detect "/image" command
  useEffect(() => {
    const removeListener = editor.registerTextContentListener((text) => {
      const lines = text.split('\n')
      const hasCommand = lines.some((line) => line.trim() === '/image')
      if (hasCommand) {
        // Remove the "/image" text from editor
        editor.update(() => {
          const root = $getRoot()
          const children = root.getChildren()
          for (const child of children) {
            if (child.getType() === 'paragraph' && child.getTextContent().trim() === '/image') {
              child.remove()
              break
            }
          }
        })
        setShowModal(true)
      }
    })

    return removeListener
  }, [editor])

  const handleUploadComplete = useCallback(
    (mediaId: number, filename: string, caption: string) => {
      // Insert a Payload-compatible upload node as serialized JSON structure.
      // Since our minimal editor doesn't have UploadNode registered as a Lexical node class,
      // we insert a paragraph with a structured marker that the auto-save will include.
      // To make it compatible with Payload's richtext, we'll inject the proper node structure
      // directly into the serialized state via a custom approach.
      //
      // For now, insert a recognizable text marker. The useAutoSave hook will transform
      // these markers into proper upload nodes before sending to the API.
      editor.update(() => {
        const paragraph = $createParagraphNode()
        // Structured marker format: {{upload:mediaId:filename:caption}}
        const marker = `{{upload:${mediaId}:${filename}${caption ? ':' + caption : ''}}}`
        const text = $createTextNode(marker)
        paragraph.append(text)

        const root = $getRoot()
        root.append(paragraph)

        // Add empty paragraph for continued typing
        const emptyParagraph = $createParagraphNode()
        root.append(emptyParagraph)
        emptyParagraph.select()
      })
      setShowModal(false)
    },
    [editor],
  )

  if (!showModal) return null

  return <ImageModal onClose={() => setShowModal(false)} onUpload={handleUploadComplete} />
}

/**
 * Transforms upload markers in the serialized editor state into proper
 * Payload upload nodes before saving to the API.
 */
export function transformUploadMarkers(
  state: { root: { children: Array<Record<string, unknown>>; [key: string]: unknown }; [key: string]: unknown },
): typeof state {
  // Match new format: {{upload:ID:filename}} or {{upload:ID:filename:caption}}
  const NEW_PATTERN = /^\{\{upload:(\d+):(.+?)(?::(.+))?\}\}$/
  // Match old format: [img:ID — label]
  const OLD_PATTERN = /^\[img:(\d+)\s*—\s*(.+?)\]$/

  const transformedChildren = state.root.children.map((node) => {
    if (node.type !== 'paragraph') return node

    const children = node.children as Array<Record<string, unknown>> | undefined
    if (!children || children.length !== 1) return node

    const textNode = children[0]
    if (textNode.type !== 'text') return node

    const text = textNode.text as string

    let mediaId: number | null = null
    let caption = ''

    const newMatch = text.match(NEW_PATTERN)
    if (newMatch) {
      mediaId = Number(newMatch[1])
      caption = newMatch[3] || ''
    } else {
      const oldMatch = text.match(OLD_PATTERN)
      if (oldMatch) {
        mediaId = Number(oldMatch[1])
        caption = oldMatch[2] || ''
      }
    }

    if (!mediaId) return node

    // Return a proper Payload upload node structure
    return {
      type: 'upload',
      version: 3,
      format: '',
      relationTo: 'media',
      value: mediaId,
      id: crypto.randomUUID(),
      fields: caption
        ? {
            caption: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: [{ type: 'text', text: caption, version: 1, format: 0, mode: 'normal', style: '', detail: 0 }],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 0,
                    textStyle: '',
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
          }
        : null,
    }
  })

  return {
    ...state,
    root: {
      ...state.root,
      children: transformedChildren,
    },
  }
}

/**
 * Modal for image upload.
 * Fields: file (required), caption, alt.
 */
function ImageModal({
  onClose,
  onUpload,
}: {
  onClose: () => void
  onUpload: (mediaId: number, filename: string, caption: string) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [alt, setAlt] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    fileInputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!file) return

      setIsUploading(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append('file', file)
        // Alt is a simple text field
        const altText = alt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        formData.append('alt', altText)

        const response = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.errors?.[0]?.message || `Error ${response.status}`)
        }

        const data = await response.json()
        const mediaId = data.doc?.id ?? data.id

        // If caption was provided, update the media doc with a PATCH
        // (caption is richText so we can't send it via multipart form easily)
        if (caption && mediaId) {
          await fetch(`/api/media/${mediaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              caption: {
                root: {
                  type: 'root',
                  children: [
                    {
                      type: 'paragraph',
                      version: 1,
                      children: [{ type: 'text', text: caption, version: 1, format: 0, mode: 'normal', style: '', detail: 0 }],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      textFormat: 0,
                      textStyle: '',
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
              },
            }),
          })
        }

        onUpload(mediaId, file.name, caption)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir imagen')
        setIsUploading(false)
      }
    },
    [file, caption, alt, onUpload],
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
          Subir imagen
        </h2>

        <form onSubmit={handleSubmit}>
          {/* File */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Archivo *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                setFile(f)
                if (f && !alt) {
                  setAlt(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
                }
              }}
              style={{ display: 'block', width: '100%', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}
            />
            {file && (
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem', display: 'block' }}>
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>

          {/* Caption */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Descripción visible bajo la imagen"
              style={inputStyle}
            />
          </div>

          {/* Alt */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Alt</label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Texto alternativo (accesibilidad)"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.75rem', color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={secondaryButtonStyle}>
              Cancelar
            </button>
            <button type="submit" disabled={!file || isUploading} style={{ ...primaryButtonStyle, opacity: !file || isUploading ? 0.5 : 1, cursor: !file || isUploading ? 'not-allowed' : 'pointer' }}>
              {isUploading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
  marginBottom: '0.5rem',
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  outline: 'none',
  color: '#111827',
  backgroundColor: '#ffffff',
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#374151',
  cursor: 'pointer',
}

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#111827',
  color: '#ffffff',
}
