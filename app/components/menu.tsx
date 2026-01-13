"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuLink = {
  href: string;
  label: string;
};

const LINKS: MenuLink[] = [
  { href: "/", label: "Coin" },
  { href: "/safe", label: "Safe" },
  { href: "/token", label: "Token" },
  { href: "/blocks", label: "Blocks" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/about", label: "About" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}


function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Menu() {
  const pathname = usePathname() ?? "/";

  return (
    <div className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex w-fit items-center gap-1 rounded-full border border-black/10 bg-white/70 px-2 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40">

        <nav aria-label="Primary navigation" className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = isActivePath(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-black/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/10"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
