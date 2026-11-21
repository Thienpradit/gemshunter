// นักล่าอัญมณี — ตลาดเทรดพลอยระหว่างผู้เล่น (ลงขาย / ซื้อ / ยกเลิก / รับเงิน)
// หลักกันโกง: ทุกรายการที่เกี่ยวกับพลอยและเงิน "เซิร์ฟเวอร์เป็นคนทำ" ในธุรกรรมเดียว (transaction)
//  • ลงขาย   → เซิร์ฟเวอร์หยิบพลอยออกจากเซฟของผู้ขายเอง (ใช้ข้อมูลพลอยจากเซฟบนเซิร์ฟเวอร์ ไม่เชื่อข้อมูลที่เครื่องส่งมา)
//  • ซื้อ     → ล็อกประกาศ + ล็อกบัญชีผู้ซื้อ → หักเงิน + ใส่พลอย + ปิดประกาศ พร้อมกัน (สองคนกดซื้อพร้อมกัน ได้แค่คนเดียว)
//  • เงินผู้ขาย → พักไว้ที่ตลาด ผู้ขายกดรับเอง (รับได้ครั้งเดียว)
//  • ทุกรายการต้องส่งเลขรุ่นเซฟ (rev) ที่ตรงกับเซิร์ฟเวอร์ → เครื่องที่ถือเซฟเก่าทำรายการไม่ได้ และเซฟเก่าเขียนทับไม่ได้
//  • พลอยที่ออกจากบัญชีไปแล้ว (ฝากขาย/ขายแล้ว) ถูกจดเลขไว้ → ถ้าเซฟที่ส่งมาทีหลังยังมีเม็ดนั้น เซิร์ฟเวอร์ตัดทิ้ง (กันพลอยงอก)
const FEE = 0.05;                       // ค่าธรรมเนียมตลาด หักจากผู้ขายตอนขายได้
const MAX_OPEN = 10;                    // ประกาศที่ค้างอยู่ได้พร้อมกันต่อคน
const TTL_MS = 3 * 24 * 3600 * 1000;    // อายุประกาศ 3 วัน
const MIN_PRICE = 1, MAX_PRICE = 3e10;  // หน่วยเหรียญในเกม (แสดงผลเป็นบาท ×33)
const PRICE_LO = 0.5, PRICE_HI = 10;    // ช่วงราคาที่ตั้งได้ เทียบกับราคาประเมิน
const PAGE = 30, GONE_MAX = 3000;
const SHAPES = ['oval', 'cushion', 'round', 'emerald', 'pear', 'marquise', 'heart', 'trillion', 'princess', 'cabochon'];
const SORTS = { new: 'created DESC, id DESC', old: 'created ASC, id ASC', cheap: 'price ASC, id ASC', dear: 'price DESC, id ASC', big: 'carat DESC, id ASC', clean: 'flaw ASC, price ASC, id ASC' };

class MErr extends Error { constructor(status, msg, extra) { super(msg); this.status = status; this.extra = extra || {}; } }
const fail = (status, msg, extra) => { throw new MErr(status, msg, extra); };
const int = (v, lo, hi) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };

