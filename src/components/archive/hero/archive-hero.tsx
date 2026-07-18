import Link from 'next/link'

import { ArchiveSearch } from './archive-search'
import { NewEntryButtonAuth } from './new-entry-button-auth'
import { SiteNav } from './site-nav'

export function ArchiveHero() {
  return (
    <header className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
      <div className="space-y-4">
        <h1 className="font-serif text-6xl leading-none tracking-[0.12em] text-foreground sm:text-7xl md:text-8xl">
          <Link href="/momentos" className="hover:opacity-80 transition-opacity">
            Lunares
          </Link>
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          A collection of thoughts, photographs, and stories.
        </p>
        <SiteNav />
      </div>

      <div className="flex flex-col items-start gap-8 md:items-end">
        <nav className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <ArchiveSearch />
          <NewEntryButtonAuth />
        </nav>

        <figure className="max-w-64 text-left md:text-right">
          <blockquote className="font-serif text-base leading-6 text-foreground">
            We do not remember days, we remember moments.
          </blockquote>
          <figcaption className="mt-2 text-xs text-muted-foreground">
            &mdash; Cesare Pavese
          </figcaption>
        </figure>
      </div>
    </header>
  )
}
