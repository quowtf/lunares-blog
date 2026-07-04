// =============================================================================
// Archive UI types (migrated from inmanent)
// =============================================================================

export type CardVariant = 'default' | 'sepia' | 'muted'
export type ImageTone = 'paper' | 'warm' | 'cool' | 'mist' | 'forest'

export type ImageAsset = {
  alt: string
  src?: string
  tone?: ImageTone
  unoptimized?: boolean
}

type BaseArchiveItem = {
  id: string
  date: string
  variant?: CardVariant
  href?: string
}

export type ImageItem = BaseArchiveItem & {
  type: 'image'
  label?: string
  title?: string
  content?: string
  image: ImageAsset
}

/** Solo imágenes, sin título ni metadata. */
export type GalleryItem = BaseArchiveItem & {
  type: 'gallery'
  images: ImageAsset[]
}

/** Imágenes con título, texto y fecha. */
export type SlidesItem = BaseArchiveItem & {
  type: 'slides'
  label?: string
  title: string
  content?: string
  images: ImageAsset[]
}

export type ArchiveItemType = ImageItem['type'] | GalleryItem['type'] | SlidesItem['type']

export function isImageItem(item: { type: string }): item is ImageItem {
  return item.type === 'image'
}

////
// import type { ReactNode } from "react";

// // =============================================================================
// // Primitive Types
// // =============================================================================

// export type CardVariant = "default" | "sepia" | "muted";
// export type CardSize = "sm" | "md" | "lg";
// export type ImageTone = "paper" | "warm" | "cool" | "mist" | "forest";

// export type ImageAsset = {
//   alt: string;
//   src?: string;
//   tone?: ImageTone;
// };

// // =============================================================================
// // Archive Item - Discriminated Union
// // =============================================================================

// /**
//  * All items share these fields. Stored in a single DynamoDB table/collection.
//  * The `type` field is the discriminator for TypeScript and for querying.
//  */
// type CardUI = {
//   id: string;
//   createdAt: string;
//   variant?: CardVariant;
//   isSaved?: boolean;
// };

// export type PostCard = CardUI & {
//   type: "post";
//   label: string;
//   title: string;
//   excerpt: string;
//   readingTime: string;
//   href?: string;
//   image?: ImageAsset;
//   gallery?: ImageAsset[];
// };

// export type ThoughtCard = CardUI & {
//   type: "thought";
//   label: string;
//   title: string;
//   content: string;
//   images?: ImageAsset[];
// };

// export type QuoteCard = CardUI & {
//   type: "quote";
//   label: string;
//   title: string;
//   content: string;
//   images?: ImageAsset[];
// };

// export type ImageCard = CardUI & {
//   type: "image";
//   label?: string;
//   title?: string;
//   content?: string;
//   image: ImageAsset;
// };

// export type GalleryCard = CardUI & {
//   type: "gallery";
//   images: ImageAsset[];
// };

// export type SlidesCard = CardUI & {
//   type: "slides";
//   label: string;
//   title: string;
//   content?: string;
//   images: ImageAsset[];
// };

// /**
//  * The main discriminated union. Use `item.type` to narrow.
//  *
//  * @example
//  * function renderCard(item: ArchiveItem) {
//  *   switch (item.type) {
//  *     case "post":    return <PostCard {...item} />;
//  *     case "quote":   return <QuoteCard {...item} />;
//  *     case "image":   return <ImageCard {...item} />;
//  *     // ...
//  *   }
//  * }
//  */
// export type Card =
//   | PostCard
//   | ThoughtCard
//   | QuoteCard
//   | ImageCard
//   | GalleryCard
//   | SlidesCard;

// /**
//  * Extract the type literal from the union for type-safe switches/maps.
//  */
// export type CardType = Card["type"];

// /**
//  * Helper to extract a specific item type from the union.
//  * @example type Post = ExtractItem<"post">; // PostItem
//  */
// export type ExtractItem<T extends CardType> = Extract<
//   Card,
//   { type: T }
// >;

// // =============================================================================
// // API Response Types
// // =============================================================================

// /**
//  * A group of items for a specific month.
//  * This is how the API returns items, already grouped by month.
//  */
// export type CardGroup = {
//   month: string;
//   items: Card[];
// };

// /**
//  * The response from the archive API endpoint.
//  */
// export type ArchiveResponse = {
//   groups: CardGroup[];
// };

// // =============================================================================
// // UI-Specific Types (not stored in DB)
// // =============================================================================

// export type HeroData = {
//   title: string;
//   description: string;
//   quote: string;
//   author: string;
//   actionLabel?: string;
// };

// export type PreviewSize = "compact" | "medium" | "wide" | "full";

// export type PreviewItem = {
//   title: string;
//   description: string;
//   size?: PreviewSize;
//   children: ReactNode;
// };

// // =============================================================================
// // Type Guards
// // =============================================================================

// export function isPostCard(item: Card): item is PostCard {
//   return item.type === "post";
// }

// export function isQuoteCard(item: Card): item is QuoteCard {
//   return item.type === "quote";
// }

// export function isImageCard(item: Card): item is ImageCard {
//   return item.type === "image";
// }

// export function isGalleryCard(item: Card): item is GalleryCard {
//   return item.type === "gallery";
// }

// export function isThoughtCard(item: Card): item is ThoughtCard {
//   return item.type === "thought";
// }

// export function isSlidesCard(item: Card): item is SlidesCard {
//   return item.type === "slides";
// }
