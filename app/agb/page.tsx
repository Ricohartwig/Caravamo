import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "AGB",
};

export default function AgbPage() {
  return (
    <LegalDocument title="AGB">
      <p>
        Die Allgemeinen Geschäftsbedingungen für Käufer, private Verkäufer und
        Händler werden vor dem Start ergänzt.
      </p>
      <p>
        Bis dahin kommt über Caravamo kein Vertrag zustande. Die Angebote sind
        Beispiele und nicht käuflich.
      </p>
    </LegalDocument>
  );
}
