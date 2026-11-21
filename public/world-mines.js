// Fantasy mine palettes. The last three colors distinguish the body, face and reflected light.
const MineGems = (() => {
  const stones = {
    sapphire:['ไพลิน','corundum','#15255c','#427dff','#a9dbff'],
    spinel:['สปิเนลชมพู','octahedron','#68124b','#f65baf','#ffd8f1'],
    ruby:['ทับทิม','corundum','#61122d','#ef3458','#ffbfca'],
    star:['ไพลินสตาร์','star','#20265d','#7989ed','#f2f5ff'],
    opal:['โอปอลเวลโล','opal','#794931','#ffcd89','#5ffbd6'],
    violet:['แซปไฟร์ม่วง','corundum','#3a205b','#9a63e5','#ebbfff'],
    pigeon:['ทับทิมแดงสด','corundum','#541329','#cf2146','#ffaf98'],
    tanzanite:['แทนซาไนต์','prism','#2e2363','#685aed','#93c8ff'],
    kagem:['มรกตคาเกม','prism','#114b41','#19a687','#a2ffd7'],
    blackopal:['โอปอลดำ','opal','#172538','#35748b','#ff954f'],
    alex:['อะเล็กซานไดรต์','prism','#313353','#23ac89','#ec629e'],
    tourmaline:['ทัวร์มาลีนสองสี','prism','#283f45','#40ba96','#ff8ba7'],
    muzo:['มรกตมูโซ','prism','#0a482b','#18b969','#b5ffd6']
  };
  const local = {cambodia:'sapphire',vietnam:'spinel',myanmar:'ruby',srilanka:'star',ethiopia:'opal',madagascar:'violet',mozambique:'pigeon',tanzania:'tanzanite',zambia:'kagem',australia:'blackopal',russia:'alex',brazil:'tourmaline',colombia:'muzo'};
  return {stone:country=>stones[local[country]]};
})();
// Regional mine bestiary. Names and creatures are fantasy designs inspired by each mining district.
const WorldMines = (() => {
  // Five local strata, followed by local wildlife, the mid-guardian and the final guardian.
  const regions = {"cambodia": "ไพลิน", "vietnam": "หลุกเยน", "myanmar": "โมก๊ก", "srilanka": "รัตนปุระ", "ethiopia": "เวลโล", "madagascar": "อีลากากา", "mozambique": "มอนเตปูเอซ", "tanzania": "เมอเรลานี", "zambia": "คาเกม", "australia": "ไลท์นิงริดจ์", "russia": "อูราล", "brazil": "มีนัสเชไรส์", "colombia": "มูโซ"};
  const floors = new Map();
  const byId = new Map();
  const roles = ['melee','ranged','poison'];
  function install(templates, definitions, levels) {
    for (const [regionNo,[country,place]] of Object.entries(regions).entries()) {
      for(let floor=1;floor<=5;floor++){
        const roster=[];
        for(const [slot,design] of MineSpecies[country][floor-1].entries()){
          const rank=slot===10?'mini':slot===11?'boss':'';
          const role=design.role || roles[(slot+floor+regionNo)%3];   // ชุดใหม่ (กัมพูชา เวียดนาม เมียนมา) ระบุรูปแบบโจมตีมากับข้อมูลของผู้ออกแบบ
          const moves=templates.filter(x=>x.caveAttack.role===role);
          const move=(design.pattern && templates.find(t=>t.caveAttack.pattern===design.pattern)) || moves[(slot+2*floor+regionNo)%moves.length];
          // Preserve the historic mini/boss IDs used by existing save files.
          const serial=slot+1+(rank?1:0);
          const type='mine_'+country+'_f'+floor+'_'+String(serial).padStart(2,'0');
          const name=design.name;
          const gem=MineGems.stone(country);
          const attack={...move.caveAttack,color:gem[3]};
          if(rank && move.caveAttack.role==='ranged'){attack.shots=rank==='boss'?5:3;attack.spread=rank==='boss'?0.75:0.46;}
          if(rank && move.caveAttack.role==='poison'){attack.duration+=1;attack.areaLife+=0.55;}
          const source=definitions[move.type], rewards=definitions[rank==='boss'?'golem':rank==='mini'?'rscorp':move.type];
          const entry={...design,country,floor,type,name,rank,place,slot,regionNo,gem,caveAttack:attack};
          definitions[type]={...source,name,boss2:rank==='boss',mini:rank==='mini',big:!!rank,fly:design.fly,
            coins:rewards.coins,chance:rewards.chance,drops:rewards.drops,hp:Math.round((rank==='boss'?188:rank==='mini'?85:source.hp)*(1+floor*.075)),
            dmg:Math.round(source.dmg*(rank==='boss'?1.65:rank==='mini'?1.32:1)*(1+floor*.03)),spd:source.spd+(slot%4)-2,
            windT:source.windT+(rank?0.18:0),worldCreature:entry,caveAttack:attack};
          // ค่าพลังที่ผู้ออกแบบกำหนดมากับมอนสเตอร์ (พลังชีวิต พลังโจมตี ความเร็ว) ใช้แทนค่าที่คำนวณจากแม่แบบ
          if(design.hp>0){definitions[type].hp=design.hp;definitions[type].dmg=design.dmg;definitions[type].spd=design.spd;}
          levels[type]=levels[rank==='boss'?'golem':rank==='mini'?'rscorp':move.type];
          byId.set(type,entry); roster.push(entry);
        }
        floors.set(country+'/'+floor,roster);
      }
    }
  }
  // ประเทศที่ใช้สัตว์ประจำถิ่นของตัวเอง (ภาพและค่าพลังชุดใหม่ 21 พ.ย. 2569) — ประเทศอื่นยังใช้ศัตรูชุดเดียวกับเหมืองไทยตามชั้น
  const REGIONAL=new Set(['cambodia','vietnam','myanmar']);
  function roster(m){return m && REGIONAL.has(m.country) ? floors.get(m.country+'/'+(m.tier||1)) : undefined;}
  function nearSave(m,x,y,margin=0){return !!(m.cp && regions[m.country] && Math.hypot(x-m.cp.x,y-m.cp.y)<64+margin);}
  // ช่วงพักบนทางเดิน: ทุก ๆ 26 แถว เว้น 5 แถวสุดท้ายไว้ไม่มีศัตรู (ไม่นับรอบจุดเซฟซึ่งว่างอยู่แล้ว)
  const REST_EVERY=26, REST_ROWS=5;
  function restRow(ty){return ((ty-18)%REST_EVERY+REST_EVERY)%REST_EVERY>=REST_EVERY-REST_ROWS;}
  // จุดวางเพิ่มสำหรับเหมืองสัตว์ประจำถิ่น: ตัวเดี่ยว ๆ สลับซ้าย-ขวาของทางเดินหลักทุก 2 แถว → ศัตรูกระจายเต็มทาง ไม่กระจุกเป็นกอง
  function scatterSpots(m,taken){
    // ช่วงล่างของชั้น (ก่อนถึงมินิบอส) จุดวางเดิมของด่านมีน้อย → เติมฝูงเพิ่มบนทางเดินทุก ~3 แถว ตั้งแต่แถว 142 ถึงหน้ามินิบอส
    const out=[]; if(!roster(m)||!m.endRoute)return out;
    const R=m.endRoute, end=R.guard[1]-2; let side=1;
    for(let ty=142;ty<=end;ty+=3){
      const px=(m.pathX&&m.pathX[ty])||R.guard[0];
      for(const dx of [side,2*side,0,-side,-2*side,3*side,-3*side]){
        const tx=px+dx, i=ty*m.w+tx; if(tx<2||tx>=m.w-2||m.t[i]!==5)continue;
        if(nearSave(m,tx*16+8,ty*16+12,16))continue;
        if(taken.some(g=>Math.abs(g.x-(tx*16+8))<26&&Math.abs(g.y-(ty*16+12))<26)||out.some(p=>Math.abs(p[1]-ty)<3))continue;
        out.push([tx,ty]); side=-side; break;
      }
    }
    return out;
  }
  // วางสัตว์ประจำถิ่นลงทุกจุดของชั้น เป็น "ฝูงชนิดเดียวกัน" เรียงจากง่ายไปยากตามระยะทาง (ปากถ้ำอยู่บน → บันไดลงอยู่ล่าง):
  //  • จัด 10 ชนิดตามความยาก (พลังชีวิต × พลังโจมตี) แล้วแบ่งทางเดินเป็น 10 ช่วง ช่วงละ 1 ชนิด: ช่วงแรกชนิดที่ง่ายสุด … ช่วงสุดท้ายชนิดที่ยากสุดก่อนถึงบอส
  //  • ทุกจุดเป็นฝูงชนิดเดียวกัน 2–4 ตัว (จำนวนตามจุดเดิมของด่าน) • โพรงข้างทางใช้ชนิดเดียวกับช่วงความลึกนั้น
  //  • มินิบอสและบอสเฝ้าท้ายชั้น • ทุกจุดวางของด่านมีศัตรู เหมือนเหมืองจันทบุรี
  function distribute(m,groups){
    const entries=roster(m); if(!entries)return;
    const order=entries.slice(0,10).map((d,i)=>({d,i,p:(d.hp>0?d.hp*d.dmg:i)})).sort((a,b)=>a.p-b.p||a.i-b.i).map(o=>o.d);
    const R=m.endRoute, y0=18, y1=Math.max(y0+10,R.entranceY-1), N=order.length;
    const kindAt=ty=>order[Math.max(0,Math.min(N-1,Math.floor((ty-y0)/(y1-y0)*N)))];
    const at=p=>p&&groups.findLast(g=>g.x===p[0]*16+8&&g.y===p[1]*16+12&&!g.routeEncounter);
    const bossG=at(R.boss), miniG=at(R.guard), lowG=at(R.lowerGuard);
    for(const g of groups){
      delete g.pack; delete g.sanctuary; g.champDead=false;
      if(g===bossG||g===miniG){g.type=entries[g===bossG?11:10].type;g.n=g.left=1;g.champ=false;continue;}
      if(g===lowG){g.type=order[N-1].type;g.n=g.left=3;g.champ=true;continue;}
      g.type=kindAt(Math.floor(g.y/16)).type; g.n=g.left=Math.max(2,g.n|0);   // ตำแหน่งและจำนวนต่อฝูงเหมือนเหมืองจันทบุรีทุกจุด (ไม่เว้นจุดไหน) — เปลี่ยนแค่ชนิดตามช่วงความยาก
    }
  }
  return {install,roster,byId,regions,nearSave,distribute,scatterSpots};
})();

