import {lureForecast} from '../../../dist/strategy.js';
import {newRun,apply,CARDS,moveCost,moveStatus,enemyTurn,dragonDue,breathPlan,validSave} from '../../../dist/engine.js';
import {STAGES,checkpointIndex} from '../../../dist/expedition-stages.js';
export function endDamage(s){const copy=structuredClone(s),hp=s.hp;enemyTurn(copy);if(copy.hp<=0)return hp;const p=dragonDue(copy)?breathPlan(copy):{damage:0};return hp-copy.hp+Math.max(0,p.damage-copy.resource.block);}
export function runBot(seed,role,quiet,{risk=true,limit=1000,noiseControl=true,capture=false}={}){
 const s=newRun({seed,role,layout:'staged',risk}),actions=[],trace=[],metrics={breaths:0,hits:0,taken:0,healed:0,hides:0,lures:0,invalid:0};
 let path=quiet?[1,5,6,7,11,15,14,13,17,16,19]:[1,5,6,7,11,15,14,13,17,18,19],index=0,returning=false,combatReturn=null;
 function act(a){const hp=s.hp,healing=s.healingUsed||0,priorAttack=s.attack,r=apply(s,a);if(!r.ok){metrics.invalid++;return false;}actions.push(a);if(!validSave(s))throw Error('Invalid save '+JSON.stringify(a));if(a.type==='end'&&s.attack&&s.attack!==priorAttack){metrics.breaths++;if(s.attack.hit)metrics.hits++;}const recovered=risk?(s.healingUsed||0)-healing:Math.max(0,s.hp-hp);metrics.taken+=Math.max(0,hp+recovered-s.hp);metrics.healed+=recovered;if(a.type==='hide')metrics.hides++;if(a.type==='lure')metrics.lures++;if(capture)trace.push(structuredClone(s));return true;}
 function end(){return act({type:'end'});}
 function travel(to){
  for(const mode of quiet&&noiseControl?['sneak','walk']:['walk'])if(moveStatus(s,to,mode).allowed){if(s.mode!==mode)act({type:'mode',id:mode});return act({type:'move',id:to});}
  return false;
 }
 for(let n=0;s.phase==='playing'&&actions.length<limit&&n<limit;n++){
  if(s.pending){act({type:'skipReward'});continue;}
  const room=s.rooms[s.pos],enemy=room.enemy?.hp>0;
  if(s.hp<=s.maxHp-4&&s.provisions>0&&s.provisionTurn!==s.turn&&(!risk||s.healingUsed<12)){act({type:'provision'});continue;}
  if(enemy){
   if(s.resource.sword){act({type:'attack'});continue;}
   if(quiet&&combatReturn===null&&s.from!==null&&s.resource.move>=moveCost(s,s.from)&&endDamage(s)>1){const target=s.pos,back=s.from;if(travel(back)){combatReturn=target;continue;}}
   end();continue;
  }
  if(combatReturn===s.pos)combatReturn=null;
  if(combatReturn!==null){const to=combatReturn;if(s.resource.sword&&travel(to)){combatReturn=null;continue;}end();continue;}
  if(room.type==='checkpoint'){
   const k=checkpointIndex(s);
   if(s.stagePrepared[k]===null){act({type:'prepare',choice:'recruit',id:quiet?['silence','blade','ghost'][k]:STAGES[k].offers[0]});continue;}
   if(quiet&&!returning&&s.stageTrades[k]===0){const priorities=[['spark','scout'],(role==='mage'?['lantern','insight','acrobat']:['insight','lantern','acrobat']),['fury','wisdom','healing']][k],id=priorities.find(id=>s.market.includes(id)&&CARDS[id].cost<=s.resource.skill);if(id){act({type:'buy',index:s.market.indexOf(id)});continue;}}
  }
  if(room.type==='chest'&&!room.used){act({type:'interact'});continue;}
  if(s.pos===14&&!s.sluiceOpen){if(s.resource.skill>=1)act({type:'sluice'});else end();continue;}
  if(s.pos===16&&!s.sealQuiet){if(!room.used&&(s.hp<s.maxHp||s.noise>0)){act({type:'interact'});continue;}if(noiseControl&&s.resource.quiet<3&&s.resource.move&&s.hideTurn!==s.turn){act({type:'hide'});continue;}if(s.resource.quiet>=3&&s.resource.skill>=2)act({type:'quietSeal'});else end();continue;}
  if(s.pos===17&&!room.used){if(s.resource.skill>=3)act({type:'interact'});else end();continue;}
  if(s.pos===19&&!returning){act({type:'interact'});returning=true;path=quiet?[16,17,5,1,0]:[18,17,5,1,0];index=0;continue;}
  if(s.pos===0&&returning){act({type:'interact'});continue;}
  if(quiet&&noiseControl&&s.resource.skill>=1&&s.lureTurn!==s.turn&&s.pos===15){
   const f=lureForecast(s,11);if(f.ok&&!f.entersPlayer&&f.moves.some(e=>e.heard&&e.targetChanged&&e.kind==='move')){act({type:'lure',id:11});continue;}
  }
  const goal=path[index];
  if(quiet&&noiseControl&&s.rooms[goal]?.enemy?.hp>0&&s.resource.sword){
   if(s.resource.move>=moveCost(s,goal,'walk')+1&&s.hideTurn!==s.turn&&s.resource.quiet<4){act({type:'hide'});continue;}
  }
  if(travel(goal)){index++;continue;}
  if(quiet&&noiseControl&&s.resource.move>=1&&s.hideTurn!==s.turn&&(s.noise>=5||s.resource.quiet<2)){act({type:'hide'});continue;}
  end();
 }
 return {seed,role,policy:quiet?'quiet':'walk',phase:s.phase,hp:s.hp,turn:s.turn,pos:s.pos,reason:s.reason||'action-limit',metrics,actions,trace,state:s};
}
export function summarize(runs){const wins=runs.filter(r=>r.phase==='won'),deaths=runs.filter(r=>r.phase==='lost'&&r.hp===0),losses=runs.filter(r=>r.phase==='lost');const avg=(rs,f)=>rs.length?+(rs.reduce((n,r)=>n+f(r),0)/rs.length).toFixed(2):null;return {runs:runs.length,wins:wins.length,winRate:wins.length/runs.length,deaths:deaths.length,losses:losses.length,cutoffs:runs.filter(r=>r.phase==='playing').length,winTurns:avg(wins,r=>r.turn),allTurns:avg(runs,r=>r.turn),hp:avg(wins,r=>r.hp),taken:avg(runs,r=>r.metrics.taken),hides:avg(runs,r=>r.metrics.hides),lures:avg(runs,r=>r.metrics.lures)};}
