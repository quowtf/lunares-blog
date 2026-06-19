import Link from 'next/link'

export function PostSiteFooter() {
  return (
    <footer className="mt-24 border-t border-border pt-12 pb-16 sm:mt-32 sm:pt-16 sm:pb-20 lg:mt-[200px] lg:pb-24">
      <Link
        className="font-display text-2xl tracking-tight text-foreground transition hover:text-muted-foreground sm:text-3xl"
        href="/"
      >
        Lunares
      </Link>
      <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
        A collection of thoughts, photographs, stories and moments.
        <br />
        Built slowly.
        <br />
        Since 1991.
      </p>
    </footer>
  )
}
