"use client";

/**
 * ไอคอนสำหรับเมนู — §14 ใช้ Lucide เท่านั้น ห้ามผสมชุดไอคอนอื่น
 *
 * ทำไมต้องมี registry: prop `nav` ใน subsystem.yaml เป็น YAML/JSON จึงส่ง component ไม่ได้
 * ต้องส่งเป็นชื่อ string แล้ว map เป็น component ที่นี่
 * ต้องการไอคอนที่ไม่มีในรายการ -> ส่ง ReactNode มาตรงๆ หรือขอเพิ่มตาม §17.4
 */
import type { LucideIcon } from "lucide-react";
import {
  Bell, BookOpen, Boxes, Building2, Calendar, CalendarDays, ChartBar, CircleHelp,
  ClipboardList, Clock, Cog, FileText, FolderOpen, GraduationCap, Home, Inbox,
  LayoutDashboard, ListChecks, Mail, MapPin, Megaphone, Package, Repeat, Search,
  Settings, ShieldCheck, Tags, Ticket, TrendingUp, User, Users, Wallet, Wrench,
} from "lucide-react";

export const NAV_ICONS = {
  bell: Bell,
  "book-open": BookOpen,
  boxes: Boxes,
  "building-2": Building2,
  calendar: Calendar,
  "calendar-days": CalendarDays,
  "chart-bar": ChartBar,
  "circle-help": CircleHelp,
  "clipboard-list": ClipboardList,
  clock: Clock,
  cog: Cog,
  "file-text": FileText,
  "folder-open": FolderOpen,
  "graduation-cap": GraduationCap,
  home: Home,
  inbox: Inbox,
  "layout-dashboard": LayoutDashboard,
  "list-checks": ListChecks,
  mail: Mail,
  "map-pin": MapPin,
  megaphone: Megaphone,
  package: Package,
  repeat: Repeat,
  search: Search,
  settings: Settings,
  "shield-check": ShieldCheck,
  tags: Tags,
  ticket: Ticket,
  "trending-up": TrendingUp,
  user: User,
  users: Users,
  wallet: Wallet,
  wrench: Wrench,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof NAV_ICONS;

export function NavIcon({ name, size = 20 }: { name?: string; size?: number }) {
  if (!name) return null;
  const Icon = NAV_ICONS[name as NavIconName];
  if (!Icon) return null;
  return <Icon size={size} aria-hidden="true" className="csmju-nav-item__icon" />;
}
