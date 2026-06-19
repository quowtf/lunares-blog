import type { Metadata } from 'next'

import { ArchiveHero, ArchivePostCard, Masonry, MonthDivider } from '@/components/archive'
import { CommentLayout } from '@/components/comments'
import { archivePostSelect, groupPostsByMonthWithIndex } from '@/utilities/archive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function HomePage() {
  const posts = await queryPosts()
  const monthGroups = groupPostsByMonthWithIndex(posts)

  return (
    <CommentLayout>
      <main className="min-h-screen bg-stone-50 px-4 py-12 text-stone-950 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <ArchiveHero />

          {monthGroups.length > 0 ? (
            monthGroups.map((group) => (
              <section className="space-y-6" key={group.monthKey}>
                <MonthDivider>{group.month}</MonthDivider>

                <Masonry>
                  {group.items.map(({ post, index }) => (
                    <div className="mb-4 break-inside-avoid" key={post.id}>
                      <ArchivePostCard post={post} index={index} priority={index < 2} />
                    </div>
                  ))}
                </Masonry>
              </section>
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </CommentLayout>
  )
}

async function queryPosts() {
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: false,
    limit: 24,
    overrideAccess: false,
    sort: '-publishedAt',
    select: archivePostSelect,
  })

  return posts.docs
}

function EmptyState() {
  return (
    <section className="rounded-[0.5rem] border border-dashed border-stone-300 bg-white/70 p-8">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-stone-500">
        Sin entradas
      </p>
      <h2 className="mt-3 font-serif text-3xl tracking-tight text-stone-950">
        Todavia no hay publicaciones.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
        Vuelve pronto para descubrir nuevas historias y momentos.
      </p>
    </section>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Lunares',
    description: 'A collection of thoughts, photographs, stories and moments.',
  }
}
