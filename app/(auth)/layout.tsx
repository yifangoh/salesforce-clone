import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#0b1f3a] via-[#123067] to-brand-600 p-12 text-white lg:flex">
        <Logo dark />
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-semibold leading-tight">Every lead, deal and customer in one place.</h1>
          <p className="text-blue-100">Track your pipeline, convert leads, resolve cases and keep your whole team on the same page.</p>
        </div>
        <p className="text-sm text-blue-200">Powered by Supabase · Deployed on Vercel</p>
      </div>
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
