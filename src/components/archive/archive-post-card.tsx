import Link from 'next/link'

import type { Post } from '@/payload-types'

import { GalleryCard } from '@/components/archive/cards/gallery-card'
import { ImageCard } from '@/components/archive/cards/image-card'
import { SlidesCard } from '@/components/archive/cards/slides-card'
import { ThoughtQuoteCard } from '@/components/archive/cards/thought-quote-card'
import { Media } from '@/components/Media'
import {
  archivePostSelect,
  formatArchiveDate,
  getPostExcerpt,
  mapPostToGalleryItem,
  mapPostToImageItem,
  mapPostToSlidesItem,
  type GalleryPostData,
  type ImagePostData,
} from '@/utilities/archive'
import { getVariantByIndex } from '@/components/archive/ui/card/card-variants'
import { cn } from '@/utilities/ui'

export type ArchivePostData = Pick<Post, keyof typeof archivePostSelect>

type ArchivePostCardProps = {
  post: ArchivePostData
  index?: number
  priority?: boolean
}

function isPostType(post: ArchivePostData): boolean {
  return post.PostType === 'post' || post.PostType == null
}

function getPostHref(slug: string): string {
  return `/${slug}`
}

function getCategoryLabel(post: ArchivePostData): string {
  const category = post.categories?.find(
    (item): item is Extract<typeof item, { title?: string | null }> =>
      typeof item === 'object' && item !== null,
  )

  if (category?.title) return category.title
  if (post.PostType) return post.PostType.charAt(0).toUpperCase() + post.PostType.slice(1)

  return 'Post'
}

function getReadingTime(text: string): string | null {
  if (!text) return null

  const words = text.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))

  return `${minutes} min read`
}

function canRenderGallery(
  post: ArchivePostData,
): post is GalleryPostData & ArchivePostData {
  return (
    post.PostType === 'gallery' &&
    post.id != null &&
    Boolean(post.publishedAt ?? post.createdAt)
  )
}

function canRenderSlides(post: ArchivePostData): post is GalleryPostData & ArchivePostData {
  return (
    post.PostType === 'slides' &&
    post.id != null &&
    Boolean(post.publishedAt ?? post.createdAt)
  )
}

function canRenderImageCard(
  post: ArchivePostData,
): post is ImagePostData & ArchivePostData {
  return (
    post.PostType === 'image' &&
    post.id != null &&
    Boolean(post.publishedAt ?? post.createdAt)
  )
}

function canRenderThoughtQuote(post: ArchivePostData): boolean {
  return (
    (post.PostType === 'thought' || post.PostType === 'quote') &&
    post.id != null &&
    Boolean(post.publishedAt ?? post.createdAt)
  )
}

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

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 12h16m0 0-6-6m6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function DefaultPostCard({
  post,
  index = 0,
  priority = false,
}: ArchivePostCardProps) {
  const isPost = isPostType(post)
  const href = getPostHref(post.slug)
  const image = post.heroImage ?? post.meta?.image
  const label = getCategoryLabel(post)
  const date = formatArchiveDate(post.publishedAt ?? post.createdAt)
  const excerpt = getPostExcerpt(post)
  const readingTime = getReadingTime(excerpt)
  const variant = getVariantByIndex(index)

  const variantClasses = {
    default: 'bg-white',
    muted: 'bg-[#F0F0F0]',
    sepia: 'bg-[#F6F2ED]',
  } as const

  const heroImage =
    image && typeof image === 'object' ? (
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-200 via-stone-100 to-stone-300">
        <Media
          fill
          imgClassName="object-cover"
          pictureClassName="relative block aspect-[4/3] w-full"
          priority={priority}
          resource={image}
          size="(min-width: 1024px) 320px, 100vw"
        />
      </div>
    ) : null

  return (
    <article
      className={cn(
        'overflow-hidden rounded-card border border-[#F5F4F2]',
        variantClasses[variant],
      )}
    >
      {heroImage ? (
        isPost ? (
          <Link aria-label={post.title} className="block" href={href}>
            {heroImage}
          </Link>
        ) : (
          heroImage
        )
      ) : null}

      <div className="flex min-h-72 flex-col justify-between gap-8 p-5">
        <header className="flex items-start justify-between gap-6">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-stone-500">
            {label}
          </p>
          <BookmarkIcon
            className={cn('h-4 w-4 shrink-0', priority ? 'text-stone-900' : 'text-stone-400')}
          />
        </header>

        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="max-w-72 font-serif text-2xl leading-[1.05] tracking-tight text-stone-950">
              {isPost ? (
                <Link className="transition hover:text-stone-500" href={href}>
                  {post.title}
                </Link>
              ) : (
                post.title
              )}
            </h2>
            <p className="text-xs leading-5 text-stone-500">
              {date}
              {readingTime ? (
                <>
                  &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                  {readingTime}
                </>
              ) : null}
            </p>
          </div>

          {excerpt ? <p className="max-w-72 text-sm leading-6 text-stone-600">{excerpt}</p> : null}
        </div>

        {isPost ? (
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm text-stone-800 transition hover:text-stone-500"
            href={href}
          >
            Leer post
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export function ArchivePostCard({ post, index = 0, priority = false }: ArchivePostCardProps) {
  if (canRenderGallery(post)) {
    const item = mapPostToGalleryItem(post, { index })
    if (item) return <GalleryCard item={item} priority={priority} />
  }

  if (canRenderSlides(post)) {
    const item = mapPostToSlidesItem(post, { index })
    if (item) return <SlidesCard item={item} priority={priority} />
  }

  if (canRenderImageCard(post)) {
    const item = mapPostToImageItem(post, { index })
    if (item) return <ImageCard item={item} priority={priority} />
  }

  if (canRenderThoughtQuote(post)) {
    const body = getPostExcerpt(post)
    if (body) {
      return (
        <ThoughtQuoteCard
          body={body}
          date={formatArchiveDate(post.publishedAt ?? post.createdAt)}
          index={index}
          label={getCategoryLabel(post)}
          priority={priority}
          title={post.title}
        />
      )
    }
  }

  return <DefaultPostCard index={index} post={post} priority={priority} />
}
