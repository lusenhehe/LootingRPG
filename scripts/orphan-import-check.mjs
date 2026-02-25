#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

const EXCLUDE_SUFFIX = ['.d.ts'];
const ENTRY_FILES = [
  path.join(SRC_DIR, 'main.tsx'),
  path.join(SRC_DIR, 'i18n.ts'),
];

function walk(dir) {
  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === '__tests__') continue;
      out.push(...walk(full));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(item.name)) continue;
    if (EXCLUDE_SUFFIX.some((s) => item.name.endsWith(s))) continue;
    out.push(full);
  }
  return out;
}

function parseImports(content) {
  const regex = /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?["']([^"']+)["']/g;
  const specs = [];
  let m;
  while ((m = regex.exec(content)) !== null) specs.push(m[1]);
  return specs;
}

function resolveImport(from, spec, allSet) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(from), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  for (const c of candidates) {
    if (allSet.has(c)) return c;
  }
  return null;
}

if (!fs.existsSync(SRC_DIR)) {
  console.error('src 目录不存在');
  process.exit(2);
}

const files = walk(SRC_DIR);
const allSet = new Set(files);
const graph = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const deps = [];
  for (const spec of parseImports(content)) {
    const r = resolveImport(file, spec, allSet);
    if (r) deps.push(r);
  }
  graph.set(file, deps);
}

const reachable = new Set();
const stack = ENTRY_FILES.filter((f) => allSet.has(f));

while (stack.length) {
  const cur = stack.pop();
  if (reachable.has(cur)) continue;
  reachable.add(cur);
  for (const d of graph.get(cur) || []) {
    if (!reachable.has(d)) stack.push(d);
  }
}

const orphans = files
  .filter((f) => !reachable.has(f))
  .map((f) => path.relative(ROOT, f))
  .sort();

if (orphans.length === 0) {
  console.log('✅ 未发现无引用 TS/TSX 文件（基于入口 main.tsx + i18n.ts）');
  process.exit(0);
}

console.log(`⚠️ 发现 ${orphans.length} 个潜在无引用文件：`);
for (const o of orphans) console.log(` - ${o}`);
process.exit(1);
