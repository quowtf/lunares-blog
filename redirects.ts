import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  const menowRedirect = {
    source: '/menow',
    destination: '/momentos',
    permanent: true,
  }

  const aboutRedirect = {
    source: '/about',
    destination: '/momentos',
    permanent: true,
  }

  const postsRedirects = [
    {
      source: '/posts',
      destination: '/',
      permanent: true,
    },
    {
      source: '/posts/page/:page',
      destination: '/',
      permanent: true,
    },
    {
      source: '/posts/:slug',
      destination: '/:slug',
      permanent: true,
    },
  ]

  return [internetExplorerRedirect, menowRedirect, aboutRedirect, ...postsRedirects]
}
