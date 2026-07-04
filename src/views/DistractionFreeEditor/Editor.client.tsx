'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EditorState, SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { LexicalComposer } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposer'
import { RichTextPlugin } from '@payloadcms/richtext-lexical/lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@payloadcms/richtext-lexical/lexical/react/LexicalContentEditable'
import { OnChangePlugin } from '@payloadcms/richtext-lexical/lexical/react/LexicalOnChangePlugin'
import { HistoryPlugin } from '@payloadcms/richtext-lexical/lexical/react/LexicalHistoryPlugin'
import { LexicalErrorBoundary } from '@payloadcms/richtext-lexical/lexical/react/LexicalErrorBoundary'
import { MarkdownShortcutPlugin } from '@payloadcms/richtext-lexical/lexical/react/LexicalMarkdownShortcutPlugin'
import { HEADING } from '@payloadcms/richtext-lexical/lexical/markdown'
import { HeadingNode } from '@payloadcms/richtext-lexical/lexical/rich-text'

import { extractTitleFromEditorState, generateSlug, sanitizeEditorContent } from './utils'
import { useAutoSave } from './useAutoSave'
import { StatusIndicator } from './StatusIndicator'
import { PublishButton } from './PublishButton'
import { ImageUploadPlugin } from './ImageUploadPlugin'

export interface ExistingPostData {
  id: string
  title: string
  content: SerializedEditorState | null
  PostType: string | null
  categories: Array<{ id: number; title: string }> | null
}

export interface DistractionFreeEditorProps {
  userId: string
  existingPost?: ExistingPostData | null
}

function useVisualViewport() {
  const [viewportOffset, setViewportOffset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    function handleResize() {
      if (!viewport) return
      const offset = window.innerHeight - viewport.height
      setViewportOffset(offset)
    }

    viewport.addEventListener('resize', handleResize)
    viewport.addEventListener('scroll', handleResize)

    return () => {
      viewport.removeEventListener('resize', handleResize)
      viewport.removeEventListener('scroll', handleResize)
    }
  }, [])

  return viewportOffset
}

function formatCurrentDate(): string {
  const now = new Date()
  return now
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase()
}

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&display=swap'

const editorStyles = `
.dfe-paragraph {
  font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif;
  font-size: 1.0625rem;
  line-height: 1.85;
  margin-bottom: 1.75rem;
  color: var(--theme-elevation-1000, #1a1a1a);
}

@media (min-width: 640px) {
  .dfe-paragraph {
    font-size: 1.125rem;
    line-height: 1.9;
  }
}

@media (min-width: 1024px) {
  .dfe-paragraph {
    font-size: 1.25rem;
  }
}

.dfe-heading {
  font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  font-weight: 300;
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  color: var(--theme-elevation-1000, #1a1a1a);
}

.dfe-h1 { font-size: clamp(2.25rem, 8vw, 4rem); }
.dfe-h2 { font-size: 2rem; }
.dfe-h3 { font-size: 1.5rem; }
.dfe-h4 { font-size: 1.25rem; }

.dfe-bold { font-weight: 600; }
.dfe-italic { font-style: italic; }
.dfe-underline { text-decoration: underline; text-underline-offset: 3px; }

.dfe-placeholder {
  font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif;
  font-size: 1.0625rem;
  line-height: 1.85;
  color: var(--theme-elevation-400, #9ca3af);
}

@media (min-width: 640px) {
  .dfe-placeholder { font-size: 1.125rem; }
}
`

/**
 * Converts upload nodes in serialized content to paragraph text placeholders.
 * This allows our minimal editor (which doesn't register UploadNode) to load
 * existing posts that contain inline images without crashing.
 * The markers are converted back to proper upload nodes on save.
 */
function convertUploadsToPlaceholders(content: Record<string, unknown>): Record<string, unknown> {
  const root = content.root as { children: Array<Record<string, unknown>>; [key: string]: unknown } | undefined
  if (!root?.children) return content

  const convertedChildren = root.children.map((node) => {
    if (node.type !== 'upload') return node

    const mediaId = typeof node.value === 'object' && node.value !== null
      ? (node.value as Record<string, unknown>).id
      : node.value
    const relationTo = node.relationTo || 'media'

    // Extract caption if present
    let caption = ''
    const fields = node.fields as Record<string, unknown> | null | undefined
    if (fields?.caption) {
      const captionRoot = (fields.caption as Record<string, unknown>)?.root as Record<string, unknown> | undefined
      const captionChildren = captionRoot?.children as Array<Record<string, unknown>> | undefined
      if (captionChildren?.[0]) {
        const textChildren = (captionChildren[0] as Record<string, unknown>).children as Array<Record<string, unknown>> | undefined
        if (textChildren?.[0]?.text) {
          caption = String(textChildren[0].text)
        }
      }
    }

    // Convert to a paragraph with our marker format
    const marker = caption
      ? `{{upload:${mediaId}:${relationTo}:${caption}}}`
      : `{{upload:${mediaId}:${relationTo}}}`

    return {
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'text',
          text: marker,
          version: 1,
          format: 0,
          mode: 'normal',
          style: '',
          detail: 0,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      textFormat: 0,
      textStyle: '',
    }
  })

  return {
    ...content,
    root: {
      ...root,
      children: convertedChildren,
    },
  }
}

