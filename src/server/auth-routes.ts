/**
 * Route handler กลางสำหรับ OAuth flow — อ้างอิง auth-contract.md §3–§8, §18–§23
 *
 * 🔴 ห้ามระบบย่อยเขียน flow นี้เอง (ui-design-system §16.2 ข้อ 7 · auth-contract §22
 *    "ห้ามแต่ละ AIE ออกแบบ Refresh Flow เอง")
 *
 * วิธีใช้ — สร้างไฟล์เดียวที่ frontend/src/app/auth/[csmju]/route.ts:
 *
 *   import { createCsmjuAuthRoutes } from "@csmju2030/design-system/server";
 *   export const { GET, POST } = createCsmjuAuthRoutes();
 *
 * จะได้ 4 เส้นทางนี้ทันที (same-origin ทั้งหมด):
 *   GET  /auth/login     -> พาไปหน้า login ของ Core พร้อม state กัน CSRF
 *   GET  /auth/callback  -> แลก authorization code เป็น token (§4) แล้วตั้ง cookie
 *   POST /auth/refresh   -> ขอ access token ใหม่ด้วย refresh_token (§19)
 *   POST /auth/logout    -> ล้าง cookie แล้วส่งกลับหน้า logout ของ Core
 *
 * ทำไมต้องผ่าน route handler ไม่ยิงจากเบราว์เซอร์ตรง ๆ:
 *   auth-contract §19 ให้ส่ง refresh_token ใน request body ซึ่งแปลว่า JavaScript
 *   ต้องอ่าน refresh_token ได้ — ขัดกับ SEC-03 ที่ห้ามเก็บ token ในที่ที่ JS อ่านได้
 *   ทางออกเดียวที่ผ่านทั้งสองข้อคือให้ฝั่ง server ของ Next.js ถือ refresh_token
 *   ไว้ใน httpOnly cookie แล้วเป็นคนคุยกับ Core แทน
 */
import { NextResponse, type NextRequest } from "next/server";

/** ชื่อ cookie — ขึ้นต้นด้วย __Host- เพื่อบังคับ Secure + Path=/ + ห้ามข้าม subdomain */
const REFRESH_COOKIE = "__Host-csmju_rt";
const STATE_COOKIE = "__Host-csmju_state";

