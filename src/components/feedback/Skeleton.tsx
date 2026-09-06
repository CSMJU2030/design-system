"use client";

import { cn } from "../../lib/cn";

export interface SkeletonProps {
  /** ใช้ token เท่านั้น เช่น "var(--csmju-space-10)" หรือ "100%" */
  width?: string;
  height?: string;
  shape?: "text" | "rect" | "circle";
  className?: string;
}

/**
 * §9.1 Skeleton ต้องมีรูปร่างใกล้เคียงเนื้อหาจริง — ป้องกัน CLS ตาม §15
 * ใช้ใน loading.tsx ของทุก route segment (§16.1.1)
 */
export function Skeleton({ width = "100%", height, shape = "text", className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("csmju-skeleton", `csmju-skeleton--${shape}`, className)}
      // ขนาดเป็นค่า runtime ที่คำนวณตามเนื้อหาจริง — §16.2 ข้อ 9 อนุญาตกรณีนี้
      style={{ width, ...(height ? { height } : {}) }}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/** ย่อหน้าจำลอง — บรรทัดสุดท้ายสั้นกว่าเพื่อให้เหมือนข้อความจริง */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <span
      className={cn(className)}
      style={{ display: "flex", flexDirection: "column", gap: "var(--csmju-space-2)" }}
    >
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </span>
  );
}

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

/** §8.2 ทุกตารางต้องมี skeleton แถวตอนโหลด */
export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="csmju-table-wrap" aria-hidden="true">
      <div style={{ padding: "var(--csmju-space-4)", display: "flex", flexDirection: "column", gap: "var(--csmju-space-4)" }}>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} style={{ display: "flex", gap: "var(--csmju-space-4)" }}>
            {Array.from({ length: columns }, (_, c) => (
              <Skeleton key={c} width={c === 0 ? "30%" : "100%"} height="var(--csmju-space-4)" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
