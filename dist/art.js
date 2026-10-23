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
export const ROOM_W=130,ROOM_H=66;
export function roomRect(id){return {x:32+(id%4)*174,y:25+Math.floor(id/4)*99,w:ROOM_W,h:ROOM_H};}
function hash(x,y,seed){let n=(x*374761393+y*668265263+seed)|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967296;}
function roomIcon(r){if(r.enemy&&r.enemy.hp>0)return r.enemy.kind;if(r.type==='relic'&&!r.used)return r.relic.icon;return {entry:'door',chest:'chest',camp:'camp',merchant:'merchant',shrine:'shrine',enemy:'skull'}[r.type]||'crystal';}
export function makeRenderer(canvas,getState){
 const c=canvas.getContext('2d');let W=720,H=280;canvas.width=W;canvas.height=H;c.imageSmoothingEnabled=false;
 let hover=-1,zoom=false,particles=[],hero=null,shake=0,cam={x:0,y:0,s:1},last=0,alive=true;
 function glow(x,y,r,color){const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 function torch(x,y,t){rect(c,x-2,y+2,5,10,'#6e5241');rect(c,x-3,y,7,5,'#d29551');rect(c,x-2,y-6,5,8,'#de8551');rect(c,x,y-8+(Math.floor(t*8)%3),3,9,'#efc478');rect(c,x,y-2,2,4,'#ffe8ad');glow(x,y,27+Math.sin(t*5+x)*3,'#d989443a');}
 function frame(ms){if(!alive)return;const mobile=canvas.parentElement.clientWidth<600;const newW=mobile?520:720,newH=mobile?330:280;if(W!==newW||H!==newH){W=newW;H=newH;canvas.width=W;canvas.height=H;c.imageSmoothingEnabled=false;}const s=getState();const t=ms/1000;const dt=Math.min(50,ms-last||16);last=ms;const current=roomRect(s.pos),target={x:current.x+45,y:current.y+48};
 if(!hero)hero={...target};hero.x+=(target.x-hero.x)*Math.min(1,dt/70);hero.y+=(target.y-hero.y)*Math.min(1,dt/70);
 const scale=zoom?Math.min(W/720,H/420):1;cam={s:scale,x:zoom?-(W/scale-720)/2:Math.max(0,Math.min(720-W/scale,hero.x-W/2/scale)),y:zoom?-(H/scale-420)/2:Math.max(0,Math.min(420-H/scale,hero.y-H/2/scale))};
 c.setTransform(1,0,0,1,0,0);rect(c,0,0,W,H,'#101719');c.save();c.scale(cam.s,cam.s);c.translate(-cam.x,-cam.y);
 if(shake>0){c.translate(Math.sin(t*80)*shake,Math.cos(t*90)*shake);shake*=.85;if(shake<.2)shake=0;}
 for(let y=0;y<420;y+=12)for(let x=0;x<720;x+=12){const h=hash(x,y,s.seed);if(h>.23)rect(c,x,y,11,11,h>.8?'#1c2527':'#172022');if(h>.97)rect(c,x+2,y+2,3,2,'#293a32');}
 for(const [a,b] of s.edges){const A=roomRect(a),B=roomRect(b),x=A.x+A.w/2,y=A.y+A.h/2,x2=B.x+B.w/2,y2=B.y+B.h/2;const seen=s.rooms[a].seen&&s.rooms[b].seen;
 c.globalAlpha=seen?.85:.25;rect(c,Math.min(x,x2)-9,Math.min(y,y2)-9,Math.abs(x2-x)+18,Math.abs(y2-y)+18,'#3a4341');rect(c,Math.min(x,x2)-6,Math.min(y,y2)-6,Math.abs(x2-x)+12,Math.abs(y2-y)+12,'#242f2f');
 if(seen){for(let q=0;q<Math.max(Math.abs(x2-x),Math.abs(y2-y));q+=12)rect(c,x+(x2-x===0?-5:q),y+(y2-y===0?-5:q),x2===x?10:1,y2===y?10:1,'#435049');}
 c.globalAlpha=1;
 }
 const near=s.edges.filter(e=>e.includes(s.pos)).map(e=>e[0]===s.pos?e[1]:e[0]);
 for(const r of s.rooms){const q=roomRect(r.id),isCurrent=r.id===s.pos,known=r.seen;const adj=near.includes(r.id);c.globalAlpha=known?1:.38;
 rect(c,q.x-5,q.y-5,q.w+10,q.h+13,'#0b1113');rect(c,q.x-4,q.y-4,q.w+8,q.h+8,known?'#3a4545':'#273030');rect(c,q.x-3,q.y-4,q.w+6,4,known?'#607069':'#394342');rect(c,q.x,q.y+3,q.w,q.h,'#263130');
 for(let yy=q.y+5;yy<q.y+q.h-2;yy+=12)for(let xx=q.x+3;xx<q.x+q.w-3;xx+=14){const h=hash(xx,yy,s.seed);rect(c,xx,yy,12,10,known?(h>.65?'#35403a':h>.3?'#303b37':'#293430'):'#1e2929');rect(c,xx,yy,12,1,known?'#424c41':'#2b3430');if(h>.88)rect(c,xx+2,yy+7,5,2,known?'#495341':'#2a342d');}
 rect(c,q.x-2,q.y+q.h,q.w+4,4,'#48504a');rect(c,q.x-2,q.y+q.h+4,q.w+4,3,'#202b2a');
 if(known){
  for(let k=0;k<4;k++){const dx=q.x+8+hash(k,r.id,s.seed)*110,dy=q.y+12+hash(r.id,k,s.seed)*40;rect(c,dx,dy,3,2,'#60644e');}
  torch(q.x+10,q.y+3,t+r.id);torch(q.x+q.w-13,q.y+3,t-r.id);
  if(r.type==='relic'&&!r.used){glow(q.x+q.w/2,q.y+35,35,r.id===15?'#b45a4444':'#57bfc738');rect(c,q.x+52,q.y+47,27,5,'#52625c');}
  if(r.type==='camp'&&!r.used)glow(q.x+80,q.y+42,40,'#c6753e3c');
  if(r.type==='entry'){rect(c,q.x+13,q.y+5,30,12,'#0a1516');for(let k=0;k<3;k++)rect(c,q.x+13,q.y+5+k*4,30,2,'#788879');}
  const name=roomIcon(r);const ox=isCurrent?q.x+94:q.x+66;const oy=q.y+48;
  if(r.enemy&&r.enemy.hp>0){rect(c,ox-15,oy-1,30,4,'#121e1a');sprite(c,name,ox,oy,name==='dragon'?1.5:1.4,t);const w=30;rect(c,ox-w/2,oy+6,w,3,'#1a2022');rect(c,ox-w/2,oy+6,Math.ceil(w*r.enemy.hp/r.enemy.maxHp),3,'#ca7767');}
  else if(!r.used||r.type==='entry'){icon(c,name,ox-13,oy-25,26);}
  else{rect(c,q.x+59,q.y+36,5,5,'#6a8067');rect(c,q.x+64,q.y+32,3,7,'#6a8067');}
 }else{c.fillStyle='#64706c';c.font='20px monospace';c.textAlign='center';c.fillText('?',q.x+q.w/2,q.y+41);}
 c.globalAlpha=1;
 if(isCurrent||adj||hover===r.id){c.strokeStyle=isCurrent?'#dbb975':hover===r.id?'#d3e9ba':adj?'#607b66':'#32443d';c.lineWidth=isCurrent?2:1;c.strokeRect(q.x-6.5,q.y-6.5,q.w+13,q.h+19);}
 c.font='10px system-ui, sans-serif';c.textAlign='left';c.fillStyle=isCurrent?'#e2c88c':known?'#96a68d':'#46554f';
 const labels={entry:'입구',chest:'보물 상자',camp:'모닥불',merchant:'상인',shrine:'망각의 제단',enemy:'전투'};const label=known?(r.type==='relic'?`${r.relic.name} · ${r.relic.value}`:labels[r.type]):'미탐험';
 c.fillText(label,q.x+3,q.y+q.h+19);
 if(adj&&known){c.textAlign='right';c.fillStyle='#b8c9a1';c.fillText(`${r.row===3?2:1} 발`,q.x+q.w-2,q.y+q.h+19);}
 }
 const walk=Math.abs(hero.x-target.x)+Math.abs(hero.y-target.y)>2;rect(c,hero.x-12,hero.y-2,24,5,'#111d19');sprite(c,s.role==='rogue'?'hero':s.role,hero.x,hero.y+(walk?Math.round(Math.sin(t*20)*2):0),1.6,t);
 c.fillStyle='#e8cc8c';c.beginPath();c.moveTo(hero.x-3,hero.y-35);c.lineTo(hero.x+3,hero.y-35);c.lineTo(hero.x,hero.y-31);c.fill();
 for(let i=0;i<20;i++){const x=(hash(i,2,s.seed)*720+Math.sin(t*.3+i)*8),y=(hash(i,8,s.seed)*420-t*(2+i%3)+4200)%420;rect(c,x,y,1,1,i%3===0?'#a5895c':'#58705c');}
 particles=particles.filter(p=>p.life>0);for(const p of particles){p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;p.vy+=.02;p.life-=dt;c.globalAlpha=Math.min(1,p.life/300);rect(c,p.x,p.y,2,2,p.color);}c.globalAlpha=1;c.restore();
 requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
 return {
  setHover(id){hover=id;},toggleZoom(){zoom=!zoom;return zoom;},
  point(clientX,clientY){const b=canvas.getBoundingClientRect();return {x:(clientX-b.left)/b.width*W/cam.s+cam.x,y:(clientY-b.top)/b.height*H/cam.s+cam.y};},
  hit(clientX,clientY){const p=this.point(clientX,clientY);return getState().rooms.find(r=>{const q=roomRect(r.id);return p.x>=q.x-7&&p.x<=q.x+q.w+7&&p.y>=q.y-7&&p.y<=q.y+q.h+18;})?.id??-1;},
  burst(kind='good'){const q=roomRect(getState().pos);for(let i=0;i<22;i++)particles.push({x:q.x+80,y:q.y+32,vx:(Math.random()-.5)*3,vy:(Math.random()-.7)*3,life:500+Math.random()*400,color:kind==='bad'?'#e18764':'#e8ca84'});if(kind==='bad')shake=3;},
  reset(){hero=null;},stop(){alive=false;}
 };
}
