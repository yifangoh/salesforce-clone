import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="text-2xl font-semibold text-ink">We couldn&apos;t find that page</h1>
      <p className="text-sm text-slate-500">The record may have been deleted, or you may not have access to it.</p>
      <Link href="/" className="btn-primary mt-3">Back to Home</Link>
    </div>
  );
}
