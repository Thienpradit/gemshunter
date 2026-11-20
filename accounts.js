// นักล่าอัญมณี — ระบบบัญชีผู้เล่น (สมัคร / เข้าสู่ระบบ / เซฟบนคลาวด์ / อันดับจริง)
// โครงแบบเดียวกับรถไฟซ่า: มี DATABASE_URL (Postgres เช่น Neon) → เก็บในฐานข้อมูล · ไม่มี → เก็บในไฟล์ data/players.json (ไว้ทดสอบในเครื่องเท่านั้น)
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_URL = process.env.DATABASE_URL || '';
const SECRET = process.env.TOKEN_SECRET || crypto.createHash('sha256').update('nlpc:' + (DB_URL || 'dev-secret')).digest('hex');
const MAX_SAVE = 700 * 1024;      // เซฟหนึ่งบัญชีไม่เกิน ~700KB
const MAX_PUB = 6 * 1024;         // ข้อมูลที่โชว์บนบอร์ด (พลอยเม็ดเด่น)
const MAX_LV = 99;

// ---------- storage ----------
let store;
function fileStore(note) {
  const FILE = path.join(__dirname, 'data', 'players.json');
  let db = {}; try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) {}
  let t = null; const flush = () => { clearTimeout(t); t = setTimeout(() => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db)); } catch (e) { console.error('accounts: file write', e.message); } }, 200); };
  console.log('accounts: ' + note);
  const live = () => Object.values(db).filter(u => !u.ban);
  return {
    kind: 'file', ready: Promise.resolve(),
    async get(l) { return db[l] || null; },
    async create(u) { if (db[u.lname]) return false; db[u.lname] = { ...u, rev: 0, lv: 1, gval: 0, pub: u.pub || {}, save: null, created: Date.now(), updated: Date.now() }; flush(); return true; },
    async save(l, save, pub, lv, gval) { const u = db[l]; if (!u) return 0; u.save = save; u.pub = pub; u.lv = lv; u.gval = gval; u.rev = (u.rev || 0) + 1; u.updated = Date.now(); flush(); return u.rev; },
    async setAuth(l, salt, hash) { const u = db[l]; if (u) { u.salt = salt; u.hash = hash; flush(); } },
    async setRecovery(l, rhash) { const u = db[l]; if (u) { u.rhash = rhash; flush(); } },
    async rename(ol, nl, name) { const u = db[ol]; if (!u) return false; if (nl !== ol && db[nl]) return false; delete db[ol]; u.lname = nl; u.name = name; u.updated = Date.now(); db[nl] = u; flush(); return true; },
    async board(n) {
      const all = live();
      return { gems: all.filter(u => u.gval > 0 && u.pub && u.pub.gem).sort((a, b) => b.gval - a.gval || a.updated - b.updated).slice(0, n).map(u => ({ name: u.name, value: u.gval, gem: u.pub.gem, lv: u.lv })),
        levels: all.slice().sort((a, b) => b.lv - a.lv || (b.pub.xp || 0) - (a.pub.xp || 0) || a.updated - b.updated).slice(0, n).map(u => ({ name: u.name, lv: u.lv })), n: all.length };
    },
  };
}
if (DB_URL) {
  const { Pool } = require('pg');
  const url = DB_URL.trim().replace(/[?&]channel_binding=[^&]*/, '').replace(/\?&/, '?');
  const rawPool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false }, max: 5, connectionTimeoutMillis: 25000, idleTimeoutMillis: 30000, keepAlive: true });
  rawPool.on('error', e => console.error('accounts: pool error', e.message));
  // ฐานข้อมูลแบบ serverless (Neon) หลับเมื่อไม่มีคนใช้ ครั้งแรกที่ปลุกอาจต่อไม่ติด/หมดเวลา → ทุกคำสั่งลองซ้ำอีก 2 ครั้งก่อนยอมแพ้
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pool = { async query(q, a) { let err; for (let i = 0; i < 3; i++) { try { return await rawPool.query(q, a); } catch (e) { if (e.code && /^(23|22|42)/.test(e.code)) throw e; err = e; console.error('accounts: query failed (try ' + (i + 1) + ') ' + e.message); await sleep(1500 * (i + 1)); } } throw err; } };
  let dbStore = null, fallback = null;
  const initDb = () => pool.query(`CREATE TABLE IF NOT EXISTS gem_players (
      lname TEXT PRIMARY KEY, name TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, rhash TEXT, ban TEXT,
      save JSONB, pub JSONB NOT NULL DEFAULT '{}', lv INTEGER NOT NULL DEFAULT 1, gval DOUBLE PRECISION NOT NULL DEFAULT 0, rev INTEGER NOT NULL DEFAULT 0,
      created TIMESTAMPTZ NOT NULL DEFAULT now(), updated TIMESTAMPTZ NOT NULL DEFAULT now())`)
    .then(() => pool.query('CREATE INDEX IF NOT EXISTS gem_players_gval ON gem_players (gval DESC)'))
    .then(() => pool.query('CREATE INDEX IF NOT EXISTS gem_players_lv ON gem_players (lv DESC)'));
  // ต่อไม่ติดตอนเริ่ม → ปิดระบบบัญชีชั่วคราว (ไม่ให้เซิร์ฟเวอร์ล่ม) แล้ว "ลองต่อใหม่เองทุก 10 วินาที" จนติด — เดิมพลาดครั้งเดียวแล้วปิดยาวจนกว่าจะรีสตาร์ต
  const retryLater = () => setTimeout(() => initDb().then(() => { store = dbStore; console.log('accounts: database reconnected → using Postgres'); }).catch(e => { if (fallback) fallback.dbError = e.message; console.error('accounts: still no database: ' + e.message); retryLater(); }), 10000);
  const ready = initDb()
    .then(() => { console.log('accounts: using Postgres'); })
    .catch(e => {
      console.error('accounts: database error ' + e.message);
      fallback = store = fileStore('DATABASE FAILED → accounts paused, retrying every 10s'); store.dbError = e.message; retryLater();
    });
  dbStore = {
    kind: 'db', ready,
    async get(l) { await ready; if (store !== dbStore) return store.get(l); const r = await pool.query('SELECT lname,name,salt,hash,rhash,ban,save,pub,lv,gval,rev FROM gem_players WHERE lname=$1', [l]); return r.rows[0] || null; },
    async create(u) { await ready; if (store !== dbStore) return store.create(u); const r = await pool.query('INSERT INTO gem_players (lname,name,salt,hash,rhash,pub) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING lname', [u.lname, u.name, u.salt, u.hash, u.rhash, JSON.stringify(u.pub || {})]); return r.rowCount === 1; },
    async save(l, save, pub, lv, gval) { await ready; if (store !== dbStore) return store.save(l, save, pub, lv, gval); const r = await pool.query('UPDATE gem_players SET save=$2, pub=$3, lv=$4, gval=$5, rev=rev+1, updated=now() WHERE lname=$1 RETURNING rev', [l, JSON.stringify(save), JSON.stringify(pub), lv, gval]); return r.rows[0] ? r.rows[0].rev : 0; },
    async setAuth(l, salt, hash) { await ready; if (store !== dbStore) return store.setAuth(l, salt, hash); await pool.query('UPDATE gem_players SET salt=$2, hash=$3 WHERE lname=$1', [l, salt, hash]); },
    async setRecovery(l, rhash) { await ready; if (store !== dbStore) return store.setRecovery(l, rhash); await pool.query('UPDATE gem_players SET rhash=$2 WHERE lname=$1', [l, rhash]); },
    async rename(ol, nl, name) { await ready; if (store !== dbStore) return store.rename(ol, nl, name);
      try { const r = await pool.query('UPDATE gem_players SET lname=$2, name=$3, updated=now() WHERE lname=$1', [ol, nl, name]); return r.rowCount === 1; }
      catch (e) { if (e.code === '23505') return false; throw e; } },   // 23505 = ชื่อซ้ำ
    async board(n) { await ready; if (store !== dbStore) return store.board(n);
      const g = await pool.query(`SELECT name, gval, lv, pub->'gem' AS gem FROM gem_players WHERE ban IS NULL AND gval > 0 AND pub ? 'gem' ORDER BY gval DESC, updated ASC LIMIT $1`, [n]);
      const l = await pool.query(`SELECT name, lv FROM gem_players WHERE ban IS NULL ORDER BY lv DESC, COALESCE((pub->>'xp')::float,0) DESC, updated ASC LIMIT $1`, [n]);
      const c = await pool.query('SELECT count(*)::int AS n FROM gem_players WHERE ban IS NULL');
      return { gems: g.rows.map(u => ({ name: u.name, value: +u.gval, gem: u.gem, lv: u.lv })), levels: l.rows.map(u => ({ name: u.name, lv: u.lv })), n: c.rows[0].n }; },
  };
  store = dbStore;
} else {
  store = fileStore('no DATABASE_URL → using local file (test only, data is lost when the server restarts on Render)');
}

