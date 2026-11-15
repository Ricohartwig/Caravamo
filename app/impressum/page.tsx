import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  return (
    <LegalDocument title="Impressum">
      <p>
        Caravamo by CarWo Marketplace. Anbieterangaben, Anschrift und
        Kontakt werden vor dem öffentlichen Start ergänzt.
      </p>
      <p>
        Verantwortlich für den Inhalt dieser Vorschau ist das Projektteam von
        Caravamo. Eine ladungsfähige Anschrift steht hier noch nicht.
      </p>
    </LegalDocument>
  );
}
