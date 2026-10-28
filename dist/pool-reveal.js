import {CARDS,neighbours,moveCost} from './engine.js';
import {paintIcons} from './art.js';

const KEYS=['sword','move','skill','block','quiet','rattle'];
const VALUES=[['sword','공격력'],['move','이동력'],['skill','기술'],['block','방어']];
const glyph=(name,size=64)=>`<canvas data-icon="${name}" width="${size}" height="${size}" aria-hidden="true"></canvas>`;

export function noiseDrawState(step){
 const added=step.delta.rattle||0,stored=step.totals.rattle||0,quiet=step.totals.quiet||0;
 return {added,stored,quiet,exposed:Math.max(0,stored-quiet)};
}

export function revealStakes(state,shown){
 const enemy=state.rooms[state.pos].enemy;
 if(enemy?.hp>0){const need=Math.max(0,enemy.hp-shown.sword);return need?`공격력이 ${need} 더 필요하다`:'돌파할 공격력이 모였다';}
 const costs=neighbours(state).map(id=>moveCost(state,id));
 const need=Math.max(0,Math.min(...costs)-shown.move);
 if(need)return `한 걸음 더. 이동력이 ${need} 더 필요하다`;
 if(state.relic)return `붕괴까지 ${state.countdown}턴 · 돌아갈 힘을 모아라`;
 return '다음 발걸음은, 이 추출에 달려 있다';
}

// Presentation only: consume the already committed draw, never draw or mutate a run.
export function buildRevealPlan(state){
 const ids=[...state.played],totals={...state.poolTotal};
 const effect=id=>{const e=CARDS[id].e;return Object.fromEntries(KEYS.map(k=>[k,k==='quiet'?Math.max(0,-(e.noise||0)):k==='rattle'?Math.max(0,e.noise||0):(e[k]||0)]));};
 const base=Object.fromEntries(KEYS.map(k=>[k,Math.max(0,(totals[k]||0)-ids.reduce((n,id)=>n+effect(id)[k],0))]));
 let slots=Math.min(5,ids.length),sum={...base};
 const steps=ids.map((id,index)=>{
  const delta=effect(id),before={...sum},beforeSlots=slots;
  for(const k of KEYS)sum[k]+=delta[k];
  slots=Math.min(ids.length,slots+(CARDS[id].e.draw||0));
  return {id,index,delta,before,totals:{...sum},slots,added:slots-beforeSlots,last:index===ids.length-1};
 });
 return {base,totals,steps,initialSlots:Math.min(5,ids.length)};
}