// Four aligned rows (front, back, left, right) × two footfalls, wind-up and strike.
const WorldMineArt = (() => {
  const sheets = new Map();
  const rowFor = {down:0,up:1,left:2,right:3};

  function sheetFor(d) {
    const key=d.country+'-'+d.floor;
    let image=sheets.get(key);
    if (!image) {
      image=new Image();
      image.src='mine-atlases/'+key+'.webp';
      if(sheets.size>=3)sheets.delete(sheets.keys().next().value);   // ภาพชุดใหม่ละเอียดขึ้น 4 เท่า: เก็บในหน่วยความจำไม่เกิน 3 ชั้น
      sheets.set(key,image);
    }
    return image;
  }
  const thaiSizes = {stone_pangolin:33,quartz_quail:24,jade_toad:24,sapphire_ferret:29,indigo_bell_squid:32,
    copper_cicada:22,cracked_mask_ghost:39,three_eyed_raven:30,stitched_sack_ghost:37,lava_horn_ram:40,
    magma_throat_ibis:32,sulfur_armadillo:34,crystal_jaw_newt:31,abyssal_lanternfish:30,violet_anemone:27};
  function displaySize(def, champion) {
    const creature=def.worldCreature;
    let base=creature ? creature.size : thaiSizes[def.filename?.slice(12).replaceAll('-','_')];
    if (!base) base=34;
    if (def.boss2) return Math.round(59+base*.45);
    if (def.mini) return Math.round(45+base*.42);
    if (champion) return Math.round(29+base*.44);
    return base;
  }
  function groundLight(g,x,y,radius,time,rank) {
    const pulse=1+Math.sin(time*5)*.08, r=radius*pulse;
    g.save();
    g.strokeStyle=rank==='boss'?'#ff6943':'#ffb030';
    g.lineWidth=1.2;g.globalAlpha=.8;
    g.beginPath();g.ellipse(x,y,r,r*.38,0,0,Math.PI*2);g.stroke();
    g.globalAlpha=.22;g.fillStyle='#ff8020';g.fill();
    g.globalAlpha=.65;g.strokeStyle='#ffe080';g.lineWidth=.7;
    g.beginPath();g.ellipse(x,y,r*.67,r*.25,0,0,Math.PI*2);g.stroke();
    if(rank==='mini'||rank==='boss'){
      const beams=rank==='boss'?6:4;
      for(let i=0;i<beams;i++){
        const angle=i*Math.PI*2/beams, h=(.22+.13*Math.sin(time*3+i))*r;
        const bx=x+Math.cos(angle)*r*.88, by=y+Math.sin(angle)*r*.33;
        const fade=g.createLinearGradient(bx,by,bx,by-h);
        fade.addColorStop(0,rank==='boss'?'#ff8654':'#ffcd71');fade.addColorStop(1,'rgba(255,205,113,0)');
        g.fillStyle=fade;g.fillRect(bx-1,by-h,2,h);
      }
    }
    g.restore();
  }
  function draw(g,e,def,S,T) {
    const x=S(e.x), y=T(e.y), size=displaySize(def,e.champ);
    const d=def.worldCreature;
    const stride = def.fly ? e.t * 1000 / def.caveAttack.walk : (e.walkPixels || 0) / 4.8;
    const col=e.atkT>0?3:e.wind>0?2:(e.moving||def.fly)?Math.floor(stride)%2:0;
    const img=sheetFor(d);
    g.save();
    g.fillStyle='rgba(12,9,18,.32)';
    g.beginPath();g.ellipse(x,y-1,(def.r+2)*5/6,def.r*.43*5/6,0,0,Math.PI*2);g.fill();
    if (d.rank || e.champ) groundLight(g,x,y-1,size*.37,e.t,d.rank || 'champion');
    if (img.complete && img.naturalWidth) {
      g.imageSmoothingEnabled=false;
      const lift=def.fly?4+Math.sin(e.t*5)*1.1:0;
      if(e.flash>0)g.filter='brightness(1.5)';
      const bottom=y-lift+size*.075/(G.TILT||1);
      const frameSize=img.naturalWidth/16;
      const facing=rowFor[e.dir] ?? 0;
      g.drawImage(img,(4*facing+col)*frameSize,d.slot*frameSize,frameSize,frameSize,x-size/2,bottom-size,size,size);
    }
    g.restore();
  }
  return {draw,sheetFor,displaySize,groundLight};
})();
