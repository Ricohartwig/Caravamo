import type { MetadataRoute } from "next";
import { listDealerSitemap } from "@/lib/dealers";
import { listSitemapListings } from "@/lib/published-listings";
import { absoluteUrl } from "@/lib/site";

const staticPages: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/suche", changeFrequency: "daily", priority: 0.9 },
  { path: "/haendler", changeFrequency: "monthly", priority: 0.4 },
  { path: "/preise", changeFrequency: "monthly", priority: 0.6 },
  { path: "/impressum", changeFrequency: "yearly", priority: 0.2 },
  { path: "/datenschutz", changeFrequency: "yearly", priority: 0.2 },
  { path: "/agb", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, dealers] = await Promise.all([listSitemapListings(), listDealerSitemap()]);

  return [
    ...staticPages.map((page) => ({
      url: absoluteUrl(page.path),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...listings.map((listing) => ({
      url: absoluteUrl(`/fahrzeug/${listing.id}`),
      lastModified: listing.updatedAt ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: listing.imageUrls.length > 0 ? listing.imageUrls : undefined,
    })),
    ...dealers.map((dealer) => ({
      url: absoluteUrl(`/haendler/${dealer.id}`),
      lastModified: dealer.updatedAt ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
