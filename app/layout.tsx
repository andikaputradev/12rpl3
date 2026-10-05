import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import type * as React from "react";
import { Toaster } from "sonner";
import { JsonLd } from "@/components/shared/json-ld";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-archivo",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.appUrl),
  title: {
    default: `${siteConfig.siteName} - ${siteConfig.className}`,
    template: `%s - ${siteConfig.siteName}`,
  },
  description: siteConfig.tagline,
  applicationName: siteConfig.siteName,
  icons: {
    icon: [{ url: "/img/logo.png" }, { url: "/favicon.ico" }],
    shortcut: "/img/logo.png",
    apple: "/img/logo.png",
  },
  keywords: [siteConfig.className, siteConfig.schoolName, siteConfig.jurusan, "portal kelas"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteConfig.appUrl,
    siteName: siteConfig.siteName,
    title: `${siteConfig.siteName} - ${siteConfig.className}`,
    description: siteConfig.tagline,
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.className} - ${siteConfig.schoolName}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.siteName} - ${siteConfig.className}`,
    description: siteConfig.tagline,
    images: ["/img/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0E1A" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${archivo.variable} ${jetbrainsMono.variable} font-body antialiased`}
      >
        <JsonLd nonce={nonce} />
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "font-body",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