export interface CsmjuAuthRoutesOptions {
  /** URL ของ Core — ค่าเริ่มต้นอ่านจาก CSMJU_CORE_URL หรือ NEXT_PUBLIC_CSMJU_CORE_URL */
  coreUrl?: string;
  /** client_id ของระบบย่อย (auth-contract §26) — ค่าเริ่มต้นอ่านจาก CSMJU_CLIENT_ID */
  clientId?: string;
  /** origin ของระบบย่อยสำหรับประกอบ redirect_uri — ค่าเริ่มต้นเดาจาก request */
  appOrigin?: string;
  /** path ที่ให้กลับไปหลัง login สำเร็จ เมื่อไม่มี ?redirect_uri */
  defaultRedirect?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

function env(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

function coreBase(opts: CsmjuAuthRoutesOptions): string {
  const raw = opts.coreUrl ?? env("CSMJU_CORE_URL") ?? env("NEXT_PUBLIC_CSMJU_CORE_URL") ?? "";
  return raw.replace(/\/+$/, "");
}

function originOf(req: NextRequest, opts: CsmjuAuthRoutesOptions): string {
  return (opts.appOrigin ?? env("CSMJU_APP_ORIGIN") ?? new URL(req.url).origin).replace(/\/+$/, "");
}

/** §6 error ของ Core เป็น OAuth format ไม่ใช่ envelope ของเรา — แปลงให้เป็นภาษาไทยที่ผู้ใช้อ่านรู้เรื่อง */
function oauthErrorMessage(body: unknown): string {
  const error = (body as { error?: string } | null)?.error;
  if (error === "invalid_grant") return "ลิงก์เข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่";
  return "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

/** เรียก token endpoint ของ Core — จุดเดียวในระบบทั้งหมดที่ยิงไปที่ /oauth/token (§4, §19) */
async function callTokenEndpoint(
  core: string,
  body: Record<string, string>,
): Promise<{ ok: true; data: TokenResponse } | { ok: false; message: string }> {
  let res: Response;
  try {
    res = await fetch(`${core}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "เชื่อมต่อระบบยืนยันตัวตนไม่ได้ กรุณาลองใหม่อีกครั้ง" };
  }

  const payload = (await res.json().catch(() => null)) as TokenResponse | null;
  if (!res.ok || !payload?.access_token) {
    return { ok: false, message: oauthErrorMessage(payload) };
  }
  return { ok: true, data: payload };
}

function setRefreshCookie(res: NextResponse, token: string): void {
  res.cookies.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // refresh token อายุยาวกว่า access token — ให้ cookie อยู่ได้ 30 วัน แล้วให้ Core เป็นคนตัดสินว่าหมดอายุจริงหรือยัง
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function createCsmjuAuthRoutes(options: CsmjuAuthRoutesOptions = {}) {
  const defaultRedirect = options.defaultRedirect ?? "/";

  async function GET(req: NextRequest): Promise<NextResponse> {
    const core = coreBase(options);
    const url = new URL(req.url);
    const action = url.pathname.split("/").filter(Boolean).pop();
    const origin = originOf(req, options);
    const clientId = options.clientId ?? env("CSMJU_CLIENT_ID") ?? "";

    if (action === "login") {
      // state กัน CSRF ตาม §3 — เก็บไว้ใน cookie เพื่อเทียบตอน callback
      const state = crypto.randomUUID();
      const target = url.searchParams.get("redirect_uri") ?? defaultRedirect;
      const authorize = new URL(`${core}/oauth/authorize`);
      authorize.searchParams.set("response_type", "code");
      authorize.searchParams.set("client_id", clientId);
      authorize.searchParams.set("redirect_uri", `${origin}/auth/callback`);
      authorize.searchParams.set("state", state);

      const res = NextResponse.redirect(authorize);
      res.cookies.set(STATE_COOKIE, `${state}|${target}`, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      });
      return res;
    }

    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const saved = req.cookies.get(STATE_COOKIE)?.value ?? "";
      const [savedState, savedTarget] = saved.split("|");

      if (!code || !state || state !== savedState) {
        return NextResponse.redirect(
          `${origin}/?csmju_auth_error=${encodeURIComponent("คำขอเข้าสู่ระบบไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง")}`,
        );
      }

      const result = await callTokenEndpoint(core, {
        grant_type: "authorization_code",
        code,
        redirect_uri: `${origin}/auth/callback`,
        client_id: clientId,
      });

      if (!result.ok) {
        return NextResponse.redirect(
          `${origin}/?csmju_auth_error=${encodeURIComponent(result.message)}`,
        );
      }

      const res = NextResponse.redirect(`${origin}${savedTarget || defaultRedirect}`);
      setRefreshCookie(res, result.data.refresh_token);
      res.cookies.delete(STATE_COOKIE);
      return res;
    }

    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "ไม่พบเส้นทางนี้" } },
      { status: 404 },
    );
  }

  async function POST(req: NextRequest): Promise<NextResponse> {
    const core = coreBase(options);
    const url = new URL(req.url);
    const action = url.pathname.split("/").filter(Boolean).pop();
    const origin = originOf(req, options);

    if (action === "refresh") {
      const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
      if (!refreshToken) {
        // §21 ไม่มี refresh token = ต้องกลับไป login ที่ Core
        return NextResponse.json({ success: false }, { status: 401 });
      }

      const result = await callTokenEndpoint(core, {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      });

      if (!result.ok) {
        const res = NextResponse.json({ success: false }, { status: 401 });
        res.cookies.delete(REFRESH_COOKIE);
        return res;
      }

      // §20 ข้อ 1 "เก็บ Token ใหม่" — refresh token หมุนทุกครั้ง ต้องเขียนทับของเดิม
      const res = NextResponse.json({
        success: true,
        data: {
          access_token: result.data.access_token,
          expires_in: result.data.expires_in,
        },
      });
      setRefreshCookie(res, result.data.refresh_token);
      return res;
    }

    if (action === "logout") {
      const res = NextResponse.json({
        success: true,
        data: { logout_url: `${core}/logout?redirect_uri=${encodeURIComponent(origin)}` },
      });
      res.cookies.delete(REFRESH_COOKIE);
      res.cookies.delete(STATE_COOKIE);
      return res;
    }

    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "ไม่พบเส้นทางนี้" } },
      { status: 404 },
    );
  }

  return { GET, POST };
}
