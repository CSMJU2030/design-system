"use client";

import NextLink from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "../../lib/cn";

export interface BreadcrumbItem {
  label: string;
  /** ไม่มี href = เป็นรายการปัจจุบัน */
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb — §5.1
 * AppShell สร้างให้อัตโนมัติจาก route แล้ว ระบบย่อยใช้ตรงๆ เฉพาะเมื่อต้องการชื่อที่ต่างจาก path
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav className={cn("csmju-breadcrumb", className)} aria-label="เส้นทางนำทาง">
      <ol className="csmju-breadcrumb__list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} style={{ display: "contents" }}>
              {i > 0 ? (
                <span className="csmju-breadcrumb__sep" aria-hidden="true">
                  <ChevronLeft size={14} style={{ transform: "scaleX(-1)" }} />
                </span>
              ) : null}
              {item.href && !isLast ? (
                <NextLink href={item.href}>{item.label}</NextLink>
              ) : (
                <span className="csmju-breadcrumb__current" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
