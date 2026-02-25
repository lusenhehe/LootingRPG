const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
      files = files.concat(getFiles(path.join(dir, e.name)));
    } else if (/\.tsx?$/.test(e.name)) {
      files.push(path.join(dir, e.name));
    }
  }
  return files;
}

const projectRoot = path.resolve(__dirname, '../');
const srcDir = path.join(projectRoot, 'src');
const allFiles = getFiles(srcDir);
const imports = new Set();

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const re = /from\s+['"](.+?)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    let imp = m[1];
    if (imp.startsWith('.')) {
      const base = path.resolve(path.dirname(file), imp);
      [
        '.ts',
        '.tsx',
        '/index.ts',
        '/index.tsx',
      ].forEach(ext => {
        const candidate = base + ext;
        if (fs.existsSync(candidate)) {
          imports.add(path.normalize(candidate));
        }
      });
    }
  }
});

// ignore obvious roots and type declaration files
const ignorePatterns = [/\\App\.tsx$/i, /\\main\.tsx$/i, /\\types\\.*\.d\.ts$/i, /\\components\\game\\tabs\\/i];
const orphanFiles = allFiles.filter(f => {
  if (ignorePatterns.some(rx => rx.test(f))) return false;
  return !imports.has(path.normalize(f));
});

console.log('== orphan candidate files ==');
if (orphanFiles.length === 0) {
  console.log('- none -');
  process.exit(0);
}
orphanFiles.forEach(f => console.log(path.relative(projectRoot, f)));
process.exit(1);
