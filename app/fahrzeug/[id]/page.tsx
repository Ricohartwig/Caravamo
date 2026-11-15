import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublishedExpose } from "@/components/PublishedExpose";
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

  return <PublishedExpose listing={listing} />;
}

function VehicleFallback() {
  return (
    <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted" role="status">
      Exposé wird geladen.
    </p>
  );
}
