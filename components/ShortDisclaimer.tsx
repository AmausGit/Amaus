import { DISCLAIMER_SHORT } from "@/lib/disclaimer";

export default function ShortDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs italic text-slate-400 ${className}`}>
      {DISCLAIMER_SHORT}
    </p>
  );
}
