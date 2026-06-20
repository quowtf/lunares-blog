import type { CollectionBeforeChangeHook } from 'payload'

export const setAuthorFromUser: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.user) {
    data.author = req.user.id
  }

  return data
}
