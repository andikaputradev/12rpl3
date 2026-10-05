import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["super_admin", "wali_kelas", "pengurus", "siswa"]);

export const genderEnum = pgEnum("gender", ["L", "P"]);

export const galleryCategoryEnum = pgEnum("gallery_category", [
  "kegiatan_belajar",
  "study_tour",
  "prakerin",
  "class_meeting",
  "perayaan",
  "lomba",
]);

export const galleryItemTypeEnum = pgEnum("gallery_item_type", ["image", "video"]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "published",
  "archived",
]);

// Fase 3 - dideklarasikan di sini (bukan di blok Fase 3 lebih bawah) mengikuti
// konvensi berkas ini: seluruh pgEnum dikelompokkan di atas terlepas dari fase
// asalnya (lihat galleryCategoryEnum/galleryItemTypeEnum di atas, juga Fase 2).
// eventCategoryEnum wajib berada di atas academicEvents (Fase 1) karena
// dipakai sebagai tipe kolom `category` yang ditambahkan aditif ke tabel itu.
export const dayOfWeekEnum = pgEnum("day_of_week", ["senin", "selasa", "rabu", "kamis", "jumat"]);

export const eventCategoryEnum = pgEnum("event_category", [
  "ujian",
  "libur",
  "deadline_tugas",
  "event_sekolah",
  "prakerin",
  "kelulusan",
  "lainnya",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", ["hadir", "sakit", "izin", "alpa"]);

export const assessmentTypeEnum = pgEnum("assessment_type", ["tugas", "uts", "uas", "praktik"]);

export const achievementLevelEnum = pgEnum("achievement_level", [
  "sekolah",
  "kabupaten",
  "provinsi",
  "nasional",
  "internasional",
]);

// Fase 5: dideklarasikan di sini mengikuti konvensi berkas ini (lihat
// komentar dayOfWeekEnum/eventCategoryEnum di atas): seluruh pgEnum
// dikelompokkan di blok atas terlepas dari fase asalnya.
export const guestbookContextEnum = pgEnum("guestbook_context", ["umum", "wisuda"]);

// `id` mengacu ke auth.users.id milik Supabase Auth. Foreign key ke skema
// `auth` bawaan Supabase ditambahkan lewat migration SQL manual (lihat
// drizzle/0001_rls_and_auth_trigger.sql), karena skema tersebut berada di
// luar jangkauan introspeksi Drizzle Kit.
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    fullName: text("full_name").notNull(),
    nis: text("nis").unique(),
    absenNumber: integer("absen_number"),
    role: roleEnum("role").notNull().default("siswa"),
    jabatan: text("jabatan"),
    gender: genderEnum("gender"),
    displayOrder: integer("display_order"),
    // Hanya diisi/ditampilkan publik untuk role staf (wali_kelas/pengurus ke
    // atas); kontak pribadi siswa tetap tidak pernah publik - ditegakkan di
    // level query Server Action, bukan hanya UI.
    publicContact: text("public_contact"),
    // Fase 2 - direktori siswa. Slug dibuat dari nama (bukan NIS) agar NIS
    // tidak pernah terekspos di URL publik.
    slug: text("slug").unique(),
    citaCita: text("cita_cita"),
    socialLinks: jsonb("social_links").$type<{ instagram?: string; tiktok?: string }>(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    isPublic: boolean("is_public").notNull().default(true),
    // Fase 5: kolom aditif untuk Corner Kelulusan (Bagian 2 butir 7 prompt):
    // diisi mandiri oleh siswa lewat /profil-saya, bukan oleh staf. Boleh
    // berbeda dari avatarUrl (foto yearbook vs foto profil harian).
    yearbookQuote: text("yearbook_quote"),
    yearbookPhotoUrl: text("yearbook_photo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("profiles_role_idx").on(table.role),
    index("profiles_is_public_idx").on(table.isPublic),
    index("profiles_display_order_idx").on(table.displayOrder),
    index("profiles_slug_idx").on(table.slug),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    tableName: text("table_name").notNull(),
    recordId: text("record_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_table_record_idx").on(table.tableName, table.recordId),
    index("audit_log_actor_idx").on(table.actorId),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;

// ---------------------------------------------------------------------------
// Fase 1 - Beranda & Profil Kelas (aditif terhadap skema Fase 0 di atas)
// ---------------------------------------------------------------------------

// Singleton (selalu satu baris, id = 1): profil naratif kelas yang diedit
// lewat form admin, bukan konten yang di-generate otomatis.
export const classProfile = pgTable("class_profile", {
  id: integer("id").primaryKey().default(1),
  motto: text("motto").notNull(),
  sejarah: text("sejarah").notNull(),
  visi: text("visi").notNull(),
  misi: jsonb("misi").$type<string[]>().notNull(),
  tahunAjaran: text("tahun_ajaran").notNull(),
  fotoKelasUrl: text("foto_kelas_url"),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const berandaHighlights = pgTable(
  "beranda_highlights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull(),
    linkHref: text("link_href"),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("beranda_highlights_active_order_idx").on(table.isActive, table.displayOrder)],
);

// Menampung banyak baris sejak awal (bukan hanya event featured) agar Fase 3
// (Jadwal & Agenda) dapat memakai ulang tabel ini sebagai sumber kalender
// akademik tanpa migration ulang.
export const academicEvents = pgTable(
  "academic_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
    description: text("description"),
    isFeaturedCountdown: boolean("is_featured_countdown").notNull().default(false),
    // Fase 3 - kolom aditif (ALTER TABLE ADD COLUMN), tidak mengubah baris
    // Fase 1 yang sudah ada (default "lainnya" mengisi data lama secara aman).
    category: eventCategoryEnum("category").notNull().default("lainnya"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("academic_events_date_idx").on(table.eventDate),
    index("academic_events_featured_idx").on(table.isFeaturedCountdown),
    index("academic_events_category_idx").on(table.category),
  ],
);

// Singleton. Mutasi HANYA lewat RPC security definer `increment_visitor_count`
// (lihat drizzle/0003_beranda_rls_and_rpc.sql) - tidak ada policy insert/update
// untuk role anon/authenticated pada tabel ini sama sekali.
export const visitorCount = pgTable("visitor_count", {
  id: integer("id").primaryKey().default(1),
  total: integer("total").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ClassProfile = typeof classProfile.$inferSelect;
export type ClassProfileInsert = typeof classProfile.$inferInsert;
export type BerandaHighlight = typeof berandaHighlights.$inferSelect;
export type NewBerandaHighlight = typeof berandaHighlights.$inferInsert;
export type AcademicEvent = typeof academicEvents.$inferSelect;
export type NewAcademicEvent = typeof academicEvents.$inferInsert;

// ---------------------------------------------------------------------------
// Fase 2 - Direktori Siswa & Galeri (aditif terhadap skema Fase 0/1 di atas)
// ---------------------------------------------------------------------------

export const galleryAlbums = pgTable(
  "gallery_albums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    category: galleryCategoryEnum("category").notNull(),
    eventDate: timestamp("event_date", { withTimezone: true }),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("gallery_albums_category_idx").on(table.category),
    index("gallery_albums_created_at_idx").on(table.createdAt),
  ],
);

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => galleryAlbums.id, { onDelete: "cascade" }),
    type: galleryItemTypeEnum("type").notNull(),
    // URL Cloudinary untuk image, video id YouTube untuk video.
    mediaUrl: text("media_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    caption: text("caption"),
    // Subset dipakai dari contentStatusEnum bersama (Fase 0): pending_review,
    // approved, rejected - enum tidak diduplikasi, hanya subset nilainya yang
    // relevan untuk moderasi galeri.
    status: contentStatusEnum("status").notNull().default("pending_review"),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    rejectionReason: text("rejection_reason"),
    moderatedBy: uuid("moderated_by").references(() => profiles.id, { onDelete: "set null" }),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("gallery_items_album_status_idx").on(table.albumId, table.status),
    index("gallery_items_status_idx").on(table.status),
    index("gallery_items_uploaded_by_idx").on(table.uploadedBy),
  ],
);

export type GalleryAlbum = typeof galleryAlbums.$inferSelect;
export type NewGalleryAlbum = typeof galleryAlbums.$inferInsert;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type NewGalleryItem = typeof galleryItems.$inferInsert;
export type ContentStatusSubset = "pending_review" | "approved" | "rejected";
// Fase 4 - blog_posts memakai rentang penuh contentStatusEnum (draft dan
// published turut dipakai, berbeda dari galeri/portofolio yang berhenti di
// ContentStatusSubset di atas).
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];

// ---------------------------------------------------------------------------
// Fase 3 - Jadwal, Agenda, dan Akademik (aditif terhadap skema Fase 0-2)
// ---------------------------------------------------------------------------

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const classSchedule = pgTable(
  "class_schedule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    periodNumber: integer("period_number").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    teacherName: text("teacher_name"),
    room: text("room"),
  },
  (table) => [
    // Satu kelas hanya bisa punya satu mata pelajaran per hari+jam ke-berapa;
    // mencegah entri ganda tak sengaja lewat form CRUD admin.
    unique("class_schedule_day_period_unique").on(table.dayOfWeek, table.periodNumber),
    index("class_schedule_day_idx").on(table.dayOfWeek),
  ],
);

export const piketSchedule = pgTable("piket_schedule", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayOfWeek: dayOfWeekEnum("day_of_week").notNull().unique(),
  note: text("note"),
});

export const piketAssignments = pgTable(
  "piket_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    piketScheduleId: uuid("piket_schedule_id")
      .notNull()
      .references(() => piketSchedule.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
  },
  (table) => [
    // Menjaga idempotensi upsertPiketAssignment (kirim ulang daftar siswa
    // yang sama untuk satu hari tidak menghasilkan baris duplikat).
    unique("piket_assignments_schedule_student_unique").on(table.piketScheduleId, table.studentId),
    index("piket_assignments_schedule_idx").on(table.piketScheduleId),
  ],
);

export const grades = pgTable(
  "grades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    assessmentType: assessmentTypeEnum("assessment_type").notNull(),
    score: integer("score").notNull(),
    semester: text("semester").notNull(),
    enteredBy: uuid("entered_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Kunci natural entry nilai massal: menyimpan ulang lembar entry yang
    // sama (subjek+jenis+semester) meng-update baris eksisting, bukan
    // menumpuk duplikat yang akan merusak perhitungan rata-rata.
    unique("grades_student_subject_type_semester_unique").on(
      table.studentId,
      table.subjectId,
      table.assessmentType,
      table.semester,
    ),
    index("grades_student_semester_idx").on(table.studentId, table.semester),
    index("grades_subject_type_semester_idx").on(
      table.subjectId,
      table.assessmentType,
      table.semester,
    ),
    // Satu-satunya CHECK constraint di seluruh skema ini, ditambahkan sengaja
    // menyimpang dari konvensi "validasi hanya di Zod" karena grades adalah
    // data akademik resmi paling sensitif (Bagian 9 brief): pertahanan
    // berlapis di level database tetap relevan sekalipun RLS hanya membatasi
    // SIAPA yang menulis, bukan NILAI apa yang ditulis.
    check("grades_score_range", sql`${table.score} >= 0 AND ${table.score} <= 100`),
  ],
);

// `date` memakai tipe DATE murni (bukan timestamptz seperti draf awal di
// prompt) - attendance adalah konsep hari kalender, bukan titik waktu.
// Dengan timestamptz, dua entri "hari yang sama" bisa punya nilai jam:menit
// berbeda sehingga UNIQUE(studentId, date) tidak efektif mencegah duplikat;
// DATE membuat constraint ini benar secara struktural, bukan bergantung pada
// disiplin normalisasi di kode Server Action. Lihat catatan laporan §5.
export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    status: attendanceStatusEnum("status").notNull(),
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => profiles.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("attendance_student_date_unique").on(table.studentId, table.date),
    index("attendance_date_idx").on(table.date),
    index("attendance_student_idx").on(table.studentId),
  ],
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    isPinned: boolean("is_pinned").notNull().default(false),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("announcements_pinned_created_idx").on(table.isPinned, table.createdAt)],
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("assignments_due_date_idx").on(table.dueDate)],
);

