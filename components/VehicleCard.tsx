import Link from "next/link";
import { Calendar, Gauge } from "lucide-react";
import { VehiclePlaceholder } from "@/components/VehiclePlaceholder";
import { formatMileage, formatPrice } from "@/lib/format";
import type { Vehicle } from "@/lib/vehicles";

type VehicleCardProps = {
  vehicle: Vehicle;
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const cover = vehicle.shots[0];

  return (
    <article className="h-full">
      <Link
        href={`/fahrzeug/${vehicle.id}`}
        aria-label={`${vehicle.title}, ${formatPrice(vehicle.price)}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-shadow hover:shadow-md"
      >
        <VehiclePlaceholder
          title={vehicle.title}
          type={vehicle.type}
          tone={cover.tone}
          label={cover.label}
          decorative
        />
        <div className="flex flex-1 flex-col p-4">
          <p className="text-xl font-semibold tracking-tight text-ink">
            {formatPrice(vehicle.price)}
          </p>
          <h2 className="mt-1 text-base font-medium leading-6">{vehicle.title}</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Calendar aria-hidden="true" className="size-4 shrink-0" />
            Erstzulassung {vehicle.firstRegistration}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <Gauge aria-hidden="true" className="size-4 shrink-0" />
            {formatMileage(vehicle.mileage)}
          </p>
        </div>
      </Link>
    </article>
  );
}
