# CHANGELOG

รูปแบบเวอร์ชันตาม [semver](https://semver.org/lang/th/) และนโยบายข้อ §17.5 ของ `ui-design-system.md`

| ประเภท | ระบบย่อยต้องทำอะไร |
|---|---|
| **PATCH** (1.2.x) | `npm update` ก็จบ |
| **MINOR** (1.x.0) | อัปเดตเมื่อสะดวก ภายใน 1 sprint |
| **MAJOR** (x.0.0) | PM ประกาศล่วงหน้า ≥ 2 สัปดาห์ + มี migration guide + ของเดิม deprecated อย่างน้อย 1 minor cycle ก่อนลบจริง |

> `csmju-ui-lint` จะ **เตือน** เมื่อ `standards_version` ตามหลังเกิน 1 minor และ **fail** เมื่อตามหลังเกิน 1 major

---

## 1.2.0 — 7 ก.ย. 2569

เวอร์ชันแรกที่เป็นโค้ดจริง — ก่อนหน้านี้ `1.0.0`–`1.2.0` เป็นเลขเวอร์ชันของ **เอกสาร** เท่านั้น
เลขเวอร์ชันของ package เดินคู่กับเอกสารตั้งแต่นี้ไป เพื่อให้ `standards_version` กับ `design_system_version` เทียบกันตรงๆ ได้

### Design token (§3, §4, §13)
- CSS variable `--csmju-*` ครบทุกหมวด: สี · spacing 8pt · radius · elevation · z-index · motion · breakpoint · type scale · chart palette
- Dark mode ตาม §13 ผ่าน `data-csmju-theme="dark"` / `"auto"` (🟢 ทางเลือก)
- ฟอนต์ self-host ผ่าน `@fontsource` — IBM Plex Sans Thai 400/600 + Inter Variable + Plus Jakarta Sans Variable (4 ไฟล์ ตามงบ §15)
- base layer บังคับกฎภาษาไทย: line-height 1.65 · ไม่มี letter-spacing ติดลบ · ไม่ break-all · ไม่ uppercase · `prefers-reduced-motion`
- รองรับทั้ง **Tailwind v4** (`theme.css` แบบ `@theme`) และ **Tailwind v3** (`tailwind-preset.js`)

### Component (§5–§10)
- `CsmjuAppShell` — top bar · ปุ่มกลับหน้าหลัก Core · เมนูผู้ใช้ + ออกจากระบบ · sidebar (drawer/icon rail/เต็ม) · breadcrumb อัตโนมัติ · **401 refresh เงียบแล้ว retry** · toast container · error boundary · skip link · footer ชื่อหน่วยงานจริง
- Layout: `Container` `Stack` `Section` `PageHeader` `Card` `Grid` `Divider` `Breadcrumb`
- Action: `Button` (5 variant × 3 size × 6 สถานะ) `IconButton` `Link` `ButtonGroup` `DropdownMenu`
- Form: `FormField` `FieldGroup` `FormRow` `FormActions` `TextInput` `TextArea` `NumberInput` `Select` `MultiSelect` `SearchInput` `Checkbox` `Radio` `RadioGroup` `Switch` `DatePicker` `TimePicker` `FileUpload`
- Data: `DataTable` `Pagination` `StatCard` `Badge` `CountBadge` `StatusDot` `Tag` `Avatar` `EmptyState` `Timeline` `DescriptionList` `Tabs` `Accordion`
- Feedback: `ToastProvider`/`useToast` `Alert` `Modal` `ConfirmDialog` `Drawer` `Skeleton` `SkeletonText` `SkeletonTable` `Spinner` `ProgressBar` `Tooltip` `ErrorState`
- สิทธิ์: `Can` `RequireRole` `RoleBadge` `useCsmjuUser`
- ไอคอน: subpath `@csmju2030/design-system/icons` (Lucide)

### Utility (§11.3)
- `formatDate` `formatDateTime` `formatTime` `formatRelative` `formatMoney` `formatNumber` `formatPhone` `formatFileSize` `toIsoDate` `toBuddhistYear`
- แสดง **พ.ศ.** เสมอ · ตรึง timezone `Asia/Bangkok` · เงินรับเป็นสตางค์ · ค่าว่างคืน `—`
- `csmjuTitle()` / `createCsmjuTitle()` สำหรับ metadata ตาม §11.4

### API + error mapping (§9.3, §16.1.2)
- `csmjuFetch` / `csmjuFetchEnvelope` — แกะ envelope `{success, data, meta}` ของ NestJS
- `useApi` — หน่วง skeleton 300ms ตาม §9.1 · `refetch` · abort เมื่อ unmount
- `useMutation` — สถานะ `loading` ผูกกับปุ่มได้ตรงๆ · `error.field` จาก `VALIDATION_ERROR`
- `mapApiError` — 6 error code มาตรฐาน + `NETWORK_ERROR` / `TIMEOUT` / `RATE_LIMIT` แปลงเป็นข้อความไทยมาตรฐาน
- 401 จัดการที่ AppShell ที่เดียว: refresh → retry 1 ครั้ง → redirect ไป Core

### เครื่องมือ
- **`csmju-ui-lint`** — 25 กฎจาก §16.2 · §17.2 · §18.2 พร้อม `--json` สำหรับ CI
- `examples/subsystem-template` — โครง Next.js ที่ build ผ่านและ lint เขียว
- `templates/ui-compliance.yml` — CI ที่ระบบย่อยคัดลอกไปใช้ได้เลย

### หมายเหตุทางเทคนิค
- **build เป็น ESM อย่างเดียวและไม่ bundle** — เพราะ Next.js App Router ตัดขอบเขต Server/Client Component จาก directive `"use client"` ที่หัวไฟล์แต่ละไฟล์ ถ้ารวมเป็นก้อนเดียว `formatDate`/`csmjuTitle` จะกลายเป็น client reference แล้ว `next build` พังตอน collect page data
- สไตล์ของ component เป็น **plain CSS** ที่อ้าง `--csmju-*` ไม่ใช่ Tailwind class เพราะ Tailwind v4 ไม่สแกน `node_modules` ถ้าใช้ utility class ข้างใน ระบบย่อยจะได้ component ที่ไม่มีสไตล์โดยไม่มีข้อความ error ใดๆ