export const assignmentSubmissions = pgTable(
  "assignment_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    fileUrl: text("file_url").notNull(),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedByStaff: boolean("reviewed_by_staff").notNull().default(false),
  },
  (table) => [
    unique("assignment_submissions_assignment_student_unique").on(
      table.assignmentId,
      table.studentId,
    ),
    index("assignment_submissions_student_idx").on(table.studentId),
  ],
);

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type ClassScheduleEntry = typeof classSchedule.$inferSelect;
export type NewClassScheduleEntry = typeof classSchedule.$inferInsert;
export type PiketScheduleDay = typeof piketSchedule.$inferSelect;
export type NewPiketScheduleDay = typeof piketSchedule.$inferInsert;
export type PiketAssignment = typeof piketAssignments.$inferSelect;
export type Grade = typeof grades.$inferSelect;
export type NewGrade = typeof grades.$inferInsert;
export type AttendanceRecord = typeof attendance.$inferSelect;
export type NewAttendanceRecord = typeof attendance.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type NewAssignmentSubmission = typeof assignmentSubmissions.$inferInsert;
export type DayOfWeek = (typeof dayOfWeekEnum.enumValues)[number];
export type EventCategory = (typeof eventCategoryEnum.enumValues)[number];
export type AttendanceStatus = (typeof attendanceStatusEnum.enumValues)[number];
export type AssessmentType = (typeof assessmentTypeEnum.enumValues)[number];

