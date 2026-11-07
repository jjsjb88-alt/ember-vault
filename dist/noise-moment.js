import {soundWavePlan} from './encounter.js?v=20261107b';
import {makeFxLayer,FX} from './fx-layer.js?v=20261107b';
import {lairRoom} from './engine.js?v=20261107b';
import {mapLayout,projectMap,mapPassage,passagePoint} from './scene-layout.js?v=20261107b';

export function makeNoiseMoment(dialog,{cue=()=>{},getSound=()=>false,toggleSound=()=>{}}={}){
 let active=false,timers=[],frame=0,fxFrame=0,callback=null,previousFocus=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const q=s=>dialog.querySelector(s);
 function passage(ctx,path,progress=1){const end=passagePoint(path,progress);ctx.beginPath();ctx.moveTo(path.start.x,path.start.y);if(path.control)ctx.quadraticCurveTo(path.start.x+(path.control.x-path.start.x)*progress,path.start.y+(path.control.y-path.start.y)*progress,end.x,end.y);else ctx.lineTo(end.x,end.y);ctx.stroke();return end;}
 const later=(fn,ms)=>timers.push(setTimeout(()=>{if(active)fn();},ms));
 function clear(){timers.forEach(clearTimeout);timers=[];cancelAnimationFrame(frame);cancelAnimationFrame(fxFrame);cancelAnimationFrame(mapFrame);}
 function close(){if(!active)return;clear();active=false;dialog.close();document.body.classList.remove('listening');cue('stop');const done=callback;callback=null;previousFocus?.isConnected&&previousFocus.focus({preventScroll:true});done?.();}
 function shell(mode,done){
  if(active)close();active=true;callback=done;previousFocus=document.activeElement;
  dialog.dataset.mode=mode;dialog.dataset.phase='hush';
  dialog.innerHTML=`<div class="noise-eye" aria-hidden="true"></div><canvas class="noise-fx" aria-hidden="true"></canvas><div class="noise-shell"><div class="noise-top"><span id="noiseKicker">모든 소리는 남는다</span><button data-noise="sound">♪ ${getSound()?'켜짐':'소리 켜기'}</button></div><div class="noise-body"><div class="noise-visual"><canvas id="noiseTrace" width="480" height="240" aria-label="연결된 통로를 따라 퍼지는 소리"></canvas><img class="noise-emblem" src="./assets/v95/props/seal.webp" alt=""></div><div class="noise-copy"><span id="noiseSource"></span><h2 id="noiseTitle">숨을 죽이세요.</h2><p id="noiseDetail" aria-live="polite"></p><strong id="noiseValue"></strong></div></div><div class="noise-footer"><div class="noise-rage"><div><span>용의 경계</span><strong id="noiseRageValue"></strong><small>8 이상 · 턴 끝에 용의 공격</small></div><div class="noise-rage-track">${Array.from({length:8},(_,i)=>`<i data-pip="${i}"></i>`).join('')}</div></div><button data-noise="skip">계속 →</button></div></div>`;
  document.body.classList.add('listening');dialog.showModal();q('[data-noise="skip"]').focus({preventScroll:true});
 }
 function gauge(value){q('#noiseRageValue').textContent=`${value} / 8`;q('.noise-rage').classList.toggle('danger',value>=8);dialog.querySelectorAll('[data-pip]').forEach(e=>e.classList.toggle('lit',Number(e.dataset.pip)<value));}
 function start(s,previousNoise,done,{hold=false}={}){
  const sound=s.lastSound,plan=soundWavePlan(s,sound),rage=s.noise>=8;
  shell('noise',done);q('#noiseSource').textContent=sound.label;q('#noiseValue').textContent=`소리 ${sound.strength}`;
  q('#noiseDetail').textContent='금고의 어둠이, 당신의 소리를 기다립니다.';gauge(previousNoise);cue('heartbeat');
  const trace=q('#noiseTrace'),ctx=trace.getContext('2d'),begin=performance.now()+500,at=id=>projectMap(id,trace.width,trace.height,{roomCount:s.rooms.length});
  function draw(now){
   if(!active)return;const elapsed=reduced?2000:now-begin;ctx.clearRect(0,0,trace.width,trace.height);
   for(const[a,b]of s.edges){const path=mapPassage(a,b,trace.width,trace.height,{roomCount:s.rooms.length});ctx.strokeStyle=path.lift?'#77c6ba':'#344550';ctx.lineWidth=2;ctx.setLineDash(path.lift?[5,4]:[]);passage(ctx,path);ctx.setLineDash([]);}
   for(const edge of plan.edges){const p=Math.min(1,Math.max(0,(elapsed-edge.delay)/300));if(!p)continue;const path=mapPassage(edge.from,edge.to,trace.width,trace.height,{roomCount:s.rooms.length});ctx.strokeStyle='#efaa57';ctx.lineWidth=3;const point=passage(ctx,path,p);if(p<1){ctx.fillStyle='#ffefd1';ctx.fillRect(point.x-3,point.y-3,6,6);}}
   for(const r of s.rooms){const p=at(r.id),node=plan.nodes.find(n=>n.id===r.id),lit=node&&elapsed>=node.delay,heard=lit&&sound.heard.some(e=>e.id===r.id);ctx.fillStyle=heard?'#9e3431':lit?'#795334':'#122631';ctx.strokeStyle=heard?'#ff8063':lit?'#ffcb86':'#54616a';ctx.lineWidth=2;ctx.fillRect(p.x-10,p.y-10,20,20);ctx.strokeRect(p.x-10,p.y-10,20,20);ctx.fillStyle='#ffe6bb';ctx.font='bold 18px system-ui';ctx.textAlign='center';if(r.id===sound.origin)ctx.fillText('·',p.x,p.y+4);else if(heard)ctx.fillText(r.seen?'!':'?',p.x,p.y+6);}
   frame=requestAnimationFrame(draw);
  }frame=requestAnimationFrame(draw);
  later(()=>{dialog.dataset.phase='travel';q('#noiseTitle').textContent='소리가 번진다.';q('#noiseDetail').textContent=`통로를 따라 ${sound.field.length}개 방에 닿습니다.`;cue('noise');},reduced?50:500);
  later(()=>{dialog.dataset.phase='heard';gauge(s.noise);q('#noiseValue').textContent=s.noise>previousNoise?`소리 ${sound.strength} → 경계 ${previousNoise} → ${s.noise}`:`소리 ${sound.strength}`;const known=plan.heard.filter(e=>e.known);q('#noiseTitle').textContent=plan.heard.length?'누군가 들었다.':'아직, 들키지 않았다.';q('#noiseDetail').textContent=plan.heard.length?`${known.slice(0,2).map(e=>e.name).join(' · ')}${plan.heard.length>known.length?' · 어둠 속 기척':''} — 적 ${plan.heard.length}명 반응`:'주변에서 당신을 들은 적이 없습니다.';if(plan.heard.length)cue('heard');},reduced?100:1250);
  if(rage)later(()=>{dialog.dataset.phase='rage';q('#noiseTitle').textContent=previousNoise<8?'용이 눈을 떴다.':'분노가 사그라들지 않는다.';q('#noiseDetail').textContent='경계가 8 이상인 채 턴을 마치면 용의 숨결이 덮칩니다.';q('#noiseValue').textContent=`경계 ${s.noise} · 위험`;cue('rage');},reduced?150:1950);
  if(hold)q('[data-noise="skip"]').textContent='확인했어요 →';else later(close,reduced?1500:rage?4600:3400);
 }
 function dragon(impact,noise,done,{hold=false}={}){
  shell('dragon',done);q('#noiseKicker').textContent='금고가 깨어났다';q('#noiseSource').textContent='턴 종료 · 용의 분노';q('#noiseTitle').textContent='피할 곳이 없다.';q('#noiseDetail').textContent='어둠 너머에서, 숨을 들이마신다.';q('#noiseValue').textContent='';gauge(noise);cue('rage');
  if(!reduced)later(breathe,820);
  later(()=>{dialog.dataset.phase='impact';q('#noiseTitle').textContent='용의 숨결';q('#noiseDetail').textContent=`공격 ${impact.raw} · 방어 ${impact.blocked} · 체력 ${impact.beforeHp} → ${impact.afterHp}`;q('#noiseValue').textContent=impact.taken?`−${impact.taken} HP`:'완전 방어';cue('impact');},reduced?100:900);
  if(hold)q('[data-noise="skip"]').textContent='다음 단계 →';else later(close,reduced?1500:3500);
 }
 // the dragon's breath: a pixelfx fire stream rolling in from the dark at the left
 function breathe(){
  const cv=q('.noise-fx');if(!cv)return;
  const w=Math.max(1,cv.clientWidth),h=Math.max(1,cv.clientHeight),px=Math.max(3,Math.round(w/220));
  cv.width=w;cv.height=h;const ctx=cv.getContext('2d'),layer=makeFxLayer(px);
  const portrait=h>w;
  layer.add(FX.fireBreath,{x:-px*4,y:h*(portrait?.42:.6),angle:portrait?.32:-.04,light:1.1},{until:performance.now()+2500});
  const tick=now=>{if(!active)return;ctx.clearRect(0,0,w,h);layer.render(ctx,w,h,now);if(layer.active)fxFrame=requestAnimationFrame(tick);};
  fxFrame=requestAnimationFrame(tick);
 }



 // ── Dragon breath that follows echoes. Time stops on the sound map; the breath catches the strongest echo
 //    and crawls along echoing passages. Will it reach the room you stand in?
 let pickFn=null,cancelFn=null,mapFrame=0;
 const MAP_W=480,MAP_H=260;
 function drawBreathMap(cv,s,echo,{burned=[],lead=null,hit=false}={},now=performance.now()){
  const ctx=cv.getContext('2d'),options={roomCount:s.rooms.length},grid=mapLayout(cv.width,cv.height,options),spot=id=>projectMap(id,cv.width,cv.height,options),lair=lairRoom(s),pixel=cv.width/(cv.clientWidth||cv.width);
  ctx.clearRect(0,0,cv.width,cv.height);
  for(const[a,b]of s.edges){const path=mapPassage(a,b,cv.width,cv.height,options),fire=burned.some(x=>x.id===a&&x.from===b||x.id===b&&x.from===a);ctx.strokeStyle=fire?'#ff7a3c':path.lift?'#77c6ba':'#33414c';ctx.lineWidth=fire?4:2;ctx.setLineDash(path.lift?[5,4]:[]);passage(ctx,path);ctx.setLineDash([]);}
  if(lead){const path=mapPassage(lead.from,lead.to,cv.width,cv.height,options);if(lead.lair)path.control=null;ctx.strokeStyle='#ffb05c';ctx.lineWidth=4;ctx.setLineDash(lead.from===lair&&lead.lair?[6,6]:[]);const point=passage(ctx,path,lead.p);ctx.setLineDash([]);
   const hx=point.x,hy=point.y,g=ctx.createRadialGradient(hx,hy,0,hx,hy,22);g.addColorStop(0,'#fff3c8');g.addColorStop(.4,'#ff9a3caa');g.addColorStop(1,'#ff4a1a00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(hx,hy,22,0,Math.PI*2);ctx.fill();}
  for(const r of s.rooms){const p=spot(r.id),me=r.id===s.pos,known=r.seen||me,e=known?echo[r.id]||0:0,burn=burned.find(x=>x.id===r.id);
   if(burn){const f=reduced?1:.75+.25*Math.sin(now/90+r.id);const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,40);g.addColorStop(0,`rgba(255,170,70,${.85*f})`);g.addColorStop(.5,`rgba(220,70,20,${.5*f})`);g.addColorStop(1,'rgba(120,20,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,40,0,Math.PI*2);ctx.fill();}
   else if(e>0){const f=reduced?1:.6+.4*Math.sin(now/260+r.id*1.7),rad=10+e*2.6;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rad);g.addColorStop(0,`rgba(255,190,90,${.55*f})`);g.addColorStop(1,'rgba(255,120,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,rad,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle=me?(hit?'#ff6b4a':'#e6c478'):burn?'#7a2a14':known?'#2a3d4b':'#13212b';ctx.strokeStyle=me?'#fff0c0':known&&r.id===lair?'#c2412a':'#56636c';ctx.lineWidth=me?3:2;ctx.fillRect(p.x-12,p.y-12,24,24);ctx.strokeRect(p.x-12,p.y-12,24,24);
   ctx.textAlign='center';ctx.font=`bold ${12*pixel}px system-ui`;
   if(me){ctx.fillStyle='#2a1a08';ctx.fillText('나',p.x,p.y+4);}
   else if(known&&r.id===lair){ctx.fillStyle='#ffb49a';ctx.fillText('용',p.x,p.y+4);}
   else if(known&&r.type==='mechanism'){ctx.fillStyle='#c7d9c4';ctx.fillText(r.used?'↗':'⚙',p.x,p.y+4);}
   if(e>0&&!burn){ctx.fillStyle='#ffd08a';ctx.font=`bold ${11*pixel}px system-ui`;ctx.fillText(e,p.x+22*pixel,p.y+4*pixel);}
   if(known){ctx.fillStyle=me?'#ffe4aa':'#bdc8ce';ctx.font=`${10*pixel}px system-ui`;let name=r.name;while(name.length>1&&ctx.measureText(name).width>grid.columnGap*.88)name=name.slice(0,-2)+'…';ctx.fillText(name,p.x,p.y+12+11*pixel);}
  }
 }
 function judge(s,plan,block,onPick,onCancel){
  if(active)close();active=true;callback=null;previousFocus=document.activeElement;pickFn=onPick;cancelFn=onCancel;
  dialog.dataset.mode='judge';dialog.dataset.phase='choose';
  const here=s.echo[s.pos],lingers=(s.memory||0)+1;
  dialog.innerHTML=`<div class="noise-eye" aria-hidden="true"></div><div class="judge-shell"><div class="judge-top"><span>✦ 용의 숨결 — 시간 정지</span><i class="judge-steps" aria-hidden="true"><b class="on"></b><b></b><b></b></i><small>${s.relic?`금고의 기억 ${lingers}턴 · `:''}${plan.reach}개 방까지</small></div>
  <div class="judge-stage"><canvas class="breath-map" width="${MAP_W}" height="${MAP_H}" aria-label="메아리가 남은 방과 용의 둥지가 표시된 소리 지도"></canvas></div>
  <div class="judge-copy"><h2 id="judgeTitle">숨결이 메아리를 더듬는다.</h2><p id="judgeDetail">${plan.start===null?'금고에 남은 메아리가 없습니다.':`숨결은 가장 진한 메아리에서 시작해 이어진 메아리를 따라 최대 <b>${plan.reach}개 방</b>을 태웁니다. 지금 방의 메아리 <b>${here}</b>${here?'':' — 메아리 없는 방에는 닿지 않습니다'}${block?` · 방어 ${block}`:''}`}</p></div>
  <div class="judge-foot"><button class="primary" data-judge="draw">숨결을 기다린다 →</button><button data-judge="back">← 턴으로 돌아가기</button></div></div>`;
  document.body.classList.add('listening');dialog.showModal();cue('heartbeat');
  const cv=q('.breath-map'),idle=now=>{if(!active||dialog.dataset.phase!=='choose')return;drawBreathMap(cv,s,s.echo,{},now);mapFrame=requestAnimationFrame(idle);};mapFrame=requestAnimationFrame(idle);
  dialog.querySelector('[data-judge="draw"]').focus({preventScroll:true});
 }
 function spin(s,a,done){
  if(!active||dialog.dataset.mode!=='judge'){done?.();return;}
  cancelAnimationFrame(mapFrame);callback=done;dialog.dataset.phase='spin';
  dialog.querySelectorAll('.judge-steps b')[1].classList.add('on');
  dialog.querySelector('.judge-foot').innerHTML='<button data-noise="skip">계속 →</button>';
  const cv=q('.breath-map'),view={...s,pos:a.pos},echo=a.echoes,burned=[];let lead=null,hit=false;
  const draw=now=>{if(!active)return;drawBreathMap(cv,view,echo,{burned,lead,hit},now);mapFrame=requestAnimationFrame(draw);};mapFrame=requestAnimationFrame(draw);
  const name=id=>s.rooms[id].seen?s.rooms[id].name:'어둠 속 방';
  if(a.start===null){q('#judgeTitle').textContent='숨결이 길을 잃었다.';q('#judgeDetail').textContent='따라갈 메아리가 없어 어둠만 태우고 사그라듭니다.';later(()=>land(s,a,false),reduced?50:1400);return;}
  q('#judgeTitle').textContent='둥지에서 불길이 일어난다.';q('#judgeDetail').textContent=`가장 진한 메아리 — ${name(a.start)}`;
  const steps=a.path.map((id,i)=>({id,from:i?a.path.slice(0,i).find(p=>s.edges.some(([x,y])=>x===id&&y===p||y===id&&x===p))??a.path[i-1]:lairRoom(s),lair:!i}));
  let at=reduced?0:300;
  steps.forEach((st,i)=>{
   const toMe=st.id===a.pos,near=steps[i+1]?.id===a.pos,travel=reduced?0:st.lair?900:650,pause=reduced?40:toMe?1500:near?1100:500+i*120;
   later(()=>{const t0=performance.now();lead={from:st.from,to:st.id,p:0,lair:st.lair};cue('tick');
    const grow=now=>{if(!active||!lead)return;lead.p=travel?Math.min(1,(now-t0)/travel):1;if(lead.p<1)requestAnimationFrame(grow);};requestAnimationFrame(grow);
    if(toMe){q('#judgeTitle').textContent='…이쪽으로 온다.';q('#judgeDetail').textContent='';}},at);
   at+=travel+(toMe?pause:0);
   later(()=>{lead=null;burned.push({id:st.id,from:st.lair?null:st.from});if(toMe)hit=true;cue(toMe?'impact':'noise');
    if(toMe){q('#judgeTitle').textContent='불길이 방을 덮쳤다.';q('#judgeDetail').textContent='';}
    else if(!hit){q('#judgeTitle').textContent=near?'숨결이 바로 옆 방까지 왔다.':`${name(st.id)}의 메아리가 탄다.`;q('#judgeDetail').textContent=`${i+1} / ${a.reach}`;}
    if(i===steps.length-1)later(()=>land(s,a,toMe),reduced?50:700);},at);
   at+=toMe?0:pause;
  });
 }
 function land(s,a,reached){
  dialog.dataset.phase=a.taken?'hit':'held';dialog.querySelectorAll('.judge-steps b')[2].classList.add('on');
  if(a.hit){q('#judgeTitle').textContent=a.taken?'숨결이 당신을 찾아냈다.':'숨결이 닿았지만, 방어가 버텼다.';q('#judgeDetail').textContent=`이 방의 메아리 ${a.echo} · 피해 ${a.damage}${a.blocked?` (방어 ${a.blocked})`:''} · 체력 ${a.beforeHp} → ${a.afterHp}`;}
  else if(a.start!==null){q('#judgeTitle').textContent='숨결이 닿지 않았다.';q('#judgeDetail').textContent=`메아리 ${a.path.length}곳이 타서 사라졌습니다. 이 방은 조용했습니다.`;}
  if(a.taken)cue('impact');
  dialog.querySelector('[data-noise="skip"]')?.focus({preventScroll:true});
  later(close,reduced?1800:3400);
 }
 dialog.addEventListener('click',ev=>{const type=ev.target.closest('[data-noise]')?.dataset.noise;if(type==='skip')close();const jd=ev.target.closest('[data-judge]:not(:disabled)')?.dataset.judge;if(jd&&dialog.dataset.phase==='choose'){if(jd==='back'){const c=cancelFn;cancelFn=pickFn=null;close();c?.();}else{const p=pickFn;pickFn=cancelFn=null;dialog.dataset.phase='commit';p?.(jd);}}if(type==='sound'){toggleSound();q('[data-noise="sound"]').textContent=`♪ ${getSound()?'켜짐':'소리 켜기'}`;}});
 dialog.addEventListener('cancel',ev=>{ev.preventDefault();if(dialog.dataset.mode==='judge'&&dialog.dataset.phase==='choose'){const c=cancelFn;cancelFn=pickFn=null;close();c?.();}else if(dialog.dataset.phase!=='spin'&&dialog.dataset.phase!=='commit')close();});
 return {start,dragon,judge,spin,close,get active(){return active;}};
}
