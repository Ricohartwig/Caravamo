"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/suche", label: "Fahrzeuge suchen" },
  { href: "/haendler", label: "Für Händler" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-foam">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-ink"
          onClick={closeMenu}
        >
          <span className="grid size-8 place-items-center rounded-lg bg-pine text-sm text-foam">
            C
          </span>
          Caravamo
        </Link>

        <nav
          aria-label="Hauptnavigation"
          className="hidden flex-1 items-center justify-center gap-6 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-semibold text-foreground hover:text-pine"
          >
            Login
          </Link>
          <Link
            href="/inserieren"
            className="inline-flex items-center rounded-xl bg-copper-dark px-3.5 py-2 text-sm font-semibold text-foam hover:bg-copper"
          >
            Fahrzeug inserieren
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex size-11 items-center justify-center rounded-xl border border-line md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
          <span className="sr-only">
            {open ? "Menü schließen" : "Menü öffnen"}
          </span>
        </button>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Mobilnavigation"
        hidden={!open}
        className="border-t border-line px-4 py-3 md:hidden"
      >
        <ul className="flex flex-col gap-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={closeMenu}
                className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/login"
              onClick={closeMenu}
              className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand"
            >
              Login
            </Link>
          </li>
          <li className="pt-2">
            <Link
              href="/inserieren"
              onClick={closeMenu}
              className="inline-flex w-full items-center justify-center rounded-xl bg-copper-dark px-3.5 py-3 text-sm font-semibold text-foam hover:bg-copper"
            >
              Fahrzeug inserieren
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
