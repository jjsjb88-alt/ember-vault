import {neighbours,moveCost,moveNoise,previewNoise,TERRAINS} from './engine.js?v=20261106b';

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
 const lift=Math.abs(s.pos-id)===8&&[9,17].includes(s.pos)&&[9,17].includes(id);
 const type=room.enemy?.hp>0?'enemy':room.type;
 const label=lift?'승강 통로':({entry:'귀환',camp:'회복',merchant:'물약',shrine:'능력 정리',mechanism:'지름길 개방',chest:'보물',relic:`유물 ${room.relic?.value||''}`,enemy:'전투'})[type]||'탐색';
 return {label,tone:lift||type==='mechanism'?'shortcut':type==='enemy'||noise>=4?'risk':room.terrain==='moss'||type==='camp'?'safe':'neutral',terrain:TERRAINS[room.terrain].name,noise,lift};
}
