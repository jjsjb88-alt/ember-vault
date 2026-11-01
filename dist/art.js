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

export function makeRenderer(canvas,getState,minimap){
 const c=canvas.getContext('2d'),mc=minimap.getContext('2d'),W=960;let H=540;
 const bg=new Image(),heroes=new Image(),objects=new Image();bg.src='./assets/rooms-v4.png';heroes.src='./assets/heroines-v4.png';objects.src='./assets/creatures-props-v4.png';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let alive=true,zoom=false,lastPos=-1,lastSound=-1,entered=0,sounded=0,hitAt=-10000,damageAt=-10000,lastTime=0,label='',particles=[];
 const observer=new ResizeObserver(([entry])=>{const {width,height}=entry.contentRect;if(width>0&&height>0){H=Math.max(220,Math.round(W*height/width));canvas.width=W;canvas.height=H;}});observer.observe(canvas);
 const rect=(ctx,x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
 function light(ctx,x,y,r,col){const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 function actor(kind,x,y,height,t,flip=false){
  const hero=['rogue','knight','mage'].indexOf(kind),source=hero>=0?heroes:objects,id=hero>=0?hero:kind==='dragon'?2:kind==='sentinel'?1:0;
  const sw=512,sh=hero>=0?560:540,width=height*sw/sh;
  c.save();c.translate(Math.round(x),Math.round(y));if(flip)c.scale(-1,1);
  c.fillStyle='#040a1299';c.beginPath();c.ellipse(0,-2,width*.28,Math.max(5,height*.035),0,0,Math.PI*2);c.fill();
  if(source.complete&&source.naturalWidth)c.drawImage(source,id*sw,0,sw,sh,-width/2,-height+(reduced?0:Math.sin(t*2+id)*1.2),width,height);
  else sprite(c,hero===0?'hero':kind,0,0,4,t);c.restore();
 }
 function prop(r,x,y,height,t){
  if(r.enemy?.hp>0)return;
  if(r.type==='merchant'){actor('mage',x,y,height*.85,t,true);return;}
  const id={chest:0,camp:1,shrine:2,relic:2}[r.type];if(id===undefined||!objects.complete||!objects.naturalWidth)return;
  const size=height*(r.type==='chest'?.69:r.type==='camp'?.69:.85);
  c.save();c.globalAlpha=r.used?.38:1;
  c.fillStyle='#02081188';c.beginPath();c.ellipse(x,y,size*.34,size*.055,0,0,Math.PI*2);c.fill();
  c.drawImage(objects,id*512,544,512,480,x-size/2,y-size*.9,size,size*480/512);
  if(!r.used){light(c,x,y-size*.55,size*.75,r.type==='camp'?'#ebaa3d21':r.type==='chest'?'#e5be5215':'#5bd8d327');}
  c.restore();
 }
 function drawStage(ms){
  const s=getState(),r=s.rooms[s.pos],t=ms/1000;c.imageSmoothingEnabled=false;c.clearRect(0,0,W,H);
  if(zoom){drawMap(c,W,H,ms,true);return;}
  const floor=H*.89,heroH=Math.min(H*.79,300),walk=(ms-entered)/650,attack=(ms-hitAt)/480;
  c.save();if(!reduced&&ms-damageAt<300)c.translate(Math.sin(ms*.08)*3,0);
  if(bg.complete&&bg.naturalWidth){
   const area=r.row===3?3:r.type==='relic'||r.type==='shrine'?2:r.terrain==='water'||r.id===6?1:0,sw=bg.naturalWidth/2,sh=bg.naturalHeight/2;
   const cropH=Math.min(sh,sw*H/W),cropW=cropH*W/H;
   c.drawImage(bg,(area%2)*sw+(sw-cropW)/2,Math.floor(area/2)*sh+sh-cropH,cropW,cropH,0,0,W,H);
  }else rect(c,0,0,W,H,'#101c30');
  rect(c,0,0,W,H,'#07102016');
  for(let i=0;i<22;i++){const x=(i*83+s.pos*29)%W,y=(i*41+(reduced?0:t*4))%H;c.globalAlpha=.1+(Math.sin(t+i)+1)*.1;rect(c,x,y,i%5===0?2:1,2,i%3?'#adc9d2':'#e8bd76');}c.globalAlpha=1;
  const hx=300-(!reduced&&walk<1?(1-walk)*65:0)+(!reduced&&attack>=0&&attack<1?Math.sin(attack*Math.PI)*90:0);
  const hy=floor+(!reduced&&walk<1?Math.sin(walk*24)*2:0);
  prop(r,716,floor,heroH,t);light(c,hx,hy-heroH*.4,heroH*.75,s.role==='mage'?'#8c77ce16':'#ecc47513');
  if(s.hidden)c.globalAlpha=.66;actor(s.role,hx,hy,heroH,t);c.globalAlpha=1;
  if(r.enemy?.hp>0)actor(r.enemy.kind,715+(attack>=0&&attack<1?Math.sin(attack*Math.PI)*12:0),floor,heroH*(r.enemy.kind==='dragon'?1.12:.96),t);
  if(!reduced&&attack>=0&&attack<1){c.globalAlpha=Math.sin(attack*Math.PI);c.strokeStyle='#ffe2af';c.lineWidth=4;c.beginPath();c.arc(635,floor-heroH*.44,heroH*.27,-1.1,.9);c.stroke();c.strokeStyle='#e5ae5b44';c.lineWidth=15;c.stroke();c.globalAlpha=1;}
  if(s.lastSound?.strength>0&&ms-sounded<2200&&!reduced){const age=(ms-sounded)/2200,x=s.lastSound.origin===s.pos?hx:790;for(let k=0;k<3;k++){const p=(age+k*.3)%1,rad=20+p*(80+s.lastSound.strength*22);c.globalAlpha=(1-p)*.55;c.strokeStyle=s.lastSound.strength>=5?'#f0b178':'#8ae2df';c.lineWidth=2;c.beginPath();c.ellipse(x,floor,rad,rad*.18,0,0,Math.PI*2);c.stroke();}c.globalAlpha=1;}
  particles=particles.filter(p=>ms-p.start<800);for(const p of particles){const age=(ms-p.start)/800;c.globalAlpha=1-age;rect(c,715+p.dx*age,floor-heroH*.45+p.dy*age+age*age*50,p.size,p.size,p.col);}c.globalAlpha=1;
  if(ms-hitAt<850&&label){c.fillStyle='#ffdfb0';c.font='bold 34px monospace';c.textAlign='center';c.fillText(label,715,floor-heroH*.8-(ms-hitAt)/35);}
  const vignette=c.createLinearGradient(0,0,0,H);vignette.addColorStop(0,'#050a1544');vignette.addColorStop(.25,'#0000');vignette.addColorStop(.8,'#0000');vignette.addColorStop(1,'#050b1877');c.fillStyle=vignette;c.fillRect(0,0,W,H);c.restore();
 }
 function point(id,w,h){return{x:w*.13+(id%4)*w*.246,y:h*.14+Math.floor(id/4)*h*.225};}
 function drawMap(ctx,w,h,ms,large=false){
  const s=getState(),adj=neighbours(s),box=large?Math.min(40,h*.11):22;ctx.imageSmoothingEnabled=false;rect(ctx,0,0,w,h,'#101a29');
  if(large&&bg.complete&&bg.naturalWidth){ctx.globalAlpha=.075;ctx.drawImage(bg,0,0,768,512,0,0,w,h);ctx.globalAlpha=1;}
  for(const[a,b]of s.edges){const A=point(a,w,h),B=point(b,w,h),seen=s.rooms[a].seen&&s.rooms[b].seen;ctx.strokeStyle=seen?'#6c746a':'#344657';ctx.lineWidth=seen?3:1;ctx.setLineDash(seen?[]:[3,6]);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();}ctx.setLineDash([]);
  for(const r of s.rooms){const p=point(r.id,w,h),here=r.id===s.pos,heard=s.lastSound?.field.find(x=>x.id===r.id),recent=s.lastSound?.turn===s.turn;
   if(heard&&recent){ctx.fillStyle=`rgba(232,171,85,${.08+heard.level*.03})`;ctx.beginPath();ctx.arc(p.x,p.y,box+8,0,Math.PI*2);ctx.fill();}
   rect(ctx,p.x-box/2-2,p.y-box/2-2,box+4,box+4,here?'#efcd86':adj.includes(r.id)?'#82afa6':'#384e5d');rect(ctx,p.x-box/2,p.y-box/2,box,box,here?'#5c5942':r.seen?'#203641':'#142332');
   if(r.seen){if(here){ctx.fillStyle='#ffe4a9';ctx.beginPath();ctx.moveTo(p.x,p.y-8);ctx.lineTo(p.x+6,p.y+6);ctx.lineTo(p.x-6,p.y+6);ctx.closePath();ctx.fill();}
    else if(r.enemy?.hp>0){ctx.fillStyle=r.enemy.mode==='idle'?'#c5b195':'#f2a17f';ctx.font=`bold ${large?22:15}px monospace`;ctx.textAlign='center';ctx.fillText(r.enemy.mode==='idle'?'•':r.enemy.mode==='hunt'?'!':'?',p.x,p.y+6);}
    else if(!r.used){const ri={entry:'door',chest:'chest',camp:'camp',merchant:'merchant',shrine:'shrine',relic:r.relic?.icon};if(ri[r.type])icon(ctx,ri[r.type],p.x-box*.38,p.y-box*.38,box*.76);}
    else rect(ctx,p.x-2,p.y-2,4,4,'#93ada9');
   }
   if(large){ctx.fillStyle=r.seen?'#d2d4bf':'#647b8b';ctx.font='24px system-ui';ctx.textAlign='center';if(r.seen)ctx.fillText(r.name,p.x,p.y+box/2+25);}
   if(r.enemy?.hp>0&&r.enemy.target!==null&&r.seen&&r.enemy.mode!=='idle'){const target=point(r.enemy.target,w,h);ctx.strokeStyle='#d68f5c77';ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);}
  }
  if(s.lastSound?.strength>0&&ms-sounded<2200&&!reduced){const p=point(s.lastSound.origin,w,h),age=(ms-sounded)/2200;ctx.globalAlpha=1-age;ctx.strokeStyle='#f6c077';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,8+age*s.lastSound.strength*15,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 }
 function frame(ms){if(!alive)return;const s=getState();if(lastPos!==s.pos){lastPos=s.pos;entered=ms;}if(lastSound!==s.soundSeq){lastSound=s.soundSeq;sounded=ms;}if(!document.hidden&&ms-lastTime>(reduced?120:30)){drawStage(ms);drawMap(mc,360,244,ms);lastTime=ms;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
 function hitMap(el,x,y){const q=el.getBoundingClientRect(),xx=(x-q.left)/q.width*el.width,yy=(y-q.top)/q.height*el.height;for(let id=0;id<16;id++){const p=point(id,el.width,el.height);if(Math.abs(xx-p.x)<el.width*.09&&Math.abs(yy-p.y)<el.height*.10)return id;}return-1;}
 return{setHover(){},setZoom(on){zoom=!!on;return zoom;},toggleZoom(){zoom=!zoom;return zoom;},hit(x,y){return zoom?hitMap(canvas,x,y):-1;},hitMini(x,y){return hitMap(minimap,x,y);},burst(type='attack',text=''){const time=performance.now();if(type==='bad')damageAt=time;else if(type==='attack'){hitAt=time;label=text;}for(let i=0;i<18;i++)particles.push({dx:(Math.random()-.5)*150,dy:-Math.random()*85,size:2+Math.floor(Math.random()*3),col:type==='bad'?'#db785b':i%3?'#ead6a3':'#ec8a52',start:time});},reset(){lastPos=-1;lastSound=-1;particles=[];},stop(){alive=false;observer.disconnect();}};
}
