"use client";

import { cn } from "../../lib/cn";

export interface SpinnerProps {
  size?: number;
  /** ข้อความสำหรับ screen reader — ถ้าไม่ระบุจะถือว่าเป็นของประกอบและซ่อนจาก a11y tree */
  label?: string;
  className?: string;
}

/**
 * §9.1 ⚠️ spinner กลางจอ "ห้าม" ใช้แทน skeleton ตอนโหลดหน้า
 * ใช้ได้เฉพาะในปุ่มหรือพื้นที่เล็กๆ ที่ทำ skeleton ไม่ได้
 */
export function Spinner({ size = 20, label, className }: SpinnerProps) {
  return (
    <span role={label ? "status" : undefined} aria-live={label ? "polite" : undefined}>
      <svg
        className={cn("csmju-spinner", className)}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      {label ? <span className="csmju-sr-only">{label}</span> : null}
    </span>
  );
}
