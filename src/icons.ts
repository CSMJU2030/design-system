/**
 * @csmju2030/design-system/icons
 *
 * §14 ใช้ Lucide เท่านั้น · ขนาด 16 / 20 / 24px · stroke 1.5–2px
 * ❌ ห้ามผสมชุดไอคอนอื่น  ❌ ห้ามใช้ไอคอนตกแต่งที่ไม่มีความหมาย
 * ✅ ไอคอนล้วนต้องมี aria-label  ✅ ไอคอนประกอบข้อความใช้ aria-hidden="true"
 *
 * import ทีละตัวเสมอเพื่อให้ tree-shaking ทำงาน (§15 JS bundle ≤ 250KB)
 *   import { Package, Repeat } from "@csmju2030/design-system/icons";
 */
export * from "lucide-react";
export { NAV_ICONS, NavIcon, type NavIconName } from "./lib/icon-registry";