export function DistractionFreeEditor({ userId, existingPost }: DistractionFreeEditorProps) {
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(null)
  const [title, setTitle] = useState(existingPost?.title || '')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState(() => {
    if (existingPost?.categories && existingPost.categories.length > 0) {
      return existingPost.categories[0].title.toUpperCase()
    }
    return 'NOTAS'
  })
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const viewportOffset = useVisualViewport()

  const formattedDate = useMemo(() => formatCurrentDate(), [])

  const { postId, saveStatus, lastSavedAt } = useAutoSave({
    userId,
    editorState,
    title,
    slug,
    initialPostId: existingPost?.id || null,
    category,
  })

  useEffect(() => {
    if (viewportOffset <= 0) return
    const activeElement = document.activeElement
    if (activeElement && editorContainerRef.current?.contains(activeElement)) {
      activeElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [viewportOffset])

  const handleEditorChange = useCallback((state: EditorState) => {
    const serialized = state.toJSON()
    const sanitized = sanitizeEditorContent(serialized)
    const extractedTitle = extractTitleFromEditorState(sanitized)
    const generatedSlug = generateSlug(extractedTitle)
    setTitle(extractedTitle)
    setSlug(generatedSlug)
    setEditorState(sanitized)
  }, [])

  // Build initialConfig with editorState if editing existing post
  const composerConfig = useMemo(() => {
    if (existingPost?.content) {
      // Convert upload nodes to text placeholders so our minimal editor can parse them
      const safeContent = convertUploadsToPlaceholders(existingPost.content as unknown as Record<string, unknown>)
      return {
        ...initialConfig,
        editorState: JSON.stringify(safeContent),
      }
    }
    return initialConfig
  }, [existingPost])

  return (
    <div
      style={{
        width: '100%',
        ...(viewportOffset > 0 ? { paddingBottom: `${viewportOffset}px` } : {}),
      }}
    >
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />

      <div
        style={{
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          padding: '3rem 1.5rem 3rem',
        }}
      >
        {/* Header: single row — meta left, actions right */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'nowrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.5rem 0.75rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '0.6875rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--theme-elevation-400, #6b7280)',
            }}
          >
            <span>Post</span>
            <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
            <time>{formattedDate}</time>
            <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value.toUpperCase())}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px dashed transparent',
                outline: 'none',
                font: 'inherit',
                color: 'inherit',
                padding: 0,
                width: `${Math.max(category.length + 1, 5)}ch`,
              }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'currentColor' }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'transparent' }}
              aria-label="Categoría del post"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <StatusIndicator saveStatus={saveStatus} lastSavedAt={lastSavedAt} />
            <PublishButton postId={postId} slug={slug} />
          </div>
        </header>

        {/* Editor */}
        <div style={{ marginTop: '2.5rem' }} ref={editorContainerRef}>
          <LexicalComposer initialConfig={composerConfig}>
            <div style={{ position: 'relative', minHeight: '50vh' }}>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    style={{
                      outline: 'none',
                      minHeight: '50vh',
                      caretColor: 'var(--theme-elevation-1000, #1a1a1a)',
                    }}
                    aria-label="Editor de contenido"
                  />
                }
                placeholder={
                  <div
                    className="dfe-placeholder"
                    style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
                  >
                    Comienza a escribir...
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
            <OnChangePlugin onChange={handleEditorChange} ignoreSelectionChange />
            <HistoryPlugin />
            <MarkdownShortcutPlugin transformers={[HEADING]} />
            <ImageUploadPlugin />
          </LexicalComposer>
        </div>
      </div>
    </div>
  )
}

const initialConfig = {
  namespace: 'DistractionFreeEditor',
  nodes: [HeadingNode],
  onError: (error: Error) => console.error('[DistractionFreeEditor]', error),
  theme: {
    heading: {
      h1: 'dfe-heading dfe-h1',
      h2: 'dfe-heading dfe-h2',
      h3: 'dfe-heading dfe-h3',
      h4: 'dfe-heading dfe-h4',
    },
    paragraph: 'dfe-paragraph',
    text: {
      bold: 'dfe-bold',
      italic: 'dfe-italic',
      underline: 'dfe-underline',
    },
  },
}
