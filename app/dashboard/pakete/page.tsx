import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { openBillingPortal } from "@/actions/packages";
import { PackageCatalog } from "@/components/packages/PackageCatalog";
import { currentUser, accountProfile } from "@/lib/account";
import { formatEuroCents } from "@/lib/dealer-packages";
import { packageAllowance, subscriptionLabel } from "@/lib/dealer-subscription";
import { businessListingAmount } from "@/lib/listing-payment";
import { formatDay } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pakete",
  description: "Händler-Pakete buchen, Rechnungen laden und das Abo wechseln.",
};

const notices: Record<string, string> = {
  gebucht: "Stripe hat die Buchung angenommen. Das Paket steht bereit, sobald die Bestätigung ankommt.",
  abgebrochen: "Die Buchung wurde abgebrochen.",
  "nicht-eingerichtet": "Die Bezahlung ist noch nicht eingerichtet.",
  fehler: "Das Kundenportal konnte gerade nicht geöffnet werden.",
  "nur-haendler": "Pakete gibt es für Händlerkonten. Privatverkäufer buchen jedes Inserat einzeln.",
  "kein-abo": "Du hast noch kein laufendes Paket.",
  unbekannt: "Dieses Paket gibt es nicht.",
};

export default function PaketePage({
  searchParams,
}: {
  searchParams: Promise<{ abo?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Pakete werden geladen.</p>}>
      <Packages searchParams={searchParams} />
    </Suspense>
  );
}

async function Packages({ searchParams }: { searchParams: Promise<{ abo?: string | string[] }> }) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard/pakete");
  }

  const params = await searchParams;
  const noticeKey = Array.isArray(params.abo) ? params.abo[0] : params.abo;
  const profile = await accountProfile(user.id);
  const allowance = profile.business ? await packageAllowance(user.id) : null;
  const subscription = allowance?.subscription ?? null;
  const label = subscriptionLabel(subscription);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Pakete</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {profile.business
          ? `Einzelne Inserate kosten ${formatEuroCents(businessListingAmount)} für 30 Tage. Ein Paket stellt mehrere Fahrzeuge gleichzeitig online.`
          : "Monatspakete gelten für Händler. Als Privatverkäufer bezahlst du jedes Inserat einzeln."}
      </p>
      {noticeKey && notices[noticeKey] ? (
        <p role="status" className="mt-4 rounded-2xl border border-line bg-sand px-4 py-3 text-sm">
          {notices[noticeKey]}
        </p>
      ) : null}
      {profile.business && allowance ? (
        <section className="mt-6 rounded-2xl border border-line bg-card p-5">
          <h2 className="text-lg font-semibold">{label && allowance.usable ? `Paket: ${label}` : "Noch kein aktives Paket"}</h2>
          <p className="mt-2 text-sm text-muted">
            {allowance.usable
              ? `${allowance.used} von ${subscription?.slots ?? 0} Plätzen belegt. ${allowance.free} frei.`
              : "Ohne Paket bleibt die Einzelbuchung."}
            {subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd
              ? ` Das Paket endet am ${formatDay(subscription.currentPeriodEnd)}.`
              : ""}
            {subscription?.currentPeriodEnd && allowance.usable && !subscription.cancelAtPeriodEnd
              ? ` Die nächste Verlängerung ist am ${formatDay(subscription.currentPeriodEnd)}.`
              : ""}
          </p>
          {subscription?.stripeCustomerId?.startsWith("cus_") ? (
            <form action={openBillingPortal} className="mt-4">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam hover:bg-pine-deep"
              >
                Rechnungen, Kündigung und Paketwechsel
              </button>
            </form>
          ) : null}
        </section>
      ) : null}
      <div className="mt-8">
        <PackageCatalog booking={profile.business ? "dealer" : "private"} currentSlots={allowance?.usable ? subscription?.slots : null} />
      </div>
    </div>
  );
}
