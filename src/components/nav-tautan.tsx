"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavTautan({
  href,
  label,
  Ikon,
}: {
  href: string;
  label: string;
  Ikon: LucideIcon;
}) {
  const jalur = usePathname();
  const aktif = jalur === href || jalur.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={aktif ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-kartu px-3 py-2 text-[14px] whitespace-nowrap",
        aktif
          ? "bg-inti-lembut font-medium text-inti"
          : "text-teks-lembut hover:bg-latar hover:text-teks",
      )}
    >
      <Ikon aria-hidden className="size-4 shrink-0" />
      {label}
    </Link>
  );
}
