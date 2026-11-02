import {CARDS,ROLES,MODES,TERRAINS,ALERTS,newRun,apply,neighbours,moveCost,moveStatus,moveNoise,previewNoise,validSave,migrateSave,dragonRisk,scoreBreakdown} from './engine.js';
import {paintIcons} from './art.js';
import {makeRenderer} from './scene-v5.js';
import {makePoolReveal} from './pool-reveal.js';
import {pageOf,pager} from './pages.js';
import {exitAnchor} from './scene-layout.js';
import {roomInteraction,tensionNeeded,soundNotice} from './encounter.js';
import {makeNoiseMoment} from './noise-moment.js';
import {TUTORIAL_STEPS,createTutorialRun,tutorialAllows,tutorialAdvance} from './tutorial.js';
const $=s=>document.querySelector(s),SAVE_KEY='ember-vault-save-v3',BEST_KEY='ember-vault-best-v3';
let state,storageOK=true,best=0,sound=false,selectedRole='rogue',dialogMode='',lastFocus=null,toastTimer,audio,migrated=false,loadedRun=false,fastDraw=false;
try{
 for(const key of [SAVE_KEY,'ember-vault-save-v2','ember-vault-save-v1']){
  try{const candidate=JSON.parse(localStorage.getItem(key)),saved=validSave(candidate)?candidate:migrateSave(candidate);
   if(validSave(saved)){state=saved;loadedRun=true;migrated=key!==SAVE_KEY;break;}
  }catch{/* A damaged slot must not prevent recovery from an older save. */}
 }
 state??=newRun();best=Number(localStorage.getItem(BEST_KEY))||0;sound=localStorage.getItem('ember-vault-sound')==='on';fastDraw=localStorage.getItem('ember-vault-fast-draw')==='on';
}catch{state=newRun();storageOK=false;}
let handPage=0,enemyPage=0,lureMode=false,travelUntil=0,actionBusy=false,tutorial=null,tutorialSeen=false,mapOpen=false,modeOpen=false;
try{tutorialSeen=!!localStorage.getItem('ember-vault-tutorial-v2');}catch{}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const portrait=(role,cls='')=>`<span class="portrait ${role} ${cls}" role="img" aria-label="${ROLES[role].name} 초상화"></span>`;
const ico=(name,n=32)=>`<canvas data-icon="${name}" width="${n}" height="${n}" aria-hidden="true"></canvas>`;
const renderer=makeRenderer($('#dungeon'),()=>state,$('#minimap'));
const poolReveal=makePoolReveal($('#poolReveal'),{cue:drawCue,getSound:()=>sound,toggleSound,onClose:()=>{$('.pool-panel').classList.remove('revealing');void $('.pool-panel').offsetWidth;$('.pool-panel').classList.add('revealing');renderTutorial();}});
const noiseMoment=makeNoiseMoment($('#noiseMoment'),{cue:noiseCue,getSound:()=>sound,toggleSound});
const drawNodes=new Set();
function save(){if(tutorial)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));if(['won','rescued'].includes(state.phase)&&!state.legacyScore&&state.score>best){best=state.score;localStorage.setItem(BEST_KEY,String(best));}storageOK=true;}catch{storageOK=false;}}
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
 $('.hud-location')?.setAttribute('title',state.relic?`${state.relic.name} · B1/B2에서 쓰러지면 구조 · 입구 탈출 +20점`:'유물은 하나만 가져갑니다. 깊이와 귀환 경로를 선택하세요.');
}
function markTutorial(value){tutorialSeen=true;try{localStorage.setItem('ember-vault-tutorial-v2',value);}catch{}}
function showTutorialIntro(){
 if(tutorial)return;
 openModal(modalShell('소리가 금고를 깨웁니다','LEARN BY PLAYING',`<div class="tutorial-intro"><img src="./assets/noise-seal-v6.png" alt="갈라진 소음의 봉인"><div><p>방을 누르고, 상자를 열고, 소리를 따라오는 적을 만나세요.</p><p><b>${TUTORIAL_STEPS.length}단계 연습</b>에서 교역·누적 소음·용 주머니를 직접 경험합니다. 연습용 풀로 진행합니다. 현재 탐험은 유지됩니다.</p><label><input id="tutorialAudio" type="checkbox" checked> 효과음과 함께 연습</label></div></div><div class="modal-actions"><button class="subtle-button" data-act="tutorialSkip">바로 탐험하기</button><button class="large-button" data-act="tutorialStart">직접 배워보기 →</button></div>`),'tutorialIntro');
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
 if(step.action==='buy')target=dialogMode==='market'?'[data-act="buy"][data-index="0"]':'#marketToggle';
 if(step.action==='lure')target=mapOpen?'#mapToggle':!lureMode?'#lureToggle':'.scene-exit[data-id="5"]';
 if(step.mode==='rush')target=state.mode!=='rush'?(modeOpen?'[data-act="mode"][data-id="rush"]':'#stanceToggle'):'.scene-exit[data-id="2"]';
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
 openModal(modalShell('능력을 영입하세요','BUILD YOUR POOL',`<div class="market-summary"><span>기술 <b id="marketSkill"></b> · 금화 <b id="marketGold"></b></span><button class="refresh-button" data-act="refresh" aria-label="금화 2로 상품을 비우고 턴 끝에 교체">↻ 2 G</button></div><p class="modal-sub">빈자리는 턴 끝에 보충됩니다. 새 상품에 용 표식이 있으면 습격합니다. 영입한 능력은 다음 순환부터 뽑힙니다.</p><div id="market" class="market-offers"></div>`),'market');renderMarket();
}
function showDragon(){
 const s=state,risk=dragonRisk(s),chance=Math.round(risk.hitChance*100),deep=s.rooms[s.pos].row>=2;
 const cubes=(n,kind,label)=>Array.from({length:n},()=>`<span class="${kind}" title="${label}" aria-label="${label}"></span>`).join('');
 openModal(modalShell('용은 소음을 기억합니다','THE DRAGON BAG',`<div class="dragon-report"><p class="dragon-summary">지금 구성으로 습격하면 <strong>${risk.drawCount}개 추출 · 한 번 이상 다칠 확률 ${chance}%</strong>. 대기 소음을 포함한 현재 구성입니다. 다음 교역 보충과 행동에 따라 위험이 달라집니다.</p><div class="dragon-risk-track" role="meter" aria-label="현재 주머니 피격 확률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${chance}"><i style="--risk:${chance}%"></i></div><div class="dragon-stats"><div><span>대기 소음</span><strong>${risk.pending}</strong><small>아직 지울 수 있음</small></div><div><span>주머니 소음</span><strong>${s.dragon.bag.noise}</strong><small>계속 남는 위험</small></div><div><span>안전 큐브</span><strong>${risk.safe}</strong><small>뽑히면 사라짐</small></div><div><span>용의 분노</span><strong>${risk.rage} / 5</strong><small>기본 2개 + 분노</small></div></div><div class="bag-cubes" role="group" aria-label="안전 ${risk.safe}, 주머니 소음 ${s.dragon.bag.noise}, 대기 ${risk.pending}">${cubes(risk.safe,'safe','안전 큐브')}${cubes(s.dragon.bag.noise,'noisy','주머니 속 소음')}${cubes(risk.pending,'pending','대기 소음')}</div><div class="dragon-rules"><p><strong>· 안전 / ! 소음 / + 대기</strong> — 습격할 때 대기 소음을 주머니에 넣습니다. 소음 큐브 1개당 체력 1을 잃으며 방어로 막을 수 없습니다.</p><p>숨죽이기·은신·휴식은 대기 소음을 줄입니다. 주머니 속 소음은 남습니다. 교역 보충의 <strong>용 표식</strong>은 한 차례 습격을 일으킵니다.</p><p>혼자 탐험하는 규칙: 매 턴 상품 하나가 교체되고, 3턴마다 순찰합니다. 6턴마다 분노가 오릅니다.</p></div><p class="depth-status ${deep?'deep':'safe'}">${deep?'B3/B4 심층 · 쓰러지면 점수를 잃습니다.':'B1/B2 상층 · 유물을 갖고 쓰러지면 구조되어 점수를 지킵니다.'} 입구에서 직접 탈출하면 +20점입니다.</p></div>`),'dragon');
}
function renderMarket(){
 if(dialogMode!=='market'||!$('#market'))return;
 const s=state,active=s.phase==='playing'&&!s.pending;
 $('#marketSkill').textContent=s.resource.skill;$('#marketGold').textContent=s.gold;
 $('#market').innerHTML=s.market.map((id,i)=>{if(!id)return '<div class="market-empty"><strong>보충 대기</strong><small>턴 끝에 새 상품 공개</small></div>';const a=CARDS[id],can=active&&s.resource.skill>=a.cost;return `<button class="market-card ${can?'affordable':''}" data-act="buy" data-index="${i}" aria-label="${a.name}, ${a.text}, 기술 ${a.cost}점으로 영입" ${!can?'disabled':''}>${ico(a.icon,46)}<span class="offer"><strong>${a.name}</strong><small>${a.text}</small>${a.dragon?'<span class="dragon-mark" title="새 상품으로 등장하면 용 습격">용</span>':''}${a.points?`<small class="card-points">명성 ${a.points}점</small>`:''}</span><span class="price">기술 ${a.cost}</span></button>`;}).join('');
 $('[data-act="refresh"]').disabled=!active||s.gold<2||s.refreshTurn===s.turn||!s.market.some(Boolean);paintIcons($('#modal'));
}
function showMenu(){openModal(modalShell('탐험 메뉴','EMBER VAULT',`<p class="modal-sub">${state.relic?state.relic.name+' 회수 · 입구 탈출 +20점':'유물을 찾아 입구로 돌아오세요'} · 최고 ${best}점${storageOK?'':' · 저장 불가'}</p><div class="game-menu"><button data-act="deck">나의 능력 풀<small>현재 풀과 남은 능력 보기</small></button><button data-act="tutorialIntro">직접 배우는 튜토리얼<small>소음 · 용의 분노 · 전투 연습</small></button><button data-act="help">플레이 방법<small>추출 · 이동 · 소리 · 탈출</small></button><button data-act="sound" class="${sound?'selected':''}">효과음 ${sound?'켜짐':'꺼짐'}<small>추출의 심장 박동과 봉인 파열음</small></button><button data-act="speed" class="${fastDraw?'selected':''}">${fastDraw?'빠른 추출':'긴장감 있는 추출'}<small>${fastDraw?'합산 결과만 빠르게 표시':'하나씩 공개 · 마지막 능력까지 기다림'}</small></button><button data-act="log">탐험 일지<small>발소리와 전투 기록</small></button><button data-act="new">새 탐험<small>캐릭터 선택 · 현재 탐험 초기화</small></button><button data-act="fullscreen">전체 화면<small>휴대폰 가로 화면으로 플레이</small></button></div>`),'menu');}
async function fullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('이 브라우저에서는 가로 화면으로 바로 플레이하세요.');}
 catch{toast('전체 화면을 열지 못했습니다. 가로 화면으로 플레이할 수 있습니다.');}
}
function toast(text,bad=false){const el=$('#toast');el.textContent=text;el.className='show'+(bad?' bad':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='',2800);}
function cardMarkup(id,index,action='reward'){
 const c=CARDS[id];return `<button class="ability-choice ${c.family}" data-act="${action}" data-index="${index}" data-id="${id}" aria-label="${c.name}, ${c.text}, 보상으로 선택"><span class="ability-gem">${ico(c.icon,54)}</span><small>${c.kind}</small><strong>${c.name}</strong><p>${c.text}${c.points?` · 명성 ${c.points}점`:''}</p><span class="choose-label">풀에 추가 +</span></button>`;
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
 const s=state,r=s.rooms[s.pos],active=s.phase==='playing',enemy=r.enemy?.hp>0,ra=roomInteraction(s),risk=dragonRisk(s),danger=risk.hitChance>=.5;
 $('#enemyOverlay').innerHTML=enemy?`<span class="enemy-state ${r.enemy.mode}">${ALERTS[r.enemy.mode]}${r.enemy.anchored?' · 자리 수호':''}</span><strong>${r.enemy.name}</strong><div class="enemy-life"><i style="width:${r.enemy.hp/r.enemy.maxHp*100}%"></i></div><small>HP ${r.enemy.hp} / ${r.enemy.maxHp} · 반격 ${r.enemy.damage}</small>`:'';
 $('#resources').innerHTML=[['sword','dagger','공격력'],['move','boot','이동력'],['skill','book','기술'],['block','shield','방어']].map(([key,icon,name])=>`<div class="resource ${key}" aria-label="${name} ${s.resource[key]}"><div class="res-top">${ico(icon,28)}<span>${name}</span></div><div class="res-number"><strong>${s.resource[key]}</strong></div></div>`).join('');
 $('#poolStatus').innerHTML=`${s.resource.quiet?`<span>은신 ${s.resource.quiet}</span>`:''}${s.resource.rattle?`<span class="rattle">대기 ${s.dragon.pending}</span>`:''}`;
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
 $('#landscapeStatus').innerHTML=`<span class="hud-hero">${portrait(s.role)}</span><div class="hud-health" role="meter" aria-label="체력" aria-valuemin="0" aria-valuemax="${s.maxHp}" aria-valuenow="${s.hp}"><i style="width:${s.hp/s.maxHp*100}%"></i><b>${s.hp} / ${s.maxHp}</b></div><span class="hud-gold">${ico('coin',20)} ${s.gold}</span><div class="hud-location"><span>B${r.row+1} · ${r.name}</span><small>T${String(s.turn).padStart(2,'0')}${s.relic?(r.row<2?' · 구조 가능':' · 심층 귀환'):''}</small></div><button class="hud-noise hud-dragon ${danger?'hot':''}" data-act="dragon" aria-label="용 주머니: 지금 습격하면 ${Math.round(risk.hitChance*100)}퍼센트 확률로 피해. 자세히 보기"><span>용 ${risk.drawCount}개 · ${Math.round(risk.hitChance*100)}%</span><small>대기 ${risk.pending} · 주머니 ${s.dragon.bag.noise}</small></button>`;
 const risks=[];if(enemy)risks.push(`반격 ${r.enemy.damage}`);risks.push('교역 보충 · 용 습격 가능');
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
 const s=state,won=s.phase==='won',rescued=s.phase==='rescued',scored=won||rescued,points=scoreBreakdown(s);
 const title=won?'유물과 함께 탈출했습니다.':rescued?'상층에서 구조되었습니다.':s.rooms[s.pos].row>=2?'금고 깊은 곳에 쓰러졌습니다.':'유물을 회수하지 못했습니다.';
 const breakdown=points.legacy?'이전 규칙으로 완료한 탐험의 기록입니다.':`유물 ${points.relic} + 금화 ${points.gold} + 능력 명성 ${points.cards} + 탈출 ${points.escape}`;
 openModal(modalShell(title,won?'EXPEDITION COMPLETE':rescued?'RESCUED · NO ESCAPE BONUS':'EXPEDITION ENDED',`<div class="result-hero">${ico(scored?s.relic.icon:'camp')}<p class="modal-sub" style="margin:0">${esc(s.reason||'이번 탐험의 결과입니다.')}</p><div class="score">${s.score}</div><span class="score-label">${scored?'EXPEDITION SCORE':'보물 회수 실패'}${scored&&!points.legacy&&s.score>=best?' · BEST':''}</span></div><div class="result-stats"><div><strong>${s.turn}</strong><small>진행 턴</small></div><div><strong>${s.kills}</strong><small>격파한 적</small></div><div><strong>${s.dragon.attacks}</strong><small>용의 습격</small></div><div><strong>${s.gold}</strong><small>남은 금화</small></div></div><p class="result-breakdown">${scored?breakdown:'유물을 가진 채 B1/B2에서 쓰러지면 구조됩니다. B3/B4에서는 점수를 잃습니다.'}</p><div class="modal-actions"><button class="subtle-button" data-act="close">던전 돌아보기</button><button class="large-button" data-act="new">새로운 탐험 →</button></div>`),'result');
}
function showNew(){
 selectedRole=state.role;
 renderNew();
}
function renderNew(){
 openModal(modalShell('누가 금고로 내려갈까요?','A NEW EXPEDITION',`<p class="modal-sub">직업마다 시작 능력과 특성이 다릅니다. 새 탐험을 시작하면 현재 진행은 초기화되고 최고 기록은 남습니다.</p><div class="role-list" role="radiogroup" aria-label="직업 선택">${Object.entries(ROLES).map(([key,r])=>`<button class="role-option ${key===selectedRole?'selected':''}" data-act="role" data-id="${key}" role="radio" aria-checked="${key===selectedRole}">${portrait(key,'select-portrait')}<strong>${r.name}</strong><span>${r.desc}</span><small>${r.trait}</small></button>`).join('')}</div><div class="modal-actions"><button class="subtle-button" data-act="close">현재 탐험으로 돌아가기</button><button class="large-button" data-act="start">금고로 내려가기 →</button></div>`),'new');
}
const guide=[
 ['01 / BUILD','작은 풀을 강하게 만드세요','기본 능력 10개에는 소음만 내는 실수가 섞여 있습니다. 매 턴 5개와 연쇄 능력을 자동 합산합니다. 이동력은 뽑은 능력에서 얻습니다.','기술로 이동·공격·순환 능력을 영입하세요. 새 능력은 버린 더미에 들어가 다음 순환에 등장합니다. 제단은 약한 능력을 제거합니다. 명성 점수도 확인하세요.'],
 ['02 / MARKET','구매가 다음 위험을 바꿉니다','산 상품의 자리는 턴 끝까지 비어 있습니다. 교역을 보충할 때 용 표식이 하나라도 나오면 한 번 습격합니다. 지금 보이는 표식은 이미 공개된 상품의 표시입니다.','혼자 탐험하는 금고에서는 매 턴 상품 하나가 자동 교체됩니다. 3턴마다 순찰이 발생하고, 6턴마다 분노가 올라 추출 수가 늘어납니다.'],
 ['03 / BAG','낸 소음은 주머니에 남습니다','추출의 소음과 시끄러운 행동은 대기 큐브가 됩니다. 용이 습격하면 대기 큐브를 주머니에 넣고 무작위 추출합니다. 내 소음 1개는 체력 1 피해, 안전 큐브는 피해 없이 사라집니다.','은신 능력·숨죽이기·휴식은 대기 소음을 지울 수 있지만 주머니 속 소음은 지우지 못합니다. 방어는 적의 반격을 막으며, 용 주머니 피해는 막지 못합니다. 상단 용 버튼에서 현재 위험도를 보세요.'],
 ['04 / FOOTSTEPS','통로와 바닥을 살피세요','금빛 방 이름을 누르면 이동합니다. 걷기: 기본 소리 2. 은밀: 이동 비용 +1 · 기본 소리 0. 질주: 깊은 층 이동 −1 · 기본 소리 5. 물·파편·이끼도 소리에 영향을 줍니다.','소리는 통로마다 2, 이끼에서 추가 1 감소합니다. 적은 마지막 소리를 조사하며 턴 끝에 이동·반격합니다. 적이 살아 있으면 들어온 방으로만 후퇴할 수 있습니다.'],
 ['05 / MISDIRECT','적을 피하며 위험을 관리하세요','돌멩이 유인은 기술 1로 인접 방에 소리 5를 냅니다. 숨죽이기는 이동 1로 대기 소음 −2, 은신 +2입니다. 각각 턴당 한 번이며, 돌멩이 소리는 은신으로 줄지 않습니다.','교역은 어디서든 열 수 있습니다. 상인의 방에서는 금화로 물약을 삽니다. 회복은 피해 큐브도 회수하지만 이미 주머니에 든 큐브는 그대로 남습니다.'],
 ['06 / ESCAPE','하나를 고르고, 살아 돌아오세요','유물은 하나만 선택하며 교환할 수 없습니다. 획득하면 용의 분노가 오릅니다. 고정 귀환 제한은 없지만 안전 큐브가 줄어들어 머물수록 위험해집니다.','유물 소지 중 B1/B2에서 쓰러지면 구조되어 점수를 얻습니다. B3/B4에서 쓰러지거나 유물이 없으면 0점입니다. 직접 입구에서 탈출하면 20점 추가. 점수는 유물 + 금화 + 능력 명성 + 탈출 보너스입니다.']
];
function showHelp(page=0){
 const v=pageOf(guide,page,1),[tag,title,first,second]=v.items[0];
 openModal(modalShell('소리를 다루는 탐험가','FIELD GUIDE · V8',`<article class="guide-page"><span>${tag}</span><h3>${title}</h3><p>${first}</p><p>${second}</p></article><div class="modal-actions">${pager(v,'helpPage')}<button class="large-button" data-act="close">탐험 계속하기 →</button></div>`),'help');
}
function showDeck(pile='all',page=0){
 const labels={all:'전체 풀',deck:'대기 중',discard:'다음 순환',played:'이번 추출'};
 if(!labels[pile])pile='all';
 const ids=pile==='all'?[...state.hand,...state.deck,...state.discard,...state.played]:state[pile];
 const counts={};ids.forEach(id=>counts[id]=(counts[id]||0)+1);
 const v=pageOf(Object.entries(counts),page);
 openModal(modalShell('나의 능력 풀','YOUR DRAW POOL',`<div class="deck-tabs">${Object.entries(labels).map(([k,x])=>`<button class="${pile===k?'selected':''}" data-act="deck" data-pile="${k}">${x}</button>`).join('')}</div><p class="modal-sub">${labels[pile]} · ${ids.length}개${pile==='deck'?' · 추출 순서는 비공개':''}</p><div class="deck-list">${v.items.map(([id,n])=>`<div class="deck-item">${ico(CARDS[id].icon)}<div><strong>${CARDS[id].name}</strong><small>${CARDS[id].text}${CARDS[id].points?` · 명성 ${CARDS[id].points}점`:''}</small></div><b>×${n}</b></div>`).join('')||'<p class="empty-list">아직 능력이 없습니다.</p>'}</div>${pager(v,'deckPage',`data-pile="${pile}"`)}`),'deck');
}
function showLog(page=0){
 const v=pageOf(state.log,page,3);
 openModal(modalShell('어둠 속에 남긴 발자국','EXPEDITION JOURNAL',`<p class="modal-sub">탐험 코드 ${state.seed.toString(36).toUpperCase()} · 최근 행동부터</p><div class="log-list">${v.items.map(x=>`<div class="log-row ${x.tone}"><small>T${String(x.turn).padStart(2,'0')}</small><span>${esc(x.message)}</span></div>`).join('')}</div>${pager(v,'logPage')}`),'log');
}
function act(action){
 if(poolReveal.active||noiseMoment.active||actionBusy||action.type==='move'&&performance.now()<travelUntil)return false;
 if(tutorial&&(!tutorialAllows(tutorial.index,action)||(TUTORIAL_STEPS[tutorial.index]?.mode==='rush'&&action.type==='move'&&state.mode!=='rush'))){toast(TUTORIAL_STEPS[tutorial.index]?.text||'연습을 마치고 탐험으로 돌아가세요.');return false;}
 const beforeHP=state.hp,wasRelic=!!state.relic,enemyHP=state.rooms[state.pos].enemy?.hp||0,previousNoise=state.noise,previousSeq=state.soundSeq,previousGold=state.gold;
 const previousAttacks=state.dragon.attacks;
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
  else if(['reward','skipReward','purge','cancelPurge'].includes(action.type)||tutorial&&action.type==='buy'){$('#modal').close();dialogMode='';}
  if(action.type==='end'&&state.phase==='playing'&&!state.pending)poolReveal.start(state,{fast:tutorial?false:fastDraw,holdNoise:!!tutorial,beforeHp:beforeHP});
  document.body.classList.remove('turn-impact');
 };
 if(action.type==='end'&&state.dragon.attacks>previousAttacks){actionBusy=true;document.body.classList.add('turn-impact');noiseMoment.dragon(state.dragon.lastAttack,finish,{hold:!!tutorial});}
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
 if(a==='dragon')return showDragon();
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
save();selectPanel('routes');render();if(migrated)toast('기존 탐험을 보존했습니다. 용 주머니와 새 귀환 규칙으로 이어갑니다.');
if(state.pending)pendingModal();else if(state.phase!=='playing')showResult();else if(!tutorialSeen)showTutorialIntro();else if(!loadedRun)poolReveal.start(state,{fast:fastDraw});
