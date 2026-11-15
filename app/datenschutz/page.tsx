import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Datenschutz",
};

export default function DatenschutzPage() {
  return (
    <LegalDocument title="Datenschutz">
      <p>
        Dieses Grundgerüst speichert keine Inserate, keine Nachrichten und keine
        Zugangsdaten. Die angezeigten Fahrzeuge liegen fest im Code.
      </p>
      <p>
        Sobald Supabase angeschlossen wird, beschreibt diese Seite, welche Daten
        ein Konto, ein Inserat und eine Nachricht enthalten und wie lange sie
        bleiben.
      </p>
    </LegalDocument>
  );
}
