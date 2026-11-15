import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublishedExpose } from "@/components/PublishedExpose";
import { currentUser, loadCardMarks, rememberView } from "@/lib/account";
import { getPublishedListing } from "@/lib/published-listings";

export const metadata: Metadata = {
  title: "Fahrzeug",
  description: "Exposé eines Fahrzeugs auf Caravamo.",
};

const vehicleIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const saved = viewer ? await loadCardMarks(`/fahrzeug/${listing.id}`) : null;

  return (
    <PublishedExpose
      listing={listing}
      viewerId={viewer?.id ?? null}
      marks={{
        signedIn: Boolean(viewer),
        saved: saved?.favorites.has(listing.id) ?? false,
        compared: saved?.comparisons.has(listing.id) ?? false,
        returnTo: `/fahrzeug/${listing.id}`,
      }}
    />
  );
}

function VehicleFallback() {
  return (
    <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted" role="status">
      Exposé wird geladen.
    </p>
  );
}
