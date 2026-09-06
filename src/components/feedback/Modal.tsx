"use client";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useEscapeKey, useFocusTrap, useScrollLock } from "../../lib/dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** ชื่อกล่อง — ผูกด้วย aria-labelledby ให้อัตโนมัติ (§8.3 บังคับ) */
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** ปุ่มด้านล่าง — เรียง [ยืนยัน] [ยกเลิก] เหมือนกันทุกระบบ (§8.1) */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** ปิดเมื่อคลิกพื้นหลัง (ปิดไว้เมื่อกล่องมีฟอร์มที่ยังไม่บันทึก) */
  closeOnOverlayClick?: boolean;
  className?: string;
}

/**
 * Modal — §8.3
 *
 * ใช้เมื่อ: ยืนยันการกระทำ · ฟอร์มสั้น (≤5 ฟิลด์) · ดูรายละเอียดย่อ
 * ❌ ห้ามใช้กับ: ฟอร์มยาว · flow หลายขั้นตอน · เนื้อหาที่ควรมี URL ของตัวเอง
 *
 * component จัดการให้แล้ว: focus trap · Esc · คืน focus · role/aria · ล็อกสกรอลล์
 * บนมือถือแสดงเป็น full-screen sheet ตาม §6.2
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useFocusTrap(panelRef, open);
  useEscapeKey(open, onClose);
  useScrollLock(open);

  if (!open) return null;

  return (
    <div
      className="csmju-overlay csmju-overlay--modal"
      onMouseDown={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn("csmju-modal", `csmju-modal--${size}`, className)}
      >
        <div className="csmju-modal__header">
          <div>
            <h2 id={titleId} className="csmju-modal__title">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="csmju-modal__description">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="csmju-icon-btn"
            aria-label="ปิดหน้าต่าง"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children ? <div className="csmju-modal__body">{children}</div> : null}
        {footer ? <div className="csmju-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
