/**
 * OAuth flow ทั้งหมดของระบบย่อย — ไฟล์นี้มีแค่ 2 บรรทัดและต้องเป็นแบบนี้ทุกระบบ
 *
 * 🔴 ห้ามเขียน logic แลก token / refresh / logout เอง
 *    auth-contract.md §22 "ห้ามแต่ละ AIE ออกแบบ Refresh Flow เอง"
 *    ui-design-system.md §16.2 ข้อ 7 · csmju-ui-lint DS-20/DS-21
 *
 * ได้ 4 เส้นทาง: /auth/login · /auth/callback · /auth/refresh · /auth/logout
 */
import { createCsmjuAuthRoutes } from "@csmju2030/design-system/server";

export const { GET, POST } = createCsmjuAuthRoutes();
