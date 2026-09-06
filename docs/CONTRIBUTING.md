# CONTRIBUTING — สำหรับคนที่จะแก้ตัว design system เอง

> ผู้ที่มีสิทธิ์ merge: **PM1 (Design System & Frontend Experience)** เท่านั้น
> AIE/PL ที่ต้องการของใหม่ ให้เปิด issue `component-request` แทน (§17.4)

---

## ตั้งเครื่อง

```bash
git clone https://github.com/CSMJU2030/design-system.git
cd design-system
npm install
npm run build
```

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | tsup → `dist/` (ESM + `.d.ts`) แล้วคัดลอก CSS + CLI |
| `npm run dev` | build แบบ watch |
| `npm run lint:self` | `csmju-ui-lint` ตรวจซอร์สของตัวเอง |

---

## กฎการเขียน component ในนี้

1. **ทุกค่าต้องมาจาก token** — ห้ามมี hex/px ดิบนอก `src/styles/tokens.css`
2. **สไตล์เป็น plain CSS ใน `src/styles/components.css`** ตั้งชื่อคลาส `csmju-<component>` / `csmju-<component>__<part>` / `csmju-<component>--<variant>`
   ห้ามใช้ Tailwind class ข้างใน package (Tailwind v4 ไม่สแกน `node_modules`)
3. **`"use client"` ใส่เฉพาะไฟล์ที่ต้องใช้จริง** — ไฟล์ที่เป็นฟังก์ชันล้วน (`lib/format.ts`, `lib/metadata.ts`) **ห้ามใส่** ไม่งั้น Server Component เรียกไม่ได้
4. **ห้ามใส่ `margin` ในตัว component** — ให้ parent จัดระยะ (§7.3.4)
5. **ทุก component ที่โต้ตอบได้ต้องมี** `hover` `active` `focus-visible` `disabled` และรองรับ `ref` + props ของ HTML element เดิม
6. **บังคับความถูกต้องด้วย type เมื่อทำได้** — เช่น `DataTable` ทำให้ prop `empty` เป็น required เพื่อให้ลืม empty state ไม่ได้ ดีกว่าเขียนเตือนไว้ในเอกสาร
7. **คอมเมนต์อธิบาย "ทำไม" พร้อมอ้างข้อในเอกสาร** — คนอ่านโค้ดนี้คือ AIE ที่กำลังสงสัยว่าทำไมทำแบบนั้นไม่ได้

---

## เพิ่ม component ใหม่

1. `src/components/<กลุ่ม>/<Name>.tsx` — พร้อม JSDoc ที่อ้างข้อในเอกสาร
2. สไตล์ต่อท้าย `src/styles/components.css` ในส่วนของกลุ่มนั้น
3. export ที่ `src/index.ts` (export type ด้วยเสมอ)
4. ใช้งานจริงใน `examples/subsystem-template` อย่างน้อย 1 จุด
5. เพิ่มในตาราง `docs/COMPONENTS.md` และในรายการ component ของ `docs/AI-PROMPT.md`
6. `npm run typecheck && npm run build && npm run lint:self`
7. อัปเดต `CHANGELOG.md`

> ข้อ 5 สำคัญกว่าที่คิด — ถ้า component ใหม่ไม่อยู่ใน `AI-PROMPT.md`
> AI ของ AIE 37 คนจะไม่รู้ว่ามีอยู่ แล้วเขียนขึ้นมาเองซ้ำ

---

## เพิ่มกฎใน `csmju-ui-lint`

แก้ที่ `tools/csmju-ui-lint.mjs`

- กฎระดับบรรทัด → เพิ่มใน `CODE_RULES`
- กฎระดับโครงสร้าง → เพิ่มฟังก์ชันแล้วเรียกใน `lintProject()`
- **ทุกกฎต้องมี `hint` ที่บอกวิธีแก้และเลขข้อในเอกสาร** — ข้อความว่า "ผิดกฎ" เฉยๆ ทำให้คนแก้ไม่ถูก
- **ทดสอบทั้ง 2 ทาง:** ต้องจับได้กับโค้ดที่ผิด และต้องไม่ฟ้องกับ `examples/subsystem-template`
- กฎใหม่ที่จะทำให้ repo เดิมแดง → ปล่อยเป็น `SEV.WARN` ก่อน 1 minor แล้วค่อยยกเป็น `SEV.ERROR`

---

## ปล่อยเวอร์ชัน

```bash
# 1. อัปเดต version ใน package.json + CSMJU_DESIGN_SYSTEM_VERSION ใน src/index.ts
# 2. อัปเดต CHANGELOG.md
# 3. commit แล้ว tag
git tag v1.3.0 && git push origin v1.3.0     # GitHub Actions publish ให้เอง
# 4. ประกาศใน #ds-announce พร้อมสรุปว่าระบบย่อยต้องทำอะไร
```

MAJOR ต้องประกาศล่วงหน้า ≥ 2 สัปดาห์ + migration guide + ของเดิม deprecated อย่างน้อย 1 minor cycle (§17.5)
