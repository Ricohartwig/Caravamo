import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/inserieren", "/vorschau", "/login", "/registrieren", "/passwort-vergessen", "/passwort-neu", "/auth", "/api"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
