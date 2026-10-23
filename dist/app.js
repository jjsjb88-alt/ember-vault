import {CARDS,ROLES,VERSION,newRun,apply,neighbours,moveCost,validSave} from './engine.js';
import {paintIcons,makeRenderer} from './art.js';
const $=s=>document.querySelector(s),SAVE_KEY='ember-vault-save-v1',BEST_KEY='ember-vault-best-v1';
let state,storageOK=true,best=0,sound=false,selectedRole='rogue',dialogMode='',lastFocus=null,toastTimer,audio;
try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY));state=validSave(saved)?saved:newRun();best=Number(localStorage.getItem(BEST_KEY))||0;sound=localStorage.getItem('ember-vault-sound')==='on';}catch{state=newRun();storageOK=false;}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const ico=(name,n=32)=>`<canvas data-icon="${name}" width="${n}" height="${n}" aria-hidden="true"></canvas>`;
const renderer=makeRenderer($('#dungeon'),()=>state);
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));if(state.phase==='won'&&state.score>best){best=state.score;localStorage.setItem(BEST_KEY,String(best));}storageOK=true;}catch{storageOK=false;}}
function beep(type='card'){
 if(!sound)return;
 try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const notes={card:[330,440],move:[220,294],attack:[98,73],buy:[523,659,784],win:[392,523,659,784],bad:[110,82],turn:[294,330],relic:[392,523,784,1047]}[type]||[440];
 notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type=type==='attack'?'sawtooth':'triangle';o.frequency.value=f;const at=audio.currentTime+i*.075;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.045,at+.01);g.gain.exponentialRampToValueAtTime(.0001,at+.16);o.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+.18);});}catch{}
}
function toast(text,bad=false){const el=$('#toast');el.textContent=text;el.className='show'+(bad?' bad':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='',2800);}
function cardMarkup(id,index,action='play'){
 const c=CARDS[id];return `<button class="card ${c.family}" data-act="${action}" data-index="${index}" data-id="${id}" aria-label="${c.name}, ${c.text}${action==='reward'?', 보상으로 선택':', 사용'}" ${state.phase!=='playing'&&action==='play'?'disabled':''}><div class="card-top"><span>${c.kind}</span><span class="keycap">${action==='play'?(index<5?index+1:'·'):'선택'}</span></div><div class="card-art">${ico(c.icon)}</div><strong class="card-name">${c.name}</strong><p class="card-effect">${c.text}</p><div class="card-bottom"></div></button>`;
}
function roomTypeIcon(r){return r.enemy?.hp>0?r.enemy.kind:({entry:'door',chest:'chest',camp:'camp',merchant:'merchant',shrine:'shrine',relic:r.relic?.icon,enemy:'skull'}[r.type]);}
function roomAction(r){
 if(state.phase!=='playing')return {act:'result',text:'탐험 결과 보기',enabled:true};
 if(r.enemy?.hp>0)return {act:'attack',text:`공격하기 · ${Math.min(state.resource.sword,r.enemy.hp)} 피해`,enabled:state.resource.sword>0,cls:'attack'};
 if(r.type==='entry')return {act:'interact',text:state.relic?'유물과 함께 탈출':'유물을 찾아 돌아오세요',enabled:!!state.relic,cls:'relic'};
 if(r.used)return {act:'',text:'이 방의 보상을 받았습니다',enabled:false};
 const a={chest:['상자 열기','interact',true],camp:['휴식 · 체력 +6 / 소음 −3','interact',state.hp<state.maxHp||state.noise>0],shrine:['카드 1장 영구 제거','interact',true],merchant:['물약 구매 · 금화 5','merchant',state.gold>=5&&state.hp<state.maxHp],relic:[`${r.relic?.name} 획득 · ${r.relic?.value}점`,'interact',!state.relic||state.relic.value<r.relic?.value]};
 return a[r.type]?{text:a[r.type][0],act:a[r.type][1],enabled:a[r.type][2],cls:r.type==='relic'?'relic':''}:{act:'',text:'수호자를 쓰러뜨렸습니다',enabled:false};
}
function tip(){
 const r=state.rooms[state.pos];
 if(state.phase==='won')return '탐험 완료 · 금고에서 살아 돌아왔습니다.';
 if(state.phase==='lost')return '탐험 종료 · 다시 도전할 준비가 되셨나요?';
 if(r.enemy?.hp>0)return state.resource.sword?'모아 둔 공격력으로 수호자를 공격하세요.':'공격 카드를 눌러 힘을 모으세요. 턴이 끝나면 적이 반격합니다.';
 if(state.relic)return `유물을 확보했습니다. 입구로 돌아가세요 · 붕괴까지 ${state.countdown}턴`;
 if(state.turn===1&&state.pos===0)return '카드를 눌러 자원을 얻고, 테두리가 표시된 방을 눌러 이동하세요.';
 if(r.type==='relic'&&!r.used)return '유물을 챙길까요? 더 깊은 곳에는 더 값진 보물이 있습니다.';
 if(r.type==='chest'&&!r.used)return '상자를 발견했습니다. 행동 버튼을 눌러 금화를 챙기세요.';
 return '방 한 칸에 이동 1 · 가장 깊은 층은 이동 2가 필요합니다.';
}
function render(){
 const s=state,r=s.rooms[s.pos],role=ROLES[s.role],active=s.phase==='playing';
 $('#characterStatus').innerHTML=`${ico(role.icon)}<div><span class="stat-label">탐험가 · ${s.rooms.filter(x=>x.visited).length}/16 방</span><strong>${role.name}</strong></div>`;
 const blocks=12,filled=Math.ceil(s.hp/s.maxHp*blocks);
 $('#healthStatus').innerHTML=`<div class="health-text"><span>체력</span><strong>${s.hp} <span style="color:var(--muted);font-size:10px">/ ${s.maxHp}</span></strong></div><div class="health-track ${s.hp/s.maxHp<.3?'low':''}" role="meter" aria-label="체력" aria-valuemin="0" aria-valuemax="${s.maxHp}" aria-valuenow="${s.hp}">${Array.from({length:blocks},(_,i)=>`<span class="${i<filled?'filled':''}"></span>`).join('')}</div>`;
 $('#goldValue').textContent=s.gold;
 $('#artifactStatus').innerHTML=`${ico(s.relic?.icon||'crystal',26)}<div><span class="stat-label">이번 탐험의 유물</span><strong class="${s.relic?'':'waiting'}">${s.relic?`${s.relic.name} · ${s.relic.value}점`:'아직 발견하지 못한 보물'}</strong></div>`;
 $('#bestValue').textContent=best?`${best} P`:'—';
 $('#dungeon').setAttribute('aria-label',`던전 지도. 현재 ${r.name}. ${r.enemy?.hp>0?'적 체력 '+r.enemy.hp+'. ':''}연결된 방: ${neighbours(s).map(id=>s.rooms[id].name).join(', ')}. 연결된 방 버튼이나 방향키로 이동할 수 있습니다.`);
 $('#mapLocation').textContent=r.name;$('#turnValue').textContent=`TURN ${String(s.turn).padStart(2,'0')}`;$('#mapHint').textContent=tip();
 const ra=roomAction(r);
 if(!$('#quickAction')){const b=document.createElement('button');b.id='quickAction';b.className='quick-action';$('.map-caption').appendChild(b);}
 const qb=$('#quickAction');qb.dataset.act=ra.act;qb.textContent=ra.text;qb.disabled=!ra.enabled;qb.hidden=!ra.act;
 $('#resources').innerHTML=[['move','boot','이동'],['sword','dagger','공격'],['skill','book','기술'],['block','shield','방어']].map(([key,icon,name])=>`<div class="resource ${key}" title="${name} ${s.resource[key]} · 이번 턴에만 사용" aria-label="${name} ${s.resource[key]}">${ico(icon,24)}<span class="res-name">${name}</span><strong>${s.resource[key]}</strong></div>`).join('');
 $('#handCount').textContent=`${s.hand.length}장`;
 $('#hand').innerHTML=s.hand.length?s.hand.map((id,i)=>cardMarkup(id,i)).join(''):`<div class="hand-empty"><strong>모든 카드를 펼쳤습니다.</strong><span>남은 자원으로 이동·공격·영입 후 턴을 마치세요.</span></div>`;
 $('#drawCount').textContent=s.deck.length;$('#discardCount').textContent=s.discard.length;$('#playedCount').textContent=s.played.length;$('#deckTotal').textContent=s.hand.length+s.deck.length+s.discard.length+s.played.length;
 const danger=s.noise>=8;
 $('#dangerPanel').innerHTML=`<div class="danger-title"><h2>${s.relic?'깨어난 용의 분노':'잠든 용의 경계'}</h2><strong>${s.noise}<span> / 8</span></strong></div><div class="noise-bar" role="meter" aria-label="소음" aria-valuemin="0" aria-valuemax="12" aria-valuenow="${s.noise}">${Array.from({length:8},(_,i)=>`<span class="${i<s.noise?'on':''} ${danger?'hot':''}"></span>`).join('')}</div><div class="danger-sub"><span>${danger?'턴 종료 시 용의 공격!':'소음 8 이상이면 용이 공격'}</span><b>피해 ${3+Math.floor(s.turn/10)}</b></div><div class="quest ${s.relic?'urgent':''}">${ico(s.relic?'door':'crystal')}<div><strong>${s.relic?`입구로 탈출 · ${s.countdown}턴 남음`:'유물을 찾아, 살아 돌아오세요.'}</strong><p>${s.relic?`용의 주기 공격까지 ${s.turn%3===0?'이번 턴':3-s.turn%3+'턴'} · 피해 2`:'달의 눈물 18 · 왕관 28 · 심장 42'}</p></div></div>`;
 const descriptions={entry:'작은 빛이 새어 들어옵니다. 유물을 챙겨 이곳으로 돌아오면 탐험에 성공합니다.',chest:r.id===12?'금화가 가득한 상자. 열면 금화 10과 소음 2를 얻습니다.':'먼지 속에 남겨진 상자입니다. 금화는 탐험이 끝날 때 점수가 됩니다.',camp:'잠시 숨을 고를 수 있습니다. 한 번만 체력 6을 회복하고 소음 3을 줄입니다.',merchant:'떠돌이 상인이 마지막 물약을 팝니다. 금화 5로 체력 8을 회복합니다.',shrine:'기억 하나를 바치면 발걸음이 가벼워집니다. 덱에서 카드 1장을 영구히 지웁니다.',relic:`${r.relic?.value}점의 유물이 잠들어 있습니다. 획득하면 용이 깨어나고 탈출까지 14턴이 주어집니다.`,enemy:'수호자가 길을 막고 있습니다. 공격력을 모아 쓰러뜨리면 금화와 카드 보상을 받습니다.'};
 const enemy=r.enemy?.hp>0;
 const actionHTML=ra.act?`<button class="primary-action ${ra.cls||''}" data-act="${ra.act}" ${!ra.enabled?'disabled':''}><span>${ra.text}</span><span>→</span></button>`:`<div class="room-done">✓ ${ra.text}</div>`;
 $('#roomPanel').innerHTML=`<span class="eyebrow">CURRENT ROOM · ${String(s.pos+1).padStart(2,'0')}</span><div class="room-title">${ico(roomTypeIcon(r))}<h2>${r.name}</h2></div><p class="room-description">${enemy?`${r.enemy.name}의 기척이 느껴집니다. 공격 카드를 사용한 뒤 공격 버튼을 누르세요.`:descriptions[r.type]}</p>${enemy?`<div class="enemy-info"><span>적 체력 <strong>${r.enemy.hp} / ${r.enemy.maxHp}</strong></span><span>다음 반격 <strong>${r.enemy.damage} 피해</strong></span></div>`:''}${actionHTML}<div class="directions"><div class="directions-label"><span>${enemy?'적을 격파하거나 들어온 방으로 후퇴':'연결된 방으로 이동'}</span><span>이동 ${s.resource.move} 보유</span></div><div class="door-list">${neighbours(s).map(id=>{const n=s.rooms[id],cost=moveCost(s,id),retreat=enemy&&id===s.from,blocked=(enemy&&!retreat)||s.resource.move<cost||!active;return `<button class="door" data-act="move" data-id="${id}" ${blocked?'disabled':''} title="${n.name} · 이동 ${cost}${retreat?' · 후퇴 시 소음 +1':''}"><span class="door-label">${retreat?'↶ ':''}${n.name}</span><span class="cost">${cost} 발</span></button>`;}).join('')}</div></div>`;
 $('#market').innerHTML=s.market.map((id,i)=>{const c=CARDS[id],can=s.resource.skill>=c.cost&&active;return `<button class="market-card ${can?'affordable':''}" data-act="buy" data-index="${i}" aria-label="${c.name}, ${c.text}, 기술 ${c.cost}점으로 영입" ${!can?'disabled':''}>${ico(c.icon)}<span class="offer"><strong>${c.name}</strong><small>${c.text}</small></span><span class="price">${c.cost}</span></button>`;}).join('');
 $('[data-act="refresh"]').disabled=s.gold<2||s.refreshTurn===s.turn||!active;
 $('[data-act="end"]').disabled=!active||!!s.pending;
 $('.under-notes>span:first-child').innerHTML=`<i></i> ${storageOK?'진행 상황 자동 저장':'현재 브라우저에서 저장할 수 없음'}`;
 const soundButton=$('.sound-toggle');soundButton.setAttribute('aria-label',sound?'효과음 끄기':'효과음 켜기');soundButton.title=sound?'효과음 끄기':'효과음 켜기';soundButton.innerHTML=`♪${sound?'':'<span class="sound-line"></span>'}`;
 paintIcons();
}
function openModal(html,mode){
 const d=$('#modal');if(!d.open)lastFocus=document.activeElement;
 dialogMode=mode;$('#modalContent').innerHTML=html;paintIcons(d);if(!d.open)d.showModal();
 const first=d.querySelector('button:not([disabled])');first?.focus();
}
const modalShell=(title,eyebrow,body,close=true)=>`<div class="modal-inner"><div class="modal-top"><div><span class="eyebrow">${eyebrow}</span><h2 id="modalTitle">${title}</h2></div>${close?'<button class="close-button" data-act="close" aria-label="닫기">×</button>':''}</div>${body}</div>`;
function closeModal(){if(state.pending){toast('보상을 고르거나 건너뛰기를 눌러 주세요.');return;}$('#modal').close();dialogMode='';lastFocus?.focus();}
function pendingModal(){
 if(state.pending?.type==='reward')openModal(modalShell('승리의 전리품','CHOOSE YOUR REWARD',`<p class="modal-sub">새 카드를 1장 골라 덱에 추가하세요. 버린 카드 더미에 들어가며, 다음 순환부터 사용할 수 있습니다.</p><div class="modal-cards">${state.pending.options.map((id,i)=>cardMarkup(id,i,'reward')).join('')}</div><div class="modal-actions"><span class="modal-sub" style="margin:0">가벼운 덱을 유지해도 좋습니다.</span><button class="subtle-button" data-act="skipReward">받지 않고 계속 →</button></div>`,false),'reward');
 else if(state.pending?.type==='purge')openModal(modalShell('내려놓을 기억','FORGET ONE CARD',`<p class="modal-sub">선택한 카드 1장을 덱에서 영구히 제거합니다. 이 제단은 한 번만 사용할 수 있습니다.</p><div class="deck-list">${state.pending.options.map(id=>`<button class="deck-item" data-act="purge" data-id="${id}">${ico(CARDS[id].icon)}<div><strong>${CARDS[id].name}</strong><small>${CARDS[id].text}</small></div><b>제거</b></button>`).join('')}</div><div class="modal-actions"><button class="subtle-button" data-act="cancelPurge">지금은 지나가기</button></div>`,false),'purge');
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
 openModal(modalShell('누가 금고로 내려갈까요?','A NEW EXPEDITION',`<p class="modal-sub">직업마다 시작 카드와 특성이 다릅니다. 새 탐험을 시작하면 현재 진행은 초기화되고 최고 기록은 남습니다.</p><div class="role-list" role="radiogroup" aria-label="직업 선택">${Object.entries(ROLES).map(([key,r])=>`<button class="role-option ${key===selectedRole?'selected':''}" data-act="role" data-id="${key}" role="radio" aria-checked="${key===selectedRole}">${ico(r.icon)}<strong>${r.name}</strong><span>${r.desc}</span><small>${r.trait}</small></button>`).join('')}</div><div class="modal-actions"><button class="subtle-button" data-act="close">현재 탐험으로 돌아가기</button><button class="large-button" data-act="start">금고로 내려가기 →</button></div>`),'new');
}
function showHelp(){
 openModal(modalShell('들어갈 용기. 돌아올 지혜.','FIELD GUIDE',`<p class="modal-sub">용의 유물을 하나 챙겨 시작 지점으로 돌아오세요. 더 깊은 유물은 더 높은 점수를 줍니다.</p><div class="help-steps"><div class="help-step"><b>01 / CARDS</b><h3>카드로 자원을 만드세요</h3><p>매 턴 5장을 뽑습니다. 카드를 누르면 이동·공격·기술·방어를 얻습니다. 사용 순서는 자유입니다.</p></div><div class="help-step"><b>02 / EXPLORE</b><h3>방을 눌러 탐험하세요</h3><p>연결된 방으로 이동합니다. 기본 이동은 매 턴 1. 가장 깊은 층에 들어가려면 이동 2가 필요합니다.</p></div><div class="help-step"><b>03 / BUILD</b><h3>싸우고, 덱을 키우세요</h3><p>공격 카드를 낸 뒤 공격 버튼을 누르세요. 적은 턴 끝에 반격합니다. 교역소 카드는 기술로 영입하며 버린 더미에 들어갑니다.</p></div><div class="help-step"><b>04 / ESCAPE</b><h3>욕심을 멈출 때를 고르세요</h3><p>유물을 얻으면 14턴 후 금고가 붕괴합니다. 입구로 돌아와 탈출하세요. 모닥불과 방어가 귀환을 돕습니다.</p></div></div><div class="help-warning">소음 8 이상 → 턴 끝에 용의 공격. 유물을 얻은 뒤에는 3의 배수 턴마다 용이 공격합니다. 방어로 피해를 막을 수 있습니다.<br>턴이 끝나면 남은 자원은 사라지고, 사용하지 않은 손패도 버려집니다. 새 카드는 뽑을 덱이 떨어지면 버린 더미와 함께 섞입니다.</div><p class="modal-sub" style="margin:17px 0 0">점수 = 유물 + 금화 + 방문한 방 × 2 + 남은 체력 + 탈출 보너스 20<br>조작: 카드와 방 터치 / 키보드 1–5 · 방향키 · Space<br>이 게임은 첨부 자료의 탐험·덱 성장·소음·귀환 구조를 바탕으로 만든 독자적인 싱글플레이 게임입니다.</p><div class="modal-actions"><span class="eyebrow">${ROLES[state.role].name} · ${ROLES[state.role].trait}</span><button class="large-button" data-act="close">탐험 계속하기 →</button></div>`),'help');
}
function showDeck(pile='all'){
 const labels={all:'전체 덱',hand:'손패',deck:'뽑을 카드',discard:'버린 카드',played:'사용한 카드'};
 if(!labels[pile])pile='all';
 const ids=pile==='all'?[...state.hand,...state.deck,...state.discard,...state.played]:state[pile];
 const counts={};ids.forEach(id=>counts[id]=(counts[id]||0)+1);
 openModal(modalShell('내 손으로 만든 덱','YOUR COLLECTION',`<div class="deck-tabs">${Object.entries(labels).map(([k,v])=>`<button class="${pile===k?'selected':''}" data-act="deck" data-pile="${k}">${v}</button>`).join('')}</div><p class="modal-sub">${labels[pile]} · ${ids.length}장${pile==='deck'?' · 뽑는 순서는 숨겨져 있습니다.':''}</p><div class="deck-list">${Object.entries(counts).map(([id,n])=>`<div class="deck-item">${ico(CARDS[id].icon)}<div><strong>${CARDS[id].name}</strong><small>${CARDS[id].text}</small></div><b>×${n}</b></div>`).join('')||'<p class="empty-list">아직 카드가 없습니다.</p>'}</div>`),'deck');
}
function showLog(){openModal(modalShell('어둠 속에 남긴 발자국','EXPEDITION JOURNAL',`<p class="modal-sub">탐험 코드 ${state.seed.toString(36).toUpperCase()} · 최근 행동부터 표시</p><div class="log-list">${state.log.map(x=>`<div class="log-row ${x.tone}"><small>T${String(x.turn).padStart(2,'0')}</small><span>${esc(x.message)}</span></div>`).join('')}</div>`),'log');}
function act(action){
 const beforeHP=state.hp,wasRelic=!!state.relic;
 const result=apply(state,action);
 if(!result.ok){toast(result.message,true);beep('bad');return false;}
 save();render();
 if(action.type==='attack'||action.type==='interact'||action.type==='buy'||action.type==='reward')renderer.burst();
 if(state.hp<beforeHP)renderer.burst('bad');
 beep(action.type==='end'?'turn':action.type==='buy'||action.type==='reward'?'buy':action.type==='move'?'move':action.type==='attack'?'attack':!wasRelic&&state.relic?'relic':'card');
 if(action.type!=='play')toast(result.message);
 if(state.pending)pendingModal();
 else if(state.phase!=='playing'){showResult();beep(state.phase==='won'?'win':'bad');}
 else if(['reward','skipReward','purge','cancelPurge'].includes(action.type)){$('#modal').close();dialogMode='';}
 return true;
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('button[data-act]');if(!b||b.disabled)return;
 const a=b.dataset.act;
 if(a==='close')return closeModal();
 if(a==='help')return showHelp();
 if(a==='new')return showNew();
 if(a==='role'){selectedRole=b.dataset.id;return renderNew();}
 if(a==='start'){state=newRun({role:selectedRole});renderer.reset();save();$('#modal').close();dialogMode='';render();toast('새로운 탐험을 시작합니다.');beep('relic');window.scrollTo({top:0,behavior:'smooth'});return;}
 if(a==='deck')return showDeck(b.dataset.pile||'all');
 if(a==='log')return showLog();
 if(a==='result')return showResult();
 if(a==='zoom'){const on=renderer.toggleZoom();b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'지도 가까이 보기':'전체 지도 보기');b.title=on?'가까이 보기':'전체 지도';return;}
 if(a==='sound'){sound=!sound;try{localStorage.setItem('ember-vault-sound',sound?'on':'off');}catch{}render();if(sound)beep();return;}
 if(a==='play'||a==='buy')return act({type:a,index:Number(b.dataset.index)});
 if(a==='move')return act({type:a,id:Number(b.dataset.id)});
 if(a==='reward'||a==='purge')return act({type:a,id:b.dataset.id});
 if(a)act({type:a});
});
$('#dungeon').addEventListener('click',ev=>{if($('#modal').open||state.phase!=='playing')return;const id=renderer.hit(ev.clientX,ev.clientY);if(id===state.pos){const a=roomAction(state.rooms[id]);if(a.act&&a.enabled)act({type:a.act});else toast('카드를 사용하거나 연결된 방으로 이동하세요.');}else if(id>=0)act({type:'move',id});});
$('#dungeon').addEventListener('mousemove',ev=>renderer.setHover(renderer.hit(ev.clientX,ev.clientY)));
$('#dungeon').addEventListener('mouseleave',()=>renderer.setHover(-1));
document.addEventListener('keydown',ev=>{
 if($('#modal').open||ev.ctrlKey||ev.metaKey||ev.altKey||['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName))return;
 if(state.phase!=='playing')return;
 if(/^[1-5]$/.test(ev.key)){ev.preventDefault();act({type:'play',index:Number(ev.key)-1});}
 if(ev.code==='Space'){ev.preventDefault();act({type:'end'});}
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.key)){
  ev.preventDefault();const dir={ArrowUp:-4,ArrowDown:4,ArrowLeft:-1,ArrowRight:1}[ev.key],id=state.pos+dir;if(neighbours(state).includes(id))act({type:'move',id});else toast('그 방향에는 연결된 통로가 없습니다.',true);
 }
});
$('#modal').addEventListener('cancel',ev=>{if(state.pending)ev.preventDefault();else dialogMode='';});
$('#modal').addEventListener('click',ev=>{if(ev.target===$('#modal')&&!state.pending){const q=$('#modal').getBoundingClientRect();if(ev.clientX<q.left||ev.clientX>q.right||ev.clientY<q.top||ev.clientY>q.bottom)closeModal();}});
save();render();
if(state.pending)pendingModal();else if(state.phase!=='playing')showResult();
