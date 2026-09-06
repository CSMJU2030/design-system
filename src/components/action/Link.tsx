"use client";

import NextLink from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  tone?: "primary" | "muted";
  /** ลิงก์ออกนอกระบบ — จะเติม rel + ข้อความบอก screen reader ให้ */
  external?: boolean;
  children: ReactNode;
}

/**
 * ลิงก์มาตรฐาน — §12.1 ใช้ <a>/next/link สำหรับการนำทางเท่านั้น ห้ามใช้ <div onClick>
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, tone = "primary", external = false, className, children, ...rest },
  ref,
) {
  const classes = cn("csmju-link", tone === "muted" && "csmju-link--muted", className);

  if (external || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
        {external ? <span className="csmju-sr-only"> (เปิดในแท็บใหม่)</span> : null}
      </a>
    );
  }

  return (
    <NextLink ref={ref} href={href} className={classes} {...rest}>
      {children}
    </NextLink>
  );
});