// บน Render (มีตัวแปร RENDER) ถ้าไม่ได้ต่อฐานข้อมูล → ปิดสมัคร/เข้าสู่ระบบ ไม่ให้บัญชีไปอยู่ในไฟล์ชั่วคราวที่หายตอนรีสตาร์ต
const LIVE = !!process.env.RENDER && !process.env.ALLOW_FILE_STORE;
const accountsDown = () => LIVE && store.kind === 'file';

// ---------- helpers ----------
const b64u = s => Buffer.from(s, 'utf8').toString('base64url');
const unb64u = s => { try { return Buffer.from(s, 'base64url').toString('utf8'); } catch (e) { return ''; } };
const sign = (l, salt) => crypto.createHmac('sha256', SECRET).update(l + ':' + salt).digest('base64url');
const makeToken = u => b64u(u.lname) + '.' + sign(u.lname, u.salt);
const hashPass = (pass, salt) => new Promise((ok, no) => crypto.scrypt(pass, salt, 32, (e, k) => e ? no(e) : ok(k.toString('hex'))));
const lower = n => n.normalize('NFC').toLowerCase();
function cleanName(n) { return String(n || '').normalize('NFC').replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16); }
const heroId = id => id === 'female' || id === 'male' ? id : undefined;
const passOk = p => typeof p === 'string' && p.length >= 4 && p.length <= 64;
// รหัสกู้คืน (ใช้ตอนลืมรหัสผ่าน): 12 ตัว อ่านง่าย ไม่มีตัวที่สับสน (0/O, 1/I) — เก็บแค่ค่า hash
const RC_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newRecovery = () => { const b = crypto.randomBytes(12); let s = ''; for (let i = 0; i < 12; i++) s += RC_CHARS[b[i] % RC_CHARS.length]; return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8); };
const normRecovery = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const hashRecovery = (code, rs) => crypto.createHash('sha256').update(rs + ':' + normRecovery(code)).digest('hex');
function makeRecovery() { const code = newRecovery(), rs = crypto.randomBytes(8).toString('hex'); return { code, rhash: rs + '$' + hashRecovery(code, rs) }; }
function checkRecovery(rhash, code) { const [rs, h] = String(rhash || '').split('$'); if (!rs || !h) return false;
  const a = Buffer.from(h), b = Buffer.from(hashRecovery(code, rs)); return a.length === b.length && crypto.timingSafeEqual(a, b); }
