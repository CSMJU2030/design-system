"use client";

import { type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { SearchInput } from "../form/inputs";
import { ErrorState } from "../feedback/ErrorState";
import { Skeleton } from "../feedback/Skeleton";
import type { CsmjuErrorUi } from "../../lib/errors";

export type SortDirection = "asc" | "desc";

export interface DataTableColumn<T> {
  /** ชื่อฟิลด์ — 🔴 ต้องตรงกับ data-dictionary.md (snake_case) §16.2 ข้อ 11 */
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** §8.2 คอลัมน์ตัวเลข/เงินชิดขวา + tabular-nums */
  align?: "start" | "numeric";
  /** §8.2 การเรียงต้องส่งไป backend ไม่ใช่เรียงในหน้าเว็บ */
  sortable?: boolean;
  /** ซ่อนคอลัมน์นี้ในโหมดการ์ดบนมือถือ (แสดง 3–4 ฟิลด์สำคัญพอ) */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** คำอธิบายตารางสำหรับ screen reader เช่น "รายการครุภัณฑ์ทั้งหมด" */
  caption: string;

  /* --- 4 สถานะบังคับ §9 --- */
  loading?: boolean;
  error?: CsmjuErrorUi | null;
  onRetry?: () => void;
  /** §9.2 "ยังไม่มีข้อมูล" — ชวนให้สร้าง */
  empty: { title: string; description?: ReactNode; action?: ReactNode };
  /** §9.2 "ค้นหาแล้วไม่พบ" — ชวนให้ล้างตัวกรอง (คนละข้อความกับ empty) */
  emptyFiltered?: { title: string; description?: ReactNode; action?: ReactNode };

  /* --- §8.2 ทุกตารางต้องมีช่องค้นหา + pagination --- */
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  filters?: ReactNode;
  pagination?: { page: number; perPage?: number; total: number; onPageChange: (p: number) => void };
  sort?: { key: string | null; direction: SortDirection; onChange: (key: string, d: SortDirection) => void };

  /** §8.2 เลือกหลายแถว -> แถบ action พร้อมจำนวนที่เลือก */
  selection?: {
    selectedKeys: string[];
    onChange: (keys: string[]) => void;
    actions: ReactNode;
  };

  /** §8.2 คอลัมน์ "จัดการ" อยู่ขวาสุดเสมอ ใช้ IconButton + aria-label */
  rowActions?: (row: T) => ReactNode;

  /** §6.2 บนมือถือ: "cards" แปลงแต่ละแถวเป็นการ์ด (แนะนำ) · "scroll" เลื่อนแนวนอน */
  responsive?: "cards" | "scroll";
  /** §8.2 แถวสูง 48px (comfortable) / 40px (compact) */
  density?: "comfortable" | "compact";
  className?: string;
}

/**
 * ตารางข้อมูลมาตรฐาน — §8.2
 *
 * บังคับให้ครบ 4 สถานะตาม §9 ด้วยตัว type เอง: ถ้าไม่ส่ง `empty` มา TypeScript จะไม่ยอมคอมไพล์
 * ทำให้ AIE ลืมทำ empty state ไม่ได้แม้จะรีบแค่ไหน
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  loading = false,
  error = null,
  onRetry,
  empty,
  emptyFiltered,
  search,
  filters,
  pagination,
  sort,
  selection,
  rowActions,
  responsive = "cards",
  density = "comfortable",
  className,
}: DataTableProps<T>) {
  const hasToolbar = Boolean(search || filters);
  const isFiltered = Boolean(search?.value);

  const allKeys = rows.map(rowKey);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selection?.selectedKeys.includes(k));

  const toggleAll = () => {
    if (!selection) return;
    selection.onChange(allSelected ? [] : allKeys);
  };

  const toggleRow = (key: string) => {
    if (!selection) return;
    selection.onChange(
      selection.selectedKeys.includes(key)
        ? selection.selectedKeys.filter((k) => k !== key)
        : [...selection.selectedKeys, key],
    );
  };

  const onSort = (key: string) => {
    if (!sort) return;
    const next: SortDirection = sort.key === key && sort.direction === "asc" ? "desc" : "asc";
    sort.onChange(key, next);
  };

  const toolbar = hasToolbar ? (
    <div className="csmju-table-toolbar">
      {search ? (
        <div className="csmju-table-toolbar__search">
          <SearchInput
            value={search.value}
            onValueChange={search.onChange}
            label={`ค้นหาใน${caption}`}
            placeholder={search.placeholder ?? "ค้นหา"}
          />
        </div>
      ) : null}
      {filters}
    </div>
  ) : null;

  /* ---------- สถานะ error (§9.3) ---------- */
  if (error) {
    return (
      <div className={cn("csmju-table-wrap", className)}>
        {toolbar}
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  /* ---------- สถานะ loading — skeleton แถว ไม่ใช่ spinner (§9.1) ---------- */
  if (loading) {
    return (
      <div className={cn("csmju-table-wrap", className)}>
        {toolbar}
        <div style={{ padding: "var(--csmju-space-4)", display: "flex", flexDirection: "column", gap: "var(--csmju-space-4)" }}>
          {Array.from({ length: 5 }, (_, r) => (
            <div key={r} style={{ display: "flex", gap: "var(--csmju-space-4)" }}>
              {columns.map((c, i) => (
                <Skeleton key={c.key} width={i === 0 ? "30%" : "100%"} height="var(--csmju-space-4)" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- สถานะว่าง — แยก "ยังไม่มีข้อมูล" กับ "ค้นหาไม่พบ" (§9.2) ---------- */
  if (rows.length === 0) {
    const state = isFiltered && emptyFiltered ? emptyFiltered : empty;
    return (
      <div className={cn("csmju-table-wrap", className)}>
        {toolbar}
        <EmptyState
          variant={isFiltered ? "no-results" : "no-data"}
          title={state.title}
          description={state.description}
          action={state.action}
        />
      </div>
    );
  }

  return (
    <div className={cn("csmju-table-wrap", className)}>
      {toolbar}

      {/* โหมดตารางเต็ม — ซ่อนบนมือถือเมื่อ responsive="cards" */}
      <div
        className="csmju-table-scroll"
        {...(responsive === "cards" ? { "data-csmju-hide-mobile": "true" } : {})}
        style={responsive === "cards" ? undefined : undefined}
      >
        <table className={cn("csmju-table", density === "compact" && "csmju-table--compact")}>
          <caption className="csmju-sr-only">{caption}</caption>
          <thead>
            <tr>
              {selection ? (
                <th scope="col" style={{ width: "1%" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={allSelected ? "ยกเลิกการเลือกทั้งหมด" : "เลือกทั้งหมดในหน้านี้"}
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(col.align === "numeric" && "csmju-col--numeric")}
                  aria-sort={
                    sort?.key === col.key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : col.sortable
                        ? "none"
                        : undefined
                  }
                >
                  {col.sortable && sort ? (
                    <button type="button" className="csmju-table__sort" onClick={() => onSort(col.key)}>
                      {col.header}
                      {sort.key === col.key ? (
                        sort.direction === "asc" ? (
                          <ArrowUp size={14} aria-hidden="true" />
                        ) : (
                          <ArrowDown size={14} aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown size={14} aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {rowActions ? (
                <th scope="col" className="csmju-col--actions">
                  จัดการ
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = rowKey(row);
              return (
                <tr key={key}>
                  {selection ? (
                    <td>
                      <input
                        type="checkbox"
                        checked={selection.selectedKeys.includes(key)}
                        onChange={() => toggleRow(key)}
                        aria-label={`เลือกแถว ${key}`}
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td key={col.key} className={cn(col.align === "numeric" && "csmju-col--numeric")}>
                      {col.render(row)}
                    </td>
                  ))}
                  {rowActions ? <td className="csmju-col--actions">{rowActions(row)}</td> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* §6.2 โหมดการ์ดบนมือถือ */}
      {responsive === "cards" ? (
        <div className="csmju-table-cards" data-csmju-show-mobile="true">
          {rows.map((row) => (
            <article key={rowKey(row)} className="csmju-table-card">
              {columns
                .filter((c) => !c.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="csmju-table-card__row">
                    <span className="csmju-table-card__label">{col.header}</span>
                    <span className="csmju-table-card__value">{col.render(row)}</span>
                  </div>
                ))}
              {rowActions ? <div className="csmju-table-card__actions">{rowActions(row)}</div> : null}
            </article>
          ))}
        </div>
      ) : null}

      {/* §8.2 แถบ action เมื่อเลือกหลายแถว */}
      {selection && selection.selectedKeys.length > 0 ? (
        <div className="csmju-table-selection" role="region" aria-label="การทำงานกับรายการที่เลือก">
          <span>เลือกแล้ว {selection.selectedKeys.length} รายการ</span>
          {selection.actions}
        </div>
      ) : null}

      {pagination ? <Pagination {...pagination} /> : null}
    </div>
  );
}