// พลอยที่ลงขายได้: ตรวจรูปร่างข้อมูลทุกช่อง (ค่าที่อยู่นอกช่วงของเกม = ไม่รับ)
function cleanGem(g) {
  if (!g || typeof g !== 'object' || Array.isArray(g)) return null;
  const type = typeof g.type === 'string' && /^[a-z]{2,24}$/.test(g.type) ? g.type : null, state = g.state === 'cut' ? 'cut' : g.state === 'raw' ? 'raw' : null;
  const carat = Number(g.carat), color = int(g.color, 0, 4), flaw = int(g.flaw, 0, 5), id = int(g.id, 1, 9e15);
  if (!type || !state || id == null || color == null || flaw == null || !(carat >= 0.01 && carat <= 80)) return null;
  const o = { id, type, state, carat: Math.round(carat * 100) / 100, color, flaw, seed: int(g.seed, -2147483648, 2147483647) || 1, zone: typeof g.zone === 'string' && /^[a-z]{2,12}$/.test(g.zone) ? g.zone : 'gravel',
    origin: typeof g.origin === 'string' && /^[a-z]{2,16}$/.test(g.origin) ? g.origin : 'thai', clean: int(g.clean, 1, 100) || 50, t: int(g.t, 0, 9e15) || Date.now() };
  if (g.jumbo === true) o.jumbo = true;
  if (state === 'cut') {
    if (!SHAPES.includes(g.shape)) return null;
    const polish = Number(g.polish), rc = Number(g.rawCarat);
    o.shape = g.shape; o.polish = polish >= 0.3 && polish <= 1.3 ? polish : 0.95; o.mode = g.mode === 'avoid' ? 'avoid' : typeof g.mode === 'string' && /^[a-z]{2,10}$/.test(g.mode) ? g.mode : 'keep';
    o.by = typeof g.by === 'string' && /^[a-z0-9_]{1,16}$/i.test(g.by) ? g.by : 'self'; o.rawCarat = rc >= o.carat && rc <= 200 ? Math.round(rc * 100) / 100 : o.carat;
  }
  return o;
}
// ที่เก็บพลอยทั้งหมดในเซฟ (กระเป๋า ตู้เซฟ ตู้โชว์ คิวเจีย ถุงตอนหมดสติ)
function stripGone(save, gone) {
  if (!gone || !gone.length || !save || typeof save !== 'object') return 0; const S = new Set(gone); let n = 0;
  const keep = g => { if (g && S.has(Number(g.id))) { n++; return false; } return true; };
  if (Array.isArray(save.inv)) save.inv = save.inv.filter(keep);
  if (save.safe && Array.isArray(save.safe.gems)) save.safe.gems = save.safe.gems.filter(keep);
  if (save.showcase && typeof save.showcase === 'object' && !Array.isArray(save.showcase)) for (const k of Object.keys(save.showcase)) if (!keep(save.showcase[k])) delete save.showcase[k];
  if (save.queue && Array.isArray(save.queue.jobs)) save.queue.jobs = save.queue.jobs.filter(j => !j || keep(j.gem));
  if (Array.isArray(save.deathBags)) for (const b of save.deathBags) if (b && Array.isArray(b.gems)) b.gems = b.gems.filter(keep);
  return n;
}
const mktOf = u => { const m = u.mkt && typeof u.mkt === 'object' ? u.mkt : {}; return { gone: Array.isArray(m.gone) ? m.gone.map(Number).filter(Number.isFinite) : [] }; };
const pubRow = (r, me) => ({ id: Number(r.id), seller: r.seller_name, gem: r.gem, price: Number(r.price), t: +new Date(r.created), exp: +new Date(r.expires), mine: r.seller === me || undefined });
const rowsOf = l => ({ id: Number(l.id), gem: l.gem, price: Number(l.price), status: l.status, t: +new Date(l.created), exp: +new Date(l.expires), buyer: l.buyer_name || undefined, sold: l.sold_at ? +new Date(l.sold_at) : undefined, paid: !!l.paid, net: l.status === 'sold' ? Number(l.price) - Number(l.fee || 0) : undefined, seller: l.seller_name });

