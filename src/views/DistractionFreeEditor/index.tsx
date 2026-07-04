import type { AdminViewServerProps } from 'payload'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { redirect } from 'next/navigation'

import { DistractionFreeEditor } from './Editor.client'

export function DistractionFreeView({ initPageResult, params }: AdminViewServerProps) {
  const {
    req: { user, payload },
  } = initPageResult

  if (!user) {
    redirect('/admin/login')
  }

  if (user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <p style={{ textAlign: 'center', fontSize: '1.125rem', color: '#6b7280' }}>
          Esta vista requiere permisos de administrador
        </p>
      </div>
    )
  }

  // Extract post ID from route params (segments array from Payload custom views)
  // Route: /new/post/:id → segments = ['new', 'post', '16']
  const segments = params?.segments as string[] | undefined
  const postId = segments && segments.length === 3 ? segments[2] : null

  if (postId) {
    // Editing existing post — fetch it server-side
    return <EditExistingPost postId={postId} userId={String(user.id)} payload={payload} />
  }

  return <DistractionFreeEditor userId={String(user.id)} />
}

async function EditExistingPost({
  postId,
  userId,
  payload,
}: {
  postId: string
  userId: string
  payload: AdminViewServerProps['initPageResult']['req']['payload']
}) {
  let initialData: {
    id: string
    title: string
    content: SerializedEditorState | null
    PostType: string | null
    categories: Array<{ id: number; title: string }> | null
  } | null = null

  try {
    const post = await payload.findByID({
      collection: 'posts',
      id: Number(postId),
      draft: true,
    })

    if (post) {
      initialData = {
        id: String(post.id),
        title: (post.title as string) || '',
        content: (post.content as SerializedEditorState) || null,
        PostType: (post.PostType as string) || null,
        categories: post.categories
          ? (post.categories as Array<{ id: number; title: string }>)
          : null,
      }
    }
  } catch {
    // Post not found — fall through to new post mode
  }

  if (!initialData) {
    return (
      <div style={{ display: 'flex', minHeight: '50vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <p style={{ textAlign: 'center', fontSize: '1rem', color: '#6b7280' }}>
          Post no encontrado (ID: {postId})
        </p>
      </div>
    )
  }

  return (
    <DistractionFreeEditor
      userId={userId}
      existingPost={initialData}
    />
  )
}
