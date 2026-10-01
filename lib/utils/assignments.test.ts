import { describe, expect, it } from "vitest";
import { computeSubmissionStatus } from "@/lib/utils/assignments";

describe("computeSubmissionStatus", () => {
  const dueDate = new Date("2026-09-10T23:59:00+07:00");

  it("belum dikumpulkan, tenggat belum lewat", () => {
    const now = new Date("2026-09-05T10:00:00+07:00");
    expect(computeSubmissionStatus(dueDate, null, now)).toBe("belum");
  });

  it("belum dikumpulkan, tenggat sudah lewat -> terlambat", () => {
    const now = new Date("2026-09-11T08:00:00+07:00");
    expect(computeSubmissionStatus(dueDate, null, now)).toBe("terlambat");
  });

  it("sudah dikumpulkan sebelum tenggat -> terkumpul", () => {
    const submittedAt = new Date("2026-09-09T20:00:00+07:00");
    expect(computeSubmissionStatus(dueDate, submittedAt)).toBe("terkumpul");
  });

  it("sudah dikumpulkan setelah tenggat -> terlambat, bukan disamarkan sebagai terkumpul", () => {
    const submittedAt = new Date("2026-09-11T01:00:00+07:00");
    expect(computeSubmissionStatus(dueDate, submittedAt)).toBe("terlambat");
  });

  it("dikumpulkan tepat di batas waktu (sama persis) -> terkumpul, bukan terlambat", () => {
    expect(computeSubmissionStatus(dueDate, new Date(dueDate))).toBe("terkumpul");
  });
});
