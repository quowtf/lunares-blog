import type { CollectionAfterChangeHook } from 'payload'

import { sendTelegramMessage } from '@/utilities/telegram'

export const notifyComment: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  // Entire notification is non-critical — never fail the comment creation
  try {
    const { payload } = req

    let userName = 'Desconocido'
    let userEmail = ''
    let postTitle = 'Sin título'

    const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user
    const postId = typeof doc.post === 'object' ? doc.post?.id : doc.post

    if (userId) {
      const user = await payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
        overrideAccess: true,
      })
      userName = user.name || userName
      userEmail = user.email || ''
    }

    if (postId) {
      const post = await payload.findByID({
        collection: 'posts',
        id: postId,
        depth: 0,
        overrideAccess: true,
      })
      postTitle = post.title || postTitle
    }

    const message = [
      '💬 *Nuevo comentario en Lunares*',
      '',
      `Usuario: ${userName}${userEmail ? ` (${userEmail})` : ''}`,
      `Post: "${postTitle}"`,
      `Comentario: "${doc.text}"`,
    ].join('\n')

    await sendTelegramMessage(message)
  } catch (error) {
    console.error('[notifyComment] Notification failed:', error)
  }

  return doc
}
