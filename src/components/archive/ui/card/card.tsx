import type { ElementType, ReactNode } from 'react'

import type { CardVariant } from '@/types/archive'
import { cn } from '@/utilities/ui'

import { cardBase, cardVariants } from './card-variants'

type CardProps = {
  children: ReactNode
  variant?: CardVariant
  className?: string
  as?: 'article' | 'div' | 'section'
}

export function Card({
  children,
  variant = 'default',
  className,
  as: Element = 'article',
}: CardProps) {
  const Tag = Element as ElementType

  return <Tag className={cn(cardBase, cardVariants[variant], className)}>{children}</Tag>
}
