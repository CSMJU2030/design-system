import clsx, { type ClassValue } from "clsx";

/** รวม className แบบปลอดภัย — ใช้ภายใน design system เท่านั้น */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
