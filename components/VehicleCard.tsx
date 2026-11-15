import Image from "next/image";
import Link from "next/link";
import { Calendar, Gauge } from "lucide-react";
import { VehiclePlaceholder } from "@/components/VehiclePlaceholder";
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
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <article className="h-full">
      <Link
        href={`/fahrzeug/${vehicle.id}`}
        aria-label={`${vehicle.title}, ${formatPrice(vehicle.price)}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-shadow hover:shadow-md"
      >
        {vehicle.imageUrl ? (
          <span className="relative block aspect-[16/10]">
            <Image src={vehicle.imageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
          </span>
        ) : (
          <VehiclePlaceholder title={vehicle.title} type={vehicle.type} tone={0} label="Front" decorative />
        )}
        <div className="flex flex-1 flex-col p-4">
          <p className="text-xl font-semibold tracking-tight text-ink">
            {formatPrice(vehicle.price)}
          </p>
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
        </div>
      </Link>
    </article>
  );
}
