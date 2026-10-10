// Shapes of the data files the admin panel writes.
//
// src/data/*.js is generated from public/data/*.json by scripts/sync-data.mjs and
// tied back to these types with JSDoc. That keeps the build working when a list is
// empty (everything deleted in the panel) — otherwise TypeScript infers `any[]`.

/** A field carried in both site languages. */
export type Localized = { tr: string; en: string };

/** One frame in a collection's gallery. `wide` plates run full width. */
export type GalleryImage = { src: string; wide: boolean };

/** A collection in the archive. */
export type ArchiveItem = {
  id: string;
  slug: string;
  year: string;
  category: string;
  title: Localized;
  coverImage: string;
  gallery: GalleryImage[];
  featured: boolean;
  /** Present on older records; not editable in the panel. */
  description?: Localized;
};

/** One banner in the homepage hero. Desktop and phone each have their own
 *  independent list of these (see carousel.json / carouselMobile.json) — a
 *  phone never falls back to a desktop-only banner once any exist for it. */
export type CarouselItem = {
  id: string;
  type: string;
  src: string;
  alt: string;
  tagline: Localized;
  subTagline: Localized;
  duration: number;
};
