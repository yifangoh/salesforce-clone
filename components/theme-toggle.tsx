"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

const ORDER: Theme[] = ["light", "dark", "system"];
const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const LABELS = { light: "Light", dark: "Dark", system: "System" } as const;

function readTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    if (t === "light" || t === "dark") return t;
  } catch {}
  return "system";
}

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/** Cycles Light → Dark → System. The initial class is set before paint by the inline script in app/layout.tsx. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => setTheme(readTheme()), []);

  // While on "system", follow OS changes live.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme ?? "system") + 1) % ORDER.length]!;
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
    applyTheme(next);
    setTheme(next);
  }

  const current = theme ?? "system";
  const Icon = ICONS[current];
  const nextLabel = LABELS[ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!];

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${LABELS[current]} (switch to ${nextLabel})`}
      aria-label={`Theme: ${LABELS[current]}. Switch to ${nextLabel}`}
      className={`rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 ${className}`}
    >
      {/* Render a stable icon until mounted to avoid a hydration mismatch */}
      <Icon size={18} className={theme ? "" : "opacity-0"} />
    </button>
  );
}
