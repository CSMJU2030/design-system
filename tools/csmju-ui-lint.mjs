#!/usr/bin/env node
/**
 * csmju-ui-lint — ตัวตรวจ "ชั้นหน้าจอ" ของโครงการ CSMJU2030
 *
 * ตำแหน่งของเครื่องมือนี้ในภาพรวม:
 *   csmju2030-standards/scripts/*.sh  = compliance gate กลาง (GH/SEC/ARC/API/DD/UI/QA) รันใน CI ที่แตะไม่ได้
 *   csmju-ui-lint (ตัวนี้)            = ส่วนขยายฝั่งหน้าจอ ที่ตรวจลึกกว่าที่ grep ทำได้
 *                                       เช่น "ทุก route segment มี loading.tsx ไหม",
 *                                       "IconButton มี aria-label ไหม", "AppShell ครอบหรือยัง"
 *
 * รหัสกฎ:
 *   UI-01..04 / SEC-03 / SEC-05 / ARC-01 / ARC-03 / DD-04  = รหัสเดียวกับ ci-compliance-spec.md §7.1
 *                                                            (ระดับความรุนแรงตรงกับของกลาง)
 *   DS-xx                                                  = กฎเฉพาะ design system ที่ของกลางยังไม่มี
 *
 * ใช้งาน:
 *   npx csmju-ui-lint                    # ตรวจ subsystem repo ปัจจุบัน (frontend/src)
 *   npx csmju-ui-lint --path frontend/src
 *   npx csmju-ui-lint --json             # สำหรับ CI / สคริปต์รวมผลหลาย repo
 *   npx csmju-ui-lint --warn-only        # ไม่ exit 1 (ใช้ช่วง migrate เท่านั้น)
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, sep } from "node:path";

/* ============================================================
   argument
   ============================================================ */
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const ROOT = process.cwd();
const asJson = flag("json");
const warnOnly = flag("warn-only");
/** ใช้ตอน design system ตรวจซอร์สของตัวเอง */
const allowInternal = flag("allow-internal");

const explicitPath = value("path", null);
const SCAN_DIRS = explicitPath
  ? [explicitPath]
  : ["frontend/src", "web/src", "src", "app"].filter((d) => existsSync(join(ROOT, d)));

/* ============================================================
   ผลการตรวจ
   ============================================================ */
const SEV = { ERROR: "error", WARN: "warn" };
const findings = [];

function report(severity, rule, file, line, message, hint) {
  findings.push({ severity, rule, file, line, message, hint });
}

/* ============================================================
   .compliance-exceptions.yml — ข้อยกเว้นที่ PM อนุมัติแล้ว
   (ci-compliance-spec.md §11 — parse แบบง่ายพอสำหรับ key ที่เราสนใจ)
   ============================================================ */
function loadExceptions() {
  const file = join(ROOT, ".compliance-exceptions.yml");
  if (!existsSync(file)) return new Map();
  const out = new Map();
  let currentCheck = null;
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.replace(/#.*$/, "");
    const check = /^\s*-\s*check:\s*["']?([A-Za-z0-9-]+)["']?/.exec(line);
    if (check) {
      currentCheck = check[1];
      out.set(currentCheck, { expires: null });
      continue;
    }
    const expires = /^\s*expires:\s*["']?(\d{4}-\d{2}-\d{2})["']?/.exec(line);
    if (expires && currentCheck) out.get(currentCheck).expires = expires[1];
  }
  const today = new Date().toISOString().slice(0, 10);
  for (const [id, meta] of out) {
    if (meta.expires && meta.expires < today) out.delete(id); // หมดอายุแล้ว = ไม่ยกเว้น
  }
  return out;
}
const EXCEPTIONS = loadExceptions();

/* ============================================================
   เดินไฟล์
   ============================================================ */
const IGNORE_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build", "coverage",
  ".turbo", ".vercel", "out", ".compliance-tools", "standards",
]);
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const STYLE_EXT = new Set([".css", ".scss"]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * แทนคอมเมนต์ด้วยช่องว่างก่อนตรวจ (คงจำนวนบรรทัดไว้)
 * ไม่งั้นคอมเมนต์ที่อธิบายกฎ เช่น "ห้ามใช้ #004C99" จะถูกจับว่าละเมิดกฎเสียเอง
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(Math.max(0, m.length - p1.length)));
}

function eachLine(source, fn) {
  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i += 1) fn(lines[i], i + 1);
}

