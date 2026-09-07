#!/usr/bin/env bash
# check-ui-designsystem.sh — ส่วนขยายฝั่งหน้าจอของ compliance gate
#
# วิธีติดตั้ง (ทำที่ repo csmju2030-standards ครั้งเดียว):
#   1. คัดลอกไฟล์นี้ไปที่ scripts/check-ui-designsystem.sh
#   2. เพิ่ม step ต่อท้าย job `ui-token-compliance` ใน
#      .github/workflows/subsystem-compliance.yml:
#
#        - name: Design system compliance (DS-xx)
#          if: always() && steps.tools.outcome == 'success'
#          run: bash .compliance-tools/scripts/check-ui-designsystem.sh .
#
#   3. bump VERSION แล้ว tag ใหม่ (ระบบย่อย pin ด้วย @vX.Y.Z จึงยังไม่กระทบจนกว่าจะ bump)
#
# ทำไมต้องเป็นสคริปต์ที่นี่ ไม่ใช่ workflow ในระบบย่อย:
#   GH-03 ห้ามระบบย่อยแก้ไฟล์ใน .github/workflows/ — กฎทั้งหมดต้องมาจากส่วนกลางที่แตะไม่ได้
#
# ตรวจอะไร (ที่ grep ของ check-ui-tokens.sh ทำไม่ได้):
#   DS-01  root layout ครอบด้วย <CsmjuAppShell>
#   DS-02  ทุก route segment มี loading.tsx
#   DS-03  ทุก route segment มี error.tsx
#   DS-04  มี not-found.tsx ที่ราก app/
#   DS-05  <IconButton> มี prop label (aria-label ภาษาไทย)
#   DS-06  <Button disabled> มี disabledReason
#   DS-08  ไม่มี next/font/google
#   DS-13  มี @csmju2030/design-system ใน dependencies
#   DS-14  ไม่ fork component ของ design system
#   DS-16  root layout ไม่มี "use client"
#   DS-19  standards_version ตรงกับ .standards-version
#   DS-20  ไม่เขียน refresh token logic เอง
#   DS-21  ไม่เรียก /oauth/token ของ Core เอง (auth-contract §22)
#   DS-22  มี route handler /auth ที่ใช้ createCsmjuAuthRoutes()
#   (และทวนซ้ำ UI-01..04 / SEC-03 / SEC-05 / ARC-01 / ARC-03 ด้วยตัว parser ที่แม่นกว่า grep)
#
# เคารพ .compliance-exceptions.yml เหมือน check อื่นๆ
set -euo pipefail

TARGET_DIR="${1:-.}"
cd "$TARGET_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "⚠️  [DS-xx] ข้ามการตรวจ (ไม่พบ node ในเครื่อง)"
  exit 0
fi

# pin เวอร์ชันไว้เพื่อให้ผลการตรวจคงที่ ไม่เปลี่ยนตามวันที่รัน
DS_VERSION="${CSMJU_DESIGN_SYSTEM_VERSION:-1.3.0}"

if ! npx --yes "@csmju2030/design-system@${DS_VERSION}" csmju-ui-lint; then
  cat <<'MSG'

   อ้างอิง: ui-design-system.md (docs/ui-design-system.md ใน repo นี้)
   วิธีแก้:  แก้ตามข้อความ ↳ ของแต่ละข้อ แล้วรันซ้ำในเครื่องด้วย
             pnpm --filter frontend lint:ui
MSG
  exit 1
fi

echo "✅ [DS-xx] ผ่านการตรวจ design system compliance"
