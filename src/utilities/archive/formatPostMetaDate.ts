import { ARCHIVE_TIME_ZONE } from './archiveWindow'

export function formatPostMetaDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: ARCHIVE_TIME_ZONE,
    year: 'numeric',
  })
    .format(new Date(date))
    .toUpperCase()
}
