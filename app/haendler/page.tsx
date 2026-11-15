import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Für Händler",
  description: "Caravamo für gewerbliche Anbieter.",
};

export default function HaendlerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-copper-dark">B2B</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Für Händler
      </h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Gewerbliche Anbieter stellen dieselben Fahrzeuge ein wie Privatleute.
        Bestand, Preise und Ansprechpartner folgen mit dem Konto. Dieses
        Grundgerüst zeigt den Einstieg.
      </p>
      <ul className="mt-8 space-y-3 text-base leading-7">
        <li className="rounded-2xl border border-line bg-card p-4">
          Mehrere Inserate unter einem Händlerprofil.
        </li>
        <li className="rounded-2xl border border-line bg-card p-4">
          Angebote erscheinen in derselben Suche wie private Fahrzeuge.
        </li>
        <li className="rounded-2xl border border-line bg-card p-4">
          Nachrichten der Interessenten landen im Konto und zusätzlich als E-Mail.
        </li>
      </ul>
      <Link
        href="/inserieren"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-copper-dark px-5 text-sm font-semibold text-foam hover:bg-copper"
      >
        Fahrzeug inserieren
      </Link>
    </div>
  );
}
