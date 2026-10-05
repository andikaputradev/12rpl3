"use client";

import { siteConfig } from "@/lib/config/site";

export interface ExcelExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelExportOptions {
  fileName: string;
  title: string;
  subtitle?: string;
  columns?: string[];
  data?: (string | number | null | undefined)[][];
  tableElement?: HTMLTableElement | null;
}

/**
 * Ekspor data atau elemen tabel HTML menjadi berkas lembar kerja Excel (.xls)
 * yang kompatibel penuh dengan Microsoft Excel, LibreOffice Calc, dan Google Sheets.
 * Menggunakan format XML/HTML Spreadsheet dengan UTF-8 BOM untuk mencegah karakter rusak.
 */
export function exportToExcel({
  fileName,
  title,
  subtitle,
  columns,
  data,
  tableElement,
}: ExcelExportOptions) {
  let tableHtml = "";

  if (tableElement) {
    // Klon tabel untuk membersihkan kelas interaktif yang tidak diperlukan di Excel
    const clone = tableElement.cloneNode(true) as HTMLTableElement;
    clone.querySelectorAll(".sr-only, button, input").forEach((el) => {
      el.remove();
    });
    tableHtml = clone.outerHTML;
  } else if (columns && data) {
    tableHtml = `
      <table border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:11pt;">
        <thead>
          <tr style="background-color:#E2E8F0;font-weight:bold;text-align:center;">
            ${columns.map((col) => `<th style="border:1px solid #94A3B8;padding:8px 12px;">${col}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row, idx) => `
            <tr style="background-color:${idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC"};">
              ${row
                .map((cell) => {
                  const val = cell !== null && cell !== undefined ? String(cell) : "-";
                  const isNum = typeof cell === "number";
                  return `<td style="border:1px solid #CBD5E1;padding:6px 10px;text-align:${isNum ? "center" : "left"};">${val}</td>`;
                })
                .join("")}
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  } else {
    console.error("exportToExcel: Data atau elemen tabel tidak ditemukan.");
    return;
  }

  const cleanFileName = fileName.endsWith(".xls") ? fileName : `${fileName}.xls`;

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${title.slice(0, 30)}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, Arial, sans-serif; }
          .kop-instansi { font-size: 13pt; font-weight: bold; text-align: center; }
          .kop-sub { font-size: 10pt; text-align: center; color: #475569; }
          .doc-title { font-size: 14pt; font-weight: bold; text-align: center; margin: 12px 0 4px 0; }
          .doc-subtitle { font-size: 10pt; font-style: italic; text-align: center; margin-bottom: 12px; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #E2E8F0; font-weight: bold; border: 1px solid #000; padding: 6px; }
          td { border: 1px solid #000; padding: 5px; }
        </style>
      </head>
      <body>
        <div class="kop-instansi">PEMERINTAH PROVINSI JAWA TENGAH</div>
        <div class="kop-instansi">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
        <div class="kop-instansi">${siteConfig.schoolName.toUpperCase()}</div>
        <div class="kop-sub">Kompetensi Keahlian ${siteConfig.jurusan} - Kelas ${siteConfig.className}</div>
        <div class="kop-sub">Jl. Veteran No. 38, Sukoharjo, Jawa Tengah 57511 | Telp: (0271) 593125</div>
        <hr style="border-top: 2px solid #000; border-bottom: 1px solid #000; margin: 8px 0 16px 0;" />
        
        <div class="doc-title">${title.toUpperCase()}</div>
        ${subtitle ? `<div class="doc-subtitle">${subtitle}</div>` : ""}
        
        ${tableHtml}

        <br />
        <div style="font-size: 9pt; color: #64748B; margin-top: 16px;">
          Dokumen ini diekspor secara digital melalui Portal Resmi ${siteConfig.siteName} pada ${new Date().toLocaleString("id-ID")}.
        </div>
      </body>
    </html>
  `;

  // \uFEFF adalah UTF-8 Byte Order Mark (BOM) agar Excel mengenali encoding secara akurat
  const blob = new Blob([`\uFEFF${excelTemplate}`], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = cleanFileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
