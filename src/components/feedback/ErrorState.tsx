"use client";

import type { ReactNode } from "react";
import { AlertOctagon, ShieldOff } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../action/Button";
import { EmptyState } from "../data/EmptyState";
import type { CsmjuErrorUi } from "../../lib/errors";

export interface ErrorStateProps {
  /** ผลจาก mapApiError / useApi().error — component จะเลือกวิธีแสดงตาม §9.3 ให้เอง */
  error?: CsmjuErrorUi | null;
  /** ใช้เมื่อไม่มี error object เช่นใน error.tsx ของ Next.js */
  title?: string;
  description?: ReactNode;
  /** ปุ่ม "ลองอีกครั้ง" — ผูกกับ reset() ของ error.tsx */
  onRetry?: () => void;
  /** ลิงก์กลับหน้าหลักของระบบย่อย */
  onGoHome?: () => void;
  className?: string;
}

/**
 * ErrorState — §9.3
 *
 * ใช้เป็น error.tsx ของทุก route segment (§16.1.1)
 * ❌ ห้ามแสดง error.message ดิบ, stack trace, ชื่อฟิลด์ในฐานข้อมูล หรือข้อความอังกฤษจาก exception
 *
 * component นี้เลือกหน้าตาให้อัตโนมัติตาม error.code:
 *   FORBIDDEN -> การ์ด "ไม่มีสิทธิ์"  ·  NOT_FOUND -> EmptyState  ·  อื่นๆ -> error เต็มพื้นที่
 */
export function ErrorState({ error, title, description, onRetry, onGoHome, className }: ErrorStateProps) {
  // §9.3 UNAUTHORIZED: ห้ามแสดงอะไรให้ผู้ใช้เห็น — AppShell กำลัง refresh/redirect อยู่
  if (error?.presentation === "silent") return null;

  // §9.3 NOT_FOUND ต้องเป็น EmptyState ไม่ใช่ error สีแดง
  if (error?.presentation === "empty") {
    return (
      <EmptyState
        title={title ?? "ไม่พบข้อมูล"}
        description={description ?? error.message}
        action={
          onGoHome ? (
            <Button variant="secondary" onClick={onGoHome}>
              กลับหน้าหลัก
            </Button>
          ) : null
        }
        className={className}
      />
    );
  }

  const forbidden = error?.presentation === "forbidden";

  return (
    <div className={cn("csmju-state", className)} role="alert">
      <div className={cn("csmju-state__icon", !forbidden && "csmju-state__icon--danger")}>
        {forbidden ? (
          <ShieldOff size={28} aria-hidden="true" />
        ) : (
          <AlertOctagon size={28} aria-hidden="true" />
        )}
      </div>
      <p className="csmju-state__title">
        {title ?? (forbidden ? "ไม่มีสิทธิ์เข้าถึง" : "เกิดข้อผิดพลาด")}
      </p>
      <p className="csmju-state__description">
        {description ?? error?.message ?? "ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้ง"}
      </p>
      {error?.requestId ? (
        <p className="csmju-state__ref">รหัสอ้างอิง: {error.requestId}</p>
      ) : null}
      <div className="csmju-state__actions">
        {onRetry && (error?.retryable ?? true) && !forbidden ? (
          <Button variant="primary" onClick={onRetry}>
            ลองอีกครั้ง
          </Button>
        ) : null}
        {onGoHome ? (
          <Button variant="secondary" onClick={onGoHome}>
            กลับหน้าหลัก
          </Button>
        ) : null}
      </div>
    </div>
  );
}
