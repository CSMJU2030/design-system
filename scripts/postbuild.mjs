/**
 * ขั้นตอนหลัง tsup — ทำ 2 อย่าง
 *
 * 1) เติมนามสกุลให้ relative specifier
 *    tsup ที่ bundle:false ปล่อย `import ... from "./lib/format"` ไว้แบบไม่มีนามสกุล
 *    ซึ่งใช้ไม่ได้กับ Node ESM และพังกับ CJS (require("./x") จะไปเจอไฟล์ .js ที่เป็น ESM)
 *    จึงเขียนใหม่เป็น ./lib/format.js ในไฟล์ .js และ ./lib/format.cjs ในไฟล์ .cjs
 *
 * 2) คัดลอก CSS และ CLI เข้า dist/
 */
import { readFileSync, writeFileSync, readdirSync, statSync, copyFileSync, mkdirSync, chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, resolve } from "node:path";
import { existsSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

/* ---------- 1) เติมนามสกุล ---------- */
const EXT_FOR = {
  ".js": ".js",
  ".cjs": ".cjs",
  ".mjs": ".mjs",
};
const DTS_EXT_FOR = {
  ".ts": ".js",
  ".cts": ".cjs",
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** เดาว่า specifier ชี้ไปที่ไฟล์หรือโฟลเดอร์ (index) แล้วคืน path ที่มีนามสกุลถูกต้อง */
function resolveSpecifier(fromFile, spec, ext) {
  const base = resolve(dirname(fromFile), spec);
  if (existsSync(base + ext)) return spec + ext;
  if (existsSync(join(base, "index" + ext))) return `${spec}/index${ext}`;
  return spec + ext; // ปล่อยให้ bundler ของระบบย่อยจัดการต่อถ้าหาไม่เจอตอน build
}

let patched = 0;
for (const file of walk(dist)) {
  const ext = extname(file);
  const isCode = ext in EXT_FOR;
  const isDts = file.endsWith(".d.ts") || file.endsWith(".d.cts");
  if (!isCode && !isDts) continue;

  const targetExt = isDts
    ? file.endsWith(".d.cts")
      ? DTS_EXT_FOR[".cts"]
      : DTS_EXT_FOR[".ts"]
    : EXT_FOR[ext];

  const src = readFileSync(file, "utf8");
  // จับทั้ง import/export ... from "./x", require("./x") และ import("./x")
  const next = src.replace(
    /(\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)(["'])(\.[^"']*?)\2/g,
    (whole, prefix, quote, spec) => {
      if (/\.(js|cjs|mjs|json|css)$/.test(spec)) return whole;
      return `${prefix}${quote}${resolveSpecifier(file, spec, targetExt)}${quote}`;
    },
  );

  if (next !== src) {
    writeFileSync(file, next);
    patched += 1;
  }
}

/* ---------- 2) CSS + CLI ---------- */
mkdirSync(dist, { recursive: true });
const styles = join(root, "src", "styles");
for (const f of ["tokens.css", "fonts.css", "base.css", "components.css", "styles.css", "theme.css"]) {
  copyFileSync(join(styles, f), join(dist, f));
}
const cli = join(dist, "csmju-ui-lint.mjs");
copyFileSync(join(root, "tools", "csmju-ui-lint.mjs"), cli);
chmodSync(cli, 0o755);

console.log(`[csmju] postbuild: เติมนามสกุลให้ ${patched} ไฟล์ · คัดลอก css + cli แล้ว`);
