"use client";

import {
  forwardRef,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatDate, formatFileSize } from "../../lib/format";

/* ============================================================
   TextInput
   ============================================================ */
export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** ไอคอนหน้าช่อง */
  icon?: ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { icon, className, type = "text", ...rest },
  ref,
) {
  const input = (
    <input
      ref={ref}
      type={type}
      className={cn("csmju-input", icon && "csmju-input--with-icon", className)}
      {...rest}
    />
  );
  if (!icon) return input;
  return (
    <span className="csmju-input-group">
      <span className="csmju-input-group__icon" aria-hidden="true">
        {icon}
      </span>
      {input}
    </span>
  );
});

/* ============================================================
   TextArea
   ============================================================ */
export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea ref={ref} rows={rows} className={cn("csmju-input", "csmju-input--textarea", className)} {...rest} />
  );
});

/* ============================================================
   NumberInput — §4.3.9 ตัวเลขต้อง tabular-nums
   ============================================================ */
export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** หน่วยต่อท้าย เช่น "ชิ้น" "บาท" — แสดงเป็นข้อความ ไม่ใช่ placeholder */
  suffix?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { suffix, className, ...rest },
  ref,
) {
  const input = (
    <input
      ref={ref}
      type="number"
      inputMode="decimal"
      className={cn("csmju-input", "csmju-input--number", className)}
      {...rest}
    />
  );
  if (!suffix) return input;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "var(--csmju-space-2)" }}>
      {input}
      <span style={{ flex: "none", color: "var(--csmju-color-text-muted)", fontSize: "var(--csmju-text-body-sm)" }}>
        {suffix}
      </span>
    </span>
  );
});

/* ============================================================
   Select
   ============================================================ */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  /**
   * ข้อความตัวเลือกว่าง — ไม่ใช่ placeholder แทน label
   * @example "— เลือกคณะ —"
   */
  emptyLabel?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, emptyLabel, className, ...rest },
  ref,
) {
  return (
    <span className="csmju-select-wrap">
      <select ref={ref} className={cn("csmju-input", className)} {...rest}>
        {emptyLabel ? <option value="">{emptyLabel}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="csmju-select-wrap__icon" size={18} aria-hidden="true" />
    </span>
  );
});

/* ============================================================
   SearchInput — §8.2 ทุกตารางต้องมีช่องค้นหา
   ============================================================ */
export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  /** 🔴 ต้องมี label ให้ screen reader เสมอ */
  label?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, label = "ค้นหา", placeholder = "ค้นหา", className, ...rest },
  ref,
) {
  return (
    <span className={cn("csmju-input-group", className)}>
      <span className="csmju-input-group__icon" aria-hidden="true">
        <Search size={18} />
      </span>
      <input
        ref={ref}
        type="search"
        role="searchbox"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn("csmju-input", "csmju-input--with-icon", value && "csmju-input--with-trailing")}
        {...rest}
      />
      {value ? (
        <button
          type="button"
          className="csmju-icon-btn csmju-icon-btn--sm csmju-input-group__clear"
          aria-label="ล้างคำค้นหา"
          onClick={() => onValueChange("")}
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
});

/* ============================================================
   Checkbox · Radio · Switch
   ============================================================ */
export interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  hint?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>(function Checkbox(
  { label, hint, className, ...rest },
  ref,
) {
  return (
    <label className={cn("csmju-choice", className)}>
      <input ref={ref} type="checkbox" {...rest} />
      <span className="csmju-choice__text">
        {label}
        {hint ? <span className="csmju-choice__hint">{hint}</span> : null}
      </span>
    </label>
  );
});

export const Radio = forwardRef<HTMLInputElement, ChoiceProps>(function Radio(
  { label, hint, className, ...rest },
  ref,
) {
  return (
    <label className={cn("csmju-choice", className)}>
      <input ref={ref} type="radio" {...rest} />
      <span className="csmju-choice__text">
        {label}
        {hint ? <span className="csmju-choice__hint">{hint}</span> : null}
      </span>
    </label>
  );
});

/** กลุ่ม radio — §12 ต้องอยู่ใน fieldset ที่มี legend เพื่อให้ screen reader รู้ว่าเป็นชุดเดียวกัน */
export function RadioGroup({
  legend,
  children,
  className,
}: {
  legend: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("csmju-fieldset", className)} style={{ gap: "var(--csmju-space-1)" }}>
      <legend className="csmju-field__label" style={{ marginBlockEnd: "var(--csmju-space-1)" }}>
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, className, ...rest },
  ref,
) {
  return (
    <label className={cn("csmju-switch", className)}>
      <input ref={ref} type="checkbox" role="switch" className="csmju-sr-only" {...rest} />
      <span className="csmju-switch__track" aria-hidden="true">
        <span className="csmju-switch__thumb" />
      </span>
      <span className="csmju-choice__text">{label}</span>
    </label>
  );
});

