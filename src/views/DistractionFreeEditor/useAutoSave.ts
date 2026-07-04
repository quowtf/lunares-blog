'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { buildCreatePayload } from './utils'
import { transformUploadMarkers } from './ImageUploadPlugin'

export interface UseAutoSaveOptions {
  userId: string
  editorState: SerializedEditorState | null
  title: string
  slug: string
  /** If editing an existing post, pass the ID to skip creation and go straight to PATCH */
  initialPostId?: string | null
  /** Category name to find-or-create and attach to the post */
  category?: string
}

export interface UseAutoSaveReturn {
  postId: string | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: Date | null
  retry: () => void
}

/** Minimum title length before we attempt to create a draft */
const MIN_TITLE_LENGTH = 3

/** Debounce delay — wait for 3s of inactivity before saving */
const DEBOUNCE_MS = 3000

/**
 * Finds a category by title or creates a new one. Returns the category ID.
 */
async function findOrCreateCategory(categoryTitle: string): Promise<number | null> {
  if (!categoryTitle || categoryTitle.trim().length === 0) return null

  const title = categoryTitle.trim()

  try {
    // Search for existing category (case-insensitive via 'like')
    const searchRes = await fetch(
      `/api/categories?where[title][equals]=${encodeURIComponent(title)}&limit=1`,
      { credentials: 'include' },
    )
    if (searchRes.ok) {
      const data = await searchRes.json()
      if (data.docs && data.docs.length > 0) {
        return data.docs[0].id
      }
    }

    // Not found — create it
    const createRes = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title }),
    })
    if (createRes.ok) {
      const data = await createRes.json()
      return data.doc?.id ?? data.id ?? null
    }
  } catch {
    // Silently fail — category is optional
  }

  return null
}

/**
 * Prepares the serialized editor state for the API by converting upload markers
 * to proper Payload upload nodes.
 */
function prepareContentForApi(state: SerializedEditorState): SerializedEditorState {
  return transformUploadMarkers(state as unknown as Parameters<typeof transformUploadMarkers>[0]) as unknown as SerializedEditorState
}

export function useAutoSave({
  userId,
  editorState,
  title,
  slug,
  initialPostId = null,
  category,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [postId, setPostId] = useState<string | null>(initialPostId)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const postIdRef = useRef<string | null>(initialPostId)
  const isCreatingRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastEditorStateRef = useRef<SerializedEditorState | null>(null)
  const lastTitleRef = useRef<string>(title)
  const lastSlugRef = useRef<string>(slug)
  const lastCategoryRef = useRef<string>(category || '')
  const retryFlagRef = useRef(false)

  // Keep refs in sync
  lastEditorStateRef.current = editorState
  lastTitleRef.current = title
  lastSlugRef.current = slug
  lastCategoryRef.current = category || ''

  const createDraft = useCallback(async () => {
    if (isCreatingRef.current || postIdRef.current) return
    if (!lastEditorStateRef.current) return
    if (lastTitleRef.current.length < MIN_TITLE_LENGTH) return

    isCreatingRef.current = true
    setSaveStatus('saving')

    try {
      // Find or create category
      const categoryId = await findOrCreateCategory(lastCategoryRef.current)

      const content = prepareContentForApi(lastEditorStateRef.current)
      const payload = buildCreatePayload(
        userId,
        lastTitleRef.current,
        lastSlugRef.current,
        content,
      )

      // Attach category if found/created
      if (categoryId) {
        payload.categories = [categoryId]
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to create draft: ${response.status}`)
      }

      const data = await response.json()
      const createdId = String(data.doc?.id ?? data.id)

      postIdRef.current = createdId
      setPostId(createdId)
      setSaveStatus('saved')
      setLastSavedAt(new Date())
    } catch {
      setSaveStatus('error')
    } finally {
      isCreatingRef.current = false
    }
  }, [userId])

  const patchDraft = useCallback(async () => {
    const currentPostId = postIdRef.current
    if (!currentPostId || !lastEditorStateRef.current) return

    setSaveStatus('saving')

    try {
      // Find or create category
      const categoryId = await findOrCreateCategory(lastCategoryRef.current)

      const content = prepareContentForApi(lastEditorStateRef.current)

      const patchBody: Record<string, unknown> = {
        title: lastTitleRef.current,
        slug: lastSlugRef.current,
        content,
      }

      if (categoryId) {
        patchBody.categories = [categoryId]
      }

      const response = await fetch(`/api/posts/${currentPostId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patchBody),
      })

      if (!response.ok) {
        throw new Error(`Failed to update draft: ${response.status}`)
      }

      setSaveStatus('saved')
      setLastSavedAt(new Date())
    } catch {
      setSaveStatus('error')
    }
  }, [])

  // Main effect: triggers auto-save on editor state changes
  useEffect(() => {
    if (!editorState) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!postIdRef.current && !isCreatingRef.current) {
        createDraft()
      } else if (postIdRef.current) {
        patchDraft()
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [editorState, title, slug, createDraft, patchDraft])

  const retry = useCallback(() => {
    retryFlagRef.current = true
    if (!postIdRef.current && !isCreatingRef.current) {
      createDraft()
    } else if (postIdRef.current) {
      patchDraft()
    }
  }, [createDraft, patchDraft])

  return {
    postId,
    saveStatus,
    lastSavedAt,
    retry,
  }
}
