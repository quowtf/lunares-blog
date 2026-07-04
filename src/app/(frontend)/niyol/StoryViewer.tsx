'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface ViewerStory {
  id: number
  imageUrl: string
  authorName: string
}

interface StoryViewerProps {
  stories: ViewerStory[]
}

const TIMER_DURATION = 4000

export function StoryViewer({ stories }: StoryViewerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)

  // Crossfade state: track the previous index to show during transition
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)

  // Timer refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elapsedRef = useRef<number>(0)
  const startTimeRef = useRef<number>(Date.now())
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClose = () => {
    router.push('/')
  }

  // Trigger crossfade transition when changing stories
  const changeStory = useCallback(
    (nextIndex: number) => {
      setPreviousIndex(currentIndex)
      setIsTransitioning(true)
      setCurrentIndex(nextIndex)
    },
    [currentIndex],
  )

  // When isTransitioning becomes true, schedule the fade-in on next frame
  useEffect(() => {
    if (isTransitioning) {
      // Use rAF to ensure browser paints the opacity-0 frame first
      const frameId = requestAnimationFrame(() => {
        setIsTransitioning(false)
      })

      // Clear previous layer after transition completes
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      transitionTimeoutRef.current = setTimeout(() => {
        setPreviousIndex(null)
      }, 300)

      return () => cancelAnimationFrame(frameId)
    }
  }, [isTransitioning])

  // Advance to next story or navigate home if on last
  const advanceStory = useCallback(() => {
    if (currentIndex >= stories.length - 1) {
      router.push('/')
    } else {
      setPreviousIndex(currentIndex)
      setIsTransitioning(true)
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, stories.length, router])

  // Start a timer for the remaining duration
  const startTimer = useCallback(
    (remaining: number) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      startTimeRef.current = Date.now()
      timerRef.current = setTimeout(() => {
        elapsedRef.current = 0
        advanceStory()
      }, remaining)
    },
    [advanceStory],
  )

  // Reset timer to full duration (used on story change and tap navigation)
  const resetTimer = useCallback(() => {
    elapsedRef.current = 0
    setIsPaused(false)
    startTimer(TIMER_DURATION)
  }, [startTimer])

  // Tap handlers
  const handleTapRight = useCallback(() => {
    if (currentIndex >= stories.length - 1) {
      router.push('/')
    } else {
      changeStory(currentIndex + 1)
      resetTimer()
    }
  }, [currentIndex, stories.length, router, resetTimer, changeStory])

  const handleTapLeft = useCallback(() => {
    if (currentIndex > 0) {
      changeStory(currentIndex - 1)
      resetTimer()
    }
  }, [currentIndex, resetTimer, changeStory])

  // Visibility change handler — pause/resume timer
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      // Pause: store elapsed time and clear timeout
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      elapsedRef.current = Date.now() - startTimeRef.current + elapsedRef.current
      setIsPaused(true)
    } else {
      // Resume: restart timer with remaining time
      const remaining = TIMER_DURATION - elapsedRef.current
      setIsPaused(false)
      startTimer(Math.max(remaining, 0))
    }
  }, [startTimer])

  // Start timer on mount and reset on story change
  useEffect(() => {
    resetTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  // Set up visibility change listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  // Image preloading on mount
  useEffect(() => {
    stories.forEach((story) => {
      const img = new Image()
      img.onerror = () => {
        console.warn(
          `[StoryViewer] Failed to preload image for story ${story.id}: ${story.imageUrl}`,
        )
      }
      img.src = story.imageUrl
    })
  }, [stories])

  const currentStory = stories[currentIndex]
  const previousStory = previousIndex !== null ? stories[previousIndex] : null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <style>{`
        @keyframes progress-fill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      {/* Header overlay */}
      <div className="absolute top-0 inset-x-0 z-20">
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="text-white font-display text-lg">Lunares</span>
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 px-4 mt-2">
          {stories.map((story, index) => (
            <div key={story.id} className="h-0.5 flex-1 rounded-full bg-white/30">
              {index < currentIndex && <div className="h-full rounded-full bg-white w-full" />}
              {index === currentIndex && (
                <div
                  key={currentIndex}
                  className="h-full rounded-full bg-white"
                  style={{
                    animation: 'progress-fill 4s linear forwards',
                    animationPlayState: isPaused ? 'paused' : 'running',
                  }}
                />
              )}
              {/* Segments after currentIndex remain empty (no inner div) */}
            </div>
          ))}
        </div>
      </div>

      {/* Crossfade image layers — two stacked layers with bg-black always underneath */}
      {/* Bottom layer: shows the previous image during transition, fades out */}
      {previousStory && isTransitioning && (
        <img
          src={previousStory.imageUrl}
          alt={`Historia de ${previousStory.authorName}`}
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      {/* Top layer: current image, fades in during transition */}
      {currentStory && (
        <img
          key={currentStory.id}
          src={currentStory.imageUrl}
          alt={`Historia de ${currentStory.authorName}`}
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ease-in-out"
          style={{ opacity: isTransitioning ? 0 : 1 }}
        />
      )}

      {/* Author overlay */}
      {currentStory && (
        <span className="absolute bottom-6 left-4 text-xs text-white/70 z-10">
          {currentStory.authorName}
        </span>
      )}

      {/* Tap zones — above image (z-10) but below header (z-20) */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 z-10"
        onClick={handleTapLeft}
        aria-label="Historia anterior"
        role="button"
      />
      <div
        className="absolute inset-y-0 right-0 w-1/2 z-10"
        onClick={handleTapRight}
        aria-label="Siguiente historia"
        role="button"
      />
    </div>
  )
}
