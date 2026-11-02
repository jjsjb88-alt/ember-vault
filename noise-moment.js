import {soundWavePlan} from './encounter.js';

export function makeNoiseMoment(dialog,{cue=()=>{},getSound=()=>false,toggleSound=()=>{}}={}){
 let active=false,timers=[],frame=0,callback=null,previousFocus=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const q=s=>dialog.querySelector(s);
 const later=(fn,ms)=>timers.push(setTimeout(()=>{if(active)fn();},ms));
 function clear(){timers.forEach(clearTimeout);timers=[];cancelAnimationFrame(frame);}
 function close(){if(!active)return;clear();active=false;dialog.close();document.body.classList.remove('listening');cue('stop');const done=callback;callback=null;previousFocus?.isConnected&&previousFocus.focus({preventScroll:true});done?.();}
 function shell(mode,done){
  if(active)close();active=true;callback=done;previousFocus=document.activeElement;
  dialog.dataset.mode=mode;dialog.dataset.phase='hush';
  dialog.innerHTML=`<div class="noise-eye" aria-hidden="true"></div><div class="noise-shell"><div class="noise-top"><span id="noiseKicker">EVERY SOUND LEAVES A TRACE</span><button data-noise="sound">♪ ${getSound()?'켜짐':'소리 켜기'}</button></div><div class="noise-body"><div class="noise-visual"><canvas id="noiseTrace" width="480" height="240" aria-label="연결된 통로를 따라 퍼지는 소리"></canvas><img class="noise-emblem" src="./assets/noise-seal-v6.png" alt=""></div><div class="noise-copy"><span id="noiseSource"></span><h2 id="noiseTitle">숨을 죽이세요.</h2><p id="noiseDetail" aria-live="polite"></p><strong id="noiseValue"></strong></div></div><div class="noise-footer"><div class="noise-rage"><div><span>용의 분노</span><strong id="noiseRageValue"></strong><small>습격 때 기본 2 + 분노만큼 추출</small></div><div class="noise-rage-track">${Array.from({length:5},(_,i)=>`<i data-pip="${i}"></i>`).join('')}</div></div><button data-noise="skip">계속 →</button></div></div>`;
  document.body.classList.add('listening');dialog.showModal();q('[data-noise="skip"]').focus({preventScroll:true});
 }
 function gauge(value){q('#noiseRageValue').textContent=`${value} / 5`;q('.noise-rage').classList.toggle('danger',value>=4);dialog.querySelectorAll('[data-pip]').forEach(e=>e.classList.toggle('lit',Number(e.dataset.pip)<value));}
 function start(s,previousNoise,done,{hold=false}={}){
  const sound=s.lastSound,plan=soundWavePlan(s,sound);
  shell('noise',done);q('#noiseSource').textContent=sound.label;q('#noiseValue').textContent=`소리 ${sound.strength}`;
  q('#noiseDetail').textContent='금고의 어둠이, 당신의 소리를 기다립니다.';gauge(s.dragon.rage);cue('heartbeat');
  const ctx=q('#noiseTrace').getContext('2d'),begin=performance.now()+500,at=id=>({x:56+(id%4)*120,y:28+Math.floor(id/4)*58});
  function draw(now){
   if(!active)return;const elapsed=reduced?2000:now-begin;ctx.clearRect(0,0,480,240);
   for(const[a,b]of s.edges){const A=at(a),B=at(b);ctx.strokeStyle='#344550';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();}
   for(const edge of plan.edges){const p=Math.min(1,Math.max(0,(elapsed-edge.delay)/300));if(!p)continue;const A=at(edge.from),B=at(edge.to);ctx.strokeStyle='#efaa57';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(A.x+(B.x-A.x)*p,A.y+(B.y-A.y)*p);ctx.stroke();if(p<1){ctx.fillStyle='#ffefd1';ctx.fillRect(A.x+(B.x-A.x)*p-3,A.y+(B.y-A.y)*p-3,6,6);}}
   for(const r of s.rooms){const p=at(r.id),node=plan.nodes.find(n=>n.id===r.id),lit=node&&elapsed>=node.delay,heard=lit&&sound.heard.some(e=>e.id===r.id);ctx.fillStyle=heard?'#9e3431':lit?'#795334':'#122631';ctx.strokeStyle=heard?'#ff8063':lit?'#ffcb86':'#54616a';ctx.lineWidth=2;ctx.fillRect(p.x-10,p.y-10,20,20);ctx.strokeRect(p.x-10,p.y-10,20,20);ctx.fillStyle='#ffe6bb';ctx.font='bold 18px system-ui';ctx.textAlign='center';if(r.id===sound.origin)ctx.fillText('·',p.x,p.y+4);else if(heard)ctx.fillText(r.seen?'!':'?',p.x,p.y+6);}
   frame=requestAnimationFrame(draw);
  }frame=requestAnimationFrame(draw);
  later(()=>{dialog.dataset.phase='travel';q('#noiseTitle').textContent='소리가 번진다.';q('#noiseDetail').textContent=`통로를 따라 ${sound.field.length}개 방에 닿습니다.`;cue('noise');},reduced?50:500);
  later(()=>{dialog.dataset.phase='heard';gauge(s.dragon.rage);const known=plan.heard.filter(e=>e.known);q('#noiseTitle').textContent=plan.heard.length?'누군가 들었다.':'아직, 들키지 않았다.';q('#noiseDetail').textContent=plan.heard.length?`${known.slice(0,2).map(e=>e.name).join(' · ')}${plan.heard.length>known.length?' · 어둠 속 기척':''} — 적 ${plan.heard.length}명 반응`:'주변에서 당신을 들은 적이 없습니다.';if(plan.heard.length)cue('heard');},reduced?100:1250);
  later(()=>{q('#noiseValue').textContent=`대기 ${s.dragon.pending} · 주머니 소음 ${s.dragon.bag.noise}`;},reduced?150:1950);
  if(hold)q('[data-noise="skip"]').textContent='확인했어요 →';else later(close,reduced?1500:3400);
 }
 function dragon(impact,done,{hold=false}={}){
  shell('dragon',done);q('#noiseKicker').textContent='THE DRAGON DRAWS';q('#noiseSource').textContent=impact.reason;q('#noiseTitle').textContent='주머니가 열린다.';
  q('#noiseDetail').textContent=`대기 소음을 넣고 ${impact.drawCount}개를 추출합니다.`;q('#noiseValue').textContent='';gauge(impact.rage);cue('rage');
  q('.noise-visual').innerHTML=`<div class="dragon-draw" aria-label="용 주머니 추출"><span class="draw-cube safe">?</span><p>무엇이 돌아올까요?</p></div>`;
  later(()=>{
   dialog.dataset.phase='impact';q('#noiseTitle').textContent=impact.taken?'소음이 돌아왔다.':'이번에는 무사하다.';
   q('#noiseDetail').textContent=`안전 ${impact.safe} · 소음 ${impact.noise} · 체력 ${impact.beforeHp} → ${impact.afterHp}`;
   q('#noiseValue').textContent=impact.taken?`−${impact.taken} HP`:'피해 없음';
   q('.dragon-draw').innerHTML=Array.from({length:impact.safe},()=>'<span class="draw-cube safe" aria-label="안전">·</span>').join('')+Array.from({length:impact.noise},()=>'<span class="draw-cube noisy" aria-label="소음 피해">!</span>').join('')+'<p>뽑힌 큐브는 주머니에서 빠집니다.<br>남은 소음은 다음 습격까지 남습니다.</p>';
   cue(impact.taken?'impact':'heard');
  },reduced?100:900);
  if(hold)q('[data-noise="skip"]').textContent='다음 단계 →';else later(close,reduced?1500:3500);
 }
 dialog.addEventListener('click',ev=>{const type=ev.target.closest('[data-noise]')?.dataset.noise;if(type==='skip')close();if(type==='sound'){toggleSound();q('[data-noise="sound"]').textContent=`♪ ${getSound()?'켜짐':'소리 켜기'}`;}});
 dialog.addEventListener('cancel',ev=>{ev.preventDefault();close();});
 return {start,dragon,close,get active(){return active;}};
}
