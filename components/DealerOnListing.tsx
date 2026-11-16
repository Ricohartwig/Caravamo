import Image from "next/image";
import Link from "next/link";
import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { formatDay } from "@/lib/format";
import type { PublicDealer } from "@/lib/dealers";

export function DealerOnListing({ dealer }: { dealer: PublicDealer }) {
  const address = [dealer.street, [dealer.postalCode, dealer.city].filter(Boolean).join(" ")].filter(
    (line): line is string => Boolean(line),
  );
  const since = dealer.memberSince ? formatDay(dealer.memberSince) : "";

  return (
    <section className="mt-10 rounded-2xl border border-line bg-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">Über diesen Händler</h2>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="flex items-start gap-4">
            {dealer.logoUrl ? (
              <Image
                src={dealer.logoUrl}
                alt=""
                width={72}
                height={72}
                className="size-16 shrink-0 rounded-2xl border border-line bg-foam object-contain p-1"
              />
            ) : null}
            <div>
              <h3 className="text-lg font-semibold">
                <Link href={`/haendler/${dealer.id}`} className="hover:underline">
                  {dealer.companyName}
                </Link>
              </h3>
              {dealer.verified ? (
                <p className="mt-1 inline-flex rounded-full bg-pine px-2.5 py-1 text-xs font-semibold text-foam">Verifiziert</p>
              ) : null}
              <p className="mt-2 text-sm text-muted">Ansprechpartner {dealer.contactName}</p>
            </div>
          </div>
          {dealer.about ? <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-7">{dealer.about}</p> : null}
          {dealer.services.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {dealer.services.map((service) => (
                <li key={service.id} className="rounded-full bg-sand px-3 py-1 text-sm font-medium text-pine">
                  {service.label}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4">
            <Link href={`/haendler/${dealer.id}`} className="text-sm font-semibold text-pine hover:underline">
              Zur Händlerseite
            </Link>
          </p>
        </div>
        <dl className="space-y-3 text-sm">
          {address.length > 0 ? (
            <div className="flex items-start gap-2">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-pine" />
              <div>
                <dt className="sr-only">Adresse</dt>
                <dd>
                  {address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </dd>
              </div>
            </div>
          ) : null}
          {dealer.phone ? (
            <div>
              <dt className="sr-only">Telefon</dt>
              <dd>
                <a href={`tel:${dealer.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 font-semibold text-pine hover:underline">
                  <Phone aria-hidden="true" className="size-4" />
                  {dealer.phone}
                </a>
              </dd>
            </div>
          ) : null}
          {dealer.publicEmail ? (
            <div>
              <dt className="sr-only">E-Mail</dt>
              <dd>
                <a href={`mailto:${dealer.publicEmail}`} className="inline-flex items-center gap-2 font-semibold text-pine hover:underline">
                  <Mail aria-hidden="true" className="size-4" />
                  {dealer.publicEmail}
                </a>
              </dd>
            </div>
          ) : null}
          {dealer.website ? (
            <div>
              <dt className="sr-only">Website</dt>
              <dd>
                <a href={dealer.website} rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-pine hover:underline">
                  <Globe aria-hidden="true" className="size-4" />
                  Website
                </a>
              </dd>
            </div>
          ) : null}
          {dealer.openingHours ? (
            <div className="flex items-start gap-2">
              <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-pine" />
              <div>
                <dt className="text-xs font-semibold text-muted">Öffnungszeiten</dt>
                <dd className="mt-1 whitespace-pre-wrap leading-6">{dealer.openingHours}</dd>
              </div>
            </div>
          ) : null}
          {since ? (
            <div>
              <dt className="text-xs font-semibold text-muted">Dabei seit</dt>
              <dd className="mt-1">{since}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}
