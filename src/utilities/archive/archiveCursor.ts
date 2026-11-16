import type { ArchivePostData } from '@/components/archive/archive-post-card'

export type ArchiveCursor = {
  id: number
  publishedAt: string
}

export type LoadArchivePostsResult =
  | {
      hasMore: boolean
      nextCursor: ArchiveCursor | null
      ok: true
      posts: ArchivePostData[]
    }
  | {
      ok: false
      reason: 'error' | 'unauthorized'
    }
