import {CARDS} from './engine.js?v=20261107b';
import {turnImpact} from './encounter.js?v=20261107b';

const alive=enemy=>!!enemy&&enemy.hp>0;
const roomInfo=room=>({id:room?.id,name:room?.name||'방',type:room?.type,route:room?.lessonRoute||null,returnRoute:room?.lessonReturn||null,optional:!!room?.lessonOptional});
const enemyKey=(enemy,room)=>Number.isInteger(enemy?.home)?`home:${enemy.home}`:`${room}:${enemy?.kind}:${enemy?.name}`;
const count=(items,id)=>items.filter(value=>value===id).length;
const routeName=value=>({safe:'조용한 길',risky:'보물 길',short:'짧은 귀환길',quiet:'조용한 귀환길'})[value]||'선택한 길';
const returnChoices=journal=>[...new Set(journal.returnPath.map(room=>room.returnRoute).filter(Boolean))];
const objectParticle=name=>{const last=name.charCodeAt(name.length-1);return last>=0xac00&&last<=0xd7a3&&(last-0xac00)%28===0?'를':'을';};

/** Plain JSON data: clone this alongside a tutorial checkpoint. On retry, the host increments
 * retryCount after restoring it; abandoned attempts do not leak damage, purchases or actions. */
export function createTutorialJournal(initialState){
 return {
  version:1,retryCount:0,initial:{turn:initialState.turn,pos:initialState.pos,hp:initialState.hp,gold:initialState.gold},
  actionCount:0,moves:[],outboundPath:[roomInfo(initialState.rooms[initialState.pos])],returnPath:[],
  lures:[],signals:{},vacancies:[],bypasses:[],purchases:[],draws:[],combats:[],interactions:[],
  relics:[],relicTurn:null,returnEnds:0,breaths:[],damageTaken:0,healed:0,escaped:null
 };
}

function drawEffect(id,copies=1){
 const e=CARDS[id]?.e||{},parts=[];
 for(const [key,label]of [['sword','공격'],['move','이동'],['skill','기술'],['block','방어']])if(e[key])parts.push(`${label} +${e[key]*copies}`);
 if(!parts.length&&e.noise)parts.push(`${e.noise<0?'은신':'첫 소음'} +${Math.abs(e.noise)*copies}`);
 return parts.length?parts.slice(0,2).join(' · ')+' 합산':e.heal?'회복 능력 포함':e.draw?'추가 추출 능력 포함':'능력 합산';
}

/** Call once, immediately after a successful engine action, using its unmodified before/after
 * states. Only journal is mutated. A return string is optional, factual live coaching feedback. */
