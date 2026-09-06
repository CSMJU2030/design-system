"use client";

import type { ReactNode } from "react";
import { Inbox, SearchX } from "lucide-react";
import { cn } from "../../lib/cn";

export interface EmptyStateProps {
  /**
   * §9.2 แยกให้ชัดระหว่างสองกรณี — เป็นคนละข้อความและคนละทางออก
   *  - "no-data"    ยังไม่มีข้อมูล    -> ชวนให้สร้าง
   *  - "no-results" ค้นหาแล้วไม่พบ    -> ชวนให้ล้างตัวกรอง
   */
  variant?: "no-data" | "no-results";
  /** @example "ยังไม่มีรายการครุภัณฑ์" */
  title: string;
  /** อธิบายว่าทำไมว่าง @example "เริ่มต้นด้วยการเพิ่มครุภัณฑ์ชิ้นแรกของภาควิชา" */
  description?: ReactNode;
  /** 🔴 §9.2 ต้องมีปุ่มทางออกเสมอ @example <Button variant="primary">เพิ่มครุภัณฑ์</Button> */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * §9.2 บังคับทุกที่ที่แสดงรายการ — ต้องมี 3 องค์ประกอบ:
 * ไอคอน/ภาพเบาๆ + อธิบายว่าทำไมว่าง + ปุ่มทางออก
 *
 * ใช้เป็น not-found.tsx ของทุก route segment ด้วย (§16.1.1)
 * NOT_FOUND (404) ต้องแสดงเป็น EmptyState ไม่ใช่ error สีแดง (§9.3)
 */
export function EmptyState({
  variant = "no-data",
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  const DefaultIcon = variant === "no-results" ? SearchX : Inbox;
  return (
    <div className={cn("csmju-state", className)}>
      <div className="csmju-state__icon">
        {icon ?? <DefaultIcon size={28} aria-hidden="true" />}
      </div>
      <p className="csmju-state__title">{title}</p>
      {description ? <p className="csmju-state__description">{description}</p> : null}
      {action ? <div className="csmju-state__actions">{action}</div> : null}
    </div>
  );
}
