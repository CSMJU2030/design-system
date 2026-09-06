/**
 * หัวข้อแท็บเบราว์เซอร์ — §11.4 (🔴 ทุก route ต้อง export metadata)
 *
 * รูปแบบบังคับ: <ชื่อหน้า> · <ชื่อระบบย่อย> · CSMJU
 */

export interface CsmjuTitleOptions {
  /** ชื่อหน้า @example "รายการครุภัณฑ์" */
  page: string;
  /** ชื่อไทยของระบบย่อย @example "ระบบครุภัณฑ์" */
  subsystem: string;
}

/**
 * @example
 * // app/equipment-items/page.tsx
 * export const metadata = {
 *   title: csmjuTitle({ page: "รายการครุภัณฑ์", subsystem: "ระบบครุภัณฑ์" }),
 * };
 * // -> "รายการครุภัณฑ์ · ระบบครุภัณฑ์ · CSMJU"
 */
export function csmjuTitle({ page, subsystem }: CsmjuTitleOptions): string {
  return [page, subsystem, "CSMJU"].filter(Boolean).join(" · ");
}

/**
 * สร้าง helper ประจำระบบย่อย เพื่อไม่ต้องพิมพ์ชื่อระบบซ้ำทุกไฟล์
 *
 * @example
 * // src/lib/title.ts
 * export const title = createCsmjuTitle("ระบบครุภัณฑ์");
 * // app/equipment-items/page.tsx
 * export const metadata = { title: title("รายการครุภัณฑ์") };
 */
export function createCsmjuTitle(subsystem: string): (page: string) => string {
  return (page: string) => csmjuTitle({ page, subsystem });
}
