import { Grid, PageHeader, StatCard, Stack, csmjuTitle, formatNumber } from "@csmju2030/design-system";
export const metadata = { title: csmjuTitle({ page: "ภาพรวม", subsystem: "ระบบครุภัณฑ์" }) };
export default function Page() {
  return (
    <Stack>
      <PageHeader title="ภาพรวม" description="สรุปสถานะครุภัณฑ์ของภาควิชา" />
      {/* utility class จาก preset ของส่วนกลาง — ทุกค่ามาจาก token ไม่มีตัวเลขดิบ */}
      <p className="text-csmju-body-sm text-csmju-muted">
        ข้อมูล ณ ต้นวันทำการ ปรับปรุงอัตโนมัติทุกเช้า
      </p>
      <Grid columns={3}>
        <StatCard label="ครุภัณฑ์ทั้งหมด" value={formatNumber(2450)} unit="ชิ้น" />
        <StatCard label="ถูกยืมอยู่" value={formatNumber(185)} unit="ชิ้น" />
        <StatCard label="เกินกำหนดคืน" value={formatNumber(12)} unit="ชิ้น" attention hint="ต้องติดตามคืนภายในสัปดาห์นี้" />
      </Grid>
    </Stack>
  );
}
