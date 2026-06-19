import type { Post } from '@/payload-types'

import type { ArchivePostData } from '@/components/archive/archive-post-card'
import {
  formatPostMetaDate,
  getPostCategoryLabel,
  getPostPlainText,
  getReadingTime,
} from '@/utilities/archive'

import { PostHeroImage } from './post-hero-image'
import { PostHeader } from './post-header'
import { PostMetadata, PostNavigation } from './post-metadata'
import { PostReadingProgress } from './post-reading-progress'
import { PostRelated } from './post-related'
import { PostRichText } from './post-rich-text'
import { PostSiteFooter } from './post-site-footer'

type PostViewProps = {
  adjacent: {
    prev: { slug: string; title: string } | null
    next: { slug: string; title: string } | null
  }
  post: Post
  related: ArchivePostData[]
}

function isPostType(post: Post): boolean {
  return post.PostType === 'post' || post.PostType == null
}

export function PostView({ adjacent, post, related }: PostViewProps) {
  if (!isPostType(post)) return null

  const plainText = getPostPlainText(post.content)
  const readingTime = getReadingTime(plainText) ?? '1 min'
  const date = formatPostMetaDate(post.publishedAt ?? post.createdAt)
  const categoryLabel = getPostCategoryLabel(post)
  const description = post.meta?.description?.trim()
  const heroImage = post.heroImage
  const hasHeroImage = heroImage && typeof heroImage === 'object'

  return (
    <>
      <PostHeader />
      <PostReadingProgress date={date} readingTime={readingTime} />

      <article className="min-h-screen bg-stone-50 text-[#262626]">
        <div className="mx-auto max-w-[1600px] px-4 pb-12 pt-24 sm:px-6 sm:pt-28 lg:pl-[140px] lg:pr-10 lg:pb-8 lg:pt-[120px]">
          <div className="w-full max-w-[720px]">
            <header className="space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-stone-500 sm:gap-x-4 sm:text-xs">
                <span>Post</span>
                <span aria-hidden="true">&middot;</span>
                <time dateTime={post.publishedAt ?? post.createdAt}>{date}</time>
                {categoryLabel ? (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span>{categoryLabel}</span>
                  </>
                ) : null}
              </div>

              <h1 className="font-display max-w-[760px] text-[clamp(2.25rem,8vw,5.5rem)] font-light leading-[0.95] tracking-tight text-stone-950">
                {post.title}
              </h1>

              {description ? (
                <p className="max-w-[600px] text-lg leading-relaxed text-stone-700 sm:text-xl lg:text-2xl lg:leading-snug">
                  {description}
                </p>
              ) : null}
            </header>

            {hasHeroImage ? (
              <div className="mt-10 sm:mt-16 lg:mt-20">
                <PostHeroImage image={heroImage} />
              </div>
            ) : null}

            <div className={hasHeroImage ? 'mt-16 sm:mt-20 lg:mt-[120px]' : 'mt-10 sm:mt-16 lg:mt-20'}>
              <PostRichText data={post.content} />
            </div>

            <PostMetadata post={post} />
            <PostNavigation next={adjacent.next} prev={adjacent.prev} />
            <PostRelated posts={related} />
            <PostSiteFooter />
          </div>
        </div>
      </article>
    </>
  )
}
