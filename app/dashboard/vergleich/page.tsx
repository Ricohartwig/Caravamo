import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { toggleComparison } from "@/actions/account";
import { VehiclePlaceholder } from "@/components/VehiclePlaceholder";
import { currentUser, listComparison } from "@/lib/account";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Vergleich",
  description: "Bis zu drei Fahrzeuge nebeneinander.",
};

export default function VergleichPage({
  searchParams,
}: {
  searchParams: Promise<{ hinweis?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Vergleich wird geladen.</p>}>
      <Comparison searchParams={searchParams} />
    </Suspense>
  );
}

async function Comparison({ searchParams }: { searchParams: Promise<{ hinweis?: string | string[] }> }) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard/vergleich");
  }

  const params = await searchParams;
  const noticeKey = Array.isArray(params.hinweis) ? params.hinweis[0] : params.hinweis;
  const columns = await listComparison(user.id);
  const prices = columns.flatMap((column) => (column.price !== null ? [column.price] : []));
  const lowest = prices.length > 1 ? Math.min(...prices) : null;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Vergleich</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Die Waage auf einer Karte nimmt ein Fahrzeug auf. Es passen drei nebeneinander.
      </p>
      {noticeKey === "voll" ? (
        <p role="status" className="mt-4 rounded-2xl border border-line bg-sand px-4 py-3 text-sm">
          Der Vergleich ist voll. Nimm ein Fahrzeug heraus, bevor du ein weiteres hinzufügst.
        </p>
      ) : null}
      {columns.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted">Noch kein Fahrzeug im Vergleich.</p>
          <Link href="/suche" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam">
            Fahrzeuge suchen
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-3">
            <thead>
              <tr>
                <th className="w-36" />
                {columns.map((column) => (
                  <th key={column.id} className="w-64 rounded-2xl border border-line bg-card p-3 text-left font-normal">
                    {column.available && column.imageUrl ? (
                      <span className="relative block aspect-[16/10] overflow-hidden rounded-xl">
                        <Image src={column.imageUrl} alt="" fill sizes="240px" className="object-cover" />
                      </span>
                    ) : (
                      <VehiclePlaceholder title={column.title} type="Fahrzeug" tone={0} label="Front" decorative />
                    )}
                    <p className="mt-3 font-semibold">{column.title}</p>
                    <p className="mt-1 text-lg font-semibold">
                      {column.price !== null ? formatPrice(column.price) : "Nicht verfügbar"}
                      {lowest !== null && column.price === lowest ? (
                        <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-pine">günstigster</span>
                      ) : null}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {column.available ? (
                        <Link href={column.href} className="text-sm font-semibold text-pine hover:underline">
                          Exposé
                        </Link>
                      ) : null}
                      <form action={toggleComparison}>
                        <input type="hidden" name="vehicleId" value={column.id} />
                        <input type="hidden" name="compared" value="1" />
                        <input type="hidden" name="returnTo" value="/dashboard/vergleich" />
                        <button type="submit" className="text-sm font-semibold text-copper-dark hover:underline">
                          Entfernen
                        </button>
                      </form>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {columns[0]?.rows.map((row, index) => (
                <tr key={row.label}>
                  <th className="py-2 text-left text-sm font-medium text-muted">{row.label}</th>
                  {columns.map((column) => (
                    <td key={column.id} className="rounded-xl bg-card px-3 py-2 text-sm">
                      {column.available ? column.rows[index]?.value : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
