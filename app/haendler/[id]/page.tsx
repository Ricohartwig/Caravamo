import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Globe, MapPin, Phone } from "lucide-react";
import { VehicleCard } from "@/components/VehicleCard";
import { dealerJsonLd, getDealer, listDealerOffers, type PublicDealer } from "@/lib/dealers";
import { formatDay, formatOfferCount } from "@/lib/format";
import { serializeJsonLd } from "@/lib/listing-seo";
import { isVehicleId } from "@/lib/owned-listings";

export const instant = false;

const hiddenDealer: Metadata = {
  title: "Händler nicht gefunden",
  robots: { index: false, follow: false },
};

export async function generateMetadata({ params }: PageProps<"/haendler/[id]">): Promise<Metadata> {
  const { id } = await params;
  const dealer = isVehicleId(id) ? await getDealer(id) : null;
  if (!dealer) {
    return hiddenDealer;
  }

  const description =
    dealer.about ?? `${dealer.companyName} in ${dealer.city}. ${formatOfferCount(dealer.offerCount)} auf Caravamo.`;
  const path = `/haendler/${dealer.id}`;

  return {
    title: { absolute: `${dealer.companyName} in ${dealer.city}` },
    description,
    alternates: { canonical: path },
    openGraph: { title: dealer.companyName, description, url: path, type: "website", locale: "de_DE" },
  };
}

export default async function DealerPage({ params }: PageProps<"/haendler/[id]">) {
  const { id } = await params;
  if (!isVehicleId(id)) {
    notFound();
  }

  const dealer = await getDealer(id);
  if (!dealer) {
    notFound();
  }

  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted">Angebote werden geladen.</p>}>
      <DealerBody dealer={dealer} />
    </Suspense>
  );
}

async function DealerBody({ dealer }: { dealer: PublicDealer }) {
  const offers = await listDealerOffers(dealer.id);
  const address = [dealer.street, [dealer.postalCode, dealer.city].filter(Boolean).join(" ")].filter(
    (line): line is string => Boolean(line),
  );

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(dealerJsonLd(dealer)) }} />
      <p className="text-sm text-muted">
        <Link href="/haendler" className="font-medium text-pine hover:underline">
          Händler
        </Link>
      </p>
      <p className="mt-3 text-sm font-medium text-copper-dark">Händler</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{dealer.companyName}</h1>
      <p className="mt-2 text-muted">
        Ansprechpartner {dealer.contactName}
        {dealer.memberSince ? ` · dabei seit ${formatDay(dealer.memberSince)}` : ""}
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {dealer.about ? (
            <section>
              <h2 className="text-lg font-semibold">Über den Betrieb</h2>
              <p className="mt-2 max-w-3xl whitespace-pre-wrap leading-7">{dealer.about}</p>
            </section>
          ) : null}
          {dealer.services.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {dealer.services.map((service) => (
                <li key={service.id} className="rounded-full bg-sand px-3 py-1 text-sm font-medium text-pine">
                  {service.label}
                </li>
              ))}
            </ul>
          ) : null}
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Angebote</h2>
            {offers.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Aktuell keine öffentlichen Inserate.</p>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {offers.map((offer) => (
                  <li key={offer.id}>
                    <VehicleCard vehicle={offer} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-line bg-card p-5">
          <h2 className="text-lg font-semibold">Kontakt</h2>
          {address.length > 0 ? (
            <p className="mt-4 flex items-start gap-2 text-sm leading-6">
              <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0 text-pine" />
              <span>
                {address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </p>
          ) : null}
          {dealer.phone ? (
            <p className="mt-3 text-sm">
              <a href={`tel:${dealer.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 font-semibold text-pine hover:underline">
                <Phone aria-hidden="true" className="size-4" />
                {dealer.phone}
              </a>
            </p>
          ) : null}
          {dealer.website ? (
            <p className="mt-3 text-sm">
              <a href={dealer.website} className="inline-flex items-center gap-2 font-semibold text-pine hover:underline" rel="noreferrer">
                <Globe aria-hidden="true" className="size-4" />
                Website
              </a>
            </p>
          ) : null}
          {dealer.openingHours ? (
            <p className="mt-4 flex items-start gap-2 text-sm leading-6">
              <Clock aria-hidden="true" className="mt-1 size-4 shrink-0 text-pine" />
              <span className="whitespace-pre-wrap">{dealer.openingHours}</span>
            </p>
          ) : null}
          {dealer.vatId ? <p className="mt-4 text-sm text-muted">USt-IdNr. {dealer.vatId}</p> : null}
        </aside>
      </div>
    </article>
  );
}
