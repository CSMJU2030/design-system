"use client";

/**
 * CsmjuAppShell — โครงหน้าจอบังคับของทุกระบบย่อย (§5.1)
 *
 * 🔴 ทุกหน้าของทุกระบบย่อยต้องถูกครอบด้วย component นี้ และเรียกที่ app/layout.tsx ที่เดียว
 *    ห้ามวาด header / sidebar / เมนูผู้ใช้ / ปุ่มออกจากระบบเอง
 *
 * เหตุผลที่บังคับ (จากเอกสาร): ปุ่ม "ออกจากระบบ" และ "กลับหน้าหลัก" ต้องอยู่ตำแหน่งเดิมทั้ง 37 ระบบ
 * ไม่งั้นผู้ใช้จะหลงทางทุกครั้งที่เปลี่ยนระบบ และถ้าแต่ละระบบเขียน 401 handling เอง
 * จะเกิดปัญหาตามที่ auth-contract.md เตือนไว้ (บางระบบเด้ง login ถี่เกินไป บางระบบไม่เด้งเลย)
 *
 * สิ่งที่ component นี้จัดการให้: top bar · เมนูผู้ใช้ · sidebar · breadcrumb · 401 refresh
 * · toast container · error boundary · skip link · footer
 */
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ArrowLeft, Bell, ChevronDown, LogOut, Menu, UserCircle2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { registerUnauthorizedHandler } from "../../lib/auth-bridge";
import { CsmjuUserProvider, layer1RoleLabel, type CsmjuUser } from "../../lib/user";
import { NavIcon } from "../../lib/icon-registry";
import { ToastProvider } from "../feedback/Toast";
import { Drawer } from "../feedback/Drawer";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";
import { Container } from "./primitives";
import { CsmjuErrorBoundary } from "./ErrorBoundary";
import { Avatar, CountBadge } from "../data/display";
import { DropdownItem, DropdownMenu, DropdownSeparator } from "../action/DropdownMenu";

export interface CsmjuNavItem {
  label: string;
  href: string;
  /** ชื่อไอคอน Lucide แบบ kebab-case เช่น "layout-dashboard" (§14) */
  icon?: string;
  /** จำนวนแจ้งเตือนบนเมนู */
  count?: number;
}

export interface CsmjuAppShellProps {
  /** 🔴 ต้องตรงกับ `name` ใน subsystem.yaml */
  subsystemName: string;
  /** 🔴 ชื่อไทยของระบบย่อย ตาม data-dictionary §4 */
  displayName: string;
  /** เมนูของระบบย่อย — ควรตรงกับ `ui.nav` ใน subsystem.yaml */
  nav?: CsmjuNavItem[];
  children: ReactNode;

  /**
   * ข้อมูลผู้ใช้ปัจจุบัน
   * ปกติส่งมาจาก Server Component ที่อ่าน header X-User-Id ที่ gateway แนบมา (auth-contract §5)
   * ถ้าไม่ส่ง AppShell จะเรียก `${NEXT_PUBLIC_API_BASE_URL}/api/v1/me` ให้เอง
   */
  user?: CsmjuUser | null;

  /** จำนวนแจ้งเตือนที่ยังไม่อ่าน (0 = ซ่อน badge) */
  notificationCount?: number;
  /** ปลายทางเมื่อกดกระดิ่ง — ไม่ส่ง = ซ่อนกระดิ่ง */
  notificationHref?: string;

  /** แถบเครื่องมือเพิ่มเติมบน header เช่นช่องค้นหาข้ามระบบ */
  headerSlot?: ReactNode;

  /** แทนที่ breadcrumb อัตโนมัติ เมื่อชื่อ segment ใน URL ไม่ใช่ภาษาไทยที่อ่านรู้เรื่อง */
  breadcrumb?: BreadcrumbItem[];

  className?: string;
}

/** URL ของ Core — ต้องมาจาก env ไม่ hardcode (§16.2 ข้อ 5) */
function coreUrl(): string {
  const raw =
    (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_CSMJU_CORE_URL : undefined) ?? "";
  return raw.replace(/\/+$/, "");
}

function apiBase(): string {
  const raw =
    (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_API_BASE_URL : undefined) ?? "";
  return raw.replace(/\/+$/, "");
}

