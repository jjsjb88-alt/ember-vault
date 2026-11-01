import {neighbours,moveStatus} from './engine.js';
import {icon,sprite} from './art.js';
import {travelVector,walkFrame,projectMap,exitAnchor,hitExit} from './scene-layout.js';
import {WALK_FRAMES} from './rogue-frames.js';
import {ATTACK_FRAMES} from './rogue-attack-frames.js';
import {prepareFrames} from './sprite-atlas.js';
import {roomEnvironment} from './encounter.js';
import {makeFxLayer,FX,PALETTES,actorFromSprite} from './fx-layer.js';

export function makeRenderer(canvas,getState,minimap){
 const c=canvas.getContext('2d'),mc=minimap.getContext('2d');
 const image=src=>{const i=new Image();i.src=src;return i;};
 const background=image('./assets/library-stage-v5.png');
 const backgrounds={library:background};
 function backdrop(room){const key=roomEnvironment(room);return backgrounds[key]??=(image(key==='refuge'?'./assets/ember-refuge-v6.png':'./assets/lunar-vault-v6.png'));}
 const atlas=image('./assets/rogue-walk-v5.png');
 const attackAtlas=image('./assets/rogue-attack-v5.png');
 let attackFrames=null;
 attackAtlas.onload=()=>{attackFrames=prepareFrames(attackAtlas,ATTACK_FRAMES);};
 const heroes=image('./assets/heroines-v4.png'),objects=image('./assets/creatures-props-v4.png');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let W=1200,H=650,cssWidth=1200,cssHeight=650,alive=true,zoom=false,lastPos=-1,lastSound=-1,entered=-10000,sounded=-10000;
 let hitAt=-10000,damageAt=-10000,hover=-1,label='',lastTime=0,vector={x:1,y:-.5,direction:7};
 let recentEnemy=null,recentEnemyPos=-1;
 let rewardAt=-10000,rewardLabel='';
 const groundFx=makeFxLayer(),killFx=makeFxLayer();let killing=null;
 const observer=new ResizeObserver(([entry])=>{if(entry.contentRect.width>0&&entry.contentRect.height>0){
  cssWidth=entry.contentRect.width;cssHeight=entry.contentRect.height;
  H=Math.round(W*cssHeight/cssWidth);canvas.width=W;canvas.height=H;
 }});observer.observe(canvas);
 function glow(ctx,x,y,r,color){const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 function shadow(x,y,w){c.fillStyle='#0107128c';c.beginPath();c.ellipse(x,y,w,w*.24,0,0,Math.PI*2);c.fill();}
 function legacyActor(kind,x,y,height,ms,flip=false){
  const hero=['rogue','knight','mage'].indexOf(kind),source=hero>=0?heroes:objects;
  const id=hero>=0?hero:kind==='dragon'?2:kind==='sentinel'?1:0,sh=hero>=0?560:540,width=height*512/sh;
  shadow(x,y,width*.24);c.save();c.translate(x,y);if(flip)c.scale(-1,1);
  if(source.complete&&source.naturalWidth)c.drawImage(source,id*512,0,512,sh,-width/2,-height+(reduced?0:Math.sin(ms*.002)*.6),width,height);
  else sprite(c,kind==='rogue'?'hero':kind,0,0,3,ms/1000);c.restore();
 }
 function hero(x,y,height,ms,walking,attack){
  if(getState().role!=='rogue'||!atlas.complete||!atlas.naturalWidth){legacyActor(getState().role,x,y,height,ms,vector.x<0);return;}
  const frame=walking?walkFrame(ms-entered,getState().mode):1;
  const dir=attack?7:vector.direction;
  const strike=attack>0&&attackFrames,phase=attack<.28?0:attack<.58?1:2;
  const b=strike?ATTACK_FRAMES[phase][dir]:WALK_FRAMES[frame][dir];
  const scale=height/(strike?280:245),dw=b.w*scale,dh=b.h*scale;
  shadow(x,y,height*.21);c.save();c.translate(x,y);
  if(strike)c.drawImage(attackFrames[phase][dir],-b.anchor*scale,-b.foot*scale,dw,dh);
  else c.drawImage(atlas,b.x,b.y,b.w,b.h,-dw*.5,-b.foot*scale,dw,dh);
  c.restore();
 }
 function drawProp(r,x,y,height,ms){
  if(r.enemy?.hp>0)return;
  if(r.type==='merchant'){legacyActor('mage',x,y,height*.92,ms,true);return;}
  const id={chest:0,camp:1,shrine:2,relic:2}[r.type];
  if(id===undefined||!objects.complete||!objects.naturalWidth)return;
  const size=height*(r.type==='chest'?.8:.9);shadow(x,y,size*.3);
  c.save();if(r.used)c.globalAlpha=.4;
  c.drawImage(objects,id*512,544,512,480,x-size/2,y-size*.92,size,size*480/512);c.restore();
  if(r.used){c.fillStyle='#a7c0b9';c.font='14px system-ui';c.textAlign='center';c.fillText('사용 완료',x,y+15);return;}
  glow(c,x,y-size*.25,size*.7,r.type==='camp'?'#ffa93620':'#e5c06a12');
 }
 function routeTrail(x,y,ms){
  const s=getState();if(s.phase!=='playing'||s.pending)return;
  for(const id of neighbours(s)){
   if(!moveStatus(s,id).allowed)continue;
   const p=exitAnchor(s.pos,id),tx=p.x*W,ty=p.y*H+20;
   c.save();c.strokeStyle='#ffce76';c.lineWidth=hover===id?3:2;c.globalAlpha=hover===id?.8:.3;
   c.setLineDash([4,12]);c.lineDashOffset=reduced?0:-ms*.018;
   c.beginPath();c.moveTo(x,y);c.quadraticCurveTo((x+tx)/2,y,tx,ty);c.stroke();c.setLineDash([]);
   c.globalAlpha=hover===id?.8:.4;c.beginPath();c.ellipse(tx,ty,46,14,0,0,Math.PI*2);c.stroke();c.restore();
  }
 }
 function drawStage(ms){
  c.imageSmoothingEnabled=false;c.clearRect(0,0,W,H);
  if(zoom){drawMap(c,W,H,ms,true);return;}
  const s=getState(),r=s.rooms[s.pos],walking=ms-entered<750&&!reduced,p=Math.min(1,(ms-entered)/750);
  if(recentEnemyPos!==s.pos){recentEnemy=null;recentEnemyPos=s.pos;killing=null;killFx.clear();}
  if(r.enemy?.hp>0)recentEnemy={...r.enemy};
  const attack=!reduced&&ms-hitAt<580?(ms-hitAt)/580:0;
  const baseX=W*.4,baseY=H*.73,heroH=Math.min(H*.31,W*.18);
  const hx=baseX-(walking?(1-p)*vector.x*W*.12:0)+Math.sin(attack*Math.PI)*W*.17;
  const hy=baseY-(walking?(1-p)*vector.y*W*.12:0)-Math.sin(attack*Math.PI)*H*.085;
  const ex=W*.66,ey=H*.59;
  c.save();if(!reduced&&ms-damageAt<240)c.translate(Math.sin(ms*.09)*4,0);
  const selected=backdrop(r),bg=selected.complete&&selected.naturalWidth?selected:background;
  if(bg.complete&&bg.naturalWidth){
   const scale=Math.max(W/bg.naturalWidth,H/bg.naturalHeight),dw=bg.naturalWidth*scale,dh=bg.naturalHeight*scale;
   c.drawImage(bg,(W-dw)*.5,(H-dh)*.6,dw,dh);
  }else{c.fillStyle='#102539';c.fillRect(0,0,W,H);}
  c.fillStyle=r.row===3?'#180a1424':r.terrain==='water'?'#00455c12':'#07102005';c.fillRect(0,0,W,H);
  const flicker=reduced?1:1+Math.sin(ms*.0037)*.08+Math.sin(ms*.0103)*.025;
  glow(c,W*.29,H*.34,W*.14*flicker,'#ffb64514');glow(c,W*.9,H*.86,W*.2,'#00c4db16');
  routeTrail(baseX,baseY,ms);
  if(!reduced&&s.lastSound?.strength>0&&ms-sounded<120&&!groundFx.has('sound:'+s.soundSeq)){groundFx.stop();const loud=s.lastSound.strength>=5;groundFx.add(FX.ripples,{x:baseX,y:baseY,palette:loud?PALETTES.loud:PALETTES.quiet,light:Math.min(1.4,.55+s.lastSound.strength*.12),seed:s.soundSeq},{until:ms+2300,tag:'sound:'+s.soundSeq});}
  if(!reduced)groundFx.render(c,W,H,ms);
  else if(s.lastSound?.strength>0&&ms-sounded<2800){
   const age=.35;
   for(let k=0;k<3;k++){const a=(age+k*.24)%1,rad=20+a*(65+s.lastSound.strength*25);
    c.globalAlpha=(1-a)*.65;c.strokeStyle=s.lastSound.strength>=5?'#ffad48':'#efcd82';c.lineWidth=2;
    c.beginPath();c.ellipse(baseX,baseY,rad,rad*.52,-.18,0,Math.PI*2);c.stroke();
   }c.globalAlpha=1;
  }
  drawProp(r,ex,ey,heroH,ms);
  if(!reduced&&recentEnemy&&!(r.enemy?.hp>0)&&attack>0&&killing?.ref!==recentEnemy)killing={ref:recentEnemy,seen:ms,at:null};
  // the soul rises once the hit has landed and no dialog (noise, reward) covers the stage
  if(killing&&killing.at===null&&ms-killing.seen>620&&!document.querySelector('dialog[open]')){
   killing.at=ms;const kind=killing.ref.kind,height=heroH*(kind==='dragon'?1.35:1.04);
   if(objects.complete&&objects.naturalWidth){const id=kind==='dragon'?2:kind==='sentinel'?1:0;
    killFx.add(FX.soulRise,{x:ex,y:ey,actor:actorFromSprite(objects,id*512,0,512,540,height*512/540,height,{flip:true}),palette:PALETTES.soul,height:34,seed:s.turn+s.pos},{tag:'kill'});}
  }
  const dying=killing&&killing.ref===recentEnemy&&(killing.at===null||ms-killing.at<2600);
  const fading=!(r.enemy?.hp>0)&&(dying||attack>0)&&recentEnemy;
  const foe=r.enemy?.hp>0?r.enemy:fading?recentEnemy:null;
  if(foe){if(fading)c.globalAlpha=dying?(killing.at===null?1:Math.max(0,Math.min(1,1-(ms-killing.at-500)/1900)))*(attack>0?.75+.25*Math.cos(attack*Math.PI*6):1):Math.max(0,1-attack*1.2);
   const recoil=attack&&!reduced?Math.sin(Math.min(1,attack*2)*Math.PI)*heroH*.14:0;
   legacyActor(foe.kind,ex+recoil,ey-recoil*.3,heroH*(foe.kind==='dragon'?1.35:1.04),ms,true);c.globalAlpha=1;
   if(!fading&&foe.mode!=='idle'){c.font=`bold ${Math.round(heroH*.24)}px serif`;c.textAlign='center';c.fillStyle=foe.mode==='hunt'?'#ff7667':'#ffc85a';c.shadowColor=c.fillStyle;c.shadowBlur=14;c.fillText(foe.mode==='hunt'?'!':'?',ex,ey-heroH*1.1);c.shadowBlur=0;}
  }
  if(!reduced)killFx.render(c,W,H,ms);
  glow(c,hx+heroH*.15,hy-heroH*.31,heroH*.75,'#ffc44c28');
  if(s.hidden)c.globalAlpha=.62;hero(hx,hy,heroH,ms,walking,attack);c.globalAlpha=1;
  if(attack>0){c.save();c.globalAlpha=Math.sin(attack*Math.PI);c.strokeStyle='#ffebb8';c.lineWidth=4;c.shadowColor='#ffbd4d';c.shadowBlur=20;c.beginPath();c.ellipse(ex-20,ey-heroH*.4,heroH*.55,heroH*.14,-.7,-2.7,.5);c.stroke();c.restore();}
  if(ms-hitAt<850&&label){c.fillStyle='#ffe7c3';c.font='bold 30px monospace';c.textAlign='center';c.fillText(label,ex,ey-heroH*.9-(ms-hitAt)/42);}
  if(ms-rewardAt<1700&&rewardLabel){const age=(ms-rewardAt)/1700;c.save();c.globalAlpha=1-age;c.fillStyle='#ffe6a0';c.font='bold 30px Georgia';c.textAlign='center';c.fillText(rewardLabel,ex,ey-heroH*.8-(reduced?0:age*60));if(!reduced)for(let i=0;i<16;i++){const a=i*2.4,x=ex+Math.cos(a)*age*100,y=ey-heroH*.4+Math.sin(a)*age*65-age*30;c.fillRect(x,y,4,4);}c.restore();}
  for(let i=0;i<26;i++){const x=(i*97+31)%W,y=(i*71+(reduced?0:ms*.003))%H;c.globalAlpha=.12+(Math.sin(ms*.001+i)+1)*.09;c.fillStyle=i%3?'#a5dfe7':'#ffd07b';c.fillRect(x,y,2,i%4===0?3:1);}c.globalAlpha=1;
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#03081425');g.addColorStop(.2,'#0000');g.addColorStop(.75,'#0000');g.addColorStop(1,'#02091388');c.fillStyle=g;c.fillRect(0,0,W,H);c.restore();
 }
 function drawMap(ctx,w,h,ms,large=false){
  const s=getState(),pixel=large?w/cssWidth:1;
  const box=large?Math.min(26,Math.max(14,cssHeight*.095))*pixel:21;
  const labelSize=(cssWidth>800?12:11)*pixel;
  const available=new Set(neighbours(s).filter(id=>moveStatus(s,id).allowed));
  ctx.clearRect(0,0,w,h);ctx.fillStyle=large?'#06111af5':'#08121ace';ctx.fillRect(0,0,w,h);
  for(const[a,b]of s.edges){const A=projectMap(a,w,h),B=projectMap(b,w,h),seen=s.rooms[a].seen&&s.rooms[b].seen;
   const next=(a===s.pos&&available.has(b))||(b===s.pos&&available.has(a));
   ctx.strokeStyle=next?'#f3c978':seen?'#768597':'#2a3845';ctx.lineWidth=next?4:seen?3:1;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();
  }
  for(const r of s.rooms){const p=projectMap(r.id,w,h),here=r.id===s.pos,heard=s.lastSound?.turn===s.turn&&s.lastSound.field.find(x=>x.id===r.id);
   if(heard)glow(ctx,p.x,p.y,box*1.8,`rgba(255,173,66,${.12+heard.level*.035})`);
   ctx.fillStyle=here?'#e6c478':r.seen?'#718292':'#263743';ctx.fillRect(p.x-box/2-1,p.y-box/2-1,box+2,box+2);
   ctx.fillStyle=here?'#6c5734':r.seen?'#233b4c':'#0f1c27';ctx.fillRect(p.x-box/2,p.y-box/2,box,box);
   if(available.has(r.id)){ctx.strokeStyle='#ffe09a';ctx.lineWidth=large?3:2;ctx.strokeRect(p.x-box/2-4,p.y-box/2-4,box+8,box+8);}
   if(here){ctx.fillStyle='#ffe090';ctx.beginPath();ctx.moveTo(p.x,p.y-box*.4);ctx.lineTo(p.x+box*.34,p.y+box*.32);ctx.lineTo(p.x-box*.34,p.y+box*.32);ctx.closePath();ctx.fill();}
   else if(r.seen&&r.enemy?.hp>0){ctx.fillStyle='#662a33';ctx.fillRect(p.x-box*.5,p.y-box*.5,box,box);icon(ctx,'skull',p.x-box*.4,p.y-box*.4,box*.8);}
   else if(r.seen&&!r.used){const symbol={entry:'door',chest:'chest',camp:'camp',merchant:'merchant',shrine:'shrine',relic:r.relic?.icon}[r.type];if(symbol)icon(ctx,symbol,p.x-box*.4,p.y-box*.4,box*.8);}
   if(large){ctx.font=`${labelSize}px system-ui`;ctx.textAlign='center';ctx.fillStyle=available.has(r.id)?'#ffe09a':r.seen?'#cfd6db':'#5f7382';if(r.seen||available.has(r.id))ctx.fillText((r.seen?r.name:'미탐험')+(available.has(r.id)?' →':''),p.x,p.y+box*.5+labelSize+2*pixel);}
   if(r.enemy?.hp>0&&r.enemy.target!==null&&r.seen&&r.enemy.mode!=='idle'){
    const target=projectMap(r.enemy.target,w,h);ctx.strokeStyle='#fa8d5370';ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);
   }
  }
  if(s.lastSound?.strength>0&&ms-sounded<2800&&!reduced){const p=projectMap(s.lastSound.origin,w,h),age=(ms-sounded)/2800;ctx.globalAlpha=1-age;ctx.strokeStyle='#ffc45e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,8+age*s.lastSound.strength*12,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 }
 function frame(ms){if(!alive)return;const s=getState();
  if(lastPos!==s.pos){if(lastPos>=0)vector=travelVector(lastPos,s.pos);lastPos=s.pos;entered=ms;for(const id of [s.pos,...neighbours(s)])backdrop(s.rooms[id]);}
  if(lastSound!==s.soundSeq){lastSound=s.soundSeq;sounded=ms;}
  if(!document.hidden&&ms-lastTime>(reduced?120:16)){drawStage(ms);drawMap(mc,minimap.width,minimap.height,ms);lastTime=ms;}requestAnimationFrame(frame);
 }requestAnimationFrame(frame);
 function hitMap(el,x,y){const q=el.getBoundingClientRect(),xx=(x-q.left)/q.width*el.width,yy=(y-q.top)/q.height*el.height;for(let id=0;id<16;id++){const p=projectMap(id,el.width,el.height);if(Math.abs(xx-p.x)<el.width*.09&&Math.abs(yy-p.y)<el.height*.10)return id;}return-1;}
 return {setHover(id){hover=id;},setZoom(on){zoom=!!on;return zoom;},hit(x,y){
  if(zoom)return hitMap(canvas,x,y);
  const q=canvas.getBoundingClientRect(),s=getState();return hitExit(s.pos,neighbours(s),(x-q.left)/q.width,(y-q.top)/q.height);
 },hitMini(x,y){return hitMap(minimap,x,y);},burst(type='attack',text=''){if(type==='attack'){hitAt=performance.now();label=text;}if(type==='bad')damageAt=performance.now();if(type==='reward'){rewardAt=performance.now();rewardLabel=text;}},reset(){groundFx.clear();killFx.clear();killing=null;lastPos=-1;lastSound=-1;recentEnemy=null;recentEnemyPos=-1;rewardAt=-10000;hitAt=-10000;},stop(){alive=false;observer.disconnect();}};
}
