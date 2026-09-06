# แผนกระจายงาน Design System ไปยัง AIE 37 คน

**สำหรับ:** PM1 (Design System & Frontend Experience) และ PL ทุกทีม
**สถานะ ณ วันที่เขียน:** 7 ก.ย. 2569 — package `@csmju2030/design-system@1.2.0` พร้อมใช้งานแล้ว

---

## 0. สถานะจริงของ org ณ วันที่เขียน (สำรวจแล้ว)

ก่อนอ่านแผน ต้องรู้ก่อนว่า **โครงสร้างส่วนกลางถูกวางไว้แล้ว** และแผนนี้ต่อยอดจากของเดิม ไม่ใช่เริ่มใหม่

| repo | มีอะไรแล้ว | ยังขาดอะไร |
|---|---|---|
| `csmju2030-standards` | ✅ เอกสาร 7 ฉบับ · `ci-compliance-spec.md` (35 กฎ) · `scripts/*.sh` 18 ตัว · reusable workflow 8 job · `templates/` · `org-settings/` ruleset · `new-subsystem.sh` · `VERSION` = **1.3.0** | ยังไม่มี check ฝั่ง design system (มีแค่ `check-ui-tokens.sh` ที่เป็น grep หา hex) |
| `design-system` | ⬅️ **งานนี้** — package + component + lint + template | ยัง publish ไม่ได้ (ดูข้อ 7) |
| `csmju-equipment` | ✅ โครง repo ครบ (`frontend/` `backend/` `standards/` submodule `pnpm-workspace.yaml` `subsystem.yaml` CI 6 บรรทัด) | `frontend/src/` ยังว่าง (มีแค่ `.gitkeep`) |
| `CSMJU2030-BE-Core_Hub` | ✅ โครงเดียวกับ subsystem | `frontend/src/` ยังว่างเช่นกัน |

**ข้อสรุปสำคัญ 3 ข้อ**

1. **ระบบบังคับกฎมีแล้วและ "แตะไม่ได้"** — `.github/workflows/ci.yml` ของทุกระบบย่อยยาว 6 บรรทัด
   เรียก reusable workflow ที่ pin ด้วย `@v1.3.0` และ GH-03 ห้ามระบบย่อยแก้ไฟล์นี้
   👉 **คุณเพิ่ม CI ให้ 37 repo เองไม่ได้** ต้องเพิ่ม script เข้า `csmju2030-standards` แล้ว bump tag
2. **stack จริงคือ pnpm workspace + `frontend/`/`backend/` + Tailwind v3** — ไม่ใช่ `web/`/`api/` + npm ตามที่ `ui-design-system.md` §16.1 เขียนไว้
   `allowed-deps.json` ไม่มี `@tailwindcss/postcss` ด้วย → Tailwind v4 จะโดน ARC-02 ตีตก
   👉 template และเอกสารในงานนี้ปรับให้ตรง **ของจริง** แล้ว และควรแก้ §16.1 ของเอกสารมาตรฐานให้ตรงกันด้วย
3. **`@csmju2030/design-system` อยู่ใน `allowed_frontend` แล้ว** — ระบบย่อยติดตั้งได้ทันทีที่ publish เสร็จ
   (`lucide-react` / `clsx` / `@fontsource/*` เป็น dependency ภายในของ package จึงไม่ถูก ARC-02 ตรวจ)

---

## 0.1 หลักคิดของแผนนี้

ปัญหาไม่ใช่ "37 คนไม่รู้มาตรฐาน" — เอกสารมี 1,300 บรรทัดและไม่มีใครอ่านจบทุกครั้งที่เขียนหน้าจอ
ปัญหาคือ **มาตรฐานที่ต้องอาศัยความจำและวินัยของคน 37 คน จะพังภายในสัปดาห์ที่สาม**

แผนนี้จึงย้ายมาตรฐานออกจากเอกสาร ไปอยู่ใน 4 ที่ที่บังคับตัวเอง:

