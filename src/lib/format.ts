/**
 * Utility การแสดงผลข้อมูล — อ้างอิง §11.3 (🔴 บังคับใช้ ห้ามแปลงเอง)
 *
 * กฎหลัก:
 *   - แสดงผลเป็น พ.ศ. เสมอ  ·  ส่งข้อมูลเป็น ค.ศ. (ISO 8601) เสมอ
 *   - timezone ตรึงที่ Asia/Bangkok เสมอ ห้ามใช้ timezone ของเครื่องผู้ใช้
 *   - เงินจาก API เป็นจำนวนเต็มหน่วย "สตางค์" ต้องหาร 100 ก่อนแสดง
 */

export const CSMJU_TIMEZONE = "Asia/Bangkok";

/** ปีพุทธศักราชห่างจากคริสต์ศักราช 543 ปี */
const BE_OFFSET = 543;

const TH_MONTH_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
] as const;

const TH_MONTH_LONG = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
] as const;

export type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * แตกวันที่ออกเป็นส่วนๆ ตามเวลาไทยเสมอ ไม่ว่าเครื่องผู้ใช้จะตั้ง timezone อะไร
 * ใช้ Intl แทนการบวก offset เองเพราะเชื่อถือได้กว่าและไม่พังเมื่อกฎ timezone เปลี่ยน
 */
function bangkokParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: CSMJU_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) parts[p.type] = p.value;
  return {
    year: Number(parts.year),
    // Intl ให้เดือนเป็น 1-12 แต่เราเก็บเป็น 0-11 ให้ตรงกับ index ของอาเรย์ชื่อเดือน
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? "0" : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** ค่าที่แสดงเมื่อไม่มีข้อมูล — ห้ามแสดงคำว่า null/undefined/Invalid Date ให้ผู้ใช้เห็น */
export const EMPTY_VALUE = "—";

/**
 * วันที่ตามมาตรฐาน §11.3
 * @example formatDate("2026-08-11")          // "11 ส.ค. 2569"
 * @example formatDate("2026-08-11", "long")  // "11 สิงหาคม 2569"
 * @example formatDate("2026-08-11", "numeric") // "11/08/2569"
 */
export function formatDate(
  value: DateInput,
  style: "short" | "long" | "numeric" = "short",
): string {
  const d = toDate(value);
  if (!d) return EMPTY_VALUE;
  const { year, month, day } = bangkokParts(d);
  const be = year + BE_OFFSET;
  if (style === "numeric") return `${pad2(day)}/${pad2(month + 1)}/${be}`;
  const names = style === "long" ? TH_MONTH_LONG : TH_MONTH_SHORT;
  return `${day} ${names[month]} ${be}`;
}

/**
 * เวลาอย่างเดียว
 * @example formatTime("2026-08-11T09:30:00+07:00") // "09:30 น."
 */
export function formatTime(value: DateInput, withSeconds = false): string {
  const d = toDate(value);
  if (!d) return EMPTY_VALUE;
  const { hour, minute, second } = bangkokParts(d);
  const base = `${pad2(hour)}:${pad2(minute)}`;
  return withSeconds ? `${base}:${pad2(second)} น.` : `${base} น.`;
}

/**
 * วันที่ + เวลา
 * @example formatDateTime("2026-08-11T09:30:00+07:00") // "11 ส.ค. 2569 09:30 น."
 */
export function formatDateTime(
  value: DateInput,
  style: "short" | "long" = "short",
): string {
  const d = toDate(value);
  if (!d) return EMPTY_VALUE;
  return `${formatDate(d, style)} ${formatTime(d)}`;
}

/**
 * เวลาสัมพัทธ์ — §11.3 ใช้เฉพาะช่วง ≤ 7 วันเท่านั้น เกินกว่านั้นคืนค่าเป็นวันที่เต็ม
 * เพราะ "45 วันที่แล้ว" อ่านแล้วผู้ใช้ต้องคำนวณเองอยู่ดี
 */
export function formatRelative(value: DateInput, now: DateInput = new Date()): string {
  const d = toDate(value);
  const base = toDate(now);
  if (!d || !base) return EMPTY_VALUE;

  const diffMs = base.getTime() - d.getTime();
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);
  const min = Math.floor(abs / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 7) return formatDate(d);
  const suffix = future ? "อีก " : "";
  const past = future ? "" : "ที่แล้ว";
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${suffix}${min} นาที${past}`.trim();
  if (hr < 24) return `${suffix}${hr} ชั่วโมง${past}`.trim();
  if (day === 1) return future ? "พรุ่งนี้" : "เมื่อวาน";
  return `${suffix}${day} วัน${past}`.trim();
}

/**
 * จำนวน — ใส่ , คั่นหลักพัน
 * @example formatNumber(2450) // "2,450"
 */
export function formatNumber(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {},
): string {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return EMPTY_VALUE;
  return new Intl.NumberFormat("th-TH", options).format(n);
}

/**
 * เงิน — §11.3 ค่าที่รับเข้ามาเป็น "สตางค์" (จำนวนเต็ม) ตาม data-dictionary §5
 * @example formatMoney(15000) // "150.00 บาท"
 */
export function formatMoney(
  satang: number | string | null | undefined,
  options: { unit?: "บาท" | "฿" | "none" } = {},
): string {
  if (satang === null || satang === undefined || satang === "") return EMPTY_VALUE;
  const n = typeof satang === "string" ? Number(satang) : satang;
  if (!Number.isFinite(n)) return EMPTY_VALUE;
  const baht = n / 100;
  const num = new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht);
  const unit = options.unit ?? "บาท";
  if (unit === "none") return num;
  if (unit === "฿") return `฿${num}`;
  return `${num} บาท`;
}

/**
 * เบอร์โทรศัพท์
 * @example formatPhone("0812345678") // "081-234-5678"
 * @example formatPhone("053873000")  // "053-873-000"
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return EMPTY_VALUE;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 9) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return value;
}

/**
 * ขนาดไฟล์ — ใช้กับ FileUpload
 * @example formatFileSize(1536000) // "1.5 MB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return EMPTY_VALUE;
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const digits = i === 0 ? 0 : 1;
  return `${n.toFixed(digits)} ${units[i]}`;
}

/**
 * แปลงค่าที่ผู้ใช้เลือกจาก DatePicker (พ.ศ.) กลับเป็น ISO ค.ศ. สำหรับส่ง API
 * @example toIsoDate(2569, 8, 11) // "2026-08-11"
 */
export function toIsoDate(buddhistYear: number, month1to12: number, day: number): string {
  return `${buddhistYear - BE_OFFSET}-${pad2(month1to12)}-${pad2(day)}`;
}

/** อ่านปี พ.ศ. จากค่า ISO */
export function toBuddhistYear(value: DateInput): number | null {
  const d = toDate(value);
  if (!d) return null;
  return bangkokParts(d).year + BE_OFFSET;
}

export const thaiMonthNames = { short: TH_MONTH_SHORT, long: TH_MONTH_LONG };