async function authUser(req) {
  const h = req.headers.authorization || ''; const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [a, sig] = tok.split('.'); if (!a || !sig) return null;
  const u = await store.get(unb64u(a)); if (!u || u.ban) return null;
  const want = Buffer.from(sign(u.lname, u.salt)), got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got) ? u : null;
}
function readBody(req, max = MAX_SAVE + 16384) {
  return new Promise(ok => { const parts = []; let n = 0, dead = false;
    req.on('data', c => { if (dead) return; n += c.length; if (n > max) { dead = true; parts.length = 0; return; } parts.push(c); });
    req.on('end', () => { if (dead) return ok({ __tooBig: true }); try { ok(JSON.parse(Buffer.concat(parts).toString('utf8') || '{}')); } catch (e) { ok({}); } });
    req.on('error', () => ok({})); });
}
const ipOf = req => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
const tries = new Map();   // กันเดารหัสผ่าน / สมัครรัว: ต่อ IP ต่อชนิด ไม่เกิน n ครั้ง / 10 นาที
function limited(req, kind, n) { const k = kind + ':' + ipOf(req), now = Date.now(), t = (tries.get(k) || []).filter(x => now - x < 600000); t.push(now); tries.set(k, t); if (tries.size > 20000) tries.clear(); return t.length > n; }

