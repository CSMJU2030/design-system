"use client";

/**
 * Toast — §8.4
 *
 * ใช้แจ้ง "ผลลัพธ์ที่สำเร็จแล้ว" เท่านั้น (บันทึกสำเร็จ / ลบสำเร็จ) นาน 4 วินาที
 * ❌ ห้ามใช้แจ้ง error ที่ผู้ใช้ต้องลงมือแก้ — ใช้ <Alert> หรือข้อความใต้ฟิลด์แทน
 *
 * role="status" สำหรับสำเร็จ · role="alert" สำหรับผิดพลาด (§8.4)
 * ToastProvider ถูกติดตั้งให้แล้วโดย <CsmjuAppShell> — ระบบย่อยเรียก useToast() ได้เลย
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "../../lib/cn";

export type ToastTone = "success" | "danger" | "warning" | "info";

export interface ToastOptions {
  title?: string;
  description?: string;
  tone?: ToastTone;
  /** §8.4 ค่ามาตรฐาน 4 วินาที — 0 = ค้างไว้จนกดปิด */
  durationMs?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, "tone">> {
  id: number;
  title?: string;
  description?: string;
  durationMs: number;
}

export interface ToastApi {
  /** แจ้งผลสำเร็จ — กรณีใช้บ่อยที่สุด */
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  show: (options: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICON = {
  success: CheckCircle2,
  danger: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = (nextId.current += 1);
    setItems((prev) => [
      ...prev,
      {
        id,
        tone: options.tone ?? "info",
        title: options.title,
        description: options.description,
        durationMs: options.durationMs ?? 4000,
      },
    ]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (title, description) => show({ tone: "success", title, description }),
      error: (title, description) => show({ tone: "danger", title, description }),
      warning: (title, description) => show({ tone: "warning", title, description }),
      info: (title, description) => show({ tone: "info", title, description }),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="csmju-toast-region">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const Icon = ICON[item.tone];

  useEffect(() => {
    if (item.durationMs <= 0) return;
    const timer = setTimeout(() => onDismiss(item.id), item.durationMs);
    return () => clearTimeout(timer);
  }, [item.id, item.durationMs, onDismiss]);

  return (
    <div
      className={cn("csmju-toast", `csmju-toast--${item.tone}`)}
      role={item.tone === "danger" ? "alert" : "status"}
      aria-live={item.tone === "danger" ? "assertive" : "polite"}
    >
      <Icon className="csmju-toast__icon" size={20} aria-hidden="true" />
      <div className="csmju-toast__body">
        {item.title ? <p className="csmju-toast__title">{item.title}</p> : null}
        {item.description ? <p>{item.description}</p> : null}
      </div>
      <button
        type="button"
        className="csmju-icon-btn csmju-icon-btn--sm"
        aria-label="ปิดการแจ้งเตือน"
        onClick={() => onDismiss(item.id)}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * @example
 * const toast = useToast();
 * toast.success("บันทึกแล้ว", "ข้อมูลครุภัณฑ์ถูกบันทึกเรียบร้อย");
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      "useToast ต้องเรียกภายใน <CsmjuAppShell> — ตรวจว่า app/layout.tsx ครอบด้วย CsmjuAppShell แล้ว (§5.1)",
    );
  }
  return ctx;
}
