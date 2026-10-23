export const VERSION=1;
export const ROLES={
  rogue:{name:'그림자 도적',short:'도적',color:'#86c6aa',icon:'hero',desc:'가볍게 걷고, 조용히 훔칩니다.',trait:'매 턴 소음 1 감소',hp:22},
  knight:{name:'잿빛 기사',short:'기사',color:'#e5ad72',icon:'knight',desc:'두꺼운 방패로 위험을 견딥니다.',trait:'최대 체력 28 · 매 턴 방어 1',hp:28},
  mage:{name:'불씨 마법사',short:'마법사',color:'#b59be5',icon:'mage',desc:'지식으로 더 강한 덱을 만듭니다.',trait:'매 턴 기술 1 추가',hp:20}
};
export const CARDS={
  step:{name:'잰걸음',kind:'이동',family:'move',icon:'boot',cost:2,e:{move:2},text:'이동 +2'},
  scout:{name:'길잡이',kind:'탐험',family:'move',icon:'compass',cost:3,e:{move:1,skill:1},text:'이동 +1 · 기술 +1'},
  slash:{name:'낡은 단검',kind:'공격',family:'attack',icon:'dagger',cost:2,e:{sword:2,noise:1},text:'공격 +2 · 소음 +1'},
  focus:{name:'작은 발견',kind:'기술',family:'skill',icon:'book',cost:2,e:{skill:2},text:'기술 +2'},
  guard:{name:'나무 방패',kind:'방어',family:'guard',icon:'shield',cost:2,e:{block:3},text:'방어 +3'},
  sneak:{name:'숨죽이기',kind:'은신',family:'move',icon:'cloak',cost:3,e:{move:1,noise:-2},text:'이동 +1 · 소음 −2'},
  spark:{name:'불씨 화살',kind:'공격',family:'attack',icon:'flame',cost:3,e:{sword:3},text:'공격 +3'},
  rush:{name:'질풍 걸음',kind:'이동',family:'move',icon:'wing',cost:5,e:{move:3,noise:1},text:'이동 +3 · 소음 +1'},
  blade:{name:'달빛 쌍검',kind:'공격',family:'attack',icon:'swords',cost:5,e:{sword:4},text:'공격 +4'},
  bash:{name:'방패 밀치기',kind:'공격 / 방어',family:'guard',icon:'shield',cost:4,e:{sword:2,block:2},text:'공격 +2 · 방어 +2'},
  insight:{name:'금지된 서고',kind:'기술',family:'skill',icon:'tome',cost:5,e:{skill:3,draw:1},text:'기술 +3 · 1장 뽑기'},
  ghost:{name:'유령 걸음',kind:'은신',family:'move',icon:'ghost',cost:6,e:{move:2,noise:-3},text:'이동 +2 · 소음 −3'},
  potion:{name:'숲의 물약',kind:'회복',family:'guard',icon:'potion',cost:4,e:{heal:3},text:'체력 3 회복'},
  greed:{name:'위험한 거래',kind:'기술',family:'skill',icon:'coin',cost:4,e:{skill:4,noise:2},text:'기술 +4 · 소음 +2'},
  fury:{name:'화염 일격',kind:'공격',family:'attack',icon:'axe',cost:6,e:{sword:6,noise:2},text:'공격 +6 · 소음 +2'},
  lantern:{name:'수호의 등불',kind:'방어 / 기술',family:'guard',icon:'lantern',cost:4,e:{block:2,skill:2},text:'방어 +2 · 기술 +2'},
  acrobat:{name:'공중제비',kind:'이동',family:'move',icon:'feather',cost:4,e:{move:1,draw:1},text:'이동 +1 · 1장 뽑기'},
  treasure:{name:'보물의 속삭임',kind:'탐험',family:'skill',icon:'chest',cost:5,e:{gold:2,skill:1},text:'금화 +2 · 기술 +1'},
  sentinel:{name:'철벽',kind:'방어',family:'guard',icon:'tower',cost:5,e:{block:6},text:'방어 +6'},
  ambush:{name:'그림자 습격',kind:'공격 / 은신',family:'attack',icon:'dagger',cost:5,e:{sword:3,noise:-2},text:'공격 +3 · 소음 −2'},
  healing:{name:'새벽의 기도',kind:'회복 / 방어',family:'guard',icon:'leaf',cost:6,e:{heal:2,block:3},text:'체력 2 회복 · 방어 +3'},
  wisdom:{name:'별의 지도',kind:'기술 / 이동',family:'skill',icon:'map',cost:6,e:{skill:2,move:2},text:'기술 +2 · 이동 +2'},
  echo:{name:'메아리 수집가',kind:'순환',family:'skill',icon:'crystal',cost:5,e:{draw:2,noise:1},text:'2장 뽑기 · 소음 +1'},
  silence:{name:'침묵의 망토',kind:'은신 / 방어',family:'guard',icon:'cloak',cost:4,e:{noise:-4,block:1},text:'소음 −4 · 방어 +1'}
};
export const MARKET_IDS=Object.keys(CARDS).filter(x=>!['slash','focus','guard'].includes(x));
const EDGES=[[0,1],[0,4],[1,2],[1,5],[2,3],[2,6],[3,7],[4,5],[4,8],[5,9],[6,7],[6,10],[7,11],[8,9],[8,12],[9,10],[9,13],[10,11],[10,14],[11,15],[12,13],[13,14],[14,15]];
function next(s){let x=s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
function shuffle(s,a){for(let i=a.length-1;i>0;i--){const j=Math.floor(next(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sample(s,a){return a[Math.floor(next(s)*a.length)];}
export function log(s,message,tone='normal'){s.log.unshift({turn:s.turn,message,tone});s.log=s.log.slice(0,60);}
function generateRooms(s){
  const specs=[
    ['entry','무너진 입구'],['chest','망각의 창고'],['shrine','잊힌 제단'],['merchant','떠돌이의 쉼터'],
    ['enemy','이끼 낀 회랑'],['enemy','부서진 무기고'],['chest','잠든 서고'],['enemy','감시자의 방'],
    ['camp','작은 모닥불'],['enemy','속삭이는 묘실'],['relic','달의 봉인실'],['camp','마지막 불씨'],
    ['chest','금빛 함정'],['relic','왕의 무덤'],['shrine','고요의 성소'],['relic','잿불의 심장']
  ];
  if(next(s)>.5)[specs[2],specs[3]]=[specs[3],specs[2]];
  return specs.map(([type,name],id)=>{
    const room={id,type,name,col:id%4,row:Math.floor(id/4),seen:[0,1,4].includes(id),visited:id===0,used:false,enemy:null};
    if(type==='enemy'||type==='relic'){
      const hp=type==='relic'?({10:5,13:7,15:12}[id]):({4:3,5:4,7:5,9:6}[id]);
      const kinds=type==='relic'?(id===15?['dragon','잿불의 파수꾼']:['sentinel','유물 수호자']):sample(s,[['slime','동굴 슬라임'],['skeleton','방황하는 해골'],['bat','흡혈 박쥐']]);
      room.enemy={kind:kinds[0],name:kinds[1],hp,maxHp:hp,damage:id===15?5:Math.max(2,Math.ceil(hp/3)),gold:Math.ceil(hp/2)};
    }
    if(type==='relic')room.relic={name:{10:'달의 눈물',13:'잊힌 왕관',15:'잿불의 심장'}[id],value:{10:18,13:28,15:42}[id],icon:{10:'crystal',13:'crown',15:'heartgem'}[id]};
    return room;
  });
}
export function neighbours(s,id=s.pos){return s.edges.filter(e=>e.includes(id)).map(e=>e[0]===id?e[1]:e[0]);}
export function moveCost(s,id){return s.rooms[id].row===3?2:1;}
export function draw(s,n){for(let i=0;i<n;i++){if(!s.deck.length){if(!s.discard.length)return;s.deck=shuffle(s,s.discard.splice(0));log(s,'버린 카드 더미를 섞어 새 덱을 만들었습니다.');}s.hand.push(s.deck.pop());}}
function resources(s){return {move:1,sword:0,skill:s.role==='mage'?1:0,block:s.role==='knight'?1:0};}
export function newRun({seed=Date.now(),role='rogue'}={}){
  if(!ROLES[role])role='rogue';
  seed=Number(seed)>>>0||135792468;
  const s={version:VERSION,seed,rng:seed,role,turn:1,pos:0,from:null,hp:ROLES[role].hp,maxHp:ROLES[role].hp,gold:0,noise:0,resource:null,hand:[],deck:[],discard:[],played:[],edges:EDGES.map(e=>[...e]),rooms:[],market:[],log:[],relic:null,countdown:null,phase:'playing',pending:null,kills:0,purchases:0,refreshTurn:0,steps:0};
  s.resource=resources(s);s.rooms=generateRooms(s);
  s.hand=['scout','step',role==='mage'?'spark':'slash','focus',role==='rogue'?'sneak':'guard'];
  s.deck=shuffle(s,['scout','step','slash','focus','guard']);
  s.market=['step',...shuffle(s,MARKET_IDS.filter(x=>x!=='step')).slice(0,3)];
  log(s,'금고의 문이 열렸습니다. 유물을 찾아 이 입구로 돌아오세요.','good');
  return s;
}
function ok(s,message){return {ok:true,state:s,message};}
function fail(s,message){return {ok:false,state:s,message};}
function damage(s,amount,source){const blocked=Math.min(amount,s.resource.block);s.resource.block-=blocked;const taken=amount-blocked;s.hp=Math.max(0,s.hp-taken);log(s,`${source} · ${blocked?`방어 ${blocked}, `:''}피해 ${taken}`,taken?'bad':'good');return taken;}
function finish(s,won,reason){s.phase=won?'won':'lost';s.pending=null;s.reason=reason;s.score=won?(s.relic.value+s.gold+s.rooms.filter(r=>r.visited).length*2+s.hp+20):0;log(s,reason,won?'good':'bad');}
export function apply(s,action){
  if(s.phase!=='playing')return fail(s,'탐험이 끝났습니다. 새 탐험을 시작해 주세요.');
  if(s.pending&& !['reward','skipReward','purge','cancelPurge'].includes(action.type))return fail(s,'먼저 보상을 선택해 주세요.');
  const r=s.rooms[s.pos];
  switch(action.type){
    case 'play':{
      const i=action.index;if(!Number.isInteger(i)||!s.hand[i])return fail(s,'사용할 카드가 없습니다.');
      const id=s.hand.splice(i,1)[0],c=CARDS[id];s.played.push(id);
      for(const [k,v] of Object.entries(c.e)){
        if(['move','sword','skill','block'].includes(k))s.resource[k]+=v;
        if(k==='noise')s.noise=Math.min(12,Math.max(0,s.noise+v));
        if(k==='heal')s.hp=Math.min(s.maxHp,s.hp+v);
        if(k==='gold')s.gold+=v;
        if(k==='draw')draw(s,v);
      }
      log(s,`${c.name} · ${c.text}`);return ok(s,c.name);
    }
    case 'move':{
      const id=action.id;
      if(!neighbours(s).includes(id))return fail(s,'연결된 방으로만 이동할 수 있습니다.');
      if(r.enemy&&r.enemy.hp>0&&id!==s.from)return fail(s,'수호자를 쓰러뜨리거나, 들어온 방으로 후퇴하세요.');
      const cost=moveCost(s,id);if(s.resource.move<cost)return fail(s,`이동력이 ${cost} 필요합니다. 이동 카드를 사용하세요.`);
      if(r.enemy&&r.enemy.hp>0){s.noise=Math.min(12,s.noise+1);log(s,'전투에서 후퇴했습니다. 소음 +1','bad');}
      s.resource.move-=cost;s.from=s.pos;s.pos=id;s.steps++;s.rooms[id].visited=true;
      for(const n of [id,...neighbours(s)])s.rooms[n].seen=true;
      log(s,`${s.rooms[id].name}에 들어왔습니다.`);return ok(s,s.rooms[id].name);
    }
    case 'attack':{
      if(!r.enemy||r.enemy.hp<=0)return fail(s,'이 방에는 적이 없습니다.');
      if(s.resource.sword<=0)return fail(s,'공격 카드를 사용해 공격력을 모으세요.');
      const hit=Math.min(s.resource.sword,r.enemy.hp);s.resource.sword-=hit;r.enemy.hp-=hit;
      log(s,`${r.enemy.name}에게 ${hit} 피해!`,'good');
      if(r.enemy.hp<=0){s.gold+=r.enemy.gold;s.kills++;log(s,`${r.enemy.name} 격파 · 금화 +${r.enemy.gold}`,'good');s.pending={type:'reward',options:shuffle(s,[...MARKET_IDS]).slice(0,3)};}
      return ok(s,`${hit} 피해`);
    }
    case 'interact':{
      if(r.enemy&&r.enemy.hp>0)return fail(s,'수호자를 먼저 쓰러뜨려야 합니다.');
      if(r.type==='entry'){
        if(!s.relic)return fail(s,'유물을 하나 찾아야 탈출할 수 있습니다.');
        finish(s,true,`${s.relic.name}을 품고 지상으로 돌아왔습니다.`);return ok(s,'탈출 성공!');
      }
      if(r.used)return fail(s,'이 방의 보상은 이미 받았습니다.');
      if(r.type==='chest'){
        const gold=r.row===3?10:5+Math.floor(next(s)*3);s.gold+=gold;r.used=true;
        if(r.row===3){s.noise=Math.min(12,s.noise+2);log(s,'금빛 함정이 울렸습니다. 소음 +2','bad');}
        log(s,`보물 상자 · 금화 +${gold}`,'good');return ok(s,`금화 +${gold}`);
      }
      if(r.type==='camp'){
        if(s.hp===s.maxHp&&s.noise===0)return fail(s,'아직 쉬어 갈 필요가 없습니다. 나중에 돌아오세요.');
        const healed=Math.min(6,s.maxHp-s.hp);s.hp+=healed;s.noise=Math.max(0,s.noise-3);r.used=true;log(s,`불가에서 휴식 · 체력 +${healed}, 소음 −3`,'good');return ok(s,'따뜻한 휴식');
      }
      if(r.type==='shrine'){
        const total=[...s.hand,...s.deck,...s.discard,...s.played];if(total.length<=5)return fail(s,'최소 5장의 카드는 남겨 두어야 합니다.');
        s.pending={type:'purge',options:[...new Set(total)]};return ok(s,'덱에서 지울 카드를 선택하세요.');
      }
      if(r.type==='relic'){
        if(s.relic&&s.relic.value>=r.relic.value)return fail(s,'이미 더 값진 유물을 가지고 있습니다.');
        s.relic={...r.relic};r.used=true;s.noise=Math.min(12,s.noise+3);if(s.countdown===null)s.countdown=14;
        log(s,`${r.relic.name} 획득! ${s.countdown}턴 이내에 입구로 탈출하세요.`,'good');return ok(s,'유물 획득 · 용이 깨어났습니다!');
      }
      return fail(s,'상인에게는 아래 물약 구매 버튼을 사용하세요.');
    }
    case 'merchant':{
      if(r.type!=='merchant')return fail(s,'상인이 있는 방에서만 구매할 수 있습니다.');
      if(r.used)return fail(s,'상인의 물약이 품절되었습니다.');
      if(s.hp===s.maxHp)return fail(s,'체력이 이미 가득 찼습니다.');
      if(s.gold<5)return fail(s,'금화가 5 필요합니다.');
      s.gold-=5;s.hp=Math.min(s.maxHp,s.hp+8);r.used=true;log(s,'상인의 물약 · 금화 −5, 체력 +8','good');return ok(s,'물약을 마셨습니다.');
    }
    case 'buy':{
      const i=action.index,id=s.market[i],c=CARDS[id];if(!c)return fail(s,'카드를 찾을 수 없습니다.');
      if(s.resource.skill<c.cost)return fail(s,`기술 ${c.cost}이 필요합니다. 파란색 카드를 사용하세요.`);
      s.resource.skill-=c.cost;s.discard.push(id);s.purchases++;
      s.market[i]=sample(s,MARKET_IDS.filter(x=>!s.market.includes(x)));
      log(s,`${c.name} 영입 · 버린 카드 더미에 추가`,'good');return ok(s,`${c.name} 획득`);
    }
    case 'refresh':{
      if(s.refreshTurn===s.turn)return fail(s,'교역소는 한 턴에 한 번 교체할 수 있습니다.');
      if(s.gold<2)return fail(s,'금화가 2 필요합니다.');s.gold-=2;s.market=shuffle(s,[...MARKET_IDS]).slice(0,4);s.refreshTurn=s.turn;return ok(s,'교역소 카드가 바뀌었습니다.');
    }
    case 'reward':{
      if(s.pending?.type!=='reward'||!s.pending.options.includes(action.id))return fail(s,'선택할 수 없는 보상입니다.');
      s.discard.push(action.id);s.pending=null;log(s,`전투 보상 · ${CARDS[action.id].name} 획득`,'good');return ok(s,'덱에 새 카드를 추가했습니다.');
    }
    case 'skipReward':{
      if(s.pending?.type!=='reward')return fail(s,'선택할 보상이 없습니다.');s.pending=null;return ok(s,'보상 카드를 받지 않았습니다.');
    }
    case 'purge':{
      if(s.pending?.type!=='purge'||!s.pending.options.includes(action.id))return fail(s,'지울 카드를 선택하세요.');
      for(const pile of [s.discard,s.deck,s.hand,s.played]){const i=pile.indexOf(action.id);if(i!==-1){pile.splice(i,1);break;}}
      s.pending=null;r.used=true;log(s,`망각의 제단 · ${CARDS[action.id].name} 1장 제거`,'good');return ok(s,'덱이 조금 더 가벼워졌습니다.');
    }
    case 'cancelPurge':{if(s.pending?.type!=='purge')return fail(s,'진행 중인 의식이 없습니다.');s.pending=null;return ok(s,'의식을 미뤘습니다.');}
    case 'end':{
      if(r.enemy&&r.enemy.hp>0)damage(s,r.enemy.damage,r.enemy.name+'의 반격');
      if(s.hp<=0){finish(s,false,'어둠 속에서 쓰러졌습니다. 다음 탐험에서는 방어와 휴식을 활용하세요.');return ok(s,'탐험 종료');}
      if(s.noise>=8){damage(s,3+Math.floor(s.turn/10),'소음을 들은 용의 숨결');s.noise=Math.max(0,s.noise-5);}
      else if(s.relic&&s.turn%3===0)damage(s,2,'깨어난 용의 숨결');
      if(s.hp<=0){finish(s,false,'용의 숨결이 금고를 삼켰습니다.');return ok(s,'탐험 종료');}
      if(s.countdown!==null){s.countdown--;if(s.countdown<=0){finish(s,false,'금고가 무너졌습니다. 유물을 얻으면 서둘러 입구로 돌아가세요.');return ok(s,'탐험 종료');}}
      s.discard.push(...s.hand,...s.played);s.hand=[];s.played=[];s.turn++;s.resource=resources(s);
      if(s.turn%4===0){s.noise=Math.min(12,s.noise+1);log(s,'오래된 바닥이 삐걱거립니다. 소음 +1');}
      if(s.role==='rogue')s.noise=Math.max(0,s.noise-1);
      draw(s,5);log(s,`${s.turn}번째 턴 · 새로운 손패`);return ok(s,'새로운 턴');
    }
    default:return fail(s,'알 수 없는 행동입니다.');
  }
}
export function validSave(s){
  if(!(s&&s.version===VERSION&&ROLES[s.role]&&Number.isInteger(s.pos)&&s.pos>=0&&s.pos<16&&Array.isArray(s.rooms)&&s.rooms.length===16&&Array.isArray(s.edges)&&['playing','won','lost'].includes(s.phase)&&Number.isFinite(s.hp)&&s.resource&&Array.isArray(s.market)&&s.market.length===4&&Array.isArray(s.log)))return false;
  return ['hand','deck','discard','played','market'].every(p=>Array.isArray(s[p])&&s[p].every(c=>!!CARDS[c]))&&s.rooms.every(r=>r&&Number.isInteger(r.id))&&['move','sword','skill','block'].every(k=>Number.isFinite(s.resource[k]));
}
