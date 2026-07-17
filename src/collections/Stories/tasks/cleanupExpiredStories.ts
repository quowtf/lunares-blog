import type { TaskHandler } from 'payload'

/**
 * Cleanup job task handler that removes expired stories.
 *
 * 1. Find all expired stories
 * 2. Delete stories (bulk)
 * 3. Delete related media (bulk) - blob is deleted automatically by vercelBlobStorage plugin
 * 4. Send Telegram notification
 */
export const cleanupExpiredStories: TaskHandler<{
  input: object
  output: { success: boolean }
}> = async ({ req }) => {
  const payload = req.payload
  const logger = payload.logger

  // Find all expired stories with image relationship
  const result = await payload.find({
    collection: 'stories',
    where: {
      expiresAt: {
        less_than_equal: new Date().toISOString(),
      },
    },
    sort: 'expiresAt',
    limit: 0,
    depth: 1,
    overrideAccess: true,
    context: { skipExpirationFilter: true },
  })

  if (result.docs.length === 0) {
    logger.info('[Cleanup] No expired stories to process')
    return { output: { success: true } }
  }

  // Extract IDs
  const storyIds = result.docs.map(d => d.id)
  const mediaIds = result.docs
    .filter(d => d.image && typeof d.image === 'object' && 'id' in d.image)
    .map(d => (d.image as { id: string | number }).id)

  let errors: string[] = []

  // Delete stories (bulk)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload.delete as any)({
      collection: 'stories',
      ids: storyIds,
      overrideAccess: true,
    })
  } catch (err) {
    const msg = `Failed to delete stories: ${err}`
    logger.error({ err, msg: '[Cleanup] ' + msg })
    errors.push(msg)
  }

  // Delete media (bulk) - blob is deleted automatically by vercelBlobStorage plugin
  if (mediaIds.length > 0) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload.delete as any)({
        collection: 'media',
        ids: mediaIds,
        overrideAccess: true,
      })
    } catch (err) {
      const msg = `Failed to delete media: ${err}`
      logger.error({ err, msg: '[Cleanup] ' + msg })
      errors.push(msg)
    }
  }

  // Log summary
  logger.info({
    deleted: storyIds.length,
    errors: errors.length,
    msg: '[Cleanup] Completed cleanup of expired stories',
  })

  // Send Telegram notification
  await sendTelegramNotification(storyIds.length, errors)

  return { output: { success: true } }
}

async function sendTelegramNotification(deleted: number, errors: string[]) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return // Telegram not configured
  }

  let message = `*Cleanup Stories Finished:*\n- Deleted: ${deleted} Stories`

  if (errors.length > 0) {
    message += `\n- Errors:`
    for (const error of errors) {
      message += `\n  - ${error}`
    }
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    })
  } catch (err) {
    console.error('[Cleanup] Failed to send Telegram notification:', err)
  }
}
