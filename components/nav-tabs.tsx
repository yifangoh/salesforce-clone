"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OBJECTS, NAV_OBJECTS } from "@/lib/objects";

const TABS = [
  { href: "/", label: "Home" },
  ...NAV_OBJECTS.slice(0, 4).map((k) => ({ href: `/${k}`, label: OBJECTS[k].plural })),
  { href: "/pipeline", label: "Pipeline" },
  ...NAV_OBJECTS.slice(4).map((k) => ({ href: `/${k}`, label: OBJECTS[k].plural })),
];

export function NavTabs() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 lg:px-4">
      {TABS.map((t) => {
        const active = t.href === "/" ? path === "/" : path === t.href || path.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition ${
              active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
