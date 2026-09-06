# ตัวอย่างระบบย่อย — csmju-equipment (web)

โฟลเดอร์นี้คือ **หน้าตาที่ถูกต้อง** ของฝั่ง `web/` ในระบบย่อย 1 ระบบ
ทุกอย่างในนี้ผ่าน `csmju-ui-lint` และ `next build` จริง — ลอกไปเริ่มงานได้เลย

```bash
cp -r examples/subsystem-template  ../csmju-<ชื่อระบบ>/web
cd ../csmju-<ชื่อระบบ>/web
cp .env.example .env.local     # แก้ค่าให้ตรงระบบของตัวเอง
npm install
npm run dev
```

## สิ่งที่ต้องแก้หลังลอกไป

| ไฟล์ | แก้อะไร |
|---|---|
| `subsystem.yaml` | `name`, `display_name`, `owner`, `ui.nav` |
| `src/app/layout.tsx` | `subsystemName`, `displayName`, `nav` |
| `src/app/page.tsx` | เนื้อหาหน้าภาพรวมของระบบตัวเอง |
| `src/app/equipment-items/` | เปลี่ยนเป็นทรัพยากรของระบบตัวเอง (ชื่อโฟลเดอร์ = kebab-case ตรงกับ path ของ API) |
| `.env.local` | `NEXT_PUBLIC_CSMJU_CORE_URL`, `NEXT_PUBLIC_API_BASE_URL` |

## สิ่งที่ต้อง **ไม่** แก้

- `src/app/globals.css` — import ของ design system เท่านั้น ห้ามเพิ่ม token/สีเอง
- โครง `loading.tsx` / `error.tsx` / `not-found.tsx` — ต้องมีครบทุก route segment
- `<CsmjuAppShell>` ใน `layout.tsx` — เรียกที่นี่ที่เดียว ห้ามเรียกซ้ำในหน้าลูก

## จุดที่ตัวอย่างนี้สาธิตไว้ให้ครบ

- `page.tsx` — Server Component + `metadata` ผ่าน `csmjuTitle()` (§11.4)
- `equipment-items/page.tsx` — Server Component บางๆ ที่ห่อ Client Component (§16.1.1)
- `ItemsClient.tsx` — `DataTable` ครบ 4 สถานะ · `Modal` + `FormField` · `ConfirmDialog` ที่ระบุชื่อของที่จะลบ · `useToast` · `<Can>` ตามสิทธิ์ · `formatMoney`/`formatDate`
- `IconButton` ทุกตัวมี `aria-label` ที่ระบุชื่อรายการ (§19.1 ข้อ 7)
