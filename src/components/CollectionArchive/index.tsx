import { cn } from '@/utilities/ui'
import React from 'react'

import type { Post } from '@/payload-types'

import { ImageCard } from '@/components/archive'
import { Card, CardPostData } from '@/components/Card'
import { mapPostToImageItem, type ImagePostData } from '@/utilities/archive'

export type ArchivePostData = CardPostData &
  Partial<Pick<Post, 'id' | 'heroImage' | 'PostType' | 'publishedAt' | 'createdAt'>>

export type Props = {
  posts: ArchivePostData[]
}

function canRenderImageCard(post: ArchivePostData): post is ImagePostData & ArchivePostData {
  return (
    post.PostType === 'image' &&
    post.id != null &&
    Boolean(post.publishedAt ?? post.createdAt)
  )
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8 xl:gap-x-8">
          {posts?.map((post, index) => {
            if (typeof post !== 'object' || post === null) return null

            const imageItem = canRenderImageCard(post)
              ? mapPostToImageItem(post as ImagePostData, { index })
              : null

            return (
              <div className="col-span-4" key={post.id ?? index}>
                {imageItem ? (
                  <ImageCard item={imageItem} priority={index < 2} />
                ) : (
                  <Card className="h-full" doc={post} relationTo="posts" showCategories />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
