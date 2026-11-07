import type { CollectionBeforeOperationHook } from 'payload'

export const filterActiveStories: CollectionBeforeOperationHook = ({
  args,
  context,
  operation,
}) => {
  // Payload runs `beforeOperation` for both find and findByID with the
  // deprecated `read` operation. `findByID` has an `id` and no `where`, so it
  // cannot be filtered here; its callers validate expiry manually.
  const isRead = operation === 'read' || operation === 'find'
  const isFindByID = isRead && 'id' in args && args.id !== undefined
  if ((!isRead || isFindByID) && operation !== 'count') {
    return args
  }

  // Allow the cleanup job (or other system processes) to bypass the expiration filter
  if (context?.skipExpirationFilter === true) {
    return args
  }

  const expiresAtFilter = {
    expiresAt: {
      greater_than: new Date(),
    },
  }

  // findByID is already excluded above, so `args` has a `where` here even
  // though the hook's discriminated union does not narrow automatically.
  const queryArgs = args as { where?: Record<string, unknown> }

  if (queryArgs.where && Object.keys(queryArgs.where).length > 0) {
    queryArgs.where = {
      and: [queryArgs.where, expiresAtFilter],
    }
  } else {
    queryArgs.where = expiresAtFilter
  }

  return queryArgs as typeof args
}
