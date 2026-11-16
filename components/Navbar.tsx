import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, Heart, Menu, Scale, Search } from "lucide-react";
import { signOut } from "@/actions/auth";
import { listingCategories } from "@/lib/listing-options";

export type NavbarUser = {
  email: string;
  admin: boolean;
};

const infoLinks = [
  { href: "/preise", label: "Preise" },
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
] as const;

export function Navbar({ user }: { user: NavbarUser | null }) {
  const savedHref = user ? "/dashboard/merkliste" : "/login?next=%2Fdashboard%2Fmerkliste";
  const compareHref = user ? "/dashboard/vergleich" : "/login?next=%2Fdashboard%2Fvergleich";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-foam">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-ink">
          <span className="grid size-8 place-items-center rounded-lg bg-pine text-sm text-foam">C</span>
          Caravamo
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden flex-1 items-center justify-center gap-4 lg:flex">
          <NavMenu label="Fahrzeugsuche">
            <MenuLink href="/suche">
              Alle Angebote
            </MenuLink>
            {listingCategories.map((type) => (
              <MenuLink key={type} href={`/suche?type=${encodeURIComponent(type)}`}>
                {type}
              </MenuLink>
            ))}
          </NavMenu>
          <Link href="/haendler" className="text-sm font-medium text-muted hover:text-foreground">
            Händler finden
          </Link>
          <NavMenu label="Informieren">
            {infoLinks.map((link) => (
              <MenuLink key={link.href} href={link.href}>
                {link.label}
              </MenuLink>
            ))}
          </NavMenu>
          <Link href="/registrieren" className="text-sm font-medium text-muted hover:text-foreground">
            Händler werden
          </Link>
          {user?.admin ? (
            <Link href="/admin" className="text-sm font-medium text-muted hover:text-foreground">
              Administration
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <IconLink href="/suche" label="Suche">
            <Search aria-hidden="true" className="size-4" />
          </IconLink>
          <IconLink href={savedHref} label="Merkliste">
            <Heart aria-hidden="true" className="size-4" />
          </IconLink>
          <IconLink href={compareHref} label="Vergleich">
            <Scale aria-hidden="true" className="size-4" />
          </IconLink>
          <AccountLinks user={user} />
        </div>

        <details className="ml-auto lg:hidden">
          <summary className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-xl border border-line [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only">Menü</span>
          </summary>
          <nav aria-label="Mobilnavigation" className="absolute inset-x-0 top-16 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-line bg-foam px-4 py-3 shadow-lg">
            <ul className="flex flex-col gap-1">
              <li className="px-3 pt-2 text-xs font-semibold tracking-wide text-muted">Fahrzeugsuche</li>
              <li>
                <Link href="/suche" className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand">
                  Alle Angebote
                </Link>
              </li>
              {listingCategories.map((type) => (
                <li key={type}>
                  <Link href={`/suche?type=${encodeURIComponent(type)}`} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand">
                    {type}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/haendler" className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand">
                  Händler finden
                </Link>
              </li>
              <li>
                <Link href="/registrieren" className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand">
                  Händler werden
                </Link>
              </li>
              <li>
                <Link href={savedHref} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand">
                  Merkliste
                </Link>
              </li>
              <li>
                <Link href={compareHref} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand">
                  Vergleich
                </Link>
              </li>
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand">
                    {link.label}
                  </Link>
                </li>
              ))}
              {user?.admin ? (
                <li>
                  <Link href="/admin" className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand">
                    Administration
                  </Link>
                </li>
              ) : null}
              <li className="px-3 py-2">
                <AccountLinks user={user} stacked />
              </li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}

function NavMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-muted marker:content-none hover:text-foreground [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown aria-hidden="true" className="size-3.5 group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 top-full z-50 mt-2 min-w-52 rounded-2xl border border-line bg-card p-2 shadow-lg">
        {children}
      </div>
    </details>
  );
}

function MenuLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-sand">
      {children}
    </Link>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-xl text-foreground hover:bg-sand"
    >
      {children}
    </Link>
  );
}

function AccountLinks({
  user,
  stacked = false,
  onNavigate,
}: {
  user: NavbarUser | null;
  stacked?: boolean;
  onNavigate?: () => void;
}) {
  if (!user) {
    return (
      <>
        <Link
          href="/login"
          onClick={onNavigate}
          className={
            stacked
              ? "block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand"
              : "px-2 text-sm font-semibold text-foreground hover:text-pine"
          }
        >
          Login
        </Link>
        <Link
          href="/inserieren"
          onClick={onNavigate}
          className="inline-flex items-center justify-center rounded-xl bg-copper-dark px-3.5 py-2 text-sm font-semibold text-foam hover:bg-copper"
        >
          Fahrzeug inserieren
        </Link>
      </>
    );
  }

  return (
    <div className={stacked ? "flex flex-col gap-2" : "flex items-center gap-3"}>
      <p className="max-w-32 truncate text-sm text-muted" title={user.email}>
        {user.email}
      </p>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={
          stacked
            ? "block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand"
            : "text-sm font-semibold text-foreground hover:text-pine"
        }
      >
        Mein Konto
      </Link>
      <form action={signOut}>
        <button type="submit" className="text-sm font-semibold text-foreground hover:text-pine">
          Abmelden
        </button>
      </form>
      <Link
        href="/inserieren"
        onClick={onNavigate}
        className="inline-flex items-center justify-center rounded-xl bg-copper-dark px-3.5 py-2 text-sm font-semibold text-foam hover:bg-copper"
      >
        Fahrzeug inserieren
      </Link>
    </div>
  );
}
