#!/usr/bin/env node
/**
 * csmju-ui-lint — ตัวตรวจมาตรฐานหน้าจอของโครงการ CSMJU2030
 * อ้างอิง ui-design-system.md §16.2 (ข้อห้าม) · §17.2 (CI) · §18.2 (PR checklist)
 *
 * ทำไมต้องมี: มาตรฐานที่ไม่มีเครื่องตรวจ = คำแนะนำ ไม่ใช่มาตรฐาน
 * เมื่อ 37 คนใช้ AI คนละตัว สิ่งเดียวที่บังคับได้จริงคือ CI ที่ fail
 *
 * ใช้งาน:
 *   npx csmju-ui-lint                 # ตรวจโปรเจกต์ปัจจุบัน
 *   npx csmju-ui-lint --path web/src  # ระบุโฟลเดอร์
 *   npx csmju-ui-lint --json          # ผลลัพธ์เป็น JSON สำหรับ CI
 *   npx csmju-ui-lint --warn-only     # ไม่ fail build (ใช้ช่วง migrate เท่านั้น)
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, basename, sep } from "node:path";

/* ============================================================
   อ่าน argument
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
/** ใช้ตอน design system ตรวจตัวเอง — ยกเว้นกฎที่ package เองต้องละเมิดโดยธรรมชาติ */
const allowInternal = flag("allow-internal");

const SCAN_DIRS = value("path", null)
  ? [value("path", null)]
  : ["web/src", "src", "app", "web/app"].filter((d) => existsSync(join(ROOT, d)));

/* ============================================================
   เก็บผล
   ============================================================ */
const findings = [];
const SEV = { ERROR: "error", WARN: "warn" };

function report(severity, rule, file, line, message, hint) {
  findings.push({ severity, rule, file, line, message, hint });
}

/* ============================================================
   เดินไฟล์
   ============================================================ */
const IGNORE_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build", "coverage", ".turbo", ".vercel", "out",
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
 * ตัดคอมเมนต์และ string ที่เป็นข้อความไทยออกก่อนตรวจ
 * ไม่งั้นคอมเมนต์ที่อธิบายกฎ ("ห้ามใช้ #004C99") จะถูกจับว่าละเมิดกฎเสียเอง
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
   กฎที่ตรวจในไฟล์โค้ด
   ============================================================ */

/** §16.2 ข้อ 2 · §20.1 ข้อ 2 — UI library ต้องห้าม */
const BANNED_PACKAGES = [
  "@mui/", "@material-ui/", "antd", "@ant-design/", "bootstrap", "react-bootstrap",
  "@chakra-ui/", "daisyui", "@radix-ui/themes", "@mantine/", "semantic-ui-react",
  "primereact", "@nextui-org/",
];

/** §16.2 ข้อ 16 — Next.js ห้ามต่อ PostgreSQL ตรง */
const BANNED_DB_PACKAGES = ["pg", "postgres", "@prisma/client", "drizzle-orm", "typeorm", "knex", "sequelize"];

