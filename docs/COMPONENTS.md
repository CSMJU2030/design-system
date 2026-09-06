# COMPONENTS — อ้างอิง API

ทุก component รับ `className` ได้เพื่อปรับ **layout** เท่านั้น — 🔴 ห้ามใช้ override สี/ฟอนต์/radius (§7.3.1)
ทุก component ไม่มี `margin` ในตัวเอง ให้ parent เป็นคนจัดระยะห่าง (§7.3.4)

```tsx
import { Button, DataTable /* ... */ } from "@csmju2030/design-system";
import { Package, Repeat } from "@csmju2030/design-system/icons";
```

---

## Layout

### `<CsmjuAppShell>` 🔴 บังคับทุกระบบ
เรียกที่ `app/layout.tsx` **ที่เดียว** ห้ามเรียกซ้ำในหน้าลูก

| prop | ชนิด | ความหมาย |
|---|---|---|
| `subsystemName` | `string` | ต้องตรงกับ `name` ใน `subsystem.yaml` |
| `displayName` | `string` | ชื่อไทยของระบบย่อย ตาม data-dictionary §4 |
| `nav` | `CsmjuNavItem[]` | `{ label, href, icon?, count? }` — `icon` เป็นชื่อ Lucide แบบ kebab-case |
| `user` | `CsmjuUser \| null` | ส่งจาก Server Component ได้ ถ้าไม่ส่งจะเรียก `/api/v1/me` ให้เอง |
| `notificationCount` | `number` | จำนวนที่ยังไม่อ่าน (0 = ซ่อน badge) |
| `notificationHref` | `string` | ปลายทางของกระดิ่ง — ไม่ส่ง = ซ่อนกระดิ่ง |
| `headerSlot` | `ReactNode` | ของเพิ่มบน header เช่นช่องค้นหา |
| `breadcrumb` | `BreadcrumbItem[]` | แทนที่ breadcrumb อัตโนมัติ เมื่อ segment ใน URL ไม่ใช่ไทย |

จัดการให้: top bar · ปุ่มกลับหน้าหลัก Core · เมนูผู้ใช้ + ปุ่มออกจากระบบ · sidebar + drawer มือถือ ·
breadcrumb · **401 refresh เงียบแล้ว retry** · toast container · error boundary · skip link · footer ชื่อหน่วยงานจริง

**env ที่ต้องตั้ง:** `NEXT_PUBLIC_CSMJU_CORE_URL` · `NEXT_PUBLIC_API_BASE_URL`

### `<Container prose?>` · `<Stack>` · `<Section title? actions?>`
`Container` = กว้างสูงสุด 1280px + padding ตาม breakpoint (`prose` = 68ch สำหรับบทความ)
`Stack` = ระยะห่าง 48px ระหว่าง section · `Section` = 32px ระหว่าง block

### `<PageHeader>` 🔴 บังคับทุกหน้า
`title` (เป็นเจ้าของ `<h1>` เดียวของหน้า) · `description` · `actions`

### `<Card>`
`title` `description` `actions` `flush` `interactive` `attention`
การ์ดมาตรฐาน = พื้น surface + border 1px + radius 16 + padding 24 + **ไม่มีเงา**
`attention` ใช้เฉพาะการ์ดที่ "ต้องการการดำเนินการ" และต้องมีข้อความบอกเหตุผลกำกับ

### `<Grid columns={1|2|3|4}>`
ไล่ 4 (xl) → 3 (lg) → 2 (md) → 1 (base) ให้อัตโนมัติ

### `<Divider orientation?>` · `<Breadcrumb items>`

---

## Action

### `<Button>`
| prop | ค่า | หมายเหตุ |
|---|---|---|
| `variant` | `primary` `secondary` `ghost` `danger` `link` | 🔴 `primary` สูงสุด **1 ปุ่ม** ต่อหน้าจอ |
| `size` | `sm`(32) `md`(40) `lg`(48) | |
| `loading` | `boolean` | spinner + ข้อความเดิม + `aria-busy` + กดซ้ำไม่ได้ |
| `disabled` + `disabledReason` | `boolean` + `string` | 🔴 **ต้องมาคู่กันเสมอ** — จะ render เป็น tooltip + `aria-describedby` |
| `block` | `boolean` | เต็มความกว้าง (ปุ่มหลักบนมือถือ) |
| `startIcon` `endIcon` | `ReactNode` | ใส่ `aria-hidden` ให้เอง |

ข้อความบนปุ่มต้องเป็นคำกริยาที่บอกผลลัพธ์ และใช้คำมาตรฐาน §11.2
(`บันทึก` `ยกเลิก` `ลบ` `แก้ไข` `เพิ่ม` `ค้นหา` `ตัวกรอง` `ล้างตัวกรอง` `ดูรายละเอียด` `ส่งคำขอ` `ออกจากระบบ`)

