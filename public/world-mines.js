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
  // Attachment positions are fractions of the visible anatomy, mirrored for right-facing frames.
  const anatomy = {
    shell:['ผลึกเรียงตามแนวกระดอง',[.48,.33],[.62,.32]], hide:['สันผลึกเหนือไหล่',[.50,.40],[.45,.24]],
    horn:['ผลึกคู่ที่โคนเขา',[.33,.20],[.32,.18]], wing:['ผลึกบนขนปีก',[.34,.50],[.58,.43]],
    scale:['เกล็ดผลึกบนสันหลัง',[.48,.37],[.61,.22]], stinger:['ผลึกฝังบนเกราะปล้อง',[.50,.57],[.49,.49]]
  };
  const shapes = {arm:'shell',bug:'shell',turtle:'shell',crab:'shell',cat:'hide',wolf:'hide',bear:'hide',boar:'hide',golem:'hide',elephant:'hide',ram:'horn',bird:'wing',bat:'wing',moth:'wing',dragon:'scale',lizard:'scale',snake:'scale',toad:'hide',scorp:'stinger'};
  return {stone:country=>stones[local[country]], anatomy:shape=>anatomy[shapes[shape]]};
})();
// Regional mine bestiary. Names and creatures are fantasy designs inspired by each mining district.
const WorldMines = (() => {
  // Five local strata, followed by local wildlife, the mid-guardian and the final guardian.
  const regions = {
    cambodia: ['ไพลิน',218,'ตะกอนฝน|รากไทร|หินบะซอลต์|พลบคราม|ดาวไพลิน','ลิ่น:arm|นกกะเต็น:bird|กบ:toad|หมูป่า:boar|ค้างคาว:bat|แมงป่อง:scorp|ตะกวด:lizard|แมลงทับ:bug|งูเห่า:snake|เสือลายเมฆ:cat|ปูหิน:crab','พิทักษ์ซุ้มศิลา:golem|ไกรสรแห่งไพลิน:cat'],
    vietnam: ['หลุกเยน',341,'ไผ่หมอก|หินอ่อน|ธารชมพู|ผาแดง|ดาวทับทิม','เลียงผา:ram|นกกางเขน:bird|คางคก:toad|ชะมด:cat|จักจั่น:bug|งูเขียว:snake|ตุ๊กแก:lizard|ค้างคาว:bat|แมงป่อง:scorp|เต่าธาร:turtle|ปูผา:crab','ขุนเขาเขี้ยวหมอก:ram|มังกรหินอ่อน:dragon'],
    myanmar: ['โมก๊ก',355,'กรวดแดง|หินอ่อนขาว|ทับทิมดิบ|เพลิงบาดาล|แสงดาว','เสือดาว:cat|เหยี่ยว:bird|งูสามเหลี่ยม:snake|กระทิง:boar|ค้างคาว:bat|ปูน้ำตก:crab|เลียงผา:ram|ด้วงเขา:bug|กบผา:toad|ลิ่นหิน:arm|ตุ๊กแก:lizard','นายด่านเขาหยก:boar|สิงห์เพลิงโมก๊ก:cat'],
    srilanka: ['รัตนปุระ',225,'กรวดน้ำ|ศิลาจันทร์|ตาแมว|เกสรส้ม|ไพลินดาว','หมีหมา:bear|นกยูง:bird|งูแมวเซา:snake|เสือดาว:cat|ด้วงพลอย:bug|กบใบไม้:toad|ตะกวด:lizard|ค้างคาว:bat|ปูคลอง:crab|หมูป่า:boar|เต่าดาว:turtle','ยักษ์ตาแมว:golem|คชสารรัตนปุระ:elephant'],
    ethiopia: ['เวลโล',32,'เถ้าทอง|รอยแยก|สายรุ้ง|ไฟโอปอล|ฟ้าหลังฝน','หมาป่าที่ราบสูง:wolf|แร้งภูผา:bird|แมงป่อง:scorp|แพะผา:ram|จิ้งเหลน:lizard|งูทราย:snake|ไฮยีนา:cat|ด้วงหิน:bug|คางคก:toad|ค้างคาว:bat|เต่าหิน:turtle','ผู้เฝ้ารอยแยก:golem|ราชันหมาป่าโอปอล:wolf'],
    madagascar: ['อีลากากา',259,'ทรายแดง|หนามเงิน|ไพลินม่วง|รากเบาบับ|แสงสนธยา','ฟอสซา:cat|นกคูอา:bird|กบมะเขือเทศ:toad|เทนเรก:arm|ผีเสื้อจันทร์:moth|กิ้งก่าใบไม้:lizard|ลีเมอร์:wolf|ด้วงคอยาว:bug|งูเหลือม:snake|เต่ารัศมี:turtle|ปูบก:crab','ยามป่าหนาม:arm|วิญญาณเบาบับ:golem'],
    mozambique: ['มอนเตปูเอซ',350,'ดินแดง|รากมะขาม|หินทับทิม|เพลิงชาด|แก่นเลือดนก','หมูป่าทุ่ง:boar|นกเงือก:bird|แมงป่องหิน:scorp|เสือดาว:cat|ค้างคาว:bat|งูพ่นพิษ:snake|ลิ่น:arm|ด้วงกว่าง:bug|กบพลั่ว:toad|กิ้งก่าคอหนาม:lizard|เต่าบก:turtle','เขี้ยวแดงเฝ้าด่าน:boar|คชสารทับทิม:elephant'],
    tanzania: ['เมอเรลานี',242,'ฝุ่นทุ่ง|หินชีสต์|ครามสลับม่วง|เปลวสีนิล|แก่นแทนซาไนต์','แอนทิโลป:ram|นกเลขานุการ:bird|กิ้งก่า:lizard|ไฮยีนาลาย:wolf|ด้วงดิน:bug|งูพัฟ:snake|สิงโตหิน:cat|ค้างคาว:bat|แมงป่อง:scorp|เต่าเสือดาว:turtle|กบหิน:toad','ขุนเขาคราม:ram|ราชสีห์สามแสง:cat'],
    zambia: ['คาเกม',145,'กรวดเขียว|รากไม้น้ำ|ไมกาดำ|สายแร่มรกต|แก่นป่าลึก','ชะมดน้ำ:cat|นกกินผึ้ง:bird|กบกก:toad|หมูป่า:boar|แมลงปอ:bug|งูพุ่มไม้:snake|จระเข้:lizard|ค้างคาว:bat|แมงป่องดิน:scorp|ลิ่นยักษ์:arm|ปูโคลน:crab','ผู้พิทักษ์ไมกาดำ:turtle|อสรพิษมรกต:snake'],
    australia: ['ไลท์นิงริดจ์',195,'ฝุ่นแดง|หินดินดาน|แสงเหลือบ|ฟ้าผ่า|หัวใจโอปอลดำ','วอมแบต:bear|นกคูคาเบอร์รา:bird|กบโพรง:toad|ดิงโก:wolf|จักจั่น:bug|งูดำ:snake|อีคิดนา:arm|ค้างคาว:bat|แมงป่องทราย:scorp|กิ้งก่าหนาม:lizard|เต่าคอยาว:turtle','เขี้ยวสายฟ้า:wolf|วารานัสโอปอลดำ:dragon'],
    russia: ['อูราล',170,'น้ำค้างแข็ง|สนดำ|รอยแยกเขียว|ม่านแสง|ผลึกสองสี','หมาป่า:wolf|นกเค้า:bird|งูไวเปอร์:snake|หมีสีน้ำตาล:bear|ผีเสื้อกลางคืน:moth|คางคกภูเขา:toad|แมวป่าลิงซ์:cat|ค้างคาว:bat|ด้วงเขา:bug|แพะผา:ram|กิ้งก่าหิน:lizard','ยามหินมาลาไคต์:golem|หมีแปรแสงอูราล:bear'],
    brazil: ['มีนัสเชไรส์',186,'ทรายทอง|รากเถาวัลย์|โพรงอเมทิสต์|สายทัวร์มาลีน|แก้วสองสี','อาร์มาดิลโล:arm|นกทูแคน:bird|กบลูกศร:toad|เสือจากัวร์:cat|แมลงทับ:bug|อนาคอนดา:snake|หมาป่าเครา:wolf|ค้างคาว:bat|แมงป่อง:scorp|เต่าป่า:turtle|อีกัวนา:lizard','ผู้คุมโพรงอเมทิสต์:arm|จากัวร์ทัวร์มาลีน:cat'],
    colombia: ['มูโซ',157,'หมอกป่า|ชั้นหินดำ|สายแร่ขาว|ฝนมรกต|หัวใจเทือกเขา','หมีแว่น:bear|นกฮัมมิงเบิร์ด:bird|กบแก้ว:toad|แมวป่าออนซิลลา:cat|ผีเสื้อมอร์โฟ:moth|งูพิษขนตา:snake|กิ้งก่าแอนดีส:lizard|ค้างคาว:bat|แมงป่อง:scorp|เต่าลำธาร:turtle|ปูน้ำจืด:crab','นายด่านหินดำ:golem|แร้งมรกตมูโซ:bird']
  };
  const bossNames = {
    cambodia:'เขี้ยวกรวดปางไพร:boar|นาครากไทร:snake|ยักษ์ผาบะซอลต์:golem|พญาค้างคาวคราม:bat|ไกรสรดาวไพลิน:cat',
    vietnam:'เลียงผาสายหมอก:ram|ผู้เฒ่าหินอ่อน:turtle|งูหลวงธารชมพู:snake|วิหคทับทิมแดง:bird|มังกรดาวหลุกเยน:dragon',
    myanmar:'เสือแดงแห่งลำน้ำ:cat|คชสารผาขาว:elephant|กระทิงเกราะทับทิม:boar|มังกรเตาหลอม:dragon|สิงห์ดาวโมก๊ก:cat',
    srilanka:'จอมปูร่อนกรวด:crab|คชสารจันทร์เสี้ยว:elephant|พญางูตาแมว:snake|ยูงราชันเกสรส้ม:bird|คชสารไพลินดาว:elephant',
    ethiopia:'แร้งมงกุฎเถ้า:bird|ยักษ์แยกภูผา:golem|แม่ผีเสื้อเจ็ดสี:moth|มังกรไฟเวลโล:dragon|จอมหมาป่าโอปอล:wolf',
    madagascar:'ฟอสซาเขี้ยวทราย:cat|เทนเรกราชาหนาม:arm|กิ้งก่าม่านม่วง:lizard|ผู้เฒ่ารากเบาบับ:golem|ผีเสื้อจันทราอีลากากา:moth',
    mozambique:'หมูป่าเขี้ยวดินแดง:boar|พญางูรากไม้:snake|ลิ่นเกราะทับทิม:arm|เสือดาวเพลิงชาด:cat|คชสารเลือดนก:elephant',
    tanzania:'แอนทิโลปเขาฝุ่น:ram|ยักษ์หินชีสต์:golem|แมงป่องหางม่วง:scorp|เหยี่ยวเปลวคราม:bird|ราชสีห์สามแสง:cat',
    zambia:'ปูยักษ์กรวดเขียว:crab|จระเข้รากน้ำ:lizard|เต่าเกราะไมกาดำ:turtle|เสือเงาสายแร่:cat|อสรพิษแก่นมรกต:snake',
    australia:'ดิงโกฝุ่นแดง:wolf|อีคิดนาเกราะหิน:arm|ผีเสื้อม่านรุ้ง:moth|วิหคอัสนีริดจ์:bird|วารานัสโอปอลดำ:dragon',
    russia:'ลิงซ์เขี้ยวน้ำแข็ง:cat|หมาป่าเงาสน:wolf|ยักษ์มาลาไคต์:golem|นกเค้าม่านแสง:bird|หมีแปรแสงอูราล:bear',
    brazil:'หมาป่าเคราทอง:wolf|อนาคอนดารากเถา:snake|อาร์มาดิลโลโพรงม่วง:arm|ทูแคนปีกทัวร์มาลีน:bird|จากัวร์แก้วสองสี:cat',
    colombia:'หมีแว่นหมอกเขา:bear|ยักษ์หินดำมูโซ:golem|งูหลวงสายแร่ขาว:snake|ผีเสื้อฝนมรกต:moth|แร้งมงกุฎมูโซ:bird'
  };
  const splitCreatures = text => text.split('|').map(word => word.split(':'));
  const floors = new Map();
  const byId = new Map();
  const roles = ['melee','ranged','poison'];
  function install(templates, definitions, levels) {
    for (const [regionNo,[country,[place,hue,layers,animals,chiefs]]] of Object.entries(regions).entries()) {
      const fauna=splitCreatures(animals), guardians=splitCreatures(chiefs);
      const strata=layers.split('|');
      for(let floor=1;floor<=5;floor++){
        const roster=[];
        const chiefsHere=[guardians[0],splitCreatures(bossNames[country])[floor-1]];
        for(const [slot,[baseName,shape]] of fauna.concat(chiefsHere).entries()){
          const rank=slot===11?'mini':slot===12?'boss':'';
          const role=roles[(slot+floor+regionNo)%3];
          const moves=templates.filter(x=>x.caveAttack.role===role);
          const move=moves[(slot+2*floor+regionNo)%moves.length];
          const type='mine_'+country+'_f'+floor+'_'+String(slot+1).padStart(2,'0');
          const name=(rank==='boss'?'บอส ':rank==='mini'?'มินิบอส ':'')+baseName+(rank==='boss'?'':' '+strata[floor-1]);
          const gem=MineGems.stone(country);
          const attack={...move.caveAttack,color:gem[3]};
          if(rank && role==='ranged'){attack.shots=rank==='boss'?5:3;attack.spread=rank==='boss'?0.75:0.46;}
          if(rank && role==='poison'){attack.duration+=1;attack.areaLife+=0.55;}
          const source=definitions[move.type], rewards=definitions[rank==='boss'?'golem':rank==='mini'?'rscorp':move.type];
          const entry={country,floor,type,name,shape,rank,place,slot,regionNo,hue,gem,caveAttack:attack};
          definitions[type]={...source,name,boss2:rank==='boss',mini:rank==='mini',big:!!rank,fly:['bird','bat','moth'].includes(shape),
            coins:rewards.coins,chance:rewards.chance,drops:rewards.drops,hp:Math.round((rank==='boss'?188:rank==='mini'?85:source.hp)*(1+floor*.075)),
            dmg:Math.round(source.dmg*(rank==='boss'?1.65:rank==='mini'?1.32:1)*(1+floor*.03)),spd:source.spd+(slot%4)-2,
            windT:source.windT+(rank?0.18:0),worldCreature:entry,caveAttack:attack};
          levels[type]=levels[rank==='boss'?'golem':rank==='mini'?'rscorp':move.type];
          byId.set(type,entry); roster.push(entry);
        }
        floors.set(country+'/'+floor,roster);
      }
    }
  }
  function roster(m){return m && floors.get(m.country+'/'+(m.tier||1));}
  function nearSave(m,x,y,margin=0){return !!(m.cp && regions[m.country] && Math.hypot(x-m.cp.x,y-m.cp.y)<64+margin);}
  function distribute(m,groups){
    const entries=roster(m); if(!entries)return;
    const bossPoint=m.endRoute.boss;
    const bossGroup=groups.findLast(g=>g.x===bossPoint[0]*16+8 && g.y===bossPoint[1]*16+12 && !g.trail);
    const lane=groups.filter(g=>g.routeEncounter && !nearSave(m,g.x,g.y,24)).sort((a,b)=>a.y-b.y || a.x-b.x);
    // One existing slot near the route's midpoint becomes the single miniboss.
    const mid=lane[Math.floor(lane.length/2)];
    const order=Array.from({length:11},(_,i)=>(i*7+m.tier+entries[0].regionNo)%11);
    let pathIndex=0, caveIndex=4;
    const laneTypes=new Map(lane.filter(g=>g!==mid).map(g=>[g,entries[order[pathIndex++%11]].type]));
    for(const g of groups){
      if(g===mid || g===bossGroup){
        g.type=entries[g===mid?11:12].type;g.n=g.left=1;g.champ=false;
      }else{
        g.type=laneTypes.get(g)||entries[order[caveIndex++%11]].type;
        if(nearSave(m,g.x,g.y,24))g.sanctuary=true;
      }
    }
  }
  return {install,roster,byId,regions,nearSave,distribute};
})();

