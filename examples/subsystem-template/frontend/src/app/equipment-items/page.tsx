import { csmjuTitle } from "@csmju2030/design-system";
import { ItemsClient } from "./ItemsClient";
export const metadata = { title: csmjuTitle({ page: "รายการครุภัณฑ์", subsystem: "ระบบครุภัณฑ์" }) };
export const dynamic = "force-dynamic";
export default function Page() { return <ItemsClient />; }
