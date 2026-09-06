"use client";

import { useId, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../../lib/cn";

export interface FormFieldRenderProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean | undefined;
  "aria-required": boolean | undefined;
  required: boolean;
}

export interface FormFieldProps {
  /** 🔴 §8.1 ทุก input ต้องมี label ที่มองเห็นได้ ห้ามใช้ placeholder แทน */
  label: string;
  /** คำอธิบายใต้ label */
  hint?: ReactNode;
  /**
   * ข้อความ error ของฟิลด์นี้ — ปกติมาจาก error.details.field ของ VALIDATION_ERROR (§9.3)
   * component จะผูก aria-describedby ให้อัตโนมัติ
   */
  error?: string | null;
  required?: boolean;
  /** รับ props ที่ต้องผูกกับ input ไปใช้ — บังคับให้ผูกครบทุกตัวโดยไม่ต้องจำเอง */
  children: (props: FormFieldRenderProps) => ReactNode;
  className?: string;
}

/**
 * ตัวห่อฟิลด์มาตรฐาน — §8.1
 *
 * จัดการให้: label ที่มองเห็นได้ · เครื่องหมาย * + aria-required · hint · error ใต้ฟิลด์
 * พร้อมไอคอน · การผูก aria-describedby ทั้งหมด
 *
 * @example
 * <FormField label="รหัสครุภัณฑ์" required error={errors.asset_code} hint="ตัวอย่าง: CS-PRJ-001">
 *   {(props) => <TextInput {...props} value={code} onChange={(e) => setCode(e.target.value)} />}
 * </FormField>
 */
export function FormField({
  label,
  hint,
  error,
  required = false,
  children,
  className,
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("csmju-field", className)}>
      <label className="csmju-field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="csmju-field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p className="csmju-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {children({
        id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
        required,
      })}
      {error ? (
        <p className="csmju-field__error" id={errorId}>
          <AlertCircle size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

/** §8.1 ฟอร์มยาว > 8 ฟิลด์ ให้แบ่งกลุ่มด้วย fieldset + legend */
export function FieldGroup({
  legend,
  children,
  className,
}: {
  legend: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("csmju-fieldset", className)}>
      <legend className="csmju-fieldset__legend">{legend}</legend>
      {children}
    </fieldset>
  );
}

/** ฟิลด์สั้นที่สัมพันธ์กัน 2 คอลัมน์ (ชื่อ/นามสกุล, วันเริ่ม/วันสิ้นสุด) — §8.1 */
export function FormRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("csmju-form-row", "csmju-form-row--2", className)}>{children}</div>;
}

/** §8.1 ปุ่มส่งอยู่ล่างซ้ายเสมอ เรียง [บันทึก] [ยกเลิก] เหมือนกันทุกระบบ */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("csmju-form__actions", className)}>{children}</div>;
}