### `<IconButton label icon>` 🔴 `label` บังคับ
`label` เป็นทั้ง `aria-label` และ tooltip — ในตารางต้องระบุชื่อรายการด้วย
เช่น `label="แก้ไขประกาศ ปฐมนิเทศนักศึกษาใหม่"`

### `<Link href tone? external?>` · `<ButtonGroup attached?>`

### `<DropdownMenu trigger>` + `<DropdownItem>` `<DropdownLabel>` `<DropdownSeparator>`
ปิดด้วย Esc และคลิกนอกกล่องให้แล้ว

---

## Form

### `<FormField>` 🔴 ใช้ห่อทุก input
```tsx
<FormField label="รหัสครุภัณฑ์" required hint="ตัวอย่าง: CS-PRJ-001" error={errors.asset_code}>
  {(props) => <TextInput {...props} value={v} onChange={onChange} />}
</FormField>
```
ผูก `id` · `aria-describedby` · `aria-invalid` · `aria-required` ให้ครบเอง
🔴 ห้ามใช้ `placeholder` แทน `label`

### ตัวช่วยจัดฟอร์ม
`<FieldGroup legend>` (ฟอร์ม > 8 ฟิลด์) · `<FormRow>` (2 คอลัมน์สำหรับฟิลด์สั้นที่สัมพันธ์กัน) ·
`<FormActions>` (ปุ่มล่างซ้าย เรียง `[บันทึก] [ยกเลิก]` เหมือนกันทุกระบบ)

### input
| component | หมายเหตุ |
|---|---|
| `<TextInput icon?>` | |
| `<TextArea>` | |
| `<NumberInput suffix?>` | ชิดขวา + `tabular-nums` |
| `<Select options emptyLabel?>` | `options: {value,label,disabled?}[]` |
| `<MultiSelect options value onValueChange>` | แสดงที่เลือกเป็น `Tag` ลบได้ |
| `<SearchInput value onValueChange label?>` | มีปุ่มล้างคำค้นหา |
| `<Checkbox label hint?>` `<Radio>` `<RadioGroup legend>` | |
| `<Switch label>` | |
| `<DatePicker value onValueChange>` | `value` เป็น ISO ค.ศ. `"2026-08-11"` · แสดงตัวอย่าง **พ.ศ.** ให้ผู้ใช้ยืนยัน |
| `<TimePicker value onValueChange>` | `"HH:mm"` |
| `<FileUpload files onFilesChange maxSizeBytes?>` | ลากวางได้ + แสดงขนาดไฟล์ |

---

## Data display

### `<DataTable<T>>`
| prop | จำเป็น | ความหมาย |
|---|---|---|
| `columns` | ✅ | `{ key, header, render, align?, sortable?, hideOnMobile? }[]` — `key` ต้องตรง data-dictionary (snake_case) |
| `rows` `rowKey` `caption` | ✅ | `caption` เป็นคำอธิบายให้ screen reader |
| `empty` | ✅ | **บังคับด้วย type** — `{ title, description?, action? }` ("ยังไม่มีข้อมูล") |
| `emptyFiltered` | | ("ค้นหาแล้วไม่พบ") — คนละข้อความ คนละทางออก |
| `loading` `error` `onRetry` | | ต่อกับ `useApi()` ได้ตรงๆ |
| `search` | | `{ value, onChange, placeholder? }` |
| `pagination` | | `{ page, perPage?=20, total, onPageChange }` |
| `sort` | | `{ key, direction, onChange }` — 🔴 ต้องส่งไปเรียงที่ NestJS ไม่ใช่เรียงในหน้าเว็บ |
| `selection` | | `{ selectedKeys, onChange, actions }` → แถบ action ลอยพร้อมจำนวน |
| `rowActions` | | คอลัมน์ "จัดการ" ขวาสุด ใช้ `IconButton` |
| `responsive` | | `"cards"` (ค่าเริ่มต้น, แนะนำ) หรือ `"scroll"` |
| `density` | | `"comfortable"`(48px) หรือ `"compact"`(40px) |

