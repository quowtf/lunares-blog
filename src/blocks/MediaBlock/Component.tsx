import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlock: React.FC<Props> = (props) => {
  const {
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    size = 'full',
    staticImage,
    disableInnerContainer,
  } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  const resolvedSize = size ?? 'full'
  const resolvedAlignment = 'center'

  const sizeClasses: Record<string, string> = {
    full: 'w-full',
    wide: 'w-[calc(100%+8rem)] -ml-16 max-w-[100vw]',
    medium: 'w-3/4',
    small: 'w-1/2',
  }

  const alignmentClasses: Record<string, string> = {
    center: 'mx-auto',
    left: 'mr-auto',
    right: 'ml-auto',
  }

  const needsAlignment = resolvedSize === 'medium' || resolvedSize === 'small'

  return (
    <div
      className={cn(
        '',
        {
          container: enableGutter && resolvedSize !== 'wide',
        },
      )}
    >
      <div
        className={cn(
          sizeClasses[resolvedSize] || sizeClasses.full,
          needsAlignment && (alignmentClasses[resolvedAlignment] || alignmentClasses.center),
        )}
      >
        {(media || staticImage) && (
          <Media
            imgClassName={cn('border border-border rounded-[0.5rem]', imgClassName)}
            resource={media}
            src={staticImage}
          />
        )}
        {caption && (
          <div
            className={cn(
              'mt-2 text-center text-xs text-muted-foreground italic',
              captionClassName,
            )}
          >
            <RichText data={caption} enableGutter={false} />
          </div>
        )}
      </div>
    </div>
  )
}
