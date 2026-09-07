/**
 * ที่เก็บ access token ของหน้าเว็บ — อ้างอิง auth-contract.md §7, §10, §20
 *
 * ทำไมต้องเก็บใน "หน่วยความจำ" เท่านั้น:
 *   auth-contract §7 บังคับให้ส่ง token ผ่าน `Authorization: Bearer` เท่านั้น
 *   และห้ามส่งผ่าน URL / request body / cookie ที่ Core ไม่ได้กำหนด
 *   ส่วน SEC-03 ของ csmju2030-standards ห้ามเก็บ token ใน localStorage/sessionStorage
 *   เหลือทางเดียวที่ทำได้ทั้งสองข้อคือ ตัวแปรใน module scope (หายเมื่อ reload = ตั้งใจ)
 *
 * แล้ว refresh token อยู่ไหน?
 *   อยู่ใน httpOnly cookie ที่ route handler ฝั่ง Next.js ตั้งให้ (ดู @csmju2030/design-system/server)
 *   JavaScript ในเบราว์เซอร์อ่านไม่ได้ — เมื่อ reload หน้า AppShell จะเรียก /auth/refresh
 *   เพื่อขอ access token ก้อนใหม่มาใส่ที่นี่
 *
 * 🔴 ระบบย่อยห้ามเรียกฟังก์ชันในไฟล์นี้เอง — AppShell กับ csmjuFetch จัดการให้แล้ว
 */

/** payload ของ access token ตาม auth-contract §10 — มีเท่านี้ ห้ามเพิ่ม/ลด/เปลี่ยนชื่อ */
export interface CsmjuJwtClaims {
  sub: string;
  username: string;
  layer1_role: string;
  faculty: string;
  iat: number;
  exp: number;
}

interface TokenState {
  accessToken: string | null;
  /** เวลาหมดอายุเป็น ms (Date.now() scale) คำนวณจาก expires_in ตอนที่ได้ token มา */
  expiresAt: number | null;
  claims: CsmjuJwtClaims | null;
}

const state: TokenState = { accessToken: null, expiresAt: null, claims: null };

/** ถอด payload ของ JWT โดยไม่ตรวจลายเซ็น — ใช้เพื่อ "แสดงผล" เท่านั้น
 *  🔴 การตรวจสอบจริงเป็นหน้าที่ของ NestJS (SEC-04 ห้าม frontend verify JWT เอง) */
export function decodeJwtClaims(token: string): CsmjuJwtClaims | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const json =
      typeof atob === "function"
        ? decodeURIComponent(
            atob(base64 + pad)
              .split("")
              .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
              .join(""),
          )
        : Buffer.from(base64 + pad, "base64").toString("utf8");
    return JSON.parse(json) as CsmjuJwtClaims;
  } catch {
    return null;
  }
}

/** เรียกจาก AppShell เมื่อได้ token ใหม่จาก /auth/refresh หรือ /auth/session */
export function setAccessToken(token: string | null, expiresInSeconds?: number): void {
  state.accessToken = token;
  state.claims = token ? decodeJwtClaims(token) : null;
  state.expiresAt =
    token && expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : null;
}

export function getAccessToken(): string | null {
  return state.accessToken;
}

export function getJwtClaims(): CsmjuJwtClaims | null {
  return state.claims;
}

/** token ใกล้หมดอายุหรือยัง — เผื่อ refresh ล่วงหน้าโดยผู้ใช้ไม่สะดุด (ค่าเริ่มต้นกันไว้ 60 วินาที) */
export function isAccessTokenExpiring(marginSeconds = 60): boolean {
  if (!state.expiresAt) return false;
  return Date.now() >= state.expiresAt - marginSeconds * 1000;
}

export function clearAccessToken(): void {
  state.accessToken = null;
  state.expiresAt = null;
  state.claims = null;
}
