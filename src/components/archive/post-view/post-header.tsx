'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { ArchiveSearch } from '@/components/archive/hero/archive-search'
import { useTheme } from '@/providers/Theme'
import type { Theme } from '@/providers/Theme/ThemeSelector/types'
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

  const cycleTheme = () => {
    const order: Array<Theme | null> = ['light', 'dark', null]
    const current = theme ?? null
    const index = order.indexOf(current)
    const next = order[(index + 1) % order.length]
    setTheme(next)
  }

  if (!mounted) {
    return <span className={cn('text-xs text-stone-400', className)}>Theme</span>
  }

  const label = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Auto'

  return (
    <button
      className={cn(
        'text-xs text-stone-500 transition hover:text-stone-800',
        className,
      )}
      onClick={cycleTheme}
      type="button"
    >
      {label}
    </button>
  )
}

export function PostHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-stone-200/60 bg-stone-50/90 backdrop-blur-md sm:h-[72px]">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:pl-[140px] lg:pr-10">
        <Link
          className="font-display text-lg tracking-tight text-stone-900 transition hover:text-stone-600 sm:text-xl"
          href="/"
        >
          Archive
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 lg:gap-8">
          <ArchiveSearch className="hidden w-40 sm:block lg:w-44 [&_input]:h-9 [&_input]:border-stone-200/80 [&_input]:bg-stone-50/50 [&_input]:text-xs" />
          <Link
            className="text-xs text-stone-500 transition hover:text-stone-800 sm:hidden"
            href="/search"
          >
            Search
          </Link>
          <button
            aria-label="Bookmarks"
            className="text-stone-400 transition hover:text-stone-700"
            type="button"
          >
            <BookmarkIcon className="h-4 w-4" />
          </button>
          <span className="hidden text-xs text-stone-400 md:inline">Bookmarks</span>
          <PostThemeToggle />
        </nav>
      </div>
    </header>
  )
}
