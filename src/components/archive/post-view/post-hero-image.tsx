import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

type PostHeroImageProps = {
  image: MediaType
}

function getCaptionText(image: MediaType): string | null {
  if (image.alt?.trim()) return image.alt.trim()
  return null
}

export function PostHeroImage({ image }: PostHeroImageProps) {
  const caption = getCaptionText(image)

  return (
    <figure className="w-full">
      <div className="relative overflow-hidden rounded-2xl bg-stone-200">
        <Media
          imgClassName="object-cover"
          pictureClassName="relative block aspect-[4/3] w-full min-h-[16rem] sm:aspect-[16/10] sm:min-h-[24rem] lg:min-h-[36rem]"
          resource={image}
          size="(min-width: 1024px) 760px, 100vw"
        />
      </div>
      {caption ? (
        <figcaption className="mt-4 text-[0.6875rem] leading-5 text-stone-400">{caption}</figcaption>
      ) : image.caption ? (
        <figcaption className="mt-4 text-[0.6875rem] leading-5 text-stone-400">
          <RichText data={image.caption} enableGutter={false} enableProse={false} />
        </figcaption>
      ) : null}
    </figure>
  )
}
