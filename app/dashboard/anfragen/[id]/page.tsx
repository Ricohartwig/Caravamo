import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { markInquiryRead, replyToInquiry } from "@/actions/account";
import { currentUser, getInquiryThread } from "@/lib/account";
import { formatDateTime } from "@/lib/format";
import { isMailConfigured } from "@/lib/mail";

export const metadata: Metadata = {
  title: "Anfrage",
  description: "Verlauf einer Fahrzeuganfrage.",
};

const notices: Record<string, string> = {
  vorhanden: "Zu diesem Fahrzeug gibt es schon eine Anfrage. Der Verlauf ist hier.",
  kurz: "Die Antwort braucht mindestens 2 Zeichen.",
  fehler: "Die Antwort konnte nicht gespeichert werden.",
};

export default function InquiryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hinweis?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Anfrage wird geladen.</p>}>
      <Thread params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Thread({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hinweis?: string | string[] }>;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard/anfragen");
  }

  const { id } = await params;
  const thread = await getInquiryThread(user.id, id);
  if (!thread) {
    notFound();
  }

  if (thread.incoming) {
    await markInquiryRead(thread.id, user.id);
  }

  const query = await searchParams;
  const noticeKey = Array.isArray(query.hinweis) ? query.hinweis[0] : query.hinweis;

  return (
    <div>
      <p className="text-sm">
        <Link href="/dashboard/anfragen" className="font-semibold text-pine hover:underline">
          Alle Anfragen
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{thread.vehicleTitle}</h1>
      <p className="mt-2 text-muted">Mit {thread.counterpart}</p>
      {thread.available ? (
        <Link href={`/fahrzeug/${thread.vehicleId}`} className="mt-2 inline-block text-sm font-semibold text-pine hover:underline">
          Exposé öffnen
        </Link>
      ) : (
        <p className="mt-2 text-sm text-muted">Das Inserat ist nicht mehr öffentlich.</p>
      )}
      {noticeKey && notices[noticeKey] ? (
        <p role="status" className="mt-4 rounded-2xl border border-line bg-sand px-4 py-3 text-sm">
          {notices[noticeKey]}
        </p>
      ) : null}
      <ol className="mt-6 space-y-3">
        {thread.messages.map((message) => (
          <li key={message.id} className={`max-w-xl rounded-2xl border border-line px-4 py-3 ${message.own ? "ml-auto bg-sand" : "bg-card"}`}>
            <p className="text-sm font-semibold">{message.author}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
            <p className="mt-2 text-xs text-muted">{formatDateTime(message.createdAt)}</p>
          </li>
        ))}
      </ol>
      <form action={replyToInquiry} className="mt-6 max-w-xl">
        <input type="hidden" name="inquiryId" value={thread.id} />
        <label htmlFor="antwort" className="text-sm font-medium">
          Antwort
          <textarea
            id="antwort"
            name="body"
            required
            minLength={2}
            maxLength={2000}
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-3 text-base"
          />
        </label>
        <button type="submit" className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam">
          Antwort senden
        </button>
        <p className="mt-3 text-sm text-muted">
          {isMailConfigured()
            ? "Die Gegenseite sieht die Antwort im Konto und bekommt eine E-Mail."
            : "Die Gegenseite sieht die Antwort im Konto."}
        </p>
      </form>
    </div>
  );
}
