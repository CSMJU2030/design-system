# @csmju2030/design-system

UI Kit และ Design Token มาตรฐานกลางของโครงการ **CSMJU2030**
สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้

> **เราไม่ได้ทำ 37 เว็บไซต์ เราทำ 1 แอปที่มี 37 โมดูล — ผู้ใช้ต้องไม่รู้สึกว่าข้ามไปอีกเว็บหนึ่ง**

| | |
|---|---|
| **เวอร์ชัน** | `1.2.0` (เดินคู่กับ `docs/ui-design-system.md` v1.2.0) |
| **Stack ที่รองรับ** | Next.js App Router (15+) · React 19 · TypeScript · Tailwind CSS v3/v4 |
| **คู่กับฝั่งหลังบ้าน** | NestJS (envelope `{success, data, meta}`) · PostgreSQL |
| **Registry** | GitHub Packages (`npm.pkg.github.com`) |

---

## เริ่มใช้ใน 5 นาที

อ่านฉบับเต็มที่ [`docs/QUICKSTART.md`](docs/QUICKSTART.md) — หรือย่อสุด:

```bash
# 1. ตั้งค่า registry ของ org (ครั้งเดียวต่อเครื่อง)
echo "@csmju2030:registry=https://npm.pkg.github.com" >> ~/.npmrc

# 2. ติดตั้ง
npm install @csmju2030/design-system
```

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "@csmju2030/design-system/styles.css";   /* token + font + base + component */
@import "@csmju2030/design-system/theme.css";    /* utility class ของ Tailwind v4 */
```

```tsx
// src/app/layout.tsx — เรียก AppShell ที่นี่ที่เดียว
import { CsmjuAppShell } from "@csmju2030/design-system";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <CsmjuAppShell
          subsystemName="csmju-equipment"
          displayName="ระบบครุภัณฑ์"
          nav={[
            { label: "ภาพรวม", href: "/", icon: "layout-dashboard" },
            { label: "รายการครุภัณฑ์", href: "/equipment-items", icon: "package" },
          ]}
        >
          {children}
        </CsmjuAppShell>
      </body>
    </html>
  );
}
```

**อย่าเริ่มจากศูนย์** — ลอก [`examples/subsystem-template/`](examples/subsystem-template) ไปเลย
ในนั้นมี `loading.tsx` / `error.tsx` / `not-found.tsx` / `metadata` / DataTable ครบ 4 สถานะ ที่ผ่าน CI แล้ว

---

## ตรวจงานตัวเองก่อนเปิด PR

```bash
npx csmju-ui-lint
```

ตรวจ 25 กฎจาก `ui-design-system.md` ให้อัตโนมัติ เช่น hex สีดิบ · UI library ต้องห้าม ·
`loading.tsx`/`error.tsx` ครบทุก route · `IconButton` ที่ไม่มี `aria-label` · `disabled` ที่ไม่มี `disabledReason` ·
`next/font/google` · ความลับใน `NEXT_PUBLIC_*` · การต่อ PostgreSQL จากฝั่ง Next.js

CI ของทุกระบบย่อยรันคำสั่งนี้ — **แดง = merge ไม่ได้**

---

## มีอะไรอยู่ในนี้บ้าง

### Design token (§3, §4)
สี · ระยะห่าง 8pt · มุมโค้ง · เงา · z-index · motion · breakpoint · type scale · chart palette
ทั้งหมดเป็น CSS variable `--csmju-*` + utility class ของ Tailwind ทั้ง v3 (preset) และ v4 (`@theme`)

### Component (§7)
| กลุ่ม | รายการ |
|---|---|
| Layout | `CsmjuAppShell` `Container` `PageHeader` `Section` `Stack` `Card` `Grid` `Divider` `Breadcrumb` |
| Action | `Button` `IconButton` `Link` `ButtonGroup` `DropdownMenu` |
| Form | `FormField` `FieldGroup` `FormRow` `FormActions` `TextInput` `TextArea` `Select` `MultiSelect` `Checkbox` `Radio` `RadioGroup` `Switch` `DatePicker` `TimePicker` `FileUpload` `SearchInput` `NumberInput` |
| Data | `DataTable` `Pagination` `StatCard` `Badge` `CountBadge` `StatusDot` `Tag` `Avatar` `EmptyState` `Timeline` `DescriptionList` `Tabs` `Accordion` |
| Feedback | `Toast`/`useToast` `Alert` `Modal` `ConfirmDialog` `Drawer` `Skeleton` `Spinner` `ProgressBar` `Tooltip` `ErrorState` |
| สิทธิ์ | `Can` `RequireRole` `RoleBadge` `useCsmjuUser` |
| Utility | `formatDate` `formatDateTime` `formatTime` `formatRelative` `formatMoney` `formatNumber` `formatPhone` `csmjuTitle` `useApi` `useMutation` `csmjuFetch` |
| ไอคอน | `@csmju2030/design-system/icons` (Lucide) |

รายละเอียด props ทั้งหมด: [`docs/COMPONENTS.md`](docs/COMPONENTS.md)

### สิ่งที่ package บังคับให้ทำถูกโดยที่ AIE ไม่ต้องจำ

- **ภาษาไทยมาก่อน** — line-height 1.65, ไม่มี letter-spacing ติดลบ, ไม่ break-all, ฟอนต์ IBM Plex Sans Thai แบบ self-host
- **พ.ศ. เสมอ / ISO เสมอ** — `formatDate()` แสดง `11 ส.ค. 2569`, ตรึง timezone `Asia/Bangkok`, ส่งข้อมูลกลับเป็น `2026-08-11`
- **เงินเป็นสตางค์** — `formatMoney(4850000)` → `48,500.00 บาท`
- **4 สถานะครบ** — `DataTable` ไม่ยอมคอมไพล์ถ้าไม่ส่ง `empty` มา
- **error ไม่ต้องคิดเอง** — `useApi()` map `error.code` เป็นข้อความไทยมาตรฐานตามตาราง §9.3 ให้แล้ว
- **401 ไม่ต้องเขียนเอง** — AppShell refresh token เงียบๆ แล้ว retry ให้ ถ้าไม่สำเร็จจึงส่งไป Core
- **a11y** — focus ring, skip link, focus trap ใน modal, `aria-*` ครบ, เคารพ `prefers-reduced-motion`

---

## เอกสาร

| ไฟล์ | สำหรับใคร |
|---|---|
| [`docs/ui-design-system.md`](docs/ui-design-system.md) | **มาตรฐานฉบับเต็ม** — PM / PL / AIE ทุกคนต้องอ่านส่วนของตัวเอง |
| [`docs/QUICKSTART.md`](docs/QUICKSTART.md) | AIE ที่กำลังจะเริ่มระบบย่อยของตัวเอง |
| [`docs/COMPONENTS.md`](docs/COMPONENTS.md) | อ้างอิง props ตอนเขียนโค้ด |
| [`docs/AI-PROMPT.md`](docs/AI-PROMPT.md) | บล็อกที่คัดลอกไปวางให้ AI อ่านก่อนสั่งงานทุกครั้ง |
| [`docs/ROLLOUT-37-TEAMS.md`](docs/ROLLOUT-37-TEAMS.md) | PM/PL — แผนกระจายงานและกำกับ 37 ระบบ |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | คนที่จะแก้ตัว design system เอง |
| [`CHANGELOG.md`](CHANGELOG.md) | อ่านทุกครั้งก่อน `npm update` |

---

## พัฒนา design system เอง

```bash
npm install
npm run typecheck     # tsc --noEmit
npm run build         # tsup -> dist/ (ESM + .d.ts) + คัดลอก css/cli
npm run lint:self     # csmju-ui-lint ตรวจตัวเอง
```

> **หมายเหตุทางเทคนิค:** build เป็น **ESM อย่างเดียว** และ **ไม่ bundle** (คงโครงไฟล์ไว้)
> เพราะ Next.js App Router ตัดขอบเขต Server/Client Component จาก directive `"use client"` ที่หัวไฟล์แต่ละไฟล์
> ถ้ารวมเป็นก้อนเดียว ฟังก์ชันที่ Server Component ต้องใช้ (`formatDate`, `csmjuTitle`) จะกลายเป็น client reference
> แล้ว `next build` จะพังตอน collect page data — ยืนยันด้วยการ build จริงใน `examples/subsystem-template`