// เซฟที่ส่งมา: ต้องเป็น object ธรรมดา ขนาดไม่เกินกำหนด
function cleanSave(s) { if (!s || typeof s !== 'object' || Array.isArray(s)) return null; let str; try { str = JSON.stringify(s); } catch (e) { return null; } if (str.length > MAX_SAVE) return null; return JSON.parse(str); }
// ข้อมูลขึ้นบอร์ด: เลเวลอ่านจากเซฟเอง (ไม่เชื่อค่าที่ส่งแยกมา) • พลอยเม็ดเด่นต้องเป็นพลอยที่อยู่ในกระเป๋าหรือตู้เซฟของเซฟนั้นจริง
function pubOf(save, pub) {
  const lv = Math.max(1, Math.min(MAX_LV, Math.floor(+save.lv || 1))), out = { xp: Math.max(0, +save.xp || 0) };
  let gval = 0;
  if (pub && typeof pub === 'object' && pub.gem && typeof pub.gem === 'object') {
    const all = [...(Array.isArray(save.inv) ? save.inv : []), ...((save.safe && Array.isArray(save.safe.gems)) ? save.safe.gems : []), ...((save.showcase && typeof save.showcase === 'object' && !Array.isArray(save.showcase)) ? Object.values(save.showcase) : [])];   // กระเป๋า + ตู้เซฟ + ตู้โชว์คอลเลกชัน
    const own = all.find(g => g && g.id === pub.gem.id && g.type === pub.gem.type);
    if (own) { const gs = JSON.stringify(own); if (gs.length <= MAX_PUB) { out.gem = JSON.parse(gs); gval = Math.max(0, Math.min(1e13, Math.floor(+pub.value || 0))); } }
  }
  return { pub: out, lv, gval };
}

// ผู้เล่นออนไลน์: จดเวลาที่แต่ละบัญชีส่งสัญญาณล่าสุด (เก็บในหน่วยความจำ) — นับคนที่ส่งมาภายใน 70 วินาที
const seen = new Map(), ONLINE_MS = 70000;
function touch(l, name, cty) { const o = seen.get(l) || {}; seen.set(l, { t: Date.now(), name: name || o.name || l, cty: cty || o.cty || '' }); }
function onlineCount() { const now = Date.now(); let n = 0; for (const [l, o] of seen) { if (now - o.t > ONLINE_MS) seen.delete(l); else n++; } return n; }
function onlineList() { onlineCount(); return [...seen.values()].map(o => ({ name: o.name, cty: o.cty })).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 200); }
let boardCache = null, boardAt = 0;   // อันดับ: คำนวณใหม่ไม่ถี่กว่า 15 วินาที
async function board() { const now = Date.now(); if (boardCache && now - boardAt < 15000) return boardCache; boardCache = await store.board(50); boardAt = now; return boardCache; }

