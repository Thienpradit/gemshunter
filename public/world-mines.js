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
          const angle=(hue+floor*9+slot*3)*Math.PI/180;
          const color='#'+[0,-2*Math.PI/3,2*Math.PI/3].map(offset=>Math.round(159+83*Math.cos(angle+offset)).toString(16).padStart(2,'0')).join('');
          const attack={...move.caveAttack,color};
          if(rank && role==='ranged'){attack.shots=rank==='boss'?5:3;attack.spread=rank==='boss'?0.75:0.46;}
          if(rank && role==='poison'){attack.duration+=1;attack.areaLife+=0.55;}
          const source=definitions[move.type], rewards=definitions[rank==='boss'?'golem':rank==='mini'?'rscorp':move.type];
          const entry={country,floor,type,name,shape,rank,place,slot,regionNo,hue,caveAttack:attack};
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

// Render mineral creatures from faceted body parts in four views. Cache finished frames, not whole maps.
const WorldMineArt = (() => {
  const frames=new Map(), TAU=Math.PI*2;
  const forms={
    cat:[7,11,6,8],wolf:[6,12,6,9],bear:[9,12,8,9],boar:[9,10,7,7],ram:[7,10,7,11],arm:[8,11,7,5],
    lizard:[6,12,4,4],dragon:[8,13,7,9],turtle:[10,10,7,5],toad:[10,8,6,5],snake:[5,5,5,3],
    bird:[6,8,6,11],bat:[5,6,5,12],moth:[4,7,4,12],bug:[7,9,5,5],crab:[11,7,4,5],scorp:[7,10,4,5],
    elephant:[10,12,9,11],golem:[9,7,9,13]
  };
  function sprite(d,dir,pose){
    const key=d.type+'/'+dir+'/'+pose;
    if(frames.has(key))return frames.get(key);
    const c=document.createElement('canvas');c.width=c.height=112;
    const g=c.getContext('2d'), surfaces=[];
    const angle={down:0,left:Math.PI/2,up:Math.PI,right:-Math.PI/2}[dir]||0;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    const tone=(d.hue+d.floor*9+d.slot*3)%360;
    const coat=(tone+([22,300,40,130,260][d.floor-1])+d.slot*9)%360;
    const skin=[coat,37,36], shell=[tone,68,42],night=[coat,25,22],bone=[42,48,76],light=[tone,86,77];
    function project([x,y,z]){
      const dx=x*cos-y*sin,dy=x*sin+y*cos;
      return [56+dx*1.84,83+(dy*.52-z)*1.84,dy+z*.52];
    }
    function face(points,paint,shade){
      const p=points.map(project);
      surfaces.push({p,depth:p.reduce((n,q)=>n+q[2],0)/p.length,
        fill:'hsl('+paint[0]+' '+paint[1]+'% '+Math.max(8,Math.min(96,paint[2]+shade))+'%)'});
    }
    function stone(x,y,z,rx,ry,rz,paint,n=8){
      const rows=[];
      for(let j=0;j<=4;j++){
        const phi=-Math.PI/2+j*Math.PI/4,r=Math.cos(phi);
        rows.push(Array.from({length:n},(_,i)=>{const a=i*TAU/n;return [x+rx*r*Math.cos(a),y+ry*r*Math.sin(a),z+rz*Math.sin(phi)];}));
      }
      for(let j=0;j<4;j++)for(let i=0;i<n;i++){
        const k=(i+1)%n,a=(i+.5)*TAU/n+angle;
        face([rows[j][i],rows[j][k],rows[j+1][k],rows[j+1][i]],paint,5*j-8-8*Math.cos(a)-5*Math.sin(a));
      }
    }
    function spike(x,y,z,r,tip,paint,n=5){
      const ring=Array.from({length:n},(_,i)=>[x+r*Math.cos(i*TAU/n),y+r*Math.sin(i*TAU/n),z]);
      for(let i=0;i<n;i++)face([ring[i],ring[(i+1)%n],tip],paint,13*Math.sin(i*TAU/n+angle));
    }
    const s=d.shape,[w,l,h,base]=forms[s];
    const step=pose<4?[0,1,0,-1][pose]:0,wind=pose===4,hit=pose===5;
    const bob=pose===1||pose===3?0.9:0, z=base+bob+(wind?-1:0), headY=l*.78+(hit?3:wind?-2:0);
    const isWing=['bird','bat','moth','dragon'].includes(s), arth=['bug','scorp','crab'].includes(s);
    if(s==='snake'){
      for(let j=0;j<9;j++)stone(Math.sin(j*.72+step*.24)*6,8-j*2.4,3+(8-j)*.38,4.7-j*.30,4.2-j*.20,3.4-j*.15,j%2?shell:skin);
    }else{
      stone(0,0,z,w,l,h,['turtle','arm','bug','crab'].includes(s)?shell:skin,10);
      const pairs=arth?4:isWing && s!=='dragon'?1:2;
      for(let k=0;k<pairs;k++)for(const side of [-1,1]){
        const dy=(k-(pairs-1)/2)*(pairs===4?3.8:11)+step*side*(k%2?-1.7:1.7);
        const xx=side*w*(arth?1.02:.65),len=arth?4:s==='toad'?5:3;
        stone(xx,dy,z*.49,len,3.1,z*.46,night,6);
        stone(xx+side*(arth?2.8:1),dy+1.7,1.6,len+1,3.9,1.7,skin,6);
        if(!arth)spike(xx,dy+3,2,1.3,[xx,dy+5,1],bone);
      }
    }
    if(['wolf','cat','lizard','dragon','arm','scorp'].includes(s)){
      for(let j=1;j<=5;j++)stone(Math.sin(j*.6+step*.35)*j*.9,-l*.68-j*1.8,z*.65+(s==='scorp'?j*1.9:0),Math.max(1.2,4-j*.48),3.2,Math.max(1.3,3.5-j*.38),s==='scorp'?shell:skin,6);
    }
    if(isWing){
      for(const side of [-1,1])for(let j=0;j<4;j++){
        const span=side*(w+6+j*1.7), lift=z+4+(Math.abs(step)*3)+(wind?5:0);
        face([[side*2,4,z+3],[span+side*4,3-j*2,lift+3],[span+side*(6-j),-7-j*2,lift-j],[side*3,-5,z]],j%2?shell:night,4*j);
      }
    }
    const hz=z+(s==='golem'?11:s==='bird'?5:s==='snake'?6:2), hy=s==='golem'?2:headY;
    stone(0,hy,hz,w*.66,Math.max(4,w*.64),s==='golem'?5:h*.68,skin);
    if(['wolf','boar','bear','lizard','dragon','cat'].includes(s))stone(0,hy+4,hz-1,w*.45,4.3,2.8,night);
    if(s==='bird')spike(0,hy+3,hz,3,[0,hy+11,hz-1],bone);
    if(s==='elephant')for(let j=0;j<4;j++)stone(0,hy+5+j*.7,hz-2-j*2.2,2.7-j*.3,2.8,2.4,skin,6);
    for(const side of [-1,1]){
      stone(side*w*.39,hy+3.8,hz+1.5,1.7,1.3,1.65,night,6);
      stone(side*w*.43,hy+4.3,hz+1.9,.95,.9,.9,light,5);
      if(['cat','wolf','bat','bear','elephant'].includes(s))spike(side*w*.50,hy-1,hz+2,s==='elephant'?5:2.8,[side*w*.77,hy-2,hz+(s==='bat'?9:6)],skin);
      if(['ram','boar','elephant','dragon'].includes(s))spike(side*w*.42,hy+2,hz+(s==='ram'?4:-1),2.1,[side*(w*.68),hy+(s==='ram'?-3:6),hz+6],bone);
      if(['crab','scorp','golem'].includes(s)){
        const reach=hit?6:wind?-2:0;
        stone(side*(w+3),hy+reach,hz-2,4.5,5,4,shell);
        for(const prong of [-1,1])spike(side*(w+3)+prong*1.7,hy+reach+2,hz-1,1.7,[side*(w+3)+prong*2.3,hy+reach+7,hz],bone);
      }
    }
    // Tier affects the actual contours: crystals grow on back, flanks and crown.
    for(let i=0;i<d.floor+2;i++){
      const a=i*2.4+d.regionNo*.42, x=Math.cos(a)*w*.58, y=Math.sin(a)*l*.61;
      spike(x,y,z+h*.70,1.7+(i%2),[x*1.28,y*1.17,z+h+2+(i%3)*1.7+d.floor*.35],shell);
    }
    if(d.rank){
      const count=d.rank==='boss'?7:3;
      for(let i=0;i<count;i++){const a=i*TAU/count,x=Math.cos(a)*w*.43,y=hy+Math.sin(a)*3;
        spike(x,y,hz+3,1.8,[x*1.35,y,hz+8+2*(i%2)],bone);}
    }
    surfaces.sort((a,b)=>a.depth-b.depth);
    for(const f of surfaces){g.fillStyle=f.fill;g.beginPath();f.p.forEach(([x,y],i)=>i?g.lineTo(Math.round(x),Math.round(y)):g.moveTo(Math.round(x),Math.round(y)));g.closePath();g.fill();}
    if(frames.size>=384)frames.delete(frames.keys().next().value);
    frames.set(key,c);return c;
  }
  function draw(g,e,d,S,T){
    const pose=e.atkT>0?5:e.wind>0?4:e.moving||d.fly?Math.floor(e.t*1000/d.caveAttack.walk)%4:0;
    const frame=sprite(d.worldCreature,e.dir,pose),size=d.boss2?84:d.mini?66:e.champ?55:43;
    const x=S(e.x),y=T(e.y),lift=d.fly?4+Math.sin(e.t*5)*1.4:0;
    g.save();g.fillStyle='rgba(12,9,18,.38)';g.beginPath();g.ellipse(x,y-1,d.r+2,d.r*.43,0,0,TAU);g.fill();
    g.imageSmoothingEnabled=false;
    if(e.flash>0)g.filter='brightness(1.7)';
    g.drawImage(frame,x-size/2,y-size*.79-lift,size,size);g.restore();
  }
  return {draw,sprite};
})();