| ชั้น | สิ่งที่บังคับ | ทำไมได้ผล |
|---|---|---|
| **1. Package** | สี ฟอนต์ ระยะห่าง component พฤติกรรม | ทำผิดไม่ได้เพราะไม่มีทางเลือกให้ทำผิด — `<Button>` มีแค่ 5 variant |
| **2. TypeScript** | 4 สถานะหน้าจอ, `label` ของ IconButton, `disabledReason` | ไม่ส่ง = **คอมไพล์ไม่ผ่าน** ไม่ต้องรอ reviewer |
| **3. CI** | compliance gate กลาง 35 กฎ (มีแล้ว) + `csmju-ui-lint` อีก 20 กฎฝั่งหน้าจอ | แดง = merge ไม่ได้ ไม่ต้องเถียงกันในคอมเมนต์ PR |
| **4. Template + AI prompt** | โครงไฟล์ที่ถูกตั้งแต่ commit แรก | คนไม่เริ่มจากศูนย์ = ไม่มีโอกาสเริ่มผิด |

**เอกสารเหลือหน้าที่เดียว: อธิบายว่า "ทำไม" เมื่อมีคนถาม** ไม่ใช่เป็นเครื่องมือบังคับ

---

## 1. ขอบเขตของคุณในฐานะ UX/UI + Frontend (PM1)

### คุณเป็นเจ้าของ 🔴
- `@csmju2030/design-system` — token, component, utility, การออกเวอร์ชัน
- `csmju-ui-lint` — กฎฝั่งหน้าจอ (`DS-01..20`) ที่ CI ตรวจ
- `examples/subsystem-template/frontend` — โครงเริ่มต้นของฝั่ง frontend
- `docs/ui-design-system.md` — มาตรฐานหน้าจอ
- การตัดสินคำขอ component/token ใหม่ (§17.4, SLA 3 วันทำการ)

### คุณ **ไม่ใช่** เจ้าของ
| เรื่อง | เจ้าของ | คุณต้องทำอะไร |
|---|---|---|
| flow login/logout, refresh token, header ที่ gateway แนบ | PM2 (`auth-contract.md`) | ยืนยันว่า AppShell เรียก endpoint ตรงตามสัญญา |
| รูปแบบ envelope, error code, pagination | PM3 (`api-conventions.md`) | ยืนยันว่า `useApi()` แกะ envelope ตรง |
| ชื่อฟิลด์, รูปแบบข้อมูลที่ส่ง | PM3 (`data-dictionary.md`) | ยืนยันว่า `formatDate/formatMoney` แปลงถูก |
| Core hub, dashboard, การมอบสิทธิ์ระบบย่อย | ทีม core | ส่ง URL ของ Core มาให้ตั้งใน `NEXT_PUBLIC_CSMJU_CORE_URL` |
| CI, branch protection, CODEOWNERS, ruleset, `new-subsystem.sh` | DevOps / เจ้าของ `csmju2030-standards` | ส่ง `check-ui-designsystem.sh` ให้เขา merge แล้ว bump tag |
| business logic ของ 37 ระบบ | AIE แต่ละคน | ไม่ต้องยุ่ง |

> 🔴 **ข้อตกลง 3 อย่างที่ต้องเคาะกับ PM2/PM3 ให้จบก่อนกระจายงาน** (ดูข้อ 6 — เป็นความเสี่ยงอันดับ 1 ของแผนนี้)

---

## 2. โครงสร้างคน

```
PM1 (คุณ) — design system
   │
   ├── PL ทีม 1 ──── AIE ×4   ระบบ 1-4
   ├── PL ทีม 2 ──── AIE ×4   ระบบ 5-8
   ├── ...
   └── PL ทีม 10 ─── AIE ×3   ระบบ 35-37
```

**37 คน ÷ 3–4 คน/ทีม = 10 ทีม → คุณคุย PL 10 คน ไม่ใช่ AIE 37 คน**

