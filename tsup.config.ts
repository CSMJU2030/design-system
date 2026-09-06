import { defineConfig } from "tsup";

/**
 * bundle: false — คงโครงสร้างไฟล์ไว้แทนการรวมเป็นก้อนเดียว
 *
 * เหตุผล: Next.js App Router ตัดสินขอบเขต Server/Client Component จาก directive "use client"
 * ที่หัวไฟล์แต่ละไฟล์ ถ้ารวมทุกอย่างเป็นก้อนเดียวแล้วแปะ "use client" ทั้งก้อน
 * ฟังก์ชันที่ Server Component ต้องใช้ (formatDate, csmjuTitle) จะกลายเป็น client reference
 * และพังตอน `next build` ตอน collect page data
 *
 * แบบนี้: components/* คง "use client" ของตัวเอง · lib/format, lib/metadata ไม่มี directive
 * จึงเรียกได้ทั้งฝั่ง server และ client
 *
 * ESM อย่างเดียว: output CJS ของ esbuild วาง "use strict" ไว้ก่อน "use client"
 * ทำให้ Next.js ตรวจไม่เจอ directive แล้ว evaluate client component ใน RSC graph จนพัง
 * stack ของโครงการล็อกที่ Next.js App Router อยู่แล้ว จึงไม่ต้องมี CJS ให้เป็นภาระ
 */
export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx"],
  format: ["esm"],
  bundle: false,
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  external: ["react", "react-dom", "next", "lucide-react", "clsx"],
});
