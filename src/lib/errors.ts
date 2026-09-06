/**
 * Error envelope + mapping ไปเป็น UI — อ้างอิง §9.3 (🔴 บังคับ ห้ามคิดข้อความเอง)
 *
 * NestJS ฝั่ง backend ห่อ response ทุกตัวด้วย HttpExceptionFilter กลาง (§16.1.2)
 * ไฟล์นี้คือฝั่งตรงข้ามของสัญญานั้น — ถ้า backend เปลี่ยน envelope ต้องแก้ที่นี่ที่เดียว
 * ทั้ง 37 ระบบก็ได้พฤติกรรมใหม่พร้อมกัน
 */

/** 6 ค่ามาตรฐานที่ NestJS ส่งมาได้เท่านั้น (§16.1.2 ข้อ 2) */
export type CsmjuErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR";

/** โค้ดที่เกิดฝั่ง client ล้วน — backend ไม่เคยส่งมา */
export type CsmjuClientErrorCode = "NETWORK_ERROR" | "TIMEOUT" | "RATE_LIMIT";

export type AnyErrorCode = CsmjuErrorCode | CsmjuClientErrorCode;

export interface CsmjuApiErrorBody {
  code: AnyErrorCode | string;
  message?: string;
  details?: {
    /** ชื่อฟิลด์เดียวที่ผิด — หน้าจอใช้ค่านี้ focus ไปยังช่องที่ผิดโดยตรง (§9.3) */
    field?: string;
    [k: string]: unknown;
  };
}

export interface CsmjuSuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    [k: string]: unknown;
  };
}

export interface CsmjuFailureEnvelope {
  success: false;
  error: CsmjuApiErrorBody;
}

export type CsmjuEnvelope<T> = CsmjuSuccessEnvelope<T> | CsmjuFailureEnvelope;

/** วิธีที่หน้าจอต้องแสดง error ตัวนี้ — §9.3 */
export type CsmjuErrorPresentation =
  /** ห้ามแสดงอะไรให้ผู้ใช้เห็น AppShell จัดการ refresh/redirect เอง */
  | "silent"
  /** หน้า/การ์ด "ไม่มีสิทธิ์" + ปุ่มกลับหน้าหลัก */
  | "forbidden"
  /** EmptyState ไม่ใช่ error สีแดง */
  | "empty"
  /** ข้อความใต้ฟิลด์ที่ระบุใน details.field + เลื่อนไปหาฟิลด์นั้น */
  | "field"
  /** Alert inline อธิบายความขัดแย้ง + ทางเลือกถัดไป */
  | "alert"
  /** ErrorState เต็มพื้นที่ + ปุ่มลองอีกครั้ง */
  | "error-state";

export interface CsmjuErrorUi {
  code: AnyErrorCode | string;
  presentation: CsmjuErrorPresentation;
  /** ข้อความไทยมาตรฐานที่แสดงให้ผู้ใช้เห็น */
  message: string;
  /** ฟิลด์ที่ผิด (เฉพาะ VALIDATION_ERROR) */
  field?: string;
  /** ควรมีปุ่ม "ลองอีกครั้ง" หรือไม่ */
  retryable: boolean;
  /** รหัสอ้างอิงสำหรับแจ้งผู้ดูแล (request id) */
  requestId?: string;
  status?: number;
}

/** ข้อความมาตรฐานตามตาราง §9.3 — 🔴 ห้ามเขียนข้อความ error ขึ้นเองในระบบย่อย */
const STANDARD_MESSAGE: Record<AnyErrorCode, string> = {
  UNAUTHORIZED: "",
  FORBIDDEN:
    "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบย่อยนี้",
  NOT_FOUND: "ไม่พบข้อมูลที่คุณกำลังค้นหา อาจถูกลบไปแล้วหรือลิงก์ไม่ถูกต้อง",
  VALIDATION_ERROR: "ข้อมูลที่กรอกยังไม่ถูกต้อง กรุณาตรวจสอบช่องที่มีข้อความสีแดง",
  CONFLICT: "ข้อมูลถูกแก้ไขโดยผู้ใช้อื่นแล้ว กรุณารีเฟรชและลองใหม่",
  INTERNAL_ERROR: "ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้ง",
  NETWORK_ERROR: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง",
  TIMEOUT: "เซิร์ฟเวอร์ใช้เวลานานเกินไป กรุณาลองอีกครั้ง",
  RATE_LIMIT: "มีการใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่",
};

const PRESENTATION: Record<AnyErrorCode, CsmjuErrorPresentation> = {
  UNAUTHORIZED: "silent",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "empty",
  VALIDATION_ERROR: "field",
  CONFLICT: "alert",
  INTERNAL_ERROR: "error-state",
  NETWORK_ERROR: "alert",
  TIMEOUT: "alert",
  RATE_LIMIT: "alert",
};

const RETRYABLE: AnyErrorCode[] = ["INTERNAL_ERROR", "NETWORK_ERROR", "TIMEOUT", "RATE_LIMIT", "CONFLICT"];

function isKnownCode(code: string): code is AnyErrorCode {
  return code in STANDARD_MESSAGE;
}

/** ข้อผิดพลาดจาก API ที่ผ่านการ map เป็น UI แล้ว — โยนออกมาจาก csmjuFetch */
export class CsmjuApiError extends Error {
  readonly ui: CsmjuErrorUi;

  constructor(ui: CsmjuErrorUi) {
    super(ui.message || ui.code);
    this.name = "CsmjuApiError";
    this.ui = ui;
  }
}

/**
 * แปลง error body จาก API เป็นคำสั่งว่าหน้าจอต้องแสดงอะไร
 *
 * VALIDATION_ERROR เท่านั้นที่ใช้ error.message จาก backend โดยตรง
 * เพราะ backend เขียนมาเป็นไทยเฉพาะเจาะจงกับฟิลด์นั้นแล้ว (§16.1.2 ข้อ 4)
 * โค้ดอื่นใช้ข้อความกลาง เพื่อไม่ให้ 37 ระบบมีสำนวน error คนละแบบ
 */
export function mapApiError(
  error: CsmjuApiErrorBody | null | undefined,
  context: { status?: number; requestId?: string } = {},
): CsmjuErrorUi {
  const rawCode = error?.code ?? "INTERNAL_ERROR";
  const code: AnyErrorCode = isKnownCode(rawCode) ? rawCode : "INTERNAL_ERROR";

  let message = STANDARD_MESSAGE[code];
  if (code === "VALIDATION_ERROR" && error?.message) {
    message = error.message;
  }
  if (code === "INTERNAL_ERROR" && context.requestId) {
    message = `ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้ง หากยังพบปัญหา กรุณาแจ้งผู้ดูแลระบบพร้อมรหัส: ${context.requestId}`;
  }

  return {
    code: rawCode,
    presentation: PRESENTATION[code],
    message,
    field: error?.details?.field,
    retryable: RETRYABLE.includes(code),
    requestId: context.requestId,
    status: context.status,
  };
}

/** map HTTP status เป็น error code มาตรฐาน เผื่อ backend ตอบมาไม่ครบ envelope */
export function codeFromStatus(status: number): AnyErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMIT";
  return "INTERNAL_ERROR";
}

export function isCsmjuApiError(e: unknown): e is CsmjuApiError {
  return e instanceof CsmjuApiError;
}
