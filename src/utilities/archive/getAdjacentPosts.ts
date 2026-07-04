import configPromise from '@payload-config'
import { getPayload } from 'payload'

type AdjacentPost = {
  slug: string
  title: string
}

export async function getAdjacentPosts(currentSlug: string): Promise<{
  prev: AdjacentPost | null
  next: AdjacentPost | null
}> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    select: {
      slug: true,
      title: true,
      PostType: true,
    },
    where: {
      or: [{ PostType: { equals: 'post' } }, { PostType: { exists: false } }],
    },
  })

  const posts = result.docs.filter((post) => post.slug)
  const index = posts.findIndex((post) => post.slug === currentSlug)

  if (index === -1) {
    return { prev: null, next: null }
  }

  const prev = index < posts.length - 1 ? posts[index + 1] : null
  const next = index > 0 ? posts[index - 1] : null

  return {
    prev: prev ? { slug: prev.slug, title: prev.title || '' } : null,
    next: next ? { slug: next.slug, title: next.title || '' } : null,
  }
}