// ---------- ที่เก็บแบบไฟล์ (ทดสอบในเครื่อง): ทำทีละรายการ + ย้อนคืนเมื่อผิดพลาด ----------
function attachFile(store, raw) {
  const M = raw.market || (raw.market = { seq: 0, rows: [] }); let chain = Promise.resolve();
  const live = r => r.status === 'active' && +new Date(r.expires) > Date.now();
  store.mtx = fn => { const run = async () => { const snapU = JSON.stringify(raw.users()), snapM = JSON.stringify(M);
    const t = {
      async user(l) { return raw.users()[l] || null; },
      async putUser(u, save, mkt, pub, gval) { const x = raw.users()[u.lname]; x.save = save; x.mkt = mkt; x.pub = pub; x.gval = gval; x.rev = (x.rev || 0) + 1; x.updated = Date.now(); return x.rev; },
      async listing(id) { return M.rows.find(r => r.id === id) || null; },
      async addListing(o) { const r = { id: ++M.seq, status: 'active', paid: false, fee: 0, created: Date.now(), ...o }; M.rows.push(r); return r.id; },
      async setListing(id, f) { Object.assign(M.rows.find(r => r.id === id), f); },
      async openCount(l) { return M.rows.filter(r => r.seller === l && r.status === 'active').length; },
      async unpaid(l) { return M.rows.filter(r => r.seller === l && r.status === 'sold' && !r.paid); },
      async markPaid(ids) { for (const r of M.rows) if (ids.includes(r.id)) r.paid = true; },
    };
    try { const r = await fn(t); raw.flush(); return r; } catch (e) { raw.restore(JSON.parse(snapU)); const m = JSON.parse(snapM); M.seq = m.seq; M.rows = m.rows; throw e; } };
    const p = chain.then(run, run); chain = p.catch(() => {}); return p; };
  store.mBrowse = async f => { let L = M.rows.filter(live);
    if (f.type) L = L.filter(r => r.gem.type === f.type); if (f.state) L = L.filter(r => r.gem.state === f.state); if (f.origin) L = L.filter(r => r.gem.origin === f.origin);
    if (f.color != null) L = L.filter(r => r.gem.color === f.color); if (f.shape) L = L.filter(r => r.gem.shape === f.shape); if (f.flaw != null) L = L.filter(r => r.gem.flaw <= f.flaw);
    if (f.min != null) L = L.filter(r => r.price >= f.min); if (f.max != null) L = L.filter(r => r.price <= f.max);
    const cmp = { new: (a, b) => b.created - a.created || b.id - a.id, old: (a, b) => a.created - b.created, cheap: (a, b) => a.price - b.price || a.id - b.id, dear: (a, b) => b.price - a.price || a.id - b.id, big: (a, b) => b.gem.carat - a.gem.carat, clean: (a, b) => a.gem.flaw - b.gem.flaw || a.price - b.price }[f.sort];
    L.sort(cmp); return { total: L.length, rows: L.slice(f.page * PAGE, f.page * PAGE + PAGE) }; };
  store.mFacets = async () => { const o = {}; for (const r of M.rows.filter(live)) o[r.gem.type] = (o[r.gem.type] || 0) + 1; return o; };
  store.mMine = async l => ({ open: M.rows.filter(r => r.seller === l && (r.status === 'active' || (r.status === 'sold' && !r.paid))).sort((a, b) => b.created - a.created), hist: M.rows.filter(r => (r.seller === l && r.status === 'sold' && r.paid) || (r.buyer === l && r.status === 'sold')).sort((a, b) => b.sold_at - a.sold_at).slice(0, 20) });
  store.mRecent = async (type, state) => M.rows.filter(r => r.status === 'sold' && r.gem.type === type && r.gem.state === state).sort((a, b) => b.sold_at - a.sold_at).slice(0, 8);
  store.mDue = async l => M.rows.filter(r => r.seller === l && r.status === 'sold' && !r.paid).length;
  store.mRename = async (ol, nl, name) => { for (const r of M.rows) { if (r.seller === ol) { r.seller = nl; r.seller_name = name; } if (r.buyer === ol) { r.buyer = nl; r.buyer_name = name; } } raw.flush(); };
}

