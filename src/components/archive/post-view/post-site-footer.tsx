import Link from 'next/link'

export function PostSiteFooter() {
  return (
    <footer className="mt-24 border-t border-stone-200/60 pt-12 pb-16 sm:mt-32 sm:pt-16 sm:pb-20 lg:mt-[200px] lg:pb-24">
      <Link
        className="font-display text-2xl tracking-tight text-stone-900 transition hover:text-stone-600 sm:text-3xl"
        href="/"
      >
        Archive
      </Link>
      <p className="mt-6 max-w-sm text-sm leading-7 text-stone-500">
        A collection of thoughts, photographs, stories and moments.
        <br />
        Built slowly.
        <br />
        Since 2018.
      </p>
    </footer>
  )
}
