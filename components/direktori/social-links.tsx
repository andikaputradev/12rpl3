interface SocialLinksProps {
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  } | null;
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

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path
        d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path
        d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function normalizeHandleUrl(
  platform: "instagram" | "tiktok" | "github" | "linkedin" | "website",
  value: string,
): string {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const handle = value.replace(/^@/, "");
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "github":
      return `https://github.com/${handle}`;
    case "linkedin":
      return `https://linkedin.com/in/${handle}`;
    case "website":
      return `https://${value}`;
  }
}

export function SocialLinks({ socialLinks }: SocialLinksProps) {
  if (
    !socialLinks?.instagram &&
    !socialLinks?.tiktok &&
    !socialLinks?.github &&
    !socialLinks?.linkedin &&
    !socialLinks?.website
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
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
      {socialLinks.github ? (
        <a
          href={normalizeHandleUrl("github", socialLinks.github)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent-text"
        >
          <span className="size-4">
            <GithubIcon />
          </span>
        </a>
      ) : null}
      {socialLinks.linkedin ? (
        <a
          href={normalizeHandleUrl("linkedin", socialLinks.linkedin)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent-text"
        >
          <span className="size-4">
            <LinkedinIcon />
          </span>
        </a>
      ) : null}
      {socialLinks.website ? (
        <a
          href={normalizeHandleUrl("website", socialLinks.website)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website atau Portofolio"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent-text"
        >
          <span className="size-4">
            <GlobeIcon />
          </span>
        </a>
      ) : null}
    </div>
  );
}
