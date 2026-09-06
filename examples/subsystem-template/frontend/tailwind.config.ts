import type { Config } from "tailwindcss";
import csmjuPreset from "@csmju2030/design-system/tailwind-preset";

/**
 * 🔴 ห้ามเพิ่ม colors / spacing / borderRadius / fontFamily เองในไฟล์นี้
 *    ทุกค่ามาจาก preset ของส่วนกลาง — ถ้าของที่มีไม่พอ ให้ขอเพิ่มตาม §17.4
 */
const config: Config = {
  presets: [csmjuPreset],
  content: ["./src/**/*.{ts,tsx}"],
};

export default config;
