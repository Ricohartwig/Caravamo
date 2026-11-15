import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, listInquiries } from "@/lib/account";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Anfragen",
  description: "Nachrichten zu Fahrzeugen, die du sendest oder erhältst.",
};

export default function AnfragenPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Anfragen werden geladen.</p>}>
      <Inbox />
    </Suspense>
  );
}

async function Inbox() {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard/anfragen");
  }

  const inquiries = await listInquiries(user.id);
  const incoming = inquiries.filter((inquiry) => inquiry.direction === "eingang");
  const sent = inquiries.filter((inquiry) => inquiry.direction === "gesendet");

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Anfragen</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Eine Anfrage je Fahrzeug. Die Antwort bleibt im selben Verlauf. Eine E-Mail wird nicht verschickt.
      </p>
      {inquiries.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted">Noch keine Nachricht. Auf einem Exposé erreichst du den Anbieter.</p>
          <Link href="/suche" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam">
            Fahrzeuge ansehen
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <InquiryGroup title="Eingang" inquiries={incoming} empty="Keine eingehende Anfrage." />
          <InquiryGroup title="Gesendet" inquiries={sent} empty="Du hast noch keine Anfrage gesendet." />
        </div>
      )}
    </div>
  );
}

function InquiryGroup({
  title,
  inquiries,
  empty,
}: {
  title: string;
  inquiries: Awaited<ReturnType<typeof listInquiries>>;
  empty: string;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      {inquiries.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <Link href={`/dashboard/anfragen/${inquiry.id}`} className="block rounded-2xl border border-line bg-card p-4 hover:bg-sand">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{inquiry.vehicleTitle}</h3>
                  {inquiry.unread ? <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-pine">Neu</span> : null}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {inquiry.counterpart} · {formatDateTime(inquiry.createdAt)}
                </p>
                <p className="mt-2 line-clamp-2 text-sm">{inquiry.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
