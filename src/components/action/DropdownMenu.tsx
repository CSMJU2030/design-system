"use client";

import NextLink from "next/link";
import { useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { useClickOutside, useEscapeKey } from "../../lib/dom";

export interface DropdownMenuProps {
  /** ปุ่มที่กดเพื่อเปิดเมนู — component จะใส่ aria-expanded/aria-haspopup ให้ */
  trigger: (props: {
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
    "aria-controls": string;
  }) => ReactElement;
  children: ReactNode;
  /** จัดชิดขอบไหนของปุ่ม */
  align?: "start" | "end";
  className?: string;
}

/**
 * เมนูแบบดรอปดาวน์ — §7.1
 * ปิดด้วย Esc และคลิกนอกกล่อง (§8.3)
 */
export function DropdownMenu({ trigger, children, align = "end", className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useClickOutside(wrapRef, open, () => setOpen(false));
  useEscapeKey(open, () => setOpen(false));

  return (
    <div ref={wrapRef} className={cn("csmju-dropdown", className)}>
      {trigger({
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        "aria-haspopup": "menu",
        "aria-controls": panelId,
      })}
      {open ? (
        <div
          id={panelId}
          role="menu"
          className={cn("csmju-dropdown__panel", align === "start" && "csmju-dropdown__panel--start")}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  /** ถ้าเป็นการนำทางให้ใส่ href — §12.1 ใช้ <a> สำหรับนำทาง ไม่ใช่ <button> */
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
}

export function DropdownItem({
  children,
  href,
  onClick,
  icon,
  tone = "default",
  disabled = false,
}: DropdownItemProps) {
  const classes = cn("csmju-dropdown__item", tone === "danger" && "csmju-dropdown__item--danger");
  const content = (
    <>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <NextLink href={href} role="menuitem" className={classes}>
        {content}
      </NextLink>
    );
  }

  return (
    <button type="button" role="menuitem" className={classes} onClick={onClick} disabled={disabled}>
      {content}
    </button>
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <p className="csmju-dropdown__label">{children}</p>;
}

export function DropdownSeparator() {
  return <div className="csmju-dropdown__separator" role="separator" />;
}
