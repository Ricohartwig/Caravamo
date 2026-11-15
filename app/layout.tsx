import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Caravamo",
    template: "%s · Caravamo",
  },
  description:
    "Caravamo ist der Marktplatz für Wohnmobile, Wohnwagen, Pkw und Transporter von Privat und Händlern.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <a
          href="#inhalt"
          className="absolute left-4 top-4 z-50 -translate-y-24 rounded-lg bg-card px-3 py-2 text-sm font-medium shadow focus:translate-y-0"
        >
          Zum Inhalt
        </a>
        <Navbar />
        <main id="inhalt" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
