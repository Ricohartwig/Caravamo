"use client";

import { useState } from "react";
import { VehiclePlaceholder } from "@/components/VehiclePlaceholder";
import type { GalleryShot, VehicleType } from "@/lib/vehicles";

type VehicleGalleryProps = {
  title: string;
  type: VehicleType;
  shots: readonly [GalleryShot, GalleryShot, GalleryShot, GalleryShot];
};

export function VehicleGallery({ title, type, shots }: VehicleGalleryProps) {
  const [active, setActive] = useState(0);
  const current = shots[active];

  return (
    <div>
      <VehiclePlaceholder
        title={title}
        type={type}
        tone={current.tone}
        label={current.label}
      />
      <ul className="mt-3 grid grid-cols-4 gap-2">
        {shots.map((shot, index) => {
          const selected = index === active;
          return (
            <li key={shot.label}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={selected}
                aria-label={`Ansicht ${shot.label}`}
                className={`w-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine ${
                  selected ? "ring-2 ring-pine ring-offset-2" : "opacity-80"
                }`}
              >
                <VehiclePlaceholder
                  title={title}
                  type={type}
                  tone={shot.tone}
                  label={shot.label}
                  decorative
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
