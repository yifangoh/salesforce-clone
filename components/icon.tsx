import { Building2, CalendarCheck, LifeBuoy, Package, Target, UserPlus, Users, type LucideProps } from "lucide-react";
import type { IconName } from "@/lib/objects";

const ICONS = { Building2, CalendarCheck, LifeBuoy, Package, Target, UserPlus, Users };

export function ObjectIcon({ name, color, size = "md" }: { name: IconName; color: string; size?: "sm" | "md" | "lg" }) {
  const Cmp = ICONS[name];
  const box = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const icon: LucideProps["size"] = size === "lg" ? 24 : size === "sm" ? 14 : 18;
  return (
    <span className={`${box} ${color} inline-flex shrink-0 items-center justify-center rounded-md text-white`}>
      <Cmp size={icon} strokeWidth={2} />
    </span>
  );
}
