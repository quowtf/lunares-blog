import Link from 'next/link'

type NewEntryButtonProps = {
  href?: string
}

export function NewEntryButton({ href = '/admin/collections/posts/create' }: NewEntryButtonProps) {
  return (
    <Link
      className="inline-flex shrink-0 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
      href={href}
    >
      + New entry
    </Link>
  )
}
