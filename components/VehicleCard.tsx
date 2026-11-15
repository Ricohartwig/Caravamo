import Image from "next/image";
import Link from "next/link";
import { Calendar, Gauge } from "lucide-react";
import { VehicleActions } from "@/components/account/VehicleActions";
import { VehiclePlaceholder } from "@/components/VehiclePlaceholder";
import type { CardMarks } from "@/lib/account";
import { formatMileage, formatPrice } from "@/lib/format";

type VehicleCardProps = {
  vehicle: {
    id: string;
    title: string;
    price: number;
    type: string;
    firstRegistration: string;
    mileage: number | null;
    imageUrl?: string | null;
  };
  marks?: CardMarks;
  badge?: string;
};

export function VehicleCard({ vehicle, marks, badge }: VehicleCardProps) {
  const href = `/fahrzeug/${vehicle.id}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
      <div className="relative">
        {vehicle.imageUrl ? (
          <Link href={href} className="relative block aspect-[16/10]">
            <Image src={vehicle.imageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
          </Link>
        ) : (
          <Link href={href} aria-label={vehicle.title} className="block">
            <VehiclePlaceholder title={vehicle.title} type={vehicle.type} tone={0} label="Front" decorative />
          </Link>
        )}
        {marks ? (
          <div className="absolute right-3 top-3 z-10">
            <VehicleActions vehicleId={vehicle.id} marks={marks} />
          </div>
        ) : null}
      </div>
      <Link href={href} className="flex flex-1 flex-col p-4 hover:bg-sand/40">
        <p className="text-xl font-semibold tracking-tight text-ink">{formatPrice(vehicle.price)}</p>
        <h2 className="mt-1 text-base font-medium leading-6">{vehicle.title}</h2>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Calendar aria-hidden="true" className="size-4 shrink-0" />
          Erstzulassung {vehicle.firstRegistration}
        </p>
        {vehicle.mileage !== null ? (
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <Gauge aria-hidden="true" className="size-4 shrink-0" />
            {formatMileage(vehicle.mileage)}
          </p>
        ) : null}
        {badge ? <p className="mt-3 text-sm font-medium text-pine">{badge}</p> : null}
      </Link>
    </article>
  );
}