export function makePoolReveal(dialog,{cue=()=>{},getSound=()=>false,toggleSound=()=>{},onClose=()=>{}}={}){
 const root=dialog.querySelector('.reveal-content');
 let plan=null,run=null,index=-1,visibleSlots=5,timers=new Set(),active=false,complete=false,previousFocus=null,holdNoise=false,noiseHeld=false;
 const q=s=>root.querySelector(s);
 function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);if(active)fn();},ms);timers.add(id);}
 function clear(){for(const id of timers)clearTimeout(id);timers.clear();}
 function soundButton(){q('[data-reveal="sound"]').textContent=getSound()?'♪ 효과음 켜짐':'♪ 효과음 꺼짐';q('[data-reveal="sound"]').setAttribute('aria-pressed',String(getSound()));}
 function strip(){
  const start=Math.min(Math.max(0,visibleSlots-5),Math.floor(Math.max(0,index+1)/5)*5);
  q('.reveal-slots').innerHTML=Array.from({length:Math.min(5,visibleSlots-start)},(_,offset)=>{
   const i=start+offset;
   const known=i<=index,card=known?CARDS[plan.steps[i].id]:null;
   return `<div class="sealed-token ${known?'opened '+card.family:''} ${i===index+1&&!complete?'next':''}" aria-label="${known?card.name:'미공개 능력'}"><span class="seal-face">${known?glyph(card.icon,28):'<b>◇</b>'}</span><small>${known?card.name:String(i+1).padStart(2,'0')}</small></div>`;
  }).join('');
  paintIcons(q('.reveal-slots'));
 }
 function totals(values,delta={}){
  for(const [key]of VALUES){
   const el=q(`[data-total="${key}"]`);el.querySelector('strong').textContent=values[key];
   el.querySelector('em').textContent=delta[key]?`+${delta[key]}`:'';
   el.classList.remove('gain');if(delta[key]){void el.offsetWidth;el.classList.add('gain');}
  }
  q('.reveal-traits').innerHTML=`<span class="quiet">은신 <b>${values.quiet||0}</b></span><span class="rattle">첫 소음 <b>+${values.rattle||0}</b></span>`;
 }
 function summary(){
  if(!active||complete)return;
  clear();complete=true;noiseHeld=false;index=plan.steps.length-1;visibleSlots=plan.steps.length;
  dialog.dataset.phase='complete';dialog.dataset.family='gold';
  q('#revealTitle').textContent='이번 턴의 힘';q('.reveal-kicker').textContent=`TURN ${String(run.turn).padStart(2,'0')} · POOL REVEALED`;
  q('.reveal-orb-core').innerHTML=glyph('heartgem',100);
  q('.reveal-name').textContent=`${plan.steps.length}개의 능력이 깨어났다`;
  q('.reveal-effect').textContent='이제, 당신의 발걸음이 금고를 바꿉니다.';
  q('.reveal-count').textContent='추출 완료 · 자동 합산';
  q('[data-reveal="skip"]').textContent='던전으로 →';
  totals(plan.totals);strip();paintIcons(root);cue('resolve');
  q('.reveal-announcement').textContent=`추출 완료. 공격력 ${plan.totals.sword}, 이동력 ${plan.totals.move}, 기술 ${plan.totals.skill}, 방어 ${plan.totals.block}.`;
  later(close,1600);
 }
 function anticipate(){
  const step=plan.steps[index+1];if(!step)return summary();
  dialog.dataset.phase=step.last?'last':'charging';dialog.dataset.family='gold';
  q('#revealTitle').textContent=step.last?'마지막 하나.':'어둠 속에서, 하나씩';
  q('.reveal-kicker').textContent=step.last?'ONE LAST BREATH':'THE POOL AWAKENS';
  q('.reveal-orb-core').innerHTML='<span class="sealed-mark">✧</span>';
  q('.reveal-name').textContent=step.last?'숨을 죽이세요':'봉인이 흔들린다';
  q('.reveal-effect').textContent=step.last?'이번 턴을 바꿀 마지막 힘':'아직, 무엇이 나올지 알 수 없습니다.';
  q('.reveal-count').textContent=`${index+1} / ${visibleSlots} 공개 · 자동 합산`;
  q('#revealStakes').textContent=revealStakes(run,step.before);
  strip();cue('charge',step);
  if(step.last){later(()=>cue('heartbeat',step),330);later(()=>cue('hush',step),680);}
  later(reveal,step.last?1500:index<0?650:index>=4?320:430);
 }
 function reveal(){
  const step=plan.steps[++index],card=CARDS[step.id];
  const noise=noiseDrawState(step);
  visibleSlots=step.slots;
  dialog.dataset.phase=noise.added?'noise':'revealed';dialog.dataset.family=card.family;
  q('.reveal-orb-core').innerHTML=noise.added?'<img class="draw-noise-seal" src="./assets/noise-seal-v6.png" alt="금이 간 소음의 봉인">':glyph(card.icon,100);
  q('.reveal-name').textContent=card.name;
  q('.reveal-effect').textContent=card.text;
  q('.reveal-count').textContent=step.added?`연쇄 추출 · 봉인 ${step.added}개 추가`:`${String(index+1).padStart(2,'0')} / ${String(visibleSlots).padStart(2,'0')} · ${card.kind}`;
  totals(step.totals,step.delta);strip();paintIcons(q('.reveal-orb-core'));
  q('#revealStakes').textContent=revealStakes(run,step.totals);
  if(noise.added){q('#revealTitle').textContent='소음을 뽑았다.';q('#revealStakes').textContent=`다음 행동 소음 +${noise.stored}${noise.quiet?` · 은신 ${noise.quiet}로 완화`:''}`;q('.reveal-effect').textContent='지금은 예고. 다음 발소리가 금고를 깨운다.';}
  cue(noise.added?'noise-reveal':step.last?'last-reveal':step.added?'chain':'reveal',step);
  q('.reveal-announcement').textContent=`${card.name}. ${card.text}${step.added?`. ${step.added}개 추가 추출`:''}`;
  if(noise.added&&holdNoise){noiseHeld=true;q('[data-reveal="skip"]').textContent='다음 봉인 →';}
  else later(step.last?summary:anticipate,noise.added?3000:step.last?720:index>=4?400:510);
 }
 function close(){
  if(!active)return;clear();active=false;cue('stop');dialog.close();document.body.classList.remove('drawing-pool');
  previousFocus?.isConnected&&previousFocus.focus({preventScroll:true});onClose();
 }
 function start(state,{fast=false,holdNoise:hold=false}={}){
  if(active)close();run=state;plan=buildRevealPlan(state);index=-1;visibleSlots=plan.initialSlots;complete=false;active=true;holdNoise=hold;noiseHeld=false;
  previousFocus=document.activeElement;
  const stakes=revealStakes(state,plan.base);
  root.innerHTML=`<div class="reveal-grain" aria-hidden="true"></div><div class="reveal-top"><div><span class="reveal-kicker">THE MOMENT BEFORE</span><h2 id="revealTitle">금고가 숨을 죽인다</h2></div><button data-reveal="sound" type="button"></button></div><p id="revealStakes">${stakes}</p><div class="reveal-slots" aria-label="추출 진행"></div><div class="reveal-stage"><div class="reveal-orb" aria-hidden="true"><div class="orb-ring outer"></div><div class="orb-ring inner"></div><div class="orb-rays"></div><div class="reveal-orb-core"><span class="sealed-mark">✧</span></div>${Array.from({length:12},(_,i)=>`<i class="orb-mote" style="--n:${i}"></i>`).join('')}</div><div class="reveal-identity"><span class="reveal-count">봉인된 능력 ${visibleSlots}개</span><h3 class="reveal-name">능력을 불러오는 중</h3><p class="reveal-effect">작은 힘 하나가, 탈출을 결정합니다.</p></div></div><div class="reveal-bottom"><div class="reveal-totals">${VALUES.map(([key,name])=>`<div class="reveal-stat ${key}" data-total="${key}"><span>${name}</span><strong>0</strong><em></em></div>`).join('')}</div><div class="reveal-traits"></div><button class="reveal-skip" data-reveal="skip" type="button">결과 바로 보기 →</button></div><p class="reveal-announcement sr-only" aria-live="polite" aria-atomic="true"></p>`;
  dialog.dataset.phase='gather';dialog.dataset.family='gold';soundButton();totals(plan.base);strip();
  document.body.classList.add('drawing-pool');dialog.showModal();q('[data-reveal="skip"]').focus({preventScroll:true});cue('gather');
  if(fast||matchMedia('(prefers-reduced-motion: reduce)').matches||!plan.steps.length)summary();else later(anticipate,520);
 }
 function advance(){if(noiseHeld){noiseHeld=false;q('[data-reveal="skip"]').textContent='결과 바로 보기 →';return plan.steps[index].last?summary():anticipate();}complete?close():summary();}
 root.addEventListener('click',ev=>{const action=ev.target.closest('[data-reveal]')?.dataset.reveal;if(action==='skip')advance();if(action==='sound'){toggleSound();soundButton();}});
 dialog.addEventListener('cancel',ev=>{ev.preventDefault();advance();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!complete)summary();});
 return {start,close,get active(){return active;}};
}
