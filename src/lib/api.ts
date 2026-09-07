/**
 * csmjuFetch — ตัวห่อ fetch ตัวเดียวที่ทั้ง 37 ระบบต้องใช้
 * อ้างอิง §9.3 (error mapping) · §16.1.2 (envelope ของ NestJS) · §16.2 ข้อ 5/7
 *
 * สิ่งที่ทำให้แทน:
 *   - แกะ envelope { success, data, meta } ของ NestJS
 *   - map error.code -> คำสั่งแสดงผล UI ตามตาราง §9.3
 *   - จัดการ 401 (refresh เงียบ แล้ว retry 1 ครั้ง) โดยระบบย่อยไม่ต้องเขียนเอง
 *   - ตั้ง timeout กันหน้าค้าง
 *
 * 🔴 ระบบย่อยห้ามเรียก fetch ตรงไปยัง API และห้ามต่อ PostgreSQL จากฝั่ง Next.js
 *
 * การแนบ token: auth-contract.md §7 บังคับให้ส่งผ่าน `Authorization: Bearer <access_token>`
 * เท่านั้น และห้ามส่งผ่าน query string / request body / cookie ที่ Core ไม่ได้กำหนด
 * ตัว access token อยู่ใน memory (ดู token-store.ts) ไม่ได้อยู่ใน cookie
 */
import {
  CsmjuApiError,
  codeFromStatus,
  mapApiError,
  type CsmjuEnvelope,
  type CsmjuSuccessEnvelope,
} from "./errors";
import { requestTokenRefresh } from "./auth-bridge";
import { getAccessToken } from "./token-store";

export interface CsmjuFetchOptions extends Omit<RequestInit, "body"> {
  /** body เป็น object ธรรมดา — จะ JSON.stringify ให้เอง (ถ้าเป็น FormData จะส่งดิบ) */
  body?: unknown;
  /** query string — undefined/null จะถูกตัดทิ้ง ไม่ส่งไปเป็น "undefined" */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** หมดเวลาเป็น ms (ค่าเริ่มต้น 20000) */
  timeoutMs?: number;
  /** ปิดการ retry หลัง refresh token (ใช้ภายใน) */
  noRetry?: boolean;
}

/**
 * base URL ของ API ระบบย่อย — ต้องมาจาก env ไม่ hardcode (§16.2 ข้อ 5)
 * NEXT_PUBLIC_API_BASE_URL เป็นค่าสาธารณะ ห้ามใส่ความลับ (§16.2 ข้อ 17)
 */
function apiBaseUrl(): string {
  const raw =
    (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_API_BASE_URL : undefined) ?? "";
  return raw.replace(/\/+$/, "");
}

function buildUrl(path: string, query?: CsmjuFetchOptions["query"]): string {
  const base = path.startsWith("http") ? "" : apiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, val] of Object.entries(query)) {
    if (val === undefined || val === null || val === "") continue;
    params.append(k, String(val));
  }
  const qs = params.toString();
  return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
}

/**
 * ยิง API แล้วคืน envelope ทั้งก้อน (เผื่อหน้าจอต้องใช้ meta สำหรับ pagination)
 * ถ้า API ตอบ error จะ throw CsmjuApiError ที่มี .ui บอกวิธีแสดงผลแล้ว
 */
export async function csmjuFetchEnvelope<T>(
  path: string,
  options: CsmjuFetchOptions = {},
): Promise<CsmjuSuccessEnvelope<T>> {
  const { body, query, timeoutMs = 20000, noRetry, headers, ...rest } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const accessToken = getAccessToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...rest,
      signal: options.signal ?? controller.signal,
      // §7 ห้ามส่ง token ทาง cookie — API อยู่คนละ origin จึงไม่ต้องส่ง cookie ใด ๆ ไปด้วย
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(isFormData ? {} : body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(headers as Record<string, string> | undefined),
      },
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch (e) {
    clearTimeout(timer);
    const aborted = e instanceof DOMException && e.name === "AbortError";
    throw new CsmjuApiError(mapApiError({ code: aborted ? "TIMEOUT" : "NETWORK_ERROR" }));
  }
  clearTimeout(timer);

  // §9.3 UNAUTHORIZED: ผู้ใช้ไม่ควรรู้ตัว — ให้ AppShell refresh เงียบแล้วยิงซ้ำ 1 ครั้ง
  if (response.status === 401 && !noRetry) {
    const refreshed = await requestTokenRefresh();
    if (refreshed) {
      return csmjuFetchEnvelope<T>(path, { ...options, noRetry: true });
    }
  }

  const requestId = response.headers.get("x-request-id") ?? undefined;

  let payload: CsmjuEnvelope<T> | null = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text) as CsmjuEnvelope<T>;
    } catch {
      payload = null;
    }
  }

  if (!response.ok || (payload && payload.success === false)) {
    const errorBody =
      payload && payload.success === false
        ? payload.error
        : // backend ตอบไม่ตรง envelope (เช่นโดน gateway ตัดกลางทาง) — เดาจาก status แทน
          { code: codeFromStatus(response.status) };

    if (response.status === 429) {
      const reset = response.headers.get("x-ratelimit-reset");
      throw new CsmjuApiError({
        ...mapApiError({ code: "RATE_LIMIT" }, { status: 429, requestId }),
        message: reset
          ? `มีการใช้งานถี่เกินไป กรุณารออีกประมาณ ${reset} วินาทีแล้วลองใหม่`
          : "มีการใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่",
      });
    }

    throw new CsmjuApiError(mapApiError(errorBody, { status: response.status, requestId }));
  }

  if (!payload || payload.success !== true) {
    // 2xx แต่ไม่ใช่ envelope มาตรฐาน = backend ผิดสัญญา §16.1.2 ข้อ 1
    throw new CsmjuApiError(
      mapApiError({ code: "INTERNAL_ERROR" }, { status: response.status, requestId }),
    );
  }

  return payload;
}

/** เวอร์ชันที่คืนเฉพาะ data — ใช้เมื่อไม่ต้องการ meta */
export async function csmjuFetch<T>(
  path: string,
  options: CsmjuFetchOptions = {},
): Promise<T> {
  const env = await csmjuFetchEnvelope<T>(path, options);
  return env.data;
}
