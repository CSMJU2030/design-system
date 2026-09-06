/**
 * สะพานเชื่อม 401 handling ระหว่าง csmjuFetch กับ <CsmjuAppShell>
 * อ้างอิง auth-contract.md §6 · ui-design-system.md §5.1, §16.2 ข้อ 4/7
 *
 * ทำไมต้องมีไฟล์นี้:
 *   ระบบย่อยห้ามเขียน logic refresh token เอง (§16.2 ข้อ 7) แต่ตัว fetch อยู่ใน lib
 *   ส่วนตัวที่รู้ว่าจะ redirect ไปไหนคือ AppShell — จึงต้องมีจุดนัดพบตรงกลาง
 *   AppShell ลงทะเบียน handler ตอน mount, csmjuFetch เรียกใช้เมื่อเจอ 401
 *
 * 🔴 ห้ามเก็บ access_token ใน localStorage — token อยู่ใน httpOnly cookie ที่ Core ออกให้
 *    ทุก request จึงส่งด้วย credentials: "include" ไม่มีการแนบ Authorization header เอง
 */

type UnauthorizedHandler = () => Promise<boolean>;

interface AuthBridgeState {
  handler: UnauthorizedHandler | null;
  /** กัน refresh ซ้ำซ้อนเมื่อมีหลาย request เจอ 401 พร้อมกัน */
  inflight: Promise<boolean> | null;
}

const state: AuthBridgeState = { handler: null, inflight: null };

/** เรียกจาก <CsmjuAppShell> เท่านั้น */
export function registerUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
  state.handler = handler;
  return () => {
    if (state.handler === handler) state.handler = null;
  };
}

/**
 * ขอให้ AppShell พยายาม refresh token
 * @returns true = refresh สำเร็จ ให้ retry request เดิมได้ / false = ต้อง redirect ไป Core
 */
export function requestTokenRefresh(): Promise<boolean> {
  if (!state.handler) return Promise.resolve(false);
  if (state.inflight) return state.inflight;

  const run = state.handler().finally(() => {
    state.inflight = null;
  });
  state.inflight = run;
  return run;
}

export function hasUnauthorizedHandler(): boolean {
  return state.handler !== null;
}
