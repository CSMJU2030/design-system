"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

/* ============================================================
   Badge — §7.1
   ============================================================ */
export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** ไอคอนกำกับ — §3.1 ห้ามสื่อความหมายด้วยสีอย่างเดียว */
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({ tone = "neutral", icon, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn("csmju-badge", `csmju-badge--${tone}`, className)} {...rest}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}

/** §3.3 badge ตัวเลขแจ้งเตือน — เป็นที่เดียวที่ใช้ radius-full กับสี่เหลี่ยมได้ */
export function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="csmju-badge csmju-badge--count" aria-label={`${label} ${count} รายการ`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ============================================================
   StatusDot — §3.1 ต้องมาคู่กับข้อความเสมอ
   ============================================================ */
export interface StatusDotProps {
  tone?: Tone;
  /** 🔴 ข้อความบังคับ — จุดสีอย่างเดียวคนตาบอดสีอ่านไม่ได้ */
  children: ReactNode;
  className?: string;
}

export function StatusDot({ tone = "neutral", children, className }: StatusDotProps) {
  return (
    <span className={cn("csmju-status", `csmju-status--${tone}`, className)}>
      <span className="csmju-status__dot" aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

/* ============================================================
   Tag — §7.1
   ============================================================ */
export interface TagProps {
  children: ReactNode;
  /** ถ้าส่งมา จะแสดงปุ่มลบพร้อม aria-label ที่อ่านรู้เรื่อง */
  onRemove?: () => void;
  className?: string;
}

export function Tag({ children, onRemove, className }: TagProps) {
  return (
    <span className={cn("csmju-tag", className)}>
      {children}
      {onRemove ? (
        <button
          type="button"
          className="csmju-tag__remove"
          onClick={onRemove}
          aria-label={`ลบ ${typeof children === "string" ? children : "รายการนี้"}`}
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}

/* ============================================================
   Avatar — §14 ไม่มีรูป -> อักษรย่อบนพื้น primary-soft
   ============================================================ */
export interface AvatarProps {
  /** ชื่อ-สกุล ใช้ทั้งเป็น alt และเป็นที่มาของอักษรย่อ */
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** ตัดอักษรย่อจากชื่อไทย — เอาตัวแรกของคำแรกและคำที่สอง */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]!.charAt(0);
  const second = parts.length > 1 ? parts[1]!.charAt(0) : "";
  return (first + second).toUpperCase();
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return (
    <span className={cn("csmju-avatar", `csmju-avatar--${size}`, className)}>
      {src ? (
        // ใช้ <img> ธรรมดาเพราะ avatar มาจากโดเมนที่ next/image ต้องประกาศ remotePatterns ก่อน
        // ซึ่งทำให้ระบบย่อยพังตอน deploy — ขนาดเล็กและกำหนดขนาดตายตัวแล้วจึงไม่เกิด CLS
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={64} height={64} loading="lazy" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
      <span className="csmju-sr-only">{name}</span>
    </span>
  );
}

/* ============================================================
   StatCard — §19.1 ข้อ 5 ตั้ง tabular-nums ให้แล้ว
   ============================================================ */
export interface StatCardProps {
  label: string;
  /** ส่งค่าที่ format แล้วมา (formatNumber / formatMoney) */
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  /** ข้อความอธิบายใต้ตัวเลข เช่น "เพิ่มขึ้น 12 รายการจากเดือนที่แล้ว" */
  hint?: ReactNode;
  /**
   * §19.1 ข้อ 6 พื้นเน้นใช้เฉพาะการ์ดที่ "ต้องการการดำเนินการ"
   * และต้องมี hint บอกเหตุผลเสมอ ไม่งั้นกลายเป็นการเน้นแบบสุ่ม
   */
  attention?: boolean;
  className?: string;
}

export function StatCard({ label, value, unit, icon, hint, attention = false, className }: StatCardProps) {
  return (
    <div className={cn("csmju-stat", attention && "csmju-stat--attention", className)}>
      <p className="csmju-stat__label">
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        {label}
      </p>
      <p className="csmju-stat__value">
        {value}
        {unit ? <span className="csmju-stat__unit">{unit}</span> : null}
      </p>
      {hint ? <p className="csmju-stat__foot">{hint}</p> : null}
    </div>
  );
}

/* ============================================================
   DescriptionList — §7.1 แสดงรายละเอียดแบบ label/value
   ============================================================ */
export interface DescriptionListItem {
  term: string;
  description: ReactNode;
}

export interface DescriptionListProps {
  items: DescriptionListItem[];
  columns?: 1 | 2;
  className?: string;
}

export function DescriptionList({ items, columns = 2, className }: DescriptionListProps) {
  return (
    <dl className={cn("csmju-dl", columns === 2 && "csmju-dl--2", className)}>
      {items.map((item, i) => (
        <div key={`${item.term}-${i}`} className="csmju-dl__item">
          <dt className="csmju-dl__term">{item.term}</dt>
          <dd className="csmju-dl__desc">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ============================================================
   Timeline — §7.1 ประวัติการทำรายการ
   ============================================================ */
export interface TimelineItem {
  title: ReactNode;
  /** ส่งค่าที่ format แล้ว (formatDateTime) */
  time?: ReactNode;
  description?: ReactNode;
  active?: boolean;
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("csmju-timeline", className)}>
      {items.map((item, i) => (
        <li key={i} className={cn("csmju-timeline__item", item.active && "csmju-timeline__item--active")}>
          <span className="csmju-timeline__rail" aria-hidden="true">
            <span className="csmju-timeline__dot" />
          </span>
          <div className="csmju-timeline__body">
            <p className="csmju-timeline__title">{item.title}</p>
            {item.time ? <p className="csmju-timeline__time">{item.time}</p> : null}
            {item.description ? <div>{item.description}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
