# QUICKSTART — สำหรับ AIE ที่กำลังจะเริ่มระบบย่อยของตัวเอง

อ่าน 10 นาที ทำตาม 30 นาที แล้วคุณจะมีระบบย่อยที่ผ่าน CI ตั้งแต่ commit แรก

> ก่อนอื่น: อ่าน **ข้อ 0 (10 กฎเหล็ก)** ใน [`ui-design-system.md`](ui-design-system.md) ให้จบก่อน — ยาว 1 หน้า

---

## 0. ตั้งค่าเครื่องครั้งเดียว

`@csmju2030/design-system` อยู่บน GitHub Packages ของ org ไม่ใช่ npm สาธารณะ

```bash
# ~/.npmrc
@csmju2030:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<GitHub Personal Access Token ที่มีสิทธิ์ read:packages>
```

สร้าง token ที่ GitHub → Settings → Developer settings → Personal access tokens → **read:packages** อย่างเดียวพอ
🔴 **ห้าม commit token ลง repo** — ใส่ใน `~/.npmrc` ของเครื่องตัวเองเท่านั้น

---

## 1. เริ่มโปรเจกต์

**ห้ามเริ่มจาก `create-next-app` เปล่าๆ** — จะขาด config ที่ CI ตรวจ (§20.4 ข้อ 0)

```bash
git clone https://github.com/CSMJU2030/design-system.git /tmp/ds
mkdir -p csmju-<ชื่อระบบ>
cp -r /tmp/ds/examples/subsystem-template  csmju-<ชื่อระบบ>/web
cp /tmp/ds/templates/ui-compliance.yml     csmju-<ชื่อระบบ>/.github/workflows/
cd csmju-<ชื่อระบบ>/web
cp .env.example .env.local
npm install
npm run dev
```

โครงที่ได้ (ตาม §16.1):

```
csmju-<ชื่อระบบ>/
├── subsystem.yaml              # 🔴 manifest
├── .github/workflows/ui-compliance.yml
├── web/                        # Next.js  ← โฟลเดอร์นี้
└── api/                        # NestJS   ← ทำทีหลัง
```

---

## 2. แก้ 5 จุดให้เป็นระบบของตัวเอง

| ไฟล์ | แก้ |
|---|---|
| `subsystem.yaml` | `name` · `display_name` · `owner` · `ui.nav` |
| `src/app/layout.tsx` | `subsystemName` · `displayName` · `nav` |
| `src/app/page.tsx` | เนื้อหาหน้าภาพรวม |
| `src/app/equipment-items/` | เปลี่ยนชื่อโฟลเดอร์เป็นทรัพยากรของระบบตัวเอง (kebab-case ตรงกับ path ของ API) |
| `.env.local` | `NEXT_PUBLIC_CSMJU_CORE_URL` · `NEXT_PUBLIC_API_BASE_URL` |

---

## 3. เขียนหน้าจอแรก

### 3.1 หน้า list — โครงที่ใช้ซ้ำได้ทุกระบบ

```tsx
// src/app/equipment-items/page.tsx  (Server Component)
import { csmjuTitle } from "@csmju2030/design-system";
import { ItemsClient } from "./ItemsClient";

export const metadata = { title: csmjuTitle({ page: "รายการครุภัณฑ์", subsystem: "ระบบครุภัณฑ์" }) };
export const dynamic = "force-dynamic";   // 🔴 หน้าที่มีข้อมูลส่วนบุคคลห้าม cache

export default function Page() {
  return <ItemsClient />;
}
```

```tsx
// src/app/equipment-items/ItemsClient.tsx
"use client";
import { useState } from "react";
import { Button, DataTable, PageHeader, Stack, StatusDot, useApi, formatMoney, formatDate } from "@csmju2030/design-system";

interface Item { id: string; asset_code: string; name: string; price_satang: number; acquired_at: string; }

export function ItemsClient() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  // useApi map error.code เป็น UI ให้แล้ว และหน่วง skeleton 300ms ให้ตาม §9.1
  const { data, meta, loading, error, refetch } = useApi<Item[]>("/api/v1/equipment-items", {
    query: { page, per_page: 20, q },
  });

  return (
    <Stack>
      <PageHeader
        title="รายการครุภัณฑ์"
        description="ค้นหาและจัดการครุภัณฑ์ของภาควิชา"
        actions={<Button variant="primary">เพิ่มครุภัณฑ์</Button>}
      />
      <DataTable<Item>
        caption="รายการครุภัณฑ์ทั้งหมด"
        rows={data ?? []}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={refetch}
        search={{ value: q, onChange: setQ }}
        pagination={{ page, total: meta?.total ?? 0, onPageChange: setPage }}
        empty={{
          title: "ยังไม่มีรายการครุภัณฑ์",
          description: "เริ่มต้นด้วยการเพิ่มครุภัณฑ์ชิ้นแรกของภาควิชา",
          action: <Button variant="primary">เพิ่มครุภัณฑ์</Button>,
        }}
        emptyFiltered={{
          title: "ไม่พบครุภัณฑ์ที่ค้นหา",
          description: "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง",
          action: <Button variant="secondary" onClick={() => setQ("")}>ล้างตัวกรอง</Button>,
        }}
        columns={[
          { key: "asset_code", header: "รหัสครุภัณฑ์", sortable: true, render: (r) => r.asset_code },
          { key: "name", header: "ชื่อ", render: (r) => r.name },
          { key: "price_satang", header: "ราคา", align: "numeric", render: (r) => formatMoney(r.price_satang) },
          { key: "acquired_at", header: "วันที่ได้มา", align: "numeric", render: (r) => formatDate(r.acquired_at) },
        ]}
      />
    </Stack>
  );
}
```

