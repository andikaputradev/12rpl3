interface SocialLinksProps {
  socialLinks: { instagram?: string; tiktok?: string } | null;
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M15 3v10.5a3.5 3.5 0 1 1-3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 3c0 2.5 2 4.5 4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function normalizeHandleUrl(platform: "instagram" | "tiktok", value: string): string {
  if (value.startsWith("http")) return value;
  const handle = value.replace(/^@/, "");
  return platform === "instagram"
    ? `https://instagram.com/${handle}`
    : `https://tiktok.com/@${handle}`;
}

export function SocialLinks({ socialLinks }: SocialLinksProps) {
  if (!socialLinks?.instagram && !socialLinks?.tiktok) return null;

  return (
    <div className="flex items-center gap-2">
      {socialLinks.instagram ? (
        <a
          href={normalizeHandleUrl("instagram", socialLinks.instagram)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent-text"
        >
          <span className="size-4">
            <InstagramIcon />
          </span>
        </a>
      ) : null}
      {socialLinks.tiktok ? (
        <a
          href={normalizeHandleUrl("tiktok", socialLinks.tiktok)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TikTok"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent-text"
        >
          <span className="size-4">
            <TiktokIcon />
          </span>
        </a>
      ) : null}
    </div>
  );
}