export function recordTutorialAction(journal,before,action,after){
 if(!journal||!before||!after||!action?.type)return '';
 const type=action.type,turn=before.turn,room=before.rooms[before.pos];
 journal.actionCount++;
 let feedback='';
 // A later occupant breaks the causal link, even if that occupant is subsequently defeated.
 for(const vacancy of journal.vacancies)if(alive(before.rooms[vacancy.room]?.enemy))vacancy.closed=true;
 const sound=after.lastSound,newSound=after.soundSeq!==before.soundSeq&&sound;
 if(newSound){
  for(const heard of sound.heard||[]){const enemy=after.rooms[heard.id]?.enemy;if(enemy)delete journal.signals[enemyKey(enemy,heard.id)];}
 }
 if(type==='lure'&&newSound){
  const lure={turn,origin:before.pos,target:action.id,seq:after.soundSeq,listeners:[],displacements:[]};
  const index=journal.lures.length;
  for(const heard of sound.heard||[]){const enemy=after.rooms[heard.id]?.enemy;if(!alive(enemy))continue;
   const key=enemyKey(enemy,heard.id);lure.listeners.push({key,room:heard.id,name:enemy.name});journal.signals[key]=index;
  }
  journal.lures.push(lure);
 }
 if(type==='buy'){
  const id=before.market[action.index];
  if(CARDS[id]&&after.purchases>before.purchases){journal.purchases.push({id,name:CARDS[id].name,turn,index:action.index});feedback=`${CARDS[id].name} 영입 · 다음 주머니 순환에 합류`;}
 }
 if(type==='end'){
  // This existing engine forecast clones its input and runs the same enemy phase. It isolates
  // damage before the next pool heals, and identifies early death with a stale attack object.
  const impact=turnImpact(before),breath=!impact.lethal&&after.attack?after.attack:null;
  const breathLoss=breath?Math.max(0,breath.beforeHp-breath.afterHp):impact.taken;
  const lost=impact.enemyTaken+(impact.lethal?0:breathLoss);
  journal.damageTaken+=lost;
  journal.healed+=Math.max(0,after.hp-(before.hp-lost));
  if(before.relic)journal.returnEnds++;
  if(breath)journal.breaths.push({turn,room:breath.pos,hit:!!breath.hit,taken:breath.taken,healthLost:breathLoss,blocked:breath.blocked||0,start:breath.start,path:[...breath.path]});
  for(const pursuit of after.pursuits||[]){
   const enemy=before.rooms[pursuit.from]?.enemy,key=enemyKey(enemy,pursuit.from),index=journal.signals[key],lure=journal.lures[index];
   if(!alive(enemy)||!lure||enemy.target!==lure.target||!lure.listeners.some(listener=>listener.key===key))continue;
   const destination=after.rooms[pursuit.to]?.enemy;
   if(!alive(destination)||enemyKey(destination,pursuit.to)!==key)continue;
   const clear=!alive(after.rooms[pursuit.from]?.enemy),event={turn,from:pursuit.from,to:pursuit.to,name:enemy.name,clear};
   lure.displacements.push(event);
   if(clear)journal.vacancies.push({lure:index,room:pursuit.from,to:pursuit.to,turn,enemy:key,closed:false,entered:false});
   feedback=`${enemy.name} ${before.rooms[pursuit.from].name} → ${after.rooms[pursuit.to].name}${clear?' · 원래 방이 비었어요':''}`;
  }
  // A lethal enemy hit or an expired escape clock never draws a new pool.
  if(after.turn>before.turn){
   const bought=[...new Set(journal.purchases.filter(p=>p.turn<after.turn).map(p=>p.id))].filter(id=>after.played.includes(id));
   const first=bought.find(id=>!journal.draws.some(draw=>draw.bought.includes(id)));
   journal.draws.push({turn:after.turn,played:[...after.played],bought});
   if(first)feedback=`${CARDS[first].name} 추출 · ${drawEffect(first,count(after.played,first))}`;
  }
 }else{
  journal.damageTaken+=Math.max(0,before.hp-after.hp);
  journal.healed+=Math.max(0,after.hp-before.hp);
 }
 if(type==='move'&&after.pos!==before.pos){
  const destination=roomInfo(after.rooms[after.pos]),returning=!!before.relic;
  journal.moves.push({turn,from:before.pos,to:after.pos,returning,room:destination,guarded:alive(before.rooms[after.pos]?.enemy)});
  if(returning){if(!journal.returnPath.length)journal.returnPath.push(roomInfo(before.rooms[before.pos]));journal.returnPath.push(destination);}
  else journal.outboundPath.push(destination);
  const vacancy=journal.vacancies.find(v=>!v.closed&&!v.entered&&v.room===after.pos);
  if(vacancy&&!alive(before.rooms[after.pos]?.enemy)&&!alive(after.rooms[after.pos]?.enemy)){
   vacancy.entered=true;journal.bypasses.push({turn,room:destination,lure:vacancy.lure,enemy:vacancy.enemy});
   feedback=`${destination.name}을 지키던 적 없이 통과했어요`;
  }
 }
 if(type==='attack'){
  const damage=Math.max(0,(room.enemy?.hp||0)-(after.rooms[before.pos]?.enemy?.hp||0));
  if(damage){
   const draw=journal.draws.findLast(d=>d.turn===turn),bought=draw?.bought||[];
   journal.combats.push({turn,room:before.pos,name:room.enemy.name,damage,kill:!alive(after.rooms[before.pos]?.enemy),returning:!!before.relic,bought:[...bought]});
   if(bought.length)feedback=`${room.enemy.name}에게 ${damage} 피해 · 이번 턴 ${CARDS[bought[0]].name}도 추출`;
  }
 }
 if((type==='interact'||type==='merchant')&&(!room.used&&after.rooms[before.pos]?.used)){
  const event={turn,room:roomInfo(room),returning:!!before.relic,healed:Math.max(0,after.hp-before.hp),gold:Math.max(0,after.gold-before.gold),noiseReduced:Math.max(0,before.noise-after.noise)};
  journal.interactions.push(event);
  if(room.type==='camp')feedback=`${room.name} 휴식 · ${event.healed?`체력 +${event.healed}`:`경계 −${event.noiseReduced}`}`;
 }
 if(type==='interact'&&after.relic&&(after.relic.value||0)>(before.relic?.value||0)){
  journal.relics.push({turn,room:before.pos,name:after.relic.name,value:after.relic.value});
  journal.relicTurn??=turn;
 }
 if(before.phase!=='won'&&after.phase==='won')journal.escaped={turn:after.turn,hp:after.hp,gold:after.gold,score:after.score};
 for(const vacancy of journal.vacancies)if(alive(after.rooms[vacancy.room]?.enemy))vacancy.closed=true;
 return feedback;
}

