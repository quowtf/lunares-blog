import type { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'

/**
 * Payload for creating a new draft Post from the distraction-free editor.
 */
export interface CreateDraftPayload {
  title: string
  slug: string
  content: SerializedEditorState
  _status: 'draft'
  PostType: 'post'
  authors: [number]
  heroImage: null
  publishedAt: null
  categories: number[] | null
  relatedPosts: null
  galleryImages: null
  postToStories: false
  category?: string
}

/**
 * Extracts the plain text title from the first paragraph or heading node
 * in a serialized Lexical editor state.
 *
 * Returns the concatenated text content (no inline formatting) of that node,
 * truncated to 150 characters. Returns an empty string if no suitable node
 * is found or the node has no text content.
 */
export function extractTitleFromEditorState(editorState: SerializedEditorState): string {
  const root = editorState.root
  if (!root || !root.children) return ''

  // Find the first paragraph or heading node
  const firstTextBlock = root.children.find(
    (node) => node.type === 'paragraph' || node.type === 'heading',
  )

  if (!firstTextBlock) return ''

  // Extract plain text by concatenating all text node values
  const children = 'children' in firstTextBlock ? (firstTextBlock.children as unknown[]) : []
  const text = children
    .filter((child): child is { type: string; text: string } => {
      return (
        typeof child === 'object' &&
        child !== null &&
        'type' in child &&
        (child as { type: string }).type === 'text' &&
        'text' in child
      )
    })
    .map((child) => child.text)
    .join('')

  return text.slice(0, 150)
}

/**
 * Generates a URL-friendly slug from a title string.
 *
 * - Lowercases the input
 * - Normalizes unicode (NFD) and removes diacritical marks
 * - Replaces non-alphanumeric characters with hyphens
 * - Trims leading/trailing hyphens
 * - Limits to 100 characters
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritical marks
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, '') // trim leading/trailing hyphens
    .slice(0, 100)
}

/** Node types allowed in the distraction-free editor output */
const ALLOWED_ROOT_NODE_TYPES = new Set(['paragraph', 'heading', 'upload', 'linebreak'])

/** Node types allowed as children inside paragraph/heading nodes */
const ALLOWED_INLINE_NODE_TYPES = new Set(['text', 'linebreak'])

/**
 * Sanitizes a serialized Lexical editor state by removing disallowed node types.
 *
 * At the root level, only paragraph, heading, upload, and linebreak nodes are kept.
 * Within paragraph/heading nodes, only text and linebreak children are preserved.
 * This ensures content pasted from external sources doesn't include unsupported blocks
 * (code, horizontalrule, block, quote, list, etc.).
 */
export function sanitizeEditorContent(state: SerializedEditorState): SerializedEditorState {
  const root = state.root

  if (!root || !root.children) return state

  const filteredChildren = root.children
    .filter((node) => ALLOWED_ROOT_NODE_TYPES.has(node.type))
    .map((node) => {
      // For paragraph and heading nodes, filter their children to only allowed inline types
      if ((node.type === 'paragraph' || node.type === 'heading') && 'children' in node) {
        const nodeWithChildren = node as SerializedLexicalNode & { children: SerializedLexicalNode[] }
        return {
          ...nodeWithChildren,
          children: nodeWithChildren.children.filter((child) =>
            ALLOWED_INLINE_NODE_TYPES.has(child.type),
          ),
        }
      }
      return node
    })

  return {
    ...state,
    root: {
      ...root,
      children: filteredChildren,
    },
  }
}

/**
 * Builds the payload object for creating a new draft Post via the Payload API.
 *
 * Sets all required default fields: PostType 'post', draft status, null heroImage,
 * no stories, and the authenticated user as the sole author.
 */
export function buildCreatePayload(
  userId: string,
  title: string,
  slug: string,
  content: SerializedEditorState,
  category?: string,
): CreateDraftPayload {
  return {
    title,
    slug,
    content,
    _status: 'draft',
    PostType: 'post',
    authors: [Number(userId)],
    heroImage: null,
    publishedAt: null,
    categories: null,
    relatedPosts: null,
    galleryImages: null,
    postToStories: false,
    ...(category ? { category } : {}),
  }
}
