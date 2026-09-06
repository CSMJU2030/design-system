"use client";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useEscapeKey, useFocusTrap, useScrollLock } from "../../lib/dom";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** "end" = เลื่อนเข้ามาจากขวา (ค่าเริ่มต้น) · "start" = จากซ้าย (ใช้กับเมนูมือถือ) */
  side?: "start" | "end";
  footer?: ReactNode;
  className?: string;
}

/** Drawer — §6.2 เมนูมือถือและ filter panel */
export function Drawer({ open, onClose, title, children, side = "end", footer, className }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useFocusTrap(panelRef, open);
  useEscapeKey(open, onClose);
  useScrollLock(open);

  if (!open) return null;

  return (
    <div
      className={cn("csmju-overlay", side === "start" ? "csmju-overlay--drawer-start" : "csmju-overlay--drawer")}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("csmju-drawer", className)}
      >
        <div className="csmju-drawer__header">
          <h2 id={titleId} className="csmju-drawer__title">
            {title}
          </h2>
          <button type="button" className="csmju-icon-btn" aria-label="ปิดเมนู" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="csmju-drawer__body">{children}</div>
        {footer ? <div className="csmju-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
