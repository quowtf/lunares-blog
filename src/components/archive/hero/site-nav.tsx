import { getCachedGlobal } from '@/utilities/getGlobals'
import { CMSLink } from '@/components/Link'

export async function SiteNav() {
  const headerData = await getCachedGlobal('header', 1)()
  const navItems = headerData?.navItems || []

  if (navItems.length === 0) return null

  return (
    <nav aria-label="Navegación del sitio" className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {navItems.map(({ link }, i) => (
        <CMSLink
          key={i}
          {...link}
          appearance="inline"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        />
      ))}
    </nav>
  )
}
