import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Satu-satunya komponen yang mengubah Markdown menjadi HTML di seluruh
 * aplikasi - dipakai baik oleh /blog/[slug] (tampilan publik) maupun
 * MarkdownEditor (pratinjau penulis). Konfigurasi rehype-sanitize di sini
 * TIDAK PERNAH disesuaikan per pemanggil; itulah yang menutup celah selisih
 * perilaku pratinjau-vs-publik yang diwanti-wanti Bagian 10 brief.
 *
 * remark-gfm menambah dukungan tabel/strikethrough dari sintaks Markdown
 * murni. rehype-sanitize memakai defaultSchema hast-util-sanitize TANPA
 * kustomisasi - sudah menolak tag `script`, seluruh atribut `on*` (event
 * handler), dan skema URL selain http/https/mailto/dst pada href/src
 * (menutup javascript: URI). react-markdown sendiri, TANPA plugin
 * rehype-raw, tidak pernah mem-parse HTML mentah dalam sumber Markdown
 * menjadi elemen DOM sungguhan - itu sudah menutup vektor <script> secara
 * default, rehype-sanitize adalah lapis kedua, bukan satu-satunya lapis.
 */
export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("prose-portal", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
