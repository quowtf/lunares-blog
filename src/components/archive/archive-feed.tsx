'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { loadArchivePosts } from '@/actions/load-archive-posts'
import { useAuthUser } from '@/components/auth/use-auth-user'
import { cn } from '@/utilities/ui'
import type { ArchiveCursor } from '@/utilities/archive/archiveCursor'
import { groupPostsByMonthWithIndex } from '@/utilities/archive/groupPostsByMonth'
import { hasValidSession } from '@/utilities/auth/roles'

import { ArchivePostCard, type ArchivePostData } from './archive-post-card'
import { LoginButton } from './hero/login-button'
import { MonthDivider } from './month-divider'
import { Masonry } from './ui/masonry'

type ArchiveFeedProps = {
  initialCursor: ArchiveCursor | null
  initialPosts: ArchivePostData[]
}

export function ArchiveFeed({ initialCursor, initialPosts }: ArchiveFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const loadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const previousCanLoadRef = useRef(false)
  const requestIdRef = useRef(0)
  const canLoadMoreRef = useRef(false)

  const { user, isLoading: isAuthLoading, setUser } = useAuthUser()
  const canLoadMore = hasValidSession(user)
  canLoadMoreRef.current = canLoadMore
  const monthGroups = groupPostsByMonthWithIndex(posts)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !canLoadMore || !hasMore) return

    loadingRef.current = true
    setIsLoading(true)
    setError(false)

    const requestId = ++requestIdRef.current

    try {
      const result = await loadArchivePosts({ cursor })

      if (requestId !== requestIdRef.current || !canLoadMoreRef.current) return

      if (!result.ok) {
        if (result.reason === 'unauthorized') {
          setUser(null)
        } else {
          setError(true)
        }
        return
      }

      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id))
        return [...current, ...result.posts.filter((post) => !seen.has(post.id))]
      })
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch {
      if (requestId === requestIdRef.current) {
        setError(true)
      }
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false
        setIsLoading(false)
      }
    }
  }, [canLoadMore, cursor, hasMore, setUser])

  // Drop already-loaded older posts when the session ends so gated content is
  // not left visible in the DOM after logout.
  useEffect(() => {
    if (!canLoadMore && previousCanLoadRef.current) {
      requestIdRef.current += 1
      loadingRef.current = false
      setIsLoading(false)
      setPosts(initialPosts)
      setCursor(initialCursor)
      setHasMore(true)
      setError(false)
    }

    previousCanLoadRef.current = canLoadMore
  }, [canLoadMore, initialCursor, initialPosts])

  useEffect(() => {
    if (!canLoadMore || isAuthLoading || isLoading || error || !hasMore) return

    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore()
        }
      },
      { rootMargin: '600px 0px' },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [canLoadMore, error, hasMore, isAuthLoading, isLoading, loadMore])

  return (
    <div className="flex flex-col gap-10">
      {monthGroups.length > 0 ? (
        monthGroups.map((group) => (
          <section className="space-y-6" key={group.monthKey}>
            <MonthDivider>{group.month}</MonthDivider>

            <Masonry>
              {group.items.map(({ post, index }) => (
                <ArchivePostCard key={post.id} post={post} index={index} priority={index < 2} />
              ))}
            </Masonry>
          </section>
        ))
      ) : (
        <EmptyState />
      )}

      <div className="rounded-[0.5rem] border border-dashed border-border bg-card/70 p-6">
        {isAuthLoading ? (
          <p className="text-sm text-muted-foreground">Comprobando sesión…</p>
        ) : !canLoadMore ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Archivo completo
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Inicia sesión con una cuenta activa para seguir leyendo publicaciones anteriores.
              </p>
            </div>

            <LoginButton
              className="self-start sm:self-auto"
              label="Iniciar sesión"
              panelAlign="end"
              panelPlacement="top"
              panelTitle="Inicia sesión para continuar"
            />
          </div>
        ) : error ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar más publicaciones.
            </p>

            <button
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-input bg-background px-5 text-sm font-medium text-foreground transition hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => void loadMore()}
              type="button"
            >
              Reintentar
            </button>
          </div>
        ) : hasMore ? (
          <div className="flex flex-col items-center gap-4">
            <button
              className={cn(
                'inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-input bg-background px-5 text-sm font-medium text-foreground transition hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isLoading && 'cursor-wait opacity-60',
              )}
              disabled={isLoading}
              onClick={() => void loadMore()}
              type="button"
            >
              {isLoading ? 'Cargando…' : 'Cargar más'}
            </button>

            <div aria-hidden="true" className="h-px w-full" ref={sentinelRef} />
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            No hay más publicaciones en el archivo.
          </p>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <section className="rounded-[0.5rem] border border-dashed border-border bg-card/70 p-8">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Sin entradas
      </p>
      <h2 className="mt-3 font-serif text-3xl tracking-tight text-foreground">
        Todavia no hay publicaciones.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Vuelve pronto para descubrir nuevas historias y momentos.
      </p>
    </section>
  )
}
