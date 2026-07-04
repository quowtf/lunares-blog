import type { Post } from '@/payload-types'

function getLexicalText(children: unknown): string {
  if (!Array.isArray(children)) return ''

  return children
    .map((child) => {
      if (!child || typeof child !== 'object') return ''

      if ('text' in child && typeof child.text === 'string') {
        return child.text
      }

      if ('children' in child) {
        return getLexicalText(child.children)
      }

      return ''
    })
    .filter(Boolean)
    .join(' ')
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3).trimEnd()}...`
}

export function getPostExcerpt(
  post: Pick<Post, 'content' | 'meta'>,
  maxLength = 150,
): string {
  const metaDescription = post.meta?.description?.replace(/\s+/g, ' ').trim()
  if (metaDescription) return truncate(metaDescription, maxLength)

  const text = getLexicalText(post.content?.root?.children).replace(/\s+/g, ' ').trim()
  if (!text) return ''

  return truncate(text, maxLength)
}
