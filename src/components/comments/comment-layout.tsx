'use client'

import { CommentProvider } from './comment-provider'

export function CommentLayout({ children }: { children: React.ReactNode }) {
  return <CommentProvider>{children}</CommentProvider>
}