🔴 กฎเหล็กของการกระจายงาน: **AIE ห้ามถามคุณตรง** ต้องผ่าน PL เสมอ
ไม่งั้นคุณจะกลายเป็นคอขวดและไม่มีเวลาทำ design system เอง

ยกเว้น 1 กรณี: **Office hours** (ข้อ 4) ที่เปิดให้ทุกคนเข้าได้

---

## 3. ไทม์ไลน์ 6 สัปดาห์

### สัปดาห์ 0 — ก่อนเปิดตัว (คุณทำคนเดียว)
- [x] `@csmju2030/design-system@1.2.0` — token + component 50 ตัว + utility
- [x] `csmju-ui-lint` — กฎ `DS-01..20` + ทวน `UI/SEC/ARC` ทดสอบแล้วจับได้ 21 error กับโปรเจกต์ที่ผิด และเขียวกับ template
- [x] `examples/subsystem-template/frontend` — pnpm + Tailwind v3 + `frontend/` ผ่าน `build` `lint` `typecheck` `csmju-ui-lint` จริง
- [x] `templates/check-ui-designsystem.sh` — script สำหรับต่อเข้า CI กลาง
- [x] เอกสาร: QUICKSTART · COMPONENTS · AI-PROMPT
- [ ] 🔴 **ขอสิทธิ์ write บน `CSMJU2030/design-system`** — ตอนนี้บัญชีมีแค่สิทธิ์อ่าน จึง push ไม่ได้
- [ ] **publish package ขึ้น GitHub Packages** (tag `v1.2.0` → workflow `release.yml` ทำให้เอง)
- [ ] ส่ง PR เข้า `csmju2030-standards`: เพิ่ม `scripts/check-ui-designsystem.sh` + step ใน job `ui-token-compliance` + bump `VERSION` เป็น 1.4.0
- [ ] เสนอแก้ `ui-design-system.md` §16.1 ให้เป็น `frontend/`+`backend/` + pnpm (ตอนนี้เขียน `web/`+`api/` ซึ่งไม่ตรงกับ `new-subsystem.sh`)
- [ ] เคาะข้อตกลงกับ PM2/PM3 (ข้อ 6)

### สัปดาห์ 1 — อบรม PL 10 คน (ไม่ใช่ 37 คน)
| | |
|---|---|
| **รูปแบบ** | 1 ครั้ง 90 นาที ออนไลน์ อัดวิดีโอไว้ |
| **เนื้อหา** | 10 กฎเหล็ก (15 น.) · live coding หน้า list จาก template (30 น.) · `csmju-ui-lint` (15 น.) · review gate G0–G4 (20 น.) · Q&A (10 น.) |
| **ส่งการบ้าน** | PL แต่ละคนสร้าง 1 หน้าจากระบบตัวเอง ผ่าน lint แล้วส่งลิงก์ PR |
| **เกณฑ์ผ่าน** | PL ทำได้เอง = พร้อมสอนทีมตัวเอง / ทำไม่ได้ = ต้องนัดเพิ่มก่อนไปสัปดาห์ 2 |

> **ทำไมสอน PL ก่อน:** ถ้าสอน 37 คนพร้อมกัน คุณจะได้คำถามซ้ำ 37 รอบ
> สอน PL 10 คนให้แม่น แล้วให้ PL สอนทีมตัวเอง = คำถาม 90% ถูกตอบในทีมโดยไม่ถึงคุณ

### สัปดาห์ 2 — AIE ทุกคนตั้งโปรเจกต์ + ส่ง G0
PL พาทีมทำพร้อมกันในนัดเดียว 2 ชั่วโมง:
1. ตั้ง `~/.npmrc` + PAT (read:packages)
2. `git submodule update --init --remote standards/`
3. `cp -r examples/subsystem-template/frontend/.  frontend/`
4. แก้ 4 จุดใน QUICKSTART ข้อ 2
5. `pnpm install && pnpm --filter frontend dev` เห็นหน้าแรกของตัวเอง
6. commit ตาม Conventional Commits + push branch `feature/<subsystem>/<เรื่อง>` + CI เขียว

