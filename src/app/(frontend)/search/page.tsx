import type { Metadata } from 'next/types'

import { ArchiveHero, ArchivePostCard, Masonry, type ArchivePostData } from '@/components/archive'
import { archivePostSelect } from '@/utilities/archive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

type Args = {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'search',
    depth: 1,
    limit: 24,
    select: archivePostSelect,
    pagination: false,
    ...(query
      ? {
          where: {
            or: [
              { title: { like: query } },
              { 'meta.description': { like: query } },
              { 'meta.title': { like: query } },
              { slug: { like: query } },
            ],
          },
        }
      : {}),
  })

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <ArchiveHero />

        <section className="space-y-6">
          <h2 className="font-serif text-lg tracking-tight text-foreground">
            {query ? `Resultados para "${query}"` : 'Buscar'}
          </h2>

          {posts.totalDocs > 0 ? (
            <Masonry>
              {posts.docs.map((post, index) => (
                <div className="mb-4 break-inside-avoid" key={post.id}>
                  <ArchivePostCard
                    post={post as ArchivePostData}
                    index={index}
                    priority={index < 2}
                  />
                </div>
              ))}
            </Masonry>
          ) : (
            <p className="text-sm text-muted-foreground">
              {query
                ? 'No se encontraron resultados.'
                : 'Escribe algo en el buscador para empezar.'}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

export async function generateMetadata({
  searchParams: searchParamsPromise,
}: Args): Promise<Metadata> {
  const { q } = await searchParamsPromise

  return {
    title: q ? `Buscar: ${q}` : 'Buscar',
  }
}
