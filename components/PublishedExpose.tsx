import Link from "next/link";
import { SavedCount } from "@/components/account/SavedCount";
import { ListingFacts } from "@/components/ListingFacts";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SellerContact } from "@/components/SellerContact";
import { VehiclePlaceholder } from "@/components/VehiclePlaceholder";
import type { CardMarks } from "@/lib/account";
import { formatPrice } from "@/lib/format";
import { isPublicListing } from "@/lib/listing-payment";
import { listingStand } from "@/lib/listing-state";
import type { PublishedListing } from "@/lib/published-listings";

export function PublishedExpose({
  listing,
  viewerId,
  marks,
  savedCount = null,
}: {
  listing: PublishedListing;
  viewerId: string | null;
  marks: CardMarks;
  savedCount?: number | null;
}) {
  const price = listing.priceTax
    ? `${formatPrice(listing.price)} ${listing.priceTax}`
    : formatPrice(listing.price);
  const status = typeof listing.values.status === "string" ? listing.values.status : "aktiv";
  const publishedUntil = typeof listing.values.published_until === "string" ? listing.values.published_until : null;
  const badge = exposeBadge(status, publishedUntil);

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <p className="text-sm text-muted">
        <Link href="/suche" className="font-medium text-pine hover:underline">
          Zur Suche
        </Link>
        <span aria-hidden="true"> · </span>
        {listing.brand} · {listing.type}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{listing.title}</h1>
        {badge ? <p className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-pine">{badge}</p> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{price}</p>
      {savedCount !== null ? (
        <div className="mt-3">
          <SavedCount count={savedCount} />
        </div>
      ) : null}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {listing.imageUrls.length > 0 ? (
            <PhotoGallery title={listing.title} urls={listing.imageUrls} />
          ) : (
            <VehiclePlaceholder title={listing.title} type={listing.type} tone={0} label="Front" />
          )}
          {listing.description ? (
            <section className="mt-6">
              <h2 className="text-lg font-semibold">Beschreibung</h2>
              <p className="mt-2 max-w-3xl whitespace-pre-wrap leading-7">{listing.description}</p>
            </section>
          ) : null}
          <ListingFacts values={listing.values} />
        </div>
        <SellerContact
          sellerName={listing.sellerName}
          sellerKind={listing.sellerKind}
          sellerPlace={listing.sellerPlace}
          sellerAbout={listing.sellerAbout}
          sellerHref={listing.sellerHref}
          sellerId={listing.sellerId}
          vehicleId={listing.id}
          viewerId={viewerId}
          marks={marks}
        />
      </div>
    </article>
  );
}

function exposeBadge(status: string, publishedUntil: string | null): string | null {
  if (isPublicListing(status, publishedUntil)) {
    return "Inserat aktiv";
  }

  const stand = listingStand(status, publishedUntil);
  if (stand === "inaktiv") {
    return "Pausiert";
  }
  if (stand === "verkauft") {
    return "Verkauft";
  }
  if (stand === "abgelaufen") {
    return "Abgelaufen";
  }
  return "Entwurf";
}
