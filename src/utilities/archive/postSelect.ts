export const archivePostSelect = {
  id: true,
  title: true,
  slug: true,
  categories: true,
  meta: true,
  content: true,
  heroImage: true,
  galleryImages: true,
  PostType: true,
  publishedAt: true,
  createdAt: true,
  // Café fields (visible on card)
  coffeeOrigin: true,
  coffeeProcess: true,
  coffeeTags: true,
} as const