**ส่ง G0 (Scoping):** รายการหน้าจอทั้งหมด + user flow หลัก + ใครเห็นอะไร (Layer 2 mapping)
PL อนุมัติ

> ✅ **เกณฑ์วัดผลสัปดาห์นี้: 37/37 repo มี CI เขียว** — ถ้าน้อยกว่า 33 แปลว่าขั้นตอนติดตั้งมีปัญหา ต้องแก้ที่ template ไม่ใช่ไล่ตามรายคน

### สัปดาห์ 3 — G1 Wireframe
โครงหน้าจอหลัก 3 หน้า ทั้ง desktop + mobile (วาดมือ/Figma/HTML ก็ได้) → PL อนุมัติ
**คุณเข้ามาดูเฉพาะ:** ระบบที่ PL ทำเครื่องหมายว่า "ไม่แน่ใจว่าใช้ pattern ไหน"

### สัปดาห์ 4–5 — ลงมือ + G2 Token compliance
PR แรกของทุกคน + CI เขียว → PL + CI อนุมัติ
**คุณเข้ามาดู:** รายงาน `csmju-ui-lint` รวมทุก repo (ข้อ 5) เพื่อดูว่ากฎข้อไหนคนติดเยอะที่สุด

### สัปดาห์ 6 — G3 A11y & Responsive
Lighthouse + axe + ภาพหน้าจอ 360/768/1280 → PL อนุมัติ

**G4 Sign-off** ก่อนขึ้น production → PL + PM

---

## 4. ช่องทางสื่อสาร (ตั้งให้ครบก่อนสัปดาห์ 1)

| ช่องทาง | ใคร | ใช้ทำอะไร | SLA |
|---|---|---|---|
| `#ds-announce` | PM1 → ทุกคน (อ่านอย่างเดียว) | ประกาศเวอร์ชันใหม่ + breaking change | — |
| `#ds-help` | AIE ↔ AIE ↔ PL | ถามกันเอง คนที่ 5 ที่เจอปัญหาเดิมจะได้ค้นเจอ | ตอบกันเอง |
| `#pl-sync` | PM1 ↔ PL 10 คน | ปัญหาที่ทีมแก้เองไม่ได้ | PM1 ตอบใน 1 วันทำการ |
| GitHub Issue `component-request` | PL → PM1 | ขอ component/token ใหม่ (§17.4) | **3 วันทำการ** |
| **Office hours** | เปิดให้ทุกคน | ทุกวันอังคาร 16:00–17:00 น. เข้ามาแชร์จอถามได้เลย | สัปดาห์ละครั้ง |

> **Office hours สำคัญกว่าที่คิด:** มันเป็นวาล์วระบายที่ทำให้กฎ "ห้ามถาม PM ตรง" อยู่ได้
> และเป็นที่ที่คุณจะเห็นว่า AIE ติดอะไรจริงๆ ซึ่งมักไม่ตรงกับที่คุณคิด

---

## 5. วิธีดูว่า 37 ระบบยังเป็นแอปเดียวกันอยู่ไหม

### 5.1 ตัวเลขที่ดูทุกสัปดาห์
| ตัวชี้วัด | เป้า | ดูจาก |
|---|---|---|
| repo ที่ CI เขียว | 37/37 | GitHub org dashboard |
| repo ที่ `standards_version` ตรงกับเวอร์ชันล่าสุด | ≥ 34/37 | `csmju-ui-lint` รายงาน |
| จำนวน `csmju-ui-lint` error รวมทุก repo | ลดลงทุกสัปดาห์ | สคริปต์ข้อ 5.2 |
| คำขอ component ใหม่ที่ค้างเกิน SLA | 0 | GitHub Issue |
| Lighthouse A11y เฉลี่ย | ≥ 95 | CI artifact |

