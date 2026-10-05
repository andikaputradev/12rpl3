"use client";

import { FileSpreadsheet, Printer, X } from "lucide-react";
import type * as React from "react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/lib/utils/export-excel";
import { printIsolatedElement } from "@/lib/utils/print-isolated";

interface ReportDialogShellProps {
  triggerButton?: React.ReactNode;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "destructive" | "link";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  modalTitle: string;
  modalDescription?: string;
  orientation?: "portrait" | "landscape";
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ReportDialogShell({
  triggerButton,
  triggerLabel = "Cetak Laporan",
  triggerVariant = "outline",
  triggerSize = "default",
  modalTitle,
  modalDescription = "Pratinjau lembar cetak laporan resmi kelas sebelum dicetak atau disimpan sebagai PDF.",
  orientation = "portrait",
  children,
  isOpen,
  onOpenChange,
}: ReportDialogShellProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const sheetRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const safeName = modalTitle
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    const docTitle = `Laporan_${safeName}_XII_RPL_3_${today}`;
    printIsolatedElement(sheetRef.current, docTitle, orientation === "landscape");
  }, [modalTitle, orientation]);

  const handleExportExcel = useCallback(() => {
    if (!sheetRef.current) return;
    const table = sheetRef.current.querySelector("table");
    if (!table) {
      toast.error("Tidak ada tabel data untuk diekspor ke Excel.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const safeName = modalTitle
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    exportToExcel({
      fileName: `Laporan_${safeName}_XII_RPL_3_${today}.xls`,
      title: modalTitle,
      subtitle: modalDescription,
      tableElement: table,
    });
    toast.success("Dokumen berhasil diekspor ke Excel.");
  }, [modalTitle, modalDescription]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton ? (
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className="gap-2 cursor-pointer font-medium"
          >
            <Printer className="size-4" />
            <span>{triggerLabel}</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-w-5xl w-[95vw] h-[92vh] max-h-[92vh] p-0 flex flex-col gap-0 overflow-hidden bg-background border-border",
          orientation === "landscape" && "max-w-6xl",
        )}
      >
        {/* Top Control Bar - disembunyikan saat dicetak ke printer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent-text">
              <Printer className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-base font-semibold tracking-tight text-foreground">
                {modalTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted">
                {modalDescription}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex rounded border border-border bg-muted/20 px-2 py-0.5 font-mono text-[11px] text-muted uppercase">
              Format: A4 {orientation === "landscape" ? "Landscape" : "Portrait"}
            </span>

            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300 cursor-pointer font-medium"
            >
              <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ekspor Excel</span>
            </Button>

            <Button
              onClick={handlePrint}
              size="sm"
              className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 cursor-pointer font-medium"
            >
              <Printer className="size-4" />
              <span>Cetak / PDF</span>
            </Button>

            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="size-8 cursor-pointer">
                <X className="size-4" />
                <span className="sr-only">Tutup</span>
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Scrollable Document Preview Container */}
        <div className="flex-1 overflow-y-auto bg-neutral-200/70 p-4 sm:p-8 dark:bg-neutral-950/80 flex justify-center">
          <div
            ref={sheetRef}
            className={cn(
              "printable-sheet bg-white text-black shadow-xl border border-neutral-300 rounded-xs p-8 sm:p-12 transition-all w-full text-black",
              orientation === "portrait"
                ? "max-w-[210mm] min-h-[297mm]"
                : "max-w-[297mm] min-h-[210mm] print-landscape",
            )}
          >
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