### อื่นๆ
| component | props หลัก |
|---|---|
| `<Pagination>` | `page` `perPage=20` `total` `onPageChange` |
| `<StatCard>` | `label` `value` `unit?` `icon?` `hint?` `attention?` — ตั้ง `tabular-nums` ให้แล้ว |
| `<Badge tone icon?>` | `neutral` `success` `warning` `danger` `info` |
| `<CountBadge count label>` | badge ตัวเลขทรงกลม (ที่เดียวที่ใช้ radius-full ได้) |
| `<StatusDot tone>` | 🔴 ต้องมีข้อความเสมอ ห้ามใช้จุดสีอย่างเดียว |
| `<Tag onRemove?>` | |
| `<Avatar name src? size?>` | ไม่มีรูป → อักษรย่อบนพื้น primary-soft |
| `<EmptyState variant title description? action?>` | `variant`: `no-data` \| `no-results` |
| `<Timeline items>` | `{ title, time?, description?, active? }[]` |
| `<DescriptionList items columns?>` | `{ term, description }[]` |
| `<Tabs items label>` | รองรับลูกศรซ้าย/ขวา, Home, End |
| `<Accordion items multiple?>` | |

---

## Feedback

| component | ใช้เมื่อ | ตำแหน่ง | ระยะเวลา |
|---|---|---|---|
| `useToast().success()` | บันทึกสำเร็จ | มุมขวาบน / บนสุดบนมือถือ | 4 วินาที |
| `<Alert tone title? actions?>` | error ของทั้งฟอร์ม, CONFLICT, เน็ตหลุด | บนสุดของฟอร์ม | ค้างไว้ |
| ข้อความใน `<FormField error>` | error ของฟิลด์เดียว | ใต้ฟิลด์ | จนกว่าจะแก้ |
| `<ErrorState error onRetry onGoHome>` | error ของทั้งหน้า | แทนที่เนื้อหา | ค้างไว้ |
| `<ConfirmDialog>` | ต้องการการตัดสินใจ | กลางจอ | จนกว่าจะเลือก |

🔴 **ห้ามใช้ toast แจ้ง error ที่ผู้ใช้ต้องแก้ไข** — มันหายไปก่อนผู้ใช้อ่านจบ

```tsx
const toast = useToast();
toast.success("บันทึกแล้ว", "ข้อมูลครุภัณฑ์ถูกบันทึกเรียบร้อย");
```

### `<Modal open onClose title>`
`description` `footer` `size`(`sm`480/`md`560/`lg`720) `closeOnOverlayClick`
จัดการให้: focus trap · Esc · คืน focus จุดเดิม · `role="dialog"` + `aria-modal` + `aria-labelledby` · ล็อกสกรอลล์ · full-screen sheet บนมือถือ

ใช้กับ: ยืนยัน · ฟอร์มสั้น ≤5 ฟิลด์ · ดูรายละเอียดย่อ
❌ ห้ามใช้กับ: ฟอร์มยาว · flow หลายขั้นตอน · เนื้อหาที่ควรมี URL ของตัวเอง

### `<ConfirmDialog>` 🔴 การลบทุกครั้งต้องผ่านตัวนี้
`title` ต้องระบุ **ชื่อของสิ่งที่จะลบ** · `description` ต้องบอก **ผลที่ตามมา** · `confirmLabel` ต้องเป็น **คำกริยาจริง**

### `<Drawer side="start"|"end">` · `<Skeleton>` `<SkeletonText lines>` `<SkeletonTable rows columns>` · `<Spinner>` · `<ProgressBar value label>` · `<Tooltip content>`

⚠️ `Spinner` ห้ามใช้แทน skeleton ตอนโหลดหน้า — ใช้ได้เฉพาะในปุ่มหรือพื้นที่เล็ก (§9.1)

---

## สิทธิ์

```tsx
const { username, fullName, layer1Role, layer2Role, faculty, hasRole, loading } = useCsmjuUser();
```

| | |
|---|---|
| `<Can role={["admin","editor"]} fallback?>` | ไม่มีสิทธิ์ → **ซ่อน** |
| `<RequireRole role fallback>` | ทั้งหน้าที่เข้าไม่ได้ → แสดง `fallback` (หน้า 403) |
| `<RoleBadge layer1Role? layer2Label?>` | 🔴 ใช้ตัวนี้เท่านั้น ห้ามแปลคำเรียกเอง |

คำเรียกมาตรฐาน: `student`→นักศึกษา · `alumni`→ศิษย์เก่า · `staff`→บุคลากร/อาจารย์ · `admin`→ผู้ดูแลระบบ

> 🔴 ทั้งหมดนี้เป็นเรื่อง **ประสบการณ์ใช้งาน** ไม่ใช่ความปลอดภัย
> การบังคับสิทธิ์จริงอยู่ที่ NestJS ซึ่งอ่านจาก header `X-User-Id` / `X-Layer1-Role` ที่ gateway แนบมา

---

## Utility 🔴 บังคับใช้ ห้ามแปลงเอง

