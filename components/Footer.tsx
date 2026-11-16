import Link from "next/link";

const legalLinks = [
  { href: "/preise", label: "Preise" },
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-pine-deep text-foam">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold tracking-tight">Caravamo</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-foam/75">
            Marktplatz für Fahrzeuge von Privat und Gewerbe. Caravamo by CarWo
            Marketplace.
          </p>
        </div>
        <nav aria-label="Rechtliches">
          <ul className="flex flex-col gap-2 text-sm">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-foam/85 underline-offset-4 hover:text-foam hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
