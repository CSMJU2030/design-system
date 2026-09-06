"use client";

/**
 * Component เกี่ยวกับสิทธิ์ — §10
 *
 * 🔴 ทั้งหมดนี้เป็นเรื่อง "ประสบการณ์ใช้งาน" ไม่ใช่ "ความปลอดภัย"
 *    การบังคับสิทธิ์จริงอยู่ที่ NestJS ซึ่งอ่านจาก header ที่ gateway แนบมา (auth-contract §5)
 *    ห้ามใช้ <Can> เป็นเหตุผลที่จะไม่ตรวจสิทธิ์ฝั่ง backend
 */
import type { ReactNode } from "react";
import { layer1RoleLabel, useCsmjuUser, type Layer1Role } from "../../lib/user";
import { cn } from "../../lib/cn";

export interface CanProps {
  /** layer2_role ที่มีสิทธิ์เห็นเนื้อหานี้ */
  role: string | string[];
  children: ReactNode;
  /** แสดงอะไรแทนเมื่อไม่มีสิทธิ์ — ปกติไม่ต้องใส่ (§10.1 ไม่มีสิทธิ์เลย = ซ่อน) */
  fallback?: ReactNode;
}

/**
 * §10.1 ผู้ใช้ไม่มีสิทธิ์ในฟีเจอร์นั้นเลย -> ซ่อน
 * (การแสดงสิ่งที่กดไม่ได้ตลอดกาลสร้างความสับสน)
 *
 * ถ้าผู้ใช้ "มีสิทธิ์แต่ทำไม่ได้ตอนนี้" ให้ใช้ <Button disabled disabledReason="..."> แทน
 *
 * @example
 * <Can role={["admin", "editor"]}>
 *   <Button variant="primary">เพิ่มครุภัณฑ์</Button>
 * </Can>
 */
export function Can({ role, children, fallback = null }: CanProps) {
  const { hasRole, loading } = useCsmjuUser();
  // ระหว่างยังไม่รู้สิทธิ์ ให้ซ่อนไว้ก่อน — ดีกว่ากะพริบให้เห็นปุ่มแล้วหายไป
  if (loading) return <>{fallback}</>;
  return hasRole(role) ? <>{children}</> : <>{fallback}</>;
}

export interface RequireRoleProps {
  role: string | string[];
  children: ReactNode;
  /** แสดงเมื่อไม่มีสิทธิ์ — ปกติส่ง <ErrorState error={{presentation:"forbidden",...}}/> */
  fallback: ReactNode;
}

/**
 * §10.1 ทั้งหน้าที่ผู้ใช้เข้าไม่ได้ -> แสดงหน้า 403 ตาม §9.3
 * ต่างจาก <Can> ตรงที่บังคับให้ระบุ fallback เสมอ — ทั้งหน้าว่างเปล่าคือบั๊ก
 */
export function RequireRole({ role, children, fallback }: RequireRoleProps) {
  const { hasRole, loading } = useCsmjuUser();
  if (loading) return null;
  return hasRole(role) ? <>{children}</> : <>{fallback}</>;
}

export interface RoleBadgeProps {
  layer1Role?: Layer1Role | null;
  /** บทบาทเฉพาะระบบย่อย — แสดงต่อท้ายเมื่อสูงกว่าปกติ (§10.3) */
  layer2Label?: string | null;
  className?: string;
}

/**
 * §10.3 ใช้ตัวนี้เท่านั้นเพื่อให้สีและคำเรียกตรงกันทุกระบบ — 🔴 ห้ามแปลคำเรียกเอง
 *
 * @example <RoleBadge layer1Role="student" layer2Label="ผู้ดูแลระบบครุภัณฑ์" />
 *          -> "นักศึกษา · ผู้ดูแลระบบครุภัณฑ์"
 */
export function RoleBadge({ layer1Role, layer2Label, className }: RoleBadgeProps) {
  const user = useCsmjuUser();
  const role = layer1Role ?? user.layer1Role;
  if (!role) return null;

  return (
    <span className={cn("csmju-role-badge", className)}>
      <span>{layer1RoleLabel(role)}</span>
      {layer2Label ? (
        <>
          <span className="csmju-role-badge__sep" aria-hidden="true">
            ·
          </span>
          <span className="csmju-role-badge__layer2">{layer2Label}</span>
        </>
      ) : null}
    </span>
  );
}