// ---------------------------------------------------------------------------
// Kas Digital - fitur tambahan di luar cakupan prompt Fase 3, diminta secara
// eksplisit untuk dieksekusi pada rilis yang sama. Murni tampilan QRIS statis
// + nomor e-wallet DANA; TIDAK ADA integrasi payment gateway, tidak ada
// pencatatan transaksi otomatis, tidak ada rekonsiliasi saldo - siswa
// men-scan/transfer manual di luar sistem, sesuai spesifikasi eksplisit.
// Singleton (id = 1), pola identik dengan classProfile/visitorCount Fase 1.
// ---------------------------------------------------------------------------

export const kasSettings = pgTable("kas_settings", {
  id: integer("id").primaryKey().default(1),
  qrisImageUrl: text("qris_image_url"),
  danaNumber: text("dana_number"),
  danaAccountName: text("dana_account_name"),
  nominalInfo: text("nominal_info"),
  instructions: text("instructions"),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type KasSettings = typeof kasSettings.$inferSelect;
export type KasSettingsInsert = typeof kasSettings.$inferInsert;

// ---------------------------------------------------------------------------
// Fase 4 - Prestasi, Portofolio, dan Blog (aditif terhadap skema Fase 0-3)
// ---------------------------------------------------------------------------

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    level: achievementLevelEnum("level").notNull(),
    eventDate: timestamp("event_date", { withTimezone: true }),
    certificateUrl: text("certificate_url"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("achievements_level_idx").on(table.level),
    index("achievements_event_date_idx").on(table.eventDate),
  ],
);

// Baris kosong pada suatu achievementId berarti prestasi tingkat kelas
// (bukan individu) - lihat lib/actions/prestasi.ts.
export const achievementParticipants = pgTable(
  "achievement_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("achievement_participants_unique").on(table.achievementId, table.studentId),
    index("achievement_participants_achievement_idx").on(table.achievementId),
  ],
);

