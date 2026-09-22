const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  'https://example.com'

// AI training / scraping crawlers we want to block entirely.
// These bots honor robots.txt; the middleware handles the ones that don't.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'Google-Extended',
  'PerplexityBot',
  'CCBot',
  'Bytespider',
  'Amazonbot',
  'FacebookBot',
  'meta-externalagent',
  'Applebot-Extended',
  'cohere-ai',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
  'Omgili',
  'YouBot',
  'Timpibot',
  'DataForSeoBot',
  'AhrefsBot',
  'SemrushBot',
]

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  // Only the landing page is exposed to the sitemap.
  exclude: ['/posts-sitemap.xml', '/pages-sitemap.xml', '/*', '/posts/*'],
  robotsTxtOptions: {
    policies: [
      // General crawlers (Google, Bing, etc.): index only the landing page.
      {
        userAgent: '*',
        allow: '/$',
        disallow: '/',
      },
      // AI training / scraping crawlers: blocked everywhere.
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    // Landing page only; deep sitemaps are intentionally omitted so search
    // engines are not handed a map of the rest of the site.
    additionalSitemaps: [],
  },
}
