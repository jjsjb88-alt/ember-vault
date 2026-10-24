export const VERSION=2;
export const ROLES={
  rogue:{name:'그림자 도적',short:'도적',color:'#86c6aa',icon:'hero',desc:'가볍게 걷고, 조용히 훔칩니다.',trait:'매 턴 소음 1 추가 감소',hp:22},
  knight:{name:'잿빛 기사',short:'기사',color:'#e5ad72',icon:'knight',desc:'두꺼운 방패로 위험을 견딥니다.',trait:'최대 체력 28 · 매 턴 방어 1',hp:28},
  mage:{name:'불씨 마법사',short:'마법사',color:'#b59be5',icon:'mage',desc:'지식으로 더 강한 덱을 만듭니다.',trait:'매 턴 기술 1 추가',hp:20}
};
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
export const MARKET_IDS=Object.keys(CARDS).filter(x=>!['slash','focus','guard'].includes(x));

export const MODES={walk:{name:'걷기',short:'보통',noise:2,extra:0},sneak:{name:'살금살금',short:'은밀',noise:0,extra:1},rush:{name:'질주',short:'빠르게',noise:5,extra:-1}};
export const TERRAINS={stone:{name:'돌바닥',noise:0,damp:0},water:{name:'물웅덩이',noise:1,damp:0},shards:{name:'돌 파편',noise:2,damp:0},moss:{name:'이끼',noise:-1,damp:1}};
export const ALERTS={idle:'무경계',listen:'청취 중',investigate:'조사 중',hunt:'추적 중'};
const EDGES=[[0,1],[0,4],[1,2],[1,5],[2,3],[2,6],[3,7],[4,5],[4,8],[5,9],[6,7],[6,10],[7,11],[8,9],[8,12],[9,10],[9,13],[10,11],[10,14],[11,15],[12,13],[13,14],[14,15]];
function next(s){let x=s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
function shuffle(s,a){for(let i=a.length-1;i>0;i--){const j=Math.floor(next(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sample(s,a){return a[Math.floor(next(s)*a.length)];}
export function log(s,message,tone='normal'){s.log.unshift({turn:s.turn,message,tone});s.log=s.log.slice(0,80);}
function decorateRoom(r){
 r.terrain=['stone','shards','stone','moss','moss','shards','water','stone','moss','water','stone','moss','shards','stone','moss','stone'][r.id];
 if(r.enemy)Object.assign(r.enemy,{home:r.id,mode:'idle',target:null,memory:0,awareness:0,anchored:r.type==='relic'});
 return r;
}
function generateRooms(s){
 const specs=[['entry','무너진 입구'],['chest','망각의 창고'],['shrine','잊힌 제단'],['merchant','떠돌이의 쉼터'],['enemy','이끼 낀 회랑'],['enemy','부서진 무기고'],['chest','잠든 서고'],['enemy','감시자의 방'],['camp','작은 모닥불'],['enemy','속삭이는 묘실'],['relic','달의 봉인실'],['camp','마지막 불씨'],['chest','금빛 함정'],['relic','왕의 무덤'],['shrine','고요의 성소'],['relic','잿불의 심장']];
 if(next(s)>.5)[specs[2],specs[3]]=[specs[3],specs[2]];
 return specs.map(([type,name],id)=>{
  const room={id,type,name,col:id%4,row:Math.floor(id/4),seen:[0,1,4].includes(id),visited:id===0,used:false,enemy:null};
  if(type==='enemy'||type==='relic'){
   const hp=type==='relic'?({10:5,13:7,15:12}[id]):({4:3,5:4,7:5,9:6}[id]);
   const kinds=type==='relic'?(id===15?['dragon','잿불의 파수꾼']:['sentinel','유물 수호자']):sample(s,[['skeleton','방황하는 해골'],['skeleton','묘지의 척후병']]);
   room.enemy={kind:kinds[0],name:kinds[1],hp,maxHp:hp,damage:id===15?5:Math.max(2,Math.ceil(hp/3)),gold:Math.ceil(hp/2)};
  }
  if(type==='relic')room.relic={name:{10:'달의 눈물',13:'잊힌 왕관',15:'잿불의 심장'}[id],value:{10:18,13:28,15:42}[id],icon:{10:'crystal',13:'crown',15:'heartgem'}[id]};
  return decorateRoom(room);
 });
}
export function neighbours(s,id=s.pos){return s.edges.filter(e=>e.includes(id)).map(e=>e[0]===id?e[1]:e[0]);}
export function moveCost(s,id,mode=s.mode){return Math.max(1,(s.rooms[id].row===3?2:1)+MODES[mode].extra);}
export function moveNoise(s,id,mode=s.mode){return Math.max(0,MODES[mode].noise+TERRAINS[s.rooms[id].terrain].noise+(s.rooms[s.pos].enemy?.hp>0?2:0));}
export function previewNoise(s,raw){return Math.max(0,raw+s.resource.rattle-s.resource.quiet);}
function resources(s){return {move:1,sword:0,skill:s.role==='mage'?1:0,block:s.role==='knight'?1:0,quiet:0,rattle:0};}
function take(s){
 if(!s.deck.length){if(!s.discard.length)return null;s.deck=shuffle(s,s.discard.splice(0));log(s,'사용한 능력을 섞어 새로운 풀을 만들었습니다.');}
 return s.deck.pop();
}
// Resolve each physical token once. The current reveal never returns to the draw pile.
export function resolvePool(s,initial=null){
 const queue=initial?[...initial]:[];
 if(!initial)for(let i=0;i<5;i++){const id=take(s);if(id)queue.push(id);}
 for(let i=0;i<queue.length;i++){
  const id=queue[i],c=CARDS[id];s.played.push(id);
  for(const [k,v]of Object.entries(c.e)){
   if(['move','sword','skill','block'].includes(k))s.resource[k]+=v;
   if(k==='noise')s.resource[v<0?'quiet':'rattle']+=Math.abs(v);
   if(k==='heal')s.hp=Math.min(s.maxHp,s.hp+v);
   if(k==='gold')s.gold+=v;
   if(k==='draw')for(let n=0;n<v;n++){const extra=take(s);if(extra)queue.push(extra);}
  }
 }
 s.poolTotal={...s.resource};
 log(s,`${queue.length}개 자동 추출 · 공격 ${s.resource.sword} / 이동 ${s.resource.move} / 기술 ${s.resource.skill}`,'good');
 return queue;
}
export function soundField(s,origin,strength){
 const levels=new Map([[origin,strength]]),todo=[origin];
 while(todo.length){const id=todo.shift(),level=levels.get(id);
  for(const n of neighbours(s,id)){const v=level-2-TERRAINS[s.rooms[n].terrain].damp;if(v>0&&v>(levels.get(n)||0)){levels.set(n,v);todo.push(n);}}
 }
 return [...levels].map(([id,level])=>({id,level}));
}
export function emitNoise(s,origin,raw,label,personal=true){
 let strength=raw,absorbed=0,gear=0;
 if(personal){gear=s.resource.rattle;strength+=gear;s.resource.rattle=0;absorbed=Math.min(strength,s.resource.quiet);s.resource.quiet-=absorbed;strength-=absorbed;}
 strength=Math.max(0,Math.min(12,strength));
 const field=strength?soundField(s,origin,strength):[],heard=[];
 for(const {id,level}of field){const e=s.rooms[id].enemy;if(!e||e.hp<=0)continue;
  e.awareness=Math.min(6,e.awareness+level);e.mode=e.awareness>=4?'hunt':e.awareness>=2?'investigate':'listen';e.target=origin;e.memory=3;
  heard.push({id,level,name:e.name});
 }
 s.soundSeq++;s.lastSound={seq:s.soundSeq,origin,strength,raw:raw+gear,gear,absorbed,label,field,heard,turn:s.turn};
 s.noise=Math.min(12,s.noise+(strength?Math.max(1,Math.ceil(strength/2)):0));
 s.noiseMade+=strength;
 if(strength)log(s,`${label} · 소리 ${strength}${absorbed?` (은신으로 ${absorbed} 흡수)`:''} · ${heard.length?`적 ${heard.length}명이 들었습니다`:'들킨 기척 없음'}`,heard.length?'bad':'normal');
 else log(s,`${label} · 소리 없이 움직였습니다${absorbed?` (은신 ${absorbed} 사용)`:''}`,'good');
 return s.lastSound;
}
function freshFields(s){Object.assign(s,{mode:'walk',soundSeq:0,lastSound:null,noiseMade:0,hideTurn:0,lureTurn:0,hidden:false,pursuits:[]});}
export function newRun({seed=Date.now(),role='rogue'}={}){
 if(!ROLES[role])role='rogue';seed=Number(seed)>>>0||135792468;
 const s={version:VERSION,seed,rng:seed,role,turn:1,pos:0,from:null,hp:ROLES[role].hp,maxHp:ROLES[role].hp,gold:0,noise:0,resource:null,hand:[],deck:[],discard:[],played:[],edges:EDGES.map(e=>[...e]),rooms:[],market:[],log:[],relic:null,countdown:null,phase:'playing',pending:null,kills:0,purchases:0,refreshTurn:0,steps:0};
 freshFields(s);s.resource=resources(s);s.rooms=generateRooms(s);
 s.deck=shuffle(s,['scout','step','slash','focus','guard']);
 s.market=['step',...shuffle(s,MARKET_IDS.filter(x=>x!=='step')).slice(0,3)];
 resolvePool(s,['scout','step',role==='mage'?'spark':'slash','focus',role==='rogue'?'sneak':'guard']);
 log(s,'금고의 문이 열렸습니다. 능력이 자동으로 추출됩니다. 유물을 찾아 이 입구로 돌아오세요.','good');return s;
}
export function migrateSave(old){
 if(old?.version!==1||!Array.isArray(old.rooms)||old.rooms.length!==16)return null;
 const s=JSON.parse(JSON.stringify(old));s.version=VERSION;freshFields(s);s.rooms.forEach(decorateRoom);s.resource.quiet=0;s.resource.rattle=0;
 const unplayed=s.hand.splice(0);resolvePool(s,unplayed);log(s,'탐험을 이어갑니다. 남은 손패는 자동으로 자원 풀에 합산되었습니다.','good');return s;
}
function ok(s,message){return {ok:true,state:s,message};}
function fail(s,message){return {ok:false,state:s,message};}
function damage(s,amount,source){const blocked=Math.min(amount,s.resource.block);s.resource.block-=blocked;const taken=amount-blocked;s.hp=Math.max(0,s.hp-taken);log(s,`${source} · ${blocked?`방어 ${blocked}, `:''}피해 ${taken}`,taken?'bad':'good');return taken;}
function finish(s,won,reason){s.phase=won?'won':'lost';s.pending=null;s.reason=reason;s.score=won?(s.relic.value+s.gold+s.rooms.filter(r=>r.visited).length*2+s.hp+20):0;log(s,reason,won?'good':'bad');}
function nextStep(s,from,to){const q=[[from]],seen=new Set([from]);while(q.length){const path=q.shift(),id=path.at(-1);if(id===to)return path[1]??from;for(const n of neighbours(s,id))if(!seen.has(n)){seen.add(n);q.push([...path,n]);}}return from;}
export function enemyTurn(s){
 s.pursuits=[];
 const enemies=s.rooms.filter(r=>r.enemy?.hp>0).map(r=>({id:r.id,e:r.enemy}));
 for(const {id,e}of enemies){
  if(id===s.pos){e.mode='hunt';e.target=s.pos;e.memory=3;e.awareness=6;damage(s,e.damage,e.name+'의 반격');continue;}
  if(e.memory>0&&e.target!==null){
   if(!e.anchored&&e.mode!=='listen'&&id!==e.target){const dest=nextStep(s,id,e.target),room=s.rooms[dest];
    if(dest!==id&&!(room.enemy?.hp>0)){s.rooms[id].enemy=null;room.enemy=e;s.pursuits.push({from:id,to:dest});
     if(room.seen||s.rooms[id].seen)log(s,`${e.name}이 소리를 따라 ${room.seen?room.name:'어둠 속'}으로 이동했습니다.`,'bad');
    }
   }
   e.memory--;
   if(e.memory===0){e.mode='idle';e.target=null;e.awareness=0;}
  }
 }
}
export function apply(s,action){
 if(s.phase!=='playing')return fail(s,'탐험이 끝났습니다. 새 탐험을 시작해 주세요.');
 if(s.pending&&!['reward','skipReward','purge','cancelPurge'].includes(action.type))return fail(s,'먼저 보상을 선택해 주세요.');
 const r=s.rooms[s.pos];
 switch(action.type){
 case 'mode':if(!MODES[action.id])return fail(s,'알 수 없는 이동 방식입니다.');s.mode=action.id;return ok(s,MODES[s.mode].name+'로 이동합니다.');
 case 'play':return fail(s,'추출된 능력은 이미 자동으로 합산되었습니다.');
 case 'move':{
  const id=action.id;if(!neighbours(s).includes(id))return fail(s,'연결된 방으로만 이동할 수 있습니다.');
  if(r.enemy?.hp>0&&id!==s.from)return fail(s,'적을 쓰러뜨리거나 들어온 방으로 후퇴하세요.');
  const cost=moveCost(s,id);if(s.resource.move<cost)return fail(s,`이동 ${cost} 필요 · 다음 턴에 새 능력을 추출하세요.`);
  const noise=moveNoise(s,id);s.resource.move-=cost;s.from=s.pos;s.pos=id;s.steps++;s.hidden=false;s.rooms[id].visited=true;
  for(const n of [id,...neighbours(s)])s.rooms[n].seen=true;
  emitNoise(s,id,noise,`${MODES[s.mode].name} · ${TERRAINS[s.rooms[id].terrain].name}`);
  return ok(s,s.rooms[id].name);
 }
 case 'hide':{
  if(r.enemy?.hp>0)return fail(s,'눈앞의 적이 지켜보고 있습니다. 먼저 후퇴하세요.');
  if(s.hideTurn===s.turn)return fail(s,'한 턴에 한 번 숨을 고를 수 있습니다.');
  if(s.resource.move<1)return fail(s,'이동 1이 필요합니다.');
  s.resource.move--;s.resource.quiet+=2;s.noise=Math.max(0,s.noise-2);s.hideTurn=s.turn;s.hidden=true;
  log(s,'어둠에 몸을 숨겼습니다. 경계 −2 · 은신 +2','good');return ok(s,'숨죽이기 · 경계 −2 / 은신 +2');
 }
 case 'lure':{
  const id=action.id;if(!neighbours(s).includes(id))return fail(s,'돌멩이는 연결된 방에만 던질 수 있습니다.');
  if(s.lureTurn===s.turn)return fail(s,'유인은 턴당 한 번 할 수 있습니다.');
  if(s.resource.skill<1)return fail(s,'유인에는 기술 1이 필요합니다.');
  s.resource.skill--;s.lureTurn=s.turn;emitNoise(s,id,5,'돌멩이 유인',false);return ok(s,'그 방에 돌멩이를 던졌습니다. 적은 턴 끝에 조사합니다.');
 }
 case 'attack':{
  if(!r.enemy||r.enemy.hp<=0)return fail(s,'이 방에는 적이 없습니다.');
  if(s.resource.sword<=0)return fail(s,'공격력이 소진되었습니다. 후퇴하거나 다음 턴을 준비하세요.');
  const hit=Math.min(s.resource.sword,r.enemy.hp);s.resource.sword-=hit;r.enemy.hp-=hit;s.hidden=false;
  emitNoise(s,s.pos,4+Math.floor(hit/3),'무기가 부딪히는 소리');log(s,`${r.enemy.name}에게 ${hit} 피해!`,'good');
  if(r.enemy.hp<=0){s.gold+=r.enemy.gold;s.kills++;s.pending={type:'reward',options:shuffle(s,[...MARKET_IDS]).slice(0,3)};log(s,`${r.enemy.name} 격파 · 금화 +${r.enemy.gold}`,'good');}
  else {r.enemy.mode='hunt';r.enemy.target=s.pos;r.enemy.memory=3;}
  return ok(s,`${hit} 피해`);
 }
 case 'interact':{
  if(r.enemy?.hp>0)return fail(s,'적을 먼저 쓰러뜨려야 합니다.');
  if(r.type==='entry'){if(!s.relic)return fail(s,'유물을 하나 찾아야 탈출할 수 있습니다.');finish(s,true,`${s.relic.name}을 품고 지상으로 돌아왔습니다.`);return ok(s,'탈출 성공!');}
  if(r.used)return fail(s,'이 방의 보상은 이미 받았습니다.');
  if(r.type==='chest'){const gold=r.row===3?10:5+Math.floor(next(s)*3);s.gold+=gold;r.used=true;emitNoise(s,s.pos,r.row===3?7:3,r.row===3?'상자의 경보 장치':'낡은 경첩');log(s,`보물 상자 · 금화 +${gold}`,'good');return ok(s,`금화 +${gold}`);}
  if(r.type==='camp'){if(s.hp===s.maxHp&&s.noise===0)return fail(s,'아직 쉬어 갈 필요가 없습니다.');const healed=Math.min(6,s.maxHp-s.hp);s.hp+=healed;s.noise=Math.max(0,s.noise-3);r.used=true;log(s,`불가에서 휴식 · 체력 +${healed}, 경계 −3`,'good');return ok(s,'따뜻한 휴식');}
  if(r.type==='shrine'){const total=[...s.deck,...s.discard,...s.played];if(total.length<=5)return fail(s,'최소 5개의 능력은 남겨 두어야 합니다.');s.pending={type:'purge',options:[...new Set(total)]};return ok(s,'풀에서 지울 능력을 선택하세요.');}
  if(r.type==='relic'){if(s.relic&&s.relic.value>=r.relic.value)return fail(s,'이미 더 값진 유물을 가지고 있습니다.');s.relic={...r.relic};r.used=true;if(s.countdown===null)s.countdown=14;emitNoise(s,s.pos,8,'유물 봉인 파괴');log(s,`${r.relic.name} 획득! ${s.countdown}턴 이내에 입구로 탈출하세요.`,'good');return ok(s,'유물 획득 · 용이 깨어났습니다!');}
  return fail(s,'상인에게 물약을 구매할 수 있습니다.');
 }
 case 'merchant':{
  if(r.type!=='merchant'||r.enemy?.hp>0)return fail(s,'적이 없는 상인의 방에서 구매할 수 있습니다.');if(r.used)return fail(s,'물약이 품절되었습니다.');if(s.hp===s.maxHp)return fail(s,'체력이 이미 가득 찼습니다.');if(s.gold<5)return fail(s,'금화 5가 필요합니다.');
  s.gold-=5;s.hp=Math.min(s.maxHp,s.hp+8);r.used=true;return ok(s,'체력 8을 회복했습니다.');
 }
 case 'buy':{
  const i=action.index,id=s.market[i],c=CARDS[id];if(!c)return fail(s,'능력을 찾을 수 없습니다.');if(s.resource.skill<c.cost)return fail(s,`기술 ${c.cost}이 필요합니다.`);
  s.resource.skill-=c.cost;s.discard.push(id);s.purchases++;s.market[i]=sample(s,MARKET_IDS.filter(x=>!s.market.includes(x)));log(s,`${c.name} 영입 · 다음 순환의 풀에 추가`,'good');return ok(s,`${c.name} 획득`);
 }
 case 'refresh':if(s.refreshTurn===s.turn)return fail(s,'교역소는 턴당 한 번 교체할 수 있습니다.');if(s.gold<2)return fail(s,'금화 2가 필요합니다.');s.gold-=2;s.market=shuffle(s,[...MARKET_IDS]).slice(0,4);s.refreshTurn=s.turn;return ok(s,'교역소 능력이 바뀌었습니다.');
 case 'reward':if(s.pending?.type!=='reward'||!s.pending.options.includes(action.id))return fail(s,'선택할 수 없는 보상입니다.');s.discard.push(action.id);s.pending=null;log(s,`전투 보상 · ${CARDS[action.id].name}`,'good');return ok(s,'새 능력을 풀에 추가했습니다.');
 case 'skipReward':if(s.pending?.type!=='reward')return fail(s,'선택할 보상이 없습니다.');s.pending=null;return ok(s,'보상을 받지 않았습니다.');
 case 'purge':{
  if(s.pending?.type!=='purge'||!s.pending.options.includes(action.id))return fail(s,'지울 능력을 선택하세요.');
  for(const pile of [s.discard,s.deck,s.played]){const i=pile.indexOf(action.id);if(i!==-1){pile.splice(i,1);break;}}
  s.pending=null;r.used=true;log(s,`망각의 제단 · ${CARDS[action.id].name} 1개 제거`,'good');return ok(s,'추출 풀이 가벼워졌습니다.');
 }
 case 'cancelPurge':if(s.pending?.type!=='purge')return fail(s,'진행 중인 의식이 없습니다.');s.pending=null;return ok(s,'의식을 미뤘습니다.');
 case 'end':{
  enemyTurn(s);if(s.hp<=0){finish(s,false,'어둠 속에서 쓰러졌습니다. 적의 추적 경로와 방어력을 살펴보세요.');return ok(s,'탐험 종료');}
  if(s.noise>=8){damage(s,3+Math.floor(s.turn/10),'소음을 들은 용의 숨결');s.noise=Math.max(0,s.noise-5);}
  else if(s.relic&&s.turn%3===0)damage(s,2,'깨어난 용의 숨결');
  if(s.hp<=0){finish(s,false,'용의 숨결이 금고를 삼켰습니다.');return ok(s,'탐험 종료');}
  if(s.countdown!==null){s.countdown--;if(s.countdown<=0){finish(s,false,'금고가 무너졌습니다. 유물을 얻으면 입구로 돌아가세요.');return ok(s,'탐험 종료');}}
  s.discard.push(...s.played);s.played=[];s.turn++;s.resource=resources(s);s.hidden=false;s.noise=Math.max(0,s.noise-2-(s.role==='rogue'?1:0));
  resolvePool(s);return ok(s,'새로운 능력 풀이 준비되었습니다.');
 }
 default:return fail(s,'알 수 없는 행동입니다.');
 }
}
export function validSave(s){
 if(!(s&&s.version===VERSION&&ROLES[s.role]&&MODES[s.mode]&&Number.isInteger(s.pos)&&s.pos>=0&&s.pos<16&&Array.isArray(s.rooms)&&s.rooms.length===16&&Array.isArray(s.edges)&&['playing','won','lost'].includes(s.phase)&&Number.isFinite(s.hp)&&s.resource&&s.poolTotal&&Array.isArray(s.market)&&s.market.length===4&&Array.isArray(s.log)))return false;
 return ['hand','deck','discard','played','market'].every(p=>Array.isArray(s[p])&&s[p].every(c=>!!CARDS[c]))&&s.rooms.every(r=>r&&Number.isInteger(r.id)&&TERRAINS[r.terrain])&&['move','sword','skill','block','quiet','rattle'].every(k=>Number.isFinite(s.resource[k])&&s.resource[k]>=0);
}
