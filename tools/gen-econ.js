// สร้าง econ.gen.js: ดึง "สูตรราคาและตารางข้อมูลเศรษฐกิจ" ออกจากหน้าเกม (public/index.html) แบบคำต่อคำ ให้เซิร์ฟเวอร์ใช้ตรวจเงิน
// รันทุกครั้งที่แก้เกม (คู่กับการสร้าง index.html.br/.gz):  NODE_PATH=/opt/npm-tools/node_modules node tools/gen-econ.js
const fs = require('fs'), path = require('path'), acorn = require('acorn'), walk = require('acorn-walk');
const ROOT = path.join(__dirname, '..'), html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
const ROOTS = (process.env.ROOTS || 'rawPrice,cutOffers,jenaPrice,JENA_BONUS,itemSellPrice,repairCost,maxDur,originKeys,CONSUMABLES,BAGS,SAFES,QUESTS,GEMS,SHAPES,JUMBO_TYPES,ITEMS,MONS,MAX_LV,BAHT').split(',');
let src = null; for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) if (m[1].includes('function rawPrice(')) src = m[1];
if (!src) throw new Error('main script not found');
const ast = acorn.parse(src, { ecmaVersion: 'latest' }), decl = new Map();
for (const n of ast.body) {
  if (n.type === 'FunctionDeclaration') decl.set(n.id.name, n);
  else if (n.type === 'VariableDeclaration') for (const d of n.declarations) { const ids = []; (function pat(p) { if (!p) return; if (p.type === 'Identifier') ids.push(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(x => pat(x.value || x.argument)); else if (p.type === 'ArrayPattern') p.elements.forEach(pat); else if (p.type === 'AssignmentPattern') pat(p.left); else if (p.type === 'RestElement') pat(p.argument); })(d.id); ids.forEach(i => decl.set(i, n)); }
  else if (n.type === 'ClassDeclaration') decl.set(n.id.name, n);
}
const need = new Set(), nodes = new Set(), why = {};
function add(name, from) { const n = decl.get(name); if (!n || need.has(name)) return; need.add(name); why[name] = from; if (nodes.has(n)) return; nodes.add(n);
  walk.full(n, x => { if (x.type === 'Identifier' && decl.has(x.name)) add(x.name, name); }); }
for (const r of ROOTS) { if (!decl.has(r)) throw new Error('root not found: ' + r); add(r, '(root)'); }
if (process.env.WHY) { for (const k of process.env.WHY.split(',')) { let c = k, ch = []; while (c && c !== '(root)') { ch.push(c); c = why[c]; } console.log(ch.join(' <- ')); } }
const ordered = [...nodes].sort((a, b) => a.start - b.start), body = ordered.map(n => src.slice(n.start, n.end)).join('\n');
const build = (html.match(/GAME_BUILD="(\d+)"/) || [])[1] || '0';
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, 'econ-snap.json'), 'utf8')); if (String(snap.BUILD) !== String(build)) throw new Error('econ-snap.json is from build ' + snap.BUILD + ' but index.html is ' + build + ' — run tools/snap-econ.js first');
const fix = `const __S = ${JSON.stringify(snap)};\nfor (const n of ['ITEMS', 'CONSUMABLES', 'MONS']) { const T = { ITEMS, CONSUMABLES, MONS }[n]; for (const k of Object.keys(T)) if (!__S[n][k]) delete T[k]; for (const k of Object.keys(__S[n])) T[k] = Object.assign(T[k] || {}, __S[n][k]); }\nBAGS.length = 0; BAGS.push(...__S.BAGS); SAFES.length = 0; SAFES.push(...__S.SAFES);\n`;
const out = `// ไฟล์นี้สร้างอัตโนมัติจาก public/index.html ด้วย tools/gen-econ.js — ห้ามแก้ด้วยมือ (แก้ที่เกม แล้วสร้างใหม่)\n'use strict';\nconst window = {}, document = undefined, navigator = {}, location = { protocol: 'node:' }, localStorage = undefined;\nlet STATE = null;\n${body}\n${fix}module.exports = { BUILD: ${build}, SNAP: __S, setState(s) { STATE = s; }, ${ROOTS.join(', ')} };\n`;
if (!process.env.DRY) fs.writeFileSync(path.join(ROOT, 'econ.gen.js'), out);
console.log('decls', nodes.size, 'bytes', out.length, 'build', build); if (process.env.LIST) console.log([...need].join(' '));