export const portfolioProjects = pgTable(
  "portfolio_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    techStack: jsonb("tech_stack").$type<string[]>().notNull().default([]),
    projectUrl: text("project_url"),
    repoUrl: text("repo_url"),
    thumbnailUrl: text("thumbnail_url"),
    status: contentStatusEnum("status").notNull().default("pending_review"),
    submittedBy: uuid("submitted_by")
      .notNull()
      .references(() => profiles.id),
    moderatedBy: uuid("moderated_by").references(() => profiles.id, { onDelete: "set null" }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("portfolio_projects_status_idx").on(table.status),
    index("portfolio_projects_submitted_by_idx").on(table.submittedBy),
  ],
);

export const portfolioContributors = pgTable(
  "portfolio_contributors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => portfolioProjects.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("portfolio_contributors_unique").on(table.projectId, table.studentId),
    index("portfolio_contributors_project_idx").on(table.projectId),
  ],
);

export const alumniTestimonials = pgTable("alumni_testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  quote: text("quote").notNull(),
  contextNote: text("context_note"),
  addedBy: uuid("added_by")
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blogCategories = pgTable("blog_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    contentMarkdown: text("content_markdown").notNull(),
    excerpt: text("excerpt"),
    coverImageUrl: text("cover_image_url"),
    categoryId: uuid("category_id").references(() => blogCategories.id, { onDelete: "set null" }),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    status: contentStatusEnum("status").notNull().default("pending_review"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    moderatedBy: uuid("moderated_by").references(() => profiles.id, { onDelete: "set null" }),
    rejectionReason: text("rejection_reason"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("blog_posts_status_published_idx").on(table.status, table.publishedAt),
    index("blog_posts_category_idx").on(table.categoryId),
    index("blog_posts_author_idx").on(table.authorId),
  ],
);

export const blogComments = pgTable(
  "blog_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    content: text("content").notNull(),
    isHidden: boolean("is_hidden").notNull().default(false),
    hiddenBy: uuid("hidden_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("blog_comments_post_idx").on(table.postId)],
);

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type AchievementParticipant = typeof achievementParticipants.$inferSelect;
export type PortfolioProject = typeof portfolioProjects.$inferSelect;
export type NewPortfolioProject = typeof portfolioProjects.$inferInsert;
export type PortfolioContributor = typeof portfolioContributors.$inferSelect;
export type AlumniTestimonial = typeof alumniTestimonials.$inferSelect;
export type NewAlumniTestimonial = typeof alumniTestimonials.$inferInsert;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type BlogComment = typeof blogComments.$inferSelect;
export type AchievementLevel = (typeof achievementLevelEnum.enumValues)[number];

// ---------------------------------------------------------------------------
// Fase 5: Interaksi & Corner Kelulusan (aditif terhadap skema Fase 0-4)
// ---------------------------------------------------------------------------

// Buku tamu umum dan buku tamu wisuda berbagi satu tabel (Asumsi Kunci #1
// prompt): struktur identik, hanya beda konteks tampilan lewat kolom
// `context`. `name` sengaja teks bebas (bukan FK ke profiles) karena
// pengunjung boleh mengisi tanpa akun sama sekali.
export const guestbookEntries = pgTable(
  "guestbook_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    context: guestbookContextEnum("context").notNull().default("umum"),
    name: text("name").notNull(),
    message: text("message").notNull(),
    // Terisi otomatis bila penulis kebetulan sedang login; TIDAK pernah jadi
    // syarat pengisian (lihat Asumsi Kunci #2 prompt: satu-satunya fitur
    // tulis tanpa login di seluruh sistem).
    authorId: uuid("author_id").references(() => profiles.id, { onDelete: "set null" }),
    status: contentStatusEnum("status").notNull().default("pending_review"),
    moderatedBy: uuid("moderated_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("guestbook_entries_context_status_idx").on(table.context, table.status),
    index("guestbook_entries_status_idx").on(table.status),
  ],
);

// Status awal ditentukan SELURUHNYA di server dari isAnonymous (Asumsi Kunci
// #3 prompt: approved bila !isAnonymous, pending_review bila isAnonymous):
// tidak pernah diterima sebagai parameter dari client, lihat submitAspiration
// di lib/actions/interaksi-mutations.ts. Karena itu tanpa .default() di sini,
// sengaja tidak diberi default supaya lupa mengisinya di server terlihat
// sebagai error tipe, bukan diam-diam jatuh ke suatu default yang salah.
export const aspirations = pgTable(
  "aspirations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: contentStatusEnum("status").notNull(),
    moderatedBy: uuid("moderated_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("aspirations_status_idx").on(table.status),
    index("aspirations_author_idx").on(table.authorId),
  ],
);

export const polls = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    question: text("question").notNull(),
    description: text("description"),
    allowMultipleChoice: boolean("allow_multiple_choice").notNull().default(false),
    showResultsBeforeClose: boolean("show_results_before_close").notNull().default(false),
    opensAt: timestamp("opens_at", { withTimezone: true }).notNull().defaultNow(),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("polls_closes_at_idx").on(table.closesAt)],
);

export const pollOptions = pgTable(
  "poll_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [index("poll_options_poll_idx").on(table.pollId)],
);

// Baris suara mentah TIDAK PERNAH diekspos ke pengguna biasa (Bagian 9
// prompt, prinsip bilik suara rahasia): publik hanya melihat agregat lewat
// get_poll_results() SECURITY DEFINER (lihat migration RLS). RLS select di
// sini hanya untuk pemilik suara sendiri dan staf, sebagai defense-in-depth
// terhadap akses REST API langsung; Server Action getPollResults tidak
// pernah men-select tabel ini baris-per-baris untuk ditampilkan ke klien.
export const pollVotes = pgTable(
  "poll_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    voterId: uuid("voter_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Batas satu pilihan per opsi per pemilih; kasus !allowMultipleChoice
    // (satu pilihan per POLLING, bukan per opsi) diperiksa terpisah di
    // server (submitVote), bukan lewat constraint database, karena aturannya
    // bergantung pada nilai allowMultipleChoice tiap polling.
    unique("poll_votes_poll_option_voter_unique").on(table.pollId, table.optionId, table.voterId),
    index("poll_votes_poll_voter_idx").on(table.pollId, table.voterId),
  ],
);

