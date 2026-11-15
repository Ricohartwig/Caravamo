import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/listing/ListingForm";
import { getOwnedDraft, isVehicleId, listingNeedsPayment } from "@/lib/owned-listings";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Inserat bearbeiten",
  description: "Ein eigenes Fahrzeug bei Caravamo aktualisieren.",
};

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-12 text-sm text-muted">Inserat wird geladen.</p>}>
      <EditListing params={params} />
    </Suspense>
  );
}

async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isVehicleId(id)) {
    notFound();
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect(`/login?next=/inserieren/${id}`);
  }

  const draft = await getOwnedDraft(data.user.id, id);
  if (!draft) {
    notFound();
  }

  const requiresPayment = listingNeedsPayment(draft.status, draft.publishedUntil);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-copper-dark">Verkauf</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Inserat bearbeiten</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Die gespeicherten Angaben stehen wieder im Formular. Entfernte Bilder werden beim Speichern aus dem Speicher gelöscht.
        {requiresPayment
          ? " Dieses Inserat ist noch nicht öffentlich. Nach dem Speichern geht es zur Bezahlung."
          : ""}
      </p>
      <ListingForm
        listingId={draft.id}
        initialValues={draft.values}
        initialImages={draft.images.map((image) => ({ ...image, persisted: true }))}
        requiresPayment={requiresPayment}
      />
    </div>
  );
}
