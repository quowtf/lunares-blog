import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

/**
 * Private stories must store their image in the private-media collection.
 * The public `image` field is never valid for private stories.
 */
export const enforcePrivateStoryImage: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
}) => {
  const nextVisibility = data.visibility ?? originalDoc?.visibility ?? 'public'
  if (nextVisibility !== 'private') return data

  const nextPrivateImage =
    data.privateImage !== undefined ? data.privateImage : originalDoc?.privateImage

  if (!nextPrivateImage) {
    throw new APIError(
      'Las historias privadas requieren una imagen en privateImage (colección private-media).',
      400,
    )
  }

  return data
}
