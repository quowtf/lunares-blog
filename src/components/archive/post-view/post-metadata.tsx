import Link from 'next/link'

import { formatPostMetaDate } from '@/utilities/archive'
import type { Post } from '@/payload-types'

type PostMetadataProps = {
  post: Post
}

export function PostMetadata({ post }: PostMetadataProps) {
  const publishedDate = formatPostMetaDate(post.publishedAt ?? post.createdAt)

  return (
    <section className="mt-20 border-t border-border pt-8 lg:mt-40 lg:pt-10">
      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Published
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{publishedDate}</p>
      </div>
    </section>
  )
}

export function PostNavigation({
  next,
  prev,
}: {
  prev: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
}) {
  if (!prev && !next) return null

  return (
    <nav
      aria-label="Post navigation"
      className="mt-20 border-t border-border pt-10 lg:mt-40 lg:pt-16"
    >
      <div className="grid gap-10 sm:grid-cols-2 sm:gap-12">
        {prev ? (
          <Link className="group space-y-2 sm:space-y-3" href={`/${prev.slug}`}>
            <p className="text-xs text-muted-foreground transition group-hover:text-foreground">
              &larr; Previous
            </p>
            <p className="font-display text-xl leading-tight text-foreground transition group-hover:text-muted-foreground sm:text-2xl">
              {prev.title}
            </p>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            className="group space-y-2 text-left sm:col-start-2 sm:space-y-3 sm:text-right"
            href={`/${next.slug}`}
          >
            <p className="text-xs text-muted-foreground transition group-hover:text-foreground">
              Next &rarr;
            </p>
            <p className="font-display text-xl leading-tight text-foreground transition group-hover:text-muted-foreground sm:text-2xl">
              {next.title}
            </p>
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
