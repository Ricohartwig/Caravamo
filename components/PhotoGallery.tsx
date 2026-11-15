"use client";

import { useState } from "react";
import Image from "next/image";

export function PhotoGallery({ title, urls }: { title: string; urls: readonly string[] }) {
  const [active, setActive] = useState(0);
  const current = urls[active] ?? urls[0];

  if (!current) {
    return null;
  }

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
        <Image
          src={current}
          alt={`${title}, Bild ${active + 1}`}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
      {urls.length > 1 ? (
        <ul className="mt-3 grid grid-cols-4 gap-2">
          {urls.map((url, index) => {
            const selected = index === active;
            return (
              <li key={url}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-pressed={selected}
                  aria-label={`Bild ${index + 1}`}
                  className={`w-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine ${
                    selected ? "ring-2 ring-pine ring-offset-2" : "opacity-80"
                  }`}
                >
                  <span className="relative block aspect-[16/10] overflow-hidden rounded-2xl">
                    <Image src={url} alt="" fill sizes="20vw" className="object-cover" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
