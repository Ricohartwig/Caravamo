"use client";

import { useState } from "react";
import { MapPin, MessageSquare } from "lucide-react";
import type { Seller } from "@/lib/vehicles";

type SellerContactProps = {
  seller: Seller;
  vehicleTitle: string;
};

export function SellerContact({ seller, vehicleTitle }: SellerContactProps) {
  const [noted, setNoted] = useState(false);

  return (
    <aside className="h-fit rounded-2xl border border-line bg-card p-5 lg:sticky lg:top-24">
      <p className="text-sm font-medium text-muted">Verkäufer</p>
      <h2 className="mt-1 text-lg font-semibold">{seller.name}</h2>
      <p className="mt-1 text-sm text-muted">{seller.kind}</p>
      {seller.location ? (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <MapPin aria-hidden="true" className="size-4 text-pine" />
          {seller.location}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setNoted(true)}
        disabled={noted}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper disabled:cursor-default disabled:opacity-70"
      >
        <MessageSquare aria-hidden="true" className="size-4" />
        Nachricht senden
      </button>
      <p role="status" className="mt-3 text-sm leading-6 text-muted">
        {noted
          ? `Die Nachricht zu „${vehicleTitle}“ bleibt in diesem Grundgerüst. Der Versand folgt mit Supabase.`
          : "Der Versand ist noch nicht angeschlossen. Es wird keine Nachricht verschickt."}
      </p>
    </aside>
  );
}
