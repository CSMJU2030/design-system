"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatNumber } from "../../lib/format";

export interface PaginationProps {
  /** หน้าปัจจุบัน เริ่มที่ 1 */
  page: number;
  /** จำนวนต่อหน้า — ค่าเริ่มต้น 20 ตาม api-conventions §5 */
  perPage?: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** สร้างรายการหน้าแบบมี ... เมื่อหน้าเยอะ เพื่อไม่ให้แถวปุ่มล้นบนมือถือ */
function pageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of list) {
    if (prev && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

/**
 * §8.2 ทุกตารางต้องมี pagination
 * การเปลี่ยนหน้าต้องยิงกลับไปที่ NestJS เสมอ ห้ามตัดข้อมูลในหน้าเว็บ
 */
export function Pagination({ page, perPage = 20, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <nav className={cn("csmju-pagination", className)} aria-label="แบ่งหน้า">
      <p>
        แสดง {formatNumber(from)}–{formatNumber(to)} จาก {formatNumber(total)} รายการ
      </p>
      <div className="csmju-pagination__pages">
        <button
          type="button"
          className="csmju-pagination__page"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="csmju-pagination__ellipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className="csmju-pagination__page"
              aria-current={p === page ? "page" : undefined}
              aria-label={`หน้า ${p}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className="csmju-pagination__page"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
