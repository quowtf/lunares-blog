'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { SearchIcon } from '@/components/archive/ui'
import { cn } from '@/utilities/ui'

export function ArchiveSearch({ className }: { className?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  return (
    <form
      className={cn('relative w-full sm:w-56', className)}
      onSubmit={(event) => {
        event.preventDefault()
        const trimmed = query.trim()
        if (!trimmed) return
        router.push(`/search?q=${encodeURIComponent(trimmed)}`)
      }}
    >
      <label className="sr-only" htmlFor="archive-search">
        Buscar
      </label>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        className="h-10 w-full rounded-full border border-input bg-background py-2 pl-9 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring"
        id="archive-search"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search"
        type="search"
        value={query}
      />
    </form>
  )
}
