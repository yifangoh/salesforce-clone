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
              active ? "border-brand-600 text-brand-700 dark:text-brand-300" : "border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
