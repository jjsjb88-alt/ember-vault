import {soundWavePlan} from './encounter.js';
import {makeFxLayer,FX} from './fx-layer.js';

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
  later(()=>{dialog.dataset.phase='heard';gauge(s.noise);const known=plan.heard.filter(e=>e.known);q('#noiseTitle').textContent=plan.heard.length?'누군가 들었다.':'아직, 들키지 않았다.';q('#noiseDetail').textContent=plan.heard.length?`${known.slice(0,2).map(e=>e.name).join(' · ')}${plan.heard.length>known.length?' · 어둠 속 기척':''} — 적 ${plan.heard.length}명 반응`:'주변에서 당신을 들은 적이 없습니다.';if(plan.heard.length)cue('heard');},reduced?100:1250);
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
 dialog.addEventListener('click',ev=>{const type=ev.target.closest('[data-noise]')?.dataset.noise;if(type==='skip')close();if(type==='sound'){toggleSound();q('[data-noise="sound"]').textContent=`♪ ${getSound()?'켜짐':'소리 켜기'}`;}});
 dialog.addEventListener('cancel',ev=>{ev.preventDefault();close();});
 return {start,dragon,close,get active(){return active;}};
}
