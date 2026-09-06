"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** เชื่อมปุ่มติดกันเป็นแถบเดียว (ใช้กับ toggle/segment) */
  attached?: boolean;
  children: ReactNode;
}

/** จัดกลุ่มปุ่ม — §7.1 · §7.3.4 ระยะห่างมาจาก parent ตัวนี้ ไม่ใช่ margin ในปุ่ม */
export function ButtonGroup({ attached = false, className, children, ...rest }: ButtonGroupProps) {
  return (
    <div
      className={cn("csmju-btn-group", attached && "csmju-btn-group--attached", className)}
      {...(attached ? { role: "group" } : {})}
      {...rest}
    >
      {children}
    </div>
  );
}
