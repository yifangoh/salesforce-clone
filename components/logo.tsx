import { APP_NAME } from "@/lib/objects";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#1d4fd8" />
        <path d="M6 19c3-4 6-4 9 0s6 4 11 0" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M6 13c3-4 6-4 9 0s6 4 11 0" stroke="#93c5fd" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </svg>
      <span className={`text-base font-semibold tracking-tight ${dark ? "text-white" : "text-ink"}`}>{APP_NAME}</span>
    </span>
  );
}
