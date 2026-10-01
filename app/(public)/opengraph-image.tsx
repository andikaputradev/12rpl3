import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getClassProfile } from "@/lib/actions/beranda";
import { siteConfig } from "@/lib/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = `${siteConfig.className} — ${siteConfig.schoolName}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLOR_BACKGROUND = "#0B0E1A";
const COLOR_FOREGROUND = "#F4F5F7";
const COLOR_MUTED = "#8B92AB";
const COLOR_ACCENT = "#F4A340";
const COLOR_BORDER = "#232840";

export default async function OpengraphImage() {
  const [classProfile, fontData] = await Promise.all([
    getClassProfile(),
    readFile(join(process.cwd(), "assets/fonts/SpaceGrotesk-Bold.woff")).catch(() => null),
  ]);

  const headline = classProfile?.motto ?? siteConfig.tagline;
  const tahunAjaran = classProfile?.tahunAjaran;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: COLOR_BACKGROUND,
        padding: "72px",
        fontFamily: fontData ? "SpaceGrotesk" : "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            display: "flex",
            width: "56px",
            height: "56px",
            borderRadius: "12px",
            backgroundColor: COLOR_ACCENT,
            color: COLOR_BACKGROUND,
            fontSize: "22px",
            alignItems: "center",
            justifyContent: "center",
            letterSpacing: "1px",
          }}
        >
          RPL
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "24px", color: COLOR_FOREGROUND }}>{siteConfig.className}</span>
          <span style={{ fontSize: "16px", color: COLOR_MUTED }}>{siteConfig.schoolName}</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: headline.length > 90 ? "44px" : "56px",
          lineHeight: 1.15,
          color: COLOR_FOREGROUND,
          maxWidth: "980px",
        }}
      >
        {headline}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${COLOR_BORDER}`,
          paddingTop: "24px",
          fontSize: "18px",
          color: COLOR_MUTED,
        }}
      >
        <span>{siteConfig.jurusan}</span>
        {tahunAjaran ? <span>Tahun Ajaran {tahunAjaran}</span> : null}
      </div>
    </div>,
    {
      ...size,
      fonts: fontData
        ? [{ name: "SpaceGrotesk", data: fontData, weight: 700, style: "normal" }]
        : undefined,
    },
  );
}
