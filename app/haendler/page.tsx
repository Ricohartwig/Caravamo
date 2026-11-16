import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { DealerMap, mapPins } from "@/components/DealerMap";
import { listDealers, type PublicDealer } from "@/lib/dealers";
import { formatOfferCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Händler finden",
  description: "Fachhändler auf der Karte, mit Ort, Öffnungszeiten und Angeboten.",
};

export default function HaendlerPage({ searchParams }: PageProps<"/haendler">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted">Händler werden geladen.</p>}>
      <DealerDirectory searchParams={searchParams} />
    </Suspense>
  );
}

async function DealerDirectory({ searchParams }: { searchParams: PageProps<"/haendler">["searchParams"] }) {
  const params = await searchParams;
  const query = firstQuery(params.q).slice(0, 80);
  const focus = firstQuery(params.fokus);
  const dealers = (await listDealers()).filter((dealer) => matchesDealer(dealer, query));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <p className="text-sm font-medium text-copper-dark">Fachhändler</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Händler finden</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Betrieb, Ort und Öffnungszeiten. Die Karte zeigt die Lage nach Postleitzahl.
      </p>
      <form action="/haendler" method="get" className="mt-6 flex flex-col gap-2 sm:flex-row" aria-label="Händler suchen">
        <label className="sr-only" htmlFor="haendler-suche">
          Händlername oder Ort
        </label>
        <input
          id="haendler-suche"
          name="q"
          defaultValue={query}
          placeholder="Händlername oder Ort"
          className="h-12 flex-1 rounded-xl border border-line bg-card px-3"
        />
        <button type="submit" className="inline-flex h-12 items-center justify-center rounded-xl bg-pine px-5 text-sm font-semibold text-foam">
          Suchen
        </button>
        <Link
          href="/registrieren"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-sand"
        >
          Händler werden
        </Link>
      </form>
      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {dealers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card px-5 py-8 text-sm text-muted">
            {query ? "Kein Händler passt zu dieser Suche." : "Sobald ein Händler Firmenname und Ort speichert, erscheint er hier."}
          </p>
        ) : (
          <ul className="max-h-[40rem] space-y-3 overflow-y-auto">
            {dealers.map((dealer, index) => (
              <li key={dealer.id} className={focus === dealer.id ? "rounded-2xl ring-2 ring-pine" : ""}>
                <Link href={`/haendler/${dealer.id}`} className="block rounded-2xl border border-line bg-card p-4 hover:bg-sand">
                  <div className="flex items-start gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pine text-xs font-semibold text-foam">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-semibold">
                        {dealer.companyName}
                        {dealer.verified ? <span className="ml-2 text-xs font-semibold text-pine">Verifiziert</span> : null}
                      </h2>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                        <MapPin aria-hidden="true" className="size-4 text-pine" />
                        {[dealer.postalCode, dealer.city].filter(Boolean).join(" ")}
                        {dealer.street ? `, ${dealer.street}` : ""}
                      </p>
                      {dealer.openingHours ? (
                        <p className="mt-2 flex items-start gap-2 text-sm leading-5 text-muted">
                          <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-pine" />
                          <span className="line-clamp-3 whitespace-pre-wrap">{dealer.openingHours}</span>
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm font-semibold text-pine">{formatOfferCount(dealer.offerCount)}</p>
                    </div>
                    {dealer.logoUrl ? (
                      <Image
                        src={dealer.logoUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="ml-auto size-12 shrink-0 rounded-xl border border-line bg-foam object-contain p-1"
                      />
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <DealerMap pins={mapPins(dealers)} activeId={focus} />
      </div>
    </div>
  );
}

function matchesDealer(dealer: PublicDealer, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = [dealer.companyName, dealer.city, dealer.postalCode ?? "", dealer.street ?? ""].join(" ").toLocaleLowerCase("de-DE");
  return haystack.includes(query.toLocaleLowerCase("de-DE"));
}

function firstQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}
