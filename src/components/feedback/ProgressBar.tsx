"use client";

import { cn } from "../../lib/cn";

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** 🔴 §12 ต้องมีคำอธิบายให้ screen reader เสมอ */
  label: string;
  /** แสดงเปอร์เซ็นต์เป็นตัวเลขข้างแถบ */
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({ value, label, showValue = false, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={cn(className)}>
      <div
        className="csmju-progress"
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* ความกว้างเป็นค่า runtime — §16.2 ข้อ 9 อนุญาต */}
        <div className="csmju-progress__bar" style={{ width: `${clamped}%` }} />
      </div>
      {showValue ? (
        <p
          className="csmju-tabular"
          style={{
            marginBlockStart: "var(--csmju-space-1)",
            fontSize: "var(--csmju-text-body-sm)",
            color: "var(--csmju-color-text-muted)",
          }}
        >
          {clamped}%
        </p>
      ) : null}
    </div>
  );
}
