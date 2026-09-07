"use client";

/**
 * ข้อมูลผู้ใช้ปัจจุบัน — อ้างอิง auth-contract.md §5 · ui-design-system.md §10
 *
 * 🔴 ฝั่ง frontend ห้ามตัดสินใจเรื่องความปลอดภัยเอง
 *    hook นี้มีไว้เพื่อ "ไม่แสดงสิ่งที่ผู้ใช้ทำไม่ได้" เท่านั้น
 *    การบังคับสิทธิ์จริงอยู่ที่ NestJS ซึ่งอ่านจาก header X-User-Id / X-Layer1-Role ที่ gateway แนบมา
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CsmjuJwtClaims } from "./token-store";

/** ค่ามาตรฐานของ layer1_role ตาม data-dictionary §2 */
export type Layer1Role = "student" | "alumni" | "staff" | "admin";

/** §10.3 คำเรียกภาษาไทยมาตรฐาน — 🔴 ห้ามแปลเอง */
export const LAYER1_ROLE_LABEL: Record<Layer1Role, string> = {
  student: "นักศึกษา",
  alumni: "ศิษย์เก่า",
  staff: "บุคลากร/อาจารย์",
  admin: "ผู้ดูแลระบบ",
};

export interface CsmjuUser {
  /** รหัสนักศึกษา/รหัสบุคลากร — data-dictionary เรียกฟิลด์นี้ว่า username ไม่ใช่ student_id */
  username: string;
  /**
   * ชื่อ-นามสกุล — optional เพราะ auth-contract §10 กำหนดว่า JWT payload มีได้แค่
   * sub, username, layer1_role, faculty, iat, exp เท่านั้น (ห้ามเพิ่ม field)
   * ถ้าระบบย่อยมีชื่อจริงจาก API ของตัวเอง ให้ส่งเข้ามาทาง prop `user` ของ AppShell
   * ถ้าไม่มี หน้าจอจะแสดง username แทน
   */
  full_name?: string | null;
  layer1_role: Layer1Role;
  /** บทบาทเฉพาะระบบย่อย มาจาก API ของระบบย่อยเอง (data-dictionary §2) */
  layer2_role?: string | null;
  faculty?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

/**
 * แปลง JWT claims เป็น CsmjuUser — auth-contract §10/§11
 * 🔴 ไม่ตรวจลายเซ็น ใช้เพื่อแสดงผลเท่านั้น การบังคับสิทธิ์จริงอยู่ที่ NestJS (SEC-04)
 */
export function userFromClaims(claims: CsmjuJwtClaims | null): CsmjuUser | null {
  if (!claims?.username) return null;
  const role = claims.layer1_role;
  return {
    username: claims.username,
    // §12 layer1_role มีได้ 4 ค่าเท่านั้น — ถ้า Core ส่งค่านอกรายการ ถือว่าไม่รู้จัก ไม่เดาแทน
    layer1_role: (["student", "alumni", "staff", "admin"] as const).includes(
      role as Layer1Role,
    )
      ? (role as Layer1Role)
      : "student",
    faculty: claims.faculty ?? null,
  };
}

export interface CsmjuUserContextValue {
  user: CsmjuUser | null;
  loading: boolean;
  username: string | null;
  fullName: string | null;
  layer1Role: Layer1Role | null;
  layer2Role: string | null;
  faculty: string | null;
  /** ตรวจว่า layer2_role ของผู้ใช้อยู่ในรายการที่ระบุหรือไม่ */
  hasRole: (roles: string | string[]) => boolean;
}

const CsmjuUserContext = createContext<CsmjuUserContextValue | null>(null);

export interface CsmjuUserProviderProps {
  user: CsmjuUser | null;
  loading?: boolean;
  children: ReactNode;
}

export function CsmjuUserProvider({ user, loading = false, children }: CsmjuUserProviderProps) {
  const value = useMemo<CsmjuUserContextValue>(() => {
    const layer2 = user?.layer2_role ?? null;
    return {
      user,
      loading,
      username: user?.username ?? null,
      fullName: user?.full_name ?? null,
      layer1Role: user?.layer1_role ?? null,
      layer2Role: layer2,
      faculty: user?.faculty ?? null,
      hasRole: (roles) => {
        const list = Array.isArray(roles) ? roles : [roles];
        if (list.length === 0) return true;
        // layer1 admin เห็นได้ทุกอย่างเสมอ — ตรงกับที่ gateway บังคับฝั่ง backend
        if (user?.layer1_role === "admin") return true;
        return layer2 !== null && list.includes(layer2);
      },
    };
  }, [user, loading]);

  return <CsmjuUserContext.Provider value={value}>{children}</CsmjuUserContext.Provider>;
}

/**
 * อ่านข้อมูลผู้ใช้ปัจจุบัน — ต้องอยู่ใต้ <CsmjuAppShell>
 *
 * @example
 * const { username, layer1Role, hasRole } = useCsmjuUser();
 */
export function useCsmjuUser(): CsmjuUserContextValue {
  const ctx = useContext(CsmjuUserContext);
  if (!ctx) {
    throw new Error(
      "useCsmjuUser ต้องเรียกภายใน <CsmjuAppShell> — ตรวจว่า app/layout.tsx ครอบด้วย CsmjuAppShell แล้ว (§5.1)",
    );
  }
  return ctx;
}

/** อ่านคำเรียกภาษาไทยของบทบาท — ใช้แทนการแปลเองในระบบย่อย (§10.3) */
export function layer1RoleLabel(role: Layer1Role | null | undefined): string {
  if (!role) return "—";
  return LAYER1_ROLE_LABEL[role] ?? "—";
}