export function CsmjuAppShell({
  subsystemName,
  displayName,
  nav = [],
  children,
  user: userProp,
  notificationCount = 0,
  notificationHref,
  headerSlot,
  breadcrumb,
  className,
}: CsmjuAppShellProps) {
  const pathname = usePathname() ?? "/";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<CsmjuUser | null>(userProp ?? null);
  const [userLoading, setUserLoading] = useState(userProp === undefined);

  const core = coreUrl();

  /* ---------- §5.1 ดักจับ token หมดอายุ: refresh เงียบ -> ถ้าไม่สำเร็จ redirect ไป Core ---------- */
  useEffect(() => {
    return registerUnauthorizedHandler(async () => {
      try {
        const res = await fetch(`${core}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) return true;
      } catch {
        // ตกลงมาที่ redirect ด้านล่าง
      }
      // §9.3 ผู้ใช้ไม่ควรรู้ตัว — ไม่แสดงข้อความใดๆ แค่ส่งกลับไปหน้า login ของ Core
      if (typeof window !== "undefined") {
        const back = encodeURIComponent(window.location.href);
        window.location.href = `${core}/login?redirect_uri=${back}`;
      }
      return false;
    });
  }, [core]);

  /* ---------- ดึงข้อมูลผู้ใช้เมื่อไม่ได้ส่งมาทาง prop ---------- */
  useEffect(() => {
    if (userProp !== undefined) {
      setUser(userProp);
      setUserLoading(false);
      return;
    }
    let alive = true;
    setUserLoading(true);
    fetch(`${apiBase()}/api/v1/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!alive) return;
        // รองรับทั้ง envelope มาตรฐานและ object ดิบ เผื่อ gateway ตอบตรง
        setUser(body?.data ?? body ?? null);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setUserLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userProp]);

  /* ---------- §5.1 Breadcrumb สร้างอัตโนมัติจาก route ---------- */
  const crumbs = useMemo<BreadcrumbItem[]>(() => {
    if (breadcrumb) return breadcrumb;
    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: displayName, href: "/" }];
    let acc = "";
    for (const seg of segments) {
      acc += `/${seg}`;
      // ใช้ชื่อเมนูภาษาไทยถ้ามี ไม่งั้นใช้ segment ดิบ (ระบบย่อยควรส่ง breadcrumb prop มาแทน)
      const match = nav.find((n) => n.href === acc);
      items.push({ label: match?.label ?? decodeURIComponent(seg), href: acc });
    }
    return items;
  }, [breadcrumb, pathname, nav, displayName]);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname],
  );

  const navList = (
    <ul className="csmju-sidebar__list">
      {nav.map((item) => (
        <li key={item.href}>
          <NextLink
            href={item.href}
            className="csmju-nav-item"
            aria-current={isActive(item.href) ? "page" : undefined}
            // icon rail ซ่อนข้อความด้วย CSS จึงต้องมี aria-label ให้ screen reader เสมอ
            aria-label={item.label}
            onClick={() => setDrawerOpen(false)}
          >
            <NavIcon name={item.icon} />
            <span className="csmju-nav-item__label">{item.label}</span>
            {item.count ? <CountBadge count={item.count} label={item.label} /> : null}
          </NextLink>
        </li>
      ))}
    </ul>
  );

  const currentYearBE = new Date().getFullYear() + 543;

  return (
    <CsmjuUserProvider user={user} loading={userLoading}>
      <ToastProvider>
        <div className={cn("csmju-shell", className)} data-subsystem={subsystemName}>
          {/* §12.3 skip link */}
          <a href="#main" className="csmju-skip-link">
            ข้ามไปยังเนื้อหาหลัก
          </a>

          <header className="csmju-shell__header">
            {nav.length > 0 ? (
              <button
                type="button"
                className="csmju-icon-btn csmju-shell__menu-btn"
                aria-label="เปิดเมนู"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
              >
                <Menu size={20} aria-hidden="true" />
              </button>
            ) : null}

            <NextLink href="/" className="csmju-shell__brand">
              <span className="csmju-shell__logo" aria-hidden="true">
                CS
              </span>
              <span className="csmju-shell__subsystem">{displayName}</span>
            </NextLink>

            <span className="csmju-shell__spacer" />

            {headerSlot}

            <div className="csmju-shell__header-actions">
              {/* §5.1 ปุ่มกลับหน้าหลักของ Core — ตำแหน่งเดิมทั้ง 37 ระบบ */}
              {core ? (
                <a
                  href={`${core}/dashboard`}
                  className="csmju-btn csmju-btn--ghost csmju-btn--sm"
                  aria-label="กลับหน้าหลัก CSMJU"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  <span className="csmju-nav-item__label">กลับหน้าหลัก</span>
                </a>
              ) : null}

              {notificationHref ? (
                <NextLink
                  href={notificationHref}
                  className="csmju-icon-btn"
                  aria-label={
                    notificationCount > 0
                      ? `การแจ้งเตือน ${notificationCount} รายการที่ยังไม่อ่าน`
                      : "การแจ้งเตือน"
                  }
                  style={{ position: "relative" }}
                >
                  <Bell size={20} aria-hidden="true" />
                  {notificationCount > 0 ? (
                    <span style={{ position: "absolute", top: 0, insetInlineEnd: 0 }}>
                      <CountBadge count={notificationCount} label="การแจ้งเตือน" />
                    </span>
                  ) : null}
                </NextLink>
              ) : null}

              <UserMenu user={user} coreBase={core} />
            </div>
          </header>

          <div className="csmju-shell__body">
            {nav.length > 0 ? (
              <nav className="csmju-sidebar" aria-label={`เมนู${displayName}`}>
                {navList}
              </nav>
            ) : null}

            <main id="main" className="csmju-shell__main">
              <Container>
                <div className="csmju-shell__content">
                  <Breadcrumb items={crumbs} />
                  <CsmjuErrorBoundary
                    onGoHome={() => {
                      if (typeof window !== "undefined") window.location.href = "/";
                    }}
                  >
                    {children}
                  </CsmjuErrorBoundary>
                </div>

                {/* §19.1 ข้อ 2 ใช้ชื่อจริงของหน่วยงาน ไม่ใช่ placeholder ภาษาอังกฤษ */}
                <footer className="csmju-shell__footer">
                  <p>สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้</p>
                  <p>© {currentYearBE} CSMJU2030</p>
                </footer>
              </Container>
            </main>
          </div>

          {/* §6.2 เมนูมือถือเป็น drawer */}
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={displayName} side="start">
            {navList}
          </Drawer>
        </div>
      </ToastProvider>
    </CsmjuUserProvider>
  );
}