// Unique (fromStudentId, toStudentId): mengirim ulang pesan ke penerima yang
// sama menimpa (upsert) pesan sebelumnya, bukan menumpuk baris baru: lihat
// submitPesanKesan di lib/actions/kelulusan-mutations.ts.
export const pesanKesan = pgTable(
  "pesan_kesan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromStudentId: uuid("from_student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    toStudentId: uuid("to_student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    status: contentStatusEnum("status").notNull(),
    moderatedBy: uuid("moderated_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("pesan_kesan_from_to_unique").on(table.fromStudentId, table.toStudentId),
    index("pesan_kesan_to_student_idx").on(table.toStudentId),
    index("pesan_kesan_status_idx").on(table.status),
  ],
);

// Singleton (id = 1), pola identik classProfile/visitorCount/kasSettings.
export const kelulusanContent = pgTable("kelulusan_content", {
  id: integer("id").primaryKey().default(1),
  introText: text("intro_text"),
  compilationVideoUrl: text("compilation_video_url"),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type GuestbookEntry = typeof guestbookEntries.$inferSelect;
export type NewGuestbookEntry = typeof guestbookEntries.$inferInsert;
export type Aspiration = typeof aspirations.$inferSelect;
export type NewAspiration = typeof aspirations.$inferInsert;
export type Poll = typeof polls.$inferSelect;
export type NewPoll = typeof polls.$inferInsert;
export type PollOption = typeof pollOptions.$inferSelect;
export type NewPollOption = typeof pollOptions.$inferInsert;
export type PollVote = typeof pollVotes.$inferSelect;
export type NewPollVote = typeof pollVotes.$inferInsert;
export type PesanKesan = typeof pesanKesan.$inferSelect;
export type NewPesanKesan = typeof pesanKesan.$inferInsert;
export type KelulusanContent = typeof kelulusanContent.$inferSelect;
export type KelulusanContentInsert = typeof kelulusanContent.$inferInsert;
export type GuestbookContext = (typeof guestbookContextEnum.enumValues)[number];
