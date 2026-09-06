/**
 * ประกาศชนิดของ Tailwind v3 preset
 * เขียนเป็น .d.ts แยกเพราะตัว preset เป็น .js ธรรมดา (Tailwind config โหลด ESM/CJS ตรงๆ)
 */
import type { Config } from "tailwindcss";

declare const preset: Omit<Config, "content">;
export default preset;
