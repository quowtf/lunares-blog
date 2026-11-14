import type { Post } from '@/payload-types'

type LexicalContent = NonNullable<Post['content']>
type LexicalNode = LexicalContent['root']['children'][number]

function textNode(text: string): LexicalNode {
  return {
    type: 'text',
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text,
    version: 1,
  }
}

function lineBreakNode(): LexicalNode {
  return {
    type: 'linebreak',
    version: 1,
  }
}

function paragraphNode(lines: string[]): LexicalNode {
  const children: LexicalNode[] = []

  lines.forEach((line, index) => {
    if (index > 0) children.push(lineBreakNode())
    if (line) children.push(textNode(line))
  })

  return {
    type: 'paragraph',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

/**
 * Converts plain text into Lexical. Double newlines create paragraphs;
 * single newlines stay as line breaks inside the same paragraph.
 */
export function textToLexical(value: string): LexicalContent {
  const blocks = value
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const paragraphs = blocks.length > 0 ? blocks : [value.trim()]

  return {
    root: {
      type: 'root',
      children: paragraphs.map((block) => paragraphNode(block.split('\n'))),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
