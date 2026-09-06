"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Tooltip } from "../feedback/Tooltip";

/** §7.2 — primary ใช้ได้สูงสุด 1 ปุ่มต่อหน้าจอ */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** §7.2 loading = spinner + ข้อความเดิม + aria-busy + กดซ้ำไม่ได้ */
  loading?: boolean;
  /**
   * §10.2 🔴 disabled ต้องมาคู่กับ disabledReason เสมอ
   * ปุ่มที่กดไม่ได้โดยไม่บอกเหตุผลคือบั๊กด้าน UX — component จะ render เป็น tooltip + aria-describedby ให้
   */
  disabledReason?: string;
  /** ไอคอนหน้าข้อความ (จะถูกใส่ aria-hidden ให้อัตโนมัติ) */
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /** §6.2 เต็มความกว้าง — ใช้กับปุ่ม action หลักบนมือถือ */
  block?: boolean;
  type?: "button" | "submit" | "reset";
}

function Spinner() {
  return (
    <svg
      className="csmju-btn__spinner"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/**
 * ปุ่มมาตรฐาน — §7.2
 *
 * ข้อความบนปุ่มต้องเป็นคำกริยาที่บอกผลลัพธ์ ("บันทึกการเปลี่ยนแปลง" ไม่ใช่ "ตกลง")
 * และต้องใช้คำมาตรฐานตาม §11.2
 *
 * @example
 * <Button variant="primary" loading={saving}>บันทึก</Button>
 * <Button variant="secondary" disabled disabledReason="ครุภัณฑ์นี้ถูกยืมอยู่ กำหนดคืน 20 ส.ค. 2569">
 *   ยืมครุภัณฑ์
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    disabled = false,
    disabledReason,
    startIcon,
    endIcon,
    block = false,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  const button = (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "csmju-btn",
        `csmju-btn--${variant}`,
        `csmju-btn--${size}`,
        block && "csmju-btn--block",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : startIcon ? <span aria-hidden="true">{startIcon}</span> : null}
      <span>{children}</span>
      {endIcon && !loading ? <span aria-hidden="true">{endIcon}</span> : null}
    </button>
  );

  // ปุ่มที่ disabled ไม่ยิง event เอง จึงต้องมี wrapper รับ hover/focus แทน — Tooltip จัดการให้
  if (disabled && disabledReason) {
    return <Tooltip content={disabledReason}>{button}</Tooltip>;
  }
  return button;
});
