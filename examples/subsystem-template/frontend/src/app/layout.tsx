import type { Metadata } from "next";
import { CsmjuAppShell } from "@csmju2030/design-system";
import "./globals.css";

export const metadata: Metadata = { title: "ระบบครุภัณฑ์ · CSMJU" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <CsmjuAppShell
          subsystemName="csmju-equipment"
          displayName="ระบบครุภัณฑ์"
          nav={[
            { label: "ภาพรวม", href: "/", icon: "layout-dashboard" },
            { label: "รายการครุภัณฑ์", href: "/equipment-items", icon: "package" },
            { label: "การยืม-คืน", href: "/borrow-records", icon: "repeat" },
          ]}
        >
          {children}
        </CsmjuAppShell>
      </body>
    </html>
  );
}
