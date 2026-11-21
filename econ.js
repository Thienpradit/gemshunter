// นักล่าอัญมณี — ตรวจเงินและของในเซฟ (กันแก้เซฟ / เสกเงิน / เสกพลอย)
// หลักการ: "เงินอยู่ที่เซิร์ฟเวอร์" — เครื่องผู้เล่นส่งมาแค่ "สมุดบัญชี" (รายการเงินเข้า-ออกตั้งแต่เซฟครั้งก่อน)
//  เซิร์ฟเวอร์เริ่มจากยอดเงินเดิมที่ตัวเองเก็บไว้ → ไล่ตรวจทีละรายการด้วยสูตรราคาเดียวกับเกม (econ.gen.js สร้างจากหน้าเกมโดยตรง) → ได้ยอดเงินจริง
//  ยอดเงินที่เครื่องอ้างมาไม่ถูกใช้เลย • รายการที่เป็นไปไม่ได้ (ขายแพงเกินราคาจริง ขายเม็ดเดิมซ้ำ พลอยงอก ฯลฯ) = ไม่รับเซฟนั้น + จดบันทึก
// โหมด (ตัวแปร ECON_MODE บน Render):  log = ตรวจและจดบันทึกอย่างเดียว ยังรับเซฟตามเดิม (ค่าเริ่มต้นช่วงแรก)  •  enforce = บังคับใช้จริง
let E = null; try { E = require('./econ.gen.js'); } catch (e) { console.error('econ: econ.gen.js load failed → checks off:', e.message); }
// สูตรราคาต้องมาจากหน้าเกมรุ่นเดียวกับที่เซิร์ฟเวอร์ส่งให้ผู้เล่น — ถ้าไม่ตรง (ลืมสร้าง econ.gen.js ใหม่) ปิดการตรวจ ดีกว่าปฏิเสธเซฟของผู้เล่นผิด ๆ
try { const m = require('fs').readFileSync(require('path').join(__dirname, 'public', 'index.html'), 'utf8').match(/GAME_BUILD="(\d+)"/); if (E && m && +m[1] !== E.BUILD) { console.error(`econ: econ.gen.js is from build ${E.BUILD} but the game is build ${m[1]} → checks off (run tools/snap-econ.js + tools/gen-econ.js)`); E = null; } } catch (e) {}
const MODE = () => !E ? 'off' : (process.env.ECON_MODE === 'enforce' ? 'enforce' : process.env.ECON_MODE === 'off' ? 'off' : 'log');
const TOL = 0.51;                                   // เงินมีเศษทศนิยมได้ (ราคาของบางอย่างไม่เป็นจำนวนเต็ม)
const MAX_ELAPSED = 3 * 3600;                       // เวลาที่นับให้สูงสุดระหว่างสองเซฟ (วินาที)
const GEM_RATE = 1.0, GEM_BURST = 25;               // พลอยใหม่: ไม่เกิน 1 เม็ด/วินาที + เผื่อ 25
const ITEM_RATE = 0.5, ITEM_BURST = 15;             // อุปกรณ์ใหม่จากศัตรู
const DROP_RATE = 25, DROP_BURST = 4000;            // เงินดรอปจากศัตรู (เหรียญ/วินาที + เผื่อบอส)
const SHAPE_MAX_YIELD = () => Math.max(...Object.values(E.SHAPES).map(s => s.yield || 1));

const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const arr = v => Array.isArray(v) ? v : [];
function gemsOf(s) { if (!s || typeof s !== 'object') return []; const o = [...arr(s.inv), ...arr(s.safe && s.safe.gems)];
  if (s.showcase && typeof s.showcase === 'object' && !Array.isArray(s.showcase)) o.push(...Object.values(s.showcase));
  for (const j of arr(s.queue && s.queue.jobs)) if (j && j.gem) o.push(j.gem);
  for (const b of arr(s.deathBags)) o.push(...arr(b && b.gems));
  if (s.board && s.board.given && typeof s.board.given === 'object') for (const v of Object.values(s.board.given)) if (v && v.gem) o.push(v.gem);
  return o.filter(g => g && typeof g === 'object'); }
function itemsOf(s) { if (!s || typeof s !== 'object') return []; const o = [...arr(s.items)]; for (const b of arr(s.deathBags)) o.push(...arr(b && b.items)); return o.filter(x => x && typeof x === 'object'); }

