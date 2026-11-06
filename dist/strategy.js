import {apply,enemyTurn,neighbours,moveCost,moveNoise,previewNoise,TERRAINS} from './engine.js?v=20261106f';

// Only charted passages are used. This is a travel estimate, not a combat forecast.
export function returnRoute(s){
 const costs=new Map([[s.pos,0]]),paths=new Map([[s.pos,[s.pos]]]),open=[s.pos],done=new Set();
 while(open.length){
  open.sort((a,b)=>costs.get(a)-costs.get(b));const from=open.shift();
  if(done.has(from))continue;done.add(from);
  if(from===0)return {path:paths.get(from),cost:costs.get(from),steps:paths.get(from).length-1};
  for(const to of neighbours(s,from)){
   if(!s.rooms[to]?.seen)continue;
   const cost=costs.get(from)+moveCost(s,to,'walk');
   if(cost<(costs.get(to)??Infinity)){costs.set(to,cost);paths.set(to,[...paths.get(from),to]);open.push(to);}
  }
 }
 return null;
}

export function routeAdvice(s,id){
 const room=s.rooms[id],noise=previewNoise(s,moveNoise(s,id));
 const lift=Math.abs(s.pos-id)===8&&[9,17].includes(s.pos)&&[9,17].includes(id)&&neighbours(s).includes(id);
 const enemy=room.enemy?.hp>0;
 const completed={chest:'회수 완료',relic:'유물 회수 완료',camp:'휴식 완료',merchant:'물약 품절',shrine:'정화 완료',mechanism:'지름길 개방됨'};
 const available={entry:'귀환',camp:'회복',merchant:'물약',shrine:'능력 정리',mechanism:'지름길 개방',chest:'보물',relic:`유물 ${room.relic?.value||''}`,enemy:'빈 방'};
 const label=enemy?'전투':lift?'승강 통로':room.used&&completed[room.type]||available[room.type]||'탐색';
 return {label,tone:enemy?'risk':lift||room.type==='mechanism'?'shortcut':noise>=4?'risk':room.terrain==='moss'?'safe':'neutral',terrain:TERRAINS[room.terrain].name,noise,lift};
}

// A forecast of the enemy phase only: no intervening move, sound, attack or draw.
// Track cloned enemy objects so same-name enemies, occupied passages and the engine's
// movement order remain exact. Only enemies already in seen rooms can be named here.
export function lureForecast(s,id){
 const copy=JSON.parse(JSON.stringify(s));
 const assumption='유인 후 추가 행동 없이 지금 위치에서 턴을 마칠 때';
 const result=apply(copy,{type:'lure',id});
 const base={ok:result.ok,reason:result.ok?'':result.message,cost:1,noise:5,assumption};
 if(!result.ok)return {...base,moves:[],entersPlayer:false,summary:result.message};
 const heard=new Set(copy.lastSound.heard.map(e=>e.id));
 const known=copy.rooms.filter(r=>s.rooms[r.id].seen&&r.enemy?.hp>0).map(r=>({
  from:r.id,enemy:r.enemy,mode:r.enemy.mode,target:r.enemy.target,memory:r.enemy.memory,
  targetChanged:r.enemy.target!==s.rooms[r.id].enemy.target
 }));
 enemyTurn(copy);
 const moves=known.map(({from,enemy,mode,target,memory,targetChanged})=>{
  const destination=copy.rooms.find(r=>r.enemy===enemy).id;
  const moved=destination!==from;
  const kind=moved?'move':from===s.pos?'counter':enemy.anchored?'anchored':memory<=0||target===null?'idle':mode==='listen'?'listen':from===target?'at-target':'blocked';
  const to=s.rooms[destination].seen?destination:null;
  return {from,to,name:enemy.name,fromName:s.rooms[from].name,toName:to===null?'어둠 속':s.rooms[to].name,
   heard:heard.has(from),entersPlayer:moved&&destination===s.pos,kind,mode,targetChanged};
 });
 const arrivals=moves.filter(e=>e.entersPlayer),moving=moves.filter(e=>e.kind==='move');
 const summary=arrivals.length?`주의 · ${arrivals.length}명의 적이 현재 방으로 다가옵니다. 통로가 막힐 수 있습니다.`:
  moves.some(e=>e.kind==='counter')?'눈앞의 적은 유인해도 이번 턴에 반격합니다.':
  moving.length?`보이는 적 ${moving.length}명이 턴 끝에 이동합니다.`:
  moves.some(e=>e.heard)?'보이는 적은 소리를 듣지만 이번 턴에는 이동하지 않습니다.':'보이는 적의 이동은 없습니다. 어둠 속 적은 예측에 표시하지 않습니다.';
 return {...base,moves,entersPlayer:arrivals.length>0,summary};
}
