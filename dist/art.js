import {neighbours,moveCost,ALERTS,TERRAINS} from './engine.js';
const C={ink:'#10191b',edge:'#243137',stone:'#3b4948',moss:'#58715b',green:'#8ac09e',light:'#d5efd1',gold:'#e5b567',sun:'#ffe3a1',copper:'#ad6d45',red:'#ce665a',darkred:'#743b3e',blue:'#7baec7',violet:'#aa91c6',cream:'#f0d8ac'};
const sprites={
 hero:[
 '      gggg      ','    ggLLLLgg    ','   ggLggggLgg   ','  ggLggggggLgg  ','  gggkkffkkggg  ','  gggfEfffEggg  ','   ggffffffgg   ','    gggffggg    ','   gggggggggg   ','  ggGgggggGggg  ','  ffGgGGggGgff  ','  ffGgggggGgff  ','   GGbbbbGG     ','   GGGGGGGG     ','   GGG  GGG     ','   bbb  bbb     ','  bbbb  bbbb    '],
 knight:[
 '     sssss      ','    sLLLLss     ','   sssssssss    ','   ssEkkkEss    ','   sskkkkkss    ','    sssssss     ','   bbssssbbb    ','  ssbbLLbbsss   ','  ssbbbbbbsss   ','  ssbbLLbbsss   ','  ssggggggsss   ','   sssssss      ','   sss sss      ','   sss sss      ','  kkkk kkkk     '],
 mage:[
 '       vv       ','      vvv       ','     vvvv       ','    vvLvvv      ','   vvvvvvvv     ','  vvvfEfffvvv   ','    vfffffv     ','    vvvvvvv     ','   vvvvLvvvv    ','  vvvvvLvvvvv   ','  ffvvvLvvvff   ','  ffvvvLvvvff   ','   vvvvvvvvv    ','   vvvv vvvv    ','   kkk   kkk    '],
 slime:[
 '      gggg      ','    gggLLggg    ','   ggLLLLLggg   ','  ggLLgggggggg  ',' gggggggggggggg ',' ggkkggggkkgggg ',' ggEEggggEEgggg ',' gggggkkggggggg ','  gggggggggggg  ','  GGGGGGGGGGGG  '],
 skeleton:[
 '     fffff      ','    fLfffLf     ','   ffffffff     ','   ffkkffkkf    ','    fffffff     ','     fkfkf      ','      fff       ','  ff  fff  ff   ','   ffffffff     ','  f  ffff  f    ','  f  ffff  f    ','  f  ffff  f    ','     ffff       ','     f  f       ','    ff  ff      ','   fff  fff     '],
 bat:[
 ' v            v ',' vv  v    v  vv ',' vvv vv  vv vvv ','  vvvvLLLLvvvv  ','  vvvvErrEvvvv  ','   vvvrrrrvvv   ','    vvvvvvvv    ','      vvvv      ','      v  v      '],
 sentinel:[
 '    vv    vv    ','    vvLLLLvv    ','    vssssssv    ','   ssrkkkkrss   ','   ssskkkksss   ','    ssssssss    ','  ssssvvvvssss  ',' ssssvvLLvvssss ',' ssssvvLLvvssss ',' ssssvvvvvvssss ','  sssvvvvvvsss  ','    ssssssss    ','    sss  sss    ','    sss  sss    ','   ssss  ssss   '],
 dragon:[
 '  rr              rr  ','  rrr    rr      rrr  ','   rrr  rrrr    rrr   ','   rrrrrrrrrrrrrrr    ','  rrrrrrLLrrrrrrrrrr  ',' rrrrkrLLLrkr   rrrr  ',' rrrrkErLrEkr rrrrrr  ','   rrrrrrrrrrrrrrrrrr ','    rrrfrffrrrrrrrrr  ','   rrrrffffrrrrrrrr   ','   rrrrrrLrrrrrrrrr   ',' rrrrrrrLLLrrrrrrrrr  ',' rrrrrrrLLLrrrrrrrrrr ','   rrrrLLLLLrrrrr  rr ','   rrrrLLLLLrrrrr   r ','    rrrrrrrrrrrrr     ','     rrrr  rrrr       ','    frrrf  frrrf      ']
};
const palette={g:'#75a88b',G:'#3d6d5b',L:'#d5e7b7',k:'#172023',E:'#f7ce7d',f:'#ddc9a0',b:'#675447',s:'#718384',v:'#8d76b2',r:'#a95348'};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function poly(c,p,color){c.fillStyle=color;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
export function sprite(c,name,x,y,scale=1,t=0){
 const a=sprites[name]||sprites.hero;const width=a[0].length;const bob=name==='bat'?Math.round(Math.sin(t*6)*2):name==='slime'?Math.round(Math.sin(t*3)):0;
 x=Math.round(x-width*scale/2);y=Math.round(y-a.length*scale+bob);
 a.forEach((row,j)=>[...row].forEach((p,i)=>{if(p!==' ')rect(c,x+i*scale,y+j*scale,scale,scale,palette[p]);}));
}
export function icon(c,name,x=0,y=0,size=32){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(size/32,size/32);const r=(a,b,w,h,col)=>rect(c,a,b,w,h,col);const p=(pts,col)=>poly(c,pts,col);
 const blade=()=>{p([[11,21],[22,3],[26,5],[16,24]],C.blue);p([[13,20],[24,4],[25,6],[15,22]],C.light);r(8,19,11,3,C.gold);r(9,22,4,7,C.copper);r(7,28,5,3,C.gold);};
 if(name in sprites){sprite(c,name,16,30,1.5);}
 else if(['dagger','swords'].includes(name)){blade();if(name==='swords'){c.translate(31,0);c.scale(-1,1);blade();}}
 else if(name==='axe'){r(13,7,4,24,C.copper);r(12,26,6,4,C.gold);p([[7,4],[23,4],[27,11],[23,18],[17,14],[17,7],[13,7],[13,14],[7,18],[4,11]],C.blue);r(6,8,4,6,C.light);}
 else if(name==='boot'){p([[10,3],[21,3],[21,18],[28,21],[28,27],[7,27],[6,20],[10,18]],C.copper);r(10,3,12,4,C.gold);r(10,9,6,3,'#d0a16b');r(10,15,5,3,'#d0a16b');r(7,26,21,3,C.ink);r(6,29,23,2,C.gold);}
 else if(['shield','tower'].includes(name)){p([[4,5],[16,2],[28,5],[27,19],[23,25],[16,30],[9,25],[5,19]],C.gold);p([[7,8],[16,5],[25,8],[24,18],[20,23],[16,26],[12,23],[8,18]],C.green);r(14,7,4,18,C.light);r(10,12,12,4,C.light);if(name==='tower'){r(8,2,5,6,C.blue);r(20,2,5,6,C.blue);}}
 else if(['book','tome','map'].includes(name)){r(4,7,24,21,C.ink);p([[4,5],[14,5],[16,7],[18,5],[28,5],[28,25],[18,25],[16,27],[14,25],[4,25]],name==='tome'?C.violet:C.cream);r(15,7,2,18,C.copper);r(6,9,6,2,C.copper);r(6,14,7,2,C.copper);r(20,10,6,2,C.copper);r(19,15,7,2,C.copper);r(19,20,5,2,C.copper);if(name==='map'){r(20,8,3,11,C.green);r(6,19,7,3,C.green);}}
 else if(name==='coin'){p([[10,3],[23,3],[28,8],[28,24],[23,29],[10,29],[5,24],[5,8]],C.copper);p([[10,3],[21,3],[26,8],[26,22],[21,27],[10,27],[5,22],[5,8]],C.gold);r(11,7,9,2,C.sun);r(10,9,3,14,C.sun);r(13,13,8,3,C.copper);r(16,9,3,14,C.sun);}
 else if(name==='potion'){r(12,2,8,4,C.copper);r(11,6,10,5,C.blue);p([[11,11],[21,11],[26,18],[26,27],[22,30],[10,30],[6,27],[6,18]],C.blue);p([[9,19],[23,19],[23,26],[20,28],[12,28],[9,26]],C.red);r(9,16,3,7,C.light);r(12,7,3,4,C.light);}
 else if(['crystal','heartgem'].includes(name)){p([[10,2],[22,2],[29,12],[16,30],[3,12]],name==='heartgem'?C.red:C.blue);p([[10,2],[16,3],[12,12],[3,12]],C.light);p([[16,3],[22,2],[29,12],[20,12]],name==='heartgem'?C.gold:'#93dce0');p([[12,12],[20,12],[16,30]],name==='heartgem'?'#e49165':'#b9f3e7');}
 else if(name==='crown'){p([[3,6],[10,12],[16,3],[22,12],[29,6],[26,27],[6,27]],C.gold);r(6,24,20,4,C.copper);r(13,16,6,6,C.red);r(7,16,3,3,C.sun);r(23,16,3,3,C.sun);}
 else if(name==='chest'){r(4,12,24,15,C.copper);r(6,7,20,4,C.copper);r(4,11,24,5,C.gold);r(7,8,18,3,C.gold);r(4,19,24,3,C.gold);r(15,15,4,9,C.sun);r(5,26,23,3,C.ink);r(6,14,2,12,'#d8a269');r(23,14,2,12,C.gold);}
 else if(name==='flame'||name==='camp'){if(name==='camp'){r(4,26,24,4,C.copper);r(7,23,20,4,'#654638');}p([[16,1],[20,10],[25,7],[27,19],[22,28],[10,28],[4,21],[7,12],[12,16]],C.red);p([[16,8],[19,17],[22,15],[23,22],[19,27],[12,27],[9,22],[12,17]],C.gold);p([[16,16],[19,23],[17,27],[13,25]],C.sun);}
 else if(name==='lantern'){r(12,2,8,3,C.gold);r(10,5,12,3,C.copper);r(7,10,18,3,C.copper);r(8,13,3,13,C.copper);r(22,13,3,13,C.copper);r(11,13,11,12,C.gold);r(14,15,5,8,C.sun);r(7,26,18,4,C.copper);}
 else if(name==='cloak'||name==='ghost'){p([[12,3],[22,3],[26,9],[25,18],[29,28],[23,26],[20,30],[15,27],[9,29],[5,26],[9,17],[8,10]],name==='ghost'?C.blue:C.green);r(12,10,11,8,C.ink);r(14,12,2,3,C.sun);r(20,12,2,3,C.sun);r(10,21,3,4,C.light);}
 else if(name==='wing'||name==='feather'){p([[26,2],[28,7],[25,15],[17,22],[10,24],[6,30],[4,28],[9,21],[9,15],[15,8]],C.light);p([[26,4],[12,20],[7,28],[5,27],[13,16]],C.green);r(17,9,3,2,C.green);r(12,15,3,2,C.green);}
 else if(name==='leaf'){p([[27,3],[28,14],[22,23],[13,26],[7,23],[3,29],[2,27],[7,20],[7,12],[15,5]],C.green);p([[27,4],[12,21],[4,28],[3,26],[14,16]],C.light);}
 else if(name==='compass'){p([[12,3],[22,3],[28,10],[28,21],[21,28],[10,28],[3,21],[3,11]],C.gold);r(8,9,16,14,C.edge);p([[19,6],[19,19],[9,25],[13,12]],C.red);p([[19,6],[15,16],[9,25],[13,12]],C.light);}
 else if(name==='door'){r(6,3,21,27,C.stone);r(10,7,13,23,C.ink);r(15,11,7,19,C.green);r(15,15,2,2,C.gold);r(3,29,26,3,C.copper);}
 else if(name==='shrine'){r(7,25,20,5,C.stone);r(10,21,14,4,C.blue);r(13,11,8,10,C.stone);p([[17,2],[23,8],[17,14],[11,8]],C.violet);r(16,5,2,5,C.light);}
 else if(name==='noise'){r(6,12,7,8,C.gold);p([[12,12],[19,6],[19,26],[12,20]],C.gold);r(23,11,2,10,C.copper);r(28,7,2,18,C.copper);}
 else if(name==='heart'){p([[3,9],[7,5],[12,5],[16,9],[20,5],[25,5],[29,9],[29,16],[16,29],[3,16]],C.red);r(7,8,5,3,'#f0a18a');}
 else if(name==='skull'){r(8,4,17,18,C.cream);r(5,8,23,11,C.cream);r(9,11,6,6,C.ink);r(20,11,6,6,C.ink);r(12,22,10,6,C.cream);r(15,23,2,5,C.ink);}
 else if(name==='merchant'){r(10,7,15,21,C.copper);r(9,3,18,5,C.gold);r(12,10,4,7,C.sun);r(6,25,23,5,C.copper);r(17,16,9,9,C.gold);}
 else{r(14,7,4,13,C.gold);r(14,24,4,4,C.gold);}
 c.restore();
}
export function paintIcons(root=document){root.querySelectorAll('canvas[data-icon]').forEach(el=>{const c=el.getContext('2d');c.clearRect(0,0,el.width,el.height);c.imageSmoothingEnabled=false;icon(c,el.dataset.icon,0,0,el.width);});}

// A separate sound map keeps the action diorama large and readable.
export function makeRenderer(canvas,getState,minimap){
 const c=canvas.getContext('2d'),mc=minimap.getContext('2d');
 const bg=new Image(),atlas=new Image(),heroines=new Image();bg.src='./assets/catacombs-v2.png';atlas.src='./assets/characters-v2.png';heroines.src='./assets/heroines-v2.png';
 const W=960,H=540;canvas.width=W;canvas.height=H;minimap.width=360;minimap.height=244;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let alive=true,zoom=false,hover=-1,lastPos=-1,lastSound=-1,entered=0,sounded=0,hitAt=-10000,damageAt=-10000,particles=[],label='',lastTime=0;
 const now=()=>performance.now();
 function rect2(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
 function light(ctx,x,y,r,color){const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 function actor(kind,x,y,size,t,flip=false){
  const ids={hero:0,rogue:0,knight:1,mage:2,skeleton:3,slime:3,bat:3,sentinel:4,dragon:5},id=ids[kind]??0;
  c.save();c.translate(Math.round(x),Math.round(y));if(flip)c.scale(-1,1);
  const breathe=reduced?0:Math.sin(t*2+id)*1.3;
  c.fillStyle='#050a0ac0';c.beginPath();c.ellipse(0,-4,size*.27,size*.035,0,0,Math.PI*2);c.fill();
  if(atlas.complete&&atlas.naturalWidth){c.imageSmoothingEnabled=false;const isHero=id<3&&heroines.complete&&heroines.naturalWidth,source=isHero?heroines:atlas,sw=source.naturalWidth/3,sh=source.naturalHeight/2;c.drawImage(source,(id%3)*sw,Math.floor(id/3)*sh,sw,sh,-size/2,-size*(isHero?.99:.92)+breathe,size,size);}
  else sprite(c,kind==='rogue'?'hero':kind,0,0,5,t);
  c.restore();
 }
 function flame(x,y,t,size=1){
  c.save();c.translate(x,y);c.scale(size,size);light(c,0,-6,62+Math.sin(t*5)*3,'#e59a3328');
  for(let i=0;i<7;i++){const h=8+(Math.sin(t*10+i*2)+1)*6;rect2(c,-9+i*3,-h,3,h,['#b75728','#db7732','#f2ad4e','#ffe7a5'][i%4]);}
  c.restore();
 }
 function prop(r,t){
  const x=690,y=423;
  if(r.enemy?.hp>0)return;
  if(r.type==='chest'){
   c.fillStyle='#080b09b0';c.beginPath();c.ellipse(x,y,68,12,0,0,Math.PI*2);c.fill();
   rect2(c,x-54,y-49,108,48,'#28221a');
   for(let i=0;i<5;i++){rect2(c,x-50,y-45+i*8,100,6,i%2?'#625038':'#735a3c');rect2(c,x-45+i*17,y-45,2,41,'#907047');}
   for(const a of [-40,31]){rect2(c,x+a,y-49,9,48,'#293132');rect2(c,x+a,y-49,9,3,'#aa9270');for(let j=0;j<3;j++)rect2(c,x+a+3,y-39+j*14,3,3,'#b9a177');}
   if(!r.used){rect2(c,x-52,y-64,104,18,'#695137');rect2(c,x-49,y-65,98,3,'#967849');rect2(c,x-6,y-45,13,18,'#bc9650');light(c,x,y-30,80,'#deac4020');}
   else{rect2(c,x-50,y-60,100,16,'#141b17');rect2(c,x-50,y-82,100,17,'#4c402d');}
  }else if(r.type==='camp'){
   for(let i=0;i<8;i++){const a=i*Math.PI/4;rect2(c,x+Math.cos(a)*29-7,y+Math.sin(a)*8,14,8,'#4e5550');}
   if(!r.used)flame(x,y-6,t,2);
  }else if(r.type==='relic'||r.type==='shrine'){
   rect2(c,x-44,y-14,88,13,'#333e3a');rect2(c,x-32,y-59,64,46,'#3c4840');rect2(c,x-40,y-68,80,10,'#677063');
   for(let k=0;k<5;k++)rect2(c,x-25+k*12,y-48,3,27,'#26322f');
   if(!r.used){light(c,x,y-90,90,r.id===15?'#de683144':'#75d3cc33');icon(c,r.relic?.icon||'crystal',x-24,y-125+Math.sin(t*2)*4,48);}
  }else if(r.type==='merchant'){actor('mage',x,y,180,t,true);}
  else if(r.type==='entry'){light(c,720,280,145,'#c7e0a418');}
 }
 function drawStage(ms){
  const s=getState(),r=s.rooms[s.pos],t=ms/1000,walkAge=(ms-entered)/700,attackAge=(ms-hitAt)/480;
  c.imageSmoothingEnabled=false;c.clearRect(0,0,W,H);
  if(zoom){drawMap(c,W,H,ms,true);return;}
  c.save();if(!reduced&&ms-damageAt<350)c.translate(Math.sin(ms*.08)*4,0);
  if(bg.complete&&bg.naturalWidth){c.drawImage(bg,0,0,bg.naturalWidth,bg.naturalHeight,0,-60,W,640);}else rect2(c,0,0,W,H,'#162220');
  const tint=r.row===3?'#47222022':r.terrain==='water'?'#18334325':r.terrain==='moss'?'#284b3520':'#090e1020';rect2(c,0,0,W,H,tint);
  // Shaft light, airborne dust, fire sparks and floor glints are animated separately.
  c.fillStyle='#a8d9dc06';c.beginPath();c.moveTo(475,0);c.lineTo(630,480);c.lineTo(335,480);c.closePath();c.fill();
  for(let i=0;i<32;i++){
   const x=(i*89.31+s.pos*13)%W,y=(i*37+((reduced?0:t)*((i%3)+1)*3))%430;
   c.globalAlpha=.12+(Math.sin(t+i)+1)*.14;rect2(c,x+Math.sin(t*.3+i)*8,y,i%4===0?2:1,2,i%3?'#b6cab9':'#e6b86c');
  }c.globalAlpha=1;
  light(c,229,150,52+Math.sin(t*8)*4,'#d99c3226');light(c,775,150,52+Math.sin(t*7)*4,'#d99c3226');
  if(r.terrain==='water')for(let i=0;i<17;i++){const x=120+i*44,y=402+(i*19)%73;rect2(c,x,y,16+Math.sin(t*2+i)*5,1,'#83b4b338');}
  if(r.terrain==='shards')for(let i=0;i<27;i++){const x=60+(i*133)%850,y=400+(i*31)%84;rect2(c,x,y,4+(i%5),3,['#7f8067','#454c42','#b1a078'][i%3]);}
  const walking=!reduced&&walkAge<1,lunging=!reduced&&attackAge>=0&&attackAge<1;
  const hx=320-(walking?(1-walkAge)*95:0)+(lunging?Math.sin(attackAge*Math.PI)*90:0),hy=433+(walking?Math.sin(walkAge*25)*3:0);
  if(walking)for(let k=0;k<5;k++){c.globalAlpha=Math.max(0,(1-walkAge)*.5);rect2(c,hx-35-k*16,432+(k%2)*5,7,3,r.terrain==='water'?'#a2ccc1':'#b6ac8c');}c.globalAlpha=1;
  prop(r,t);light(c,hx+18,hy-63,96,s.role==='mage'?'#be8d4119':'#d39a341c');actor(s.role,hx,hy,244,t);
  if(s.hidden){c.globalAlpha=.22;light(c,hx,hy-75,98,'#559dba88');c.globalAlpha=1;}
  if(r.enemy?.hp>0){const ex=694+(lunging?Math.sin(attackAge*Math.PI)*15:0);actor(r.enemy.kind,ex,434,r.enemy.kind==='dragon'?300:232,t);
   if(r.enemy.mode!=='idle'){c.fillStyle=r.enemy.mode==='hunt'?'#ef8468':'#efc57b';c.font='bold 27px monospace';c.textAlign='center';c.fillText(r.enemy.mode==='hunt'?'!':'?',ex,211);}
  }
  if(lunging){c.save();c.strokeStyle='#f1dbc2';c.lineWidth=3;c.globalAlpha=Math.sin(attackAge*Math.PI);c.beginPath();c.arc(605,330,70,-1,.9);c.stroke();c.strokeStyle='#f4ad6d66';c.lineWidth=13;c.stroke();c.restore();}
  if(s.lastSound?.strength>0&&ms-sounded<2600&&!reduced){const age=(ms-sounded)/2600,x=s.lastSound.origin===s.pos?hx:800,col=s.lastSound.strength>=5?'#eab17c':'#9fd9cc';
   for(let k=0;k<3;k++){const p=(age*2+k*.3)%1,rad=20+p*(90+s.lastSound.strength*23);c.globalAlpha=(1-p)*.5;c.strokeStyle=col;c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.ellipse(x,437,rad,rad*.28,0,0,Math.PI*2);c.stroke();}c.setLineDash([]);c.globalAlpha=1;
  }
  particles=particles.filter(p=>ms-p.start<900);for(const p of particles){const age=(ms-p.start)/900;c.globalAlpha=1-age;rect2(c,p.x+p.dx*age,p.y+p.dy*age+age*age*65,p.size,p.size,p.col);}c.globalAlpha=1;
  if(ms-hitAt<900&&label){c.fillStyle='#ffdbb4';c.font='bold 38px monospace';c.textAlign='center';c.fillText(label,690,260-(ms-hitAt)/40);}
  const vignette=c.createLinearGradient(0,0,0,H);vignette.addColorStop(0,'#050b0b75');vignette.addColorStop(.28,'#0000');vignette.addColorStop(.75,'#0000');vignette.addColorStop(1,'#050b0bcc');c.fillStyle=vignette;c.fillRect(0,0,W,H);
  c.restore();
 }
 function mapPoint(id,w,h){return {x:w*.13+(id%4)*w*.246,y:h*.14+Math.floor(id/4)*h*.235};}
 function drawMap(ctx,w,h,ms,large=false){
  const s=getState(),adj=neighbours(s);ctx.imageSmoothingEnabled=false;rect2(ctx,0,0,w,h,'#0d1719');
  const pad=large?18:10,box=large?38:22;
  for(let y=0;y<h;y+=12)for(let x=0;x<w;x+=12)if((x+y)%36===0)rect2(ctx,x,y,1,1,'#42565122');
  for(const [a,b]of s.edges){const A=mapPoint(a,w,h),B=mapPoint(b,w,h),seen=s.rooms[a].seen&&s.rooms[b].seen;ctx.strokeStyle=seen?'#42514a':'#263331';ctx.lineWidth=seen?3:1;ctx.setLineDash(seen?[]:[3,5]);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();}ctx.setLineDash([]);
  for(const r of s.rooms){const p=mapPoint(r.id,w,h),here=r.id===s.pos,heard=s.lastSound?.field.find(x=>x.id===r.id),recent=s.lastSound?.turn===s.turn;
   if(heard&&recent){ctx.fillStyle=`rgba(226,155,93,${.07+heard.level*.023})`;ctx.beginPath();ctx.arc(p.x,p.y,box+8+Math.sin(ms/400)*2,0,Math.PI*2);ctx.fill();}
   rect2(ctx,p.x-box/2-2,p.y-box/2-2,box+4,box+4,here?'#dfc78e':adj.includes(r.id)?'#637f71':'#293b36');rect2(ctx,p.x-box/2,p.y-box/2,box,box,here?'#485a4b':r.seen?'#21322e':'#13201f');
   if(r.seen){
    if(here){ctx.fillStyle='#f5d88c';ctx.beginPath();ctx.moveTo(p.x,p.y-6);ctx.lineTo(p.x+5,p.y+4);ctx.lineTo(p.x-5,p.y+4);ctx.closePath();ctx.fill();}
    else if(r.enemy?.hp>0){ctx.fillStyle=r.enemy.mode==='idle'?'#b4987b':'#e08865';ctx.font=`bold ${large?23:15}px monospace`;ctx.textAlign='center';ctx.fillText(r.enemy.mode==='idle'?'•':r.enemy.mode==='hunt'?'!':'?',p.x,p.y+5);}
    else if(!r.used){const ri={entry:'door',chest:'chest',camp:'camp',merchant:'merchant',shrine:'shrine',relic:r.relic?.icon};if(ri[r.type])icon(ctx,ri[r.type],p.x-box*.38,p.y-box*.38,box*.76);}
    else rect2(ctx,p.x-2,p.y-2,4,4,'#6b8879');
   }else{ctx.fillStyle='#405b53';ctx.textAlign='center';ctx.font='11px monospace';ctx.fillText('·',p.x,p.y+4);}
   if(r.enemy?.hp>0&&r.enemy.target!==null&&r.seen&&r.enemy.mode!=='idle'){
    const target=mapPoint(r.enemy.target,w,h);ctx.strokeStyle='#bc775855';ctx.lineWidth=1;ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);
   }
   if(large){ctx.fillStyle=r.seen?'#abbeb0':'#526861';ctx.font='13px system-ui';ctx.textAlign='center';ctx.fillText(r.seen?r.name:'미탐험',p.x,p.y+box/2+19);}
  }
  if(s.lastSound?.strength>0&&ms-sounded<2200&&!reduced){const p=mapPoint(s.lastSound.origin,w,h),age=(ms-sounded)/2200;ctx.globalAlpha=1-age;ctx.strokeStyle='#e4b375';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,8+age*s.lastSound.strength*15,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 }
 function frame(ms){if(!alive)return;const s=getState();if(lastPos!==s.pos){lastPos=s.pos;entered=ms;}if(lastSound!==s.soundSeq){lastSound=s.soundSeq;sounded=ms;}if(!document.hidden&&(ms-lastTime>(reduced?120:30))){drawStage(ms);drawMap(mc,360,244,ms);lastTime=ms;}requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
 function hitMap(el,x,y){const q=el.getBoundingClientRect(),xx=(x-q.left)/q.width*el.width,yy=(y-q.top)/q.height*el.height;for(let id=0;id<16;id++){const p=mapPoint(id,el.width,el.height);if(Math.abs(xx-p.x)<el.width*.09&&Math.abs(yy-p.y)<el.height*.09)return id;}return -1;}
 return {setHover(id){hover=id;},toggleZoom(){zoom=!zoom;return zoom;},hit(x,y){return zoom?hitMap(canvas,x,y):-1;},hitMini(x,y){return hitMap(minimap,x,y);},burst(type='attack',text=''){
  const time=now();if(type==='bad')damageAt=time;else if(type==='attack'){hitAt=time;label=text;}
  for(let i=0;i<20;i++)particles.push({x:690,y:345,dx:(Math.random()-.5)*190,dy:-Math.random()*90,size:2+Math.floor(Math.random()*3),col:type==='bad'?'#db785b':i%3?'#ead6a3':'#ec8a52',start:time});
 },reset(){lastPos=-1;lastSound=-1;particles=[];},stop(){alive=false;}};
}
