import { ArchiveSearch } from './archive-search'
import { NewEntryButtonAuth } from './new-entry-button-auth'

export function ArchiveHero() {
  return (
    <header className="grid gap-8 border-b border-stone-200 pb-8 md:grid-cols-[1fr_auto] md:items-start">
      <div className="space-y-4">
        <h1 className="font-serif text-6xl leading-none tracking-[0.12em] text-stone-950 sm:text-7xl md:text-8xl">
          Lunares
        </h1>
        <p className="max-w-xl text-sm leading-6 text-stone-600 sm:text-base">
          A collection of thoughts, photographs, stories and moments.
        </p>
      </div>

      <div className="flex flex-col items-start gap-8 md:items-end">
        <nav className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <ArchiveSearch />
          <NewEntryButtonAuth />
        </nav>

        <figure className="max-w-64 text-left md:text-right">
          <blockquote className="font-serif text-base leading-6 text-stone-800">
            We do not remember days, we remember moments.
          </blockquote>
          <figcaption className="mt-2 text-xs text-stone-500">&mdash; Cesare Pavese</figcaption>
        </figure>
      </div>
    </header>
  )
}
