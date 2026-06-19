'use client'

import { X } from 'lucide-react'

import { CommentIcon } from '@/components/archive/ui'
import { cn } from '@/utilities/ui'

import { useCommentContext } from './comment-provider'

type CommentTriggerProps = {
  postId: string | number
  className?: string
}

/**
 * Drop-in comment button for archive cards.
 * Pair with <CommentPanel postId={postId} /> directly below the card.
 *
 * Usage:
 *   <Card>...</Card>
 *   <CommentPanel postId={postId} />
 *   // inside card footer:
 *   <CommentTrigger postId={postId} />
 */
export function CommentTrigger({ postId, className }: CommentTriggerProps) {
  const { activePostId, toggleComments } = useCommentContext()
  const isActive = activePostId === String(postId)

  return (
    <button
      aria-expanded={isActive}
      aria-label={isActive ? 'Cerrar comentarios' : 'Comentar'}
      className={cn(
        'rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive ? 'text-foreground' : 'text-muted-foreground',
        className,
      )}
      onClick={() => toggleComments(postId)}
      type="button"
    >
      {isActive ? <X className="h-4 w-4 shrink-0" /> : <CommentIcon className="h-4 w-4 shrink-0" />}
    </button>
  )
}