// Four aligned rows (front, back, left, right) × two footfalls, wind-up and strike.
const WorldMineArt = (() => {
  const sheets = new Map();
  const frames = new Map();
  const rowFor = {down:0,up:1,left:2,right:3};
  const frameSize = 192;
  function sheetFor(shape) {
    if (!sheets.has(shape)) {
      const image = new Image();
      image.src = 'creature-sprites/' + shape + '.webp';
      sheets.set(shape, image);
    }
    return sheets.get(shape);
  }
  // Hand-pixelled stone silhouettes, one pixel grid per anatomical attachment.
  const cuts = {
    prism:['....1331....','...243331...','..24453331..','.2455533321.','124555333221','124533333221','124533333221','123533333221','123533333221','123533332221','.1233332221.','..12332221..','...112211...'],
    corundum:['....1331....','..13444331..','.1244553321.','124553333221','124553332221','125533322221','.1233322221.','..12222221..','...112211...'],
    octahedron:['.....4.....','....345....','...23453...','..2345532..','.223355322.','23333333321','.223333221.','..2233221..','...22221...','....121....','.....1.....'],
    star:['...13331...','..2455531..','.233435321.','12334333221','12334443321','12544444521','12334443321','.223435321.','..1233321..','...12221...'],
    opal:['...133331...','..24553321..','.2455333221.','125533233321','123343322521','123353225321','123222343221','.1223322221.','..12222221..','...111111...']
  };
  const profiles = new Map();
  function attachStones(ctx,d,row,col) {
    const profileKey=d.shape+'/'+row+'/'+col;
    let profile=profiles.get(profileKey);
    if(!profile){
      const pixels=ctx.getImageData(0,0,frameSize,frameSize).data;
      let x0=frameSize,y0=frameSize,x1=0,y1=0;
      for(let y=0;y<frameSize;y+=2)for(let x=0;x<frameSize;x+=2){
        if(pixels[(y*frameSize+x)*4+3]<180)continue;
        x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
      }
      const anatomy=MineGems.anatomy(d.shape), [u,v]=anatomy[row<2?1:2];
      const targets=[[u,v,1],[row<2?1-u+.14:u+.19,v+.09,.75],[u-.17,v+.07,.65]];
      profile=targets.map(([fx,fy,s])=>{
        const tx=x0+(x1-x0)*(row===3?1-fx:fx),ty=y0+(y1-y0)*fy;
        // Choose opaque body pixels even when wings or a neck shift during an attack.
        let best=Infinity,anchor=[tx,ty,s];
        for(let y=y0;y<=y1;y+=3)for(let x=x0;x<=x1;x+=3){
          if(pixels[(y*frameSize+x)*4+3]<200)continue;
          const distance=(x-tx)**2+(y-ty)**2;
          if(distance<best){best=distance;anchor=[x,y,s];}
        }
        return anchor;
      });
      profiles.set(profileKey,profile);
    }
    const [,cut,dark,body,light]=d.gem;
    const colors=[null,'#20232d',dark,body,light,body];
    // Intermediate facet value keeps the highlight from flattening the crystal face.
    colors[5]='#'+[1,3,5].map(i=>Math.round(.62*parseInt(body.slice(i,i+2),16)+.38*parseInt(light.slice(i,i+2),16)).toString(16).padStart(2,'0')).join('');
    const pattern=cuts[cut],count=d.rank==='boss'?3:d.rank==='mini'||['ram','moth','bat'].includes(d.shape)?2:1;
    for(const [x,y,scale] of profile.slice(0,count).reverse()){
      const px=Math.max(2,Math.round((d.rank?3.2:2.7)*scale));
      const left=Math.round(x-pattern[0].length*px/2),top=Math.round(y-pattern.length*px*.65);
      const lean=(row===2?1:row===3?-1:Math.sign(x-96))*(cut==='opal'?.13:.31);
      for(let j=0;j<pattern.length;j++)for(let i=0;i<pattern[j].length;i++){
        const color=colors[pattern[j][i]];if(!color)continue;
        ctx.fillStyle=color;ctx.fillRect(left+i*px+Math.round((pattern.length/2-j)*lean)*px,top+j*px,px,px);
      }
    }
  }
  function sprite(d, dir, col) {
    const sheet = sheetFor(d.shape);
    if (!sheet.complete || !sheet.naturalWidth) return null;
    const row = rowFor[dir] ?? 0, key = d.type + '/' + row + '/' + col;
    if (frames.has(key)) return frames.get(key);
    const tile = document.createElement('canvas');
    tile.width = tile.height = frameSize;
    tile.noHD = true;
    const ctx = tile.getContext('2d');
    const source = [sheet,col*frameSize,row*frameSize,frameSize,frameSize,0,0,frameSize,frameSize];
    ctx.drawImage(...source);
    // Tint only visible artwork. Preserve the original outline, luminance and alpha.
    ctx.globalCompositeOperation = 'color';
    ctx.globalAlpha = 0.23 + d.floor * 0.04;
    ctx.fillStyle = 'hsl(' + ((d.hue + d.floor * 11 + d.slot * 3) % 360) + ' 76% 52%)';
    ctx.fillRect(0,0,frameSize,frameSize);
    ctx.globalAlpha=1;
    ctx.globalCompositeOperation='destination-in';
    ctx.drawImage(...source);
    ctx.globalCompositeOperation='source-over';
    attachStones(ctx,d,row,col);
    if (frames.size >= 192) frames.delete(frames.keys().next().value);
    frames.set(key,tile);
    return tile;
  }
  // Sizes use the same world-pixel scale as the miner. Quadrupeds read by body length.
  const bodySizes = {bug:22,moth:26,toad:24,bat:28,bird:27,crab:29,scorp:30,snake:34,
    lizard:32,arm:33,turtle:35,cat:40,wolf:38,ram:40,boar:42,bear:47,elephant:50,dragon:48,golem:49};
  const thaiSizes = {stone_pangolin:33,quartz_quail:24,jade_toad:24,sapphire_ferret:29,indigo_bell_squid:32,
    copper_cicada:22,cracked_mask_ghost:39,three_eyed_raven:30,stitched_sack_ghost:37,lava_horn_ram:40,
    magma_throat_ibis:32,sulfur_armadillo:34,crystal_jaw_newt:31,abyssal_lanternfish:30,violet_anemone:27};
  function displaySize(def, champion) {
    const creature=def.worldCreature;
    let base=creature ? bodySizes[creature.shape] : thaiSizes[def.filename?.slice(12).replaceAll('-','_')];
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
    const img=sprite(d,e.dir,col);
    g.save();
    g.fillStyle='rgba(12,9,18,.32)';
    g.beginPath();g.ellipse(x,y-1,(def.r+2)*5/6,def.r*.43*5/6,0,0,Math.PI*2);g.fill();
    if (d.rank || e.champ) groundLight(g,x,y-1,size*.37,e.t,d.rank || 'champion');
    if (img) {
      g.imageSmoothingEnabled=false;
      const lift=def.fly?4+Math.sin(e.t*5)*1.1:0;
      if(e.flash>0)g.filter='brightness(1.5)';
      const bottom=y-lift+size*(15/frameSize)/(G.TILT||1);
      g.drawImage(img,x-size/2,bottom-size,size,size);
    }
    g.restore();
  }
  return {draw,sprite,sheetFor,displaySize,groundLight};
})();
