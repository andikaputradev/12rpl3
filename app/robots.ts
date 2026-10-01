import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/akademik", "/login"],
    },
    sitemap: `${siteConfig.appUrl}/sitemap.xml`,
  };
}
