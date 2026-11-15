import Link from "next/link";
import { MapPin } from "lucide-react";
import { InquiryForm } from "@/components/account/InquiryForm";
import { VehicleActions } from "@/components/account/VehicleActions";
import type { CardMarks } from "@/lib/account";

type SellerContactProps = {
  sellerName: string;
  sellerKind: string;
  sellerCity: string | null;
  sellerId: string;
  vehicleId: string;
  viewerId: string | null;
  marks: CardMarks;
};

export function SellerContact({
  sellerName,
  sellerKind,
  sellerCity,
  sellerId,
  vehicleId,
  viewerId,
  marks,
}: SellerContactProps) {
  const ownListing = viewerId !== null && viewerId === sellerId;

  return (
    <aside className="h-fit rounded-2xl border border-line bg-card p-5 lg:sticky lg:top-24">
      <p className="text-sm font-medium text-muted">Verkäufer</p>
      <h2 className="mt-1 text-lg font-semibold">{sellerName}</h2>
      <p className="mt-1 text-sm text-muted">{sellerKind}</p>
      {sellerCity ? (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <MapPin aria-hidden="true" className="size-4 text-pine" />
          {sellerCity}
        </p>
      ) : null}
      <div className="mt-5">
        <VehicleActions vehicleId={vehicleId} marks={marks} variant="stack" />
      </div>
      {ownListing ? (
        <p className="mt-5 text-sm leading-6 text-muted">
          Das ist dein Inserat. Anfragen dazu findest du im{" "}
          <Link href="/dashboard/anfragen" className="font-semibold text-pine hover:underline">
            Konto
          </Link>
          .
        </p>
      ) : viewerId ? (
        <InquiryForm vehicleId={vehicleId} />
      ) : (
        <Link
          href={`/login?next=${encodeURIComponent(`/fahrzeug/${vehicleId}`)}`}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper"
        >
          Anmelden und anfragen
        </Link>
      )}
    </aside>
  );
}
