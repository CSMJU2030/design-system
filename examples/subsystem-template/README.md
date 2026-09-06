# ตัวอย่างระบบย่อย — ฝั่ง `frontend/`

โฟลเดอร์นี้คือ **หน้าตาที่ถูกต้อง** ของฝั่ง `frontend/` ในระบบย่อย 1 ระบบ
ผ่านครบทั้ง `pnpm build` · `pnpm lint` · `pnpm typecheck` · `csmju-ui-lint` จริง

โครงตรงกับที่ `new-subsystem.sh` ของ `csmju2030-standards` สร้างให้ (frontend + backend + pnpm workspace)

```
csmju-<ชื่อระบบ>/
├── subsystem.yaml
├── .standards-version
├── pnpm-workspace.yaml
├── standards/            ← git submodule (มาจาก new-subsystem.sh)
├── .github/workflows/ci.yml   ← 🔴 ห้ามแก้ (GH-03)
├── frontend/             ← ส่วนนี้คือสิ่งที่โฟลเดอร์ตัวอย่างนี้เตรียมให้
└── backend/              ← NestJS (นอกขอบเขตของ design system)
```

---

## วิธีใช้

repo ระบบย่อยของคุณถูกสร้างจาก `new-subsystem.sh` มาแล้ว และมี `frontend/src/.gitkeep` ว่างอยู่
ให้คัดลอกเฉพาะฝั่ง frontend ทับลงไป

```bash
git clone https://github.com/CSMJU2030/design-system.git /tmp/ds

cd csmju-<ชื่อระบบ>
cp -r /tmp/ds/examples/subsystem-template/frontend/.  frontend/
cp .env.example .env.local        # แก้ค่าให้ตรงระบบของตัวเอง

pnpm install
pnpm --filter frontend dev
```

> 🔴 ใช้ **pnpm เท่านั้น** — QA-05 จะตีตกทันทีถ้าเจอ `package-lock.json` หรือ `yarn.lock`

---

## แก้ 4 จุดให้เป็นระบบของตัวเอง

| ไฟล์ | แก้อะไร |
|---|---|
| `subsystem.yaml` | `name` · `display_name` · `owners` · บล็อก `ui:` (`design_system_version`, `nav`) |
| `frontend/src/app/layout.tsx` | `subsystemName` · `displayName` · `nav` |
| `frontend/src/app/page.tsx` | เนื้อหาหน้าภาพรวมของระบบตัวเอง |
| `frontend/src/app/equipment-items/` | เปลี่ยนเป็นทรัพยากรของระบบตัวเอง (ชื่อโฟลเดอร์ = kebab-case ตรงกับ path ของ API ตาม API-02) |

## สิ่งที่ต้อง **ไม่** แก้

- `frontend/src/app/globals.css` — import ของ design system เท่านั้น (UI-01/UI-02 จะตีตกถ้าเพิ่มสี/ระยะห่างเอง)
- `frontend/tailwind.config.ts` — ใช้ preset ของส่วนกลาง ห้ามเพิ่ม `colors`/`spacing` เอง
- โครง `loading.tsx` / `error.tsx` / `not-found.tsx` — ต้องมีครบทุก route segment
- `<CsmjuAppShell>` ใน `layout.tsx` — เรียกที่นี่ที่เดียว ห้ามเรียกซ้ำในหน้าลูก
- `.github/workflows/ci.yml` ของ repo — 🔴 GH-03 ห้ามแก้เด็ดขาด

---

## จุดที่ตัวอย่างนี้สาธิตไว้ครบ

| ไฟล์ | สาธิตอะไร |
|---|---|
| `src/app/layout.tsx` | Server Component ราก + `<CsmjuAppShell>` + `lang="th"` |
| `src/app/page.tsx` | `metadata` ผ่าน `csmjuTitle()` · `StatCard` + `tabular-nums` · utility class จาก preset |
| `src/app/equipment-items/page.tsx` | Server Component บางๆ + `dynamic = "force-dynamic"` (หน้ามีข้อมูลส่วนบุคคล) |
| `src/app/equipment-items/ItemsClient.tsx` | `DataTable` ครบ 4 สถานะ (แยก empty กับ no-results) · `Modal` + `FormField` · `ConfirmDialog` ที่ระบุชื่อของที่จะลบ · `useToast` · `<Can>` ตามสิทธิ์ · `formatMoney`/`formatDate` · `IconButton` ที่มี `aria-label` ระบุชื่อรายการ · ตาราง map สถานะเป็นคำไทยมาตรฐาน |
| `loading.tsx` / `error.tsx` / `not-found.tsx` | 3 สถานะบังคับตาม §16.1.1 |

---

## ตรวจก่อนเปิด PR

```bash
pnpm --filter frontend lint:ui     # csmju-ui-lint — ชั้นหน้าจอ
./standards/scripts/run-all-checks.sh .   # compliance gate กลางทั้ง 8 job
```
