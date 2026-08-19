'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ArchiveTitleLink() {
  const pathname = usePathname()
  const href = pathname === '/momentos' ? '/' : '/momentos'

  return (
    <Link href={href} className="hover:opacity-80 transition-opacity">
      Lunares
    </Link>
  )
}
