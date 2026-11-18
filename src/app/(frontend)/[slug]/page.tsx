import type { Metadata } from 'next'

import { PostView } from '@/components/archive/post-view'
import { CommentLayout } from '@/components/comments'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { homeStatic } from '@/endpoints/seed/home-static'
import { generateMeta } from '@/utilities/generateMeta'
import { getAdjacentPosts } from '@/utilities/archive'
import { getPayloadRequest } from '@/utilities/getPayloadRequest'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'

import type { Post } from '@/payload-types'

import PageClient from './page.client'

// Post visibility depends on the visitor's session and the current month, so
// this route must never be served from a shared static cache.
export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

function isEditorialPost(post: Post): boolean {
  return post.PostType === 'post' || post.PostType == null
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug

  const [page, post] = await Promise.all([
    queryPageBySlug({ slug: decodedSlug }),
    queryPostBySlug({ slug: decodedSlug }),
  ])

  if (page) {
    return (
      <article className="pt-16 pb-24">
        <PageClient theme="light" />
        <PayloadRedirects disableNotFound url={url} />
        {draft && <LivePreviewListener />}
        <RenderHero {...page.hero} />
        <RenderBlocks blocks={page.layout} />
      </article>
    )
  }

  if (post && isEditorialPost(post)) {
    const adjacent = await getAdjacentPosts(post.slug)

    return (
      <CommentLayout>
        <PageClient theme="light" />
        <PayloadRedirects disableNotFound url={url} />
        {draft && <LivePreviewListener />}
        <PostView adjacent={adjacent} post={post} />
      </CommentLayout>
    )
  }

  if (slug === 'home') {
    const fallbackPage = homeStatic
    return (
      <article className="pt-16 pb-24">
        <PageClient theme="light" />
        <PayloadRedirects disableNotFound url={url} />
        {draft && <LivePreviewListener />}
        <RenderHero {...fallbackPage.hero} />
        <RenderBlocks blocks={fallbackPage.layout} />
      </article>
    )
  }

  return <PayloadRedirects url={url} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)

  const page = await queryPageBySlug({ slug: decodedSlug })
  if (page) return generateMeta({ doc: page })

  const post = await queryPostBySlug({ slug: decodedSlug })
  if (post) return generateMeta({ doc: post })

  return {
    title: 'Inmanent Archive',
  }
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const { payload, req } = await getPayloadRequest()

  const result = await payload.find({
    collection: 'posts',
    depth: 2,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    req,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return (result.docs?.[0] as Post | undefined) || null
})
