import "server-only";

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

export function extractYoutubeVideoId(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!YOUTUBE_HOSTS.has(parsed.hostname)) return null;

  if (parsed.hostname === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  }

  if (parsed.pathname === "/watch") {
    const id = parsed.searchParams.get("v");
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  }

  if (parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/shorts/")) {
    const id = parsed.pathname.split("/")[2];
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  }

  return null;
}

export interface YoutubeOEmbedResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

interface YoutubeOEmbedResponse {
  title?: string;
  thumbnail_url?: string;
}

/**
 * Memverifikasi video benar-benar ada dan publik lewat endpoint oEmbed resmi
 * YouTube — bukan hanya memvalidasi format URL. Selalu memanggil host
 * youtube.com yang tetap (parameter berasal dari pengguna hanya diteruskan
 * sebagai query value ke YouTube, bukan dipakai sebagai target fetch itu
 * sendiri), sehingga tidak membuka celah SSRF ke host sembarang.
 */
export async function validateYoutubeUrl(rawUrl: string): Promise<YoutubeOEmbedResult> {
  const videoId = extractYoutubeVideoId(rawUrl);
  if (!videoId) {
    throw new Error("Tautan bukan URL YouTube yang valid.");
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oEmbedEndpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

  let response: Response;
  try {
    response = await fetch(oEmbedEndpoint, {
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error("Gagal memverifikasi video ke YouTube. Periksa koneksi dan coba lagi.");
  }

  if (!response.ok) {
    throw new Error("Video tidak ditemukan atau bersifat privat/dibatasi.");
  }

  const data = (await response.json()) as YoutubeOEmbedResponse;
  if (!data.title) {
    throw new Error("Respons YouTube tidak valid.");
  }

  return {
    videoId,
    title: data.title,
    thumbnailUrl: data.thumbnail_url ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}
