import type { CollectionAfterChangeHook } from 'payload'

import { sendTelegramMessage } from '@/utilities/telegram'

export const notifyRegistration: CollectionAfterChangeHook = async ({ doc, operation }) => {
  if (operation !== 'create') return doc

  const message = [
    '📬 *Nuevo registro en Lunares*',
    '',
    `Nombre: ${doc.name}`,
    `Email: ${doc.email}`,
    `Rol: ${doc.role}`,
    `Estado: ${doc.status ?? 'pending'} (pendiente de verificación)`,
  ].join('\n')

  await sendTelegramMessage(message)

  return doc
}
