"use client";

/**
 * Mencetak elemen dokumen secara terisolasi penuh melalui iframe tersembunyi.
 * Mencegah kebocoran elemen halaman latar belakang (misalnya navbar, sidebar,
 * atau kartu dashboard) masuk ke hasil cetakan printer/PDF.
 */
export function printIsolatedElement(
  element: HTMLElement | null,
  title: string,
  isLandscape = false,
) {
  if (!element) {
    window.print();
    return;
  }

  // Buat iframe tersembunyi
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Print Document Frame");
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "1024px";
  iframe.style.height = "768px";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Salin seluruh stylesheet aktif untuk menjaga presisi tata letak Tailwind
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((s) => s.outerHTML)
    .join("\n");

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${styles}
        <style>
          @page {
            size: A4 ${isLandscape ? "landscape" : "portrait"};
            margin: ${isLandscape ? "14mm 16mm" : "18mm 16mm"};
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 10pt !important;
            line-height: 1.35 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-sheet {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: ${isLandscape ? "6mm 8mm" : "8mm 10mm"} !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  let hasPrinted = false;
  const triggerPrint = () => {
    if (hasPrinted) return;
    hasPrinted = true;

    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("Gagal memanggil print pada iframe terisolasi:", err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  };

  // Tunggu gambar di dalam dokumen iframe termuat
  if (iframe.contentWindow) {
    iframe.contentWindow.onload = () => {
      setTimeout(triggerPrint, 250);
    };
  }

  // Pengaman bila onload telah terpicu sebelum listener terdaftar
  setTimeout(triggerPrint, 450);
}
