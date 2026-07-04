import { Children, type ReactNode } from 'react'

import { cn } from '@/utilities/ui'

type MasonryProps = {
  children: ReactNode
  className?: string
  /**
   * Column counts per breakpoint. Defaults: 1 → 2 (sm) → 3 (lg) → 4 (xl).
   * The largest value is used for the server-side column distribution so the
   * layout matches at the widest viewport without any JavaScript.
   */
  columns?: { sm?: number; lg?: number; xl?: number }
}

/**
 * Distributes children into N columns on the server using a flex-based grid.
 *
 * Items are distributed column-by-column (not row-by-row): the first column
 * receives the newest items, the last column the oldest, preserving
 * chronological order top-to-bottom within each column.
 *
 * Unlike CSS `columns`, this approach pins each item to a specific column at
 * render time, so items never jump or reflow when images load, the theme
 * becomes visible, or any sibling changes height.
 */
export function Masonry({ children, className, columns = { sm: 2, lg: 3, xl: 4 } }: MasonryProps) {
  const items = Children.toArray(children)
  const maxCols = columns.xl ?? columns.lg ?? columns.sm ?? 1

  // Distribute items column-by-column so the newest items fill the first
  // column top-to-bottom, then the next column, etc. This keeps chronological
  // order reading left-to-right, top-to-bottom within each column.
  const cols: ReactNode[][] = Array.from({ length: maxCols }, () => [])
  const baseSize = Math.floor(items.length / maxCols)
  const remainder = items.length % maxCols
  let offset = 0
  for (let col = 0; col < maxCols; col++) {
    // Earlier columns get one extra item when items don't divide evenly.
    const colSize = baseSize + (col < remainder ? 1 : 0)
    for (let i = 0; i < colSize; i++) {
      cols[col]!.push(items[offset + i]!)
    }
    offset += colSize
  }

  const smCols = columns.sm ?? 1
  const lgCols = columns.lg ?? smCols
  const xlCols = columns.xl ?? lgCols

  // Tailwind needs static class strings — build them from the known values.
  const gridColsClass = cn(
    'grid-cols-1',
    smCols === 2 && 'sm:grid-cols-2',
    smCols === 3 && 'sm:grid-cols-3',
    smCols === 4 && 'sm:grid-cols-4',
    lgCols === 2 && 'lg:grid-cols-2',
    lgCols === 3 && 'lg:grid-cols-3',
    lgCols === 4 && 'lg:grid-cols-4',
    xlCols === 2 && 'xl:grid-cols-2',
    xlCols === 3 && 'xl:grid-cols-3',
    xlCols === 4 && 'xl:grid-cols-4',
  )

  return (
    <div className={cn('grid items-start gap-4', gridColsClass, className)}>
      {cols.map((colItems, colIndex) => (
        <div className="flex flex-col gap-4" key={colIndex}>
          {colItems}
        </div>
      ))}
    </div>
  )
}
