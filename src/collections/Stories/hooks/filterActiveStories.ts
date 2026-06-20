import type { CollectionBeforeOperationHook } from 'payload'

export const filterActiveStories: CollectionBeforeOperationHook = ({
  args,
  context,
  operation,
}) => {
  if (operation !== 'find') {
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

  if (args.where && Object.keys(args.where).length > 0) {
    args.where = {
      and: [args.where, expiresAtFilter],
    }
  } else {
    args.where = expiresAtFilter
  }

  return args
}