// พลอยหนึ่งเม็ด "เป็นไปได้ในเกม" หรือไม่ (ชนิดมีจริง ขุดได้ในประเทศนั้น น้ำหนักไม่เกินที่เกมสุ่มได้ ฯลฯ) — คืนข้อความถ้าผิด
function gemBad(g, lineage) {
  if (!g || !E.GEMS[g.type]) return 'ชนิดพลอยไม่มีในเกม';
  const c = num(g.carat), col = num(g.color), fl = num(g.flaw);
  if (!(col >= 0 && col <= 4 && Number.isInteger(col)) || !(fl >= 0 && fl <= 5 && Number.isInteger(fl))) return 'สี/ตำหนิอยู่นอกช่วง';
  const org = E.SNAP.ORIGINS[g.type] || []; if (!lineage && g.origin && org.length && !org.includes(g.origin)) return 'พลอยชนิดนี้ขุดไม่ได้ในประเทศนั้น';
  const jumboOk = E.JUMBO_TYPES.includes(g.type), rawCap = jumboOk ? 40.01 : 9.6;
  if (g.state === 'cut') { if (!E.SHAPES[g.shape]) return 'เชฟไม่มีในเกม'; const rc = num(g.rawCarat) || c * 2.5, p = num(g.polish) || 1;
    if (rc > rawCap) return 'พลอยก้อนต้นทางหนักเกินที่เกมมี'; if (p > 1.105) return 'ค่าเจียสูงเกิน'; if (c > Math.max(0.1, rc * 0.52 * SHAPE_MAX_YIELD()) + 0.011) return 'น้ำหนักหลังเจียมากเกินไป'; }
  else if (g.state === 'raw') { if (!(c > 0 && c <= rawCap)) return 'พลอยก้อนหนักเกินที่เกมมี'; }
  else return 'สถานะพลอยไม่ถูกต้อง';
  return ''; }
const sameGem = (a, b) => a.type === b.type && a.state === b.state && num(a.color) === num(b.color) && num(a.flaw) === num(b.flaw) && Math.abs(num(a.carat) - num(b.carat)) < 0.011 && (a.origin || 'thai') === (b.origin || 'thai') && (a.state !== 'cut' || (a.shape === b.shape && Math.abs((num(a.polish) || 1) - (num(b.polish) || 1)) < 0.011));
// เจียจากก้อน r ได้เม็ด c จริงหรือไม่ (สูตรเดียวกับเกม: เก็บเนื้อได้ไม่เกิน 52% × ค่าเชฟ • ตำหนิลดได้ไม่เกิน 4 ขั้น • ชนิด/สี/แหล่งเดิม)
const cutFrom = (r, c) => r.type === c.type && num(r.color) === num(c.color) && (r.origin || 'thai') === (c.origin || 'thai') && num(c.flaw) >= num(r.flaw) - 4 && num(c.carat) <= Math.max(0.1, num(r.carat) * 0.52 * ((E.SHAPES[c.shape] || {}).yield || 1)) + 0.011;

