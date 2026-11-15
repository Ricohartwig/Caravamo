import type { Metadata } from "next";
import { ListingForm } from "@/components/listing/ListingForm";

export const metadata: Metadata = {
  title: "Fahrzeug inserieren",
  description: "Wohnmobil, Wohnwagen, Zeltanhänger oder Kabine bei Caravamo einstellen.",
};

export default function InserierenPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-copper-dark">Verkauf</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Fahrzeug einstellen
      </h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Die Angaben gehören zu deinem Konto. Danach geht es zur Bezahlung. Öffentlich wird das Inserat erst, wenn Stripe die Zahlung bestätigt: 4,99 € für Privat und 6,99 € für Händler, jeweils 30 Tage.
      </p>
      <ListingForm />
    </div>
  );
}
