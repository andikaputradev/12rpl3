import { describe, expect, it } from "vitest";
import { extractYoutubeVideoId } from "./oembed";

describe("extractYoutubeVideoId", () => {
  it("mengekstrak ID dari format watch?v=", () => {
    // biome-ignore lint/security/noSecrets: ID video publik contoh, bukan kredensial.
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("mengekstrak ID dari format youtu.be", () => {
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("mengekstrak ID dari format embed/", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("mengekstrak ID dari format shorts/", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("menerima subdomain m.youtube.com", () => {
    // biome-ignore lint/security/noSecrets: ID video publik contoh, bukan kredensial.
    expect(extractYoutubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("menolak domain yang menyamar (mis. youtube.com.evil.example)", () => {
    expect(
      // biome-ignore lint/security/noSecrets: ID video publik contoh, bukan kredensial.
      extractYoutubeVideoId("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ"),
    ).toBeNull();
  });

  it("menolak domain sepenuhnya tidak terkait", () => {
    expect(extractYoutubeVideoId("https://vimeo.com/123456789")).toBeNull();
  });

  it("menolak URL yang tidak valid", () => {
    expect(extractYoutubeVideoId("bukan-url-sama-sekali")).toBeNull();
  });

  it("menolak video ID dengan format tidak wajar (bukan 11 karakter)", () => {
    expect(extractYoutubeVideoId("https://youtu.be/pendek")).toBeNull();
  });
});
