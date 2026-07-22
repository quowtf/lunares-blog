import type { CollectionAfterChangeHook } from 'payload'

import { sendTelegramMessage } from '@/utilities/telegram'

export const notifyComment: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  const { payload } = req

  // Resolve user and post names for the message
  let userName = 'Desconocido'
  let userEmail = ''
  let postTitle = 'Sin título'

  try {
    if (doc.user) {
      const user = await payload.findByID({ collection: 'users', id: doc.user })
      userName = user.name || userName
      userEmail = user.email || ''
    }

    if (doc.post) {
      const post = await payload.findByID({ collection: 'posts', id: doc.post })
      postTitle = post.title || postTitle
    }
  } catch {
    // If lookup fails, send with whatever info we have
  }

  const message = [
    '💬 *Nuevo comentario en Lunares*',
    '',
    `Usuario: ${userName}${userEmail ? ` (${userEmail})` : ''}`,
    `Post: "${postTitle}"`,
    `Comentario: "${doc.text}"`,
  ].join('\n')

  await sendTelegramMessage(message)

  return doc
}
