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

  // Build telemetry report from docs before they were deleted
  const telemetryLines = result.docs.map((doc) => {
    const caption = doc.caption || ''
    const visible = doc.visible || 0
    const views = doc.views || 0
    const taps = doc.taps || 0
    const skips = doc.skips || 0
    const seconds = (visible / 1000).toFixed(1)
    return `  - ${doc.id} | ${caption} | ${seconds}s | ${views} views | ${taps} taps | ${skips} skips`
  })

  // Send Telegram notification
  await sendTelegramNotification(storyIds.length, errors, telemetryLines)

  return { output: { success: true } }
}

async function sendTelegramNotification(deleted: number, errors: string[], telemetry: string[]) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return // Telegram not configured
  }

  let message = `*Cleanup Stories Finished:*\n- Deleted: ${deleted} Stories`

  if (telemetry.length > 0) {
    message += `\n\n📊 *Telemetry:*\n`
    message += `  ID | Caption | Visible | Views | Taps | Skips\n`
    message += telemetry.join('\n')
  }

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
