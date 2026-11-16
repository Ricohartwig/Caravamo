import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PublishedExpose } from "@/components/PublishedExpose";
import { currentUser, loadCardMarks, rememberView } from "@/lib/account";
import { getDealer, listDealerOffers } from "@/lib/dealers";
import { listingDescription, listingTitle } from "@/lib/listing-seo";
import { ownerSaveCount } from "@/lib/owned-listings";
import { getPublishedListing, listSimilarOffers } from "@/lib/published-listings";
import { createPublicClient } from "@/utils/supabase/public";

const vehicleIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const hiddenListing: Metadata = {
  title: "Fahrzeug nicht gefunden",
  robots: { index: false, follow: false },
};

export async function generateMetadata({ params }: PageProps<"/fahrzeug/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!vehicleIdPattern.test(id)) {
    return hiddenListing;
  }

  const listing = await getPublishedListing(id);
  if (!listing) {
    return hiddenListing;
  }

  const title = listingTitle(listing);
  const description = listingDescription(listing);
  const path = `/fahrzeug/${listing.id}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      locale: "de_DE",
      images: listing.imageUrls.slice(0, 4).map((url) => ({ url, alt: listing.title })),
    },
  };
}

export default function VehiclePage({ params }: PageProps<"/fahrzeug/[id]">) {
  return (
    <Suspense fallback={<VehicleFallback />}>
      <VehicleExpose params={params} />
    </Suspense>
  );
}

async function VehicleExpose({
  params,
}: {
  params: PageProps<"/fahrzeug/[id]">["params"];
}) {
  const { id } = await params;
  if (!vehicleIdPattern.test(id)) {
    notFound();
  }

  const listing = await getPublishedListing(id);
  if (!listing) {
    notFound();
  }

  const viewer = await currentUser();
  if (viewer && viewer.id !== listing.sellerId) {
    await rememberView(viewer.id, listing.id);
  }
  if (!viewer || viewer.id !== listing.sellerId) {
    await createPublicClient().rpc("bump_listing_view", { listing_id: listing.id });
  }

  const returnTo = `/fahrzeug/${listing.id}`;
  const body = typeof listing.values.body_type === "string" ? listing.values.body_type : null;
  const [saved, savedCount, dealer, offers, similarOffers] = await Promise.all([
    viewer ? loadCardMarks(returnTo) : Promise.resolve(null),
    viewer && viewer.id === listing.sellerId ? ownerSaveCount(listing.id) : Promise.resolve(null),
    listing.sellerKind === "Händler" ? getDealer(listing.sellerId) : Promise.resolve(null),
    listDealerOffers(listing.sellerId),
    listSimilarOffers(listing.id, body, listing.price),
  ]);
  const otherOffers = offers.filter((offer) => offer.id !== listing.id);

  return (
    <>
      <JsonLd vehicle={listing} />
      <PublishedExpose
        listing={listing}
        viewerId={viewer?.id ?? null}
        savedCount={savedCount}
        dealer={dealer}
        otherOffers={otherOffers}
        similarOffers={similarOffers}
        library={saved}
        marks={{
          signedIn: Boolean(viewer),
          saved: saved?.favorites.has(listing.id) ?? false,
          compared: saved?.comparisons.has(listing.id) ?? false,
          returnTo,
        }}
      />
    </>
  );
}

function VehicleFallback() {
  return (
    <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted" role="status">
      Exposé wird geladen.
    </p>
  );
}
