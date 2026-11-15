import type { ReactNode } from "react";

type LegalDocumentProps = {
  title: string;
  children: ReactNode;
};

export function LegalDocument({ title, children }: LegalDocumentProps) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-sm font-medium text-copper-dark">Platzhalter</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted">
        Mustertext für das Grundgerüst. Keine Rechtsberatung und kein
        verbindlicher Vertragstext.
      </p>
      <div className="mt-8 space-y-4 text-base leading-7">{children}</div>
    </article>
  );
}
