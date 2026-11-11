import {hasRisk,RISK,healingLeft,healingAmount,healingNote,soundLoss} from './risk-rules.js?v=20261111a';
import {startFirstRun,recordFirstRun,firstRunGoal,firstRunMemory,actionReceipt,returnForecast} from './first-run.js?v=20261111a';
import {hasGimmicks,roomGimmick,passageRule,movementGimmickReason,worldPassageOpen} from './dungeon-gimmicks.js?v=20261111a';
import {passageGuideMarkup,conduitMarkup} from './gimmick-presentation.js?v=20261111a';
import {STAGES,isStaged,stageIndex,stageLabel,checkpointIndex,expeditionBonuses} from './expedition-stages.js?v=20261111a';
import {stageTrackMarkup,stageCampMarkup,stagePlanMarkup,stageChoiceLines} from './stage-presentation.js?v=20261111a';
import {CARDS,ROLES,MODES,TERRAINS,ALERTS,newRun,apply,neighbours,moveCost,moveStatus,moveNoise,previewNoise,validSave,migrateSave,dragonDue,breathPlan,echoFadeEvery,MEMORY_MAX} from './engine.js?v=20261111a';
import {paintIcons} from './art.js?v=20261111a';
import {makeRenderer} from './scene-v5.js?v=20261111a';
import {makePoolReveal} from './pool-reveal.js?v=20261111a';
import {pageOf,pager} from './pages.js?v=20261111a';
import {exitAnchor} from './scene-layout.js?v=20261111a';
import {roomInteraction,turnImpact,tensionNeeded,soundNotice} from './encounter.js?v=20261111a';
import {makeNoiseMoment} from './noise-moment.js?v=20261111a';
import {TUTORIAL_STEPS,TUTORIAL_PROLOGUE,TUTORIAL_TURN,createTutorialRun,tutorialAllows,tutorialAdvance,tutorialChapter,tutorialTargets,tutorialHint,tutorialMapLesson,tutorialActionReason} from './tutorial.js?v=20261111a';
import {makeCutscene} from './cutscene.js?v=20261111a';
import {returnRoute,routeAdvice,lureForecast} from './strategy.js?v=20261111a';
import {createTutorialJournal,recordTutorialAction,tutorialRecap} from './tutorial-journal.js?v=20261111a';
import {loadTutorialProgress,saveTutorialProgress,clearTutorialProgress} from './tutorial-storage.js?v=20261111a';
import {MERCHANT,marketContext,meetingLines,memoryLore,purchaseLines,MERCHANT_STORY} from './merchant-story.js?v=20261111a';
import {tokenMarkup,gradeLabel,itemMarkup,richGlyph} from './token-art.js?v=20261111a';
import {abilityEffectsMarkup,abilityNotesMarkup,glossaryMarkup} from './ability-guide.js?v=20261111a';
import {firstExpeditionGoal} from './first-expedition.js?v=20261111a';
const $=s=>document.querySelector(s),SAVE_KEY='ember-vault-save-v2',BEST_KEY='ember-vault-best-v1';
let state,storageOK=true,best=0,sound=false,selectedRole='rogue',dialogMode='',lastFocus=null,toastTimer,audio,migrated=false,loadedRun=false,fastDraw=false;
try{let saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(!validSave(saved)){const prior=JSON.parse(localStorage.getItem('ember-vault-save-v1'));if(prior){saved=migrateSave(prior);migrated=!!saved;}}loadedRun=validSave(saved);state=loadedRun?saved:newRun({layout:'staged',risk:true});best=Number(localStorage.getItem(BEST_KEY))||0;sound=localStorage.getItem('ember-vault-sound')==='on';fastDraw=localStorage.getItem('ember-vault-fast-draw')==='on';}catch{state=newRun({layout:'staged',risk:true});storageOK=false;}
let glossaryBack=null,guideTravelMode='walk',lastReceipt='';
let handPage=0,enemyPage=0,lureMode=false,travelUntil=0,actionBusy=false,tutorial=null,tutorialSeen=false,tutorialCompleted=false,mapOpen=false,modeOpen=false,lurePreviewTarget=null,firstExpeditionSelected=false,lastTutorialRecap=null;
let storedTutorial=null,tutorialStorageOK=true,tutorialRecoveryNotice='';
try{const marker=localStorage.getItem('ember-vault-tutorial-v1');tutorialSeen=!!marker;tutorialCompleted=marker==='completed';}catch{}
try{const recovered=loadTutorialProgress(localStorage);storedTutorial=recovered.progress;tutorialStorageOK=recovered.status!=='unavailable';if(recovered.status==='invalid')tutorialRecoveryNotice='이전 연습 기록을 읽지 못했습니다. 본게임 저장은 유지되며 연습을 새로 시작할 수 있어요.';}catch{tutorialStorageOK=false;}
if(!tutorialStorageOK)tutorialRecoveryNotice='이 브라우저에서는 연습 기록을 읽거나 저장할 수 없어요. 연습은 플레이할 수 있지만 새로고침하면 최근 진행을 잃을 수 있습니다.';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const portrait=(role,cls='')=>`<span class="portrait ${role} ${cls}" role="img" aria-label="${ROLES[role].name} 초상화"></span>`;
// 연습 대사는 컷신으로: 말하는 쪽 초상(깜부기 = 등불 속 잿불, 도적 = 연습 직업 초상)
const cutscene=makeCutscene({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,heroPortrait:()=>portrait(state.role||'rogue','cut-portrait-img'),portraits:{[MERCHANT.name]:`<img class="nox-portrait" src="${MERCHANT.art}" alt="기억장수 녹스">`}});let talkShown=-1;
const ico=(name,n=32)=>richGlyph(name,n)||`<canvas data-icon="${name}" width="${n}" height="${n}" aria-hidden="true"></canvas>`;
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
 if(type==='tick')return beep('move');
 if(type==='hold')return beep('buy');
}
function renderInteraction(ra){
 const target=$('#sceneTarget'),r=state.rooms[state.pos];
 if(r.host==='nox'&&!(r.enemy?.hp>0)&&!ra.act&&state.phase==='playing'&&!state.pending){
  target.hidden=false;target.dataset.act='market';target.className='scene-target merchant';target.setAttribute('aria-label','녹스와 대화하고 기억 메달 살펴보기');target.setAttribute('aria-disabled','false');target.innerHTML='<span class="target-corners" aria-hidden="true"></span><span class="target-label"><strong>녹스와 대화</strong><small>기억을 살펴보세요</small></span>';return;
 }
 target.dataset.act=ra.act==='stageCamp'?'stageCamp':ra.act==='conduit'?'conduit':'sceneInteract';
 target.hidden=!ra.act||state.phase!=='playing'||!!state.pending||(r.type==='entry'&&!state.relic);
 target.className=`scene-target ${ra.kind||''} ${ra.enabled?'':'unavailable'}`;
 target.setAttribute('aria-label',`${ra.subject||r.name} 직접 ${ra.short}. ${ra.enabled?ra.detail:ra.reason}`);
 target.setAttribute('aria-disabled',String(!ra.enabled));
 target.innerHTML=`<span class="target-corners" aria-hidden="true"></span><span class="target-label"><strong>${esc(ra.short||'')}</strong><small>${esc(ra.detail||'')}</small></span>`;
 $('.hud-location')?.setAttribute('title',state.relic?`유물 회수 완료 · ${state.countdown}턴 안에 입구로`:'유물 하나를 회수하고 입구로 돌아오세요');
}
function markTutorial(value){tutorialSeen=true;tutorialCompleted ||= value==='completed';try{localStorage.setItem('ember-vault-tutorial-v1',tutorialCompleted?'completed':value);}catch{}}
// Save the committed action immediately, before any animation finishes. A reload must not
// repeat a purchase, battle reward, or relic collection that the engine has already applied.
function persistTutorial({action=null,feedback,paused=false}={}){
 if(!tutorial)return;
 const index=action?tutorialAdvance(tutorial.index,action,state):tutorial.index;
 const checkpoint=index!==tutorial.index&&TUTORIAL_STEPS[index]?.checkpoint?JSON.stringify({state,journal:tutorial.journal,index}):tutorial.checkpoint;
 const progress={state,index,journal:tutorial.journal,checkpoint,feedback:feedback??tutorial.feedback,mapOpen,paused,returnHelp:!!tutorial.returnHelp,returnHelpUsed:!!tutorial.returnHelpUsed};
 storedTutorial=structuredClone(progress);
 try{tutorialStorageOK=saveTutorialProgress(localStorage,progress).ok;}catch{tutorialStorageOK=false;}
}
function clearTutorialRecord(){
 storedTutorial=null;try{tutorialStorageOK=clearTutorialProgress(localStorage);}catch{tutorialStorageOK=false;}
}
function showTutorialResume(){
 if(!storedTutorial)return showTutorialIntro();
 const p=storedTutorial,step=TUTORIAL_STEPS[p.index],description=p.state.phase==='won'?'탈출 완료 · 탐험 결산을 확인할 수 있어요':p.state.phase==='lost'?'탐험 종료 · 저장한 선택 전 장면에서 다시 도전할 수 있어요':`${p.index+1}/${TUTORIAL_STEPS.length} · ${step?.title||'첫 금고 털이'} · ${p.state.rooms[p.state.pos].name}`;
 openModal(modalShell('중단한 첫 탐험이 있어요','튜토리얼 이어하기',`<p class="modal-sub">${esc(description)}</p><p class="modal-sub">이어서 시작하면 남은 자원과 선택을 그대로 복원합니다. 「처음부터」는 이 연습만 새로 시작합니다. 본게임과 최고 기록은 유지됩니다.</p>${!tutorialStorageOK?'<p class="tutorial-storage-note">이 브라우저에서는 연습 저장이 되지 않습니다. 현재 페이지를 닫으면 최근 진행을 잃을 수 있어요.</p>':''}<div class="modal-actions"><button class="subtle-button" data-act="tutorialKeepMain">기존 탐험 계속</button><button class="subtle-button" data-act="tutorialRestart">처음부터 다시</button><button class="large-button" data-act="tutorialResume">이어서 플레이 →</button></div>`),'tutorialResume');
}
function resumeTutorial(){
 if(!storedTutorial)return;
 const p=structuredClone(storedTutorial);
 const escapeIndex=TUTORIAL_STEPS.findIndex(step=>step.key==='escape');
 cutscene.clear();tutorial={saved:state,index:p.index,feedback:p.feedback||'중단한 곳에서 이어갑니다',checkpoint:p.checkpoint,journal:p.journal,returnHelp:typeof p.returnHelp==='boolean'?p.returnHelp:p.index>=escapeIndex};state=p.state;
 tutorial.returnHelpUsed=p.returnHelpUsed===true||tutorial.returnHelp;
 handPage=0;enemyPage=0;lureMode=false;travelUntil=0;actionBusy=false;talkShown=p.index;renderer.reset();
 $('#modal').close();dialogMode='';document.body.classList.add('tutorial-mode');selectPanel(p.mapOpen?'sound':'routes');render();persistTutorial();
 if(state.pending)pendingModal();else if(state.phase==='lost')showTutorialLoss();
}
function keepMainExpedition(){
 if(storedTutorial){storedTutorial.paused=true;try{tutorialStorageOK=saveTutorialProgress(localStorage,storedTutorial).ok;}catch{tutorialStorageOK=false;}}
 markTutorial('seen');closeModal();
 if(state.pending)pendingModal();else if(state.phase!=='playing')showResult();
}
function showWelcome(){
 openModal(modalShell('불빛을 빌려, 첫 발걸음','깜부기와 상층 원정',`<div class="first-welcome"><img src="./assets/v95/props/lantern.webp" alt="기억을 깨우는 등불"><p>“이 등불은 메달에 남은 솜씨를 빌려 줘.<br>먼저 상자 하나 열어 볼까?”</p></div><p class="welcome-rule">메달은 힘을 더하고, 발걸음은 그 힘을 씁니다.<br>목표는 심층의 유물을 가져와 살아 돌아오는 것.</p><div class="modal-actions"><button class="large-button" data-act="firstRunStart">${loadedRun?(isStaged(state)?'지금 원정에서 안내 받기':'기존 원정 계속하기'):'상층에서 시작하기 →'}</button><button class="subtle-button" data-act="tutorialSkip">안내 없이 탐험</button></div><button class="welcome-detail" data-act="tutorialStart">소리·유인·귀환을 자세히 연습하기 · ${TUTORIAL_STEPS.length}단계</button>`),'welcome');
}
function beginFirstRun(){
 const fresh=!loadedRun;markTutorial('seen');startFirstRun(state);save();$('#modal').close();dialogMode='';selectPanel('routes');render();loadedRun=true;
 if(fresh)poolReveal.start(state,{fast:true,explain:true,holdSummary:true});
}
function showFirstRunHelp(){
 const goal=firstRunGoal(state)||returnForecast(state);if(!goal)return;
 openModal(modalShell(goal.title,'원할 때 펼쳐 보는 안내',`<p class="first-help-text">${esc(goal.text)}</p><p class="first-help-text">${esc(goal.hint)}</p><div class="modal-actions"><button class="large-button" data-act="close">내 선택 계속하기 →</button>${state.firstRun?.enabled?'<button class="subtle-button" data-act="firstRunDismiss">짧은 안내 마치기</button>':''}</div>`),'firstRunHelp');
}
function showTutorialIntro(){
 if(tutorial)return;
 if(storedTutorial)return showTutorialResume();
 openModal(modalShell('심층 원정을 위한 첫 금고 털이','깜부기와 짧은 회상',`<div class="tutorial-intro"><img src="./assets/v95/props/seal.webp" alt="갈라진 소음의 봉인"><div><p>실전의 목표는 <b>네 구역을 거쳐 심층의 유물을 입구로 가져오는 것.</b></p><p>이 짧은 회상에서 깜부기와 소리·메달 영입·귀환을 익힙니다. 실전에서는 층 사이 정비로 능력 풀과 보급을 준비합니다. 지금 탐험과 최고 기록은 그대로 남습니다.</p><ol class="practice-chapters"><li><b>힘과 소리</b><span>숨죽이고, 유인으로 길 열기</span></li><li><b>위기 다루기</b><span>새 능력을 뽑아 수호자 돌파</span></li><li><b>선택과 귀환</b><span>숨결을 예측하고 내 길로 귀환</span></li></ol><label><input id="tutorialAudio" type="checkbox" checked> 효과음과 함께 연습</label><small>${TUTORIAL_STEPS.length}단계 · ${tutorialStorageOK?'진행은 자동 저장되어 이어할 수 있어요':'이 브라우저에서는 저장할 수 없어 새로고침하면 처음부터 시작해요'}</small>${tutorialRecoveryNotice?`<p class="tutorial-storage-note">${esc(tutorialRecoveryNotice)}</p>`:''}</div></div><div class="modal-actions"><button class="subtle-button" data-act="tutorialSkip">바로 탐험하기</button><button class="large-button" data-act="tutorialStart">첫 금고 털이 시작 →</button></div>`),'tutorialIntro');
}
function startTutorial(){
 const withAudio=$('#tutorialAudio')?.checked;
 if(withAudio&&!sound)toggleSound();
 tutorial={saved:state,index:0,feedback:'',checkpoint:null,returnHelp:false,returnHelpUsed:false};state=createTutorialRun();tutorial.journal=createTutorialJournal(state);handPage=0;enemyPage=0;lureMode=false;travelUntil=0;renderer.reset();
 $('#modal').close();dialogMode='';document.body.classList.add('tutorial-mode');talkShown=-1;
 // 프롤로그: 왜 메달이 열리는가 → 첫 추출 → 1단계 대사
 cutscene.play(TUTORIAL_PROLOGUE,()=>{if(tutorial)poolReveal.start(state,{fast:false,holdNoise:true});});
 selectPanel('routes');render();persistTutorial();
}
function exitTutorial(){
 if(!tutorial)return;cutscene.clear();talkShown=-1;const completed=tutorial.index>=TUTORIAL_STEPS.length,recap=completed?{...tutorialRecap(state,tutorial.journal),returnHelp:!!tutorial.returnHelpUsed}:null;if(completed)clearTutorialRecord();else persistTutorial({paused:true});state=tutorial.saved;tutorial=null;
 document.body.classList.remove('tutorial-mode');markTutorial(completed?'completed':'seen');renderer.reset();lureMode=false;handPage=0;enemyPage=0;travelUntil=0;
 $('#modal').close();dialogMode='';selectPanel('routes');render();save();if(completed)showBriefing(recap);else{if(state.pending)pendingModal();else if(state.phase!=='playing')showResult();toast(tutorialStorageOK?'연습을 저장했어요. 메뉴에서 이어갈 수 있습니다.':'현재 페이지에서는 이어할 수 있지만 새로고침하면 최근 연습을 잃을 수 있어요.');}
}
function showBriefing(recap){
 lastTutorialRecap=recap;
 const transfer=recap.returnHelp?{title:'도움과 함께 확인한 귀환',text:'길 안내를 보며 유물을 입구까지 가져왔어요. 다음 탐험에서도 지도와 남은 힘을 함께 살펴보세요.'}:{title:'직접 선택해 완주한 귀환',text:'마지막 귀환에서는 다음 방을 가리키는 안내 없이 길을 골랐어요. 이번 행동 기록을 첫 실전에도 적용해 보세요.'};
 openModal(modalShell(esc(recap.title),'첫 탐험 결산',`
  <p class="modal-sub">${esc(recap.subtitle)}</p>
  <div class="first-expedition-brief"><strong>첫 실전 목표 · 심층의 유물을 가져와 귀환</strong><p>상층 → 중층 → 하층 → 심층. 층 사이 정비소에서 능력 풀과 보급을 준비하고, 용의 기억을 회수해 입구에서 「탈출」하세요.</p></div>
  <div class="modal-actions"><button class="subtle-button" data-act="close">기존 탐험 계속</button><button class="large-button" data-act="firstExpedition">첫 실전 준비하기 →</button></div>
  <div class="tutorial-results">${recap.stats.map(({label,value})=>`<div><strong>${esc(value)}</strong><small>${esc(label)}</small></div>`).join('')}</div>
  <div class="briefing tutorial-reflection">${recap.highlights.map(({title,text})=>`<div><strong>${esc(title)}</strong><p>${esc(text)}</p></div>`).join('')}</div>
  <div class="practice-transfer"><strong>${esc(transfer.title)}</strong><p>${esc(transfer.text)}</p></div>
  <p class="recap-save-note">이번 회상은 기존 탐험과 최고 기록에 반영되지 않습니다. 첫 실전의 직업 선택에서 시작을 누르기 전까지 기존 탐험을 유지합니다.</p>`),'briefing');
}

