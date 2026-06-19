export type BlobStoreAccess = 'private' | 'public'

export function getBlobStoreAccess(): BlobStoreAccess {
  return process.env.BLOB_STORE_ACCESS === 'private' ? 'private' : 'public'
}

export function getBlobReadWriteToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN
}
