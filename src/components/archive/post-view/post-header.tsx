'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { ArchiveSearch } from '@/components/archive/hero/archive-search'
import { useTheme } from '@/providers/Theme'
import { cn } from '@/utilities/ui'

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 4.75h10v14.5l-5-3.2-5 3.2V4.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function PostThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Theme</span>
  }

  const isDark = theme === 'dark'

  return (
    <button
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={cn('text-xs text-muted-foreground transition hover:text-foreground', className)}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      type="button"
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  )
}

export function PostHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-border bg-background/90 backdrop-blur-md sm:h-[72px]">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:pl-[140px] lg:pr-10">
        <Link
          className="font-display text-lg tracking-tight text-foreground transition hover:text-muted-foreground sm:text-xl"
          href="/"
        >
          Lunares
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 lg:gap-8">
          <ArchiveSearch className="hidden w-40 sm:block lg:w-44 [&_input]:h-9 [&_input]:text-xs" />
          <Link
            className="text-xs text-muted-foreground transition hover:text-foreground sm:hidden"
            href="/search"
          >
            Search
          </Link>
          <button
            aria-label="Bookmarks"
            className="text-muted-foreground transition hover:text-foreground"
            type="button"
          >
            <BookmarkIcon className="h-4 w-4" />
          </button>
          <span className="hidden text-xs text-muted-foreground md:inline">Bookmarks</span>
          <PostThemeToggle />
        </nav>
      </div>
    </header>
  )
}
