import type { VehicleType } from "@/lib/vehicles";

const tones = {
  0: "from-[#16352e] via-[#1f6a58] to-[#d7a15a]",
  1: "from-[#1c2a33] via-[#3e6d86] to-[#e6d3b4]",
  2: "from-[#3a241c] via-[#a85a32] to-[#f0d7b8]",
  3: "from-[#2a261f] via-[#6d624e] to-[#efe6d6]",
} as const;

type VehiclePlaceholderProps = {
  title: string;
  type: VehicleType;
  tone: keyof typeof tones;
  label: string;
  decorative?: boolean;
};

export function VehiclePlaceholder({
  title,
  type,
  tone,
  label,
  decorative = false,
}: VehiclePlaceholderProps) {
  return (
    <div
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : `${title}, Ansicht ${label}`}
      className={`relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br ${tones[tone]}`}
    >
      <svg
        viewBox="0 0 640 400"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d="M0 292c120-36 210 18 330-8 110-24 190 22 310-18v134H0Z"
          fill="rgba(255,253,248,0.16)"
        />
        <Silhouette type={type} />
      </svg>
      <p className="absolute left-3 top-3 rounded-full bg-pine-deep/55 px-2.5 py-1 text-xs font-medium text-foam">
        {label}
      </p>
      <p className="absolute bottom-3 left-3 text-sm font-medium text-foam">
        Platzhalter · {type}
      </p>
    </div>
  );
}

function Silhouette({ type }: { type: VehicleType }) {
  if (type === "PKW") {
    return (
      <g>
        <path
          d="M188 214c28-52 62-70 118-70h86c48 0 78 16 104 70H188Z"
          fill="#fbf7ef"
        />
        <rect x="132" y="210" width="392" height="58" rx="18" fill="#fbf7ef" />
        <Wheel cx={214} />
        <Wheel cx={430} />
      </g>
    );
  }

  if (type === "Wohnmobil") {
    return (
      <g>
        <rect x="118" y="128" width="286" height="140" rx="18" fill="#fbf7ef" />
        <path d="M390 176h92c22 0 36 16 42 40v52H390Z" fill="#fbf7ef" />
        <rect x="150" y="150" width="92" height="42" rx="6" fill="#1e3f36" opacity="0.25" />
        <Wheel cx={210} />
        <Wheel cx={456} />
      </g>
    );
  }

  if (type === "Wohnwagen") {
    return (
      <g>
        <rect x="150" y="138" width="300" height="128" rx="16" fill="#fbf7ef" />
        <rect x="176" y="162" width="86" height="48" rx="6" fill="#1e3f36" opacity="0.25" />
        <path d="M450 214h78" stroke="#fbf7ef" strokeWidth="10" strokeLinecap="round" />
        <Wheel cx={230} />
        <Wheel cx={360} />
      </g>
    );
  }

  return (
    <g>
      <rect x="156" y="132" width="250" height="136" rx="14" fill="#fbf7ef" />
      <path d="M406 184h96c18 0 30 14 34 36v48H406Z" fill="#fbf7ef" />
      <Wheel cx={214} />
      <Wheel cx={454} />
    </g>
  );
}

function Wheel({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy="274" r="26" fill="#14211c" />
      <circle cx={cx} cy="274" r="11" fill="#efe4d2" />
    </g>
  );
}
