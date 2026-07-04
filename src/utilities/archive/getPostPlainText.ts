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

export function getPostPlainText(
  content: { root?: { children?: unknown[] } } | null | undefined,
): string {
  return getLexicalText(content?.root?.children).replace(/\s+/g, ' ').trim()
}
