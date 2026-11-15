import { serializeJsonLd, vehicleJsonLd } from "@/lib/listing-seo";
import type { PublishedListing } from "@/lib/published-listings";

export function JsonLd({ vehicle }: { vehicle: PublishedListing }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(vehicleJsonLd(vehicle)) }}
    />
  );
}
