import Link from "next/link";
import { Caravan, Store, Search } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
import { vehicleTypes } from "@/lib/vehicles";

const steps = [
  {
    title: "Suchen",
    text: "Marke, Modell und Fahrzeugtyp grenzen die Angebote ein.",
    icon: Search,
  },
  {
    title: "Vergleichen",
    text: "Preis, Erstzulassung und Kilometerstand stehen auf jeder Karte.",
    icon: Caravan,
  },
  {
    title: "Inserieren",
    text: "Privatpersonen und Händler starten den Verkauf am selben Ort.",
    icon: Store,
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-pine-deep via-[#1d4f44] to-[#a35a32] text-foam">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pb-20 sm:pt-20">
          <p className="text-sm font-medium tracking-wide text-foam/80">
            Marktplatz für Privat und Gewerbe
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Fahrzeuge, die zur Strecke passen.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-foam/85">
            Wohnmobile, Wohnwagen, Pkw und Transporter von Privat und Händlern.
            Die Suche führt direkt in die Angebote.
          </p>
          <SearchBox />
          <ul className="mt-4 flex flex-wrap gap-2">
            {vehicleTypes.map((type) => (
              <li key={type}>
                <Link
                  href={`/suche?typ=${encodeURIComponent(type)}`}
                  className="inline-flex rounded-full border border-white/30 px-3 py-1.5 text-sm text-foam hover:bg-white/10"
                >
                  {type}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <Link
              href="/suche"
              className="text-sm font-medium text-foam underline-offset-4 hover:underline"
            >
              Alle Angebote ansehen
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-3">
        {steps.map((step) => (
          <article
            key={step.title}
            className="rounded-2xl border border-line bg-card p-5"
          >
            <step.icon aria-hidden="true" className="size-5 text-pine" />
            <h2 className="mt-3 text-lg font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
          </article>
        ))}
      </section>
    </>
  );
}
