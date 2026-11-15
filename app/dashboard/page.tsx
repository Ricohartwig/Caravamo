import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  accountCounts,
  accountProfile,
  currentUser,
  listInquiries,
  listRecentViews,
} from "@/lib/account";
import { formatDateTime, formatPrice } from "@/lib/format";
import { listingsExpiringWithin, listOwnedVehicles } from "@/lib/owned-listings";

export const metadata: Metadata = {
  title: "Mein Konto",
  description: "Merkliste, Suchen, Anfragen und eigene Inserate bei Caravamo.",
};

const paymentNotices: Record<string, string> = {
  erfolgreich: "Stripe hat die Zahlung angenommen. Das Inserat wird öffentlich, sobald die Bestätigung ankommt.",
  abgebrochen: "Die Zahlung wurde abgebrochen. Der Entwurf bleibt in deinem Konto.",
  "nicht-eingerichtet": "Die Bezahlung ist noch nicht eingerichtet. Der Entwurf bleibt gespeichert und ist nicht öffentlich.",
  fehler: "Stripe hat die Zahlung gerade nicht gestartet. Der Entwurf bleibt gespeichert.",
  unbekannt: "Dieses Inserat gehört nicht zu deinem Konto.",
};

const accountNotices: Record<string, string> = {
  passwort: "Dein neues Passwort ist gespeichert.",
};

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ zahlung?: string | string[]; hinweis?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Übersicht wird geladen.</p>}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

async function Overview({
  searchParams,
}: {
  searchParams: Promise<{ zahlung?: string | string[]; hinweis?: string | string[] }>;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const params = await searchParams;
  const paymentKey = Array.isArray(params.zahlung) ? params.zahlung[0] : params.zahlung;
  const accountKey = Array.isArray(params.hinweis) ? params.hinweis[0] : params.hinweis;
  const notice = (paymentKey ? paymentNotices[paymentKey] : undefined) ?? (accountKey ? accountNotices[accountKey] : undefined);
  const [counts, profile, vehicles, inquiries, views] = await Promise.all([
    accountCounts(user.id),
    accountProfile(user.id),
    listOwnedVehicles(user.id),
    listInquiries(user.id),
    listRecentViews(user.id),
  ]);
  const expiring = listingsExpiringWithin(vehicles);

  const cards = [
    { href: "/dashboard/merkliste", label: "Merkliste", value: counts.favorites, text: "Fahrzeuge, die du behalten willst" },
    { href: "/dashboard/suchen", label: "Gespeicherte Suchen", value: counts.searches, text: "Filter, die du wiederholen willst" },
    { href: "/dashboard/anfragen", label: "Ungelesene Anfragen", value: counts.unread, text: "Nachrichten von und an Anbieter" },
    { href: "/dashboard/inserate", label: "Eigene Inserate", value: counts.listings, text: profile.business ? "Händler, 6,99 € je 30 Tage" : "Privat, 4,99 € je 30 Tage" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Übersicht</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Hier laufen Suche, Merkliste, Vergleich und deine eigenen Inserate zusammen. Käufer und Verkäufer nutzen dasselbe Konto.
      </p>
      {notice ? (
        <p role="status" className="mt-4 rounded-2xl border border-line bg-sand px-4 py-3 text-sm">
          {notice}
        </p>
      ) : null}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            <Link href={card.href} className="block rounded-2xl border border-line bg-card p-4 hover:bg-sand">
              <p className="text-sm text-muted">{card.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{card.value}</p>
              <p className="mt-2 text-sm text-muted">{card.text}</p>
            </Link>
          </li>
        ))}
      </ul>

      {expiring.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Läuft in den nächsten 7 Tagen ab</h2>
          <ul className="mt-3 space-y-2">
            {expiring.map((vehicle) => (
              <li key={vehicle.id} className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
                <span className="font-semibold">{vehicle.title}</span>
                <span className="text-muted"> · {formatPrice(vehicle.price)} · sichtbar bis {formatDateTime(vehicle.publishedUntil ?? "")}</span>
                <Link href="/dashboard/inserate" className="ml-2 font-semibold text-pine hover:underline">
                  Verlängern
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Letzte Anfragen</h2>
            <Link href="/dashboard/anfragen" className="text-sm font-semibold text-pine hover:underline">
              Alle
            </Link>
          </div>
          {inquiries.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Noch keine Anfrage. Auf einem Exposé kannst du dem Anbieter schreiben.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {inquiries.slice(0, 3).map((inquiry) => (
                <li key={inquiry.id}>
                  <Link href={`/dashboard/anfragen/${inquiry.id}`} className="block rounded-2xl border border-line bg-card px-4 py-3 hover:bg-sand">
                    <p className="text-sm font-semibold">
                      {inquiry.direction === "eingang" ? "Von" : "An"} {inquiry.counterpart}
                      {inquiry.unread ? <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-xs text-pine">Neu</span> : null}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{inquiry.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Zuletzt angesehen</h2>
            <Link href="/dashboard/gesehen" className="text-sm font-semibold text-pine hover:underline">
              Alle
            </Link>
          </div>
          {views.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Öffne ein Exposé, dann steht es hier.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {views.slice(0, 3).map((vehicle) => (
                <li key={vehicle.id}>
                  <Link href={vehicle.available ? `/fahrzeug/${vehicle.id}` : "/dashboard/gesehen"} className="block rounded-2xl border border-line bg-card px-4 py-3 hover:bg-sand">
                    <p className="text-sm font-semibold">{vehicle.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {vehicle.price !== null ? formatPrice(vehicle.price) : "Nicht mehr öffentlich"} · {formatDateTime(vehicle.savedAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/suche" className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-sand">
          Fahrzeuge suchen
        </Link>
        <Link href="/inserieren" className="inline-flex h-11 items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper">
          Fahrzeug inserieren
        </Link>
      </div>
    </div>
  );
}
