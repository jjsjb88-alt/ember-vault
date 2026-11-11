import {EXTRA_CARDS} from './content/memories.js?v=20261111b';
import {KEEPSAKES,hasKeepsake,lureRaw,provisionRaw,liftCost,liftRaw,restRaw} from './content/keepsakes.js?v=20261111b';
import {ENEMIES} from './content/enemies.js?v=20261111b';
import {configureWorld,site,worldValid,isCollapsed} from './world.js?v=20261111b';
import {hasRisk,configureRisk,RISK,heal,healingAmount,healingLeft,riskBreathDamage,soundLoss} from './risk-rules.js?v=20261111b';
import {hasGimmicks,passageRule,movementGimmickReason,worldPassageOpen,movementDirectionAllowed,SECRET_EDGE} from './dungeon-gimmicks.js?v=20261111b';
import {STAGES,STAGE_ROOMS,RETURN_LIFT_EDGE,isStaged,stageIndex,checkpointIndex,configureStages,expeditionBonuses} from './expedition-stages.js?v=20261111b';
export const VERSION=2;
export function objectParticle(name){const code=String(name).codePointAt(String(name).length-1);return code>=0xac00&&code<=0xd7a3&&(code-0xac00)%28?'을':'를';}
export const ROLES={
  rogue:{name:'그림자 도적',short:'도적',color:'#86c6aa',icon:'hero',desc:'가볍게 걷고, 조용히 훔칩니다.',trait:'매 턴 소음 1 추가 감소',hp:22},
  knight:{name:'잿빛 기사',short:'기사',color:'#e5ad72',icon:'knight',desc:'두꺼운 방패로 위험을 견딥니다.',trait:'최대 체력 28 · 매 턴 방어 1',hp:28},
  mage:{name:'불씨 마법사',short:'마법사',color:'#b59be5',icon:'mage',desc:'지식으로 더 강한 덱을 만듭니다.',trait:'매 턴 기술 1 추가',hp:20}
};
ROLES.warden={name:'메아리 기록관',short:'기록관',color:'#90cde0',icon:'mage',artRole:'mage',desc:'남겨진 메아리를 방패와 길로 바꿉니다.',trait:'시작 유물: 메아리 실타래',hp:21};
ROLES.cantor={name:'잿불 합창사',short:'합창사',color:'#d1a0d9',icon:'knight',artRole:'knight',desc:'소란을 힘과 유인으로 돌려줍니다.',trait:'시작 유물: 속삭이는 종',hp:24};
export const STARTING_KEEPSAKES={rogue:'ember',knight:'copperward',mage:'inklens',warden:'echothread',cantor:'decoybell'};
export const CARDS={
  step:{name:'잰걸음',kind:'이동',family:'move',icon:'boot',cost:2,e:{move:2},text:'이동 +2'},
  scout:{name:'길잡이',kind:'탐험',family:'move',icon:'compass',cost:3,e:{move:1,skill:1},text:'이동 +1 · 기술 +1'},
  slash:{name:'낡은 단검',kind:'공격',family:'attack',icon:'dagger',cost:2,e:{sword:2,noise:1},text:'공격 +2 · 첫 소음 +1'},
  focus:{name:'작은 발견',kind:'기술',family:'skill',icon:'book',cost:2,e:{skill:2},text:'기술 +2'},
  guard:{name:'나무 방패',kind:'방어',family:'guard',icon:'shield',cost:2,e:{block:3},text:'방어 +3'},
  sneak:{name:'숨죽이기',kind:'은신',family:'move',icon:'cloak',cost:3,e:{move:1,noise:-2},text:'이동 +1 · 은신 +2'},
  spark:{name:'불씨 화살',kind:'공격',family:'attack',icon:'flame',cost:3,e:{sword:3},text:'공격 +3'},
  rush:{name:'질풍 걸음',kind:'이동',family:'move',icon:'wing',cost:5,e:{move:3,noise:1},text:'이동 +3 · 첫 소음 +1'},
  blade:{name:'달빛 쌍검',kind:'공격',family:'attack',icon:'swords',cost:5,e:{sword:4},text:'공격 +4'},
  bash:{name:'방패 밀치기',kind:'공격 / 방어',family:'guard',icon:'shield',cost:4,e:{sword:2,block:2},text:'공격 +2 · 방어 +2'},
  insight:{name:'금지된 서고',kind:'기술',family:'skill',icon:'tome',cost:5,e:{skill:3,draw:1},text:'기술 +3 · 1개 추가 추출'},
  ghost:{name:'유령 걸음',kind:'은신',family:'move',icon:'ghost',cost:6,e:{move:2,noise:-3},text:'이동 +2 · 은신 +3'},
  potion:{name:'숲의 물약',kind:'회복',family:'guard',icon:'potion',cost:4,e:{heal:3},text:'체력 3 회복'},
  greed:{name:'위험한 거래',kind:'기술',family:'skill',icon:'coin',cost:4,e:{skill:4,noise:2},text:'기술 +4 · 첫 소음 +2'},
  fury:{name:'화염 일격',kind:'공격',family:'attack',icon:'axe',cost:6,e:{sword:6,noise:2},text:'공격 +6 · 첫 소음 +2'},
  lantern:{name:'수호의 등불',kind:'방어 / 기술',family:'guard',icon:'lantern',cost:4,e:{block:2,skill:2},text:'방어 +2 · 기술 +2'},
  acrobat:{name:'공중제비',kind:'이동',family:'move',icon:'feather',cost:4,e:{move:1,draw:1},text:'이동 +1 · 1개 추가 추출'},
  treasure:{name:'보물의 속삭임',kind:'탐험',family:'skill',icon:'chest',cost:5,e:{gold:2,skill:1},text:'금화 +2 · 기술 +1'},
  sentinel:{name:'철벽',kind:'방어',family:'guard',icon:'tower',cost:5,e:{block:6},text:'방어 +6'},
  ambush:{name:'그림자 습격',kind:'공격 / 은신',family:'attack',icon:'dagger',cost:5,e:{sword:3,noise:-2},text:'공격 +3 · 은신 +2'},
  healing:{name:'새벽의 기도',kind:'회복 / 방어',family:'guard',icon:'leaf',cost:6,e:{heal:2,block:3},text:'체력 2 회복 · 방어 +3'},
  wisdom:{name:'별의 지도',kind:'기술 / 이동',family:'skill',icon:'map',cost:6,e:{skill:2,move:2},text:'기술 +2 · 이동 +2'},
  echo:{name:'메아리 수집가',kind:'순환',family:'skill',icon:'crystal',cost:5,e:{draw:2,noise:1},text:'2개 추가 추출 · 첫 소음 +1'},
  silence:{name:'침묵의 망토',kind:'은신 / 방어',family:'guard',icon:'cloak',cost:4,e:{noise:-4,block:1},text:'은신 +4 · 방어 +1'}
};
export const BASE_CARD_IDS=Object.keys(CARDS);
Object.assign(CARDS,EXTRA_CARDS);
export const ROLE_AXES={rogue:['stealth','path'],knight:['ward','noise'],mage:['cycle','echo'],warden:['echo','ward'],cantor:['noise','cycle']};
export const MARKET_IDS=BASE_CARD_IDS.filter(x=>!['slash','focus','guard'].includes(x));

