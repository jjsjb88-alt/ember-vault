import {soundWavePlan} from './encounter.js';
import {makeFxLayer,FX} from './fx-layer.js?v=20261103c';

export function makeNoiseMoment(dialog,{cue=()=>{},getSound=()=>false,toggleSound=()=>{}}={}){
 let active=false,timers=[],frame=0,fxFrame=0,callback=null,previousFocus=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const q=s=>dialog.querySelector(s);
 const later=(fn,ms)=>timers.push(setTimeout(()=>{if(active)fn();},ms));
 function clear(){timers.forEach(clearTimeout);timers=[];cancelAnimationFrame(frame);cancelAnimationFrame(fxFrame);}
 function close(){if(!active)return;clear();active=false;dialog.close();document.body.classList.remove('listening');cue('stop');const done=callback;callback=null;previousFocus?.isConnected&&previousFocus.focus({preventScroll:true});done?.();}
 function shell(mode,done){
  if(active)close();active=true;callback=done;previousFocus=document.activeElement;
  dialog.dataset.mode=mode;dialog.dataset.phase='hush';
  dialog.innerHTML=`<div class="noise-eye" aria-hidden="true"></div><canvas class="noise-fx" aria-hidden="true"></canvas><div class="noise-shell"><div class="noise-top"><span id="noiseKicker">모든 소리는 남는다</span><button data-noise="sound">♪ ${getSound()?'켜짐':'소리 켜기'}</button></div><div class="noise-body"><div class="noise-visual"><canvas id="noiseTrace" width="480" height="240" aria-label="연결된 통로를 따라 퍼지는 소리"></canvas><img class="noise-emblem" src="./assets/noise-seal-v6.png" alt=""></div><div class="noise-copy"><span id="noiseSource"></span><h2 id="noiseTitle">숨을 죽이세요.</h2><p id="noiseDetail" aria-live="polite"></p><strong id="noiseValue"></strong></div></div><div class="noise-footer"><div class="noise-rage"><div><span>용의 경계</span><strong id="noiseRageValue"></strong><small>8 이상 · 턴 끝에 용의 공격</small></div><div class="noise-rage-track">${Array.from({length:8},(_,i)=>`<i data-pip="${i}"></i>`).join('')}</div></div><button data-noise="skip">계속 →</button></div></div>`;
  document.body.classList.add('listening');dialog.showModal();q('[data-noise="skip"]').focus({preventScroll:true});
 }
 function gauge(value){q('#noiseRageValue').textContent=`${value} / 8`;q('.noise-rage').classList.toggle('danger',value>=8);dialog.querySelectorAll('[data-pip]').forEach(e=>e.classList.toggle('lit',Number(e.dataset.pip)<value));}
 function start(s,previousNoise,done,{hold=false}={}){
  const sound=s.lastSound,plan=soundWavePlan(s,sound),rage=s.noise>=8;
  shell('noise',done);q('#noiseSource').textContent=sound.label;q('#noiseValue').textContent=`소리 ${sound.strength}`;
  q('#noiseDetail').textContent='금고의 어둠이, 당신의 소리를 기다립니다.';gauge(previousNoise);cue('heartbeat');
  const ctx=q('#noiseTrace').getContext('2d'),begin=performance.now()+500,at=id=>({x:56+(id%4)*120,y:28+Math.floor(id/4)*58});
  function draw(now){
   if(!active)return;const elapsed=reduced?2000:now-begin;ctx.clearRect(0,0,480,240);
   for(const[a,b]of s.edges){const A=at(a),B=at(b);ctx.strokeStyle='#344550';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();}
   for(const edge of plan.edges){const p=Math.min(1,Math.max(0,(elapsed-edge.delay)/300));if(!p)continue;const A=at(edge.from),B=at(edge.to);ctx.strokeStyle='#efaa57';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(A.x+(B.x-A.x)*p,A.y+(B.y-A.y)*p);ctx.stroke();if(p<1){ctx.fillStyle='#ffefd1';ctx.fillRect(A.x+(B.x-A.x)*p-3,A.y+(B.y-A.y)*p-3,6,6);}}
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

 // ── Judgment (time stopped): the player shields one place, a light circles and slows, the breath lands.
 const SLOTS=[{id:'body',name:'몸',icon:'♥',angle:-90},{id:'gold',name:'금화 주머니',icon:'◎',angle:150},{id:'lamp',name:'등불',icon:'✦',angle:30}];
 let pickFn=null,cancelFn=null;
 function judge(f,onPick,onCancel){
  if(active)close();active=true;callback=null;previousFocus=document.activeElement;pickFn=onPick;cancelFn=onCancel;
  dialog.dataset.mode='judge';dialog.dataset.phase='choose';
  const cost={body:f.taken?`체력 −${f.taken}${f.blocked?` (방어 ${f.blocked} 막음)`:''}`:'방어로 전부 막음',gold:f.gold?`금화 −${f.gold}`:'주머니가 비어 있음',lamp:`경계 ${f.noise} 그대로 · 다음 턴도 판정`};
  dialog.innerHTML=`<div class="noise-eye" aria-hidden="true"></div><div class="judge-shell"><div class="judge-top"><span>✦ 판정 — 시간 정지</span><i class="judge-steps" aria-hidden="true"><b class="on"></b><b></b><b></b></i></div>
  <div class="judge-stage"><div class="judge-ring" aria-hidden="true"><div class="judge-eye"></div><div class="judge-light"></div></div>
  ${SLOTS.map(x=>`<button class="judge-slot" data-judge="${x.id}" style="--a:${x.angle}deg"><span class="judge-ico">${x.icon}</span><strong>${x.name}</strong><small>${cost[x.id]}</small><em class="judge-shield" aria-hidden="true">방패</em></button>`).join('')}</div>
  <div class="judge-copy"><h2 id="judgeTitle">용이 숨을 들이마신다.</h2><p id="judgeDetail">경계 ${f.noise} · 숨결은 셋 중 한 곳에 떨어집니다. <b>방패를 놓을 곳</b>을 고르세요 · 각 1/3</p></div>
  <div class="judge-foot"><button data-judge="back">← 턴으로 돌아가기</button></div></div>`;
  document.body.classList.add('listening');dialog.showModal();cue('heartbeat');fitRing();
  dialog.querySelector('[data-judge="body"]').focus({preventScroll:true});
 }
 function fitRing(){const ring=dialog.querySelector('.judge-ring');if(ring)dialog.querySelector('.judge-stage').style.setProperty('--px',`${ring.getBoundingClientRect().width/2}px`);}
 addEventListener('resize',()=>{if(active&&dialog.dataset.mode==='judge')fitRing();});
 function spin(j,done){
  if(!active||dialog.dataset.mode!=='judge'){done?.();return;}
  callback=done;dialog.dataset.phase='spin';
  dialog.querySelectorAll('.judge-slot').forEach(b=>{b.disabled=true;b.classList.toggle('guarded',b.dataset.judge===j.guard);});
  dialog.querySelector('.judge-foot').innerHTML='<button data-noise="skip">계속 →</button>';
  const steps=dialog.querySelectorAll('.judge-steps b');steps[1].classList.add('on');
  q('#judgeTitle').textContent='방패가 버틸까?';q('#judgeDetail').textContent='빛을 보세요.';fitRing();
  const light=q('.judge-light'),target=SLOTS.find(x=>x.id===j.slot).angle,from=-90;
  const total=reduced?0:360*3+((target-from)%360+360)%360,dur=reduced?0:3600,t0=performance.now();let lastSlot='';
  const place=a=>{light.style.transform=`rotate(${a}deg) translateX(var(--px))`;const near=SLOTS.find(x=>Math.abs((((a-x.angle)%360)+540)%360-180)<16);
   dialog.querySelectorAll('.judge-slot').forEach(b=>b.classList.toggle('lit',near?.id===b.dataset.judge));
   if(near&&near.id!==lastSlot){lastSlot=near.id;cue('tick');}else if(!near)lastSlot='';};
  const ease=t=>1-Math.pow(1-t,4);
  const run=now=>{if(!active)return;const t=dur?Math.min(1,(now-t0)/dur):1;place(from+total*ease(t));if(t<1)frame=requestAnimationFrame(run);else land(j);};
  frame=requestAnimationFrame(run);
 }
 function land(j){
  dialog.dataset.phase=j.held?'held':'hit';
  const steps=dialog.querySelectorAll('.judge-steps b');steps[2].classList.add('on');
  dialog.querySelector(`[data-judge="${j.slot}"]`)?.classList.add('landed');
  const name=SLOTS.find(x=>x.id===j.slot).name;
  if(j.held){q('#judgeTitle').textContent='방패가 버텼다.';q('#judgeDetail').textContent=`숨결이 ${name}에 떨어졌지만, 방패가 막아냈습니다.`;cue('hold');}
  else{
   q('#judgeTitle').textContent=j.slot==='body'?'숨결이 몸을 덮쳤다.':j.slot==='gold'?'숨결이 주머니를 녹였다.':'등불이 꺼졌다.';
   q('#judgeDetail').textContent=j.slot==='body'?`공격 ${j.raw} · 체력 ${j.beforeHp} → ${j.afterHp}${j.taken?` · −${j.taken} HP`:' · 방어로 막음'}`:j.slot==='gold'?(j.gold?`금화 ${j.beforeGold} → ${j.beforeGold-j.gold} · −${j.gold}`:'주머니가 비어 있어 잃은 것이 없습니다.'):`경계 ${j.noise}가 내려가지 않습니다. 다음 턴도 판정입니다.`;
   cue('impact');
  }
  fitRing();dialog.querySelector('[data-noise="skip"]')?.focus({preventScroll:true});
  later(close,reduced?1800:3200);
 }
 dialog.addEventListener('click',ev=>{const type=ev.target.closest('[data-noise]')?.dataset.noise;if(type==='skip')close();const jd=ev.target.closest('[data-judge]:not(:disabled)')?.dataset.judge;if(jd&&dialog.dataset.phase==='choose'){if(jd==='back'){const c=cancelFn;cancelFn=pickFn=null;close();c?.();}else{const p=pickFn;pickFn=cancelFn=null;dialog.dataset.phase='commit';p?.(jd);}}if(type==='sound'){toggleSound();q('[data-noise="sound"]').textContent=`♪ ${getSound()?'켜짐':'소리 켜기'}`;}});
 dialog.addEventListener('cancel',ev=>{ev.preventDefault();if(dialog.dataset.mode==='judge'&&dialog.dataset.phase==='choose'){const c=cancelFn;cancelFn=pickFn=null;close();c?.();}else if(dialog.dataset.phase!=='spin'&&dialog.dataset.phase!=='commit')close();});
 return {start,dragon,judge,spin,close,get active(){return active;}};
}
