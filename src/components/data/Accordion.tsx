"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** เปิดได้ทีละหลายอัน */
  multiple?: boolean;
  defaultOpenIds?: string[];
  className?: string;
}

/** Accordion — §7.1 ใช้กับคำถามที่พบบ่อย/รายละเอียดที่ไม่ต้องเห็นตลอด */
export function Accordion({ items, multiple = false, defaultOpenIds = [], className }: AccordionProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      return multiple ? [...prev, id] : [id];
    });
  };

  return (
    <div className={cn("csmju-accordion", className)}>
      {items.map((item) => {
        const open = openIds.includes(item.id);
        return (
          <div key={item.id} className="csmju-accordion__item">
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                className="csmju-accordion__trigger"
                aria-expanded={open}
                aria-controls={`${baseId}-panel-${item.id}`}
                id={`${baseId}-trigger-${item.id}`}
                onClick={() => toggle(item.id)}
              >
                <span>{item.title}</span>
                <ChevronDown className="csmju-accordion__icon" size={20} aria-hidden="true" />
              </button>
            </h3>
            <div
              id={`${baseId}-panel-${item.id}`}
              role="region"
              aria-labelledby={`${baseId}-trigger-${item.id}`}
              className="csmju-accordion__panel"
              hidden={!open}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