### 5.2 สคริปต์ตรวจข้ามทุก repo (รันสัปดาห์ละครั้ง)
```bash
#!/usr/bin/env bash
# ต้องมี gh CLI + node และสิทธิ์อ่าน repo ของ org
set -euo pipefail
mkdir -p /tmp/csmju-audit && cd /tmp/csmju-audit

gh repo list CSMJU2030 --limit 100 --json name -q '.[].name' | grep '^csmju-' | while read -r repo; do
  [ -d "$repo" ] || gh repo clone "CSMJU2030/$repo" -- --depth 1 -q
  ( cd "$repo" && git pull -q 2>/dev/null || true
    RESULT=$(npx --yes @csmju2030/design-system csmju-ui-lint --json 2>/dev/null || echo '{}')
    node -e "
      const r = JSON.parse(process.argv[1] || '{}');
      console.log(JSON.stringify({ repo: process.argv[2], errors: r.errors ?? null, warnings: r.warnings ?? null }));
    " "$RESULT" "$repo"
  )
done | tee audit.jsonl

# จัดอันดับ repo ที่ error เยอะสุด
sort -t: -k2 -rn audit.jsonl | head -10
```
เอา `audit.jsonl` มาทำตารางจัดอันดับ แล้วส่งให้ PL ดูเฉพาะทีมตัวเอง

### 5.3 การตรวจด้วยตา (สิ่งที่เครื่องตรวจแทนไม่ได้)
เดือนละครั้ง **เปิด 3 ระบบย่อยที่สุ่มมา แล้วทำงาน 1 อย่างให้จบในแต่ละระบบ**
ถ้ารู้สึก "สะดุด" ตอนข้ามระบบ → เรื่องนั้นคือช่องโหว่ของมาตรฐาน ให้เพิ่มเป็นกฎหรือเป็น component

---

## 6. ความเสี่ยง 5 ข้อและวิธีรับมือ

| # | ความเสี่ยง | สัญญาณเตือน | วิธีรับมือ |
|---|---|---|---|
| 1 | **สัญญากับ PM2/PM3 ยังไม่นิ่ง** แล้ว `useApi`/AppShell ผิดทั้ง 37 ระบบพร้อมกัน | ยังไม่มีเอกสาร `auth-contract.md` §6 และ `api-conventions.md` §4 เวอร์ชันสุดท้าย | 🔴 **เคาะ 3 ข้อนี้ให้จบก่อนสัปดาห์ 1:** (ก) endpoint refresh token ที่แน่นอน (ตอนนี้สมมติเป็น `POST {CORE}/api/v1/auth/refresh`) (ข) endpoint ข้อมูลผู้ใช้ (สมมติ `GET {API}/api/v1/me`) (ค) รูปร่าง `meta` ของ pagination (`total`, `total_pages`) — ทั้งหมดอยู่ที่เดียวใน package แก้ครั้งเดียวจบ แต่ต้องแก้ **ก่อน** คน 37 คนเริ่ม |
| 2 | AIE fork design system (copy component มาแก้ใน repo ตัวเอง) | มีโฟลเดอร์ `components/ui/` หรือไฟล์ชื่อ `Button.tsx` ในระบบย่อย | เพิ่มกฎใน `csmju-ui-lint` ให้ fail ทันทีเมื่อเจอ · แต่รากของปัญหาคือ SLA คำขอ component ช้า → **รักษา SLA 3 วันให้ได้จริง** |
| 3 | คน 37 คนอัปเดตเวอร์ชันไม่พร้อมกัน | `standards_version` กระจายหลายค่า | `csmju-ui-lint` เตือนเมื่อตามหลัง > 1 minor และ fail เมื่อ > 1 major อยู่แล้ว · ออก **MINOR เท่านั้น** ในช่วง 6 สัปดาห์แรก ห้ามออก MAJOR |
| 4 | AI ของแต่ละคนเขียนโค้ดที่ผ่าน lint แต่ UX แย่ (เช่น empty state ที่ไม่มีทางออก) | PL รีวิวแล้วรู้สึกแปลกแต่บอกไม่ถูก | G1 Wireframe คือด่านนี้ · และการตรวจด้วยตาข้อ 5.3 |
| 5 | คุณกลายเป็นคอขวด | `#ds-help` เงียบ แต่ DM หาคุณเยอะ | บังคับกฎ "AIE ห้ามถาม PM ตรง" · ทุกคำถามที่ตอบใน DM ให้ **ย้ายไปตอบใน `#ds-help`** เพื่อให้คนที่ 2 ค้นเจอ |