// ---------- ที่เก็บแบบ Postgres ----------
const DDL = [
  `CREATE TABLE IF NOT EXISTS gem_market (
     id BIGSERIAL PRIMARY KEY, seller TEXT NOT NULL, seller_name TEXT NOT NULL, gem JSONB NOT NULL, gid BIGINT NOT NULL,
     type TEXT NOT NULL, state TEXT NOT NULL, color INTEGER NOT NULL, flaw INTEGER NOT NULL, shape TEXT, origin TEXT NOT NULL, carat DOUBLE PRECISION NOT NULL,
     price BIGINT NOT NULL CHECK (price > 0), fee BIGINT NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', paid BOOLEAN NOT NULL DEFAULT false,
     buyer TEXT, buyer_name TEXT, created TIMESTAMPTZ NOT NULL DEFAULT now(), expires TIMESTAMPTZ NOT NULL, sold_at TIMESTAMPTZ)`,
  'CREATE INDEX IF NOT EXISTS gem_market_live ON gem_market (status, type, price)',
  'CREATE INDEX IF NOT EXISTS gem_market_seller ON gem_market (seller, status)',
  'CREATE INDEX IF NOT EXISTS gem_market_buyer ON gem_market (buyer, sold_at DESC)',
  'CREATE INDEX IF NOT EXISTS gem_market_sold ON gem_market (type, state, sold_at DESC) WHERE status = \'sold\'',
  'ALTER TABLE gem_players ADD COLUMN IF NOT EXISTS mkt JSONB',
];
function attachDb(store, pool, rawPool) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const connect = async () => { let err; for (let i = 0; i < 3; i++) { try { return await rawPool.connect(); } catch (e) { err = e; await sleep(1200 * (i + 1)); } } throw err; };
  const txT = c => ({
    async user(l) { const r = await c.query('SELECT lname,name,save,pub,lv,gval,rev,mkt,ban FROM gem_players WHERE lname=$1 FOR UPDATE', [l]); return r.rows[0] || null; },
    async putUser(u, save, mkt, pub, gval) { const r = await c.query('UPDATE gem_players SET save=$2, mkt=$3, pub=$4, gval=$5, rev=rev+1, updated=now() WHERE lname=$1 RETURNING rev', [u.lname, JSON.stringify(save), JSON.stringify(mkt), JSON.stringify(pub || {}), gval || 0]); return r.rows[0].rev; },
    async listing(id) { const r = await c.query('SELECT * FROM gem_market WHERE id=$1 FOR UPDATE', [id]); return r.rows[0] || null; },
    async addListing(o) { const g = o.gem, r = await c.query('INSERT INTO gem_market (seller,seller_name,gem,gid,type,state,color,flaw,shape,origin,carat,price,expires) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id',
      [o.seller, o.seller_name, JSON.stringify(g), o.gid, g.type, g.state, g.color, g.flaw, g.shape || null, g.origin, g.carat, o.price, new Date(o.expires)]); return Number(r.rows[0].id); },
    async setListing(id, f) { const k = Object.keys(f), v = k.map(x => x === 'sold_at' && f[x] ? new Date(f[x]) : f[x]); await c.query(`UPDATE gem_market SET ${k.map((x, i) => x + '=$' + (i + 2)).join(',')} WHERE id=$1`, [id, ...v]); },
    async openCount(l) { const r = await c.query("SELECT count(*)::int AS n FROM gem_market WHERE seller=$1 AND status='active'", [l]); return r.rows[0].n; },
    async unpaid(l) { const r = await c.query("SELECT * FROM gem_market WHERE seller=$1 AND status='sold' AND NOT paid ORDER BY id FOR UPDATE", [l]); return r.rows; },
    async markPaid(ids) { await c.query('UPDATE gem_market SET paid=true WHERE id = ANY($1::bigint[])', [ids]); },
  });
  store.mtx = async fn => { for (let attempt = 0; ; attempt++) { const c = await connect(); let done = false;
    try { await c.query('BEGIN'); const r = await fn(txT(c)); await c.query('COMMIT'); done = true; return r; }
    catch (e) { if (!done) { try { await c.query('ROLLBACK'); } catch (e2) {} } if (!(e instanceof MErr) && (e.code === '40P01' || e.code === '40001') && attempt < 2) { await sleep(60 + Math.random() * 120); continue; } throw e; }
    finally { c.release(); } } };
  store.mBrowse = async f => { const w = ["status='active'", 'expires > now()'], a = []; const add = (sql, v) => { a.push(v); w.push(sql.replace('?', '$' + a.length)); };
    if (f.type) add('type=?', f.type); if (f.state) add('state=?', f.state); if (f.origin) add('origin=?', f.origin); if (f.color != null) add('color=?', f.color); if (f.shape) add('shape=?', f.shape); if (f.flaw != null) add('flaw<=?', f.flaw);
    if (f.min != null) add('price>=?', f.min); if (f.max != null) add('price<=?', f.max);
    const W = w.join(' AND '), c = await pool.query(`SELECT count(*)::int AS n FROM gem_market WHERE ${W}`, a);
    const r = await pool.query(`SELECT id,seller,seller_name,gem,price,created,expires FROM gem_market WHERE ${W} ORDER BY ${SORTS[f.sort]} LIMIT ${PAGE} OFFSET ${f.page * PAGE}`, a);
    return { total: c.rows[0].n, rows: r.rows }; };
  store.mFacets = async () => { const r = await pool.query("SELECT type, count(*)::int AS n FROM gem_market WHERE status='active' AND expires > now() GROUP BY type"); const o = {}; for (const x of r.rows) o[x.type] = x.n; return o; };
  store.mMine = async l => { const o = await pool.query("SELECT * FROM gem_market WHERE seller=$1 AND (status='active' OR (status='sold' AND NOT paid)) ORDER BY created DESC LIMIT 60", [l]);
    const h = await pool.query("SELECT * FROM gem_market WHERE status='sold' AND ((seller=$1 AND paid) OR buyer=$1) ORDER BY sold_at DESC LIMIT 20", [l]); return { open: o.rows, hist: h.rows }; };
  store.mRecent = async (type, state) => (await pool.query("SELECT gem,price,sold_at FROM gem_market WHERE status='sold' AND type=$1 AND state=$2 ORDER BY sold_at DESC LIMIT 8", [type, state])).rows;
  store.mDue = async l => (await pool.query("SELECT count(*)::int AS n FROM gem_market WHERE seller=$1 AND status='sold' AND NOT paid", [l])).rows[0].n;
  store.mRename = async (ol, nl, name) => { await pool.query('UPDATE gem_market SET seller=$2, seller_name=$3 WHERE seller=$1', [ol, nl, name]); await pool.query('UPDATE gem_market SET buyer=$2, buyer_name=$3 WHERE buyer=$1', [ol, nl, name]); };
}

