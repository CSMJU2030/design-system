"use client";

import type { ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "../action/Button";

export interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /**
   * 🔴 §8.3 ข้อความยืนยันต้องระบุ "ชื่อของสิ่งที่จะทำ"
   * @example 'ลบครุภัณฑ์ "โปรเจกเตอร์ EPSON EB-2250U"?'
   */
  title: string;
  /**
   * 🔴 ต้องบอก "ผลที่ตามมา"
   * @example "รายการนี้จะถูกลบถาวร ประวัติการยืมที่เกี่ยวข้อง 12 รายการจะยังคงอยู่"
   */
  description: ReactNode;
  /**
   * 🔴 ต้องเป็นคำกริยาจริง ไม่ใช่ "ตกลง" (§8.3 · §11.2)
   * @example "ลบครุภัณฑ์"
   */
  confirmLabel: string;
  cancelLabel?: string;
  /** danger สำหรับการลบ/ยกเลิกถาวร */
  tone?: "danger" | "primary";
  loading?: boolean;
}

/**
 * กล่องยืนยันมาตรฐาน — §8.3
 * 🔴 การลบทุกครั้งต้องผ่าน ConfirmDialog เสมอ
 */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "ยกเลิก",
  tone = "danger",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
      footer={
        <>
          {/* §8.1 ปุ่มยืนยันอยู่ซ้าย ยกเลิกอยู่ขวา — เรียงเหมือนกันทุกระบบ */}
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
        </>
      }
    >
      <p>{description}</p>
    </Modal>
  );
}
