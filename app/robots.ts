import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (siteConfig.appUrl || "http://localhost:3000").replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/akademik",
        "/login",
        "/profil-saya",
        "/ganti-password",
        "/api/",
        "/interaksi/aspirasi",
        "/kelulusan",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
