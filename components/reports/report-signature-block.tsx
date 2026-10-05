import { formatIndonesianDate } from "@/lib/utils";

interface ReportSignatureBlockProps {
  city?: string;
  date?: Date | string;
  leftRole: string;
  leftName?: string | null;
  leftIdLabel?: string;
  leftIdValue?: string | null;
  rightRole?: string;
  rightName?: string | null;
  rightIdLabel?: string;
  rightIdValue?: string | null;
  singleColumn?: boolean;
}

export function ReportSignatureBlock({
  city = "Sukoharjo",
  date = new Date(),
  leftRole,
  leftName,
  leftIdLabel = "NISN",
  leftIdValue,
  rightRole = "Wali Kelas XII RPL 3",
  rightName,
  rightIdLabel = "NIP",
  rightIdValue,
  singleColumn = false,
}: ReportSignatureBlockProps) {
  const formattedDate = formatIndonesianDate(date);

  return (
    <div className="w-full text-black mt-8 text-xs break-inside-avoid print:break-inside-avoid">
      <div className="flex justify-between items-start gap-8">
        {!singleColumn && (
          <div className="w-64 text-center">
            <p className="font-medium text-neutral-700">Mengetahui,</p>
            <p className="font-semibold text-neutral-900 mt-0.5">{leftRole}</p>
            {/* Ruang tanda tangan dan stempel resmi */}
            <div className="h-16" />
            <p className="font-bold underline text-neutral-950">
              {leftName ? `( ${leftName} )` : "( ........................................ )"}
            </p>
            {leftIdValue ? (
              <p className="text-[11px] text-neutral-700 mt-0.5">
                {leftIdLabel}: {leftIdValue}
              </p>
            ) : null}
          </div>
        )}

        <div className="w-64 text-center ml-auto">
          <p className="font-medium text-neutral-700">
            {city}, {formattedDate}
          </p>
          <p className="font-semibold text-neutral-900 mt-0.5">{rightRole}</p>
          {/* Ruang tanda tangan */}
          <div className="h-16" />
          <p className="font-bold underline text-neutral-950">
            {rightName ? `( ${rightName} )` : "( ........................................ )"}
          </p>
          {rightIdValue ? (
            <p className="text-[11px] text-neutral-700 mt-0.5">
              {rightIdLabel}: {rightIdValue}
            </p>
          ) : (
            <p className="text-[11px] text-neutral-700 mt-0.5">NIP. 19820514 200801 1 012</p>
          )}
        </div>
      </div>
    </div>
  );
}
