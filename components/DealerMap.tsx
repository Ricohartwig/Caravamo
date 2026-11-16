import { postalPoint } from "@/lib/postal-areas";

const outline: Array<[number, number]> = [
  [9.92, 54.98],
  [9.94, 54.6],
  [10.95, 54.36],
  [10.94, 54.01],
  [11.96, 54.2],
  [12.52, 54.47],
  [13.65, 54.08],
  [14.12, 53.76],
  [14.35, 53.25],
  [14.07, 52.98],
  [14.44, 52.62],
  [14.69, 52.09],
  [14.61, 51.75],
  [15.02, 51.11],
  [14.57, 51.0],
  [14.31, 51.12],
  [14.06, 50.93],
  [13.34, 50.73],
  [12.97, 50.48],
  [12.24, 50.27],
  [12.42, 49.97],
  [12.52, 49.55],
  [13.03, 49.31],
  [13.6, 48.88],
  [13.24, 48.42],
  [12.88, 48.29],
  [13.03, 47.64],
  [12.93, 47.47],
  [12.62, 47.67],
  [12.14, 47.7],
  [11.43, 47.52],
  [10.54, 47.57],
  [10.4, 47.3],
  [9.9, 47.58],
  [9.59, 47.53],
  [8.52, 47.83],
  [8.32, 47.61],
  [7.47, 47.62],
  [7.59, 48.33],
  [8.1, 49.02],
  [6.66, 49.2],
  [6.19, 49.46],
  [6.24, 49.9],
  [6.04, 50.13],
  [6.16, 50.8],
  [5.99, 51.85],
  [6.59, 51.85],
  [6.84, 52.23],
  [7.09, 53.14],
  [6.91, 53.48],
  [7.1, 53.69],
  [7.94, 53.75],
  [8.12, 53.53],
  [8.8, 54.02],
  [8.57, 54.4],
  [8.53, 54.96],
  [9.28, 54.83],
];

export type DealerPin = {
  id: string;
  label: string;
  postalCode: string | null;
};

export function DealerMap({
  pins,
  activeId = "",
  linked = true,
}: {
  pins: DealerPin[];
  activeId?: string;
  linked?: boolean;
}) {
  const placed = placePins(pins, activeId);

  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-[#e7f0ea]">
      <svg viewBox="0 0 360 480" role="img" aria-label="Karte der Händler in Deutschland" className="h-auto w-full">
        <title>Händlerkarte</title>
        <path d={outlinePath()} fill="#f7f4ee" stroke="#1e3f36" strokeWidth="2" />
        {placed.map((pin) => {
          const marker = (
            <>
              <circle cx={pin.x} cy={pin.y} r={pin.active ? 12 : 9} fill={pin.active ? "#a35a32" : "#1e3f36"} />
              <text
                x={pin.x}
                y={pin.y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#f4f7f2"
              >
                {pin.number}
              </text>
            </>
          );

          if (!linked) {
            return <g key={pin.id}>{marker}</g>;
          }

          return (
            <a key={pin.id} href={`/haendler/${pin.id}`}>
              <title>{pin.label}</title>
              {marker}
            </a>
          );
        })}
      </svg>
      <figcaption className="px-3 py-2 text-xs text-muted">Markierung nach Postleitzahl, nicht nach Straßenadresse.</figcaption>
    </figure>
  );
}

function outlinePath(): string {
  return outline
    .map(([lon, lat], index) => {
      const [x, y] = project(lat, lon);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ")
    .concat("Z");
}

function placePins(
  pins: DealerPin[],
  activeId: string,
): Array<DealerPin & { x: number; y: number; number: number; active: boolean }> {
  const used = new Map<string, number>();

  return pins.flatMap((pin, index) => {
    const point = postalPoint(pin.postalCode);
    if (!point) {
      return [];
    }

    let [x, y] = project(point.lat, point.lon);
    const key = `${Math.round(x / 12)}:${Math.round(y / 12)}`;
    const offset = used.get(key) ?? 0;
    used.set(key, offset + 1);
    x += (offset % 3) * 16 - 8;
    y += Math.floor(offset / 3) * 16;

    return [{ ...pin, x, y, number: index + 1, active: pin.id === activeId }];
  });
}

function project(lat: number, lon: number): [number, number] {
  const x = ((lon - 5.7) / (15.2 - 5.7)) * 330 + 15;
  const y = ((55.15 - lat) / (55.15 - 47.25)) * 450 + 15;
  return [x, y];
}

export function mapPins<T extends { id: string; companyName: string; postalCode: string | null }>(dealers: T[]): DealerPin[] {
  return dealers.map((dealer) => ({
    id: dealer.id,
    label: dealer.companyName,
    postalCode: dealer.postalCode,
  }));
}
