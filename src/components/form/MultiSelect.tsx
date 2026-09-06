"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { useClickOutside, useEscapeKey } from "../../lib/dom";
import { Tag } from "../data/display";
import type { SelectOption } from "./inputs";

export interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  /** ข้อความเมื่อยังไม่เลือกอะไร — ไม่ใช่ label (label อยู่ที่ FormField) */
  emptyLabel?: string;
  id?: string;
  disabled?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
  className?: string;
}

/**
 * เลือกได้หลายค่า — §7.1
 *
 * ใช้ปุ่ม + panel ที่มี checkbox จริง (ไม่ใช่ div ที่ทำท่าเป็น checkbox)
 * เพื่อให้ใช้งานด้วยคีย์บอร์ดและ screen reader ได้ตามปกติ (§12.1, §12.6)
 */
export function MultiSelect({
  options,
  value,
  onValueChange,
  emptyLabel = "เลือกรายการ",
  id,
  disabled = false,
  className,
  ...aria
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, open, () => setOpen(false));
  useEscapeKey(open, () => setOpen(false));

  const selected = options.filter((o) => value.includes(o.value));

  const toggle = (optionValue: string) => {
    onValueChange(
      value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue],
    );
  };

  return (
    <div ref={wrapRef} className={cn("csmju-dropdown", className)} style={{ display: "block" }}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        className="csmju-input"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: "var(--csmju-space-2)", textAlign: "start" }}
        {...aria}
      >
        <span style={{ flex: "1 1 auto", minWidth: 0 }}>
          {selected.length === 0 ? (
            <span style={{ color: "var(--csmju-color-text-muted)" }}>{emptyLabel}</span>
          ) : (
            `เลือกแล้ว ${selected.length} รายการ`
          )}
        </span>
        <ChevronDown size={18} aria-hidden="true" style={{ flex: "none", color: "var(--csmju-color-text-muted)" }} />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="csmju-dropdown__panel csmju-dropdown__panel--start"
          style={{ width: "100%", maxHeight: "var(--csmju-space-20)", overflowY: "auto" }}
        >
          {options.map((o) => {
            const checked = value.includes(o.value);
            return (
              <label key={o.value} className="csmju-dropdown__item" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={o.disabled}
                  onChange={() => toggle(o.value)}
                  className="csmju-sr-only"
                />
                <span aria-hidden="true" style={{ width: "var(--csmju-space-4)" }}>
                  {checked ? <Check size={16} /> : null}
                </span>
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {selected.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--csmju-space-2)",
            marginBlockStart: "var(--csmju-space-2)",
          }}
        >
          {selected.map((o) => (
            <Tag key={o.value} onRemove={() => toggle(o.value)}>
              {o.label}
            </Tag>
          ))}
        </div>
      ) : null}
    </div>
  );
}
