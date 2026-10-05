"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { uploadImageServerSide } from "@/lib/cloudinary/signed-upload";
import { db } from "@/lib/db";
import { auditLog, portfolioContributors, portfolioProjects } from "@/lib/db/schema";
import { limitPortfolioSubmission } from "@/lib/rate-limit";
import { sanitizeUserText } from "@/lib/utils";
import { parseTechStackInput, portfolioSubmitSchema } from "@/lib/validations/portofolio";

export interface ActionState {
  error?: string;
  success?: boolean;
  timestamp?: number;
}

async function writeAudit(
  actorId: string,
  action: string,
  tableName: string,
  recordId: string | null,
  before: unknown,
  after: unknown,
) {
  await db.insert(auditLog).values({
    actorId,
    action,
    tableName,
    recordId,
    before: before as object | null,
    after: after as object | null,
  });
}

export async function submitPortfolioProject(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try {
    auth = await requireAuthenticatedUser();
  } catch {
    return { error: "Sesi tidak ditemukan. Silakan masuk kembali." };
  }

  const rate = await limitPortfolioSubmission(auth.userId);
  if (rate.limited) {
    return { error: "Terlalu banyak pengajuan proyek dalam 24 jam terakhir. Coba lagi nanti." };
  }

  const parsed = portfolioSubmitSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    techStack: parseTechStackInput(String(formData.get("techStack") ?? "")),
    projectUrl: formData.get("projectUrl") || "",
    repoUrl: formData.get("repoUrl") || "",
    contributorIds: formData.getAll("contributorIds").map(String),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data proyek tidak valid." };
  }

  let thumbnailUrl: string | null = null;
  const thumbnailFile = formData.get("thumbnail");
  if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
    try {
      const uploaded = await uploadImageServerSide({
        file: thumbnailFile,
        folder: "portofolio",
        publicId: `${auth.userId}-${Date.now()}`,
      });
      thumbnailUrl = uploaded.url;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Gagal mengunggah thumbnail." };
    }
  }

  const [after] = await db
    .insert(portfolioProjects)
    .values({
      title: sanitizeUserText(parsed.data.title, 150),
      description: sanitizeUserText(parsed.data.description, 2000),
      techStack: parsed.data.techStack,
      projectUrl: parsed.data.projectUrl || null,
      repoUrl: parsed.data.repoUrl || null,
      thumbnailUrl,
      status: "pending_review",
      submittedBy: auth.userId,
    })
    .returning();

  // Kontributor tambahan (di luar diri sendiri) - opsional, brief tidak
  // merinci mekanismenya secara eksplisit sehingga diisi di sini sebagai
  // bagian submit, bukan langkah moderasi terpisah.
  const uniqueContributors = [...new Set(parsed.data.contributorIds)].filter(
    (id) => id !== auth.userId,
  );
  if (after && uniqueContributors.length > 0) {
    await db
      .insert(portfolioContributors)
      .values(uniqueContributors.map((studentId) => ({ projectId: after.id, studentId })));
  }

  await writeAudit(auth.userId, "create", "portfolio_projects", after?.id ?? null, null, after);

  revalidatePath("/prestasi");
  revalidatePath("/portofolio/submit");
  revalidatePath("/dashboard/portofolio");

  return { success: true, timestamp: Date.now() };
}