/** §5.1 เมนูผู้ใช้ — ชื่อ-สกุล, รหัส, บทบาท, ลิงก์โปรไฟล์, ปุ่มออกจากระบบ */
function UserMenu({ user, coreBase }: { user: CsmjuUser | null; coreBase: string }) {
  if (!user) {
    return (
      <span className="csmju-icon-btn" aria-label="กำลังโหลดข้อมูลผู้ใช้">
        <UserCircle2 size={22} aria-hidden="true" />
      </span>
    );
  }

  return (
    <DropdownMenu
      trigger={(props) => (
        <button
          type="button"
          className="csmju-icon-btn"
          aria-label={`เมนูของ ${user.full_name}`}
          {...props}
        >
          <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      )}
    >
      <div className="csmju-user-menu__identity">
        <p className="csmju-user-menu__name">{user.full_name}</p>
        <p className="csmju-user-menu__meta">
          {user.username} · {layer1RoleLabel(user.layer1_role)}
        </p>
      </div>
      <DropdownItem href="/profile" icon={<UserCircle2 size={18} />}>
        โปรไฟล์ของฉัน
      </DropdownItem>
      <DropdownSeparator />
      {/* 🔴 §16.2 ข้อ 3/7 การออกจากระบบเป็นของ Core ทั้งหมด ระบบย่อยห้ามเคลียร์ session เอง */}
      <DropdownItem
        tone="danger"
        icon={<LogOut size={18} />}
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `${coreBase}/logout`;
          }
        }}
      >
        ออกจากระบบ
      </DropdownItem>
    </DropdownMenu>
  );
}