// ---------- แจ้งเตือน "ขายได้แล้ว มีเงินรอรับ" (จำในหน่วยความจำ ถามฐานข้อมูลครั้งแรกครั้งเดียวต่อบัญชี) ----------
const due = new Map();
async function dueOf(store, l) { if (!store.mDue) return 0; if (due.has(l)) return due.get(l); due.set(l, 0); try { const n = await store.mDue(l); due.set(l, n); return n; } catch (e) { due.delete(l); return 0; } }
let facetCache = null, facetAt = 0;

// ---------- รายการ ----------
// เซฟของบัญชี (ล็อกแล้ว) ต้องเป็นรุ่นเดียวกับที่เครื่องถืออยู่ → กันเครื่องเก่า/สองเครื่องทำรายการซ้อนกัน
function needRev(u, rev) { if (!u || u.ban) fail(401, 'ต้องเข้าสู่ระบบใหม่'); if (!u.save || typeof u.save !== 'object') fail(409, 'ยังไม่มีเซฟบนเซิร์ฟเวอร์ ลองใหม่อีกครั้ง', { code: 'rev' }); if ((rev | 0) !== (u.rev | 0)) fail(409, 'ข้อมูลในเครื่องไม่ตรงกับเซิร์ฟเวอร์ กำลังปรับให้ตรง ลองใหม่อีกครั้ง', { code: 'rev', rev: u.rev | 0 }); }
const coinsOf = s => Math.max(0, Math.floor(Number(s.coins) || 0));
// พลอยเม็ดเด่นบนบอร์ดอันดับ: ถ้าเม็ดนั้นออกจากบัญชีไปแล้ว เอาออกจากบอร์ดทันที (เครื่องจะส่งเม็ดเด่นเม็ดใหม่มากับเซฟครั้งถัดไป)
function pubAfter(u, gid) { const pub = u.pub && typeof u.pub === 'object' ? { ...u.pub } : {}; let gval = +u.gval || 0; if (pub.gem && Number(pub.gem.id) === gid) { delete pub.gem; gval = 0; } return { pub, gval }; }