function lureHighlight(journal){
 const bypass=journal.bypasses[0];
 if(bypass){const lure=journal.lures[bypass.lure],shift=lure.displacements.find(d=>d.from===bypass.room.id);
  return {title:'돌멩이 뒤에 열린 길',text:`${shift?.name||'적'}이 자리를 옮긴 뒤, ${bypass.room.name}을 적 없이 통과했어요.`};}
 const shift=journal.lures.flatMap(lure=>lure.displacements)[0];
 if(shift)return {title:'소리를 따라 움직인 적',text:`${shift.name}이 실제로 방을 옮겼어요. ${shift.clear?'그 뒤 원래 방을 적 없이 통과한 기록은 없어요.':'이동 직후 원래 방에는 다른 적이 있었어요.'}`};
 if(journal.lures.length)return {title:'던진 돌멩이',text:`유인을 ${journal.lures.length}번 사용했어요. 그 소리를 따라 적이 이동한 기록은 없어요.`};
 return {title:'소리의 쓰임',text:'아직 유인과 적의 이동을 연결할 기록이 없어요.'};
}
function growthHighlight(journal){
 const purchase=journal.purchases.find(p=>journal.draws.some(d=>d.bought.includes(p.id)))||journal.purchases[0];
 if(!purchase)return {title:'주머니의 변화',text:'영입한 능력이 아직 없어요. 남은 기술과 다음 추출을 함께 살펴보세요.'};
 const draws=journal.draws.filter(d=>d.bought.includes(purchase.id));
 const draw=draws.find(d=>journal.combats.some(c=>c.turn===d.turn&&c.bought.includes(purchase.id)))||draws[0];
 if(!draw)return {title:`영입한 ${purchase.name}`,text:'주머니 순환을 기다리고 있어요. 영입 뒤 실제 추출된 기록은 아직 없어요.'};
 const combat=journal.combats.find(c=>c.turn===draw.turn&&c.bought.includes(purchase.id));
 const effect=drawEffect(purchase.id,count(draw.played,purchase.id));
 return {title:`추출된 ${purchase.name}`,text:`${effect}.${combat?` 같은 턴 ${combat.name}에게 ${combat.damage} 피해를 줬어요.`:' 그 턴의 전투 피해 기록은 없어요.'}`};
}
function journeyHighlight(state,journal){
 const choices=returnChoices(journal),choice=choices[0];
 const optional=journal.interactions.filter(event=>event.room.optional),camp=(optional.find(e=>e.room.type==='camp')||journal.interactions.find(e=>e.room.type==='camp'));
 const chest=optional.find(e=>e.room.type==='chest');
 const visitedOptional=journal.moves.find(move=>move.room.optional&&move.room.type==='chest');
 const parts=[];
 if(choices.length>1)parts.push(`${choices.map(routeName).join(' · ')} 모두 방문`);
 else if(choice)parts.push(routeName(choice));
 else{const outbound=journal.outboundPath.find(room=>room.route);if(outbound)parts.push(routeName(outbound.route));}
 if(chest)parts.push(`${chest.room.name} 금화 +${chest.gold}`);
 else if(visitedOptional)parts.push(`${visitedOptional.room.name} 상자는 열지 않음`);
 if(camp)parts.push(`${camp.room.name} ${camp.healed?`체력 +${camp.healed}`:`경계 −${camp.noiseReduced}`}`);
 if(journal.relicTurn!==null){const moves=journal.moves.filter(move=>move.returning).length;
  parts.push(`유물 회수 T${journal.relicTurn} → ${state.phase==='won'?`탈출 T${state.turn}`:`현재 T${state.turn}`}, 귀환 ${moves}칸`);
 }
 if(!parts.length)parts.push('아직 유물을 회수해 돌아온 기록이 없어요.');
 return {title:choices.length>1?'귀환 중 길을 바꾼 선택':choice?'내가 고른 귀환길':'챙긴 것과 돌아온 길',text:parts.join(' · ')};
}
function returnLureHighlight(state,journal){
 if(journal.relicTurn===null)return null;
 for(let index=1;index<journal.lures.length;index++){
  const lure=journal.lures[index];if(lure.turn<journal.relicTurn)continue;
  for(const bypass of journal.bypasses){
   if(bypass.lure!==index||bypass.turn<journal.relicTurn)continue;
   const shift=lure.displacements.findLast(d=>d.clear&&d.from===bypass.room.id&&d.turn>=lure.turn&&d.turn<=bypass.turn);
   if(!shift)continue;
   const target=state.rooms[lure.target]?.name||'유인한 방',from=state.rooms[shift.from]?.name||bypass.room.name,to=state.rooms[shift.to]?.name||'다른 방';
   return {title:'귀환에서 다시 쓴 유인',text:`귀환 중 ${target}에 유인해 ${shift.name}의 이동을 이끌었어요 (${from} → ${to}). 비워진 ${bypass.room.name}${objectParticle(bypass.room.name)} 통과했어요.`};
  }
 }
 return null;
}