async function handleApi(req, res, p) {
  const out = (code, obj) => { const b = Buffer.from(JSON.stringify(obj)); res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': b.length }); res.end(b); };
  try {
    if (p === '/api/status') { await store.ready.catch(() => {}); return out(200, { gem: true, accounts: !accountsDown(), online: onlineCount(), store: store.kind, dbError: store.dbError || undefined }); }
    if (p === '/api/board' && req.method === 'GET') return out(200, { ...(await board()), online: onlineCount() });
    if (p === '/api/showcase' && req.method === 'GET') {   // ตู้โชว์คอลเลกชันของผู้เล่น (ดูได้ทุกคน อ่านอย่างเดียว): ส่งเฉพาะชื่อ เลเวล และพลอยในตู้โชว์
      if (accountsDown()) return out(503, { err: 'ระบบบัญชีปิดชั่วคราว' });
      if (limited(req, p, 240)) return out(429, { err: 'ดูถี่เกินไป รอสักครู่แล้วลองใหม่' });
      let name = ''; try { name = cleanName(new URL(req.url, 'http://x').searchParams.get('name')); } catch (e) {}
      const t = name ? await store.get(lower(name)) : null; if (!t || t.ban) return out(404, { err: 'ไม่พบผู้เล่นนี้' });
      const src = t.save && typeof t.save.showcase === 'object' && t.save.showcase ? t.save.showcase : {}, sc = {}; let n = 0;
      for (const k in src) { if (n >= 500) break; const g = src[k]; if (!/^([a-z]{2,16}\|)?[a-z]{2,24}(:[0-4])?$/.test(k) || !g || typeof g !== 'object') continue; const js = JSON.stringify(g); if (js.length > 800) continue; sc[k] = JSON.parse(js); n++; }
      return out(200, { name: t.name, lv: t.lv | 0, showcase: sc });
    }
    if (accountsDown()) return out(503, { err: 'ระบบบัญชีปิดชั่วคราว (เซิร์ฟเวอร์ต่อฐานข้อมูลไม่ได้) ลองใหม่อีกครั้งภายหลัง' });

    if (p === '/api/register' || p === '/api/login') {
      if (req.method !== 'POST') return out(405, { err: 'POST only' });
      if (limited(req, p, p === '/api/register' ? 12 : 30)) return out(429, { err: 'ลองหลายครั้งเกินไป รอ 10 นาทีแล้วลองใหม่' });
      const b = await readBody(req, 8192), name = cleanName(b.name), pass = String(b.pass || '');
      if (p === '/api/register') {
        if ([...name].length < 2) return out(400, { err: 'ชื่อต้องยาว 2–16 ตัวอักษร' });
        if (!passOk(pass)) return out(400, { err: 'รหัสผ่านต้องยาว 4–64 ตัวอักษร' });
        const salt = crypto.randomBytes(16).toString('hex'), hash = await hashPass(pass, salt), rc = makeRecovery();
        const hero = heroId(b.hero);
        if (b.hero != null && !hero) return out(400, { err: 'รูปแบบตัวละครไม่ถูกต้อง' });
        const u = { lname: lower(name), name, salt, hash, rhash: rc.rhash, pub: hero ? { hero } : {} };
        if (!await store.create(u)) return out(409, { err: 'ชื่อนี้มีคนใช้แล้ว ลองชื่ออื่น' });
        boardCache = null;
        return out(200, { token: makeToken(u), name, recovery: rc.code, hero, save: null, rev: 0 });
      }
      const u = await store.get(lower(name));
      if (!u || !passOk(pass)) return out(401, { err: 'ชื่อหรือรหัสผ่านไม่ถูกต้อง' });
      const h = Buffer.from(await hashPass(pass, u.salt)), w = Buffer.from(u.hash);
      if (h.length !== w.length || !crypto.timingSafeEqual(h, w)) return out(401, { err: 'ชื่อหรือรหัสผ่านไม่ถูกต้อง' });
      if (u.ban) return out(403, { err: 'บัญชีนี้ถูกระงับ: ' + u.ban });
      return out(200, { token: makeToken(u), name: u.name, hero: heroId(u.save?.hero || u.pub?.hero), save: u.save || null, rev: u.rev || 0 });
    }
    if (p === '/api/reset') {   // ลืมรหัสผ่าน: ชื่อ + รหัสกู้คืน → ตั้งรหัสผ่านใหม่ (ได้รหัสกู้คืนชุดใหม่ด้วย)
      if (req.method !== 'POST') return out(405, { err: 'POST only' });
      if (limited(req, p, 10)) return out(429, { err: 'ลองหลายครั้งเกินไป รอ 10 นาทีแล้วลองใหม่' });
      const b = await readBody(req, 8192), u = await store.get(lower(cleanName(b.name))), pass = String(b.pass || '');
      if (!passOk(pass)) return out(400, { err: 'รหัสผ่านใหม่ต้องยาว 4–64 ตัวอักษร' });
      if (!u || !checkRecovery(u.rhash, b.code)) return out(401, { err: 'ชื่อหรือรหัสกู้คืนไม่ถูกต้อง' });
      const salt = crypto.randomBytes(16).toString('hex'), hash = await hashPass(pass, salt), rc = makeRecovery();
      await store.setAuth(u.lname, salt, hash); await store.setRecovery(u.lname, rc.rhash);
      return out(200, { token: makeToken({ lname: u.lname, salt }), name: u.name, recovery: rc.code, hero: heroId(u.save?.hero || u.pub?.hero), save: u.save || null, rev: u.rev || 0 });
    }

    const u = await authUser(req);
    if (!u) return out(401, { err: 'ต้องเข้าสู่ระบบใหม่' });
    touch(u.lname, u.name);
    if (p === '/api/ping') { if (req.method === 'POST') { const b = await readBody(req, 1024); const c = String(b.cty || ''); if (/^[a-z]{2,12}$/.test(c)) touch(u.lname, u.name, c); } return out(200, { online: onlineCount() }); }
    if (p === '/api/online') return out(200, { online: onlineCount(), list: onlineList() });
    if (p === '/api/me' && req.method === 'GET') return out(200, { name: u.name, hero: heroId(u.save?.hero || u.pub?.hero), save: u.save || null, rev: u.rev || 0 });
    if (p === '/api/save' && req.method === 'POST') {
      const b = await readBody(req); if (b.__tooBig) return out(413, { err: 'เซฟใหญ่เกินไป' });
      const save = cleanSave(b.save); if (!save) return out(400, { err: 'เซฟไม่ถูกต้อง' });
      // rev = เลขรุ่นของเซฟบนเซิร์ฟเวอร์ที่เครื่องนี้ถืออยู่ — ถ้าไม่ตรง แปลว่ามีอีกเครื่องเซฟทับไปแล้ว → ไม่เขียนทับ ให้เครื่องนี้โหลดของใหม่
      if ((b.rev | 0) !== (u.rev | 0)) return out(409, { err: 'มีการเล่นบัญชีนี้จากอีกเครื่อง', rev: u.rev | 0 });
      const P = pubOf(save, b.pub), rev = await store.save(u.lname, save, P.pub, P.lv, P.gval);
      return out(200, { ok: true, rev });
    }
    if (p === '/api/password' && req.method === 'POST') {   // เปลี่ยนรหัสผ่าน (token เดิมของทุกเครื่องใช้ไม่ได้อีก)
      const b = await readBody(req, 8192), old = String(b.old || ''), pass = String(b.pass || '');
      if (!passOk(pass)) return out(400, { err: 'รหัสผ่านใหม่ต้องยาว 4–64 ตัวอักษร' });
      const h = Buffer.from(passOk(old) ? await hashPass(old, u.salt) : ''), w = Buffer.from(u.hash);
      if (h.length !== w.length || !crypto.timingSafeEqual(h, w)) return out(401, { err: 'รหัสผ่านเดิมไม่ถูกต้อง' });
      const salt = crypto.randomBytes(16).toString('hex'), hash = await hashPass(pass, salt); await store.setAuth(u.lname, salt, hash);
      return out(200, { token: makeToken({ lname: u.lname, salt }) });
    }
    if (p === '/api/rename' && req.method === 'POST') {   // เปลี่ยนชื่อผู้เล่น (ตอนนี้ฟรี) · token ใหม่ผูกกับชื่อใหม่ (เครื่องอื่นต้องเข้าสู่ระบบด้วยชื่อใหม่)
      if (limited(req, p, 6)) return out(429, { err: 'เปลี่ยนชื่อบ่อยเกินไป รอ 10 นาทีแล้วลองใหม่' });
      const b = await readBody(req, 8192), name = cleanName(b.name), nl = lower(name);
      if ([...name].length < 2) return out(400, { err: 'ชื่อต้องยาว 2–16 ตัวอักษร' });
      if (name === u.name) return out(400, { err: 'ชื่อนี้เป็นชื่อปัจจุบันอยู่แล้ว' });
      if (!await store.rename(u.lname, nl, name)) return out(409, { err: 'ชื่อนี้มีคนใช้แล้ว ลองชื่ออื่น' });
      boardCache = null; seen.delete(u.lname); touch(nl);
      return out(200, { token: makeToken({ lname: nl, salt: u.salt }), name });
    }
    if (p === '/api/recovery' && req.method === 'POST') { const rc = makeRecovery(); await store.setRecovery(u.lname, rc.rhash); return out(200, { code: rc.code }); }
    return out(404, { err: 'not found' });
  } catch (e) { console.error('api error', p, e); return out(500, { err: 'เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง' }); }
}
module.exports = { handleApi };
