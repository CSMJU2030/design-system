"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Tooltip } from "../feedback/Tooltip";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "aria-label"> {
  /**
   * 🔴 บังคับ — §12.7 ไอคอนล้วนต้องมี aria-label ภาษาไทย
   * ระบุชื่อรายการด้วยเมื่ออยู่ในตาราง เช่น "แก้ไขประกาศ ปฐมนิเทศนักศึกษาใหม่" (§19.1 ข้อ 7)
   */
  label: string;
  icon: ReactNode;
  size?: "sm" | "md";
  tone?: "default" | "danger";
  /** §10.2 disabled ต้องมาคู่กับเหตุผลเสมอ */
  disabledReason?: string;
  type?: "button" | "submit" | "reset";
}

/**
 * ปุ่มไอคอนล้วน — §7.1
 * แสดง label เป็น tooltip ให้ผู้ใช้เมาส์ และเป็น aria-label ให้ screen reader
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, size = "md", tone = "default", disabled, disabledReason, className, type = "button", ...rest },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "csmju-icon-btn",
        size === "sm" && "csmju-icon-btn--sm",
        tone === "danger" && "csmju-icon-btn--danger",
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );

  return <Tooltip content={disabled && disabledReason ? disabledReason : label}>{button}</Tooltip>;
});
