import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PublishedExpose } from "@/components/PublishedExpose";
import { ListingControls } from "@/components/dashboard/ListingControls";
import { currentUser, loadCardMarks } from "@/lib/account";
import { formatDay } from "@/lib/format";
import { listingStand, paidTimeLeft } from "@/lib/listing-state";
import { isVehicleId } from "@/lib/owned-listings";
import { getOwnedPreview } from "@/lib/published-listings";

export const instant = false;

export const metadata: Metadata = {
  title: "Vorschau",
  robots: { index: false, follow: false },
};

const notices: Record<string, string> = {
  online: "Das Inserat ist wieder online.",
  pausiert: "Das Inserat ist pausiert. Die bezahlte Laufzeit läuft weiter.",
  verkauft: "Das Inserat ist als verkauft markiert und aus der Suche genommen.",
  "nicht-moeglich": "Das geht mit diesem Inserat gerade nicht.",
};

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hinweis?: string | string[] }>;
}) {
  const { id } = await params;
  if (!isVehicleId(id)) {
    redirect("/dashboard/inserate?hinweis=unbekannt");
  }

  const user = await currentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/vorschau/${id}`)}`);
  }

  const listing = await getOwnedPreview(user.id, id);
  if (!listing) {
    redirect("/dashboard/inserate?hinweis=unbekannt");
  }

  const query = await searchParams;
  const noticeKey = Array.isArray(query.hinweis) ? query.hinweis[0] : query.hinweis;
  const status = typeof listing.values.status === "string" ? listing.values.status : "entwurf";
  const publishedUntil = typeof listing.values.published_until === "string" ? listing.values.published_until : null;
  const stand = listingStand(status, publishedUntil);
  const saved = await loadCardMarks(`/vorschau/${id}`);

  return (
    <>
      <div className="border-b border-line bg-sand">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">{previewTitle(stand)}</p>
            <p className="mt-1 text-sm text-muted">{previewText(stand, publishedUntil)}</p>
            {noticeKey && notices[noticeKey] ? (
              <p role="status" className="mt-2 text-sm font-medium text-pine">
                {notices[noticeKey]}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/inserate"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-semibold hover:bg-foam"
            >
              Zu den Inseraten
            </Link>
            {stand === "aktiv" ? (
              <Link
                href={`/fahrzeug/${id}`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-semibold hover:bg-foam"
              >
                Öffentliche Seite
              </Link>
            ) : null}
            <Link
              href={`/inserieren/${id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam"
            >
              Bearbeiten
            </Link>
            <ListingControls id={id} status={status} publishedUntil={publishedUntil} preview />
          </div>
        </div>
      </div>
      <PublishedExpose
        listing={listing}
        viewerId={user.id}
        marks={{
          signedIn: true,
          saved: saved.favorites.has(id),
          compared: saved.comparisons.has(id),
          returnTo: `/vorschau/${id}`,
        }}
      />
    </>
  );
}

function previewTitle(stand: ReturnType<typeof listingStand>): string {
  if (stand === "aktiv") {
    return "Vorschau, das Inserat ist online";
  }
  if (stand === "inaktiv") {
    return "Vorschau, das Inserat ist pausiert";
  }
  if (stand === "verkauft") {
    return "Vorschau, als verkauft markiert";
  }
  if (stand === "abgelaufen") {
    return "Vorschau, die Laufzeit ist vorbei";
  }
  return "Vorschau, noch nicht bezahlt";
}

function previewText(stand: ReturnType<typeof listingStand>, publishedUntil: string | null): string {
  if (stand === "entwurf") {
    return "So sehen Interessenten das Inserat. Öffentlich wird es erst nach der Zahlung.";
  }
  if (stand === "inaktiv" && paidTimeLeft(publishedUntil)) {
    return `Suchende sehen es nicht. Die bezahlte Laufzeit läuft bis ${formatDay(publishedUntil ?? "")} weiter.`;
  }
  if (stand === "aktiv" && publishedUntil) {
    return `Sichtbar bis ${formatDay(publishedUntil)}. Pausieren nimmt es aus der Suche, die Laufzeit läuft weiter.`;
  }
  if (stand === "verkauft") {
    return "Das Fahrzeug bleibt in deinem Konto und erscheint nicht in der Suche.";
  }
  return "Die Laufzeit ist vorbei. Eine neue Zahlung stellt es wieder online.";
}
