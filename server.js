// นักล่าอัญมณี — เซิร์ฟเวอร์เกม: ส่งหน้าเกม (public/) + ระบบบัญชี/เซฟ/อันดับ (accounts.js)
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { handleApi } = require('./accounts');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8' };
const VERSION = (process.env.RENDER_GIT_COMMIT || crypto.createHash('sha1').update(fs.readFileSync(path.join(PUB, 'index.html'))).digest('hex')).slice(0, 10);

// ไฟล์หน้าเกมใหญ่ (~1.2MB) → บีบอัดครั้งเดียวแล้วเก็บไว้ในหน่วยความจำ
const cache = new Map();
function fileEntry(fp) {
  const st = fs.statSync(fp); let e = cache.get(fp);
  if (e && e.mtime === st.mtimeMs) return e;
  const raw = fs.readFileSync(fp), ext = path.extname(fp), text = /\.(html|js|css|json|svg|txt|webmanifest)$/.test(ext);
  e = { mtime: st.mtimeMs, raw, gz: text ? zlib.gzipSync(raw, { level: 9 }) : null, br: text ? zlib.brotliCompressSync(raw) : null, type: MIME[ext] || 'application/octet-stream', etag: '"' + crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16) + '"' };
  cache.set(fp, e); return e;
}

const server = http.createServer((req, res) => {
  let p; try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (p === '/version') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify({ v: VERSION })); }
  if (p.startsWith('/api/')) return handleApi(req, res, p);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  if (p === '/') p = '/index.html';
  const fp = path.normalize(path.join(PUB, p));
  if (!fp.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end(); }
  let e; try { e = fileEntry(fp); } catch (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('ไม่พบหน้านี้'); }
  const h = { 'Content-Type': e.type, 'ETag': e.etag, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Accept-Encoding' };
  if (req.headers['if-none-match'] === e.etag) { res.writeHead(304, h); return res.end(); }
  const ae = String(req.headers['accept-encoding'] || ''); let body = e.raw;
  if (e.br && /\bbr\b/.test(ae)) { body = e.br; h['Content-Encoding'] = 'br'; } else if (e.gz && /\bgzip\b/.test(ae)) { body = e.gz; h['Content-Encoding'] = 'gzip'; }
  h['Content-Length'] = body.length; res.writeHead(200, h); res.end(req.method === 'HEAD' ? undefined : body);
});
server.listen(PORT, () => console.log('นักล่าอัญมณี server on :' + PORT + ' (v ' + VERSION + ')'));
