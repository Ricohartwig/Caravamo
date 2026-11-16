import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { accountCounts, accountProfile, currentUser } from "@/lib/account";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <Suspense fallback={<p className="text-sm text-muted">Konto wird geladen.</p>}>
        <DashboardFrame>{children}</DashboardFrame>
      </Suspense>
    </div>
  );
}

async function DashboardFrame({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [counts, profile] = await Promise.all([accountCounts(user.id), accountProfile(user.id)]);

  return (
    <div>
      <p className="text-sm font-medium text-copper-dark">Konto</p>
      <p className="mt-1 text-lg text-ink">{profile.name ? `Hallo ${profile.name}` : "Willkommen"}</p>
      <div className="mt-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <DashboardNav counts={counts} admin={profile.admin} />
        <div className="mt-6 min-w-0 lg:mt-0">{children}</div>
      </div>
    </div>
  );
}