**สังเกตว่าคุณไม่ต้องเขียนเอง:** skeleton · empty state · error message · ปุ่มลองใหม่ · pagination · 401 refresh · โหมดการ์ดบนมือถือ

### 3.2 ฟอร์ม

```tsx
<FormField label="รหัสครุภัณฑ์" required hint="ตัวอย่าง: CS-PRJ-001" error={errors.asset_code}>
  {(props) => <TextInput {...props} value={code} onChange={(e) => setCode(e.target.value)} />}
</FormField>

<FormActions>
  <Button variant="primary" type="submit" loading={saving}>บันทึก</Button>
  <Button variant="ghost" onClick={cancel}>ยกเลิก</Button>
</FormActions>
```

`FormField` ผูก `label` / `aria-describedby` / `aria-invalid` / `aria-required` ให้ครบเอง
`errors.asset_code` มาจาก `error.details.field` ของ `VALIDATION_ERROR` ที่ NestJS ส่งมา

### 3.3 ลบข้อมูล

```tsx
<ConfirmDialog
  open={target !== null}
  onCancel={() => setTarget(null)}
  onConfirm={remove}
  title={`ลบครุภัณฑ์ "${target?.name}"?`}
  description="รายการนี้จะถูกลบถาวร ประวัติการยืมที่เกี่ยวข้อง 12 รายการจะยังคงอยู่"
  confirmLabel="ลบครุภัณฑ์"      /* 🔴 คำกริยาจริง ไม่ใช่ "ตกลง" */
/>
```

### 3.4 ปุ่มตามสิทธิ์

```tsx
{/* ไม่มีสิทธิ์เลย -> ซ่อน */}
<Can role={["admin", "editor"]}>
  <Button variant="primary">เพิ่มครุภัณฑ์</Button>
</Can>

{/* มีสิทธิ์แต่ทำไม่ได้ตอนนี้ -> disable + บอกเหตุผล (บังคับ) */}
<Button
  variant="secondary"
  disabled={item.status !== "available"}
  disabledReason="ครุภัณฑ์นี้ถูกยืมอยู่ กำหนดคืน 20 ส.ค. 2569"
>
  ยืมครุภัณฑ์
</Button>
```

---

## 4. ก่อนเปิด PR

```bash
npx csmju-ui-lint     # ต้องเขียว
npx next build        # ต้องไม่มี type error
```

แล้วไล่ checklist §18.2 ในเอกสารมาตรฐาน — 15 ข้อ ใช้เวลา 10 นาที

---

## 5. เจอปัญหาบ่อย

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| `useToast ต้องเรียกภายใน <CsmjuAppShell>` | เรียก hook นอก AppShell หรือมี AppShell ซ้อนกัน | เรียก `<CsmjuAppShell>` ที่ `app/layout.tsx` ที่เดียว |
| ฟอนต์ไทยเป็นฟอนต์ระบบ | ไม่ได้ `@import ".../styles.css"` | ใส่ใน `globals.css` |
| utility `bg-csmju-primary` ไม่ทำงาน | ลืม `@import ".../theme.css"` (Tailwind v4) | ใส่เพิ่ม หรือใช้ preset ถ้าเป็น v3 |
| ปีเป็น ค.ศ. | แปลงวันที่เอง | ใช้ `formatDate()` เท่านั้น |
| ราคาผิดไป 100 เท่า | ลืมว่า API ส่งเป็นสตางค์ | `formatMoney()` หารให้แล้ว อย่าหารซ้ำ |
| `csmju-ui-lint` ฟ้อง `missing-loading` | route segment ใหม่ยังไม่มี `loading.tsx` | คัดลอกจาก segment เดิม |

ยังติด → ถาม PL ของทีมก่อน · ถ้าเป็นเรื่องที่ design system ไม่มีของให้ใช้ → ทำตาม §17.4 (ขอ component ใหม่)
