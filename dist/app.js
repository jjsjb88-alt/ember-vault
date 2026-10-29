import {CARDS,ROLES,MODES,TERRAINS,ALERTS,newRun,apply,neighbours,moveCost,moveStatus,moveNoise,previewNoise,validSave,migrateSave} from './engine.js';
import {paintIcons} from './art.js';
import {makeRenderer} from './scene-v5.js';
import {makePoolReveal} from './pool-reveal.js';
import {pageOf,pager} from './pages.js';
import {exitAnchor} from './scene-layout.js';
import {roomInteraction,turnImpact,tensionNeeded,soundNotice} from './encounter.js';
import {makeNoiseMoment} from './noise-moment.js';
import {TUTORIAL_STEPS,createTutorialRun,tutorialAllows,tutorialAdvance} from './tutorial.js';
const $=s=>document.querySelector(s),SAVE_KEY='ember-vault-save-v2',BEST_KEY='ember-vault-best-v1';
let state,storageOK=true,best=0,sound=false,selectedRole='rogue',dialogMode='',lastFocus=null,toastTimer,audio,migrated=false,loadedRun=false,fastDraw=false;
try{let saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(!validSave(saved)){const prior=JSON.parse(localStorage.getItem('ember-vault-save-v1'));if(prior){saved=migrateSave(prior);migrated=!!saved;}}loadedRun=validSave(saved);state=loadedRun?saved:newRun();best=Number(localStorage.getItem(BEST_KEY))||0;sound=localStorage.getItem('ember-vault-sound')==='on';fastDraw=localStorage.getItem('ember-vault-fast-draw')==='on';}catch{state=newRun();storageOK=false;}
let handPage=0,enemyPage=0,lureMode=false,travelUntil=0,actionBusy=false,tutorial=null,tutorialSeen=false,mapOpen=false,modeOpen=false;
try{tutorialSeen=!!localStorage.getItem('ember-vault-tutorial-v1');}catch{}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const portrait=(role,cls='')=>`<span class="portrait ${role} ${cls}" role="img" aria-label="${ROLES[role].name} 초상화"></span>`;
const ico=(name,n=32)=>`<canvas data-icon="${name}" width="${n}" height="${n}" aria-hidden="true"></canvas>`;
const renderer=makeRenderer($('#dungeon'),()=>state,$('#minimap'));
const poolReveal=makePoolReveal($('#poolReveal'),{cue:drawCue,getSound:()=>sound,toggleSound,onClose:()=>{$('.pool-panel').classList.remove('revealing');void $('.pool-panel').offsetWidth;$('.pool-panel').classList.add('revealing');renderTutorial();}});
const noiseMoment=makeNoiseMoment($('#noiseMoment'),{cue:noiseCue,getSound:()=>sound,toggleSound});
const drawNodes=new Set();
function save(){if(tutorial)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));if(state.phase==='won'&&state.score>best){best=state.score;localStorage.setItem(BEST_KEY,String(best));}storageOK=true;}catch{storageOK=false;}}
function beep(type='card'){
 if(!sound)return;
 try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
  if(['move','attack','lure','bad'].includes(type)){
   const len=audio.sampleRate*.22,b=audio.createBuffer(1,len,audio.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
   const src=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();src.buffer=b;f.type='lowpass';f.frequency.value=type==='attack'?1800:state.rooms[state.pos].terrain==='water'?1200:350;g.gain.value=type==='move'?.035:.065;src.connect(f);f.connect(g);g.connect(audio.destination);src.start();
  }
  const notes={card:[440],move:[95],attack:[73],buy:[523,659,784],win:[392,523,659,784],bad:[82],turn:[261,330,392],relic:[392,523,784,1047],lure:[780,510]}[type]||[440];
  notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=f;const at=audio.currentTime+i*.09;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.035,at+.01);g.gain.exponentialRampToValueAtTime(.0001,at+.16);o.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+.18);});
 }catch{}
}
function drawCue(type,step){
 if(['stop','hush','resolve'].includes(type)){
  for(const node of drawNodes){try{node.stop();}catch{}}drawNodes.clear();
 }
 if(!sound||document.hidden||['stop','hush'].includes(type))return;
 try{
  audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
  const pulse=(freq,delay,length,gain=.045,wave='sine',end=freq)=>{
   const o=audio.createOscillator(),g=audio.createGain(),at=audio.currentTime+delay;
   o.type=wave;o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+length);
   g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(gain,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+length);
   o.connect(g);g.connect(audio.destination);drawNodes.add(o);o.onended=()=>{drawNodes.delete(o);o.disconnect();g.disconnect();};o.start(at);o.stop(at+length+.025);
  };
  if(type==='noise-reveal'){pulse(59,0,.75,.07,'sine',28);pulse(147,.04,.3,.035,'triangle',61);pulse(370,.06,.22,.012,'sawtooth',120);pulse(48,.65,.3,.045,'sine',30);}
  else if(type==='gather'){pulse(92,0,.55,.045,'sine',42);pulse(184,.08,.4,.012,'triangle',98);}
  else if(type==='charge'||type==='heartbeat'){pulse(74,0,.17,.065,'sine',40);pulse(57,.14,.16,.04,'sine',32);if(type==='charge'&&!step?.last)pulse(170,.06,.23,.008,'triangle',290);}
  else if(type==='resolve'){[196,293.66,392].forEach((f,i)=>pulse(f,i*.06,.4,.018,'triangle'));}
  else{
   const card=CARDS[step.id],freq={attack:196,move:392,skill:523.25,guard:293.66}[card.family]||392;
   pulse(step.last?88:100,0,.25,.055,'sine',38);pulse(freq,.02,.34,.03,'triangle');pulse(freq*1.5,.055,.4,.016,'sine');
   if(type==='chain')pulse(783.99,.15,.3,.018,'triangle');
   if(card.e.noise>0)pulse(113,.14,.21,.014,'sawtooth',72);
  }
 }catch{}
}
function toggleSound(){sound=!sound;try{localStorage.setItem('ember-vault-sound',sound?'on':'off');}catch{}if(!sound)drawCue('stop');render();if(sound)beep();}
function noiseCue(type){
 if(type==='stop')return drawCue('stop');
 if(type==='heartbeat'||type==='rage')return drawCue('heartbeat');
 if(type==='noise')return beep('lure');
 if(type==='heard'||type==='impact')return beep('bad');
}
function renderInteraction(ra){
 const target=$('#sceneTarget'),r=state.rooms[state.pos];
 target.hidden=!ra.act||state.phase!=='playing'||!!state.pending||(r.type==='entry'&&!state.relic);
 target.className=`scene-target ${ra.kind||''} ${ra.enabled?'':'unavailable'}`;
 target.setAttribute('aria-label',`${ra.subject||r.name} 직접 ${ra.short}. ${ra.enabled?ra.detail:ra.reason}`);
 target.setAttribute('aria-disabled',String(!ra.enabled));
 target.innerHTML=`<span class="target-corners" aria-hidden="true"></span><span class="target-label"><strong>${esc(ra.short||'')}</strong><small>${esc(ra.detail||'')}</small></span>`;
 $('.hud-location')?.setAttribute('title',state.relic?`유물 회수 완료 · ${state.countdown}턴 안에 입구로`:'유물 하나를 회수하고 입구로 돌아오세요');
}
function markTutorial(value){tutorialSeen=true;try{localStorage.setItem('ember-vault-tutorial-v1',value);}catch{}}
function showTutorialIntro(){
 if(tutorial)return;
 openModal(modalShell('소리가 금고를 깨웁니다','LEARN BY PLAYING',`<div class="tutorial-intro"><img src="./assets/noise-seal-v6.png" alt="갈라진 소음의 봉인"><div><p>방을 누르고, 상자를 열고, 소리를 따라오는 적을 만나세요.</p><p><b>8단계 연습</b>에서 용의 분노와 전투까지 직접 경험합니다. 현재 탐험은 유지됩니다.</p><label><input id="tutorialAudio" type="checkbox" checked> 효과음과 함께 연습</label></div></div><div class="modal-actions"><button class="subtle-button" data-act="tutorialSkip">바로 탐험하기</button><button class="large-button" data-act="tutorialStart">직접 배워보기 →</button></div>`),'tutorialIntro');
}
function startTutorial(){
 const withAudio=$('#tutorialAudio')?.checked;
 if(withAudio&&!sound)toggleSound();
 tutorial={saved:state,index:0};state=createTutorialRun();handPage=0;enemyPage=0;lureMode=false;travelUntil=0;renderer.reset();
 $('#modal').close();dialogMode='';document.body.classList.add('tutorial-mode');selectPanel('routes');render();poolReveal.start(state,{fast:false,holdNoise:true});
}
function exitTutorial(){
 if(!tutorial)return;const completed=tutorial.index>=TUTORIAL_STEPS.length;state=tutorial.saved;tutorial=null;
 document.body.classList.remove('tutorial-mode');markTutorial(completed?'completed':'seen');renderer.reset();lureMode=false;handPage=0;enemyPage=0;travelUntil=0;
 $('#modal').close();dialogMode='';selectPanel('routes');render();save();toast(completed?'연습 완료 · 유물을 찾아 입구로 돌아오세요.':'원래 탐험으로 돌아왔습니다.');
}
function renderTutorial(){
 const coach=$('#tutorialCoach');document.querySelectorAll('.coach-target').forEach(e=>e.classList.remove('coach-target'));
 coach.hidden=!tutorial;if(!tutorial)return;
 const step=TUTORIAL_STEPS[tutorial.index];
 if(!step){coach.innerHTML='<span>연습 완료</span><strong>이제 유물을 찾아, 입구로 돌아오세요.</strong><button data-act="tutorialExit">탐험으로 →</button>';return;}
 coach.innerHTML=`<span>연습 ${tutorial.index+1} / ${TUTORIAL_STEPS.length}</span><strong>${step.title}</strong><p>${step.text}</p><button class="tutorial-leave" data-act="tutorialExit" aria-label="연습 끝내고 원래 탐험으로">×</button>`;
 let target=step.target;
 if(tutorial.index===3)target=mapOpen?'#mapToggle':!lureMode?'#lureToggle':'.scene-exit[data-id="5"]';
 if(tutorial.index===4)target=state.mode!=='rush'?(modeOpen?'[data-act="mode"][data-id="rush"]':'#stanceToggle'):'.scene-exit[data-id="2"]';
 if(target)document.querySelectorAll(target).forEach(e=>e.classList.add('coach-target'));
}
function advanceTutorial(action){if(!tutorial)return;tutorial.index=tutorialAdvance(tutorial.index,action);renderTutorial();}
function selectPanel(id){
 mapOpen=id==='sound';setStanceMenu(false);
 renderer.setZoom(mapOpen);$('.play-surface').classList.toggle('map-open',mapOpen);$('.canvas-wrap').classList.toggle('mapview',mapOpen);
 $('#soundPanel').hidden=!mapOpen;$('#mapInstructions').hidden=!mapOpen;
 $('#mapToggle').setAttribute('aria-expanded',String(mapOpen));$('#mapToggle').setAttribute('aria-label',mapOpen?'소리 지도 닫기':'소리 지도 펼치기');
 $('#mapToggleLabel').textContent=mapOpen?'지도 닫기':'소리 지도';$('#mapToggleIcon').textContent=mapOpen?'×':'⛶';
 renderTutorial();
}
function setStanceMenu(open){
 modeOpen=open;$('#stanceMenu').hidden=!open;$('#stanceToggle').setAttribute('aria-expanded',String(open));renderTutorial();
 if(open)$('#stanceMenu button[aria-pressed="true"]')?.focus({preventScroll:true});
}
function showMarket(){
 openModal(modalShell('능력을 영입하세요','BUILD YOUR POOL',`<div class="market-summary"><span>기술 <b id="marketSkill"></b> · 금화 <b id="marketGold"></b></span><button class="refresh-button" data-act="refresh" aria-label="금화 2로 교역소 교체">↻ 2 G</button></div><p class="modal-sub">기술로 영입합니다. 새 능력은 다음 순환부터 뽑힙니다.</p><div id="market" class="market-offers"></div>`),'market');renderMarket();
}
function renderMarket(){
 if(dialogMode!=='market'||!$('#market'))return;
 const s=state,active=s.phase==='playing'&&!s.pending;
 $('#marketSkill').textContent=s.resource.skill;$('#marketGold').textContent=s.gold;
 $('#market').innerHTML=s.market.map((id,i)=>{const a=CARDS[id],can=active&&s.resource.skill>=a.cost;return `<button class="market-card ${can?'affordable':''}" data-act="buy" data-index="${i}" aria-label="${a.name}, ${a.text}, 기술 ${a.cost}점으로 영입" ${!can?'disabled':''}>${ico(a.icon,46)}<span class="offer"><strong>${a.name}</strong><small>${a.text}</small></span><span class="price">기술 ${a.cost}</span></button>`;}).join('');
 $('[data-act="refresh"]').disabled=!active||s.gold<2||s.refreshTurn===s.turn;paintIcons($('#modal'));
}
function showMenu(){openModal(modalShell('탐험 메뉴','EMBER VAULT',`<p class="modal-sub">${state.relic?state.relic.name+' 회수 · 귀환 '+state.countdown+'턴':'유물을 찾아 입구로 돌아오세요'} · 최고 ${best}점${storageOK?'':' · 저장 불가'}</p><div class="game-menu"><button data-act="deck">나의 능력 풀<small>현재 풀과 남은 능력 보기</small></button><button data-act="tutorialIntro">직접 배우는 튜토리얼<small>소음 · 용의 분노 · 전투 연습</small></button><button data-act="help">플레이 방법<small>추출 · 이동 · 소리 · 탈출</small></button><button data-act="sound" class="${sound?'selected':''}">효과음 ${sound?'켜짐':'꺼짐'}<small>추출의 심장 박동과 봉인 파열음</small></button><button data-act="speed" class="${fastDraw?'selected':''}">${fastDraw?'빠른 추출':'긴장감 있는 추출'}<small>${fastDraw?'합산 결과만 빠르게 표시':'하나씩 공개 · 마지막 능력까지 기다림'}</small></button><button data-act="log">탐험 일지<small>발소리와 전투 기록</small></button><button data-act="new">새 탐험<small>캐릭터 선택 · 현재 탐험 초기화</small></button><button data-act="fullscreen">전체 화면<small>휴대폰 가로 화면으로 플레이</small></button></div>`),'menu');}
async function fullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('이 브라우저에서는 가로 화면으로 바로 플레이하세요.');}
 catch{toast('전체 화면을 열지 못했습니다. 가로 화면으로 플레이할 수 있습니다.');}
}
function toast(text,bad=false){const el=$('#toast');el.textContent=text;el.className='show'+(bad?' bad':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='',2800);}
function cardMarkup(id,index,action='reward'){
 const c=CARDS[id];return `<button class="ability-choice ${c.family}" data-act="${action}" data-index="${index}" data-id="${id}" aria-label="${c.name}, ${c.text}, 보상으로 선택"><span class="ability-gem">${ico(c.icon,54)}</span><small>${c.kind}</small><strong>${c.name}</strong><p>${c.text}</p><span class="choose-label">풀에 추가 +</span></button>`;
}
function renderExits(){
 const s=state,enemy=s.rooms[s.pos].enemy?.hp>0;
 const routes=neighbours(s).map(id=>({id,...moveStatus(s,id)}));
 const lureCan=s.phase==='playing'&&!s.pending&&s.resource.skill>=1&&s.lureTurn!==s.turn;
 $('#sceneExits').innerHTML=routes.map(route=>{
  const p=exitAnchor(s.pos,route.id),name=s.rooms[route.id].name;
  const allowed=lureMode?lureCan:route.allowed;
  const verb=lureMode?'유인':route.retreat?'후퇴':'이동';
  const note=lureMode?'기술 1 · 소리 5':!route.allowed?(enemy&&!route.retreat?'전투 중 · 이동 불가':`이동력 ${route.cost} 필요`):`이동 ${route.cost} · ${previewNoise(s,moveNoise(s,route.id))?'소리 '+previewNoise(s,moveNoise(s,route.id)):'무음'}`;
  return `<button class="scene-exit ${allowed?'available':'blocked'} ${route.retreat?'retreat':''} ${lureMode?'lure':''}" data-act="travel" data-id="${route.id}" aria-label="${name} ${verb}, ${note}" aria-disabled="${!allowed}" style="--exit-x:${p.x*100}%;--exit-y:${p.y*100}%"><span class="exit-arrow" aria-hidden="true">${route.retreat?'↶':p.arrow}</span><span class="exit-info"><strong>${esc(name)}</strong><small>${note}</small></span></button>`;
 }).join('');
 $('#sceneExits').hidden=s.phase!=='playing'||!!s.pending;
 const hint=lureMode?'돌멩이를 던질 방을 누르세요':!routes.some(r=>r.allowed)?'이동력이 부족해요 · 풀을 뽑으세요':!tutorial&&s.pos===0&&s.turn===1?'금빛 방 이름을 눌러 탐험을 시작하세요':'';
 $('#travelHint').hidden=!hint||s.phase!=='playing'||!!s.pending;$('#travelHint').textContent=hint;
}
function travelTo(id){
 if(poolReveal.active||noiseMoment.active||actionBusy||$('#modal').open||id===state.pos)return false;
 const luring=lureMode,ok=act({type:luring?'lure':'move',id});
 if(ok&&!luring)selectPanel('routes');
 return ok;
}
function render(){
 const s=state,r=s.rooms[s.pos],active=s.phase==='playing',enemy=r.enemy?.hp>0,ra=roomInteraction(s),danger=s.noise>=8;
 $('#enemyOverlay').innerHTML=enemy?`<span class="enemy-state ${r.enemy.mode}">${ALERTS[r.enemy.mode]}${r.enemy.anchored?' · 자리 수호':''}</span><strong>${r.enemy.name}</strong><div class="enemy-life"><i style="width:${r.enemy.hp/r.enemy.maxHp*100}%"></i></div><small>HP ${r.enemy.hp} / ${r.enemy.maxHp} · 반격 ${r.enemy.damage}</small>`:'';
 $('#resources').innerHTML=[['sword','dagger','공격력'],['move','boot','이동력'],['skill','book','기술'],['block','shield','방어']].map(([key,icon,name])=>`<div class="resource ${key}" aria-label="${name} ${s.resource[key]}"><div class="res-top">${ico(icon,28)}<span>${name}</span></div><div class="res-number"><strong>${s.resource[key]}</strong></div></div>`).join('');
 $('#poolStatus').innerHTML=`${s.resource.quiet?`<span>은신 ${s.resource.quiet}</span>`:''}${s.resource.rattle?`<span class="rattle">소음 +${s.resource.rattle}</span>`:''}`;
 $('#handCount').textContent=s.played.length;
 const hp=pageOf(s.played,handPage,5);handPage=hp.page;
 $('#hand').innerHTML=hp.items.map((id,i)=>{const a=CARDS[id];return `<span class="draw-token ${a.family}" style="--delay:${i*65}ms"><span class="token-icon">${ico(a.icon,30)}</span><strong>${a.name}</strong></span>`;}).join('');
 $('#poolDetails').setAttribute('aria-label',`이번 추출 ${s.played.length}개 자세히 보기: ${hp.items.map(id=>CARDS[id].name).join(', ')}`);
 $('#handPager').hidden=hp.pages===1;$('#handPager').innerHTML=hp.pages>1?`<button data-act="handPage" data-page="${(hp.page+1)%hp.pages}" aria-label="추출 다음 페이지, 현재 ${hp.page+1} / ${hp.pages}">${hp.page+1}/${hp.pages} →</button>`:'';
 const snd=s.lastSound,recent=snd&&snd.turn===s.turn,alerted=s.rooms.filter(x=>x.seen&&x.enemy?.hp>0&&x.enemy.mode!=='idle');
 const ep=pageOf(alerted,enemyPage,1);enemyPage=ep.page;
 $('#dangerPanel').innerHTML=`<div class="last-sound"><span>${recent?`${esc(snd.label)} · 소리 <b>${snd.strength}</b>`:'아직 소리가 나지 않았습니다'}</span><small>${recent?`발생 ${snd.raw}${snd.absorbed?` − 은신 ${snd.absorbed}`:''} · ${snd.heard.length}명이 들음`:'통로마다 −2 · 이끼에서 추가 −1'}</small></div><div class="enemy-report">${alerted.length?`<div class="listening-enemies">${ep.items.map(x=>`<div><i class="alert-eye">${x.enemy.mode==='hunt'?'!':'?'}</i><span>${x.enemy.name}<small>${x.name} · ${ALERTS[x.enemy.mode]}</small></span><b>${x.enemy.anchored?'수호':x.id===s.pos?'교전':x.enemy.mode==='listen'?'대기':'조사'}</b></div>`).join('')}</div>${ep.pages>1?`<button class="enemy-next" data-act="enemyPage" data-page="${(ep.page+1)%ep.pages}" aria-label="다음 반응한 적, 현재 ${ep.page+1} / ${ep.pages}">${ep.page+1}/${ep.pages} →</button>`:''}`:`<div class="silence-note">${recent&&snd.heard.length?'미탐험 구역에서 기척이 느껴짐':'경계 중인 적이 보이지 않음'}</div>`}</div>`;
 const hideCan=active&&!s.pending&&!enemy&&s.hideTurn!==s.turn&&s.resource.move>=1,lureCan=active&&!s.pending&&s.resource.skill>=1&&s.lureTurn!==s.turn;
 $('#stanceLabel').textContent=s.mode==='sneak'?'은밀':MODES[s.mode].name;$('#stanceToggle').disabled=!active||!!s.pending;
 $('#stanceMenu').innerHTML=`<span class="stance-heading">이동 방식 <small>현재 바닥 · ${TERRAINS[r.terrain].name}</small></span>${['walk','sneak','rush'].map(id=>`<button data-act="mode" data-id="${id}" aria-pressed="${s.mode===id}" class="${s.mode===id?'selected':''}"><strong>${id==='sneak'?'은밀':MODES[id].name}</strong><small>${id==='sneak'?'이동 +1 · 소리 감소':id==='rush'?'깊은 층 이동 −1 · 소리 5':'기본 이동 · 소리 2'}</small><span aria-hidden="true">${s.mode===id?'✓':''}</span></button>`).join('')}`;
 $('#lureToggle').disabled=!lureCan&&!lureMode;$('#lureToggle').setAttribute('aria-pressed',String(lureMode));$('#lureToggle strong').textContent=lureMode?'유인 취소':'유인';$('#hideAction').disabled=!hideCan;$('#marketToggle').disabled=!active||!!s.pending;
 $('#landscapeStatus').innerHTML=`<span class="hud-hero">${portrait(s.role)}</span><div class="hud-health" role="meter" aria-label="체력" aria-valuemin="0" aria-valuemax="${s.maxHp}" aria-valuenow="${s.hp}"><i style="width:${s.hp/s.maxHp*100}%"></i><b>${s.hp} / ${s.maxHp}</b></div><span class="hud-gold">${ico('coin',20)} ${s.gold}</span><div class="hud-location"><span>B${r.row+1} · ${r.name}</span><small>T${String(s.turn).padStart(2,'0')}${s.relic?' · 귀환 '+s.countdown+'턴':''}</small></div><div class="hud-noise ${danger?'hot':''}" role="meter" aria-label="용의 경계" aria-valuemin="0" aria-valuemax="12" aria-valuenow="${s.noise}"><span class="hud-noise-pips" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i class="${i<s.noise?'lit':''}"></i>`).join('')}</span><span>경계 <strong>${s.noise}</strong><small> / 8</small></span></div>`;
 const risks=[];if(enemy)risks.push(`반격 ${r.enemy.damage}`);if(danger)risks.push(`용의 공격 ${3+Math.floor(s.turn/10)}`);else if(s.relic&&s.turn%3===0)risks.push('용의 공격 2');
 $('#turnRisk').textContent=active?(risks.length?risks.join(' · '):'남은 자원은 사라집니다'):'탐험 완료';$('#turnRisk').classList.toggle('hot',risks.length>0);
 $('#endTurn').disabled=!!s.pending;$('#endTurn').dataset.act=active?'end':'result';$('#endTurn>span').textContent=active?'풀 뽑기':'탐험 결과';$('#endTurn>small').textContent=active?'턴 종료':'기록 보기';
 renderExits();renderInteraction(ra);renderTutorial();renderMarket();paintIcons();
}

function openModal(html,mode){
 setStanceMenu(false);const d=$('#modal');if(!d.open)lastFocus=document.activeElement;
 dialogMode=mode;d.dataset.mode=mode;$('#modalContent').innerHTML=html;paintIcons(d);if(!d.open)d.showModal();
 const first=d.querySelector('button:not([disabled])');first?.focus({preventScroll:true});
}
const modalShell=(title,eyebrow,body,close=true)=>`<div class="modal-inner"><div class="modal-top"><div><span class="eyebrow">${eyebrow}</span><h2 id="modalTitle">${title}</h2></div>${close?'<button class="close-button" data-act="close" aria-label="닫기">×</button>':''}</div>${body}</div>`;
function closeModal(){if(state.pending){toast('보상을 고르거나 건너뛰기를 눌러 주세요.');return;}$('#modal').close();dialogMode='';lastFocus?.focus({preventScroll:true});}
function pendingModal(page=0){
 if(state.pending?.type==='reward')openModal(modalShell('승리의 전리품','CHOOSE YOUR REWARD',`<p class="modal-sub">새 능력 하나를 추출 풀에 더하세요. 다음 순환부터 자동으로 합산됩니다.</p><div class="modal-cards">${state.pending.options.map((id,i)=>cardMarkup(id,i,'reward')).join('')}</div><div class="modal-actions"><span class="modal-sub" style="margin:0">가벼운 풀을 유지해도 좋습니다.</span><button class="subtle-button" data-act="skipReward">받지 않고 계속 →</button></div>`,false),'reward');
 else if(state.pending?.type==='purge'){
  const v=pageOf(state.pending.options,page);
  openModal(modalShell('내려놓을 기억','FORGET ONE ABILITY',`<p class="modal-sub">선택한 능력 하나를 영구 제거합니다. 제단은 한 번만 쓸 수 있습니다.</p><div class="deck-list">${v.items.map(id=>`<button class="deck-item" data-act="purge" data-id="${id}">${ico(CARDS[id].icon)}<div><strong>${CARDS[id].name}</strong><small>${CARDS[id].text}</small></div><b>제거</b></button>`).join('')}</div><div class="modal-actions">${pager(v,'purgePage')}<button class="subtle-button" data-act="cancelPurge">지금은 지나가기</button></div>`,false),'purge');
 }
}
function showResult(){
 const s=state,won=s.phase==='won';
 openModal(modalShell(won?'금고에서 살아 돌아왔습니다.':'불씨는 아직 꺼지지 않았습니다.',won?'EXPEDITION COMPLETE':'EXPEDITION ENDED',`<div class="result-hero">${ico(won?s.relic.icon:'camp')}<p class="modal-sub" style="margin:0">${esc(s.reason||'이번 탐험의 결과입니다.')}</p>${won?`<div class="score">${s.score}</div><span class="score-label">EXPEDITION SCORE${s.score>=best?' · BEST':''}</span>`:''}</div><div class="result-stats"><div><strong>${s.turn}</strong><small>진행 턴</small></div><div><strong>${s.kills}</strong><small>격파한 적</small></div><div><strong>${s.rooms.filter(r=>r.visited).length}</strong><small>탐험한 방</small></div><div><strong>${s.gold}</strong><small>남은 금화</small></div></div>${won?`<p class="result-breakdown">유물 ${s.relic.value} + 금화 ${s.gold} + 탐험 ${s.rooms.filter(r=>r.visited).length*2} + 남은 체력 ${s.hp} + 탈출 20</p>`:'<p class="result-breakdown">휴식과 방어로 체력을 지키고, 필요하다면 낮은 가치의 유물부터 노려 보세요.</p>'}<div class="modal-actions"><button class="subtle-button" data-act="close">던전 돌아보기</button><button class="large-button" data-act="new">새로운 탐험 →</button></div>`),'result');
}
function showNew(){
 selectedRole=state.role;
 renderNew();
}
function renderNew(){
 openModal(modalShell('누가 금고로 내려갈까요?','A NEW EXPEDITION',`<p class="modal-sub">직업마다 시작 능력과 특성이 다릅니다. 새 탐험을 시작하면 현재 진행은 초기화되고 최고 기록은 남습니다.</p><div class="role-list" role="radiogroup" aria-label="직업 선택">${Object.entries(ROLES).map(([key,r])=>`<button class="role-option ${key===selectedRole?'selected':''}" data-act="role" data-id="${key}" role="radio" aria-checked="${key===selectedRole}">${portrait(key,'select-portrait')}<strong>${r.name}</strong><span>${r.desc}</span><small>${r.trait}</small></button>`).join('')}</div><div class="modal-actions"><button class="subtle-button" data-act="close">현재 탐험으로 돌아가기</button><button class="large-button" data-act="start">금고로 내려가기 →</button></div>`),'new');
}
const guide=[
 ['01 / DRAW','뽑고, 자동으로 합산','풀 뽑기는 턴을 마치고 능력 5개를 하나씩 공개합니다. 추가 추출도 자동입니다. 큰 공격력·이동력 숫자가 지금 쓸 수 있는 힘입니다.','남은 자원은 다음 턴에 사라집니다. 기술은 영입·유인, 방어는 피해 흡수에 쓰입니다. 추출 연출은 건너뛰거나 메뉴에서 빠르게 바꿀 수 있습니다.'],
 ['02 / FOOTSTEPS','발밑을 살피세요','던전의 금빛 방 이름을 누르면 이동합니다. 미니맵은 소리 지도를 펼칩니다. 걷기: 이동 1 · 기본 소리 2. 살금살금: 이동 +1 · 기본 소리 0. 질주: 깊은 층 이동 −1 · 소리 5.','물웅덩이 소리 +1, 돌 파편 +2, 이끼 −1. 이동 버튼에는 최종 소리가 표시됩니다. 적이 있는 방에서는 전투하거나 들어온 방으로 후퇴하세요.'],
 ['03 / LISTEN','소리는 통로를 따라 퍼집니다','미니맵을 누르면 소리 지도가 열립니다. 소리는 통로를 건널 때 2, 이끼 방에서는 1이 더 줄어듭니다. 주황색은 도달 범위입니다.','들은 적은 청취 → 조사 → 추적으로 경계합니다. 턴 끝에 조사·추적 중인 적이 마지막 소리의 방으로 한 칸 이동합니다. 유물 수호자는 자리를 지킵니다.'],
 ['04 / MISDIRECT','소리로 길을 만드세요','돌멩이 유인을 켜고 연결된 방을 누르세요. 기술 1로 그 방에 소리 5를 내어 적의 목적지를 바꿉니다.','숨죽이기: 이동 1 · 경계 −2 · 은신 +2. 유인과 숨죽이기는 각각 턴당 한 번입니다. 은신과 첫 소음은 다음 개인 행동에 적용되며 돌멩이에는 적용되지 않습니다.'],
 ['05 / DANGER','금고가 깨어나기 전에','소리 크기의 절반을 올림한 값이 경계에 누적됩니다. 경계 8 이상이면 턴 끝에 용이 공격합니다. 새 턴에 경계 −2, 도적은 추가 −1.','같은 방의 적은 턴 끝에 반격합니다. 추적으로 도착한 적은 그 다음 턴부터 반격합니다. 방어로 피해를 줄이고, 캠프에서 체력을 회복하세요.'],
 ['06 / ESCAPE','유물을 들고 입구로','유물을 얻으면 14턴 안에 입구로 귀환해야 합니다. 3의 배수 턴에는 용의 주기 공격을 받습니다. 낮은 가치의 유물로도 탈출할 수 있습니다.','점수 = 유물 + 금화 + 방문 방 × 2 + 남은 체력 + 탈출 20.\n키보드: 방향키 이동 · 1/2/3 이동 방식 · A 공격 · E 상호작용 · C 숨죽이기 · Space 풀 뽑기.']
];
function showHelp(page=0){
 const v=pageOf(guide,page,1),[tag,title,first,second]=v.items[0];
 openModal(modalShell('소리를 다루는 탐험가','FIELD GUIDE · V7',`<article class="guide-page"><span>${tag}</span><h3>${title}</h3><p>${first}</p><p>${second}</p></article><div class="modal-actions">${pager(v,'helpPage')}<button class="large-button" data-act="close">탐험 계속하기 →</button></div>`),'help');
}
function showDeck(pile='all',page=0){
 const labels={all:'전체 풀',deck:'대기 중',discard:'다음 순환',played:'이번 추출'};
 if(!labels[pile])pile='all';
 const ids=pile==='all'?[...state.hand,...state.deck,...state.discard,...state.played]:state[pile];
 const counts={};ids.forEach(id=>counts[id]=(counts[id]||0)+1);
 const v=pageOf(Object.entries(counts),page);
 openModal(modalShell('나의 능력 풀','YOUR DRAW POOL',`<div class="deck-tabs">${Object.entries(labels).map(([k,x])=>`<button class="${pile===k?'selected':''}" data-act="deck" data-pile="${k}">${x}</button>`).join('')}</div><p class="modal-sub">${labels[pile]} · ${ids.length}개${pile==='deck'?' · 추출 순서는 비공개':''}</p><div class="deck-list">${v.items.map(([id,n])=>`<div class="deck-item">${ico(CARDS[id].icon)}<div><strong>${CARDS[id].name}</strong><small>${CARDS[id].text}</small></div><b>×${n}</b></div>`).join('')||'<p class="empty-list">아직 능력이 없습니다.</p>'}</div>${pager(v,'deckPage',`data-pile="${pile}"`)}`),'deck');
}
function showLog(page=0){
 const v=pageOf(state.log,page,3);
 openModal(modalShell('어둠 속에 남긴 발자국','EXPEDITION JOURNAL',`<p class="modal-sub">탐험 코드 ${state.seed.toString(36).toUpperCase()} · 최근 행동부터</p><div class="log-list">${v.items.map(x=>`<div class="log-row ${x.tone}"><small>T${String(x.turn).padStart(2,'0')}</small><span>${esc(x.message)}</span></div>`).join('')}</div>${pager(v,'logPage')}`),'log');
}
function act(action){
 if(poolReveal.active||noiseMoment.active||actionBusy||action.type==='move'&&performance.now()<travelUntil)return false;
 if(tutorial&&(!tutorialAllows(tutorial.index,action)||(tutorial.index===4&&action.type==='move'&&state.mode!=='rush'))){toast(TUTORIAL_STEPS[tutorial.index]?.text||'연습을 마치고 탐험으로 돌아가세요.');return false;}
 const beforeHP=state.hp,wasRelic=!!state.relic,enemyHP=state.rooms[state.pos].enemy?.hp||0,previousNoise=state.noise,previousSeq=state.soundSeq,previousGold=state.gold;
 const impact=action.type==='end'?turnImpact(state):null;
 const result=apply(state,action);if(!result.ok){toast(result.message,true);beep('bad');return false;}
 if(action.type==='move'){travelUntil=performance.now()+450;renderer.setHover(-1);}
 if(action.type==='end'){handPage=0;enemyPage=0;lureMode=false;}if(action.type==='lure')lureMode=false;
 save();render();
 if(action.type==='attack')renderer.burst('attack',`−${enemyHP-(state.rooms[state.pos].enemy?.hp||0)}`);
 const rewardText=state.gold>previousGold?`+${state.gold-previousGold} G`:state.hp>beforeHP?`+${state.hp-beforeHP} HP`:action.type==='interact'&&state.relic&&!wasRelic?'유물 회수':'';
 if(rewardText)renderer.burst('reward',rewardText);if(state.hp<beforeHP)renderer.burst('bad');
 const tense=tensionNeeded(state,action,previousSeq,previousNoise),actionRun=state;
 const finish=()=>{
  if(state!==actionRun)return;actionBusy=false;advanceTutorial(action);if(rewardText)renderer.burst('reward',rewardText);
  if(!['mode','end'].includes(action.type))toast(soundNotice(state,previousSeq,result.message));
  if(state.pending)pendingModal();
  else if(state.phase!=='playing'){showResult();beep(state.phase==='won'?'win':'bad');}
  else if(['reward','skipReward','purge','cancelPurge'].includes(action.type)){$('#modal').close();dialogMode='';}
  if(action.type==='end'&&state.phase==='playing'&&!state.pending)poolReveal.start(state,{fast:tutorial?false:fastDraw,holdNoise:!!tutorial,beforeHp:beforeHP});
  document.body.classList.remove('turn-impact');
 };
 if(impact?.raw){actionBusy=true;document.body.classList.add('turn-impact');noiseMoment.dragon(impact,previousNoise,finish,{hold:!!tutorial});}
 else if(tense){actionBusy=true;if(action.type==='attack')setTimeout(()=>{if(state===actionRun)noiseMoment.start(state,previousNoise,finish,{hold:!!tutorial});},580);else noiseMoment.start(state,previousNoise,finish,{hold:!!tutorial});}
 else{
  if(!['mode','end'].includes(action.type))beep(action.type==='buy'||action.type==='reward'?'buy':action.type==='move'?'move':action.type==='attack'?'attack':action.type==='lure'?'lure':!wasRelic&&state.relic?'relic':'card');
  if(action.type==='attack'&&state.pending){actionBusy=true;setTimeout(finish,600);}else finish();
 }
 return true;
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('button[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;
 if(poolReveal.active||noiseMoment.active||actionBusy)return;
 if(a==='travel')return travelTo(Number(b.dataset.id));
 if(a==='stance'){setStanceMenu(!modeOpen);return;}
 if(a==='market')return showMarket();
 if(a==='tutorialIntro')return showTutorialIntro();
 if(a==='tutorialStart')return startTutorial();
 if(a==='tutorialExit')return exitTutorial();
 if(a==='tutorialSkip'){markTutorial('seen');closeModal();if(!loadedRun)poolReveal.start(state,{fast:fastDraw});loadedRun=true;return;}
 if(a==='sceneInteract'){const target=roomInteraction(state);if(!target.enabled){toast(target.reason||target.text,true);return;}return act({type:target.act});}
 if(a==='handPage'){handPage=Number(b.dataset.page);render();return;}
 if(a==='enemyPage'){enemyPage=Number(b.dataset.page);render();return;}
 if(a==='lureMode'){setStanceMenu(false);selectPanel('routes');lureMode=!lureMode;render();return;}
 if(a==='helpPage')return showHelp(Number(b.dataset.page));
 if(a==='deckPage')return showDeck(b.dataset.pile,Number(b.dataset.page));
 if(a==='logPage')return showLog(Number(b.dataset.page));
 if(a==='purgePage')return pendingModal(Number(b.dataset.page));
 if(a==='menu')return showMenu();
 if(a==='fullscreen')return fullscreen();
 if(a==='speed'){fastDraw=!fastDraw;try{localStorage.setItem('ember-vault-fast-draw',fastDraw?'on':'off');}catch{}return showMenu();}
 if(a==='close')return closeModal();if(a==='help')return showHelp();if(a==='new')return showNew();if(a==='role'){selectedRole=b.dataset.id;return renderNew();}
 if(a==='start'){if(tutorial)exitTutorial();travelUntil=0;state=newRun({role:selectedRole});handPage=0;enemyPage=0;lureMode=false;renderer.reset();save();$('#modal').close();dialogMode='';selectPanel('routes');render();poolReveal.start(state,{fast:fastDraw});window.scrollTo({top:0,behavior:'instant'});return;}
 if(a==='deck')return showDeck(b.dataset.pile||'all');if(a==='log')return showLog();if(a==='result')return showResult();
 if(a==='zoom'){selectPanel(mapOpen?'routes':'sound');if(mapOpen)advanceTutorial({type:'panel',id:'sound'});return;}
 if(a==='sound'){toggleSound();if(dialogMode==='menu')showMenu();return;}
 if(a==='mode'){const ok=act({type:'mode',id:b.dataset.id});if(ok){setStanceMenu(false);$('#stanceToggle').focus({preventScroll:true});}return;}
 if(a==='buy')return act({type:a,index:Number(b.dataset.index)});if(['move','lure'].includes(a))return act({type:a,id:Number(b.dataset.id)});if(['reward','purge','mode'].includes(a))return act({type:a,id:b.dataset.id});if(a)act({type:a});
});
document.addEventListener('pointerover',ev=>{const b=ev.target.closest('.door[data-id],.scene-exit[data-id]');renderer.setHover(b?Number(b.dataset.id):-1);});
$('#dungeon').addEventListener('pointermove',ev=>{const id=renderer.hit(ev.clientX,ev.clientY);renderer.setHover(id);$('#dungeon').style.cursor=id>=0?'pointer':'default';});
$('#dungeon').addEventListener('pointerleave',()=>renderer.setHover(-1));
$('#dungeon').addEventListener('click',ev=>{if(poolReveal.active||noiseMoment.active||actionBusy||$('#modal').open||state.phase!=='playing')return;const id=renderer.hit(ev.clientX,ev.clientY);if(id>=0&&id!==state.pos)travelTo(id);});
document.addEventListener('keydown',ev=>{
 if(poolReveal.active||noiseMoment.active||actionBusy||$('#modal').open||ev.ctrlKey||ev.metaKey||ev.altKey||['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName)||state.phase!=='playing')return;
 if(ev.key==='Escape'){if(modeOpen){setStanceMenu(false);$('#stanceToggle').focus();}else if(mapOpen)selectPanel('routes');return;}
 if(ev.key.toLowerCase()==='m'){ev.preventDefault();selectPanel(mapOpen?'routes':'sound');if(mapOpen)advanceTutorial({type:'panel',id:'sound'});return;}
 if(modeOpen&&ev.target.matches('[data-act="mode"]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)){ev.preventDefault();const options=[...$('#stanceMenu').querySelectorAll('button')],i=options.indexOf(ev.target);options[(i+(['ArrowLeft','ArrowUp'].includes(ev.key)?2:1))%3].focus();return;}
 if(['1','2','3'].includes(ev.key)){ev.preventDefault();if(act({type:'mode',id:{1:'walk',2:'sneak',3:'rush'}[ev.key]}))setStanceMenu(false);}
 if(ev.code==='Space'&&ev.target.tagName!=='BUTTON'){ev.preventDefault();act({type:'end'});}
 if(ev.key.toLowerCase()==='a'){ev.preventDefault();act({type:'attack'});}if(ev.key.toLowerCase()==='c'){ev.preventDefault();act({type:'hide'});}if(ev.key.toLowerCase()==='e'){const a=roomInteraction(state);if(a.act&&a.enabled){ev.preventDefault();act({type:a.act});}}
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.key)){ev.preventDefault();const dir={ArrowUp:-4,ArrowDown:4,ArrowLeft:-1,ArrowRight:1}[ev.key],id=state.pos+dir;if(neighbours(state).includes(id))act({type:'move',id});else toast('그 방향에는 연결된 통로가 없습니다.',true);}
});
document.addEventListener('click',ev=>{if(modeOpen&&!ev.target.closest('#stanceMenu,#stanceToggle'))setStanceMenu(false);});
$('#modal').addEventListener('cancel',ev=>{if(state.pending)ev.preventDefault();else dialogMode='';});
$('#modal').addEventListener('click',ev=>{if(ev.target===$('#modal')&&!state.pending){const q=$('#modal').getBoundingClientRect();if(ev.clientX<q.left||ev.clientX>q.right||ev.clientY<q.top||ev.clientY>q.bottom)closeModal();}});
save();selectPanel('routes');render();if(migrated)toast('기존 탐험을 이어갑니다. 남은 손패가 자동 합산되었습니다.');
if(state.pending)pendingModal();else if(state.phase!=='playing')showResult();else if(!tutorialSeen)showTutorialIntro();else if(!loadedRun)poolReveal.start(state,{fast:fastDraw});
