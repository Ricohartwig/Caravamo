import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { VehicleCard } from "@/components/VehicleCard";
import { loadCardMarks, marksFor } from "@/lib/account";
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
    openGraph: {
      title: dealer.companyName,
      description,
      url: path,
      type: "website",
      locale: "de_DE",
      images: dealer.logoUrl ? [{ url: dealer.logoUrl, alt: `Logo von ${dealer.companyName}` }] : undefined,
    },
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
  const [offers, marks] = await Promise.all([listDealerOffers(dealer.id), loadCardMarks(`/haendler/${dealer.id}`)]);
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
      <div className="mt-1 flex items-start gap-4">
        {dealer.logoUrl ? (
          <Image
            src={dealer.logoUrl}
            alt={`Logo von ${dealer.companyName}`}
            width={96}
            height={96}
            className="size-20 shrink-0 rounded-2xl border border-line bg-card object-contain p-2 sm:size-24"
          />
        ) : null}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{dealer.companyName}</h1>
          {dealer.verified ? (
            <p className="mt-2 inline-flex rounded-full bg-pine px-2.5 py-1 text-xs font-semibold text-foam">Verifiziert</p>
          ) : null}
          <p className="mt-2 text-muted">
            Ansprechpartner {dealer.contactName}
            {dealer.memberSince ? ` · dabei seit ${formatDay(dealer.memberSince)}` : ""}
          </p>
        </div>
      </div>
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
          <Impressum dealer={dealer} address={address} />
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Angebote</h2>
            {offers.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Aktuell keine öffentlichen Inserate.</p>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {offers.map((offer) => (
                  <li key={offer.id}>
                    <VehicleCard vehicle={offer} marks={marksFor(offer.id, marks)} />
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

function Impressum({ dealer, address }: { dealer: PublicDealer; address: string[] }) {
  const rows = [
    ["Firma", dealer.companyName],
    ["Rechtsform", dealer.legalForm],
    ["Anschrift", address.join(", ") || null],
    ["Telefon", dealer.phone],
    ["E-Mail", dealer.publicEmail],
    ["Website", dealer.website],
    ["Vertreten durch", dealer.representedBy],
    ["Registergericht", dealer.registerCourt],
    ["Registernummer", dealer.registerNumber],
    ["USt-IdNr.", dealer.vatId],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <section className="mt-8" id="impressum">
      <h2 className="text-lg font-semibold">Impressum</h2>
      <dl className="mt-3 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-card">
        {rows.map(([term, value]) => (
          <div key={term} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
            <dt className="text-sm text-muted">{term}</dt>
            <dd className="text-sm">
              {term === "E-Mail" ? (
                <a href={`mailto:${value}`} className="inline-flex items-center gap-2 font-semibold text-pine hover:underline">
                  <Mail aria-hidden="true" className="size-4" />
                  {value}
                </a>
              ) : term === "Website" ? (
                <a href={value} className="font-semibold text-pine hover:underline" rel="noreferrer">
                  {value.replace(/^https:\/\//, "")}
                </a>
              ) : term === "Telefon" ? (
                <a href={`tel:${value.replace(/\s+/g, "")}`} className="font-semibold text-pine hover:underline">
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted">Angaben des Händlers. Caravamo prüft das Impressum nicht.</p>
    </section>
  );
}