export const MODES={walk:{name:'걷기',short:'보통',noise:2,extra:0},sneak:{name:'살금살금',short:'은밀',noise:0,extra:1},rush:{name:'질주',short:'빠르게',noise:5,extra:-1}};
export const TERRAINS={stone:{name:'돌바닥',noise:0,damp:0},water:{name:'물웅덩이',noise:1,damp:0},shards:{name:'돌 파편',noise:2,damp:0},moss:{name:'이끼',noise:-1,damp:1}};
export const ALERTS={idle:'무경계',listen:'청취 중',investigate:'조사 중',hunt:'추적 중'};
const EDGES=[[0,1],[0,4],[1,2],[1,5],[2,3],[2,6],[3,7],[4,5],[4,8],[5,9],[6,7],[6,10],[7,11],[8,9],[8,12],[9,10],[9,13],[10,11],[10,14],[11,15],[12,13],[13,14],[14,15]];
const EXPANDED_EDGES=[[12,16],[16,17],[17,18],[18,19],[15,19]];
export const SHORTCUT_EDGE=Object.freeze([9,17]);
// Echoes: the vault remembers footsteps. Every sound leaves an echo in the room it came from; echoes fade each turn.
// When the dragon attacks, its breath catches the strongest echo and crawls along the echoing passages toward you.
export const ECHO_MAX=9,LAIR=15,MEMORY_MAX=3;
export function lairRoom(s){return s.layout==='expanded'||isStaged(s)?19:LAIR;}
export function dragonDue(s){return s.noise>=8?'noise':s.relic&&s.turn%3===0?'relic':null;}
export function breathReach(s){return Math.min(6,3+Math.max(0,s.noise-8)+(s.heat?Math.floor(s.heat/3):0));}
export function echoFadeEvery(s){return Math.max(1,(s.memory||0)+1+(s.heat?Math.floor(s.heat/3):0)-(hasKeepsake(s,'echothread')?1:0));}
function distances(s,from){const d=Array(s.rooms.length).fill(99);d[from]=0;const q=[from];while(q.length){const id=q.shift();for(const n of acousticNeighbours(s,id))if(d[n]>d[id]+1){d[n]=d[id]+1;q.push(n);}}return d;}
function upgradeEcho(s){if(s.bag!==undefined||s.clank!==undefined){if(s.bag&&!s.echo){s.echo=Array(s.rooms.length).fill(0);s.memory=s.rageStep??(s.relic?1:0);}delete s.bag;delete s.clank;delete s.rageStep;}}
/** Where the breath will go if the dragon attacks now: start at the strongest echo, spread to echoing neighbours. */
export function breathPlan(s){
 const e=s.echo||[],reach=breathReach(s),lair=distances(s,lairRoom(s)),me=distances(s,s.pos);
 const hot=e.map((v,id)=>id).filter(id=>e[id]>0);
 if(!hot.length)return {start:null,path:[],reach,hit:false,damage:0,echo:0};
 const rank=(a,b)=>e[b]-e[a]||a-b;
 const start=[...hot].sort((a,b)=>e[b]-e[a]||lair[a]-lair[b]||a-b)[0],path=[start];
 while(path.length<reach){
  const frontier=[...new Set(path.flatMap(id=>acousticNeighbours(s,id)))].filter(id=>!path.includes(id)&&e[id]>0);
  if(!frontier.length)break;path.push(frontier.sort((a,b)=>e[b]-e[a]||me[a]-me[b]||rank(a,b))[0]);
 }
 const hit=path.includes(s.pos);
 return {start,path,reach,hit,damage:hit?Math.max(0,(hasKeepsake(s,'mirrorheart')&&!s.mirrorSpent?0:riskBreathDamage(s,e[s.pos]))-(hasKeepsake(s,'dragonscale')?2:0)):0,echo:e[s.pos]};
}
function next(s){let x=s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
function shuffle(s,a){for(let i=a.length-1;i>0;i--){const j=Math.floor(next(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sample(s,a){return a[Math.floor(next(s)*a.length)];}
export function log(s,message,tone='normal'){s.log.unshift({turn:s.turn,message,tone});s.log=s.log.slice(0,80);}
function decorateRoom(r){
 r.terrain=['stone','shards','stone','moss','moss','shards','water','stone','moss','water','stone','moss','shards','stone','moss','stone','moss','stone','shards','stone'][r.id];
 if(r.enemy)Object.assign(r.enemy,{home:r.id,mode:'idle',target:null,memory:0,awareness:0,anchored:r.type==='relic'||r.id===18});
 return r;
}
function generateRooms(s){
 const specs=[['entry','무너진 입구'],['chest','망각의 창고'],['shrine','잊힌 제단'],['merchant','떠돌이의 쉼터'],['enemy','이끼 낀 회랑'],['enemy','부서진 무기고'],['chest','잠든 서고'],['enemy','감시자의 방'],['camp','작은 모닥불'],['enemy','속삭이는 묘실'],['relic','달의 봉인실'],['camp','마지막 불씨'],['chest','금빛 함정'],['relic','왕의 무덤'],['shrine','고요의 성소'],['relic','잿불의 심장']];
 if(next(s)>.5)[specs[2],specs[3]]=[specs[3],specs[2]];
 if(s.layout==='expanded'||isStaged(s))specs.push(['camp','이끼 숨터'],['mechanism','귀환 윈치실'],['chest','쇳소리 보물고'],['relic','용의 기억실']);
 return specs.map(([type,name],id)=>{
  const room={id,type,name,col:id%4,row:Math.floor(id/4),seen:[0,1,4].includes(id),visited:id===0,used:false,enemy:null};
  if(type==='enemy'||type==='relic'||id===18){
   const hp=type==='relic'?({10:5,13:7,15:12,19:14}[id]):id===18?8:({4:3,5:4,7:5,9:6}[id]);
   const kinds=type==='relic'?(id===19?['dragon','기억의 수호룡']:id===15?['dragon','잿불의 파수꾼']:['sentinel','유물 수호자']):id===18?['sentinel','심층 금고지기']:sample(s,[['skeleton','방황하는 해골'],['skeleton','묘지의 척후병']]);
   room.enemy={kind:kinds[0],name:kinds[1],hp,maxHp:hp,damage:id===15||id===19?5:Math.max(2,Math.ceil(hp/3)),gold:Math.ceil(hp/2)};
  }
  if(type==='relic')room.relic={name:{10:'달의 눈물',13:'잊힌 왕관',15:'잿불의 심장',19:'용의 기억'}[id],value:{10:18,13:28,15:42,19:56}[id],icon:{10:'crystal',13:'crown',15:'heartgem',19:'heartgem'}[id]};
  return decorateRoom(room);
 });
}
export function neighbours(s,id=s.pos){return s.edges.filter(e=>e.includes(id)).map(e=>e[0]===id?e[1]:e[0]);}
function acousticNeighbours(s,id){return neighbours(s,id).filter(n=>worldPassageOpen(s,id,n));}
export function moveCost(s,id,mode=s.mode,from=s.pos){return Math.max(1,(s.campaignVersion===1?(s.rooms[id].stage<2?1:2):hasRisk(s)?RISK.move[s.rooms[id].stage]:s.rooms[id].row>=3?2:1)+MODES[mode].extra)+(passageRule(s,from,id).extra||0);}
export function moveNoise(s,id,mode=s.mode){return Math.max(0,MODES[mode].noise+TERRAINS[s.rooms[id].terrain].noise+(s.rooms[s.pos].enemy?.hp>0?2:0)+(passageRule(s,s.pos,id).noise||0)+(hasGimmicks(s)&&id===site(s,9)&&mode!=='sneak'?2:0));}
export function previewNoise(s,raw){return Math.max(0,Math.min(12,Math.max(0,raw-(hasKeepsake(s,'mistseal')?1:0))+s.resource.rattle-s.resource.quiet));}
function resources(s){return {move:1,sword:0,skill:s.role==='mage'?1:0,block:s.role==='knight'?1:0,quiet:0,rattle:0,...(s.campaignVersion===1?{move:1+(hasKeepsake(s,'waystone')?1:0),sword:hasKeepsake(s,'emberedge')?1:0,skill:(s.role==='mage'?1:0)+(hasKeepsake(s,'inklens')?1:0),block:(s.role==='knight'?1:0)+(hasKeepsake(s,'copperward')?1:0),quiet:hasKeepsake(s,'ember')?1:0}:{})};}
function take(s){
 if(!s.deck.length){if(!s.discard.length)return null;s.deck=shuffle(s,s.discard.splice(0));log(s,'사용한 메달을 섞어 주머니를 다시 채웠습니다.');}
 return s.deck.pop();
}
// Resolve each physical token once. The current reveal never returns to the draw pile.
export function resolvePool(s,initial=null){
 s.drawEffects=[];
 const queue=initial?[...initial]:[];
 if(!initial)for(let i=0;i<5;i++){const id=take(s);if(id)queue.push(id);}
 for(let i=0;i<queue.length;i++){
  const id=queue[i],c=CARDS[id];s.played.push(id);const before={...s.resource};
  for(const [k,v]of Object.entries(c.e)){
   if(['move','sword','skill','block'].includes(k))s.resource[k]+=v;
   if(k==='noise')s.resource[v<0?'quiet':'rattle']+=Math.abs(v);
   if(k==='heal')heal(s,v);
   if(k==='gold')s.gold+=v;
   if(k==='resonate')s.resource.sword+=Math.min(4,Math.floor(s.noise/3));
   if(k==='noiseSkill')s.resource.skill+=Math.min(3,Math.floor(s.noise/4));
   if(k==='echoClear')s.echo[s.pos]=Math.max(0,s.echo[s.pos]-v);
   if(k==='echoArmor'){const n=Math.min(v,s.echo[s.pos]);s.resource.block+=n;s.echo[s.pos]-=n;}
   if(['echoShift','echoSeed'].includes(k)&&s.from!==null&&neighbours(s).includes(s.from)&&worldPassageOpen(s,s.pos,s.from)){const n=k==='echoShift'?Math.min(v,s.echo[s.pos]):v;if(k==='echoShift')s.echo[s.pos]-=n;s.echo[s.from]=Math.min(ECHO_MAX,s.echo[s.from]+n);}
   if(k==='trim'){const j=s.discard.indexOf('slash');if(j>=0)s.discard.splice(j,1);}
   if(k==='reveal')for(const n of neighbours(s))s.rooms[n].seen=true;
   if(k==='draw')for(let n=0;n<v;n++){const extra=take(s);if(extra)queue.push(extra);}
  }
  s.drawEffects.push({id,delta:Object.fromEntries(Object.keys(s.resource).map(k=>[k,s.resource[k]-before[k]]))});
 }
 if(s.campaignVersion!==1)delete s.drawEffects;
 s.poolTotal={...s.resource};
 log(s,`${queue.length}개 자동 추출 · 공격 ${s.resource.sword} / 이동 ${s.resource.move} / 기술 ${s.resource.skill}`,'good');
 return queue;
}
export function soundField(s,origin,strength,noise=s.noise){
 const levels=new Map([[origin,strength]]),todo=[origin];
 while(todo.length){const id=todo.shift(),level=levels.get(id);
  for(const n of acousticNeighbours(s,id)){const v=level-soundLoss(s,noise)-TERRAINS[s.rooms[n].terrain].damp;if(v>0&&v>(levels.get(n)||0)){levels.set(n,v);todo.push(n);}}
 }
 return [...levels].map(([id,level])=>({id,level}));
}
export function emitNoise(s,origin,raw,label,personal=true){
 let strength=raw,absorbed=0,gear=0;
 if(personal){strength=Math.max(0,strength-(hasKeepsake(s,'mistseal')?1:0));gear=s.resource.rattle;strength+=gear;s.resource.rattle=0;absorbed=Math.min(strength,s.resource.quiet);s.resource.quiet-=absorbed;strength-=absorbed;}
 strength=Math.max(0,Math.min(12,strength));
 const rise=strength?Math.max(1,Math.ceil(strength/2)):0;
 const field=strength?soundField(s,origin,strength,Math.min(12,s.noise+rise)):[],heard=[];
 for(const {id,level}of field){const e=s.rooms[id].enemy;if(!e||e.hp<=0||['sight','quiet','echo'].includes(e.sense)||e.sense==='loud'&&level<4)continue;
  e.awareness=Math.min(6,e.awareness+level);e.mode=e.awareness>=4?'hunt':e.awareness>=2?'investigate':'listen';e.target=origin;e.memory=3;
  heard.push({id,level,name:e.name});
 }
 s.soundSeq++;s.lastSound={seq:s.soundSeq,origin,strength,raw:raw+gear,gear,absorbed,label,field,heard,turn:s.turn};
 s.noise=Math.min(12,s.noise+rise);upgradeEcho(s);if(s.echo&&rise&&s.rooms[origin].biome!=='absorb')s.echo[origin]=Math.min(ECHO_MAX,s.echo[origin]+rise*(s.rooms[origin].biome==='resonant'?2:1)+(label==='돌멩이 유인'&&hasKeepsake(s,'decoybell')?2:0));
 if(s.worldVersion===1&&!s.blockedEdges.length&&field.some(p=>s.rooms[p.id].biome==='fragile'&&p.level>=7)){if(hasKeepsake(s,'stalestone')&&!s.collapseSaved){s.collapseSaved=true;log(s,'돌의 약속이 무너지는 천장을 한 번 버텼습니다.','good');}else{s.blockedEdges.push([...s.fragileEdge]);log(s,'종유석이 무너져 지름길을 막았습니다. 우회로를 확인하세요.','bad');}}
 s.noiseMade+=strength;
 if(strength)log(s,`${label} · 소리 ${strength}${absorbed?` (은신으로 ${absorbed} 흡수)`:''} · ${heard.length?`적 ${heard.length}명이 들었습니다`:'들킨 기척 없음'}`,heard.length?'bad':'normal');
 else log(s,`${label} · 소리 없이 움직였습니다${absorbed?` (은신 ${absorbed} 사용)`:''}`,'good');
 return s.lastSound;
}
function freshFields(s){Object.assign(s,{mode:'walk',soundSeq:0,lastSound:null,noiseMade:0,hideTurn:0,lureTurn:0,hidden:false,pursuits:[]});}
export function newRun({seed=Date.now(),role='rogue',layout='expanded',gimmicks=true,risk=false,campaign=false,heat=0,unlockedCards=null,startingKeepsake=null,unlockedKeepsakes=null}={}){
 if(!Object.hasOwn(ROLES,role))role='rogue';seed=Number(seed)>>>0||135792468;
 const s={version:VERSION,seed,rng:seed,role,turn:1,pos:0,from:null,hp:ROLES[role].hp,maxHp:ROLES[role].hp,gold:0,noise:0,resource:null,hand:[],deck:[],discard:[],played:[],edges:EDGES.map(e=>[...e]),rooms:[],market:[],log:[],relic:null,countdown:null,phase:'playing',pending:null,kills:0,purchases:0,refreshTurn:0,steps:0};
 if(layout!=='classic'){s.layout=layout==='staged'?'staged':'expanded';s.edges.push(...EXPANDED_EDGES.map(e=>[...e]));}
 freshFields(s);s.memory=0;s.resource=resources(s);s.rooms=generateRooms(s);s.echo=Array(s.rooms.length).fill(0);
 s.deck=shuffle(s,['scout','step','slash','focus','guard']);
 s.market=['step',...shuffle(s,MARKET_IDS.filter(x=>x!=='step')).slice(0,3)];
 resolvePool(s,['scout','step',role==='mage'?'spark':'slash','focus',role==='rogue'?'sneak':'guard']);
 if(layout==='staged')configureStages(s,{gimmicks});
 if(layout==='staged'&&gimmicks&&(risk||campaign))configureRisk(s);
 if(layout==='staged'&&gimmicks&&campaign){configureCampaign(s,{heat,unlockedCards,startingKeepsake,unlockedKeepsakes});}
 log(s,'금고의 문이 열렸습니다. 능력이 자동으로 추출됩니다. 유물을 찾아 이 입구로 돌아오세요.','good');return s;
}
export function migrateSave(old){
 if(old?.version!==1||!Array.isArray(old.rooms)||old.rooms.length!==16)return null;
 const s=JSON.parse(JSON.stringify(old));s.version=VERSION;freshFields(s);s.rooms.forEach(decorateRoom);s.resource.quiet=0;s.resource.rattle=0;
 const unplayed=s.hand.splice(0);resolvePool(s,unplayed);log(s,'탐험을 이어갑니다. 남은 손패는 자동으로 합산되었습니다.','good');return s;
}
function ok(s,message){return {ok:true,state:s,message};}
function fail(s,message){return {ok:false,state:s,message};}
function damage(s,amount,source){const blocked=Math.min(amount,s.resource.block);s.resource.block-=blocked;const taken=amount-blocked;s.hp=Math.max(0,s.hp-taken);log(s,`${source} · ${blocked?`방어 ${blocked}, `:''}피해 ${taken}`,taken?'bad':'good');return taken;}
function finish(s,won,reason){s.phase=won?'won':'lost';s.pending=null;s.reason=reason;s.score=won?(isStaged(s)?s.relic.value+20+s.hp+expeditionBonuses(s).tempo+expeditionBonuses(s).quiet:s.relic.value+s.gold+s.rooms.filter(r=>r.visited).length*2+s.hp+20):0;log(s,reason,won?'good':'bad');}
function nextStep(s,from,to){const q=[[from]],seen=new Set([from]);while(q.length){const path=q.shift(),id=path.at(-1);if(id===to)return path[1]??from;for(const n of acousticNeighbours(s,id))if(movementDirectionAllowed(s,id,n)&&!seen.has(n)){seen.add(n);q.push([...path,n]);}}return from;}
export function enemyTurn(s){
 s.pursuits=[];
 const enemies=s.rooms.filter(r=>r.enemy?.hp>0).map(r=>({id:r.id,e:r.enemy}));
 for(const {id,e}of enemies){
  if(s.campaignVersion===1){
   if(e.kind==='drummer')emitNoise(s,id,3,'뼈 북지기의 북소리',false);
   if(e.kind==='choir')for(const n of acousticNeighbours(s,id)){const other=s.rooms[n].enemy;if(other&&other!==e&&other.hp>0&&other.home!==19)other.hp=Math.min(other.maxHp,other.hp+1);}
   const local=distances(s,id);
   if(e.sense==='sight'&&local[s.pos]===1||e.sense==='quiet'&&local[s.pos]<=2&&s.resource.quiet>=3){e.target=s.pos;e.memory=2;e.mode='hunt';e.awareness=4;}
   if(e.sense==='echo'){const hot=s.echo.map((v,n)=>({n,v})).filter(p=>p.v>0&&local[p.n]<=2).sort((a,b)=>b.v-a.v||a.n-b.n)[0];if(hot){e.target=hot.n;e.memory=2;e.mode='hunt';e.awareness=4;}}
   if(id===s.pos&&e.kind==='hushpriest')s.resource.quiet=Math.max(0,s.resource.quiet-2);
  }
  if(id===s.pos){e.mode='hunt';e.target=s.pos;e.memory=3;e.awareness=6;damage(s,e.damage,e.name+'의 반격');continue;}
  if(e.memory>0&&e.target!==null){
   if(!e.anchored&&e.mode!=='listen'&&id!==e.target){const dest=nextStep(s,id,e.target),room=s.rooms[dest];let arrived=dest;
    if(dest!==id&&!(room.enemy?.hp>0)){s.rooms[id].enemy=null;room.enemy=e;s.pursuits.push({from:id,to:dest});if(e.kind==='bellrunner'&&e.mode==='hunt'&&dest!==e.target){const second=nextStep(s,dest,e.target);if(second!==dest&&!(s.rooms[second].enemy?.hp>0)){room.enemy=null;s.rooms[second].enemy=e;arrived=second;s.pursuits.push({from:dest,to:second});}}
     if(s.rooms[arrived].seen||s.rooms[id].seen)log(s,`${e.name}이 기척을 따라 ${s.rooms[arrived].seen?s.rooms[arrived].name:'어둠 속'}으로 이동했습니다.`,'bad');
    }
   }
   e.memory--;
   if(e.memory===0){e.mode='idle';e.target=null;e.awareness=0;}
  }
 }
}
// Shared by room markers, the map, and the actual move action.
export function moveStatus(s,id,mode=s.mode){
 const cost=neighbours(s).includes(id)?moveCost(s,id,mode):0;
 const retreat=s.rooms[s.pos].enemy?.hp>0&&id===s.from;
 let reason='';
 if(s.phase!=='playing')reason='탐험이 끝났습니다. 새 탐험을 시작해 주세요.';
 else if(s.pending)reason='먼저 보상을 선택해 주세요.';
 else if(!neighbours(s).includes(id))reason='연결된 방으로만 이동할 수 있습니다.';
 else if(s.rooms[s.pos].enemy?.hp>0&&!retreat)reason='적을 쓰러뜨리거나 들어온 방으로 후퇴하세요.';
 else if(isStaged(s)&&stageIndex(s,id)>stageIndex(s)&&s.stagePrepared.slice(0,stageIndex(s,id)).some(choice=>choice===null))reason='이전 구역 정비소에서 능력·정리·보급 중 하나를 준비하세요.';
 else if(movementGimmickReason(s,id))reason=movementGimmickReason(s,id);
 else if(s.resource.move<cost)reason=`이동 ${cost} 필요 · 「다음 턴」으로 이동력을 얻으세요.`;
 return {allowed:!reason,cost,retreat:!!retreat,reason};
}

export function passagePreview(s,id,mode=s.mode){
 const rule=passageRule(s,s.pos,id),guard=rule.guard||0,attackSpent=Math.min(guard,s.resource.sword),rawDamage=guard-attackSpent,blockSpent=Math.min(rawDamage,s.resource.block);
 return {...moveStatus(s,id,mode),noise:previewNoise(s,moveNoise(s,id,mode)),attackSpent,blockSpent,damage:rawDamage-blockSpent,rule,crystalStop:hasGimmicks(s)&&id===2};
}

export function apply(s,action){
 if(s.phase!=='playing')return fail(s,'탐험이 끝났습니다. 새 탐험을 시작해 주세요.');
 if(s.pending&&!['reward','skipReward','purge','cancelPurge','keepsake','skipKeepsake','ending'].includes(action.type))return fail(s,'먼저 보상을 선택해 주세요.');
 const r=s.rooms[s.pos];
 switch(action.type){
 case 'mode':if(!MODES[action.id])return fail(s,'알 수 없는 이동 방식입니다.');s.mode=action.id;return ok(s,MODES[s.mode].name+'로 이동합니다.');
 case 'play':return fail(s,'추출된 능력은 이미 자동으로 합산되었습니다.');
 case 'move':{
  const id=action.id,status=moveStatus(s,id);if(!status.allowed)return fail(s,status.reason);
  const cost=status.cost;
  const noise=moveNoise(s,id),rule=passageRule(s,s.pos,id);
  if(rule.guard){const spent=Math.min(rule.guard,s.resource.sword);s.resource.sword-=spent;if(spent<rule.guard)damage(s,rule.guard-spent,'검문 통로');}
  if(hasGimmicks(s)&&rule.kind==='key')s.keyDoorOpen=true;
  if(hasGimmicks(s)&&id===site(s,2)){s.crystalStopTurn=s.turn;log(s,'수정의 울림에 발이 묶였습니다. 이번 턴의 이동은 여기까지입니다. 다른 행동은 가능합니다.');}
  s.resource.move-=cost;s.from=s.pos;s.pos=id;s.steps++;s.hidden=false;s.rooms[id].visited=true;
  if(isStaged(s)){const depth=stageIndex(s);s.memory=Math.max(s.memory,depth);if(s.rooms[id].type==='checkpoint')s.market=[...stageStock(s,checkpointIndex(s))];}
  for(const n of [id,...neighbours(s)])s.rooms[n].seen=true;
  emitNoise(s,id,noise,`${MODES[s.mode].name} · ${TERRAINS[s.rooms[id].terrain].name}`);
  if(s.hp<=0)finish(s,false,'검문 통로에서 쓰러졌습니다. 공격이나 방어를 준비해 통과하세요.');
  return ok(s,s.rooms[id].name+(hasGimmicks(s)&&id===site(s,2)?' · 수정 동굴: 다음 턴에 출발':''));
 }
 case 'hide':{
  if(r.enemy?.hp>0)return fail(s,'눈앞의 적이 지켜보고 있습니다. 먼저 후퇴하세요.');
  if(s.hideTurn===s.turn)return fail(s,'한 턴에 한 번 숨을 고를 수 있습니다.');
  if(s.resource.move<1)return fail(s,'이동 1이 필요합니다.');
  s.resource.move--;s.resource.quiet+=2;s.noise=Math.max(0,s.noise-2);s.hideTurn=s.turn;s.hidden=true;
  log(s,'어둠에 몸을 숨겼습니다. 경계 −2 · 은신 +2','good');return ok(s,'숨죽이기 · 경계 −2 / 은신 +2');
 }
 case 'lure':{
  const id=action.id;if(!neighbours(s).includes(id)||!worldPassageOpen(s,s.pos,id))return fail(s,'돌멩이는 연결된 방에만 던질 수 있습니다.');
  if(s.lureTurn===s.turn)return fail(s,'유인은 턴당 한 번 할 수 있습니다.');
  if(s.resource.skill<1)return fail(s,'유인에는 기술 1이 필요합니다.');
  s.resource.skill--;s.lureTurn=s.turn;emitNoise(s,id,lureRaw(s),'돌멩이 유인',false);return ok(s,'그 방에 돌멩이를 던졌습니다. 적은 턴 끝에 조사합니다.');
 }
 case 'attack':{
  if(!r.enemy||r.enemy.hp<=0)return fail(s,'이 방에는 적이 없습니다.');
  if(s.resource.sword<=0)return fail(s,'공격력이 소진되었습니다. 후퇴하거나 다음 턴을 준비하세요.');
  const hit=Math.min(s.resource.sword,r.enemy.hp);s.resource.sword-=hit;r.enemy.hp-=hit;s.hidden=false;
  if(hasGimmicks(s)&&r.enemy.home===site(s,18)&&r.enemy.hp<=0){s.sealForce=true;log(s,'봉인병의 핵이 부서졌습니다. 기억실의 봉인이 풀립니다.','good');}
  emitNoise(s,s.pos,4+Math.floor(hit/3),'무기가 부딪히는 소리');log(s,`${r.enemy.name}에게 ${hit} 피해!`,'good');
  if(r.enemy.hp<=0){s.gold+=r.enemy.gold;s.kills++;s.pending={type:'reward',options:shuffle(s,[...marketIds(s)]).slice(0,3)};log(s,`${r.enemy.name} 격파 · 금화 +${r.enemy.gold}`,'good');}
  else {r.enemy.mode='hunt';r.enemy.target=s.pos;r.enemy.memory=3;}
  return ok(s,`${hit} 피해`);
 }
 case 'interact':{
  if(r.enemy?.hp>0)return fail(s,'적을 먼저 쓰러뜨려야 합니다.');
  if(r.type==='entry'){if(!s.relic||isStaged(s)&&s.relic.name!=='용의 기억')return fail(s,isStaged(s)?'심층의 용의 기억을 회수해야 탈출할 수 있습니다.':'유물을 하나 찾아야 탈출할 수 있습니다.');finish(s,true,`${s.relic.name}${objectParticle(s.relic.name)} 품고 지상으로 돌아왔습니다.`);return ok(s,'탈출 성공!');}
  if(r.used)return fail(s,'이 방의 보상은 이미 받았습니다.');
  if(r.type==='checkpoint')return fail(s,'정비소에서 능력·정리·보급을 선택하세요.');
  if(r.type==='mechanism'){
   if(!(s.layout==='expanded'||isStaged(s))||r.id!==17)return fail(s,'이 장치는 작동하지 않습니다.');
   const [destination,source]=isStaged(s)?RETURN_LIFT_EDGE:SHORTCUT_EDGE,cost=liftCost(s);
   if(neighbours(s,source).includes(destination))return fail(s,'귀환 지름길이 이미 열려 있습니다.');
   if(s.resource.skill<cost)return fail(s,`승강기에는 기술 ${cost}이 필요합니다.`);
   s.resource.skill-=cost;r.used=true;s.edges.push([destination,source]);s.rooms[destination].seen=true;
   emitNoise(s,s.pos,liftRaw(s),'귀환 윈치');
   log(s,`귀환 승강기 · 기술 −${cost} · ${s.rooms[destination].name}로 통로가 열렸습니다. 소리와 숨결도 지납니다.`,'good');
   return ok(s,`귀환 지름길 개방 · 기술 −${cost}`);
  }
  if(r.type==='chest'){const gold=r.id===18?14:r.row>=3?10:5+Math.floor(next(s)*3),noise=r.id===18?9:r.row>=3?7:3;s.gold+=gold;r.used=true;if(hasGimmicks(s)&&r.id===site(s,2)){s.hasKey=true;log(s,'황동 열쇠 획득 · 지름길을 열어도 소모되지 않습니다.','good');}emitNoise(s,s.pos,noise,r.row>=3?'상자의 경보 장치':'낡은 경첩');log(s,`보물 상자 · 금화 +${gold}`,'good');if(s.campaignVersion===1&&r.site!==1&&s.keepsakes.length<3){const ids=s.availableKeepsakes.filter(id=>!s.keepsakes.includes(id));if(ids.length)s.pending={type:'keepsake',options:shuffle(s,[...ids]).slice(0,3)};}return ok(s,`금화 +${gold}`);}
  if(r.type==='camp'){if(healingAmount(s,hasRisk(s)?RISK.campHeal+(hasKeepsake(s,'memorycup')?1:0):6)===0&&s.noise===0)return fail(s,'아직 쉬어 갈 필요가 없거나 회복 한도를 모두 썼습니다.');const healed=heal(s,hasRisk(s)?RISK.campHeal+(hasKeepsake(s,'memorycup')?1:0):6);s.noise=Math.max(0,s.noise-3);r.used=true;log(s,`불가에서 휴식 · 체력 +${healed}, 경계 −3`,'good');return ok(s,'따뜻한 휴식');}
  if(r.type==='shrine'){const total=[...s.deck,...s.discard,...s.played];if(total.length<=5)return fail(s,'최소 5개의 능력은 남겨 두어야 합니다.');s.pending={type:'purge',options:[...new Set(total)]};return ok(s,'주머니에서 지울 능력을 선택하세요.');}
  if(r.type==='relic'){if(s.campaignVersion===1&&!s.relic){s.pending={type:'ending'};return ok(s,'유물에 남길 약속을 선택하세요.');}if(s.relic&&s.relic.value>=r.relic.value)return fail(s,'이미 더 값진 유물을 가지고 있습니다.');s.relic={...r.relic};r.used=true;if(s.countdown===null)s.countdown=14;emitNoise(s,s.pos,8,'유물 봉인 파괴');log(s,`${r.relic.name} 획득! ${s.countdown}턴 이내에 입구로 탈출하세요.`,'good');if(s.echo){s.memory=Math.min(MEMORY_MAX,(s.memory||0)+1);log(s,`금고의 기억이 깊어진다 · 메아리가 ${echoFadeEvery(s)}턴마다 1씩 옅어짐`,'bad');return ok(s,`유물 획득 · 금고가 ${echoFadeEvery(s)}턴을 기억합니다`);}return ok(s,'유물 획득 · 용이 깨어났습니다!');}
  return fail(s,'상인에게 물약을 구매할 수 있습니다.');
 }
 case 'buyKey':{
  const index=checkpointIndex(s);
  if(!hasGimmicks(s)||index<0||s.stagePrepared[index]===null||r.enemy?.hp>0)return fail(s,'준비를 마친 정비소에서 열쇠를 구할 수 있습니다.');
  if(s.hasKey)return fail(s,'황동 열쇠를 이미 가지고 있습니다.');if(s.gold<5)return fail(s,'금화 5가 필요합니다.');
  s.gold-=5;s.hasKey=true;log(s,'황동 열쇠 구매 · 모든 열쇠 문에 재사용 가능','good');return ok(s,'황동 열쇠 획득');
 }
 case 'sluice':{
  if(!hasGimmicks(s)||s.pos!==site(s,14)||r.enemy?.hp>0)return fail(s,'적이 없는 수문 조작실에서 조작하세요.');
  if(s.sluiceOpen)return fail(s,'귀환 사다리가 이미 열려 있습니다.');if(s.resource.skill<1)return fail(s,'기술 1이 필요합니다.');
  s.resource.skill--;s.sluiceOpen=true;emitNoise(s,s.pos,5,'수문 사다리 개방');return ok(s,'낙하 통로를 왕복할 수 있습니다.');
 }
 case 'quietSeal':{
  if(!hasGimmicks(s)||s.pos!==site(s,16)||r.enemy?.hp>0)return fail(s,'적이 없는 고요의 공명제단에서 시도하세요.');
  if(s.sealQuiet)return fail(s,'고요의 봉인이 이미 풀렸습니다.');
  if(s.resource.skill<2||s.resource.quiet<3)return fail(s,'이번 턴의 기술 2와 은신 3이 필요합니다.');
  s.resource.skill-=2;s.resource.quiet-=3;s.sealQuiet=true;s.edges.push([site(s,16),19]);s.rooms[19].seen=true;
  log(s,'흐트러진 기억을 소리 없이 맞췄습니다. 기억실의 봉인과 비밀길이 열립니다.','good');return ok(s,'봉인 해제 · 기억실 비밀길 개방');
 }
 case 'keepsake':{
  if(s.pending?.type!=='keepsake'||!s.pending.options.includes(action.id)||s.keepsakes.length>=3)return fail(s,'선택할 수 없는 기억 유물입니다.');
  takeKeepsake(s,action.id);s.pending=null;return ok(s,'기억 유물을 간직했습니다.');
 }
 case 'skipKeepsake':if(s.pending?.type!=='keepsake')return fail(s,'선택 중인 유물이 없습니다.');s.pending=null;return ok(s,'기억 유물을 남겨 두었습니다.');
 case 'buyKeepsake':{
  const k=checkpointIndex(s),id=s.artifactStock?.[k]?.[action.index];
  if(s.campaignVersion!==1||k<0||s.stagePrepared[k]===null||r.enemy?.hp>0||s.keepsakeTrades[k]||s.keepsakes.length>=3||s.keepsakes.includes(id)||!KEEPSAKES[id])return fail(s,'이 정비소에서 구입할 수 없는 기억 유물입니다.');
  if(s.gold<7)return fail(s,'금화7이 필요합니다.');s.gold-=7;s.keepsakeTrades[k]=true;takeKeepsake(s,id);return ok(s,'기억 유물 구매 완료');
 }
 case 'ending':{
  if(s.pending?.type!=='ending'||!['seal','remember'].includes(action.id))return fail(s,'기억의 약속을 선택하세요.');
  s.ending=action.id;s.pending=null;s.relic={...r.relic};r.used=true;s.countdown=10;
  if(action.id==='seal')s.resource.quiet+=3;else s.resource.block+=3;
  emitNoise(s,s.pos,action.id==='seal'?5:8,'기억의 약속');log(s,`${s.relic.name} 회수 · 남은 귀환10턴`,'good');return ok(s,'입구로 돌아가 약속을 완성하세요.');
 }
 case 'merchant':{
  if(r.type!=='merchant'||r.enemy?.hp>0)return fail(s,'적이 없는 상인의 방에서 구매할 수 있습니다.');if(r.used)return fail(s,'물약이 품절되었습니다.');if(s.hp===s.maxHp)return fail(s,'체력이 이미 가득 찼습니다.');if(s.gold<5)return fail(s,'금화 5가 필요합니다.');
  s.gold-=5;heal(s,8);r.used=true;return ok(s,'체력 8을 회복했습니다.');
 }
 case 'prepare':{
  const index=checkpointIndex(s),total=[...s.deck,...s.discard,...s.played];
  if(index<0||r.enemy?.hp>0)return fail(s,'적이 없는 층간 정비소에서 준비할 수 있습니다.');
  if(s.stagePrepared[index]!==null)return fail(s,'이 정비소의 준비는 이미 마쳤습니다.');
  if(action.choice==='recruit'){if(!stageOffers(s,index).includes(action.id))return fail(s,'이 정비소의 기억을 고르세요.');s.discard.push(action.id);}
  else if(action.choice==='resupply'){heal(s,hasRisk(s)?RISK.prepareHeal:6);s.noise=Math.max(0,s.noise-2);s.provisions++;}
  else if(action.choice==='refine'){if(total.length<=5)return fail(s,'최소 5개의 능력을 남겨야 합니다.');s.pending={type:'purge',options:[...new Set(total)],checkpoint:index};return ok(s,'다음 구역을 위해 내려놓을 기억을 고르세요.');}
  else return fail(s,'능력 영입·기억 정리·보급 중 하나를 선택하세요.');
  s.stagePrepared[index]=action.choice;r.used=true;log(s,`${STAGES[index].name} 정비 · ${action.choice==='recruit'?CARDS[action.id].name+' 영입':`체력 회복 최대 ${hasRisk(s)?RISK.prepareHeal:6} · 보급 +1 · 경계 −2`} · 다음 구역 개방`,'good');return ok(s,'준비 완료 · 다음 구역으로 갈 수 있습니다.');
 }
 case 'provision':{
  if(!isStaged(s)||s.provisions<1)return fail(s,'남은 휴대 보급이 없습니다.');
  if(s.provisionTurn===s.turn)return fail(s,'휴대 보급은 턴마다 한 번 사용할 수 있습니다.');
  if(s.hp>=s.maxHp)return fail(s,'체력이 가득 차 있습니다.');
  if(healingLeft(s)===0)return fail(s,'이번 원정의 회복 한도를 모두 썼습니다.');
  const amount=heal(s,hasRisk(s)?RISK.heal:6);s.provisions--;s.provisionTurn=s.turn;emitNoise(s,s.pos,provisionRaw(s),'보급 꾸러미 풀기');log(s,`휴대 보급 · 체력 +${amount}`,'good');return ok(s,`체력 +${amount} · 보급 사용`);
 }
 case 'buy':{
  const camp=checkpointIndex(s);if(isStaged(s)&&(camp<0||r.enemy?.hp>0||s.stagePrepared[camp]===null||s.stageTrades[camp]>=1))return fail(s,'각 정비소의 추가 교역은 한 번만 가능합니다.');
  const i=action.index,id=s.market[i],c=CARDS[id];if(!c)return fail(s,'능력을 찾을 수 없습니다.');if(s.resource.skill<c.cost)return fail(s,`기술 ${c.cost}이 필요합니다.`);
  s.resource.skill-=c.cost;s.discard.push(id);s.purchases++;if(isStaged(s))s.stageTrades[camp]++;s.market[i]=sample(s,marketIds(s).filter(x=>!s.market.includes(x)));log(s,`${c.name} 영입 · 주머니를 다시 섞을 때부터 추출`,'good');return ok(s,`${c.name} 획득`);
 }
 case 'refresh':if(isStaged(s)&&(checkpointIndex(s)<0||s.rooms[s.pos].enemy?.hp>0||s.stagePrepared[checkpointIndex(s)]===null||s.stageTrades[checkpointIndex(s)]>=1))return fail(s,'추가 교역이 남은 정비소에서 목록을 바꿀 수 있습니다.');if(s.refreshTurn===s.turn)return fail(s,'교역소는 턴당 한 번 교체할 수 있습니다.');if(s.gold<2)return fail(s,'금화 2가 필요합니다.');s.gold-=2;s.market=shuffle(s,[...marketIds(s)]).slice(0,4);s.refreshTurn=s.turn;return ok(s,'교역소 능력이 바뀌었습니다.');
 case 'reward':if(s.pending?.type!=='reward'||!s.pending.options.includes(action.id))return fail(s,'선택할 수 없는 보상입니다.');s.discard.push(action.id);s.pending=null;log(s,`전투 보상 · ${CARDS[action.id].name}`,'good');return ok(s,'새 능력을 메달 주머니에 넣었습니다.');
 case 'skipReward':if(s.pending?.type!=='reward')return fail(s,'선택할 보상이 없습니다.');s.pending=null;return ok(s,'보상을 받지 않았습니다.');
 case 'purge':{
  if(s.pending?.type!=='purge'||!s.pending.options.includes(action.id))return fail(s,'지울 능력을 선택하세요.');
  for(const pile of [s.discard,s.deck,s.played]){const i=pile.indexOf(action.id);if(i!==-1){pile.splice(i,1);break;}}
  if(isStaged(s)&&Number.isInteger(s.pending.checkpoint)){s.stagePrepared[s.pending.checkpoint]='refine';}
  s.pending=null;r.used=true;log(s,`${isStaged(s)&&r.type==='checkpoint'?'정비소의 기억 정리':'망각의 제단'} · ${CARDS[action.id].name} 1개 제거`,'good');return ok(s,'메달 주머니가 가벼워졌습니다.');
 }
 case 'cancelPurge':if(s.pending?.type!=='purge')return fail(s,'진행 중인 의식이 없습니다.');s.pending=null;return ok(s,'의식을 미뤘습니다.');
 case 'end':{
  enemyTurn(s);if(s.hp<=0){finish(s,false,'어둠 속에서 쓰러졌습니다. 적의 추적 경로와 방어력을 살펴보세요.');return ok(s,'탐험 종료');}
  upgradeEcho(s);s.attack=null;const due=dragonDue(s);
  if(due&&s.echo){
   const plan=breathPlan(s),a={cause:due,...plan,echoes:[...s.echo],pos:s.pos,beforeHp:s.hp,taken:0,blocked:0};
   if(plan.hit){if(hasKeepsake(s,'mirrorheart')&&!s.mirrorSpent){s.mirrorSpent=true;log(s,'거울 심장이 숨결을 대신 받았습니다.','good');}a.blocked=Math.min(plan.damage,s.resource.block);a.taken=damage(s,plan.damage,`용의 숨결 · 메아리를 따라 이 방까지 (메아리 ${plan.echo})`);}
   else log(s,plan.start===null?'용의 숨결 · 따라갈 메아리가 없었다':`용의 숨결 · 메아리 ${plan.path.length}곳을 태웠지만 닿지 않았다`,'good');
   for(const id of plan.path)s.echo[id]=0;
   a.afterHp=s.hp;s.attack=a;if(due==='noise')s.noise=Math.max(0,s.noise-5);
  }
  else if(s.noise>=8){damage(s,3+Math.floor(s.turn/10),'소음을 들은 용의 숨결');s.noise=Math.max(0,s.noise-5);}
  else if(s.relic&&s.turn%3===0)damage(s,2,'깨어난 용의 숨결');
  if(s.hp<=0){finish(s,false,'용의 숨결이 금고를 삼켰습니다.');return ok(s,'탐험 종료');}
  if(s.countdown!==null){s.countdown--;if(s.countdown<=0){finish(s,false,'금고가 무너졌습니다. 유물을 얻으면 입구로 돌아가세요.');return ok(s,'탐험 종료');}}
  s.discard.push(...s.played);s.played=[];s.turn++;if(s.echo&&s.turn%echoFadeEvery(s)===0)s.echo=s.echo.map(v=>Math.max(0,v-1));s.resource=resources(s);s.hidden=false;s.noise=Math.max(0,s.noise-2-(s.role==='rogue'?1:0));
  resolvePool(s);return ok(s,`새 메달 ${s.played.length}개가 열렸습니다.`);
 }
 default:return fail(s,'알 수 없는 행동입니다.');
 }
}
export function validSave(s){
 if(!(s&&s.version===VERSION&&Object.hasOwn(ROLES,s.role)&&Object.hasOwn(MODES,s.mode)&&Array.isArray(s.rooms)))return false;
 const plainLabel=value=>typeof value==='string'&&value.length<=160&&!/[<>\"']/.test(value);
 const count=s.rooms.length,expanded=s.layout==='expanded'||isStaged(s),roomId=id=>Number.isInteger(id)&&id>=0&&id<count;
 if((expanded?count!==20:count!==16)||(!expanded&&s.layout!==undefined&&s.layout!=='classic'))return false;
 if(!(roomId(s.pos)&&Array.isArray(s.edges)&&['playing','won','lost'].includes(s.phase)&&Number.isFinite(s.hp)&&s.resource&&s.poolTotal&&Array.isArray(s.market)&&s.market.length===4&&Array.isArray(s.log)))return false;
 if(!s.rooms.every((r,id)=>r&&r.id===id&&r.row===Math.floor(id/4)&&r.col===id%4&&Object.hasOwn(TERRAINS,r.terrain)))return false;
 if(!['seed','rng','turn','maxHp','gold','noise'].every(k=>Number.isFinite(s[k])&&s[k]>=0)||s.turn<1||s.maxHp<=0)return false;
 if(!['score','noiseMade','steps','kills','purchases','refreshTurn','countdown','soundSeq'].every(k=>s[k]==null||Number.isFinite(s[k])&&s[k]>=0))return false;
 if(!['move','sword','skill','block','quiet','rattle'].every(k=>Number.isFinite(s.poolTotal[k])&&s.poolTotal[k]>=0))return false;
 if(!s.rooms.every(r=>plainLabel(r.name)&&(!r.relic||plainLabel(r.relic.name)&&Number.isFinite(r.relic.value))&&(!r.enemy||plainLabel(r.enemy.name)&&Object.hasOwn(ENEMIES,r.enemy.kind)&&Object.hasOwn(ALERTS,r.enemy.mode)&&['hp','maxHp','damage','gold','memory','awareness'].every(k=>Number.isFinite(r.enemy[k])&&r.enemy[k]>=0))))return false;
 if(s.relic&&(!plainLabel(s.relic.name)||!Number.isFinite(s.relic.value)))return false;
 if(!s.log.every(entry=>entry&&typeof entry.message==='string'&&['normal','good','bad'].includes(entry.tone)&&Number.isFinite(entry.turn)))return false;
 if(s.lastSound&&(!Array.isArray(s.lastSound.field)||!Array.isArray(s.lastSound.heard)||!roomId(s.lastSound.origin)||!s.lastSound.field.every(p=>p&&roomId(p.id)&&Number.isFinite(p.level))||!s.lastSound.heard.every(p=>p&&roomId(p.id)&&Number.isFinite(p.level)&&plainLabel(p.name))))return false;
 if(s.lastSound&&(!Array.isArray(s.lastSound.field)||!Array.isArray(s.lastSound.heard)||!['seq','origin','strength','raw','gear','absorbed','turn'].every(k=>Number.isFinite(s.lastSound[k]))||typeof s.lastSound.label!=='string'))return false;

 if(isStaged(s)){
  if(!Array.isArray(s.stagePrepared)||s.stagePrepared.length!==3||!s.stagePrepared.every(c=>[null,'recruit','refine','resupply'].includes(c))||!Array.isArray(s.stageTrades)||s.stageTrades.length!==3||!s.stageTrades.every(n=>Number.isInteger(n)&&n>=0&&n<=1)||!Number.isInteger(s.provisions)||s.provisions<0||s.provisions>4||!Number.isInteger(s.provisionTurn)||s.provisionTurn<0||s.provisionTurn>s.turn)return false;
  if(!s.rooms.every((r,id)=>r.stage===STAGE_ROOMS[id]))return false;
  if(!Number.isInteger(s.memory)||s.memory<s.rooms[s.pos].stage||s.memory>MEMORY_MAX||s.stagePrepared.some((choice,i)=>choice!==null&&s.stagePrepared.slice(0,i).some(x=>x===null))||s.stageTrades.some((trades,i)=>trades>0&&s.stagePrepared[i]===null))return false;
  if(s.stagePrepared.slice(0,s.rooms[s.pos].stage).some(choice=>choice===null))return false;
  if(s.pending?.checkpoint!==undefined&&(!Number.isInteger(s.pending.checkpoint)||s.pending.checkpoint!==checkpointIndex(s)||s.pending.type!=='purge'||s.stagePrepared[s.pending.checkpoint]!==null))return false;
  if(s.rooms.filter(r=>r.type==='relic').length!==1||s.rooms[19].type!=='relic'||s.rooms[19].relic?.name!=='용의 기억'||s.relic&&s.relic.name!=='용의 기억')return false;
  if(STAGES.slice(0,3).some((stage,i)=>s.rooms[stage.checkpoint].type!=='checkpoint'||s.rooms[stage.checkpoint].used!==(s.stagePrepared[i]!==null)))return false;
 }
 if(s.worldVersion!==undefined&&!worldValid(s))return false;
 if(s.gimmicksVersion!==undefined){
  if(!hasGimmicks(s)||!['hasKey','keyDoorOpen','sluiceOpen','sealForce','sealQuiet'].every(k=>typeof s[k]==='boolean')||!Number.isInteger(s.crystalStopTurn)||s.crystalStopTurn<0||s.crystalStopTurn>s.turn)return false;
  if(s.keyDoorOpen&&!s.hasKey||s.pos===19&&!(s.sealForce||s.sealQuiet))return false;
  const secret=s.edges.some(e=>Array.isArray(e)&&e.includes(site(s,16))&&e.includes(19));if(secret!==s.sealQuiet)return false;
 }
 if(s.firstRun!==undefined){const p=s.firstRun;if(!p||p.version!==1||!isStaged(s)||typeof p.enabled!=='boolean'||typeof p.used!=='boolean'||!(p.memory===null||Object.hasOwn(CARDS,p.memory))||!Number.isInteger(p.drawnTurn)||p.drawnTurn<0||p.drawnTurn>s.turn)return false;}
 if(s.riskVersion!==undefined&&(!hasRisk(s)||s.gimmicksVersion!==1||!Number.isInteger(s.healingUsed)||s.healingUsed<0||s.healingUsed>RISK.healing))return false;

 if(s.campaignVersion!==undefined&&!validCampaign(s))return false;
 const connections=new Set();
 for(const edge of s.edges){
  if(!Array.isArray(edge)||edge.length!==2||!edge.every(roomId)||edge[0]===edge[1])return false;
  const key=[...edge].sort((a,b)=>a-b).join(':');if(connections.has(key))return false;connections.add(key);
 }
 if(s.echo!==undefined&&s.echo!==null&&(!Array.isArray(s.echo)||s.echo.length!==count||!s.echo.every(v=>Number.isFinite(v)&&v>=0&&v<=ECHO_MAX)))return false;
 return ['hand','deck','discard','played','market'].every(p=>Array.isArray(s[p])&&s[p].every(c=>Object.hasOwn(CARDS,c)))&&['move','sword','skill','block','quiet','rattle'].every(k=>Number.isFinite(s.resource[k])&&s.resource[k]>=0);
}

export function marketIds(s){return s.campaignVersion===1?s.availableCards.filter(id=>!['slash','focus','guard'].includes(id)):MARKET_IDS;}

function configureCampaign(s,{heat=0,unlockedCards=null,startingKeepsake=null,unlockedKeepsakes=null}={}){
 s.campaignVersion=1;s.heat=Math.max(0,Math.min(10,Math.floor(heat)||0));s.runId=`${s.seed}-${s.role}-${s.heat}`;s.storySeen=[];s.ending=null;s.mirrorSpent=false;
 s.keepsakes=[startingKeepsake&&KEEPSAKES[startingKeepsake]?startingKeepsake:(STARTING_KEEPSAKES[s.role]||'ember')];
 if(s.keepsakes.includes('ironheart')){s.maxHp+=3;s.hp+=3;}if(s.keepsakes.includes('hollowkey'))s.hasKey=true;
 s.availableCards=[...new Set([...BASE_CARD_IDS,...(unlockedCards||Object.keys(EXTRA_CARDS))].filter(id=>CARDS[id]))];s.availableKeepsakes=[...new Set([...(unlockedKeepsakes||Object.keys(KEEPSAKES)),...s.keepsakes])].filter(id=>KEEPSAKES[id]);s.keepsakeTrades=[false,false,false];
 s.roleMemories=s.availableCards.filter(id=>ROLE_AXES[s.role].includes(CARDS[id].axis));
 const pools=[s.availableCards.filter(id=>CARDS[id].cost<=4),s.availableCards.filter(id=>CARDS[id].cost>=3&&CARDS[id].cost<=5),s.availableCards.filter(id=>CARDS[id].cost>=4)];
 const roleOffer=(pool,count)=>{const preferred=shuffle(s,pool.filter(id=>s.roleMemories.includes(id)));return [...new Set([...preferred.slice(0,1),...shuffle(s,[...pool])])].slice(0,count);};
 s.stageOffers=pools.map((pool,i)=>roleOffer([...new Set([...STAGES[i].offers,...pool])],3));s.stageStock=pools.map(pool=>roleOffer(pool,4));s.artifactStock=[0,1,2].map(()=>shuffle(s,[...s.availableKeepsakes]).slice(0,3));
 for(const r of s.rooms)if(r.enemy){const home=r.id;if(![4,18,19].includes(home)){const kind=sample(s,Object.keys(ENEMIES).filter(kind=>!['dragon','sentinel'].includes(kind))),meta=ENEMIES[kind];Object.assign(r.enemy,{kind,art:meta.art,sense:meta.sense,name:meta.name,hue:meta.hue||0});}if(home===19){r.enemy.hp=r.enemy.maxHp=16;r.enemy.damage=4;}if(home===18){r.enemy.hp=r.enemy.maxHp=14;r.enemy.damage=4;}if(home===3){r.enemy.hp=r.enemy.maxHp=6;r.enemy.damage=2;}if([10,12].includes(home)){r.enemy.hp=r.enemy.maxHp=8;r.enemy.damage=3;}r.enemy.maxHp=Math.ceil(r.enemy.maxHp*(1+s.heat*.08));r.enemy.hp=r.enemy.maxHp;r.enemy.damage+=Math.floor(s.heat/3);}
 configureWorld(s);
 const active={rogue:['scout','step','slash','focus','velvet'],knight:['ropewalk','step','slash','focus','guard'],mage:['scout','step','spark','quickstudy','guard'],warden:['scout','step','slash','echoeraser','guard'],cantor:['scout','step','thunder','focus','guard']}[s.role];
 for(const id of active||[])if(!s.availableCards.includes(id))s.availableCards.push(id);
 s.played=[];s.resource=resources(s);resolvePool(s,active||['scout','step','slash','focus','sneak']);s.market=[...s.stageStock[0]];
}
export function stageOffers(s,index){return s.campaignVersion===1?s.stageOffers[index]:STAGES[index].offers;}
export function stageStock(s,index){return s.campaignVersion===1?s.stageStock[index]:STAGES[index].stock;}
function takeKeepsake(s,id){
 s.keepsakes.push(id);if(id==='hollowkey')s.hasKey=true;if(id==='ironheart'){s.maxHp+=3;heal(s,3);}log(s,`${KEEPSAKES[id].name} · ${KEEPSAKES[id].text}`,'good');
}
function validCampaign(s){
 if(s.campaignVersion!==1||s.worldVersion!==1||s.riskVersion!==1||!Number.isInteger(s.heat)||s.heat<0||s.heat>10||typeof s.runId!=='string'||!s.runId.length||s.runId.length>100)return false;
 if(!Array.isArray(s.keepsakes)||s.keepsakes.length>3||new Set(s.keepsakes).size!==s.keepsakes.length||!s.keepsakes.every(id=>Object.hasOwn(KEEPSAKES,id)))return false;
 if(!Array.isArray(s.availableCards)||!s.availableCards.length||s.availableCards.length>60||!s.availableCards.every(id=>Object.hasOwn(CARDS,id)))return false;
 if(!['stageOffers','stageStock'].every(k=>Array.isArray(s[k])&&s[k].length===3&&s[k].every(list=>Array.isArray(list)&&list.length===(k==='stageOffers'?3:4)&&list.every(id=>s.availableCards.includes(id)))))return false;
 if(!Array.isArray(s.availableKeepsakes)||!s.availableKeepsakes.length||s.availableKeepsakes.length>16||!s.availableKeepsakes.every(id=>Object.hasOwn(KEEPSAKES,id)))return false;
 if(!Array.isArray(s.artifactStock)||s.artifactStock.length!==3||!s.artifactStock.every(list=>Array.isArray(list)&&list.length>=1&&list.length<=3&&list.every(id=>s.availableKeepsakes.includes(id))))return false;
 if(!Array.isArray(s.roleMemories)||!s.roleMemories.every(id=>s.availableCards.includes(id)&&ROLE_AXES[s.role].includes(CARDS[id].axis)))return false;
 if(!Array.isArray(s.keepsakeTrades)||s.keepsakeTrades.length!==3||!s.keepsakeTrades.every(v=>typeof v==='boolean'))return false;
 if(!Array.isArray(s.storySeen)||!s.storySeen.every(n=>Number.isInteger(n)&&n>=0&&n<4)||typeof s.mirrorSpent!=='boolean'||![null,'seal','remember'].includes(s.ending))return false;
 if(s.relic&&!s.ending)return false;
 if(!s.rooms.every(r=>!r.enemy||(Object.hasOwn(ENEMIES,r.enemy.kind)&&Number.isFinite(r.enemy.hp)&&Number.isFinite(r.enemy.maxHp)&&r.enemy.maxHp>0&&r.enemy.hp<=r.enemy.maxHp)))return false;
 if(s.drawEffects!==undefined&&(!Array.isArray(s.drawEffects)||s.drawEffects.length!==s.played.length||!s.drawEffects.every((entry,i)=>entry&&entry.id===s.played[i]&&entry.delta&&['move','sword','skill','block','quiet','rattle'].every(k=>Number.isFinite(entry.delta[k])))))return false;
 if(s.pending&&(!['reward','purge','keepsake','ending'].includes(s.pending.type)||(s.pending.type!=='ending'&&(!Array.isArray(s.pending.options)||!s.pending.options.length))))return false;
 if(s.pending&&['reward','purge'].includes(s.pending.type)&&!s.pending.options.every(id=>Object.hasOwn(CARDS,id)))return false;
 if(s.pending?.type==='keepsake'&&(!Array.isArray(s.pending.options)||!s.pending.options.length||!s.pending.options.every(id=>Object.hasOwn(KEEPSAKES,id))))return false;
 if(s.pending?.type==='ending'&&(s.pos!==19||s.rooms[19].enemy?.hp>0||s.relic))return false;
 return true;
}
