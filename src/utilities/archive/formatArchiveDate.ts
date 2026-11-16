import { ARCHIVE_TIME_ZONE } from './archiveWindow'

export function formatArchiveDate(date: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    timeZone: ARCHIVE_TIME_ZONE,
    year: 'numeric',
  }).format(new Date(date))
}
