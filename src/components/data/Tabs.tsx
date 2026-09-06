"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  /** ควบคุมจากภายนอก (เช่นผูกกับ query string) */
  activeTabId?: string;
  onChange?: (id: string) => void;
  /** ชื่อของชุดแท็บสำหรับ screen reader */
  label: string;
  className?: string;
}

/**
 * Tabs — §7.1
 * รองรับคีย์บอร์ดตามมาตรฐาน WAI-ARIA: ลูกศรซ้าย/ขวา, Home, End (§12.6)
 */
export function Tabs({ items, defaultTabId, activeTabId, onChange, label, className }: TabsProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [internalId, setInternalId] = useState(defaultTabId ?? items[0]?.id ?? "");
  const activeId = activeTabId ?? internalId;

  const select = (id: string) => {
    if (activeTabId === undefined) setInternalId(id);
    onChange?.(id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const enabled = items.filter((t) => !t.disabled);
    const current = enabled.findIndex((t) => t.id === activeId);
    if (current < 0 || enabled.length === 0) return;

    let next = -1;
    if (e.key === "ArrowRight") next = (current + 1) % enabled.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + enabled.length) % enabled.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = enabled.length - 1;
    if (next < 0) return;

    e.preventDefault();
    const target = enabled[next]!;
    select(target.id);
    listRef.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(`${baseId}-tab-${target.id}`)}`)?.focus();
  };

  const active = items.find((t) => t.id === activeId) ?? items[0];

  return (
    <div className={cn(className)}>
      <div ref={listRef} role="tablist" aria-label={label} className="csmju-tabs__list" onKeyDown={onKeyDown}>
        {items.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={tab.id === activeId}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={tab.id === activeId ? 0 : -1}
            disabled={tab.disabled}
            className="csmju-tabs__tab"
            onClick={() => select(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className="csmju-tabs__panel"
        >
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