// ตรวจเซฟใหม่ (S1) เทียบเซฟเดิมบนเซิร์ฟเวอร์ (S0) + สมุดบัญชี • คืน { coins: ยอดเงินจริง, viol: [ข้อผิด], note: [เรื่องน่าสังเกต], jq }
function replay(S0, S1, elapsedSec) {
  const viol = [], note = [], V = (code, msg, d) => { if (viol.length < 12) viol.push({ code, msg, ...(d || {}) }); };
  const el = Math.max(0, Math.min(MAX_ELAPSED, elapsedSec || 0)), fresh = !S0;
  let coins = fresh ? num(E.SNAP.CONFIG.startCoins) : Math.max(0, num(S0.coins));
  const jq0 = fresh ? 0 : num(S0.jq) | 0, G0 = gemsOf(S0), I0 = itemsOf(S0), g0 = new Map(G0.map(g => [num(g.id), g])), i0 = new Map(I0.map(x => [num(x.uid), x]));
  const rawBySeed = new Map(); for (const g of G0) if (g.state === 'raw') { const k = g.type + '|' + num(g.seed); (rawBySeed.get(k) || rawBySeed.set(k, []).get(k)).push(g); }
  const usedRaw = new Set(), soldG = new Set(), soldI = new Set(), bought = { bag: new Set(), safe: new Set(), shop: 0, cons: {} };
  let newGems = 0, newItems = 0, drops = 0, refunds = 0, hires = 0, quests = 0, jena = 0, jmax = jq0;
  const lv1 = Math.max(1, num(S1.lv) | 0), hireFee = num(E.SNAP.CONFIG.hireFeePerGem);
  // พลอยที่อ้างถึง (ตอนขาย หรือที่โผล่ในเซฟใหม่) มาจากไหน: มีอยู่เดิม / เจียจากก้อนเดิม / ขุดใหม่
  const resolve = (g, selling) => { const id = num(g.id), o = g0.get(id);
    if (o && o.state === g.state) { if (!sameGem(o, g)) V('gem-changed', 'พลอยเม็ดเดิมถูกแก้ค่า', { id, type: g.type }); return o; }
    if (g.state === 'cut') { const L = rawBySeed.get(g.type + '|' + num(g.seed)) || [], r = L.find(x => !usedRaw.has(num(x.id)) && cutFrom(x, g)) || (o && o.state === 'raw' && cutFrom(o, g) ? o : null);
      if (r) { usedRaw.add(num(r.id)); const bad = gemBad(g, true);   /* เจียจากก้อนที่มีอยู่เดิม: ไม่ตรวจประเทศซ้ำ (พลอยรุ่นเก่าบางเม็ดมีแหล่งไม่ตรงตารางปัจจุบัน) */ if (bad) V('gem-invalid', bad, { id, type: g.type }); return g; } }
    const bad = gemBad(g); if (bad) V('gem-invalid', bad, { id, type: g.type }); newGems++;
    if (g.jumbo || num(g.carat) >= 10 || (E.rawPrice && g.state === 'raw' && E.rawPrice(g) > 300000)) note.push({ code: 'rare-find', type: g.type, carat: num(g.carat), color: num(g.color), flaw: num(g.flaw), state: g.state });
    return g; };

  for (const e of arr(S1.jr)) {
    if (!Array.isArray(e) || e.length < 3) { V('journal', 'รายการในสมุดบัญชีผิดรูปแบบ'); continue; }
    const [seq, k] = e, d = Number(e[2]); if (!(seq > jq0)) continue;             // รายการที่เซิร์ฟเวอร์คิดไปแล้ว (ส่งซ้ำ) ข้าม
    if (seq <= jmax) { V('journal', 'ลำดับรายการซ้ำ'); continue; } jmax = seq | 0;
    if (!Number.isFinite(d)) { V('journal', 'จำนวนเงินไม่ถูกต้อง'); continue; }
    if (k === 'gem') { const g = e[3], b = e[4]; if (!g || typeof g !== 'object' || !(d > 0)) { V('gem-sale', 'รายการขายพลอยไม่ถูกต้อง'); continue; }
      const id = num(g.id); if (soldG.has(id)) { V('gem-dupe', 'ขายพลอยเม็ดเดียวกันซ้ำ', { id }); continue; } soldG.add(id);
      if (!E.GEMS[g.type]) { V('gem-invalid', 'ชนิดพลอยไม่มีในเกม', { type: String(g.type).slice(0, 24) }); continue; }
      const G = resolve(g, true); let cap = 0;
      try { cap = G.state === 'raw' ? (b === 'agent' ? Math.max(1, Math.round(E.rawPrice(G) * 0.6)) : E.rawPrice(G)) : b === 'jena' ? E.jenaPrice(G) : Math.max(...Object.values(E.cutOffers(G))); } catch (er) { V('gem-invalid', 'คิดราคาพลอยไม่ได้', { type: g.type }); continue; }
      if (b === 'jena') { if (G.state !== 'cut') V('gem-sale', 'เจ๊นารับเฉพาะพลอยเจียระไน'); jena += d; }
      if (d > cap + TOL) V('gem-price', 'ขายพลอยได้เงินมากกว่าราคาจริง', { id, type: g.type, got: d, max: cap });
      coins += Math.min(d, cap + TOL); }
    else if (k === 'jb') { const pp = S1.jena && S1.jena.pp && typeof S1.jena.pp === 'object' ? Math.max(0, ...Object.values(S1.jena.pp).map(num)) : 0, cap = Math.max(500, pp * (num(E.JENA_BONUS) || 0.2) * 1.3);
      if (!(d > 0) || d > cap + TOL) V('bonus', 'โบนัสเจ๊นามากเกินจริง', { got: d, max: Math.round(cap) }); coins += Math.max(0, Math.min(d, cap)); }
    else if (k === 'item') { const x = e[3]; if (!x || typeof x !== 'object' || !(d > 0)) { V('item-sale', 'รายการขายอุปกรณ์ไม่ถูกต้อง'); continue; }
      const uid = num(x.uid); if (soldI.has(uid)) { V('item-dupe', 'ขายอุปกรณ์ชิ้นเดียวกันซ้ำ', { uid }); continue; } soldI.add(uid);
      const o = i0.get(uid), it = E.ITEMS[(o || x).id]; if (!it) { V('item-invalid', 'อุปกรณ์ไม่มีในเกม', { id: String(x.id).slice(0, 24) }); continue; }
      let X; if (o) X = o; else { newItems++; X = { id: x.id, q: Math.max(0, Math.min(2, num(x.q) | 0)), g: Math.max(0, Math.min(5, num(x.g) | 0)), mods: x.m ? {} : null }; }
      let cap = 0; try { cap = E.itemSellPrice(X); } catch (er) { V('item-invalid', 'คิดราคาอุปกรณ์ไม่ได้', { id: x.id }); continue; }
      if (!(cap >= 0)) cap = 0; if (d > cap + TOL) V('item-price', 'ขายอุปกรณ์ได้เงินมากกว่าราคาจริง', { id: X.id, got: d, max: cap }); coins += Math.min(d, cap + TOL); }
    else if (k === 'drop') { if (!(d > 0)) { V('drop', 'เงินดรอปไม่ถูกต้อง'); continue; } drops += d; coins += d; }
    else if (k === 'quest') { const i = (fresh ? 0 : num(S0.questIdx) | 0) + quests, q = E.SNAP.QUESTS[i]; quests++;
      if (!q || num(e[3]) !== i || Math.abs(d - num(q.reward)) > TOL) { V('quest', 'รางวัลภารกิจไม่ตรง', { got: d, i: e[3] }); continue; } coins += d; }
    else if (k === 'refund') { refunds++; if (!(d > 0) || d > hireFee + TOL) { V('refund', 'เงินคืนค่าจ้างเจียมากเกิน', { got: d }); continue; } coins += d; }
    else if (k === 'spend') { if (d > 0) { V('spend', 'รายการจ่ายเงินกลายเป็นเงินเข้า', { got: d, tag: e[3] }); continue; } const tag = e[3]; let min = 0;
      if (tag === 'bag') { const B = E.BAGS[e[4]]; if (B) { min = num(B.price); bought.bag.add(num(e[4])); } }
      else if (tag === 'safe') { const B = E.SAFES[e[4]]; if (B) { min = num(B.price); bought.safe.add(num(e[4])); } }
      else if (tag === 'cons') { const c = E.CONSUMABLES[e[4]], n = Math.max(1, num(e[5]) | 0); if (c) { min = num(c.price) * n; bought.cons[e[4]] = (bought.cons[e[4]] || 0) + n * (num(c.pack) || 1); } }
      else if (tag === 'shop') { const it = E.ITEMS[e[4]]; if (!it) V('item-invalid', 'ซื้ออุปกรณ์ที่ไม่มีในเกม'); else bought.shop++; }
      else if (tag === 'hire') { const n = Math.max(1, num(e[4]) | 0); min = hireFee * n; hires += n; }
      if (-d < min - TOL) V('underpay', 'จ่ายเงินน้อยกว่าราคาจริง', { tag, paid: -d, price: min }); coins += Math.min(d, -min);
      if (coins < -1) { V('overspend', 'จ่ายเงินมากกว่าที่มี', { tag, short: Math.round(-coins) }); coins = 0; } }
    else if (k === 'steal') { if (d > 0) { V('spend', 'รายการโดนขโมยกลายเป็นเงินเข้า'); continue; } coins = Math.max(0, coins + d); }
    else V('journal', 'ไม่รู้จักชนิดรายการ', { k: String(k).slice(0, 16) });
  }
  coins = Math.max(0, coins);
  // ---- ของในเซฟใหม่ต้องสอดคล้องกับรายการ ----
  const G1 = gemsOf(S1), seen = new Set();
  for (const g of G1) { const id = num(g.id); if (seen.has(id)) { V('gem-dupe', 'มีพลอยเลขเดียวกันซ้ำในเซฟ', { id }); continue; } seen.add(id); if (soldG.has(id)) { V('gem-dupe', 'พลอยที่ขายไปแล้วยังอยู่ในเซฟ', { id }); continue; } if (!E.GEMS[g.type]) continue; resolve(g, false); }
  for (const id of usedRaw) if (seen.has(id)) V('gem-dupe', 'ก้อนที่เจียไปแล้วยังอยู่ในเซฟ', { id });
  if (newGems > GEM_BURST + el * GEM_RATE) V('gem-rate', 'ได้พลอยใหม่เร็วเกินที่เล่นได้จริง', { n: newGems, sec: Math.round(el) });
  for (const x of itemsOf(S1)) { const uid = num(x.uid); if (soldI.has(uid)) V('item-dupe', 'อุปกรณ์ที่ขายไปแล้วยังอยู่ในเซฟ', { uid }); else if (!i0.has(uid)) { newItems++; if (!E.ITEMS[x.id]) V('item-invalid', 'อุปกรณ์ไม่มีในเกม', { id: String(x.id).slice(0, 24) }); else if (num(x.lv) > lv1 + 2) V('item-invalid', 'อุปกรณ์เลเวลสูงเกินตัวละคร', { id: x.id, lv: num(x.lv) }); } }
  if (newItems - bought.shop > ITEM_BURST + el * ITEM_RATE) V('item-rate', 'ได้อุปกรณ์ใหม่เร็วเกินที่เล่นได้จริง', { n: newItems, sec: Math.round(el) });
  if (drops > DROP_BURST + el * DROP_RATE) V('drop-rate', 'เงินดรอปจากศัตรูมากเกินที่เล่นได้จริง', { got: Math.round(drops), sec: Math.round(el) });
  if (refunds > arr(S0 && S0.queue && S0.queue.jobs).length + hires) V('refund', 'ยกเลิกงานเจียมากกว่างานที่มี');
  if (!fresh) { const b0 = num(S0.bag) | 0, b1 = num(S1.bag) | 0; if (b1 > b0 && !bought.bag.has(b1)) V('free-upgrade', 'กระเป๋าใหญ่ขึ้นโดยไม่ได้ซื้อ', { from: b0, to: b1 });
    const s0 = num(S0.safe && S0.safe.lv) | 0, s1 = num(S1.safe && S1.safe.lv) | 0; if (s1 > s0 && !bought.safe.has(s1)) V('free-upgrade', 'ตู้เซฟใหญ่ขึ้นโดยไม่ได้ซื้อ', { from: s0, to: s1 });
    const dl = lv1 - (num(S0.lv) | 0); if (dl > 3 + el / 120) note.push({ code: 'fast-level', from: num(S0.lv) | 0, to: lv1, sec: Math.round(el) }); }
  if (Math.abs(num(S1.coins) - coins) > 2) note.push({ code: 'coin-diff', claimed: Math.round(num(S1.coins)), real: Math.round(coins) });
  return { coins, viol, note, jq: Math.max(jmax, num(S1.jq) | 0, jq0) };
}

// เรียกจาก /api/save • คืน { ok, coins?, viol, note, mode } — ok=false เฉพาะโหมด enforce ที่พบข้อผิด
function check(u, save, nowMs) {
  const mode = MODE(); if (mode === 'off') return { ok: true, mode, viol: [], note: [] };
  let r; try { const S0 = u.save && typeof u.save === 'object' ? u.save : null, last = S0 && u.updated ? +new Date(u.updated) : 0; r = replay(S0, save, last ? (nowMs - last) / 1000 : MAX_ELAPSED); }
  catch (e) { console.error('econ: replay crashed (save accepted unchecked)', e); return { ok: true, mode, viol: [], note: [{ code: 'crash', msg: String(e.message).slice(0, 200) }] }; }
  if (mode === 'enforce' && !r.viol.length) { save.coins = r.coins; save.jq = r.jq; }
  return { ok: mode !== 'enforce' || !r.viol.length, mode, coins: mode === 'enforce' ? r.coins : undefined, viol: r.viol, note: r.note };
}
module.exports = { check, replay, MODE, get build() { return E ? E.BUILD : 0; } };
