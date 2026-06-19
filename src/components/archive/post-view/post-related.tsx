import { ArchivePostCard } from '@/components/archive/archive-post-card'
import type { ArchivePostData } from '@/components/archive/archive-post-card'

type PostRelatedProps = {
  posts: ArchivePostData[]
}

export function PostRelated({ posts }: PostRelatedProps) {
  if (!posts.length) return null

  return (
    <section className="mt-20 lg:mt-40">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Elsewhere in the archive
      </p>

      <div className="mt-6 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <ArchivePostCard index={index} key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
