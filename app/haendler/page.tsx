import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { listDealers } from "@/lib/dealers";
import { formatOfferCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Händler",
  description: "Gewerbliche Anbieter auf Caravamo, mit Betrieb, Standort und Angeboten.",
};

export default function HaendlerPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted">Händler werden geladen.</p>}>
      <DealerDirectory />
    </Suspense>
  );
}

async function DealerDirectory() {
  const dealers = await listDealers();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-copper-dark">Gewerbe</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Händler auf Caravamo</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        Jeder Händler mit Firmenname und Ort hat eine eigene Seite: Logo, Öffnungszeiten, Impressum und die aktuell aktiven Inserate.
      </p>
      <Link
        href="/registrieren"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-copper-dark px-5 text-sm font-semibold text-foam hover:bg-copper"
      >
        Als Händler registrieren
      </Link>
      {dealers.length === 0 ? (
        <p className="mt-10 text-sm text-muted">Sobald ein Händler Firmenname und Ort speichert, erscheint er hier.</p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {dealers.map((dealer) => (
            <li key={dealer.id}>
              <Link href={`/haendler/${dealer.id}`} className="block h-full rounded-2xl border border-line bg-card p-5 hover:bg-sand">
                <div className="flex items-center gap-3">
                  {dealer.logoUrl ? (
                    <Image
                      src={dealer.logoUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-xl border border-line bg-foam object-contain p-1"
                    />
                  ) : null}
                  <h2 className="text-lg font-semibold">
                    {dealer.companyName}
                    {dealer.verified ? <span className="ml-2 align-middle text-xs font-semibold text-pine">Verifiziert</span> : null}
                  </h2>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                  <MapPin aria-hidden="true" className="size-4 text-pine" />
                  {[dealer.postalCode, dealer.city].filter(Boolean).join(" ")}
                </p>
                {dealer.about ? <p className="mt-3 line-clamp-3 text-sm leading-6">{dealer.about}</p> : null}
                <p className="mt-3 text-sm font-semibold text-pine">{formatOfferCount(dealer.offerCount)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
