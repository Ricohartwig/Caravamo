import type { Metadata } from "next";
import Link from "next/link";
import { PackageCatalog } from "@/components/packages/PackageCatalog";

export const metadata: Metadata = {
  title: "Preise für Händler",
  description: "Einzelne Inserate oder Monatspakete für 3 bis 200 Fahrzeuge auf Caravamo.",
};

export default function PreisePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-copper-dark">Händler</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Pakete für gewerbliche Anbieter</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        Einzelne Fahrzeuge bleiben buchbar. Wer mehrere Inserate gleichzeitig online stellt, nimmt ein Monatspaket. Je größer das Paket, desto niedriger der Preis je Fahrzeug.
      </p>
      <div className="mt-8">
        <PackageCatalog booking="login" />
      </div>
      <p className="mt-8 text-sm text-muted">
        Rechnungen, Kündigung und der Wechsel in ein anderes Paket laufen nach der Buchung über das Stripe-Kundenportal.{" "}
        <Link href="/registrieren" className="font-semibold text-pine hover:underline">
          Als Händler registrieren
        </Link>
      </p>
    </div>
  );
}
