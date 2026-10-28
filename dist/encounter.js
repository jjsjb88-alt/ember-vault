import {enemyTurn,neighbours,previewNoise} from './engine.js';

export function roomEnvironment(room){return ['camp','merchant'].includes(room.type)?'refuge':['relic','shrine'].includes(room.type)?'vault':'library';}

export function roomInteraction(s){
 const r=s.rooms[s.pos],enemy=r.enemy?.hp>0;
 if(s.phase!=='playing')return {act:'result',text:'탐험 결과 보기',enabled:true,short:'결과'};
 if(enemy){const hit=Math.min(s.resource.sword,r.enemy.hp);return {act:'attack',text:`공격 · ${hit} 피해`,short:'공격',subject:r.enemy.name,detail:`${hit} 피해 · 소리 ${previewNoise(s,4+Math.floor(hit/3))}`,enabled:hit>0,reason:'공격력이 부족합니다. 풀을 뽑거나 후퇴하세요.',kind:'attack'};}
 if(r.type==='entry')return {act:'interact',text:s.relic?'유물과 함께 탈출':'유물을 찾아 돌아오세요',short:'탈출',subject:'지상으로 향하는 문',detail:'유물을 지상으로 가져가세요',enabled:!!s.relic,reason:'먼저 유물 하나를 회수하세요.',kind:'relic'};
 if(r.used)return {act:'',text:'이 방의 보상을 받았습니다',enabled:false,short:'회수 완료'};
 const a={
  chest:{act:'interact',text:'상자 열기',short:'열기',subject:'보물 상자',detail:`금화 획득 · 소리 ${previewNoise(s,r.row===3?7:3)}`,enabled:true,kind:'loot'},
  camp:{act:'interact',text:'휴식 · 체력 +6 / 경계 −3',short:'휴식',subject:'작은 모닥불',detail:`체력 +${Math.min(6,s.maxHp-s.hp)} · 경계 −${Math.min(3,s.noise)}`,enabled:s.hp<s.maxHp||s.noise>0,reason:'체력과 경계가 충분히 회복되어 있습니다.',kind:'heal'},
  shrine:{act:'interact',text:'능력 하나 영구 제거',short:'정화',subject:'기억의 제단',detail:'능력 하나를 풀에서 제거',enabled:s.deck.length+s.discard.length+s.played.length>5,reason:'풀에는 최소 5개의 능력이 필요합니다.',kind:'relic'},
  merchant:{act:'merchant',text:'물약 구매 · 금화 5',short:'구매',subject:'떠돌이 상인',detail:'금화 5 · 체력 +8',enabled:s.gold>=5&&s.hp<s.maxHp,reason:s.hp===s.maxHp?'체력이 이미 가득 찼습니다.':'물약에는 금화 5가 필요합니다.',kind:'heal'},
  relic:{act:'interact',text:`${r.relic?.name} 획득`,short:'봉인 해제',subject:r.relic?.name,detail:`소리 ${previewNoise(s,8)} · 회수 후 입구로`,enabled:!s.relic||s.relic.value<r.relic?.value,reason:'이미 더 값진 유물을 가지고 있습니다.',kind:'relic'}
 };
 return a[r.type]??{act:'',text:'길이 열렸습니다',enabled:false,short:''};
}

// Forecast only the enemy/dragon phase. Never draw cards or consume the live RNG.
export function turnImpact(s){
 const copy=JSON.parse(JSON.stringify(s));enemyTurn(copy);
 const raw=copy.hp<=0?0:s.noise>=8?3+Math.floor(s.turn/10):s.relic&&s.turn%3===0?2:0;
 const blocked=Math.min(raw,copy.resource.block),taken=Math.min(copy.hp,raw-blocked);
 return {raw,blocked,taken,beforeHp:copy.hp,afterHp:copy.hp-taken,enemyTaken:s.hp-copy.hp,pursuits:copy.pursuits};
}

// The animation follows real audible connections. A wall can never transmit a wave.
export function soundWavePlan(s,sound=s.lastSound){
 if(!sound?.strength)return {nodes:[],edges:[],heard:[]};
 const levels=new Map(sound.field.map(p=>[p.id,p.level])),depth=new Map([[sound.origin,0]]),queue=[sound.origin];
 while(queue.length){const from=queue.shift();for(const to of neighbours(s,from))if(levels.has(to)&&!depth.has(to)){depth.set(to,depth.get(from)+1);queue.push(to);}}
 const nodes=sound.field.map(p=>({...p,delay:(depth.get(p.id)||0)*220}));
 const edges=s.edges.flatMap(([a,b])=>{
  if(!depth.has(a)||!depth.has(b)||depth.get(a)===depth.get(b))return [];
  const [from,to]=depth.get(a)<depth.get(b)?[a,b]:[b,a];return [{from,to,delay:depth.get(from)*220}];
 });
 const heard=sound.heard.map(e=>({...e,delay:(depth.get(e.id)||0)*220,known:s.rooms[e.id].seen})).sort((a,b)=>a.delay-b.delay);
 return {nodes,edges,heard};
}

export function tensionNeeded(s,action,previousSeq,previousNoise){
 const sound=s.lastSound;
 return sound?.seq!==previousSeq&&sound?.strength>0&&(['attack','interact','lure'].includes(action.type)||sound.strength>=5||previousNoise<8&&s.noise>=8);
}

export function soundNotice(s,previousSeq,message){
 const sound=s.lastSound;if(!sound||sound.seq===previousSeq)return message;
 return `${message} · ${sound.strength?`소리 ${sound.strength} · ${sound.heard.length?`적 ${sound.heard.length}명 반응`:'들킨 기척 없음'}`:'무음'}`;
}