async function opList(store, me, b) {
  const price = int(b.price, MIN_PRICE, MAX_PRICE), gid = int(b.gid, 1, 9e15), est = Number(b.est);
  if (price == null) fail(400, 'ราคาไม่ถูกต้อง'); if (gid == null) fail(400, 'ไม่พบพลอยเม็ดนี้');
  if (est > 0 && (price < Math.floor(est * PRICE_LO) || price > Math.ceil(est * PRICE_HI))) fail(400, 'ราคาต้องอยู่ระหว่างครึ่งหนึ่ง ถึง 10 เท่าของราคาประเมิน');
  return store.mtx(async t => {
    const u = await t.user(me); needRev(u, b.rev);
    if (await t.openCount(me) >= MAX_OPEN) fail(400, `ลงขายได้พร้อมกันไม่เกิน ${MAX_OPEN} เม็ด — รอขายออกหรือรับคืนเม็ดเก่าก่อน`);
    const save = u.save, inv = Array.isArray(save.inv) ? save.inv : [], sg = save.safe && Array.isArray(save.safe.gems) ? save.safe.gems : [];
    let arr = inv, i = inv.findIndex(g => g && Number(g.id) === gid); if (i < 0) { arr = sg; i = sg.findIndex(g => g && Number(g.id) === gid); }
    if (i < 0) fail(409, 'ไม่พบพลอยเม็ดนี้ในกระเป๋าหรือตู้เซฟบนเซิร์ฟเวอร์', { code: 'rev', rev: u.rev | 0 });
    const gem = cleanGem(arr[i]); if (!gem) fail(400, 'พลอยเม็ดนี้ลงขายไม่ได้ (ข้อมูลพลอยไม่ถูกต้อง)');
    arr.splice(i, 1);
    const mkt = mktOf(u); mkt.gone = mkt.gone.filter(x => x !== gid); mkt.gone.push(gid); if (mkt.gone.length > GONE_MAX) mkt.gone = mkt.gone.slice(-GONE_MAX);
    stripGone(save, [gid]);   // เม็ดเลขเดียวกันที่ซ้ำอยู่ที่อื่นในเซฟ (ไม่ควรมี) ถูกตัดออกด้วย
    const exp = Date.now() + TTL_MS, id = await t.addListing({ seller: me, seller_name: u.name, gem, gid, price, expires: exp });
    const P = pubAfter(u, gid), rev = await t.putUser(u, save, mkt, P.pub, P.gval);
    return { ok: true, rev, id, exp };
  });
}
async function opBuy(store, me, b) {
  const id = int(b.id, 1, 9e15); if (id == null) fail(400, 'ไม่พบประกาศนี้');
  const r = await store.mtx(async t => {
    const L = await t.listing(id);   // ล็อกประกาศก่อน: คนที่มาทีหลังต้องรอ แล้วจะเห็นว่าขายไปแล้ว
    if (!L || L.status !== 'active') fail(410, 'พลอยเม็ดนี้ถูกซื้อไปแล้ว หรือผู้ขายยกเลิกแล้ว', { code: 'gone' });
    if (+new Date(L.expires) <= Date.now()) fail(410, 'ประกาศนี้หมดอายุแล้ว', { code: 'gone' });
    if (L.seller === me) fail(400, 'ซื้อพลอยที่ตัวเองลงขายไม่ได้');
    const price = Number(L.price); if (int(b.price, 1, MAX_PRICE) !== price) fail(409, 'ราคาเปลี่ยนไปแล้ว โหลดรายการใหม่', { code: 'gone' });
    const u = await t.user(me); needRev(u, b.rev);
    const save = u.save, coins = coinsOf(save); if (coins < price) fail(400, 'เงินไม่พอ');
    const mkt = mktOf(u), gem = cleanGem(L.gem); if (!gem) fail(410, 'ประกาศนี้ใช้ไม่ได้', { code: 'gone' });
    let nid = Math.max(1, Math.floor(Number(save.nextId) || 1)); const used = new Set(mkt.gone); for (const g of [...(Array.isArray(save.inv) ? save.inv : []), ...((save.safe && Array.isArray(save.safe.gems)) ? save.safe.gems : []), ...((save.showcase && typeof save.showcase === 'object') ? Object.values(save.showcase) : [])]) if (g) used.add(Number(g.id));
    while (used.has(nid)) nid++;
    gem.id = nid; save.nextId = nid + 1; save.coins = coins - price; if (!Array.isArray(save.inv)) save.inv = []; save.inv.push(gem);
    const fee = Math.floor(price * FEE);
    await t.setListing(id, { status: 'sold', buyer: me, buyer_name: u.name, sold_at: Date.now(), fee });
    const rev = await t.putUser(u, save, mkt, u.pub, +u.gval || 0);
    return { ok: true, rev, gem, coins: save.coins, nextId: save.nextId, price, seller: L.seller };
  });
  due.set(r.seller, (due.get(r.seller) || 0) + 1); delete r.seller; facetCache = null; return r;
}
// ยกเลิก / รับคืนประกาศที่หมดอายุ → พลอยกลับเข้ากระเป๋าผู้ขาย (เลขเดิม)
async function opCancel(store, me, b) {
  const id = int(b.id, 1, 9e15); if (id == null) fail(400, 'ไม่พบประกาศนี้');
  const r = await store.mtx(async t => {
    const L = await t.listing(id); if (!L || L.seller !== me) fail(404, 'ไม่พบประกาศนี้');
    if (L.status !== 'active') fail(410, L.status === 'sold' ? 'พลอยเม็ดนี้ขายได้แล้ว — กดรับเงินได้เลย' : 'ประกาศนี้ปิดไปแล้ว', { code: 'gone' });
    const u = await t.user(me); needRev(u, b.rev);
    const save = u.save, gem = cleanGem(L.gem), gid = Number(L.gid); if (!gem) fail(400, 'ประกาศนี้ใช้ไม่ได้');
    const mkt = mktOf(u); mkt.gone = mkt.gone.filter(x => x !== gid);
    const used = new Set(mkt.gone); for (const g of [...(Array.isArray(save.inv) ? save.inv : []), ...((save.safe && Array.isArray(save.safe.gems)) ? save.safe.gems : []), ...((save.showcase && typeof save.showcase === 'object') ? Object.values(save.showcase) : [])]) if (g) used.add(Number(g.id));
    let nid = gid; if (used.has(nid)) { nid = Math.max(1, Math.floor(Number(save.nextId) || 1)); while (used.has(nid)) nid++; save.nextId = nid + 1; }
    gem.id = nid; if (!Array.isArray(save.inv)) save.inv = []; save.inv.push(gem);
    await t.setListing(id, { status: 'returned' });
    const rev = await t.putUser(u, save, mkt, u.pub, +u.gval || 0);
    return { ok: true, rev, gem, nextId: Math.floor(Number(save.nextId) || 1) };
  });
  facetCache = null; return r;
}
// รับเงินจากเม็ดที่ขายได้ทั้งหมด (หักค่าธรรมเนียมแล้ว) — แต่ละประกาศจ่ายได้ครั้งเดียว
async function opClaim(store, me, b) {
  const r = await store.mtx(async t => {
    const u = await t.user(me); needRev(u, b.rev);
    const L = await t.unpaid(me); if (!L.length) fail(400, 'ยังไม่มีเงินรอรับ');
    let net = 0, gross = 0; for (const x of L) { gross += Number(x.price); net += Number(x.price) - Number(x.fee || 0); }
    const save = u.save; save.coins = Math.min(9e15, coinsOf(save) + net);
    await t.markPaid(L.map(x => Number(x.id)));
    const rev = await t.putUser(u, save, mktOf(u), u.pub, +u.gval || 0);
    return { ok: true, rev, coins: save.coins, net, gross, n: L.length, cut: L.filter(x => x.gem && x.gem.state === 'cut').length };
  });
  due.set(me, 0); return r;
}

