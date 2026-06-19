import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps>

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return `/${slug}`
}

function PostBannerBlock({
  className,
  content,
  style,
}: Pick<BannerBlockProps, 'content' | 'style'> & { className?: string }) {
  if (style === 'info') {
    return (
      <aside className={cn('post-personal-note', className)}>
        <p className="mb-4 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-stone-500">
          Personal note
        </p>
        <RichText
          className="post-personal-note-content"
          data={content}
          enableGutter={false}
          enableProse={false}
        />
      </aside>
    )
  }

  return (
    <BannerBlock blockType="banner" className={className} content={content} style={style} />
  )
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  blocks: {
    banner: ({ node }) => <PostBannerBlock className="my-20" {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="post-inline-media my-20"
        disableInnerContainer
        enableGutter={false}
        imgClassName="rounded-2xl"
        {...node.fields}
        captionClassName="post-media-caption"
      />
    ),
    code: ({ node }) => <CodeBlock className="my-10" {...node.fields} />,
    cta: ({ node }) => <CallToActionBlock {...node.fields} />,
  },
})

type Props = {
  data: DefaultTypedEditorState
} & React.HTMLAttributes<HTMLDivElement>

export function PostRichText({ className, data, ...rest }: Props) {
  return (
    <ConvertRichText
      className={cn('post-prose payload-richtext max-w-none', className)}
      converters={jsxConverters}
      data={data}
      {...rest}
    />
  )
}