/* ============================================================
   รายการ dependency ต้องห้าม — ให้ตรงกับ scripts/lib/allowed-deps.json ของส่วนกลาง
   ============================================================ */
const FORBIDDEN_EVERYWHERE = [
  "@mui/material", "@mui/core", "antd", "@ant-design/icons",
  "bootstrap", "react-bootstrap",
  "@chakra-ui/react", "daisyui", "@mantine/core",
  "express", "fastify", "koa", "hapi",
  "mysql", "mysql2", "mongodb", "mongoose", "sequelize", "typeorm",
  "jsonwebtoken", "jose", "passport-jwt",
];
/** ARC-01 — frontend ห้ามมี DB client (tech-stack.md 1.2) */
const DB_CLIENTS = ["pg", "postgres", "@prisma/client", "prisma", "drizzle-orm", "knex"];

/** component ที่ design system มีให้แล้ว — เจอไฟล์ชื่อเดียวกันในระบบย่อย = สัญญาณของการ fork */
const DS_COMPONENT_NAMES = new Set([
  "Button", "IconButton", "Card", "Modal", "ConfirmDialog", "Drawer", "Toast", "Alert",
  "Badge", "Tag", "Avatar", "DataTable", "Pagination", "StatCard", "EmptyState",
  "ErrorState", "Skeleton", "Spinner", "Tooltip", "Tabs", "Accordion", "Breadcrumb",
  "PageHeader", "Container", "AppShell", "Select", "Checkbox", "Radio", "Switch",
  "TextInput", "TextArea", "FormField", "ProgressBar", "Timeline",
]);

/* ============================================================
   กฎระดับบรรทัด
   ============================================================ */