/* ============================================================
   DatePicker — §11.3 แสดง พ.ศ. · ส่ง ค.ศ. (ISO)
   ============================================================ */
export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  /** ค่าเป็น ISO date "YYYY-MM-DD" (ค.ศ.) เสมอ — ตรงกับที่ API รับ */
  value: string;
  onValueChange: (isoDate: string) => void;
}

/**
 * ใช้ native <input type="date"> เพื่อให้ได้ปฏิทินของ OS (เข้าถึงได้ + ใช้บนมือถือดีที่สุด)
 * แล้วแสดงค่าที่เลือกเป็น พ.ศ. ข้างใต้ เพื่อให้ผู้ใช้ยืนยันปีได้ถูกต้อง (§19.1 ข้อ 1)
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { value, onValueChange, className, ...rest },
  ref,
) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: "var(--csmju-space-1)" }}>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value)}
        className={cn("csmju-input", className)}
        {...rest}
      />
      {value ? <span className="csmju-datepicker__preview">ที่เลือก: {formatDate(value, "long")}</span> : null}
    </span>
  );
});

export interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  /** "HH:mm" 24 ชั่วโมง */
  value: string;
  onValueChange: (time: string) => void;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker(
  { value, onValueChange, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="time"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn("csmju-input", "csmju-input--number", className)}
      style={{ textAlign: "start" }}
      {...rest}
    />
  );
});

/* ============================================================
   FileUpload
   ============================================================ */
export interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  /** ขนาดสูงสุดต่อไฟล์ (bytes) */
  maxSizeBytes?: number;
  id?: string;
  "aria-describedby"?: string;
  disabled?: boolean;
}

export function FileUpload({
  files,
  onFilesChange,
  accept,
  multiple = false,
  maxSizeBytes,
  id,
  disabled = false,
  ...aria
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept_ = (incoming: FileList | null) => {
    if (!incoming) return;
    const list = Array.from(incoming).filter(
      (f) => maxSizeBytes === undefined || f.size <= maxSizeBytes,
    );
    onFilesChange(multiple ? [...files, ...list] : list.slice(0, 1));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--csmju-space-3)" }}>
      <button
        type="button"
        className="csmju-file-drop"
        data-dragging={dragging}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept_(e.dataTransfer.files);
        }}
      >
        <span>ลากไฟล์มาวาง หรือกดเพื่อเลือกไฟล์</span>
        {maxSizeBytes ? (
          <span style={{ fontSize: "var(--csmju-text-body-sm)" }}>
            ขนาดไม่เกิน {formatFileSize(maxSizeBytes)} ต่อไฟล์
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="csmju-sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => accept_(e.target.files)}
        {...aria}
      />
      {files.length > 0 ? (
        <ul className="csmju-file-list">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="csmju-file-item">
              <span className="csmju-file-item__name">{file.name}</span>
              <span className="csmju-file-item__size">{formatFileSize(file.size)}</span>
              <button
                type="button"
                className="csmju-icon-btn csmju-icon-btn--sm"
                aria-label={`ลบไฟล์ ${file.name}`}
                onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