function query(req) { let q; try { q = new URL(req.url, 'http://x').searchParams; } catch (e) { q = new URLSearchParams(); }
  const s = (k, re) => { const v = q.get(k) || ''; return re.test(v) ? v : ''; }, n = (k, lo, hi) => q.get(k) == null || q.get(k) === '' ? null : int(q.get(k), lo, hi);
  return { type: s('type', /^[a-z]{2,24}$/), state: s('state', /^(raw|cut)$/), origin: s('origin', /^[a-z]{2,16}$/), shape: SHAPES.includes(q.get('shape')) ? q.get('shape') : '', color: n('color', 0, 4), flaw: n('flaw', 0, 5), min: n('min', 0, MAX_PRICE), max: n('max', 0, MAX_PRICE), sort: SORTS[q.get('sort')] ? q.get('sort') : 'new', page: n('page', 0, 500) || 0 }; }

// เรียกจาก accounts.js หลังตรวจตัวตนแล้ว (u = บัญชีที่เข้าสู่ระบบ) — คืน true ถ้าเป็นเส้นทางของตลาด
async function handle(req, res, p, cx) {
  const { u, out, readBody, limited, store, minBuild } = cx;
  if (!p.startsWith('/api/market')) return false;
  if (!store.mtx) { out(503, { err: 'ตลาดปิดชั่วคราว' }); return true; }
  try {
    if (req.method === 'GET') {
      if (limited(req, 'mktR', 900)) return out(429, { err: 'เปิดดูถี่เกินไป รอสักครู่' }), true;
      if (p === '/api/market') { const f = query(req), r = await store.mBrowse(f); if (!facetCache || Date.now() - facetAt > 20000) { facetCache = await store.mFacets(); facetAt = Date.now(); }
        return out(200, { rows: r.rows.map(x => pubRow(x, u.lname)), total: r.total, page: f.page, per: PAGE, types: facetCache, due: await dueOf(store, u.lname), rule: { fee: FEE, max: MAX_OPEN, days: TTL_MS / 864e5, lo: PRICE_LO, hi: PRICE_HI } }), true; }
      if (p === '/api/market/mine') { const r = await store.mMine(u.lname); due.set(u.lname, r.open.filter(x => x.status === 'sold' && !x.paid).length);
        return out(200, { open: r.open.map(rowsOf), hist: r.hist.map(x => ({ ...rowsOf(x), bought: x.buyer === u.lname || undefined })), now: Date.now(), rule: { fee: FEE, max: MAX_OPEN, days: TTL_MS / 864e5, lo: PRICE_LO, hi: PRICE_HI } }), true; }
      if (p === '/api/market/recent') { const f = query(req); if (!f.type) return out(400, { err: 'ไม่ได้ระบุชนิดพลอย' }), true; const r = await store.mRecent(f.type, f.state || 'cut');
        return out(200, { rows: r.map(x => ({ gem: x.gem, price: Number(x.price), t: +new Date(x.sold_at) })) }), true; }
      return out(404, { err: 'not found' }), true;
    }
    if (req.method !== 'POST') return out(405, { err: 'POST only' }), true;
    if (limited(req, 'mktW', 240)) return out(429, { err: 'ทำรายการถี่เกินไป รอสักครู่แล้วลองใหม่' }), true;
    const b = await readBody(req, 4096);
    if (!(+b.build >= minBuild)) return out(426, { err: 'เกมเวอร์ชันเก่า กรุณารีเฟรชหน้าเกม' }), true;
    const op = { '/api/market/list': opList, '/api/market/buy': opBuy, '/api/market/cancel': opCancel, '/api/market/claim': opClaim }[p];
    if (!op) return out(404, { err: 'not found' }), true;
    const r = await op(store, u.lname, b);
    console.log('market', p.slice(12), u.lname, JSON.stringify({ id: r.id || b.id, price: r.price || b.price, net: r.net, rev: r.rev }));
    return out(200, r), true;
  } catch (e) {
    if (e instanceof MErr) return out(e.status, { err: e.message, ...e.extra }), true;
    throw e;
  }
}
module.exports = { handle, attachFile, attachDb, DDL, stripGone, mktOf, dueOf, due };
