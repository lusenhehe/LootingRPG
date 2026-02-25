const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
        continue;
      }
      files = files.concat(walkFiles(fullPath));
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeToPosix(p) {
  return p.replace(/\\/g, '/');
}

function fileCategory(absFilePath) {
  const rel = normalizeToPosix(path.relative(projectRoot, absFilePath));

  if (!rel.startsWith('src/')) {
    return 'external';
  }

  if (rel.startsWith('src/domains/')) {
    const parts = rel.split('/');
    const domainName = parts[2] || '';
    const domainArea = parts[3] || '';
    return {
      layer: 'domains',
      domainName,
      domainArea,
      rel,
    };
  }

  if (rel.startsWith('src/app/')) return { layer: 'app', rel };
  if (rel.startsWith('src/components/')) return { layer: 'components', rel };
  if (rel.startsWith('src/infra/')) return { layer: 'infra', rel };
  if (rel.startsWith('src/shared/')) return { layer: 'shared', rel };
  if (rel.startsWith('src/hooks/')) return { layer: 'hooks', rel };
  if (rel.startsWith('src/config/')) return { layer: 'config', rel };
  if (rel.startsWith('src/locales/')) return { layer: 'locales', rel };

  return { layer: 'src-root', rel };
}

function resolveImport(sourceFile, specifier) {
  if (specifier.startsWith('@/')) {
    return path.join(srcRoot, specifier.slice(2));
  }
  if (specifier.startsWith('src/')) {
    return path.join(projectRoot, specifier);
  }
  if (specifier.startsWith('.')) {
    return path.resolve(path.dirname(sourceFile), specifier);
  }
  return null;
}

function resolveToExistingFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function getImports(content) {
  const matched = [];
  const seen = new Set();
  const regexes = [
    /import\s+[^'"`]*?from\s*['"`]([^'"`]+)['"`]/g,
    /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /export\s+[^'"`]*?from\s*['"`]([^'"`]+)['"`]/g,
  ];

  for (const re of regexes) {
    let m;
    while ((m = re.exec(content)) !== null) {
      if (!seen.has(m[1])) {
        matched.push(m[1]);
        seen.add(m[1]);
      }
    }
  }
  return matched;
}

function validateRule(importerInfo, importedInfo) {
  const violations = [];

  if (importerInfo.layer === 'domains') {
    if (['app', 'components', 'hooks', 'infra'].includes(importedInfo.layer)) {
      violations.push('domain 不可依赖 app/components/hooks/infra');
    }

    if (importedInfo.layer === 'domains') {
      const importedArea = importedInfo.domainArea;

      if (importedArea === 'ui') {
        violations.push('domain 不可依赖 domains/*/ui');
      }
    }
  }

  if (importerInfo.layer === 'infra') {
    if (['app', 'components', 'hooks'].includes(importedInfo.layer)) {
      violations.push('infra 不可依赖 UI/组装层');
    }

    if (importedInfo.layer === 'domains' && importedInfo.domainArea !== 'ports') {
      violations.push('infra 仅可依赖 domains/*/ports');
    }
  }

  if (['app', 'components', 'hooks'].includes(importerInfo.layer)) {
    if (importedInfo.layer === 'domains' && importedInfo.domainArea === 'ui') {
      violations.push('UI/组装层禁止依赖 domains/*/ui，避免域内 UI 反向耦合');
    }
  }

  return violations;
}

const files = walkFiles(srcRoot);
const allViolations = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const imports = getImports(content);
  const importerInfo = fileCategory(file);

  if (importerInfo.layer === 'external') {
    continue;
  }

  for (const specifier of imports) {
    const resolvedBase = resolveImport(file, specifier);
    if (!resolvedBase) {
      continue;
    }

    const target = resolveToExistingFile(resolvedBase);
    if (!target) {
      continue;
    }

    const importedInfo = fileCategory(target);
    const reasons = validateRule(importerInfo, importedInfo);

    if (reasons.length > 0) {
      allViolations.push({
        file: normalizeToPosix(path.relative(projectRoot, file)),
        specifier,
        target: normalizeToPosix(path.relative(projectRoot, target)),
        reasons,
      });
    }
  }
}

if (allViolations.length === 0) {
  console.log('== architecture check ==');
  console.log('pass: no dependency direction violations');
  process.exit(0);
}

console.error('== architecture check ==');
console.error(`fail: ${allViolations.length} violation(s)`);
for (const issue of allViolations) {
  console.error(`- ${issue.file}`);
  console.error(`  import: ${issue.specifier}`);
  console.error(`  target: ${issue.target}`);
  for (const reason of issue.reasons) {
    console.error(`  reason: ${reason}`);
  }
}

process.exit(1);