const CODE_RULES = [
  {
    id: "no-raw-hex",
    severity: SEV.ERROR,
    // §16.2 ข้อ 1 — ยอมให้เฉพาะใน token file ของ design system เอง
    test: (line) => /#[0-9a-fA-F]{3,8}\b/.test(line) && !/--csmju-/.test(line),
    message: "พบค่าสี hex ดิบในโค้ด",
    hint: "ใช้ token: var(--csmju-color-primary) หรือ class csmju-* แทน (§3.1)",
  },
  {
    id: "no-arbitrary-tailwind",
    severity: SEV.ERROR,
    // จับ p-[15px] text-[#004C99] gap-[7px] — ช่องโหว่ที่ใช้เลี่ยง token ได้ง่ายที่สุด
    test: (line) => /\b(?:[mp][trblxy]?|gap|w|h|text|rounded|top|left|right|bottom|inset|z)-\[[^\]]+\]/.test(line),
    message: "พบ Tailwind arbitrary value ที่เลี่ยง token",
    hint: "ใช้ utility จาก preset ของโครงการ เช่น p-csmju-4 rounded-csmju-lg (§3.2, §3.3)",
  },
  {
    id: "no-div-onclick",
    severity: SEV.ERROR,
    test: (line) => /<(div|span)\b[^>]*\sonClick=/.test(line),
    message: "ใช้ <div>/<span> ที่มี onClick แทนปุ่ม",
    hint: "ใช้ <button> สำหรับการกระทำ และ <Link> สำหรับการนำทาง (§12.1, §16.2 ข้อ 10)",
  },
  {
    id: "no-transition-all",
    severity: SEV.ERROR,
    test: (line) => /transition:\s*all\b/.test(line) || /\btransition-all\b/.test(line),
    message: "ใช้ transition: all",
    hint: "ระบุ property ที่ต้องการเปลี่ยนเท่านั้น — animate เฉพาะ opacity/transform (§3.6)",
  },
  {
    id: "no-important",
    severity: SEV.ERROR,
    test: (line, ctx) => /!important/.test(line) && !ctx.inReducedMotion,
    message: "ใช้ !important",
    hint: "อนุญาตเฉพาะใน @media (prefers-reduced-motion) เท่านั้น (§16.2 ข้อ 8)",
  },
  {
    id: "no-outline-none",
    severity: SEV.ERROR,
    test: (line) => /outline:\s*none/.test(line) || /\boutline-none\b/.test(line),
    message: "ปิด focus outline",
    hint: "ถ้าต้องปิดต้องมี focus ที่มองเห็นแทนเสมอ (§12.5)",
  },
  {
    id: "no-google-fonts",
    severity: SEV.ERROR,
    test: (line) => /next\/font\/google/.test(line) || /fonts\.googleapis\.com/.test(line),
    message: "โหลดฟอนต์จาก Google Fonts CDN",
    hint: "ต้อง self-host ผ่าน @csmju2030/design-system/styles.css (§4.1, §16.2 ข้อ 13)",
  },
  {
    id: "no-token-in-localstorage",
    severity: SEV.ERROR,
    test: (line) =>
      /(localStorage|sessionStorage)\.(setItem|getItem)\s*\(\s*["'`][^"'`]*(token|jwt|access|refresh)/i.test(line),
    message: "เก็บ token ใน localStorage/sessionStorage",
    hint: "token อยู่ใน httpOnly cookie ที่ Core ออกให้ — ใช้กลไกของ AppShell เท่านั้น (§16.2 ข้อ 4)",
  },
  {
    id: "no-custom-refresh",
    severity: SEV.ERROR,
    test: (line) => /\/auth\/refresh|refreshToken\s*\(|refresh_token\s*=/.test(line),
    message: "เขียน logic refresh token เอง",
    hint: "AppShell จัดการ 401/refresh ให้แล้ว ห้ามเขียนซ้ำ (§16.2 ข้อ 7)",
  },
  {
    id: "no-pages-router",
    severity: SEV.ERROR,
    test: (line) => /from\s+["']next\/router["']/.test(line),
    message: "ใช้ next/router (Pages Router)",
    hint: "ใช้ App Router และ next/navigation เท่านั้น (§16.1.1, §16.2 ข้อ 15)",
  },
  {
    id: "no-hardcoded-faculty",
    severity: SEV.WARN,
    test: (line) => /(คณะวิศวกรรม|คณะบริหารธุรกิจ|คณะเศรษฐศาสตร์|คณะสถาปัตย)/.test(line),
    message: "อาจ hardcode รายชื่อคณะ",
    hint: "ต้องเรียก /v1/faculties (§16.2 ข้อ 6)",
  },
  {
    id: "no-emoji-in-ui",
    severity: SEV.WARN,
    test: (line) =>
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(line) && /["'`>]/.test(line),
    message: "อาจมี emoji ในหน้าจอระบบ",
    hint: "ห้ามใช้ emoji ในหน้าจอระบบ (§16.2 ข้อ 14) — ถ้าอยู่ในคอมเมนต์ให้ข้ามได้",
  },
];

/** §12.7 · §18.2 — ปุ่มไอคอนล้วนต้องมี aria-label */
function checkIconButtonLabels(source, file) {
  const re = /<IconButton\b([^>]*)>/g;
  let m;
  while ((m = re.exec(source))) {
    if (!/\blabel\s*=/.test(m[1])) {
      const line = source.slice(0, m.index).split("\n").length;
      report(SEV.ERROR, "icon-button-label", file, line, "IconButton ไม่มี prop label",
        'ต้องมี label ภาษาไทยที่ระบุรายการด้วย เช่น label="แก้ไขประกาศ ปฐมนิเทศ" (§12.7, §19.1 ข้อ 7)');
    }
  }
}

/** §10.2 — disabled ต้องมาคู่กับ disabledReason */
function checkDisabledReason(source, file) {
  const re = /<Button\b([\s\S]*?)>/g;
  let m;
  while ((m = re.exec(source))) {
    const props = m[1];
    const hasDisabled = /\bdisabled\b(?!Reason)/.test(props);
    const hasReason = /\bdisabledReason\s*=/.test(props);
    if (hasDisabled && !hasReason) {
      const line = source.slice(0, m.index).split("\n").length;
      report(SEV.ERROR, "disabled-reason", file, line, "Button ที่ disabled ไม่มี disabledReason",
        "ปุ่มที่กดไม่ได้โดยไม่บอกเหตุผลคือบั๊กด้าน UX (§10.2)");
    }
  }
}

/** §8.1 — ห้ามใช้ placeholder แทน label */
function checkPlaceholderAsLabel(source, file) {
  const re = /<(TextInput|TextArea|Select|NumberInput)\b([\s\S]*?)\/?>/g;
  let m;
  while ((m = re.exec(source))) {
    const props = m[2];
    if (/\bplaceholder\s*=/.test(props) && !/\baria-label\b|\bid=\{/.test(props)) {
      const line = source.slice(0, m.index).split("\n").length;
      report(SEV.WARN, "placeholder-as-label", file, line,
        `${m[1]} มี placeholder แต่ไม่เห็นการผูกกับ label`,
        "ทุก input ต้องอยู่ใน <FormField label=\"...\"> ห้ามใช้ placeholder แทน label (§8.1)");
    }
  }
}

/* ============================================================
   ตรวจไฟล์ทีละไฟล์
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
  const isDesignSystemInternal = allowInternal;
  let inReducedMotion = false;
  let braceDepthAtReducedMotion = 0;
  let depth = 0;

  eachLine(source, (line, no) => {
    // ติดตามว่าอยู่ใน @media (prefers-reduced-motion) หรือไม่ เพื่ออนุญาต !important ตรงนั้น
    if (/@media[^{]*prefers-reduced-motion/.test(line)) {
      inReducedMotion = true;
      braceDepthAtReducedMotion = depth;
    }
    depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    if (inReducedMotion && depth <= braceDepthAtReducedMotion) inReducedMotion = false;

    for (const rule of CODE_RULES) {
      // design system เองเป็นเจ้าของ token จึงมี hex ได้ในไฟล์ token/style
      if (isDesignSystemInternal && (rule.id === "no-raw-hex" || rule.id === "no-custom-refresh")) continue;
      if (rule.test(line, { inReducedMotion })) {
        report(rule.severity, rule.id, file, no, rule.message, rule.hint);
      }
    }
  });

  if (CODE_EXT.has(ext)) {
    // import ของ UI library ต้องห้าม
    for (const pkg of BANNED_PACKAGES) {
      const idx = source.indexOf(`"${pkg}`) >= 0 ? source.indexOf(`"${pkg}`) : source.indexOf(`'${pkg}`);
      if (idx >= 0 && /\b(import|require)\b/.test(source.slice(Math.max(0, idx - 120), idx))) {
        report(SEV.ERROR, "banned-ui-library", file, source.slice(0, idx).split("\n").length,
          `import จาก UI library ต้องห้าม: ${pkg}`,
          "ใช้ component จาก @csmju2030/design-system เท่านั้น (§16.2 ข้อ 2)");
      }
    }
    if (!allowInternal) {
      checkIconButtonLabels(source, file);
      checkDisabledReason(source, file);
      checkPlaceholderAsLabel(source, file);
    }
  }
}

/* ============================================================
   ตรวจระดับโปรเจกต์
   ============================================================ */
function lintProject() {
  /* --- package.json: UI library ต้องห้าม / DB client ฝั่ง web / design system version --- */
  for (const dir of ["web", "."]) {
    const pkgPath = join(ROOT, dir, "package.json");
    if (!existsSync(pkgPath)) continue;
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch {
      continue;
    }
    const rel = relative(ROOT, pkgPath) || "package.json";
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const isWebPackage = dir === "web" || existsSync(join(ROOT, dir, "next.config.ts")) || existsSync(join(ROOT, dir, "next.config.js"));

    for (const name of Object.keys(deps)) {
      if (BANNED_PACKAGES.some((b) => name === b.replace(/\/$/, "") || name.startsWith(b))) {
        report(SEV.ERROR, "banned-ui-library", rel, 0, `พบ UI library ต้องห้ามใน dependencies: ${name}`,
          "ถอนออกแล้วใช้ component จาก @csmju2030/design-system (§16.2 ข้อ 2)");
      }
      // §16.2 ข้อ 16 — ฝั่ง Next.js ห้ามมี DB client
      if (isWebPackage && BANNED_DB_PACKAGES.includes(name)) {
        report(SEV.ERROR, "no-direct-db", rel, 0, `ฝั่ง Next.js มี DB client: ${name}`,
          "frontend ต้องเรียกผ่าน API ของ NestJS เท่านั้น ห้ามต่อ PostgreSQL ตรง (§16.0, §16.2 ข้อ 16)");
      }
      if (isWebPackage && (name === "vite" || name === "nuxt" || name === "react-scripts")) {
        report(SEV.ERROR, "stack-locked", rel, 0, `พบ framework นอก stack: ${name}`,
          "Stack ล็อกที่ Next.js App Router (§16.0)");
      }
    }
    if (isWebPackage && !deps["@csmju2030/design-system"]) {
      report(SEV.ERROR, "missing-design-system", rel, 0,
        "ไม่พบ @csmju2030/design-system ใน dependencies",
        "npm install @csmju2030/design-system (§3)");
    }
  }

  /* --- Pages Router ต้องไม่มี (§16.2 ข้อ 15) --- */
  for (const p of ["pages", "web/pages", "src/pages", "web/src/pages"]) {
    if (existsSync(join(ROOT, p))) {
      report(SEV.ERROR, "no-pages-router", p, 0, "พบโฟลเดอร์ pages/ (Pages Router)",
        "ใช้ App Router เท่านั้น เพื่อให้ loading.tsx / error.tsx ใช้แทน 3 สถานะบังคับได้ (§16.1.1)");
    }
  }

  /* --- §16.2 ข้อ 3 ระบบย่อยห้ามมีหน้า login --- */
  for (const dir of SCAN_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      const rel = relative(ROOT, file);
      if (/\/(login|signin|sign-in)\/(page|route)\.(t|j)sx?$/.test(rel.split(sep).join("/"))) {
        report(SEV.ERROR, "no-login-page", rel, 0, "ระบบย่อยมีหน้า login ของตัวเอง",
          "การยืนยันตัวตนเป็นของ Core ทั้งหมด ให้ redirect ไป Core ตาม auth-contract §1 (§16.2 ข้อ 3)");
      }
    }
  }

  /* --- §16.1.1 ทุก route segment ต้องมี loading / error / not-found --- */
  const appDirs = ["web/src/app", "src/app", "app", "web/app"].map((d) => join(ROOT, d)).filter(existsSync);
  for (const appDir of appDirs) {
    checkRouteSegments(appDir, appDir);
    checkRootLayout(appDir);
  }

  /* --- §17.2 standards_version ต้องตรงกับ design system --- */
  checkSubsystemManifest();

  /* --- §16.2 ข้อ 17 ห้ามใส่ความลับใน NEXT_PUBLIC_* --- */
  checkEnvFiles();
}

function checkRouteSegments(dir, appRoot) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  const hasPage = entries.some((f) => /^page\.(t|j)sx?$/.test(f));
  if (hasPage) {
    const rel = relative(ROOT, dir);
    // §16.1.1 loading.tsx และ error.tsx บังคับทุก segment ที่มีหน้า
    if (!entries.some((f) => /^loading\.(t|j)sx?$/.test(f))) {
      report(SEV.ERROR, "missing-loading", rel, 0, "route segment นี้ไม่มี loading.tsx",
        "ต้องเป็น Skeleton จาก design system ที่มีรูปร่างใกล้เคียงเนื้อหาจริง ไม่ใช่ spinner กลางจอ (§9.1, §16.1.1)");
    }
    if (!entries.some((f) => /^error\.(t|j)sx?$/.test(f))) {
      report(SEV.ERROR, "missing-error", rel, 0, "route segment นี้ไม่มี error.tsx",
        "ต้องเป็น <ErrorState> + ปุ่ม reset() ห้ามแสดง error.message ดิบ (§16.1.1)");
    }
    // ทุก page ต้อง export metadata ตาม §11.4
    const pageFile = entries.find((f) => /^page\.(t|j)sx?$/.test(f));
    if (pageFile) {
      const src = readFileSync(join(dir, pageFile), "utf8");
      if (!/export\s+(const|async\s+function)\s+(metadata|generateMetadata)/.test(src)) {
        report(SEV.WARN, "missing-metadata", relative(ROOT, join(dir, pageFile)), 0,
          "หน้านี้ไม่ได้ export metadata",
          'ใช้ csmjuTitle({ page, subsystem }) -> "<ชื่อหน้า> · <ชื่อระบบย่อย> · CSMJU" (§11.4)');
      }
    }
  }
  // not-found บังคับที่ราก app/ เท่านั้น (Next.js ใช้ตัวที่ใกล้ที่สุดไล่ขึ้นไป)
  if (dir === appRoot && !entries.some((f) => /^not-found\.(t|j)sx?$/.test(f))) {
    report(SEV.ERROR, "missing-not-found", relative(ROOT, dir), 0, "ไม่มี not-found.tsx ที่ราก app/",
      "ต้องเป็น <EmptyState> ไม่ใช่หน้า error สีแดง (§9.3, §16.1.1)");
  }

  for (const name of entries) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    try {
      if (statSync(full).isDirectory()) checkRouteSegments(full, appRoot);
    } catch {
      /* ข้าม */
    }
  }
}

function checkRootLayout(appDir) {
  const layout = ["layout.tsx", "layout.jsx", "layout.ts", "layout.js"]
    .map((f) => join(appDir, f))
    .find(existsSync);
  const rel = layout ? relative(ROOT, layout) : relative(ROOT, appDir);

  if (!layout) {
    report(SEV.ERROR, "missing-app-shell", rel, 0, "ไม่พบ app/layout.tsx",
      "ทุกระบบย่อยต้องมี root layout ที่ครอบด้วย <CsmjuAppShell> (§5.1)");
    return;
  }

  const src = readFileSync(layout, "utf8");
  if (!/CsmjuAppShell/.test(src)) {
    report(SEV.ERROR, "missing-app-shell", rel, 0, "root layout ไม่ได้ครอบด้วย <CsmjuAppShell>",
      "ทุกหน้าต้องอยู่ใน AppShell — header/sidebar/เมนูผู้ใช้/401 handling มาจากส่วนกลาง (§5.1)");
  }
  // §16.1.1 ห้ามใส่ "use client" ที่ layout ราก
  if (/^\s*["']use client["']/m.test(src)) {
    report(SEV.ERROR, "root-layout-client", rel, 0, 'root layout มี "use client"',
      "layout รากต้องเป็น Server Component (§16.1.1)");
  }
  if (!/lang=["']th["']/.test(src)) {
    report(SEV.WARN, "missing-lang-th", rel, 0, 'ไม่พบ lang="th" ที่ <html>',
      "ช่วยให้ screen reader ออกเสียงภาษาไทยถูกต้อง (§4.3.6)");
  }
}

function checkSubsystemManifest() {
  const manifest = ["subsystem.yaml", "subsystem.yml"].map((f) => join(ROOT, f)).find(existsSync);
  if (!manifest) {
    report(SEV.WARN, "missing-subsystem-yaml", "subsystem.yaml", 0, "ไม่พบ subsystem.yaml",
      "manifest บังคับตาม auth-contract §4 / api-conventions §7 (§16.1)");
    return;
  }
  const src = readFileSync(manifest, "utf8");
  const rel = relative(ROOT, manifest);

  const declared = /design_system_version:\s*["']?([\d.]+)["']?/.exec(src)?.[1];
  const standards = /standards_version:\s*["']?([\d.]+)["']?/.exec(src)?.[1];

  // เวอร์ชันจริงที่ติดตั้งอยู่
  let installed = null;
  for (const p of ["web/node_modules", "node_modules"]) {
    const pkgFile = join(ROOT, p, "@csmju2030", "design-system", "package.json");
    if (existsSync(pkgFile)) {
      try {
        installed = JSON.parse(readFileSync(pkgFile, "utf8")).version;
      } catch {
        /* ข้าม */
      }
      break;
    }
  }

  if (!standards) {
    report(SEV.ERROR, "missing-standards-version", rel, 0, "subsystem.yaml ไม่มี standards_version",
      "ต้องประกาศเวอร์ชันของ ui-design-system.md ที่พัฒนาตาม (§19.2)");
  }

  if (installed && declared && installed !== declared) {
    report(SEV.WARN, "version-mismatch", rel, 0,
      `design_system_version ใน subsystem.yaml (${declared}) ไม่ตรงกับที่ติดตั้งจริง (${installed})`,
      "รัน npm update @csmju2030/design-system แล้วแก้ค่าใน subsystem.yaml ให้ตรง (§18.2)");
  }

  // §17.2 นโยบายเวอร์ชัน: ตามหลัง > 1 minor = เตือน · > 1 major = fail
  if (installed && standards) {
    const [iMaj, iMin] = installed.split(".").map(Number);
    const [sMaj, sMin] = standards.split(".").map(Number);
    if (sMaj < iMaj) {
      report(SEV.ERROR, "standards-outdated", rel, 0,
        `standards_version (${standards}) ตามหลังมาตรฐานปัจจุบัน (${installed}) เกิน 1 major version`,
        "ต้องอัปเกรดก่อน deploy ขึ้น production (§17.2)");
    } else if (sMaj === iMaj && iMin - sMin > 1) {
      report(SEV.WARN, "standards-behind", rel, 0,
        `standards_version (${standards}) ตามหลังมาตรฐานปัจจุบัน (${installed}) เกิน 1 minor version`,
        "ควรอัปเดตภายใน sprint นี้ (§17.5)");
    }
  }
}

/** §16.2 ข้อ 17 — ห้ามใส่ความลับในตัวแปร NEXT_PUBLIC_* */
const SECRET_HINT = /(secret|password|passwd|private_key|api_key|apikey|token|credential)/i;

function checkEnvFiles() {
  const files = [".env", ".env.local", ".env.production", ".env.example", "web/.env", "web/.env.local", "web/.env.example"];
  for (const f of files) {
    const abs = join(ROOT, f);
    if (!existsSync(abs)) continue;
    const rel = relative(ROOT, abs);
    eachLine(readFileSync(abs, "utf8"), (line, no) => {
      const m = /^\s*(NEXT_PUBLIC_[A-Z0-9_]+)\s*=/.exec(line);
      if (m && SECRET_HINT.test(m[1])) {
        report(SEV.ERROR, "public-secret", rel, no, `ตัวแปร ${m[1]} ดูเหมือนเก็บความลับ`,
          "ค่าที่ขึ้นต้น NEXT_PUBLIC_ ถูกฝังลงใน bundle และเปิดเผยต่อสาธารณะ (§16.2 ข้อ 17)");
      }
    });
  }
}

/* ============================================================
   รัน
   ============================================================ */
if (SCAN_DIRS.length === 0) {
  console.error("[csmju-ui-lint] ไม่พบโฟลเดอร์ที่จะตรวจ (web/src, src, app) — ระบุด้วย --path <dir>");
  process.exit(warnOnly ? 0 : 1);
}

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) lintFile(file);
}
if (!allowInternal) lintProject();

const errors = findings.filter((f) => f.severity === SEV.ERROR);
const warnings = findings.filter((f) => f.severity === SEV.WARN);

if (asJson) {
  console.log(JSON.stringify({ errors: errors.length, warnings: warnings.length, findings }, null, 2));
} else {
  const RED = "\x1b[31m", YEL = "\x1b[33m", DIM = "\x1b[2m", RST = "\x1b[0m", BLD = "\x1b[1m";
  console.log(`\n${BLD}csmju-ui-lint${RST} ${DIM}— ตรวจมาตรฐานหน้าจอ CSMJU2030 (ui-design-system.md v1.2.0)${RST}\n`);

  const byFile = new Map();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  for (const [file, list] of byFile) {
    console.log(`${BLD}${file}${RST}`);
    for (const f of list) {
      const tag = f.severity === SEV.ERROR ? `${RED}error${RST}` : `${YEL}warn ${RST}`;
      const loc = f.line ? `${DIM}:${f.line}${RST}` : "";
      console.log(`  ${tag}${loc}  ${f.message}  ${DIM}[${f.rule}]${RST}`);
      if (f.hint) console.log(`         ${DIM}↳ ${f.hint}${RST}`);
    }
    console.log("");
  }

  if (findings.length === 0) {
    console.log("  ✓ ผ่านทุกข้อ\n");
  } else {
    console.log(`${BLD}สรุป:${RST} ${RED}${errors.length} error${RST} · ${YEL}${warnings.length} warning${RST}\n`);
    console.log(`${DIM}อ่านรายละเอียดของแต่ละกฎได้ที่ docs/ui-design-system.md ตามหมายเลขข้อที่อ้างถึง${RST}\n`);
  }
}

process.exit(errors.length > 0 && !warnOnly ? 1 : 0);
