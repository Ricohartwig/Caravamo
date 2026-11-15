import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fahrzeug inserieren",
  description: "Verkaufsstart für Privat und Händler auf Caravamo.",
};

const steps = [
  {
    title: "Fahrzeugdaten",
    text: "Marke, Modell, Typ, Preis, Baujahr und Kilometerstand.",
  },
  {
    title: "Bilder",
    text: "Mehrere Aufnahmen, eine davon als Hauptbild.",
  },
  {
    title: "Veröffentlichen",
    text: "Sobald das Konto über Supabase angemeldet ist, geht das Inserat online.",
  },
] as const;

export default function InserierenPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-copper-dark">Verkauf</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Fahrzeug verkaufen, ohne Umwege.
      </h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Privat und Gewerbe starten hier. Diese Seite ist nur mit Anmeldung
        erreichbar. Das Speichern des Inserats folgt im nächsten Schritt.
      </p>
      <a
        href="#einstellen"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-copper-dark px-5 text-sm font-semibold text-foam hover:bg-copper"
      >
        Jetzt Fahrzeug einstellen
      </a>

      <section id="einstellen" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold">So geht es weiter</h2>
        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-line bg-card p-4"
            >
              <p className="text-sm font-medium text-pine">Schritt {index + 1}</p>
              <h3 className="mt-1 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