const LINE_RULES = [
  {
    id: "UI-01",
    severity: SEV.ERROR,
    ref: "ui-design-system.md §3.1 · ci-compliance-spec §7.1",
    test: (line) => /#[0-9a-fA-F]{3,8}\b/.test(line) && !/--csmju-/.test(line),
    message: "พบค่าสี hex ดิบในโค้ด frontend",
    hint: "ใช้ CSS variable --csmju-* หรือ utility class จาก tailwind preset ของโครงการแทน",
  },
  {
    id: "UI-02",
    severity: SEV.WARN,
    ref: "ui-design-system.md §3.2, §3.3",
    // ครอบทั้ง CSS (padding: 15px) และ inline style ใน JSX (padding: "15px")
    test: (line) => /(margin|padding|border-?[Rr]adius|gap)\s*:\s*["']?[0-9]+px/.test(line),
    message: "พบค่า spacing/radius เป็น px ดิบ",
    hint: "ใช้ token: var(--csmju-space-4), var(--csmju-radius-lg) — ค่าที่ไม่อยู่ใน scale 8pt ถือว่าผิด",
  },
  {
    id: "UI-03",
    severity: SEV.WARN,
    ref: "ui-design-system.md §12.1, §12.5, §16.2 ข้อ 8/10",
    test: (line, ctx) =>
      /<(div|span)\b[^>]*\sonClick=/.test(line) ||
      /outline:\s*none/.test(line) ||
      (/!important/.test(line) && !ctx.inReducedMotion),
    message: "พบ div onClick / outline:none / !important",
    hint: "ใช้ <button> สำหรับการกระทำ · ห้ามปิด focus outline โดยไม่มีของแทน · !important ใช้ได้เฉพาะใน @media (prefers-reduced-motion)",
  },
  {
    id: "UI-04",
    severity: SEV.WARN,
    ref: "ui-design-system.md §16.2 ข้อ 14",
    test: (line) => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(line),
    message: "พบ emoji ในหน้าจอระบบ",
    hint: "ระบบมหาวิทยาลัยไม่ใช้ emoji ในหน้าจอ — ใช้ไอคอน Lucide แทน",
  },
  {
    id: "SEC-03",
    severity: SEV.ERROR,
    ref: "ci-compliance-spec §7.1 · ui-design-system.md §16.2 ข้อ 4",
    test: (line) =>
      /(localStorage|sessionStorage)\.(setItem|getItem)\s*\(\s*["'`][^"'`]*(token|jwt|access|refresh)/i.test(line),
    message: "เก็บ token ใน localStorage/sessionStorage",
    hint: "token อยู่ใน httpOnly cookie ที่ Core ออกให้ — AppShell จัดการให้แล้ว ห้ามอ่าน/เก็บเอง",
  },
  {
    id: "DS-10",
    severity: SEV.WARN,
    ref: "ui-design-system.md §3.2, §16.2 ข้อ 1",
    // จับ p-[15px] text-[#004C99] gap-[7px] — ช่องโหว่ที่เลี่ยง token ได้ง่ายที่สุดและ grep ของกลางจับไม่ได้
    test: (line) => /\b(?:[mp][trblxy]?|gap|w|h|text|rounded|top|left|right|bottom|inset|z)-\[[^\]]+\]/.test(line),
    message: "พบ Tailwind arbitrary value ที่เลี่ยง token",
    hint: "ใช้ utility จาก preset เช่น p-csmju-4 rounded-csmju-lg text-csmju-body-sm",
  },
  {
    id: "DS-11",
    severity: SEV.WARN,
    ref: "ui-design-system.md §3.6",
    test: (line) => /transition:\s*all\b/.test(line) || /\btransition-all\b/.test(line),
    message: "ใช้ transition: all",
    hint: "ระบุ property ที่เปลี่ยนเท่านั้น และ animate เฉพาะ opacity/transform",
  },
  {
    id: "DS-08",
    severity: SEV.ERROR,
    ref: "ui-design-system.md §4.1 · §16.2 ข้อ 13",
    test: (line) => /next\/font\/google/.test(line) || /fonts\.googleapis\.com/.test(line),
    message: "โหลดฟอนต์จาก Google Fonts CDN",
    hint: 'ฟอนต์มาจาก @import "@csmju2030/design-system/styles.css" แล้ว (self-host)',
  },
  {
    id: "DS-12",
    severity: SEV.ERROR,
    ref: "ui-design-system.md §16.1.1 · §16.2 ข้อ 15",
    test: (line) => /from\s+["']next\/router["']/.test(line),
    message: "ใช้ next/router (Pages Router)",
    hint: "ใช้ App Router และ next/navigation เท่านั้น",
  },
  {
    id: "DS-20",
    severity: SEV.ERROR,
    ref: "ui-design-system.md §16.2 ข้อ 7 · auth-contract.md §6",
    test: (line) => /\/auth\/refresh|refreshToken\s*\(|\brefresh_token\s*=/.test(line),
    message: "เขียน logic refresh token เอง",
    hint: "CsmjuAppShell ดัก 401 แล้ว refresh + retry ให้แล้ว ระบบย่อยห้ามเขียนซ้ำ",
  },
  {
    id: "DD-04",
    severity: SEV.WARN,
    ref: "data-dictionary.md §3 (ตัวตรวจจริงคือ check-no-hardcoded-faculty.sh)",
    test: (line) => /(คณะวิศวกรรม|คณะบริหารธุรกิจ|คณะเศรษฐศาสตร์|คณะสถาปัตย|คณะสัตวแพทย)/.test(line),
    message: "อาจ hardcode รายชื่อคณะ",
    hint: "ต้องเรียก /v1/faculties",
  },
];

/* ============================================================
   กฎที่ต้องดูทั้งไฟล์
   ============================================================ */
function checkIconButtonLabels(source, file) {
  const re = /<IconButton\b([^>]*)>/g;
  let m;
  while ((m = re.exec(source))) {
    if (!/\blabel\s*=/.test(m[1])) {
      report(SEV.ERROR, "DS-05", file, source.slice(0, m.index).split("\n").length,
        "IconButton ไม่มี prop label",
        'ไอคอนล้วนต้องมี aria-label ภาษาไทยที่ระบุชื่อรายการ เช่น label="แก้ไขประกาศ ปฐมนิเทศ" (§12.7, §19.1 ข้อ 7)');
    }
  }
}

function checkDisabledReason(source, file) {
  const re = /<Button\b([\s\S]*?)>/g;
  let m;
  while ((m = re.exec(source))) {
    const props = m[1];
    if (/\bdisabled\b(?!Reason)/.test(props) && !/\bdisabledReason\s*=/.test(props)) {
      report(SEV.ERROR, "DS-06", file, source.slice(0, m.index).split("\n").length,
        "Button ที่ disabled ไม่มี disabledReason",
        "ปุ่มที่กดไม่ได้โดยไม่บอกเหตุผลคือบั๊กด้าน UX (§10.2)");
    }
  }
}

function checkPlaceholderAsLabel(source, file) {
  const re = /<(TextInput|TextArea|Select|NumberInput)\b([\s\S]*?)\/?>/g;
  let m;
  while ((m = re.exec(source))) {
    if (/\bplaceholder\s*=/.test(m[2]) && !/\baria-label\b|\bid=\{/.test(m[2])) {
      report(SEV.WARN, "DS-15", file, source.slice(0, m.index).split("\n").length,
        `${m[1]} มี placeholder แต่ไม่เห็นการผูกกับ label`,
        'ทุก input ต้องอยู่ใน <FormField label="..."> ห้ามใช้ placeholder แทน label (§8.1)');
    }
  }
}

/* ============================================================
   ตรวจไฟล์
   ============================================================ */
function lintFile(absPath) {
  const file = relative(ROOT, absPath);
  const ext = extname(absPath);
  if (!CODE_EXT.has(ext) && !STYLE_EXT.has(ext)) return;

  let raw;
  try {
    raw = readFileSync(absPath, "utf8");
  } catch {
    return;
  }
  const source = stripComments(raw);

  let inReducedMotion = false;
  let depthAtReducedMotion = 0;
  let depth = 0;

  eachLine(source, (line, no) => {
    if (/@media[^{]*prefers-reduced-motion/.test(line)) {
      inReducedMotion = true;
      depthAtReducedMotion = depth;
    }
    depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    if (inReducedMotion && depth <= depthAtReducedMotion) inReducedMotion = false;

    for (const rule of LINE_RULES) {
      // design system เองเป็นเจ้าของ token และเป็นคนเขียน 401 handling จึงได้รับยกเว้น 2 ข้อนี้
      if (allowInternal && (rule.id === "UI-01" || rule.id === "UI-02" || rule.id === "DS-20")) continue;
      if (rule.test(line, { inReducedMotion })) {
        report(rule.severity, rule.id, file, no, rule.message, `${rule.hint}  [${rule.ref}]`);
      }
    }
  });

  if (CODE_EXT.has(ext)) {
    for (const pkg of FORBIDDEN_EVERYWHERE) {
      const re = new RegExp(`from\\s+["']${pkg.replace(/[/@]/g, "\\$&")}(?:/[^"']*)?["']`);
      if (re.test(source)) {
        report(SEV.ERROR, "ARC-03", file, 0, `import จาก dependency ต้องห้าม: ${pkg}`,
          "ใช้ component จาก @csmju2030/design-system เท่านั้น  [ci-compliance-spec §7.3]");
      }
    }
    for (const pkg of DB_CLIENTS) {
      const re = new RegExp(`from\\s+["']${pkg.replace(/[/@]/g, "\\$&")}(?:/[^"']*)?["']`);
      if (re.test(source)) {
        report(SEV.ERROR, "ARC-01", file, 0, `frontend import DB client: ${pkg}`,
          "frontend ต้องเรียกผ่าน API ของ NestJS เท่านั้น ห้ามต่อ PostgreSQL ตรง  [tech-stack.md 1.2]");
      }
    }

    if (!allowInternal) {
      checkIconButtonLabels(source, file);
      checkDisabledReason(source, file);
      checkPlaceholderAsLabel(source, file);

      // DS-14 — fork design system
      const base = file.split(sep).pop().replace(/\.(tsx|ts|jsx|js)$/, "");
      if (DS_COMPONENT_NAMES.has(base)) {
        const inUiFolder = /(^|[\\/])components[\\/]ui[\\/]/.test(file);
        report(inUiFolder ? SEV.ERROR : SEV.WARN, "DS-14", file, 0,
          `ไฟล์ชื่อ ${base} ซ้ำกับ component ของ design system`,
          "ห้าม copy component มาแก้ในระบบย่อย (fork = หนี้ที่อัปเดตตามส่วนกลางไม่ได้) ถ้าของเดิมไม่พอ ให้ขอเพิ่มตาม §17.4");
      }
    }
  }
}

/* ============================================================
   ตรวจระดับโปรเจกต์
   ============================================================ */
function lintProject() {
  checkPackageJson();
  checkAppRouter();
  checkManifest();
  checkEnvFiles();

  // SEC-05 — ระบบย่อยห้ามมีหน้า login
  for (const dir of SCAN_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      const rel = relative(ROOT, file).split(sep).join("/");
      if (/\/(login|signin|sign-in)\/(page|route)\.(t|j)sx?$/.test(rel)) {
        report(SEV.ERROR, "SEC-05", rel, 0, "ระบบย่อยมีหน้า login ของตัวเอง",
          "การยืนยันตัวตนเป็นของ Core ทั้งหมด ให้ redirect ไป Core  [auth-contract.md ข้อ 1]");
      }
    }
  }
}

function checkPackageJson() {
  const candidates = ["frontend/package.json", "web/package.json", "package.json"];
  for (const rel of candidates) {
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) continue;
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(abs, "utf8"));
    } catch {
      continue;
    }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const isFrontend =
      rel.startsWith("frontend/") || rel.startsWith("web/") || Boolean(deps.next);
    if (!isFrontend) continue;

    for (const name of Object.keys(deps)) {
      if (FORBIDDEN_EVERYWHERE.includes(name)) {
        report(SEV.ERROR, "ARC-03", rel, 0, `dependency ต้องห้าม: ${name}`,
          "ถอนออกแล้วใช้ @csmju2030/design-system  [ci-compliance-spec §7.3]");
      }
      if (DB_CLIENTS.includes(name)) {
        report(SEV.ERROR, "ARC-01", rel, 0, `frontend มี DB client: ${name}`,
          "frontend ต้องผ่าน API ของ NestJS เท่านั้น  [tech-stack.md 1.2]");
      }
      if (["vite", "nuxt", "react-scripts"].includes(name)) {
        report(SEV.ERROR, "ARC-02", rel, 0, `framework นอก stack: ${name}`,
          "Stack ล็อกที่ Next.js App Router  [tech-stack.md ข้อ 1]");
      }
    }
    if (!deps["@csmju2030/design-system"]) {
      report(SEV.ERROR, "DS-13", rel, 0, "ไม่พบ @csmju2030/design-system ใน dependencies",
        "pnpm add @csmju2030/design-system  [ui-design-system.md §3]");
    }
    return; // ตรวจ frontend ตัวเดียวพอ
  }
}

function appDirs() {
  return ["frontend/src/app", "web/src/app", "src/app", "app"]
    .map((d) => join(ROOT, d))
    .filter(existsSync);
}

function checkAppRouter() {
  // DS-12 — Pages Router
  for (const p of ["frontend/src/pages", "frontend/pages", "web/src/pages", "src/pages", "pages"]) {
    if (existsSync(join(ROOT, p))) {
      report(SEV.ERROR, "DS-12", p, 0, "พบโฟลเดอร์ pages/ (Pages Router)",
        "ใช้ App Router เท่านั้น เพื่อให้ loading.tsx / error.tsx ทำหน้าที่ 3 สถานะบังคับได้  [§16.1.1]");
    }
  }
  for (const appDir of appDirs()) {
    checkRootLayout(appDir);
    checkSegments(appDir, appDir);
  }
}

function checkRootLayout(appDir) {
  const layout = ["layout.tsx", "layout.jsx", "layout.ts", "layout.js"]
    .map((f) => join(appDir, f))
    .find(existsSync);

  if (!layout) {
    report(SEV.ERROR, "DS-01", relative(ROOT, appDir), 0, "ไม่พบ app/layout.tsx",
      "ทุกระบบย่อยต้องมี root layout ที่ครอบด้วย <CsmjuAppShell>  [§5.1]");
    return;
  }
  const rel = relative(ROOT, layout);
  const src = readFileSync(layout, "utf8");

  if (!/CsmjuAppShell/.test(src)) {
    report(SEV.ERROR, "DS-01", rel, 0, "root layout ไม่ได้ครอบด้วย <CsmjuAppShell>",
      "header / sidebar / เมนูผู้ใช้ / 401 handling มาจากส่วนกลาง ห้ามวาดเอง  [§5.1]");
  }
  if (/^\s*["']use client["']/m.test(src)) {
    report(SEV.ERROR, "DS-16", rel, 0, 'root layout มี "use client"',
      "layout รากต้องเป็น Server Component  [§16.1.1]");
  }
  if (!/lang=["']th["']/.test(src)) {
    report(SEV.WARN, "DS-17", rel, 0, 'ไม่พบ lang="th" ที่ <html>',
      "ช่วยให้ screen reader ออกเสียงภาษาไทยถูก  [§4.3.6]");
  }
}

function checkSegments(dir, appRoot) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  const rel = relative(ROOT, dir);
  const pageFile = entries.find((f) => /^page\.(t|j)sx?$/.test(f));

  if (pageFile) {
    if (!entries.some((f) => /^loading\.(t|j)sx?$/.test(f))) {
      report(SEV.ERROR, "DS-02", rel, 0, "route segment นี้ไม่มี loading.tsx",
        "ต้องเป็น <Skeleton> ที่มีรูปร่างใกล้เคียงเนื้อหาจริง ไม่ใช่ spinner กลางจอ  [§9.1, §16.1.1]");
    }
    if (!entries.some((f) => /^error\.(t|j)sx?$/.test(f))) {
      report(SEV.ERROR, "DS-03", rel, 0, "route segment นี้ไม่มี error.tsx",
        "ต้องเป็น <ErrorState onRetry={reset}/> และห้ามแสดง error.message ดิบ  [§16.1.1]");
    }
    const src = readFileSync(join(dir, pageFile), "utf8");
    if (!/export\s+(const|async\s+function|function)\s+(metadata|generateMetadata)/.test(src)) {
      report(SEV.WARN, "DS-07", relative(ROOT, join(dir, pageFile)), 0,
        "หน้านี้ไม่ได้ export metadata",
        'ใช้ csmjuTitle({ page, subsystem }) -> "<ชื่อหน้า> · <ชื่อระบบย่อย> · CSMJU"  [§11.4]');
    }
  }

  if (dir === appRoot && !entries.some((f) => /^not-found\.(t|j)sx?$/.test(f))) {
    report(SEV.ERROR, "DS-04", rel, 0, "ไม่มี not-found.tsx ที่ราก app/",
      "ต้องเป็น <EmptyState> ไม่ใช่หน้า error สีแดง  [§9.3, §16.1.1]");
  }

  for (const name of entries) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    try {
      if (statSync(full).isDirectory()) checkSegments(full, appRoot);
    } catch {
      /* ข้าม */
    }
  }
}

function checkManifest() {
  const manifest = ["subsystem.yaml", "subsystem.yml"].map((f) => join(ROOT, f)).find(existsSync);
  if (!manifest) {
    report(SEV.WARN, "DS-19", "subsystem.yaml", 0, "ไม่พบ subsystem.yaml",
      "manifest บังคับตาม auth-contract §4 / api-conventions §7");
    return;
  }
  const rel = relative(ROOT, manifest);
  const src = readFileSync(manifest, "utf8");
  const declaredStandards = /standards_version:\s*["']?([\d.]+)["']?/.exec(src)?.[1];
  const declaredDs = /design_system_version:\s*["']?([\d.]+)["']?/.exec(src)?.[1];

  // GH-04/Standards Version Check ของกลางเทียบกับ submodule — ตรงนี้เทียบกับ .standards-version
  const versionFile = join(ROOT, ".standards-version");
  if (existsSync(versionFile)) {
    const pinned = readFileSync(versionFile, "utf8").trim();
    if (declaredStandards && pinned && declaredStandards !== pinned) {
      report(SEV.ERROR, "DS-19", rel, 0,
        `standards_version (${declaredStandards}) ไม่ตรงกับ .standards-version (${pinned})`,
        "สองค่านี้ต้องตรงกันเสมอ ไม่งั้น CI ของกลางจะตีตกที่ Standards Version Check");
    }
  }

  // เวอร์ชัน design system ที่ติดตั้งจริง
  let installed = null;
  for (const p of ["frontend/node_modules", "web/node_modules", "node_modules"]) {
    const f = join(ROOT, p, "@csmju2030", "design-system", "package.json");
    if (existsSync(f)) {
      try {
        installed = JSON.parse(readFileSync(f, "utf8")).version;
      } catch {
        /* ข้าม */
      }
      break;
    }
  }
  if (installed && declaredDs && installed !== declaredDs) {
    report(SEV.WARN, "DS-18", rel, 0,
      `ui.design_system_version (${declaredDs}) ไม่ตรงกับที่ติดตั้งจริง (${installed})`,
      "รัน pnpm update @csmju2030/design-system แล้วแก้ค่าใน subsystem.yaml ให้ตรง  [§18.2]");
  }
  if (installed && declaredDs) {
    const [iMaj, iMin] = installed.split(".").map(Number);
    const [dMaj, dMin] = declaredDs.split(".").map(Number);
    if (dMaj < iMaj) {
      report(SEV.ERROR, "DS-18", rel, 0,
        `design_system_version (${declaredDs}) ตามหลังเวอร์ชันปัจจุบัน (${installed}) เกิน 1 major`,
        "ต้องอัปเกรดก่อน deploy ขึ้น production  [§17.2]");
    } else if (dMaj === iMaj && iMin - dMin > 1) {
      report(SEV.WARN, "DS-18", rel, 0,
        `design_system_version (${declaredDs}) ตามหลังเวอร์ชันปัจจุบัน (${installed}) เกิน 1 minor`,
        "ควรอัปเดตภายใน sprint นี้  [§17.5]");
    }
  }
}

const SECRET_HINT = /(secret|password|passwd|private_key|api_key|apikey|token|credential)/i;

function checkEnvFiles() {
  const files = [
    ".env", ".env.local", ".env.production", ".env.example",
    "frontend/.env", "frontend/.env.local", "frontend/.env.example",
  ];
  for (const f of files) {
    const abs = join(ROOT, f);
    if (!existsSync(abs)) continue;
    eachLine(readFileSync(abs, "utf8"), (line, no) => {
      const m = /^\s*(NEXT_PUBLIC_[A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!m) return;
      if (SECRET_HINT.test(m[1])) {
        report(SEV.ERROR, "DS-09", f, no, `ตัวแปร ${m[1]} ดูเหมือนเก็บความลับ`,
          "ค่าที่ขึ้นต้น NEXT_PUBLIC_ ถูกฝังลงใน bundle และเปิดเผยต่อสาธารณะ  [§16.2 ข้อ 17]");
      }
      if (f.endsWith(".env.example") && m[2].trim() !== "") {
        report(SEV.WARN, "SEC-02", f, no, `.env.example ควรระบุชื่อ key เท่านั้น ไม่ใส่ค่า`,
          "ci-compliance-spec §10.3");
      }
    });
  }
}

/* ============================================================
   รัน
   ============================================================ */
if (SCAN_DIRS.length === 0) {
  console.error(
    "[csmju-ui-lint] ไม่พบโฟลเดอร์ที่จะตรวจ (frontend/src, web/src, src, app)\n" +
      "ถ้ารันจาก monorepo ให้รันที่ราก repo ของระบบย่อย หรือระบุ --path <dir>",
  );
  process.exit(warnOnly ? 0 : 1);
}

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) lintFile(file);
}
if (!allowInternal) lintProject();

// ตัดข้อที่มีข้อยกเว้นที่ PM อนุมัติและยังไม่หมดอายุออก
const active = findings.filter((f) => !EXCEPTIONS.has(f.rule));
const waived = findings.length - active.length;

const errors = active.filter((f) => f.severity === SEV.ERROR);
const warnings = active.filter((f) => f.severity === SEV.WARN);

if (asJson) {
  console.log(JSON.stringify({ errors: errors.length, warnings: warnings.length, waived, findings: active }, null, 2));
} else {
  const RED = "\x1b[31m", YEL = "\x1b[33m", DIM = "\x1b[2m", RST = "\x1b[0m", BLD = "\x1b[1m";
  console.log(`\n${BLD}csmju-ui-lint${RST} ${DIM}— ชั้นหน้าจอของ CSMJU2030 (ui-design-system.md v1.2.0)${RST}\n`);

  const byFile = new Map();
  for (const f of active) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  for (const [file, list] of byFile) {
    console.log(`${BLD}${file}${RST}`);
    for (const f of list) {
      const tag = f.severity === SEV.ERROR ? `${RED}error${RST}` : `${YEL}warn ${RST}`;
      const loc = f.line ? `${DIM}:${f.line}${RST}` : "";
      console.log(`  ${tag}${loc}  ${BLD}[${f.rule}]${RST} ${f.message}`);
      if (f.hint) console.log(`         ${DIM}↳ ${f.hint}${RST}`);
    }
    console.log("");
  }

  if (active.length === 0) {
    console.log("  ✓ ผ่านทุกข้อ\n");
  } else {
    console.log(`${BLD}สรุป:${RST} ${RED}${errors.length} error${RST} · ${YEL}${warnings.length} warning${RST}`);
  }
  if (waived > 0) {
    console.log(`${DIM}(ยกเว้นตาม .compliance-exceptions.yml: ${waived} รายการ)${RST}`);
  }
  console.log("");
}

process.exit(errors.length > 0 && !warnOnly ? 1 : 0);
