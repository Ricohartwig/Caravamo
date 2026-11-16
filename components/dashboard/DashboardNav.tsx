"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Caravan, Eye, Heart, LayoutDashboard, MessageSquare, Receipt, Scale, Search, Shield, UserRound } from "lucide-react";
import type { AccountCounts } from "@/lib/account";

const items = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/merkliste", label: "Meine gemerkten Fahrzeuge", icon: Heart, count: "favorites" },
  { href: "/dashboard/suchen", label: "Suchen", icon: Search, count: "searches" },
  { href: "/dashboard/anfragen", label: "Anfragen", icon: MessageSquare, count: "unread" },
  { href: "/dashboard/gesehen", label: "Angesehen", icon: Eye, count: "views" },
  { href: "/dashboard/vergleich", label: "Vergleich", icon: Scale, count: "comparisons" },
  { href: "/dashboard/inserate", label: "Inserate", icon: Caravan, count: "listings" },
  { href: "/dashboard/pakete", label: "Pakete", icon: Receipt },
  { href: "/dashboard/profil", label: "Profil", icon: UserRound },
] as const;

export function DashboardNav({ counts, admin = false }: { counts: AccountCounts; admin?: boolean }) {
  const pathname = usePathname();
  const entries = admin
    ? [{ href: "/admin", label: "Administration", icon: Shield }, ...items]
    : items;

  return (
    <nav aria-label="Konto" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {entries.map((item) => {
        const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const count = "count" in item ? counts[item.count] : 0;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${
              active ? "bg-pine text-foam" : "bg-card text-ink hover:bg-sand"
            }`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {item.label}
            {count > 0 ? (
              <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-foam/20" : "bg-sand text-pine"}`}>
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
