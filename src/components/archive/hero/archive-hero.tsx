import { ArchiveTitleLink } from './archive-title-link'
import { HeroActions } from './hero-actions'
import { SiteNav } from './site-nav'

export function ArchiveHero() {
  return (
    <header className="relative grid gap-4 md:grid-cols-[1fr_auto] md:items-start md:gap-8">
      <div className="space-y-4">
        <h1 className="font-serif text-6xl leading-none tracking-[0.12em] text-foreground max-[359px]:text-5xl sm:text-7xl md:text-8xl">
          <ArchiveTitleLink />
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          Ya bajé de la montaña, invaluable travesía, 🤓.
        </p>
        <SiteNav />
      </div>

      <HeroActions />
    </header>
  )
}
