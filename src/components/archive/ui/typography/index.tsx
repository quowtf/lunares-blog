import type { ReactNode } from 'react'

import { cn } from '@/utilities/ui'

type TypographyProps = {
  children: ReactNode
  className?: string
}

export function Eyebrow({ children, className }: TypographyProps) {
  return (
    <p
      className={cn(
        'text-[0.65rem] font-medium uppercase tracking-[0.18em] text-stone-500',
        className,
      )}
    >
      {children}
    </p>
  )
}

export function Meta({ children, className }: TypographyProps) {
  return <p className={cn('text-xs leading-5 text-stone-500', className)}>{children}</p>
}

export function CardTitle({ children, className }: TypographyProps) {
  return (
    <h2 className={cn('font-serif text-xl leading-tight tracking-tight text-stone-950', className)}>
      {children}
    </h2>
  )
}

export function CardSubtitle({ children, className }: TypographyProps) {
  return <p className={cn('text-sm leading-5 text-stone-600', className)}>{children}</p>
}
