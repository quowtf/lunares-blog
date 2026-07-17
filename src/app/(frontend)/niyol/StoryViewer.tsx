'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface ViewerStory {
  id: number
  imageUrl: string
  authorName: string
  caption?: string
}

interface StoryViewerProps {
  stories: ViewerStory[]
}

interface StoryMetrics {
  views: number
  taps: number
  visible: number
  skips: number
}

const TIMER_DURATION = 4000
const VIEW_THRESHOLD = 2000

export function StoryViewer({ stories }: StoryViewerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)

  // Crossfade state
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)

  // Timer refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elapsedRef = useRef<number>(0)
  const startTimeRef = useRef<number>(Date.now())
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Telemetry refs
  const metricsRef = useRef<Map<number, StoryMetrics>>(new Map())
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const viewedSetRef = useRef<Set<number>>(new Set())
  const storyVisibleStartRef = useRef<number>(Date.now())
  const telemetrySentRef = useRef<boolean>(false)

  // Initialize metrics for all stories
  useEffect(() => {
    for (const story of stories) {
      if (!metricsRef.current.has(story.id)) {
        metricsRef.current.set(story.id, { views: 0, taps: 0, visible: 0, skips: 0 })
      }
    }
  }, [stories])

  // Send telemetry batch
  const sendTelemetry = useCallback(() => {
    if (telemetrySentRef.current) return
    // Flush current story visible time
    const currentStory = stories[currentIndex]
    if (currentStory) {
      const metrics = metricsRef.current.get(currentStory.id)
      if (metrics) {
        metrics.visible += Date.now() - storyVisibleStartRef.current
      }
    }

    const payload: { id: number; views: number; taps: number; visible: number; skips: number }[] =
      []
    for (const [id, m] of metricsRef.current) {
      if (m.views > 0 || m.taps > 0 || m.visible > 0 || m.skips > 0) {
        payload.push({ id, views: m.views, taps: m.taps, visible: m.visible, skips: m.skips })
      }
    }

    if (payload.length === 0) return

    const body = JSON.stringify({ metrics: payload })
    const sent = navigator.sendBeacon('/api/stories/telemetry', new Blob([body], { type: 'application/json' }))

    if (!sent) {
      // Fallback: fire-and-forget fetch
      fetch('/api/stories/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }

    telemetrySentRef.current = true
  }, [stories, currentIndex])

  // Track when a story becomes visible (start view timer + visible clock)
  const startViewTracking = useCallback(
    (index: number) => {
      const story = stories[index]
      if (!story) return

      storyVisibleStartRef.current = Date.now()

      // Start 2s view timer (only if not already viewed)
      if (!viewedSetRef.current.has(story.id)) {
        if (viewTimerRef.current) clearTimeout(viewTimerRef.current)
        viewTimerRef.current = setTimeout(() => {
          viewedSetRef.current.add(story.id)
          const metrics = metricsRef.current.get(story.id)
          if (metrics) metrics.views += 1
        }, VIEW_THRESHOLD)
      }
    },
    [stories],
  )

  // Stop tracking when leaving a story
  const stopViewTracking = useCallback(
    (index: number, wasSkip: boolean) => {
      const story = stories[index]
      if (!story) return

      // Accumulate visible time
      const metrics = metricsRef.current.get(story.id)
      if (metrics) {
        metrics.visible += Date.now() - storyVisibleStartRef.current
      }

      // Cancel view timer if still running
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current)
        viewTimerRef.current = null
      }

      // Count skip if left before 2s and not already viewed
      if (wasSkip && !viewedSetRef.current.has(story.id) && metrics) {
        metrics.skips += 1
      }
    },
    [stories],
  )

  const handleClose = () => {
    sendTelemetry()
    router.push('/')
  }

  // Trigger crossfade transition
  const changeStory = useCallback(
    (nextIndex: number) => {
      setPreviousIndex(currentIndex)
      setIsTransitioning(true)
      setCurrentIndex(nextIndex)
    },
    [currentIndex],
  )

  // Crossfade effect
  useEffect(() => {
    if (isTransitioning) {
      const frameId = requestAnimationFrame(() => {
        setIsTransitioning(false)
      })

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      transitionTimeoutRef.current = setTimeout(() => {
        setPreviousIndex(null)
      }, 300)

      return () => cancelAnimationFrame(frameId)
    }
  }, [isTransitioning])

  // Advance to next story or close
  const advanceStory = useCallback(() => {
    const elapsed = Date.now() - storyVisibleStartRef.current
    const wasSkip = elapsed < VIEW_THRESHOLD

    stopViewTracking(currentIndex, wasSkip)

    if (currentIndex >= stories.length - 1) {
      sendTelemetry()
      router.push('/')
    } else {
      setPreviousIndex(currentIndex)
      setIsTransitioning(true)
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, stories.length, router, stopViewTracking, sendTelemetry])

  // Start story auto-advance timer
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

  const resetTimer = useCallback(() => {
    elapsedRef.current = 0
    setIsPaused(false)
    startTimer(TIMER_DURATION)
  }, [startTimer])

  // Tap right: advance (may be skip)
  const handleTapRight = useCallback(() => {
    const elapsed = Date.now() - storyVisibleStartRef.current
    const wasSkip = elapsed < VIEW_THRESHOLD

    stopViewTracking(currentIndex, wasSkip)

    if (currentIndex >= stories.length - 1) {
      sendTelemetry()
      router.push('/')
    } else {
      changeStory(currentIndex + 1)
      resetTimer()
    }
  }, [currentIndex, stories.length, router, resetTimer, changeStory, stopViewTracking, sendTelemetry])

  // Tap left: go back (counts as tap on target story)
  const handleTapLeft = useCallback(() => {
    if (currentIndex > 0) {
      const elapsed = Date.now() - storyVisibleStartRef.current
      const wasSkip = elapsed < VIEW_THRESHOLD
      stopViewTracking(currentIndex, wasSkip)

      const targetStory = stories[currentIndex - 1]
      if (targetStory) {
        const metrics = metricsRef.current.get(targetStory.id)
        if (metrics) metrics.taps += 1
      }

      changeStory(currentIndex - 1)
      resetTimer()
    }
  }, [currentIndex, stories, resetTimer, changeStory, stopViewTracking])

  // Visibility change: pause/resume + send telemetry on hidden
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      elapsedRef.current = Date.now() - startTimeRef.current + elapsedRef.current
      setIsPaused(true)

      // Pause view timer
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current)
        viewTimerRef.current = null
      }

      // Flush visible time for current story
      const story = stories[currentIndex]
      if (story) {
        const metrics = metricsRef.current.get(story.id)
        if (metrics) {
          metrics.visible += Date.now() - storyVisibleStartRef.current
        }
      }

      sendTelemetry()
    } else {
      // Resume
      const remaining = TIMER_DURATION - elapsedRef.current
      setIsPaused(false)
      startTimer(Math.max(remaining, 0))

      // Reset telemetry sent flag so next hidden event can send again
      telemetrySentRef.current = false

      // Reset visible start and restart view timer
      storyVisibleStartRef.current = Date.now()
      const story = stories[currentIndex]
      if (story && !viewedSetRef.current.has(story.id)) {
        viewTimerRef.current = setTimeout(() => {
          viewedSetRef.current.add(story.id)
          const metrics = metricsRef.current.get(story.id)
          if (metrics) metrics.views += 1
        }, VIEW_THRESHOLD)
      }
    }
  }, [startTimer, stories, currentIndex, sendTelemetry])

  // Start view tracking on story change
  useEffect(() => {
    startViewTracking(currentIndex)
    resetTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  // Visibility change listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current)
    }
  }, [])

  // Image preloading
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
            </div>
          ))}
        </div>
      </div>

      {/* Crossfade image layers */}
      {previousStory && isTransitioning && (
        <img
          src={previousStory.imageUrl}
          alt={`Historia de ${previousStory.authorName}`}
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

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
        <div className="absolute bottom-6 left-4 right-4 z-10">
          <span className="text-xs text-white/70">{currentStory.authorName}</span>
          {currentStory.caption && (
            <p className="mt-1 text-sm text-white font-medium drop-shadow-md">
              {currentStory.caption}
            </p>
          )}
        </div>
      )}

      {/* Tap zones */}
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
