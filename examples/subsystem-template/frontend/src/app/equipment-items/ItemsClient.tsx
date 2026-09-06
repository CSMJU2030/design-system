"use client";
import { useState } from "react";
import {
  Badge, Button, Can, ConfirmDialog, DataTable, FormField, IconButton, Modal,
  PageHeader, Stack, StatusDot, TextInput, formatDate, formatMoney, useToast,
} from "@csmju2030/design-system";
import { Pencil, Trash2 } from "@csmju2030/design-system/icons";

interface Item { id: string; asset_code: string; name: string; status: string; price_satang: number; acquired_at: string; }

/**
 * แปลงค่า status จาก API เป็นคำไทย + สีมาตรฐาน
 * 🔴 ห้ามให้แต่ละหน้าคิดคำเรียกเอง ไม่งั้น 37 ระบบจะเรียกสถานะเดียวกันคนละคำ
 */
const STATUS: Record<string, { tone: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  available: { tone: "success", label: "พร้อมให้ยืม" },
  borrowed: { tone: "warning", label: "ถูกยืมอยู่" },
  overdue: { tone: "danger", label: "เกินกำหนดคืน" },
  retired: { tone: "neutral", label: "จำหน่ายออกแล้ว" },
};

const rows: Item[] = [
  { id: "1", asset_code: "CS-PRJ-001", name: "โปรเจกเตอร์ EPSON EB-2250U", status: "available", price_satang: 4850000, acquired_at: "2026-08-11" },
];

export function ItemsClient() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Item | null>(null);

  return (
    <Stack>
      <PageHeader
        title="รายการครุภัณฑ์"
        description="ค้นหาและจัดการครุภัณฑ์ของภาควิชา"
        actions={<Can role={["admin", "editor"]}><Button variant="primary" onClick={() => setOpen(true)}>เพิ่มครุภัณฑ์</Button></Can>}
      />
      <DataTable<Item>
        caption="รายการครุภัณฑ์ทั้งหมด"
        rowKey={(r) => r.id}
        rows={rows}
        search={{ value: q, onChange: setQ }}
        sort={{ key: "asset_code", direction: "asc", onChange: () => {} }}
        pagination={{ page: 1, total: 1, onPageChange: () => {} }}
        empty={{ title: "ยังไม่มีรายการครุภัณฑ์", description: "เริ่มต้นด้วยการเพิ่มครุภัณฑ์ชิ้นแรกของภาควิชา", action: <Button variant="primary">เพิ่มครุภัณฑ์</Button> }}
        emptyFiltered={{ title: "ไม่พบครุภัณฑ์ที่ค้นหา", description: "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง", action: <Button variant="secondary" onClick={() => setQ("")}>ล้างตัวกรอง</Button> }}
        columns={[
          { key: "asset_code", header: "รหัสครุภัณฑ์", sortable: true, render: (r) => r.asset_code },
          { key: "name", header: "ชื่อ", render: (r) => r.name },
          { key: "status", header: "สถานะ", render: (r) => <StatusDot tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusDot> },
          { key: "price_satang", header: "ราคา", align: "numeric", render: (r) => formatMoney(r.price_satang) },
          { key: "acquired_at", header: "วันที่ได้มา", align: "numeric", hideOnMobile: true, render: (r) => formatDate(r.acquired_at) },
        ]}
        rowActions={(r) => (
          <>
            <IconButton label={`แก้ไขครุภัณฑ์ ${r.name}`} icon={<Pencil size={18} />} onClick={() => setOpen(true)} />
            <IconButton label={`ลบครุภัณฑ์ ${r.name}`} icon={<Trash2 size={18} />} tone="danger" onClick={() => setConfirm(r)} />
          </>
        )}
      />
      <Modal open={open} onClose={() => setOpen(false)} title="เพิ่มครุภัณฑ์"
        footer={<><Button variant="primary" onClick={() => { setOpen(false); toast.success("บันทึกแล้ว", "เพิ่มครุภัณฑ์เรียบร้อย"); }}>บันทึก</Button><Button variant="ghost" onClick={() => setOpen(false)}>ยกเลิก</Button></>}>
        <FormField label="รหัสครุภัณฑ์" required hint="ตัวอย่าง: CS-PRJ-001">
          {(p) => <TextInput {...p} />}
        </FormField>
      </Modal>
      <ConfirmDialog
        open={confirm !== null}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { setConfirm(null); toast.success("ลบแล้ว"); }}
        title={`ลบครุภัณฑ์ "${confirm?.name ?? ""}"?`}
        description="รายการนี้จะถูกลบถาวร ประวัติการยืมที่เกี่ยวข้องจะยังคงอยู่"
        confirmLabel="ลบครุภัณฑ์"
      />
      <Badge tone="info">ทดสอบ</Badge>
    </Stack>
  );
}
