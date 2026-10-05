"use client";

import { ExternalLink, FolderGit2 } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { PortfolioProjectView } from "@/lib/actions/prestasi";
import { cloudinaryOptimized } from "@/lib/utils";

export function PortfolioCard({ project }: { project: PortfolioProjectView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-background">
        {project.thumbnailUrl ? (
          <Image
            src={cloudinaryOptimized(project.thumbnailUrl, "f_auto,q_auto,w_600")}
            alt={`Thumbnail ${project.title}`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-3xl text-muted">
            {project.title.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display font-medium">{project.title}</h3>
          <p className="mt-1 line-clamp-2 text-muted text-sm">{project.description}</p>
        </div>
        <p className="text-muted text-xs">
          {project.submitterName}
          {project.contributorNames.length > 0
            ? ` · dengan ${project.contributorNames.join(", ")}`
            : ""}
        </p>
        {/* Hover DAN focus-within - benar-benar menyingkap aksi yang bisa
            diambil (Bagian 5 brief), bukan dekorasi, sehingga pengguna
            keyboard yang tab ke tautan juga melihatnya, bukan hanya mouse. */}
        <div className="mt-auto flex translate-y-1 flex-col gap-3 opacity-0 transition-all duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
          {project.techStack.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {project.techStack.map((tech) => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-4 text-sm">
            {project.projectUrl ? (
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent-text hover:underline"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" /> Demo
              </a>
            ) : null}
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent-text hover:underline"
              >
                <FolderGit2 className="size-3.5" aria-hidden="true" /> Repo
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