| ฟังก์ชัน | เข้า | ออก |
|---|---|---|
| `formatDate(v)` | `"2026-08-11"` | `11 ส.ค. 2569` |
| `formatDate(v, "long")` | | `11 สิงหาคม 2569` |
| `formatDate(v, "numeric")` | | `11/08/2569` |
| `formatDateTime(v)` | `"2026-08-11T09:30:00+07:00"` | `11 ส.ค. 2569 09:30 น.` |
| `formatTime(v)` | | `09:30 น.` |
| `formatRelative(v)` | | `3 ชั่วโมงที่แล้ว` (เกิน 7 วันคืนเป็นวันที่เต็ม) |
| `formatMoney(satang)` | `4850000` | `48,500.00 บาท` |
| `formatNumber(n)` | `2450` | `2,450` |
| `formatPhone(s)` | `"0812345678"` | `081-234-5678` |
| `formatFileSize(bytes)` | `1536000` | `1.5 MB` |
| `toIsoDate(be, m, d)` | `2569, 8, 11` | `"2026-08-11"` |
| `csmjuTitle({page, subsystem})` | | `รายการครุภัณฑ์ · ระบบครุภัณฑ์ · CSMJU` |

- แสดงผลเป็น **พ.ศ. เสมอ** · ส่งข้อมูลเป็น **ค.ศ. ISO 8601 เสมอ**
- timezone ตรึงที่ `Asia/Bangkok` เสมอ ไม่ใช้ของเครื่องผู้ใช้
- ค่าว่าง/ผิดรูปแบบ คืน `—` ไม่เคยแสดง `null` / `Invalid Date`
- `formatDate` และ `csmjuTitle` ไม่มี `"use client"` จึงเรียกใน Server Component และใน `export const metadata` ได้

---

## API

```tsx
const { data, meta, loading, fetching, error, refetch } = useApi<T>(path, { query, enabled });
const { mutate, loading, error, reset, data } = useMutation<TBody, TResult>(path, { method });
const data = await csmjuFetch<T>(path, options);              // นอก React
const env  = await csmjuFetchEnvelope<T>(path, options);      // เอา meta ด้วย
```

- `loading` เป็น `true` เมื่อโหลด **เกิน 300ms** แล้วเท่านั้น (§9.1 กันการกระพริบ) · ใช้ `fetching` ถ้าต้องรู้ทันที
- `error` เป็น `CsmjuErrorUi` ที่ map ตามตาราง §9.3 แล้ว: `{ code, presentation, message, field?, retryable, requestId? }`
- ส่ง `error` เข้า `<ErrorState>` หรือ `<DataTable error>` ได้ตรงๆ
- `error.field` (จาก `VALIDATION_ERROR`) เอาไปเลือกฟิลด์ที่จะแสดงข้อความและ focus
- 401 จัดการเองเงียบๆ: refresh → retry 1 ครั้ง → ถ้าไม่สำเร็จส่งไปหน้า login ของ Core
- token อยู่ใน httpOnly cookie ทุก request ส่ง `credentials: "include"` — 🔴 ห้ามอ่าน/เก็บ token เอง

### ตาราง error → UI (จัดการให้แล้ว)
| code | presentation | สิ่งที่ผู้ใช้เห็น |
|---|---|---|
| `UNAUTHORIZED` | `silent` | ไม่เห็นอะไร (AppShell refresh/redirect ให้) |
| `FORBIDDEN` | `forbidden` | การ์ด "ไม่มีสิทธิ์" + ปุ่มกลับหน้าหลัก |
| `NOT_FOUND` | `empty` | EmptyState (ไม่ใช่ error สีแดง) |
| `VALIDATION_ERROR` | `field` | `error.message` ของ backend ใต้ฟิลด์ที่ `details.field` ระบุ |
| `CONFLICT` | `alert` | Alert อธิบายความขัดแย้ง |
| `INTERNAL_ERROR` | `error-state` | ErrorState + ปุ่มลองอีกครั้ง + รหัสอ้างอิง |
| `NETWORK_ERROR` / `TIMEOUT` / `RATE_LIMIT` | `alert` | Alert + ปุ่มลองใหม่ |

---

## ไอคอน

```tsx
import { Package, Pencil, Trash2 } from "@csmju2030/design-system/icons";

<Package size={20} aria-hidden="true" />                    // ประกอบข้อความ
<IconButton label="ลบครุภัณฑ์ ..." icon={<Trash2 size={18} />} />   // ไอคอนล้วน
```

Lucide เท่านั้น · ขนาด 16/20/24 · import ทีละตัวเสมอเพื่อให้ tree-shaking ทำงาน
ชื่อไอคอนที่ใช้ใน prop `nav` ของ AppShell ดูได้จาก `NAV_ICONS`
