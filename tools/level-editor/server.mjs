import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const publicDir = path.join(__dirname, 'public');
const mapFilePath = path.join(rootDir, 'src', 'config', 'map', 'mapdata.json');
const monsterFilePath = path.join(rootDir, 'src', 'config', 'content', 'monsters.json');
const contentTypeMap = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8'};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const parseMapChaptersFromJson = async () => {
  const raw = await fs.readFile(mapFilePath, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data.MAP_CHAPTERS)) {
    throw new Error('mapdata.json 中未找到 MAP_CHAPTERS 数组');
  }
  return { chapters: data.MAP_CHAPTERS, raw };
};

const writeMapChaptersToJson = async (chapters) => {
  const { raw } = await parseMapChaptersFromJson();
  const data = JSON.parse(raw);
  data.MAP_CHAPTERS = chapters;
  await fs.writeFile(mapFilePath, JSON.stringify(data, null, 2), 'utf-8');
};

const loadMonsters = async () => {
  const raw = await fs.readFile(monsterFilePath, 'utf-8');
  const data = JSON.parse(raw);
  const all = [...(data.normal || []), ...(data.boss || [])];
  return all.map((m) => ({ id: m.id, icon: m.icon || '👾', tier: m.tier || 'normal' }));
};

const serveStatic = async (reqPath, res) => {
  const safePath = reqPath === '/' ? '/index.html' : reqPath;
  const filePath = path.join(publicDir, safePath);
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
};

const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf-8');
  return text ? JSON.parse(text) : {};
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/api/config') {
      const { chapters } = await parseMapChaptersFromJson();
      const monsters = await loadMonsters();
      return sendJson(res, 200, { chapters, monsters });
    }

    if (req.method === 'POST' && url.pathname === '/api/save') {
      const body = await parseBody(req);
      if (!Array.isArray(body.chapters)) {
        return sendJson(res, 400, { error: 'chapters 必须是数组' });
      }
      await writeMapChaptersToJson(body.chapters);
      return sendJson(res, 200, { ok: true });
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

const port = Number(process.env.LEVEL_EDITOR_PORT || 4310);
server.listen(port, '127.0.0.1', () => {
  console.log(`[level-editor] running at http://127.0.0.1:${port}`);
});
