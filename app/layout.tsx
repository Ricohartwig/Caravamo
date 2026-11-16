import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { VehicleStructuredData } from "@/components/VehicleStructuredData";
import { siteOrigin } from "@/lib/site";
import { isAdminRole } from "@/lib/roles";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Caravamo",
    template: "%s · Caravamo",
  },
  description:
    "Caravamo ist der Marktplatz für Wohnmobile, Wohnwagen, Dachzelte und Kabinen von Privat und Händlern.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${inter.variable} h-full antialiased`}>
      <head>
        <Suspense fallback={null}>
          <VehicleStructuredData />
        </Suspense>
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <a
          href="#inhalt"
          className="absolute left-4 top-4 z-50 -translate-y-24 rounded-lg bg-card px-3 py-2 text-sm font-medium shadow focus:translate-y-0"
        >
          Zum Inhalt
        </a>
        <Suspense fallback={<Navbar user={null} />}>
          <NavbarSlot />
        </Suspense>
        <main id="inhalt" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

async function NavbarSlot() {
  const user = await readNavbarUser();
  return <Navbar user={user} />;
}

async function readNavbarUser(): Promise<{ email: string; admin: boolean } | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (!email || !data.user) {
      return null;
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).maybeSingle();
    return { email, admin: isAdminRole(typeof profile?.role === "string" ? profile.role : null) };
  } catch {
    return null;
  }
}
