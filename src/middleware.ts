import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Bot / scraping mitigation.
 *
 * Two layers run here (see notes in each section):
 *  1. Hard-block known AI-training / scraping crawlers that identify themselves
 *     honestly via their User-Agent (returns 403).
 *  2. Add `X-Robots-Tag: noindex, nofollow` to every route except the landing
 *     page, so search engines drop everything but `lunares.mx/` from their index.
 *
 * Note: this only stops bots that (a) honor `noindex` or (b) do not forge their
 * User-Agent. Determined scrapers can spoof the UA — the real defense against
 * those is a platform WAF (Vercel Firewall / Cloudflare), configured outside
 * the app.
 */

// Substrings matched case-insensitively against the User-Agent header.
// Keep in sync with AI_CRAWLERS in next-sitemap.config.cjs.
const BLOCKED_UA_SUBSTRINGS = [
  'gptbot',
  'oai-searchbot',
  'chatgpt-user',
  'claudebot',
  'claude-web',
  'anthropic-ai',
  'google-extended',
  'perplexitybot',
  'ccbot',
  'bytespider',
  'amazonbot',
  'facebookbot',
  'meta-externalagent',
  'applebot-extended',
  'cohere-ai',
  'diffbot',
  'imagesiftbot',
  'omgilibot',
  'omgili',
  'youbot',
  'timpibot',
  'dataforseobot',
  'ahrefsbot',
  'semrushbot',
]

function isBlockedBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return BLOCKED_UA_SUBSTRINGS.some((needle) => ua.includes(needle))
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') ?? ''

  // Layer 1: block known AI/scraper user-agents outright.
  if (isBlockedBot(userAgent)) {
    return new NextResponse('Forbidden', {
      status: 403,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    })
  }

  const response = NextResponse.next()

  // Layer 2: noindex everything except the landing page.
  const { pathname } = request.nextUrl
  if (pathname !== '/') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
}

export const config = {
  /**
   * Run on all paths except Next internals, the Payload admin panel, API
   * routes, and static asset files. This keeps the header/bot logic on
   * user-facing pages only.
   */
  matcher: ['/((?!admin|api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|robots\\.txt|sitemap\\.xml|.*-sitemap\\.xml|media).*)'],
}
