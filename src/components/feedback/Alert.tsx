"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "../../lib/cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children: ReactNode;
  /** ปุ่มทางออก เช่น "ลองอีกครั้ง" — §9.4 error ที่ดีต้องบอกว่าต้องทำอะไรต่อ */
  actions?: ReactNode;
  className?: string;
}

const ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} as const;

/**
 * Alert แบบ inline — §8.4
 *
 * ใช้กับ: error ของทั้งฟอร์ม (บนสุดของฟอร์ม, ค้างไว้), CONFLICT, ปัญหาเครือข่าย
 * ❌ ห้ามใช้ toast แจ้ง error ที่ผู้ใช้ต้องแก้ไข — มันหายไปก่อนผู้ใช้อ่านจบ
 *
 * §3.1 ไม่สื่อความหมายด้วยสีอย่างเดียว — จึงมีไอคอนกำกับทุก tone
 */
export function Alert({ tone = "info", title, children, actions, className }: AlertProps) {
  const Icon = ICON[tone];
  return (
    <div
      className={cn("csmju-alert", `csmju-alert--${tone}`, className)}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon className="csmju-alert__icon" size={20} aria-hidden="true" />
      <div className="csmju-alert__body">
        {title ? <p className="csmju-alert__title">{title}</p> : null}
        <div>{children}</div>
        {actions ? <div className="csmju-alert__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
