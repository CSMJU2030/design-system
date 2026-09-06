"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

/* ============================================================
   Container — §3.7 กว้างสูงสุด 1280px จัดกึ่งกลาง + padding ตาม breakpoint
   ============================================================ */
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** จำกัดที่ 68ch สำหรับบทความ/ประกาศ (§4.3.8) */
  prose?: boolean;
  children: ReactNode;
}

export function Container({ prose = false, className, children, ...rest }: ContainerProps) {
  return (
    <div className={cn("csmju-container", prose && "csmju-container--prose", className)} {...rest}>
      {children}
    </div>
  );
}

/* ============================================================
   Card — §3.4 surface + border 1px + radius-lg + padding space-6 + ไม่มีเงา
   ============================================================ */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  /** ปุ่ม/เมนูมุมขวาบนของการ์ด */
  actions?: ReactNode;
  /** ไม่มี padding ในตัว — ใช้เมื่อใส่ตารางเต็มการ์ด */
  flush?: boolean;
  /** การ์ดที่คลิกได้ทั้งใบ (ต้องมี <a>/<button> ข้างในเสมอ ห้ามผูก onClick ที่ div — §12.1) */
  interactive?: boolean;
  /**
   * §19.1 ข้อ 6 พื้นเน้นใช้เฉพาะการ์ดที่ "ต้องการการดำเนินการ"
   * และต้องมีข้อความบอกเหตุผลกำกับ ไม่ใช่เน้นแบบสุ่ม
   */
  attention?: boolean;
  children?: ReactNode;
}

export function Card({
  title,
  description,
  actions,
  flush = false,
  interactive = false,
  attention = false,
  className,
  children,
  ...rest
}: CardProps) {
  const hasHeader = Boolean(title || description || actions);
  return (
    <div
      className={cn(
        "csmju-card",
        flush && "csmju-card--flush",
        interactive && "csmju-card--interactive",
        attention && "csmju-card--attention",
        className,
      )}
      {...rest}
    >
      {hasHeader ? (
        <div className={cn("csmju-card__header", flush && "csmju-card__header--padded")}>
          <div>
            {title ? <h3 className="csmju-card__title">{title}</h3> : null}
            {description ? <p className="csmju-card__description">{description}</p> : null}
          </div>
          {actions ? <div className="csmju-page-header__actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/* ============================================================
   Section / Stack — §5.2 block 32px · section 48px
   ============================================================ */
export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function Section({ title, actions, className, children, ...rest }: SectionProps) {
  return (
    <section className={cn("csmju-section", className)} {...rest}>
      {title || actions ? (
        <div className="csmju-page-header" style={{ paddingBlockEnd: 0, borderBlockEnd: "none" }}>
          {title ? <h2 className="csmju-section__title">{title}</h2> : <span />}
          {actions ? <div className="csmju-page-header__actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** ระยะห่างระหว่าง section หลักในหน้า (48px) */
export function Stack({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("csmju-stack", className)} {...rest}>
      {children}
    </div>
  );
}

/* ============================================================
   PageHeader — §5.2 บังคับทุกหน้า
   ============================================================ */
export interface PageHeaderProps {
  /** 🔴 §12.2 h1 หนึ่งตัวต่อหน้า — component นี้เป็นเจ้าของ h1 นั้น */
  title: string;
  /** คำอธิบาย 1 บรรทัดว่าผู้ใช้มาหน้านี้เพื่อทำอะไร (§2.2 ข้อ 2) */
  description?: ReactNode;
  /** ปุ่ม action หลักชิดขวา — primary ได้สูงสุด 1 ปุ่ม (§7.2) */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("csmju-page-header", className)}>
      <div>
        <h1 className="csmju-page-header__title">{title}</h1>
        {description ? <p className="csmju-page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="csmju-page-header__actions">{actions}</div> : null}
    </header>
  );
}

/* ============================================================
   Grid — §5.3 การ์ดในกริด 4 (xl) -> 3 (lg) -> 2 (md) -> 1 (base)
   ============================================================ */
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** จำนวนคอลัมน์สูงสุดบนจอใหญ่ */
  columns?: 1 | 2 | 3 | 4;
  children: ReactNode;
}

export function Grid({ columns = 3, className, children, ...rest }: GridProps) {
  return (
    <div className={cn("csmju-grid", `csmju-grid--${columns}`, className)} {...rest}>
      {children}
    </div>
  );
}

/* ============================================================
   Divider — §3.4 ใช้เส้นก่อนใช้เงาเสมอ
   ============================================================ */
export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
}

export function Divider({ orientation = "horizontal", className, ...rest }: DividerProps) {
  return (
    <hr
      className={cn("csmju-divider", orientation === "vertical" && "csmju-divider--vertical", className)}
      {...(orientation === "vertical" ? { "aria-orientation": "vertical" as const } : {})}
      {...rest}
    />
  );
}