/** Short, factual recap; no engine mutation, randomness, storage or HTML. */
export function tutorialRecap(state,journal){
 const won=state.phase==='won',retry=Math.max(0,journal.retryCount||0),avoids=journal.breaths.filter(b=>!b.hit).length,hits=journal.breaths.filter(b=>b.hit).length;
 const relicName=state.relic?.name||'유물';
 const subtitle=[`T${journal.initial.turn} → T${state.turn}`,`받은 피해 ${journal.damageTaken}`];
 if(journal.breaths.length)subtitle.push(`숨결 비껴감 ${avoids} · 도달 ${hits}`);
 if(retry)subtitle.push(`다시 도전 ${retry}회`);
 const choices=returnChoices(journal),choice=choices[0];
 let reflection=won?'유물을 챙겨 입구로 돌아온 건 네 선택이었어.':'여기까지의 기록을 보고 다음 선택을 골라 보자.';
 if(retry)reflection=won?`다시 ${retry}번 도전해서 돌아왔네. 이번 길은 기억해 두자.`:`다시 ${retry}번 도전했어. 아직 확인하지 못한 길도 남아 있어.`;
 else if(won&&choices.length>1)reflection='귀환 중 길을 바꿨네. 지나온 길과 남은 힘을 함께 기억하자.';
 else if(won&&choice)reflection=`${routeName(choice)}을 거쳐 돌아왔네. 지나온 길과 남은 힘을 기억하자.`;
 const returnLure=returnLureHighlight(state,journal);
 return {
  title:won?`${relicName}${objectParticle(relicName)} 품고 돌아왔어요`:state.phase==='lost'?'이번 길을 돌아봐요':'지금까지의 선택',subtitle:subtitle.join(' · '),
  stats:[{label:'남은 체력',value:`${state.hp} / ${state.maxHp}`},{label:'금화',value:String(state.gold)},{label:'점수',value:won?String(state.score):'—'}],
  highlights:[lureHighlight(journal),growthHighlight(journal),journeyHighlight(state,journal),...(returnLure?[returnLure]:[])],
  talk:[['깜부기',reflection],['도적',won?'다음에도 챙길 것과 돌아올 길을 같이 볼게.':'어디서 소리가 났는지부터 다시 볼게.']]
 };
}