---

## 7. เช็กลิสต์ของคุณ 7 วันข้างหน้า

- [ ] 🔴 **ขอสิทธิ์ write บน `CSMJU2030/design-system`** — ต้องทำก่อนทุกข้อ ตอนนี้ push ไม่ได้
- [ ] **publish package** — สร้าง release tag `v1.2.0` → workflow `release.yml` publish ขึ้น GitHub Packages ให้เอง
- [ ] ทดสอบ `pnpm add @csmju2030/design-system` จากเครื่องอื่นที่ไม่ใช่เครื่องคุณ (ยืนยันว่า PAT + registry ใช้ได้จริง)
- [ ] ส่ง PR เข้า `csmju2030-standards` (script + step + bump VERSION) — ถ้าไม่ทำข้อนี้ `DS-xx` จะเป็นแค่เครื่องมือที่ AIE ต้องรันเอง ไม่ใช่กฎที่บังคับได้
- [ ] เคาะ 3 ข้อตกลงในความเสี่ยงข้อ 1 กับ PM2/PM3 — **ข้อนี้สำคัญที่สุด**
- [ ] ตั้งช่องทางสื่อสาร 5 ช่องในข้อ 4
- [ ] นัดอบรม PL 10 คน (90 นาที) พร้อมส่ง QUICKSTART ให้อ่านล่วงหน้า
- [ ] เตรียม slide จาก §0 (10 กฎเหล็ก) + §19.1 (วิเคราะห์ mockup เดิม) — 2 ส่วนนี้เป็นเนื้อพรีเซนต์ที่ดีที่สุดในเอกสาร
- [ ] เปิด GitHub Issue template `component-request` และประกาศ SLA 3 วันทำการ

---

## 8. ประโยคที่ใช้ตอบเวลาถูกถามในที่ประชุม

> **"ทำไมต้องล็อกขนาดนี้ ไม่ให้อิสระเลยเหรอ"**
> ล็อกเฉพาะสิ่งที่ผู้ใช้คนเดียวกันรู้สึกได้ตอนข้ามระบบ — สี ฟอนต์ ระยะห่าง โครงหน้า ข้อความ สถานะ
> ส่วนจะมีกี่หน้า จัดเรียงข้อมูลยังไง ใช้ chart แบบไหน state management ตัวไหน อิสระเต็มที่
> เกณฑ์ตัดสินคือ: ถ้าผู้ใช้ 1 คนเปิด 3 ระบบในวันเดียวแล้ว "รู้สึกสะดุด" เรื่องนั้นต้องล็อก

> **"37 คนใช้ AI คนละตัว จะคุมได้จริงเหรอ"**
> เราไม่ได้คุมคน เราคุมเครื่องมือ — component มีให้เลือกแค่ที่มี, TypeScript ไม่ยอมคอมไพล์ถ้าขาด empty state,
> CI แดงถ้ามี hex สีดิบ AI ยี่ห้อไหนก็ต้องผ่านด่านเดียวกัน

> **"mockup ที่ทำไว้สวยแล้วนี่ ใช้เลยไม่ได้เหรอ"**
> mockup สวยแล้ว แต่ยังไม่ใช่ระบบ — สิ่งที่ทำให้ 37 ระบบเป็นแอปเดียวกันคือกฎ ไม่ใช่ภาพ
> (ประเด็นที่ต้องแก้ 7 ข้ออยู่ใน §19.1 ของเอกสารมาตรฐาน)
