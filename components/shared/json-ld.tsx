import { siteConfig } from "@/lib/config/site";

interface JsonLdProps {
  nonce: string;
}

export function JsonLd({ nonce }: JsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.appUrl}/#website`,
        url: siteConfig.appUrl,
        name: siteConfig.siteName,
        description: siteConfig.tagline,
        inLanguage: "id-ID",
      },
      {
        "@type": "EducationalOrganization",
        "@id": `${siteConfig.appUrl}/#organization`,
        name: siteConfig.schoolName,
        department: {
          "@type": "EducationalOrganization",
          name: `Kelas ${siteConfig.className} — ${siteConfig.jurusan}`,
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      nonce={nonce || undefined}
      suppressHydrationWarning
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD statis dari data internal (bukan input pengguna), bukan HTML — dirender dengan nonce agar lolos CSP script-src.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
