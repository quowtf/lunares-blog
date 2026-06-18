import type { ReactNode } from 'react'

import { cn } from '@/utilities/ui'

type MasonryProps = {
  children: ReactNode
  className?: string
}

export function Masonry({ children, className }: MasonryProps) {
  return (
    <div className={cn('columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4', className)}>
      {children}
    </div>
  )
}
