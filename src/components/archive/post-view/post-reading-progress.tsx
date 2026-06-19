'use client'

import { useEffect, useState } from 'react'

type PostReadingProgressProps = {
  date: string
  readingTime: string
}

export function PostReadingProgress({ date, readingTime }: PostReadingProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const maxScroll = scrollHeight - clientHeight

      if (maxScroll <= 0) {
        setProgress(0)
        return
      }

      setProgress(Math.min(100, Math.round((scrollTop / maxScroll) * 100)))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  return (
    <aside
      aria-hidden="true"
      className="pointer-events-none fixed right-4 top-20 z-40 hidden w-20 text-right sm:top-24 lg:block xl:right-10"
    >
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-stone-400">
        Reading time
      </p>
      <p className="font-display text-lg leading-tight text-stone-700">{readingTime}</p>
      <p className="mt-1 text-[0.65rem] leading-4 text-stone-400">{date}</p>
      <div className="mt-4 flex flex-col items-end gap-2">
        <div className="h-16 w-px bg-stone-200">
          <div
            className="w-full origin-top bg-stone-400 transition-[height] duration-150 ease-out"
            style={{ height: `${progress}%` }}
          />
        </div>
        <p className="font-mono text-[0.65rem] tabular-nums text-stone-400">{progress}%</p>
      </div>
    </aside>
  )
}