function renderTutorial(){
 const coach=$('#tutorialCoach');document.querySelectorAll('.coach-target').forEach(e=>e.classList.remove('coach-target'));
 const reading=!!tutorial&&mapOpen,lesson=reading?tutorialMapLesson(tutorial.index,state):null,lessonBox=$('#tutorialMapLesson');
 document.body.classList.toggle('tutorial-map-reading',reading);coach.hidden=!tutorial||reading;
 lessonBox.hidden=!lesson;
 if(lesson)lessonBox.innerHTML=`<div class="map-lesson-head"><strong>${esc(lesson.title)}</strong><span>${esc(lesson.count)}</span></div><p class="map-lesson-copy">${esc(lesson.text)}</p><button data-act="tutorialContinue" data-id="${esc(lesson.key)}">${esc(lesson.continueLabel)}</button>`;
 $('#mapInstructions').textContent=lesson?'소리·적·메아리를 살펴보세요. 아래에서 확인하면 계속합니다.':hasGimmicks(state)?'금빛 방: 이동 가능 · 열쇠/봉인: 닫힌 길 · ↓: 일방통행. 통로·기믹에서 비용을 비교하세요.':'연결된 금빛 방을 누르면 이동합니다.';
 if(!tutorial)return;
 const step=TUTORIAL_STEPS[tutorial.index];coach.dataset.step=String(tutorial.index+1);coach.dataset.stepKey=step?.key||'complete';
 const dots=TUTORIAL_STEPS.map((_,i)=>`<i class="${i<tutorial.index?'done':i===tutorial.index?'now':''}"></i>`).join('');
 if(talkShown!==tutorial.index){talkShown=tutorial.index;const lines=step?step.talk:tutorialRecap(state,tutorial.journal).talk;if(!step||step.autoTalk)setTimeout(()=>{if(tutorial&&talkShown===tutorial.index)cutscene.play(lines);},0);}
 if(!step){const recap=tutorialRecap(state,tutorial.journal);coach.innerHTML=`<div class="coach-head"><span>첫 금고 털이 성공</span><span class="coach-dots" aria-hidden="true">${dots}</span></div><strong>${esc(recap.title)}</strong><p>${esc(recap.subtitle)}</p><button data-act="tutorialExit">내 탐험 결산 →</button>`;return;}
 const options={returnHelp:!!tutorial.returnHelp},resourceHint=tutorialHint(tutorial.index,state,options);
 coach.innerHTML=`<div class="coach-head"><span>${tutorialChapter(tutorial.index)}</span><span class="coach-count">${tutorial.index+1}/${TUTORIAL_STEPS.length}</span><span class="coach-dots" role="progressbar" aria-label="연습 진행" aria-valuenow="${tutorial.index}" aria-valuemin="0" aria-valuemax="${TUTORIAL_STEPS.length}">${dots}</span></div>${tutorial.feedback?`<span class="coach-feedback">✓ ${esc(tutorial.feedback)}</span>`:''}<strong>${step.title}</strong><p>${resourceHint}</p>${step.key==='escape'?`<button class="return-help" data-act="tutorialHelp" aria-pressed="${!!tutorial.returnHelp}">${tutorial.returnHelp?'도움 접기':'도움 보기'}</button>`:''}${!tutorialStorageOK?'<small class="tutorial-storage-note">저장할 수 없어요. 새로고침하면 최근 진행을 잃을 수 있습니다.</small>':''}<button class="coach-replay" data-act="tutorialReplay" aria-label="깜부기의 대화 보기">💬 대화</button><button class="tutorial-leave" data-act="tutorialExit" aria-label="연습 저장하고 원래 탐험으로">×</button>`;
 if(reading)return;
 let target=tutorialTargets(tutorial.index,state,{mapOpen,returnHelp:!!tutorial.returnHelp});
 if(step.action==='lure')target=mapOpen?'#mapToggle':!lureMode?'#lureToggle':`.scene-exit[data-id="${step.id}"]`;
 if(step.mode&&state.mode!==step.mode)target=modeOpen?`[data-act="mode"][data-id="${step.mode}"]`:'#stanceToggle';
 if(target)document.querySelectorAll(target).forEach(e=>e.classList.add('coach-target'));
}
// 연습 스포트라이트: 지금 눌러야 할 곳만 밝히고 나머지는 어둡게. 클릭은 막지 않는다(틀린 행동은 안내로 돌려보냄).
const coachSpot=document.createElement('div');coachSpot.className='coach-spot';coachSpot.hidden=true;coachSpot.setAttribute('aria-hidden','true');document.body.appendChild(coachSpot);let coachShift=0,coachShiftX=0,placedCoach=null;
(function spotLoop(){
 let show=false;
 if((tutorial||firstRunGoal(state)||returnForecast(state))&&!mapOpen&&!document.querySelector('dialog[open]')){
  let l=Infinity,t=Infinity,r=-Infinity,b=-Infinity;const boxes=[];
  for(const e of document.querySelectorAll('.coach-target')){const q=e.getBoundingClientRect();if(!q.width||!q.height)continue;boxes.push(q);l=Math.min(l,q.left);t=Math.min(t,q.top);r=Math.max(r,q.right);b=Math.max(b,q.bottom);}
  // An independent goal still has to leave every legal choice physically reachable.
  // These are avoidance boxes only; they never create a route spotlight.
  if(!tutorial||TUTORIAL_STEPS[tutorial.index]?.key==='escape')for(const e of document.querySelectorAll('.scene-exit,#sceneTarget:not([hidden]),#mapToggle')){
   const q=e.getBoundingClientRect();if(q.width&&q.height&&getComputedStyle(e).visibility!=='hidden')boxes.push(q);
  }
  // Keep the entire guide out of the current controls, including its replay/close buttons.
  const coach=tutorial?$('#tutorialCoach'):$('#expeditionGoal');if(placedCoach!==coach){placedCoach=coach;coachShift=0;coachShiftX=0;coach.style.setProperty('--coach-shift','0px');coach.style.setProperty('--coach-shift-x','0px');}const q=coach.getBoundingClientRect(),base=q.top-coachShift,baseX=q.left-coachShiftX;
  const minY=$('.combat-bar').getBoundingClientRect().bottom+8,maxY=$('.play-dock').getBoundingClientRect().top-q.height-8;
  const overlap=({x,y})=>boxes.reduce((sum,p)=>{
   const area=Math.max(0,Math.min(x+q.width+8,p.right)-Math.max(x-8,p.left))*Math.max(0,Math.min(y+q.height+8,p.bottom)-Math.max(y-8,p.top));
   const cx=(p.left+p.right)/2,cy=(p.top+p.bottom)/2,blocksCenter=cx>=x-2&&cx<=x+q.width+2&&cy>=y-2&&cy<=y+q.height+2;
   return sum+area+(blocksCenter?innerWidth*innerHeight:0);
  },0);
  const ys=[base,minY,maxY,...boxes.flatMap(p=>[p.top-q.height-12,p.bottom+12])].filter(y=>y>=minY&&y<=maxY);
  const xs=[baseX,10,innerWidth-q.width-10,...boxes.flatMap(p=>[p.left-q.width-12,p.right+12])].filter(x=>x>=10&&x<=innerWidth-q.width-10);
  const candidates=xs.flatMap(x=>ys.map(y=>({x,y})));
  const distance=p=>Math.abs(p.x-baseX)+Math.abs(p.y-base);
  candidates.sort((a,b)=>overlap(a)-overlap(b)||distance(a)-distance(b));
  const chosen=candidates[0]??{x:baseX,y:base},shift=Math.round(chosen.y-base),shiftX=Math.round(chosen.x-baseX);
  if(shift!==coachShift||shiftX!==coachShiftX){coachShift=shift;coachShiftX=shiftX;coach.style.setProperty('--coach-shift',shift+'px');coach.style.setProperty('--coach-shift-x',shiftX+'px');}
  if(r>l){show=true;const pad=6;Object.assign(coachSpot.style,{left:(l-pad)+'px',top:(t-pad)+'px',width:(r-l+pad*2)+'px',height:(b-t+pad*2)+'px'});}
 }
 coachSpot.hidden=!show;document.body.classList.toggle('coach-spotlit',show);
 requestAnimationFrame(spotLoop);
})();
function advanceTutorial(action,feedback='소리 지도를 확인했어요'){
 if(!tutorial)return;const before=tutorial.index;tutorial.index=tutorialAdvance(tutorial.index,action,state);
 if(before!==tutorial.index){tutorial.feedback=feedback;if(TUTORIAL_STEPS[tutorial.index]?.checkpoint)tutorial.checkpoint=JSON.stringify({state,journal:tutorial.journal,index:tutorial.index});}
 else if(feedback&&action.type==='end')tutorial.feedback=feedback;
 persistTutorial();render();
}
function retryTutorialChoice(){
 if(!tutorial?.checkpoint)return;cutscene.clear();const retries=(tutorial.journal.retryCount||0)+1,checkpoint=JSON.parse(tutorial.checkpoint);state=checkpoint.state;tutorial.journal=checkpoint.journal;tutorial.journal.retryCount=retries;tutorial.index=checkpoint.index;tutorial.returnHelp=false;tutorial.returnHelpUsed=false;tutorial.feedback='수호자에게 가기 전부터 다시 시작합니다';talkShown=-1;actionBusy=false;travelUntil=0;lureMode=false;renderer.reset();$('#modal').close();dialogMode='';selectPanel('routes');render();persistTutorial();
}
function showTutorialLoss(){openModal(modalShell('돌아오는 길에서 다시 배워요','회상의 한 장면',`<p class="modal-sub">${esc(state.reason)} 실제 탐험은 그대로입니다. 수호자에게 가기 전부터 다시 시도할 수 있어요.</p><div class="modal-actions"><button class="subtle-button" data-act="tutorialExit">원래 탐험으로</button><button class="large-button" data-act="tutorialRetry">선택 전부터 다시 →</button></div>`,false),'tutorialRetry');}
function selectPanel(id){
 mapOpen=id==='sound';setStanceMenu(false);
 renderer.setZoom(mapOpen);$('.play-surface').classList.toggle('map-open',mapOpen);$('.canvas-wrap').classList.toggle('mapview',mapOpen);
 $('#soundPanel').hidden=!mapOpen;$('#mapInstructions').hidden=!mapOpen;
 $('#mapToggle').setAttribute('aria-expanded',String(mapOpen));$('#mapToggle').setAttribute('aria-label',mapOpen?'소리 지도 닫기':'소리 지도 펼치기');
 $('#mapToggleLabel').textContent=mapOpen?'지도 닫기':'소리 지도';$('#mapToggleIcon').textContent=mapOpen?'×':'⛶';
 renderTutorial();
}
function setStanceMenu(open){
 modeOpen=open;document.body.classList.toggle('mode-open',open);$('#stanceMenu').hidden=!open;$('#stanceToggle').setAttribute('aria-expanded',String(open));renderTutorial();
 if(open)$('#stanceMenu button[aria-pressed="true"]')?.focus({preventScroll:true});
}
function showMarket(){
 if(isStaged(state)&&(checkpointIndex(state)<0||state.rooms[state.pos].enemy?.hp>0)){toast('교역은 층 사이 정비소에서 할 수 있습니다.');return;}
 if(tutorial&&state.pos===7)state.rooms[7].host='nox';
 if(state.tradeStory?.identity!==MERCHANT.identity){
  state.tradeStory={...state.tradeStory,met:true,identity:MERCHANT.identity};persistTutorial();save();
  const run=state;cutscene.play(meetingLines(state,!!tutorial),()=>{if(state===run)openMarket();},merchantScene());return;
 }
 openMarket();
}
function merchantScene(){const c=marketContext(state,!!tutorial);return {key:'merchant',art:MERCHANT.art,title:c.title,text:c.explanation};}
function openMarket(receipt=''){
 const context=marketContext(state,!!tutorial);
 openModal(modalShell('녹스의 기억 둥지','만남 · '+esc(context.title),`<div class="nox-market"><div class="nox-hero"><img src="${MERCHANT.art}" alt="은발과 보랏빛 피부, 황금 눈과 등불 뿔을 지닌 인외 여상인 녹스"><div class="nox-identity"><span>${MERCHANT.title}</span><strong>녹스</strong></div><p class="nox-quote">“${esc(context.greeting)}”</p></div><div class="nox-counter"><div class="nox-conversation"><p>${receipt?esc(receipt):esc(context.explanation)}</p><button class="subtle-button" data-act="merchantTalk">녹스의 이야기</button></div><div class="market-summary"><span>기술 <b id="marketSkill"></b> · 금화 <b id="marketGold"></b></span><button class="refresh-button" data-act="refresh" aria-label="금화 2로 교역 목록 교체">다른 기억 보기 · 금화 2</button></div><p class="nox-rule">${tutorial?'등급은 외형 구분입니다. 불씨 화살의 효과는 공격 +3, 영입 비용은 기술 3이에요.':'기술로 기억을 깨웁니다. 새 메달은 주머니를 다시 섞을 때부터 나옵니다.'}</p><div id="market" class="market-offers"></div><button class="keyword-button" data-act="glossary" data-return="market">능력·키워드 뜻 보기</button><p class="nox-sendoff">${tutorial?'“다녀와. 결말은 돌아와서 들려줘. 등불 하나 비워 둘 테니.”':'“조심히 가. 마음에 든 이야기는 오래 읽고 싶거든.”'}</p></div></div>`),'market');renderMarket();
}
function renderMarket(){
 if(dialogMode!=='market'||!$('#market'))return;
 const s=state,camp=checkpointIndex(s),limited=isStaged(s)&&(camp<0||s.stagePrepared[camp]===null||s.stageTrades[camp]>=1),active=s.phase==='playing'&&!s.pending&&!limited;
 $('#marketSkill').textContent=s.resource.skill;$('#marketGold').textContent=s.gold;
 $('#market').innerHTML=s.market.map((id,i)=>{const a=CARDS[id],allowed=!tutorial||tutorialAllows(tutorial.index,{type:'buy',index:i},s),can=active&&s.resource.skill>=a.cost&&allowed,short=Math.max(0,a.cost-s.resource.skill);return `<button class="market-card ${can?'affordable':''}" data-act="buy" data-index="${i}" data-card="${id}" aria-label="${a.name}, ${a.text}, 기술 ${a.cost}점으로 영입${short?', 기술 '+short+' 부족':''}${!allowed?', 지금 안내된 능력을 먼저 영입하세요':''}" ${!can?'disabled':''}>${tokenMarkup(id,{size:72})}<span class="offer"><strong class="ability-name">${a.name}</strong>${abilityEffectsMarkup(id)}${gradeLabel(id)}</span><span class="price${short?' short':''}">기술 ${a.cost}${short?' · '+short+' 부족':!allowed?' · 다음에':' · 기억 깨우기'}${limited?' · 정비소 교역 완료':''}</span>${abilityNotesMarkup(id)}<em class="memory-lore">${esc(memoryLore(id,a))}</em></button>`;}).join('');
 $('[data-act="refresh"]').disabled=!!tutorial||!active||s.gold<2||s.refreshTurn===s.turn;paintIcons($('#modal'));
}
function showMenu(){openModal(modalShell('탐험 메뉴','잿불 금고 V10.2',`<p class="modal-sub">${state.relic?state.relic.name+' 회수 · 귀환 '+state.countdown+'턴':'유물을 찾아 입구로 돌아오세요'} · 최고 ${best}점${storageOK?'':' · 저장 불가'}</p>${tutorialRecoveryNotice?`<p class="tutorial-storage-note">${esc(tutorialRecoveryNotice)}</p>`:''}<div class="game-menu">${isStaged(state)&&stageIndex(state)<=1&&state.phase==='playing'?'<button data-act="firstRunStart">상층 짧은 안내<small>현재 원정에서 익히기 · 언제든 접기</small></button>':''}${hasGimmicks(state)?'<button data-act="passageGuide">통로와 기믹<small>현재 경로 비용 · 열쇠 · 봉인 상태</small></button>':''}${isStaged(state)?'<button data-act="stagePlan">원정 계획<small>상층 · 중층 · 하층 · 심층 / 층간 정비</small></button>':''}${tutorialCompleted&&!tutorial?'<button data-act="firstExpedition">첫 실전 준비<small>세 번의 층간 정비와 심층 유물 회수</small></button>':''}<button data-act="codex">금고도감<small>인물 · 기억 메달 · 유물의 기록</small></button><button data-act="deck">나의 메달 주머니<small>가진 능력과 남은 메달 보기</small></button><button data-act="tutorialIntro">${storedTutorial?'튜토리얼 이어하기':'직접 배우는 튜토리얼'}<small>${storedTutorial?`${Math.min(storedTutorial.index+1,TUTORIAL_STEPS.length)}/${TUTORIAL_STEPS.length}단계에서 계속`:`${TUTORIAL_STEPS.length}단계 · 유인 성공부터 성장과 귀환까지`}</small></button><button data-act="glossary" data-return="menu">능력·키워드 사전<small>은신 · 첫 소음 · 유물의 대가</small></button><button data-act="help">플레이 방법<small>추출 · 이동 · 소리 · 탈출</small></button><button data-act="sound" class="${sound?'selected':''}">효과음 ${sound?'켜짐':'꺼짐'}<small>추출의 심장 박동과 봉인 파열음</small></button><button data-act="speed" class="${fastDraw?'selected':''}">${fastDraw?'빠른 추출':'긴장감 있는 추출'}<small>${fastDraw?'합산 결과만 빠르게 표시':'하나씩 공개 · 마지막 능력까지 기다림'}</small></button><button data-act="log">탐험 일지<small>발소리와 전투 기록</small></button><button data-act="new">새 탐험<small>4개 구역 · 심층 유물 회수 · 현재 탐험 초기화</small></button><button data-act="fullscreen">전체 화면<small>휴대폰 가로 화면으로 플레이</small></button></div>`),'menu');}
async function fullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('이 브라우저에서는 가로 화면으로 바로 플레이하세요.');}
 catch{toast('전체 화면을 열지 못했습니다. 가로 화면으로 플레이할 수 있습니다.');}
}
function toast(text,bad=false,above=false){const el=$('#toast');el.textContent=text;el.className='show'+(bad?' bad':'')+(above?' toast-above':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='',above?1800:2800);}
function cardMarkup(id,index,action='reward'){
 const c=CARDS[id];return `<button class="ability-choice ${c.family}" data-act="${action}" data-index="${index}" data-id="${id}" aria-label="${c.name}, ${c.text}, 보상으로 선택"><span class="ability-gem">${tokenMarkup(id,{size:100})}</span><small>${gradeLabel(id)}${c.kind}</small><strong class="ability-name">${c.name}</strong>${abilityEffectsMarkup(id)}${abilityNotesMarkup(id)}<span class="choose-label">주머니에 넣기 +</span></button>`;
}
function renderExits(){
 const s=state,enemy=s.rooms[s.pos].enemy?.hp>0;
 const routes=neighbours(s).map(id=>({id,...moveStatus(s,id)}));
 const lureCan=s.phase==='playing'&&!s.pending&&s.resource.skill>=1&&s.lureTurn!==s.turn;
 $('#sceneExits').innerHTML=routes.map(route=>{
  const p=exitAnchor(s.pos,route.id),name=s.rooms[route.id].name,advice=routeAdvice(s,route.id);
  const practiceAllowed=!tutorial||tutorialAllows(tutorial.index,{type:lureMode?'lure':'move',id:route.id},s);
  const allowed=practiceAllowed&&(lureMode?lureCan&&worldPassageOpen(s,s.pos,route.id):route.allowed);
  const verb=lureMode?'유인':route.retreat?'후퇴':'이동';
  const gimmickReason=movementGimmickReason(s,route.id),rule=passageRule(s,s.pos,route.id),g=roomGimmick(s,route.id);
  const badge=rule.label||g?.label||advice.label;
  let note=!practiceAllowed?'안내 후 사용':lureMode?(worldPassageOpen(s,s.pos,route.id)?'기술 1 · 소리 5':'닫힌 문 · 유인 불가'):!route.allowed?(route.reason.includes('정비소')?'정비소에서 준비 후 이동':gimmickReason?(gimmickReason.startsWith('수정')?'수정 동굴 · 다음 턴에 출발':gimmickReason.startsWith('낙하')?'일방통행 · 수문 개방 필요':rule.kind==='key'?'황동 열쇠 필요':'기억실 봉인 해제 필요'):enemy&&!route.retreat?'전투 중 · 이동 불가':`이동력 ${route.cost} 필요`):`이동 ${route.cost} · ${previewNoise(s,moveNoise(s,route.id))?'소리 '+previewNoise(s,moveNoise(s,route.id)):'무음'}`;
  if(hasGimmicks(s)&&route.allowed&&!lureMode&&route.id===2)note+= ' · 턴 정지';
  return `<button class="scene-exit ${allowed?'available':'blocked'} ${route.retreat?'retreat':''} ${lureMode?'lure':''} route-${advice.tone}" data-act="travel" data-id="${route.id}" aria-label="${name} ${verb}, ${advice.label}, ${advice.terrain}, ${note}" aria-disabled="${!allowed}" style="--exit-x:${p.x*100}%;--exit-y:${p.y*100}%"><span class="exit-arrow" aria-hidden="true">${route.retreat?'↶':p.arrow}</span><span class="exit-info"><span class="route-tag"><img src="./assets/v9/props/glyph-${advice.tone==='neutral'?'cache':advice.tone}.png" alt="">${badge} · ${advice.terrain}</span><strong>${esc(name)}</strong><small>${note}</small></span></button>`;
 }).join('');
 $('#sceneExits').hidden=s.phase!=='playing'||!!s.pending;
 const hint=lureMode?'돌멩이를 던질 방을 누르세요':!routes.some(r=>r.allowed)?(hasGimmicks(s)?'통로 조건을 확인하세요 · 메뉴 → 통로와 기믹':'이동력이 부족해요 · 「다음 턴」을 누르세요'):'';
 $('#travelHint').hidden=!hint||s.phase!=='playing'||!!s.pending;$('#travelHint').textContent=hint;
}
function renderObjective(){
 const el=$('#expeditionGoal'),s=state,firstGoal=firstExpeditionGoal(s),route=returnRoute(s),lift=s.edges.some(([a,b])=>a===9&&b===17||a===17&&b===9);
 el.hidden=!!tutorial||s.phase!=='playing';if(el.hidden)return;
 el.classList.toggle('carrying',!!s.relic);
 const quickGoal=firstRunGoal(s),returnGoal=returnForecast(s),context=quickGoal||returnGoal;el.classList.toggle('first-run-goal',!!context);
 if(context){el.innerHTML=`<button data-act="firstRunHelp" aria-label="${esc(context.title)}. 안내 펼치기"><strong>${esc(context.title)}</strong><small>${quickGoal?'깜부기 · 필요하면 안내 보기':'숨결 예고 · 눌러서 확인'}</small></button>`;el.title=context.text;return;}
 if(isStaged(s)){const index=stageIndex(s),ready=s.stagePrepared.filter(Boolean).length;el.innerHTML=`<span>${stageTrackMarkup(s)}<strong class="stage-objective">${s.relic?'용의 기억을 입구로':'심층의 용의 기억을 회수하세요'}</strong><small class="stage-subtitle">${s.relic?`귀환 ${s.countdown}턴 · 보급 ${s.provisions}개`:`${STAGES[index].title} · 층간 준비 ${ready}/3`}</small></span>`;el.title=STAGES[index].description;return;}

 if(firstGoal){el.innerHTML=`<span class="objective-mark" aria-hidden="true">${s.relic?'◆':'◇'}</span><span><strong>${esc(firstGoal.title)}</strong><small>${esc(firstGoal.detail)}</small><em>${esc(firstGoal.note)}</em></span>`;el.title='유물을 하나 품고 입구에서 탈출하면 첫 목표를 이룹니다.';return;}
 el.innerHTML=`<span class="objective-mark" aria-hidden="true">${s.relic?'◆':'◇'}</span><span><strong>${s.relic?'유물을 지상으로':s.layout==='expanded'?'얼마나 깊이 갈까요?':'기존 탐험을 이어갑니다'}</strong><small>${s.relic?`${s.relic.name} · 남은 ${s.countdown}턴${route?` · 확인한 귀환길 ${route.steps}칸`:''}`:s.layout==='expanded'?'B3 18점 → B4 28·42점 → B5 56점':'이전 원정 저장 · 새 탐험은 네 구역 원정'}</small>${s.layout==='expanded'?`<em>${lift?'승강 통로 개방 · B3 ↔ B5':'B5 윈치: 기술 2 · 소리 6으로 귀환길 개방'}</em>`:'<button data-act="new">네 구역 새 원정 →</button>'}</span>`;
 el.title=route?`확인한 통로의 걷기 비용 ${route.cost}. 적과 소음은 별도로 살펴보세요.`:'미탐험 통로는 귀환 예상에 포함하지 않습니다.';
}
function travelTo(id){
 if(poolReveal.active||noiseMoment.active||actionBusy||$('#modal').open||id===state.pos)return false;
 const luring=lureMode,ok=act({type:luring?'lure':'move',id});
 if(ok&&!luring)selectPanel('routes');
 return ok;
}
function render(){
 const s=state,r=s.rooms[s.pos],active=s.phase==='playing',enemy=r.enemy?.hp>0,ra=roomInteraction(s),danger=s.noise>=8;
 document.body.classList.toggle('staged-mode',isStaged(s));document.body.classList.toggle('gimmick-mode',hasGimmicks(s));
 $('.map-legend').innerHTML=hasGimmicks(s)?'<span>▲ 현재</span><span>주황 · 소리</span><span>점선 · 잠금/특수길</span>':'<span>▲ 현재 위치</span><span>주황 · 소리</span><span>빨강 · 적</span>';
 $('.map-report-title').innerHTML=hasGimmicks(s)?'<button data-act="passageGuide">소리의 흔적 · 통로·기믹 보기 ↗</button>':'소리의 흔적';
 $('#provisionAction').hidden=!isStaged(s);if(isStaged(s)){$('#provisionAction').disabled=!active||!!s.pending||s.provisions<1||s.hp===s.maxHp||s.provisionTurn===s.turn||healingLeft(s)===0;$('#provisionAction strong').textContent=`보급 ${s.provisions}`;$('#provisionAction').title=`체력 +${healingAmount(s,hasRisk(s)?RISK.heal:6)} · 소리 ${previewNoise(s,3)} · 턴마다 한 번${hasRisk(s)?' · '+healingNote(s):''}`; }
 $('#enemyOverlay').innerHTML=enemy?`<span class="enemy-state ${r.enemy.mode}">${ALERTS[r.enemy.mode]}${r.enemy.anchored?' · 자리 수호':''}</span><strong>${r.enemy.name}</strong><div class="enemy-life"><i style="width:${r.enemy.hp/r.enemy.maxHp*100}%"></i></div><small>HP ${r.enemy.hp} / ${r.enemy.maxHp} · 반격 ${r.enemy.damage}</small>`:'';
 $('#resources').innerHTML=[['sword','dagger','공격력'],['move','boot','이동력'],['skill','book','기술'],['block','shield','방어']].map(([key,icon,name])=>`<div class="resource ${key}" aria-label="${name} ${s.resource[key]}"><div class="res-top">${ico(icon,28)}<span>${name}</span></div><div class="res-number"><strong>${s.resource[key]}</strong></div></div>`).join('');
 $('#poolStatus').innerHTML=`${s.resource.quiet?`<span>은신 ${s.resource.quiet}</span>`:''}${s.resource.rattle?`<span class="rattle">첫 소음 +${s.resource.rattle}</span>`:''}`;
 $('#handCount').textContent=s.played.length;
 const hp=pageOf(s.played,handPage,5);handPage=hp.page;
 $('#hand').innerHTML=hp.items.map((id,i)=>{const a=CARDS[id];return `<span class="draw-token ${a.family}" style="--delay:${i*65}ms"><span class="token-icon">${tokenMarkup(id,{size:34})}</span><strong>${a.name}</strong></span>`;}).join('');
 $('#poolDetails').title='눌러서 메달별 큰 효과와 키워드 설명 보기';
 $('#poolDetails').setAttribute('aria-label',`이번 추출 ${s.played.length}개 자세히 보기: ${hp.items.map(id=>CARDS[id].name).join(', ')}`);
 $('#handPager').hidden=hp.pages===1;$('#handPager').innerHTML=hp.pages>1?`<button data-act="handPage" data-page="${(hp.page+1)%hp.pages}" aria-label="추출 다음 페이지, 현재 ${hp.page+1} / ${hp.pages}">${hp.page+1}/${hp.pages} →</button>`:'';
 const snd=s.lastSound,recent=snd&&snd.turn===s.turn,alerted=s.rooms.filter(x=>x.seen&&x.enemy?.hp>0&&x.enemy.mode!=='idle');
 const ep=pageOf(alerted,enemyPage,1);enemyPage=ep.page;
 $('#dangerPanel').innerHTML=`<div class="last-sound"><span>${recent?`${esc(snd.label)} · 소리 <b>${snd.strength}</b>`:'아직 소리가 나지 않았습니다'}</span><small>${recent?`발생 ${snd.raw}${snd.absorbed?` − 은신 ${snd.absorbed}`:''} · ${snd.heard.length}명이 들음`:`통로마다 −${soundLoss(s)} · 이끼에서 추가 −1`}</small></div><div class="enemy-report">${alerted.length?`<div class="listening-enemies">${ep.items.map(x=>`<div><i class="alert-eye">${x.enemy.mode==='hunt'?'!':'?'}</i><span>${x.enemy.name}<small>${x.name} · ${ALERTS[x.enemy.mode]}</small></span><b>${x.enemy.anchored?'수호':x.id===s.pos?'교전':x.enemy.mode==='listen'?'대기':'조사'}</b></div>`).join('')}</div>${ep.pages>1?`<button class="enemy-next" data-act="enemyPage" data-page="${(ep.page+1)%ep.pages}" aria-label="다음 반응한 적, 현재 ${ep.page+1} / ${ep.pages}">${ep.page+1}/${ep.pages} →</button>`:''}`:`<div class="silence-note">${recent&&snd.heard.length?'미탐험 구역에서 기척이 느껴짐':'경계 중인 적이 보이지 않음'}</div>`}</div>`;
 if(s.relic){const plan=breathPlan(s),due=dragonDue(s),impact=turnImpact(s),taken=due?Math.max(0,plan.damage-impact.block):0;$('#dangerPanel').insertAdjacentHTML('beforeend',`<div class="breath-forecast ${due&&plan.hit?'hot':''}" role="status"><strong>${due?(plan.hit?`지금 턴을 마치면 숨결이 닿아요 · 방어 후 피해 ${taken}`:'지금 턴을 마치면 숨결이 이 방을 비켜 갑니다'):'이번 턴에는 숨결이 예고되지 않았어요'}</strong><small>현재 메아리 기준 · 이동하거나 소리를 내면 예보가 바뀝니다.</small></div>`);}
 const hideCan=active&&!s.pending&&!enemy&&s.hideTurn!==s.turn&&s.resource.move>=1,lureCan=active&&!s.pending&&s.lureTurn!==s.turn&&s.resource.skill>=1;
 $('#stanceLabel').textContent=s.mode==='sneak'?'은밀':MODES[s.mode].name;$('#stanceToggle').disabled=!active||!!s.pending;
 $('#stanceMenu').innerHTML=`<span class="stance-heading">이동 방식 <small>현재 바닥 · ${TERRAINS[r.terrain].name}</small></span>${['walk','sneak','rush'].map(id=>{const allowed=!tutorial||tutorialAllows(tutorial.index,{type:'mode',id},s);return `<button data-act="mode" data-id="${id}" aria-pressed="${s.mode===id}" class="${s.mode===id?'selected':''}" ${allowed?'':'disabled'} title="${allowed?'':esc(tutorialActionReason(tutorial.index,{type:'mode',id},s))}"><strong>${id==='sneak'?'은밀':MODES[id].name}</strong><small>${!allowed?'지금은 안내된 이동 사용':id==='sneak'?'이동 +1 · 소리 감소':id==='rush'?'깊은 층 이동 −1 · 소리 5':'기본 이동 · 소리 2'}</small><span aria-hidden="true">${s.mode===id?'✓':''}</span></button>`;}).join('')}`;
 $('#lureToggle').disabled=!lureCan&&!lureMode;$('#lureToggle').setAttribute('aria-pressed',String(lureMode));$('#lureToggle strong').textContent=lureMode?'유인 취소':'유인';$('#hideAction').disabled=!hideCan;$('#marketToggle').disabled=!active||!!s.pending||isStaged(s)&&(checkpointIndex(s)<0||!!enemy);$('#marketToggle strong').textContent=isStaged(s)?'정비소':'교역';const marketHint=isStaged(s)?checkpointIndex(s)<0?'정비소에서 열림':enemy?'적 처치 후 이용':s.stagePrepared[checkpointIndex(s)]===null?'먼저 준비 선택':'능력·열쇠 교역':'녹스의 기억함';$('#marketToggle small').textContent=marketHint;$('#marketToggle').title=marketHint;$('#marketToggle').setAttribute('aria-label',`${isStaged(s)?'정비소':'교역'} · ${marketHint}`);
 $('#landscapeStatus').innerHTML=`<span class="hud-hero">${portrait(s.role)}</span><div class="hud-health" role="meter" aria-label="체력" aria-valuemin="0" aria-valuemax="${s.maxHp}" aria-valuenow="${s.hp}"><i style="width:${s.hp/s.maxHp*100}%"></i><b>${s.hp} / ${s.maxHp}</b></div><span class="hud-gold">${ico('coin',20)} ${s.gold}</span><div class="hud-location"><span>${stageLabel(s)} · ${r.name}</span><small>T${String(s.turn).padStart(2,'0')}${s.relic?' · 귀환 '+s.countdown+'턴':''}</small></div><div class="hud-noise ${danger?'hot':''}" role="meter" aria-label="용의 경계" aria-valuemin="0" aria-valuemax="12" aria-valuenow="${s.noise}"><span class="hud-noise-pips" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i class="${i<s.noise?'lit':''}"></i>`).join('')}</span><span>경계 <strong>${s.noise}</strong><small> / 8</small></span>${s.echo?.[s.pos]?`<span class="hud-bag" title="이 방에 남은 메아리 · 용의 숨결이 따라옵니다"><img src="./assets/v9/props/echo-marker.png" alt="메아리"> ${s.echo[s.pos]}</span>`:''}</div>`;
 const risks=[];if(hasRisk(s)&&s.noise>=5&&s.noise<8)risks.push('경계 5 이상 · 적이 더 멀리 듣습니다');if(enemy)risks.push(`반격 ${r.enemy.damage}`);if(s.echo){if(dragonDue(s))risks.push(s.echo[s.pos]?`용의 숨결 · 이 방 메아리 ${s.echo[s.pos]}`:'용의 숨결 · 이 방은 조용함');}else if(danger)risks.push(`용의 공격 ${3+Math.floor(s.turn/10)}`);else if(s.relic&&s.turn%3===0)risks.push('용의 공격 2');
 $('#turnRisk').textContent=active?(risks.length?risks.join(' · '):'남은 자원은 사라집니다'):'탐험 완료';$('#turnRisk').classList.toggle('hot',risks.length>0);
 $('#endTurn').disabled=!!s.pending;$('#endTurn').dataset.act=active?'end':tutorial?'tutorialExit':'result';$('#endTurn>span').textContent=active?'다음 턴':tutorial?'내 탐험 결산':'탐험 결과';$('#endTurn>small').textContent=active?'메달 5개 새로':tutorial?'원래 탐험은 그대로':'기록 보기';
 renderExits();renderInteraction(ra);renderPracticeControls();renderTutorial();renderObjective();renderMarket();paintIcons();
}

function renderPracticeControls(){
 for(const id of ['endTurn','hideAction','lureToggle']){
  const button=$('#'+id);if(button.dataset.tutorialBlocked){delete button.dataset.tutorialBlocked;button.removeAttribute('title');button.removeAttribute('aria-description');}
 }
 if(!tutorial||state.phase!=='playing')return;
 const step=TUTORIAL_STEPS[tutorial.index],checks=[['endTurn',{type:'end'}],['hideAction',{type:'hide'}],['lureToggle',{type:'lure',id:step?.id??neighbours(state)[0]}]];
 for(const [id,action]of checks){
  if(id==='lureToggle'&&lureMode)continue;
  if(tutorialAllows(tutorial.index,action,state))continue;
  const button=$('#'+id),reason=`지금은 「${step?.title||'탐험 결산'}」 단계입니다. 현재 안내를 마치면 사용할 수 있어요.`;
  button.disabled=true;button.dataset.tutorialBlocked='true';button.title=reason;button.setAttribute('aria-description',reason);
  if(id==='endTurn')$('#endTurn>small').textContent='안내된 행동 뒤 사용';
 }
}

function openModal(html,mode){
 setStanceMenu(false);const d=$('#modal');if(!d.open)lastFocus=document.activeElement;
 dialogMode=mode;d.dataset.mode=mode;$('#modalContent').innerHTML=html;paintIcons(d);if(!d.open)d.showModal();
 const first=d.querySelector('button:not([disabled])');first?.focus({preventScroll:true});
}
const modalShell=(title,eyebrow,body,close=true)=>`<div class="modal-inner"><div class="modal-top"><div><span class="eyebrow">${eyebrow}</span><h2 id="modalTitle">${title}</h2></div>${close?'<button class="close-button" data-act="close" aria-label="닫기">×</button>':''}</div>${body}</div>`;
function closeModal(){
 if(dialogMode==='glossary'&&glossaryBack){const back=glossaryBack;glossaryBack=null;back();return;}
 if(dialogMode==='market'&&isStaged(state)&&checkpointIndex(state)>=0){openStageCamp();return;}
 if(dialogMode==='new'&&firstExpeditionSelected&&lastTutorialRecap){firstExpeditionSelected=false;showBriefing(lastTutorialRecap);return;}
 firstExpeditionSelected=false;
 if(state.pending){if(['briefing','tutorialResume','new'].includes(dialogMode)){pendingModal();return;}toast('보상을 고르거나 건너뛰기를 눌러 주세요.');return;}
 $('#modal').close();dialogMode='';lastFocus?.focus({preventScroll:true});
}
function pendingModal(page=0){
 if(state.pending?.type==='reward')openModal(modalShell('승리의 전리품','보상 선택',`${lastReceipt?`<p class="action-receipt">${esc(lastReceipt)}</p>`:''}<p class="modal-sub">새 능력 하나를 메달 주머니에 넣으세요. 주머니를 다시 섞을 때부터 나올 수 있습니다.</p><div class="modal-cards">${state.pending.options.map((id,i)=>cardMarkup(id,i,'reward')).join('')}</div><div class="modal-actions"><span class="modal-sub" style="margin:0">${tutorial?'연습 보상은 실전에 이어지지 않습니다.':'주머니가 가벼우면 좋은 메달이 더 자주 나옵니다.'}</span><button class="keyword-button" data-act="glossary" data-return="reward">키워드 뜻 보기</button><button class="subtle-button" data-act="skipReward">받지 않고 계속 →</button></div>`,false),'reward');
 else if(state.pending?.type==='purge'){
  const v=pageOf(state.pending.options,page);
  openModal(modalShell('내려놓을 기억','능력 지우기',`<p class="modal-sub">선택한 능력 하나를 영구 제거합니다. ${state.pending.checkpoint!==undefined?'고르면 이번 정비 선택이 완료됩니다.':'제단은 한 번만 쓸 수 있습니다.'}</p><div class="deck-list">${v.items.map(id=>`<button class="deck-item" data-act="purge" data-id="${id}">${tokenMarkup(id,{size:54})}<div><strong class="ability-name">${CARDS[id].name}</strong>${abilityEffectsMarkup(id)}${abilityNotesMarkup(id)}</div><b>제거</b></button>`).join('')}</div><div class="modal-actions">${pager(v,'purgePage')}<button class="subtle-button" data-act="cancelPurge">지금은 지나가기</button></div>`,false),'purge');
 }
}
function showResult(){
 const s=state,won=s.phase==='won',bonuses=expeditionBonuses(s);
 const detail=won?(isStaged(s)?`심층 유물 ${s.relic.value} + 귀환 20 + 체력 ${s.hp} + 진행 효율 ${bonuses.tempo} + 소음 관리 ${bonuses.quiet}`:`유물 ${s.relic.value} + 금화 ${s.gold} + 탐험 ${s.rooms.filter(r=>r.visited).length*2} + 남은 체력 ${s.hp} + 탈출 20`):(isStaged(s)?'층 사이 정비에서 공격·이동·은신의 비중을 고르고, 보급과 귀환 승강기를 준비하세요.':'휴식과 방어로 체력을 지키고, 필요하다면 낮은 가치의 유물부터 노려 보세요.');
 openModal(modalShell(won?'금고에서 살아 돌아왔습니다.':'불씨는 아직 꺼지지 않았습니다.',won?'탐험 완료':'탐험 종료',`<div class="result-hero">${won?itemMarkup(s.relic.value===56?'dragon-memory':s.relic.icon==='crown'?'crown':s.relic.icon==='heartgem'?'heart':'moon',96):itemMarkup('camp',80)}<p class="modal-sub" style="margin:0">${esc(s.reason||'이번 탐험의 결과입니다.')}</p>${won?`<div class="score">${s.score}</div><span class="score-label">탐험 점수${s.score>=best?' · 최고 기록':''}</span>`:''}</div><div class="result-stats"><div><strong>${s.turn}</strong><small>진행 턴</small></div><div><strong>${s.kills}</strong><small>격파한 적</small></div><div><strong>${isStaged(s)?s.deck.length+s.discard.length+s.played.length:s.rooms.filter(r=>r.visited).length}</strong><small>${isStaged(s)?'능력 풀':'탐험한 방'}</small></div><div><strong>${s.gold}</strong><small>남은 금화</small></div></div><p class="result-breakdown">${detail}</p><div class="modal-actions"><button class="subtle-button" data-act="close">던전 돌아보기</button><button class="large-button" data-act="new">새로운 탐험 →</button></div>`),'result');
}
function showNew(first=false){
 firstExpeditionSelected=first;selectedRole=state.role;
 renderNew();
}
function renderNew(){
 openModal(modalShell('누가 심층까지 내려갈까요?','상층 · 중층 · 하층 · 심층',`<p class="modal-sub">${firstExpeditionSelected?'목표는 심층의 용의 기억을 회수해 입구로 가져오기입니다.':'세 정비소에서 능력 영입·메달 정리·보급을 선택해 심층과 귀환을 준비하세요.'} 새 탐험을 시작하면 현재 진행은 초기화되고 최고 기록은 남습니다.</p><div class="role-list" role="radiogroup" aria-label="직업 선택">${Object.entries(ROLES).map(([key,r])=>`<button class="role-option ${key===selectedRole?'selected':''}" data-act="role" data-id="${key}" role="radio" aria-checked="${key===selectedRole}">${portrait(key,'select-portrait')}<strong>${r.name}</strong><span>${r.desc}</span><small>${r.trait}</small></button>`).join('')}</div><label class="first-run-toggle"><input id="firstRunToggle" type="checkbox" ${firstExpeditionSelected?'checked':''}> 깜부기의 짧은 상층 안내와 함께</label><div class="modal-actions"><button class="subtle-button" data-act="close">현재 탐험으로 돌아가기</button><button class="large-button" data-act="start">금고로 내려가기 →</button></div>`),'new');
}
const guide=[
 ['01 / 추출','뽑고, 자동으로 합산','「다음 턴」은 턴을 마치고 메달 주머니에서 능력 5개를 하나씩 공개합니다. 추가 추출도 자동입니다. 큰 공격력·이동력 숫자가 지금 쓸 수 있는 힘입니다.','남은 자원은 다음 턴에 사라집니다. 기술은 영입·유인, 방어는 피해 흡수에 쓰입니다. 추출 연출은 건너뛰거나 메뉴에서 빠르게 바꿀 수 있습니다.'],
 ['02 / 발소리','발밑을 살피세요','던전의 금빛 방 이름을 누르면 이동합니다. 미니맵은 소리 지도를 펼칩니다. 걷기: 이동 1 · 기본 소리 2. 살금살금: 이동 +1 · 기본 소리 0. 질주: 깊은 층 이동 −1 · 소리 5.','물웅덩이 소리 +1, 돌 파편 +2, 이끼 −1. 이동 버튼에는 최종 소리가 표시됩니다. 적이 있는 방에서는 전투하거나 들어온 방으로 후퇴하세요.'],
 ['03 / 청취','소리는 통로를 따라 퍼집니다','미니맵을 누르면 소리 지도가 열립니다. 소리는 통로를 건널 때 2, 이끼 방에서는 1이 더 줄어듭니다. 주황색은 도달 범위입니다.','들은 적은 청취 → 조사 → 추적으로 경계합니다. 턴 끝에 조사·추적 중인 적이 마지막 소리의 방으로 한 칸 이동합니다. 유물 수호자는 자리를 지킵니다.'],
 ['04 / 유인','소리로 길을 만드세요','돌멩이 유인을 켜고 연결된 방을 누르세요. 기술 1로 그 방에 소리 5를 내어 적의 목적지를 바꿉니다.','숨죽이기: 이동 1 · 경계 −2 · 은신 +2. 유인과 숨죽이기는 각각 턴당 한 번입니다. 은신은 내 소음을 줄인 만큼만 소모하며 남은 양은 이번 턴에 계속 씁니다. 첫 소음은 다음 내 소리 행동에 한 번 추가됩니다. 둘 다 유인에는 적용되지 않습니다.'],
 ['05 / 위험','금고가 깨어나기 전에','소리 크기의 절반을 올림한 값이 경계에 누적됩니다. 경계 8 이상이면 턴 끝에 용의 숨결이 메아리를 따라 번집니다. 소리를 낸 방마다 메아리가 남으니, 턴을 넘기기 전에 조용한 방으로 피하거나 돌멩이로 다른 곳에 메아리를 만들어 두세요. 새 턴에 경계 −2, 도적은 추가 −1.','같은 방의 적은 턴 끝에 반격합니다. 추적으로 도착한 적은 그 다음 턴부터 반격합니다. 방어로 피해를 줄이고, 캠프에서 체력을 회복하세요.'],
 ['06 / 원정','네 구역과 층간 정비','새 원정은 상층 → 중층 → 하층 → 심층으로 이어집니다. 각 정비소에서 능력 영입·메달 정리·보급 중 하나를 골라야 다음 구역이 열립니다.','추가 교역은 각 정비소에서 한 번입니다. 깊이 갈수록 메아리가 더 오래 남습니다. 휴대 보급은 턴마다 한 번 체력6을 회복하지만 기본 소리3을 냅니다.'],
 ['07 / 탈출','유물을 들고 입구로','유물을 얻으면 귀환 제한 14턴이 시작되고 턴을 마칠 때마다 1 줄어듭니다. 경계가 낮아도 3·6·9…턴에는 용의 숨결이 예고됩니다. 메아리도 더 오래 남습니다. 소리 지도에서 실제 피해 경로를 확인하세요. 낮은 가치의 유물로도 탈출할 수 있습니다.','점수 = 유물 + 금화 + 방문 방 × 2 + 남은 체력 + 탈출 20.\n키보드: 방향키 이동 · 1/2/3 이동 방식 · A 공격 · E 상호작용 · C 숨죽이기 · Space 다음 턴.']
];
function showHelp(page=0){
 const v=pageOf(guide,page,1),[tag,title,first,second]=v.items[0],riskInfo=hasRisk(state)?`<p class="risk-rule-note">걷기 이동 비용은 상층1, 중층부터2입니다. 깊이 갈수록 적이 강해집니다. 숨결 피해 = 3 + 방의 메아리 ×2 + 현재 구역 깊이(상층0~심층3). 경계5 이상이면 소리는 통로마다1씩만 줄어 적이 더 멀리 듣습니다. ${healingNote(state)}. 보급 최대${RISK.heal}, 정비·휴식 최대${RISK.prepareHeal} 회복이며 메달의 회복도 같은 한도를 씁니다.</p>`:'',intro=isStaged(state)&&tag.startsWith('07')?'심층의 용의 기억을 회수해 입구에서 탈출하세요. 회수 후 귀환 제한 14턴이 시작되고, 경계가 낮아도 3·6·9…턴에 숨결이 예고됩니다. 얕은 층에서는 목표 유물을 얻을 수 없습니다.':first,detail=isStaged(state)&&tag.startsWith('07')?'새 원정 점수는 심층 유물 + 귀환20 + 남은 체력 + 진행 효율 + 소음 관리입니다. 진행 효율은 60−턴, 소음 관리는 30−실제 소음 합계/3의 올림이며 최소0입니다. '+(hasGimmicks(state)?'금화는 교역 목록 교체와 황동 열쇠 구매에 씁니다.':'금화는 교역 목록 교체에 씁니다.')+'':second;
 openModal(modalShell('소리를 다루는 탐험가','탐험 안내서',`<article class="guide-page"><span>${tag}</span><h3>${title}</h3><p>${intro}</p><p>${hasRisk(state)?detail.replaceAll('체력6','체력'+RISK.heal):detail}</p>${riskInfo}</article><div class="modal-actions">${pager(v,'helpPage')}<button class="large-button" data-act="close">탐험 계속하기 →</button></div>`),'help');
}
function showDeck(pile='all',page=0){
 const labels={all:'전체 주머니',deck:'대기 중',discard:'다음 순환',played:'이번 추출'};
 if(!labels[pile])pile='all';
 const ids=pile==='all'?[...state.hand,...state.deck,...state.discard,...state.played]:state[pile];
 const counts={};ids.forEach(id=>counts[id]=(counts[id]||0)+1);
 const v=pageOf(Object.entries(counts),page);
 openModal(modalShell('나의 메달 주머니','능력 목록',`<div class="deck-tabs">${Object.entries(labels).map(([k,x])=>`<button class="${pile===k?'selected':''}" data-act="deck" data-pile="${k}">${x}</button>`).join('')}</div><p class="ability-reading-note">추출된 효과는 자동 합산됩니다. 공격·이동·기술·방어는 이번 턴에 사용하고, 금화·회복한 체력은 유지됩니다.</p><button class="keyword-button" data-act="glossary" data-return="deck" data-pile="${pile}" data-page="${v.page}">능력·키워드 뜻 보기</button><p class="modal-sub">${labels[pile]} · ${ids.length}개${pile==='deck'?' · 추출 순서는 비공개':''}</p><div class="deck-list">${v.items.map(([id,n])=>`<div class="deck-item">${tokenMarkup(id,{size:54})}<div><strong class="ability-name">${CARDS[id].name}</strong>${abilityEffectsMarkup(id)}${abilityNotesMarkup(id)}</div><b>×${n}</b></div>`).join('')||'<p class="empty-list">아직 능력이 없습니다.</p>'}</div>${pager(v,'deckPage',`data-pile="${pile}"`)}`),'deck');
}
function openStageCamp(recruit=false){if(!isStaged(state)||checkpointIndex(state)<0||state.rooms[state.pos].enemy?.hp>0)return;openModal(modalShell(state.rooms[state.pos].name,'능력 풀을 준비하는 곳',stageCampMarkup(state,recruit)),'stageCamp');}
function showPassageGuide(mode=state.mode){if(!hasGimmicks(state))return;guideTravelMode=mode;openModal(modalShell('통로와 기믹',state.rooms[state.pos].name,passageGuideMarkup(state,mode)),'passageGuide');}
function showConduit(){if(hasGimmicks(state)&&state.pos===16)openModal(modalShell('고요의 공명제단','부수거나, 기억을 맞추거나',conduitMarkup(state)),'conduit');}
function showStagePlan(){if(!isStaged(state))return;openModal(modalShell('심층 원정 계획','능력 풀과 소음 관리',stagePlanMarkup(state)),'stagePlan');}
function showGlossary(from='menu',pile='all',page=0){
 glossaryBack=from==='market'?()=>openMarket():from==='reward'?()=>pendingModal():from==='deck'?()=>showDeck(pile,page):()=>showMenu();
 const memory=state.echo?`현재 메아리는 ${echoFadeEvery(state)}턴마다 1씩 옅어집니다. ${isStaged(state)?'아래 구역으로 들어갈수록':'유물을 얻을수록'} 최대 ${MEMORY_MAX+1}턴 간격까지 길어집니다.`:'';
 openModal(modalShell('능력과 키워드','메달을 읽는 법',`<p class="ability-reading-note">큰 숫자는 메달 하나의 효과입니다. 추출되면 자동으로 적용됩니다.</p>${glossaryMarkup()}${hasRisk(state)?`<p class="risk-rule-note">${healingNote(state)}. 메달·보급·정비·휴식의 실제 회복을 모두 합산합니다. 회복 한도를 다 쓰면 체력은 회복되지 않습니다. 경계5 이상에서는 통로당 소리 감소가2에서1로 줄어듭니다. 숨결 피해는3 + 현재 방 메아리×2 + 구역 깊이(0~3)이며 방어로 줄일 수 있습니다.</p>`:''}<dl class="keyword-list"><div><dt>유물의 대가 · 귀환</dt><dd>첫 유물을 얻으면 귀환 제한 14턴이 시작됩니다. 턴을 마칠 때마다 1 줄어들며, 입구에서 「탈출」해야 완료됩니다. ${isStaged(state)?'새 원정은 심층의 용의 기억을 회수해야 완료됩니다.':'유물을 바꿔도 남은 시간은 초기화되지 않습니다.'}<small>유물을 들고 있으면 3·6·9…턴에도 숨결이 예고됩니다. 경계 8 이상에서도 숨결이 옵니다. 소리 지도에서 실제 경로와 피해를 확인하세요. ${memory}</small>${state.relic?`<small>지금은 ${state.relic.name} 회수 · 귀환 ${state.countdown}턴 남음.</small>`:''}</dd></div></dl><div class="modal-actions"><button class="keyword-button" data-act="close">${from==='market'?'교역':from==='reward'?'보상 선택':from==='deck'?'메달 목록':'메뉴'}으로 돌아가기</button></div>`),'glossary');
}
function showLog(page=0){
 const v=pageOf(state.log,page,3);
 openModal(modalShell('어둠 속에 남긴 발자국','탐험 기록',`<p class="modal-sub">탐험 코드 ${state.seed.toString(36).toUpperCase()} · 최근 행동부터</p><div class="log-list">${v.items.map(x=>`<div class="log-row ${x.tone}"><small>T${String(x.turn).padStart(2,'0')}</small><span>${esc(x.message)}</span></div>`).join('')}</div>${pager(v,'logPage')}`),'log');
}
function showLurePreview(id){
 const forecast=lureForecast(state,id);if(!forecast.ok){toast(forecast.reason,true);return false;}
 lurePreviewTarget=id;
 const relevant=forecast.moves.filter(e=>e.heard||['move','counter'].includes(e.kind));
 const detail=e=>e.kind==='move'?`${e.fromName} → ${e.toName}${e.entersPlayer?' · 내 방으로 들어옴':''}`:e.kind==='counter'?'현재 방에서 반격합니다':e.kind==='anchored'?'소리를 들어도 이 자리를 지킵니다':e.kind==='listen'?'소리를 듣지만 아직 이동하지 않습니다':e.kind==='at-target'?'소리가 난 방에 그대로 머뭅니다':'이번 턴에는 이동하지 않습니다';
 openModal(modalShell('돌멩이를 던지기 전에','유인 · 적의 다음 한 칸',`<p class="modal-sub"><strong>${esc(state.rooms[id].name)}</strong> · 기술 ${forecast.cost} · 소리 ${forecast.noise}</p><p class="${forecast.entersPlayer?'lure-warning':'modal-sub'}">${esc(forecast.summary)}</p><ul class="lure-forecast-list">${relevant.map(e=>`<li><strong>${esc(e.name)}</strong><p>${esc(detail(e))}</p><small>${e.heard?'이 유인 소리를 들음':'이전에 들은 소리를 따라감'}</small></li>`).join('')||'<li>확인한 적의 반응이 없습니다. 보이지 않는 적은 예고에 표시되지 않습니다.</li>'}</ul><p class="modal-sub">${esc(forecast.assumption)}의 예고입니다. 이후 움직이거나 다른 소리를 내면 추적 방향이 달라집니다.</p><div class="modal-actions"><button class="subtle-button" data-act="lureCancel">다른 방 선택</button><button class="large-button" data-act="lureConfirm">이 방으로 유인 · 기술 1</button></div>`),'lurePreview');
 return true;
}
function act(action,fromJudge=false){
 if(poolReveal.active||noiseMoment.active&&!fromJudge||actionBusy||action.type==='move'&&performance.now()<travelUntil)return false;
 if(tutorial&&!tutorialAllows(tutorial.index,action,state)){toast(tutorialActionReason(tutorial.index,action,state)||'탐험 결산을 확인해 보세요.');return false;}
 if(action.type==='lure'&&!action.confirmed)return showLurePreview(action.id);
 if(action.type==='end'&&!action.drawn&&state.echo&&state.phase==='playing'&&!state.pending&&dragonDue(state)){
  const f=turnImpact(state);
  if(!f.lethal){noiseMoment.judge(state,breathPlan(state),f.block,()=>act({...action,drawn:true},true),()=>{});return true;}
 }
 const practiceStep=TUTORIAL_STEPS[tutorial?.index],practiceBefore=tutorial?structuredClone(state):null,beforeHP=state.hp,priorRelic=state.relic?.value||0,wasRelic=!!state.relic,roomType=state.rooms[state.pos].type,enemyHP=state.rooms[state.pos].enemy?.hp||0,enemyMax=state.rooms[state.pos].enemy?.maxHp||0,previousNoise=state.noise,previousSeq=state.soundSeq,previousGold=state.gold;
 const impact=action.type==='end'?turnImpact(state):null;
 const boughtId=action.type==='buy'?state.market[action.index]:null,firstBefore=state.firstRun?.enabled?structuredClone(state):null;
 const result=apply(state,action);if(!result.ok){if(fromJudge)noiseMoment.close();toast(result.message,true);beep('bad');return false;}
 if(firstBefore)recordFirstRun(firstBefore,action,state);lastReceipt=firstBefore?actionReceipt(firstBefore,action,state):'';
 if(boughtId)state.tradeStory={met:true,identity:MERCHANT.identity,lastBuy:boughtId};
 const practiceFeedback=tutorial?recordTutorialAction(tutorial.journal,practiceBefore,action,state):'';
 if(action.type==='move'){travelUntil=performance.now()+450;renderer.setHover(-1);if(mapOpen)selectPanel('routes');}
 if(action.type==='end'){handPage=0;enemyPage=0;lureMode=false;}if(action.type==='lure')lureMode=false;
 persistTutorial({action,feedback:practiceFeedback||result.message});save();render();
 let swingMs=580;if(action.type==='attack'){const foeAfter=state.rooms[state.pos].enemy,dealt=enemyHP-(foeAfter?.hp||0);swingMs=renderer.burst('attack',`−${dealt}`,{dmg:dealt,kill:enemyHP>0&&!(foeAfter?.hp>0),maxHp:foeAfter?.maxHp||enemyMax})||580;}
 const specialFx=action.type==='interact'&&roomType==='mechanism'?'mechanism':action.type==='interact'&&(state.relic?.value||0)>priorRelic?'relic':'';
 const rewardText=state.gold>previousGold?`+${state.gold-previousGold} G`:state.hp>beforeHP?`+${state.hp-beforeHP} HP`:specialFx==='relic'?'유물 회수':specialFx==='mechanism'?'승강 통로 개방':'';
 if(rewardText&&action.type!=='attack'&&!specialFx)renderer.burst('reward',rewardText);if(state.hp<beforeHP)renderer.burst('bad');
 const tense=tensionNeeded(state,action,previousSeq,previousNoise),actionRun=state;
 const finish=()=>{
  if(state!==actionRun)return;actionBusy=false;advanceTutorial(action,practiceFeedback||result.message);if(rewardText)renderer.burst(specialFx||'reward',rewardText);
  if(specialFx)toast(specialFx==='relic'?`${state.relic.name} 회수 · 귀환 ${state.countdown}턴`:isStaged(state)?'상층 귀환 승강기 개방 · 기술 −3':'B3 승강 통로 개방 · 기술 −2',false,true);
  else if(!['mode','end'].includes(action.type))toast(firstBefore&&actionReceipt(firstBefore,action,state)||soundNotice(state,previousSeq,result.message,previousNoise));
  if(state.pending)pendingModal();
  else if(state.phase!=='playing'){
   if(!tutorial)showResult();
   else if(state.phase==='lost')showTutorialLoss();
   beep(state.phase==='won'?'win':'bad');
  }
  else if(['reward','skipReward','purge','cancelPurge'].includes(action.type)){$('#modal').close();dialogMode='';}
  else if(tutorial&&action.type==='buy'&&dialogMode){$('#modal').close();dialogMode='';}
  if(boughtId){
   const returnToShop=!tutorial;$('#modal').close();dialogMode='';
   cutscene.play(purchaseLines(boughtId,CARDS[boughtId],!!tutorial),()=>{if(state===actionRun&&returnToShop)openMarket(`「${CARDS[boughtId].name}」을 주머니에 넣었습니다. 다음 순환부터 만날 수 있어요.`);},merchantScene());
  }
  if(!tutorial&&isStaged(state)&&checkpointIndex(state)>=0&&!state.pending){if(['prepare','purge'].includes(action.type)){$('#modal').close();dialogMode='';cutscene.play(stageChoiceLines(action),()=>{if(state===actionRun)openStageCamp();},merchantScene());}else if(['cancelPurge','buyKey'].includes(action.type))openStageCamp();}
  if(!tutorial&&dialogMode==='conduit'&&['quietSeal','interact'].includes(action.type))showConduit();
  if(action.type==='end'&&state.phase==='playing'&&!state.pending){const draw=()=>poolReveal.start(state,{fast:tutorial?!!practiceStep?.fastDraw:state.firstRun?.enabled?true:fastDraw,explain:!!state.firstRun,holdSummary:!!firstRunMemory(state),holdNoise:!!tutorial,beforeHp:beforeHP,memory:tutorial&&practiceStep?.key==='draw-recruit'?{id:'spark',source:'녹스가 맡긴 사수의 기억',line:'끝까지 겨눴던 손의 온기가 단검에 옮겨붙습니다.'}:firstRunMemory(state)});if(tutorial&&practiceStep?.key==='wait-lure')cutscene.play(TUTORIAL_TURN,draw);else draw();}
  document.body.classList.remove('turn-impact');
 };
 if(fromJudge&&state.attack){actionBusy=true;document.body.classList.add('turn-impact');noiseMoment.spin(state,state.attack,finish);}
 else if(fromJudge&&noiseMoment.active){noiseMoment.close();finish();}
 else if(impact?.raw){actionBusy=true;document.body.classList.add('turn-impact');noiseMoment.dragon(impact,previousNoise,finish,{hold:!!tutorial});}
 else if(tense){actionBusy=true;if(action.type==='attack')setTimeout(()=>{if(state===actionRun)noiseMoment.start(state,previousNoise,finish,{hold:!!tutorial});},swingMs);else noiseMoment.start(state,previousNoise,finish,{hold:!!tutorial});}
 else{
  if(!['mode','end'].includes(action.type))beep(action.type==='buy'||action.type==='reward'?'buy':action.type==='move'?'move':action.type==='attack'?'attack':action.type==='lure'?'lure':!wasRelic&&state.relic?'relic':'card');
  if(action.type==='attack'&&state.pending){actionBusy=true;setTimeout(finish,swingMs+20);}else finish();
 }
 return true;
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('button[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;
 if(poolReveal.active||noiseMoment.active||actionBusy)return;
 if(a==='firstRunStart')return beginFirstRun();
 if(a==='firstRunHelp')return showFirstRunHelp();
 if(a==='firstRunDismiss'){if(state.firstRun)state.firstRun.enabled=false;save();closeModal();render();return;}
 if(a==='travel')return travelTo(Number(b.dataset.id));
 if(a==='stance'){setStanceMenu(!modeOpen);return;}
 if(a==='market'){if(isStaged(state)&&checkpointIndex(state)>=0&&state.stagePrepared[checkpointIndex(state)]===null)return openStageCamp();return showMarket();}
 if(a==='stageCamp')return openStageCamp();
 if(a==='stageRecruit')return openStageCamp(true);
 if(a==='stagePlan')return showStagePlan();
 if(a==='passageGuide')return showPassageGuide();
 if(a==='guideMode')return showPassageGuide(b.dataset.id);
 if(a==='guideTravel'){const id=Number(b.dataset.id);if(dialogMode!=='passageGuide'||!moveStatus(state,id,guideTravelMode).allowed)return;const mode=guideTravelMode;$('#modal').close();dialogMode='';lureMode=false;if(state.mode!==mode)act({type:'mode',id:mode});return travelTo(id);}
 if(a==='conduit')return showConduit();
 if(['buyKey','quietSeal','conduitRest'].includes(a))return act({type:a==='conduitRest'?'interact':a});
 if(a==='prepare')return act({type:'prepare',choice:b.dataset.choice,id:b.dataset.id});
 if(a==='firstExpedition')return showNew(true);
 if(a==='tutorialHelp'){if(!tutorial||TUTORIAL_STEPS[tutorial.index]?.key!=='escape')return;const focused=document.activeElement===b;tutorial.returnHelp=!tutorial.returnHelp;tutorial.returnHelpUsed ||= tutorial.returnHelp;persistTutorial();renderTutorial();if(focused)$('[data-act="tutorialHelp"]')?.focus({preventScroll:true});return;}
 if(a==='glossary')return showGlossary(b.dataset.return,b.dataset.pile,Number(b.dataset.page)||0);
 if(a==='codex')return window.open('./artbook.html?v=20261111a','_blank','noopener');
 if(a==='merchantTalk'){
  const run=state;$('#modal').close();dialogMode='';cutscene.play(MERCHANT_STORY,()=>{if(state===run)openMarket();},merchantScene());return;
 }
 if(a==='tutorialIntro')return showTutorialIntro();
 if(a==='tutorialStart')return startTutorial();
 if(a==='tutorialResume')return resumeTutorial();
 if(a==='tutorialRestart'){clearTutorialRecord();return startTutorial();}
 if(a==='tutorialKeepMain')return keepMainExpedition();
 if(a==='tutorialContinue'){
  const action={type:a,id:b.dataset.id};if(!tutorial||!mapOpen||!tutorialAllows(tutorial.index,action,state))return;
  advanceTutorial(action,'지도와 예보를 확인했어요');selectPanel('routes');persistTutorial();return;
 }
 if(a==='lureCancel'){closeModal();return;}
 if(a==='lureConfirm'){
  if(dialogMode!=='lurePreview'||lurePreviewTarget===null)return;
  const id=lurePreviewTarget;lurePreviewTarget=null;closeModal();return act({type:'lure',id,confirmed:true});
 }
 if(a==='tutorialReplay'){const st=TUTORIAL_STEPS[tutorial?.index];if(st)cutscene.play(st.talk);return;}
 if(a==='tutorialExit')return exitTutorial();
 if(a==='tutorialRetry')return retryTutorialChoice();
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
 if(a==='start'){const guided=$('#firstRunToggle')?.checked;if(tutorial)exitTutorial();travelUntil=0;state=newRun({role:selectedRole,layout:'staged',risk:true});if(firstExpeditionSelected)state.firstExpedition=true;if(guided)startFirstRun(state);firstExpeditionSelected=false;handPage=0;enemyPage=0;lureMode=false;renderer.reset();save();$('#modal').close();dialogMode='';selectPanel('routes');render();poolReveal.start(state,{fast:guided?true:fastDraw,explain:!!guided,holdSummary:!!guided});window.scrollTo({top:0,behavior:'instant'});return;}
 if(a==='deck')return showDeck(b.dataset.pile||'all');if(a==='log')return showLog();if(a==='result')return showResult();
 if(a==='zoom'){selectPanel(mapOpen?'routes':'sound');if(mapOpen)advanceTutorial({type:'panel',id:'sound'});else persistTutorial();return;}
 if(a==='sound'){toggleSound();if(dialogMode==='menu')showMenu();return;}
 if(a==='mode'){const ok=act({type:'mode',id:b.dataset.id});if(ok){setStanceMenu(false);$('#stanceToggle').focus({preventScroll:true});}return;}
 if(a==='buy')return act({type:a,index:Number(b.dataset.index)});if(['move','lure'].includes(a))return act({type:a,id:Number(b.dataset.id)});if(['reward','purge','mode'].includes(a))return act({type:a,id:b.dataset.id});if(a)act({type:a});
});
document.addEventListener('pointerover',ev=>{const b=ev.target.closest('.door[data-id],.scene-exit[data-id]');renderer.setHover(b?Number(b.dataset.id):-1);});
$('#dungeon').addEventListener('pointermove',ev=>{const id=renderer.hit(ev.clientX,ev.clientY);renderer.setHover(id);$('#dungeon').style.cursor=id>=0?'pointer':'default';});
$('#dungeon').addEventListener('pointerleave',()=>renderer.setHover(-1));
$('#dungeon').addEventListener('click',ev=>{if(poolReveal.active||noiseMoment.active||actionBusy||$('#modal').open||state.phase!=='playing')return;const id=renderer.hit(ev.clientX,ev.clientY);if(id>=0&&id!==state.pos)travelTo(id);});
document.addEventListener('keydown',ev=>{
 if(ev.defaultPrevented||poolReveal.active||noiseMoment.active||actionBusy||document.querySelector('dialog[open]')||ev.ctrlKey||ev.metaKey||ev.altKey||['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName)||state.phase!=='playing')return;
 if(ev.key==='Escape'){if(modeOpen){setStanceMenu(false);$('#stanceToggle').focus();}else if(mapOpen){selectPanel('routes');persistTutorial();}return;}
 if(ev.key.toLowerCase()==='m'){ev.preventDefault();selectPanel(mapOpen?'routes':'sound');if(mapOpen)advanceTutorial({type:'panel',id:'sound'});else persistTutorial();return;}
 if(modeOpen&&ev.target.matches('[data-act="mode"]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)){ev.preventDefault();const options=[...$('#stanceMenu').querySelectorAll('button:not(:disabled)')],i=options.indexOf(ev.target);if(!options.length)return;options[(i+(['ArrowLeft','ArrowUp'].includes(ev.key)?options.length-1:1))%options.length].focus();return;}
 if(['1','2','3'].includes(ev.key)){ev.preventDefault();if(act({type:'mode',id:{1:'walk',2:'sneak',3:'rush'}[ev.key]}))setStanceMenu(false);}
 if(ev.code==='Space'&&ev.target.tagName!=='BUTTON'){ev.preventDefault();act({type:'end'});}
 if(ev.key.toLowerCase()==='a'){ev.preventDefault();act({type:'attack'});}if(ev.key.toLowerCase()==='c'){ev.preventDefault();act({type:'hide'});}if(ev.key.toLowerCase()==='e'){const a=roomInteraction(state);if(a.act&&a.enabled){ev.preventDefault();if(a.act==='stageCamp')openStageCamp();else if(a.act==='conduit')showConduit();else act({type:a.act});}}
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.key)){ev.preventDefault();const dir={ArrowUp:-4,ArrowDown:4,ArrowLeft:-1,ArrowRight:1}[ev.key],id=state.pos+dir;if(neighbours(state).includes(id))act({type:'move',id});else toast('그 방향에는 연결된 통로가 없습니다.',true);}
});
document.addEventListener('click',ev=>{if(modeOpen&&!ev.target.closest('#stanceMenu,#stanceToggle'))setStanceMenu(false);});
$('#modal').addEventListener('cancel',ev=>{if(dialogMode==='glossary'||dialogMode==='market'&&isStaged(state)&&checkpointIndex(state)>=0){ev.preventDefault();closeModal();return;}if(dialogMode==='new'&&firstExpeditionSelected&&lastTutorialRecap){ev.preventDefault();closeModal();return;}if(state.pending){ev.preventDefault();if(['briefing','tutorialResume','new'].includes(dialogMode))pendingModal();}else{firstExpeditionSelected=false;dialogMode='';}});
$('#modal').addEventListener('click',ev=>{if(ev.target===$('#modal')&&!state.pending){const q=$('#modal').getBoundingClientRect();if(ev.clientX<q.left||ev.clientX>q.right||ev.clientY<q.top||ev.clientY>q.bottom)closeModal();}});
save();selectPanel('routes');render();if(migrated)toast('기존 탐험을 이어갑니다. 남은 손패가 자동 합산되었습니다.');
// ?tutorial=1 is a one-time request. Consume it so reload does not reopen completed or skipped practice.
const askTutorial=(()=>{
 try{
  const url=new URL(location.href),requested=url.searchParams.get('tutorial')==='1';
  if(requested){url.searchParams.delete('tutorial');history.replaceState(history.state,'',url.pathname+url.search+url.hash);}
  return requested;
 }catch{return false;}
})();
if(storedTutorial&&!storedTutorial.paused)showTutorialResume();else if(askTutorial&&!state.pending)showTutorialIntro();else if(state.pending)pendingModal();else if(state.phase!=='playing')showResult();else if(!tutorialSeen)showWelcome();else if(!loadedRun)poolReveal.start(state,{fast:fastDraw});
if(tutorialRecoveryNotice)toast(tutorialRecoveryNotice,true,true);
