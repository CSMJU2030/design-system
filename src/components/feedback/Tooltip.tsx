"use client";

import { useId, useState, type ReactElement, type ReactNode } from "react";

export interface TooltipProps {
  /** ข้อความอธิบาย — สำหรับปุ่มที่ disabled คือ "เหตุผลว่าทำไมกดไม่ได้" (§10.2) */
  content: ReactNode;
  children: ReactElement;
}

/**
 * Tooltip — §7.1
 *
 * ห่อ element ด้วย wrapper ที่รับ hover/focus แทน เพราะ element ที่ disabled
 * ไม่ยิง mouse event ของตัวเอง (ทำให้ tooltip ของปุ่ม disabled ไม่ทำงานถ้าผูก event ที่ปุ่มตรงๆ)
 *
 * เนื้อหา tooltip ผูกกับปุ่มด้วย aria-describedby ผ่าน element ที่มองไม่เห็น
 * เพื่อให้ screen reader อ่านได้แม้ tooltip ยังไม่เปิด
 */
export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  if (!content) return children;

  return (
    <span
      className="csmju-tooltip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {children}
      <span id={id} className="csmju-sr-only">
        {content}
      </span>
      {open ? (
        <span role="tooltip" className="csmju-tooltip" aria-hidden="true">
          {content}
        </span>
      ) : null}
    </span>
  );
}
