import type { Post, ArchiveBlock as ArchiveBlockProps } from '@/payload-types'

import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'
import { getPayloadRequest } from '@/utilities/getPayloadRequest'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = async (props) => {
  const { id, categories, introContent, limit: limitFromProps, populateBy, selectedDocs } = props

  const limit = limitFromProps || 3

  let posts: Post[] = []

  if (populateBy === 'collection') {
    const { payload, req } = await getPayloadRequest()

    const flattenedCategories = categories?.map((category) => {
      if (typeof category === 'object') return category.id
      else return category
    })

    const fetchedPosts = await payload.find({
      collection: 'posts',
      depth: 1,
      limit,
      overrideAccess: false,
      req,
      ...(flattenedCategories && flattenedCategories.length > 0
        ? {
            where: {
              categories: {
                in: flattenedCategories,
              },
            },
          }
        : {}),
    })

    posts = fetchedPosts.docs
  } else if (selectedDocs?.length) {
    const { payload, req } = await getPayloadRequest()

    const ids = selectedDocs
      .map((post) => (typeof post.value === 'object' ? post.value?.id : post.value))
      .filter((postId): postId is number => typeof postId === 'number')

    if (ids.length > 0) {
      const fetchedPosts = await payload.find({
        collection: 'posts',
        depth: 1,
        limit: ids.length,
        overrideAccess: false,
        pagination: false,
        req,
        where: {
          id: {
            in: ids,
          },
        },
      })

      const postsById = new Map(fetchedPosts.docs.map((post) => [post.id, post]))
      posts = ids
        .map((postId) => postsById.get(postId))
        .filter((post): post is Post => Boolean(post))
    }
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={posts} />
    </div>
  )
}
