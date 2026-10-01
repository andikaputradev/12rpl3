"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface YoutubeFacadeProps {
  videoId: string;
  thumbnailUrl: string | null;
  title: string;
  className?: string;
}

export function YoutubeFacade({ videoId, thumbnailUrl, title, className }: YoutubeFacadeProps) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={`Putar video ${title}`}
      className={`group relative flex cursor-pointer items-center justify-center overflow-hidden bg-black ${className ?? ""}`}
    >
      <Image
        src={thumbnailUrl ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover opacity-80 transition-opacity group-hover:opacity-60"
      />
      <span className="relative z-10 flex size-14 items-center justify-center rounded-full bg-white/90 text-black transition-transform group-hover:scale-110">
        <Play className="ml-1 size-6 fill-current" aria-hidden="true" />
      </span>
    </button>
  );
}
