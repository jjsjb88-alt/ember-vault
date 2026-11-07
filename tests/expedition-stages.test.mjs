import test from 'node:test';
const newRun=(options)=>engineNewRun({...options,gimmicks:false});
import assert from 'node:assert/strict';
import {newRun as engineNewRun,apply,validSave,moveStatus,emitNoise,breathPlan,echoFadeEvery,neighbours,CARDS,moveCost} from '../dist/engine.js';
import {STAGES,STAGE_ROOMS,RETURN_LIFT_EDGE,checkpointIndex,expeditionBonuses} from '../dist/expedition-stages.js';
import {exitAnchor,hitExit} from '../dist/scene-layout.js';
const act=(s,a)=>{const r=apply(s,a);assert.equal(r.ok,true,r.message);return r;};
const pool=s=>s.deck.length+s.discard.length+s.played.length;
function atCheckpoint(index){const s=newRun({layout:'staged',seed:42});for(let i=0;i<index;i++){s.stagePrepared[i]='recruit';s.rooms[STAGES[i].checkpoint].used=true;}s.pos=STAGES[index].checkpoint;s.memory=index;s.resource.skill=12;s.resource.rattle=0;s.resource.quiet=0;return s;}
const unchangedFailure=(s,a)=>{const before=JSON.stringify(s);assert.equal(apply(s,a).ok,false);assert.equal(JSON.stringify(s),before);};

test('four stages have three real preparation gates and only a deepest objective',()=>{
 for(const role of ['rogue','knight','mage']){
  const s=newRun({layout:'staged',role,seed:42});assert.equal(s.rooms.length,20);assert.deepEqual(s.rooms.map(r=>r.stage),STAGE_ROOMS);
  assert.deepEqual(STAGES.map(x=>x.name),['상층','중층','하층','심층']);assert.deepEqual(s.rooms.filter(r=>r.type==='checkpoint').map(r=>r.id),[5,7,13]);
  assert.deepEqual(s.rooms.filter(r=>r.type==='relic').map(r=>r.id),[19]);assert.equal(s.rooms[19].relic.name,'용의 기억');assert.ok(validSave(s));
  const reachable=new Set([0]),queue=[0];while(queue.length)for(const id of neighbours(s,queue.shift()))if(!reachable.has(id)){reachable.add(id);queue.push(id);}assert.equal(reachable.size,20);
  for(const [a,b]of s.edges){assert.ok(exitAnchor(a,b));assert.ok(exitAnchor(b,a));}
 }
});
test('recruiting opens a gate once and does not immediately add its attack or reroll a hand',()=>{
 const s=atCheckpoint(0),before=structuredClone(s),count=pool(s);unchangedFailure(s,{type:'move',id:6});
 unchangedFailure(s,{type:'prepare',choice:'recruit',id:'fury'});act(s,{type:'prepare',choice:'recruit',id:'spark'});
 assert.equal(s.stagePrepared[0],'recruit');assert.equal(s.rooms[5].used,true);assert.equal(pool(s),count+1);assert.equal(s.discard.at(-1),'spark');
 assert.deepEqual(s.resource,before.resource);assert.equal(s.rng,before.rng);assert.deepEqual(s.played,before.played);assert.equal(s.turn,before.turn);
 const restored=JSON.parse(JSON.stringify(s));assert.ok(validSave(restored));unchangedFailure(restored,{type:'prepare',choice:'resupply'});
 assert.equal(moveStatus(s,6).allowed,true);act(s,{type:'move',id:6});assert.equal(s.memory,1);assert.equal(echoFadeEvery(s),2);
});
test('both deep entrances require the lower checkpoint and all earlier preparations',()=>{
 const s=atCheckpoint(2);s.pos=15;s.resource.move=20;unchangedFailure(s,{type:'move',id:19});s.pos=13;unchangedFailure(s,{type:'move',id:17});
 act(s,{type:'prepare',choice:'recruit',id:'fury'});s.pos=15;act(s,{type:'move',id:19});assert.equal(s.memory,3);assert.equal(echoFadeEvery(s),4);assert.ok(validSave(s));
});
test('refining is a saved pending selection; cancelling consumes no preparation and confirming removes exactly one',()=>{
 const s=atCheckpoint(1),count=pool(s);act(s,{type:'prepare',choice:'refine'});assert.equal(s.pending.checkpoint,1);assert.ok(validSave(JSON.parse(JSON.stringify(s))));
 unchangedFailure(s,{type:'move',id:11});act(s,{type:'cancelPurge'});assert.equal(s.stagePrepared[1],null);assert.equal(pool(s),count);
 act(s,{type:'prepare',choice:'refine'});const id=s.pending.options[0],restored=JSON.parse(JSON.stringify(s));act(restored,{type:'purge',id});
 assert.equal(restored.stagePrepared[1],'refine');assert.equal(restored.pending,null);assert.equal(pool(restored),count-1);assert.equal(restored.rooms[7].used,true);assert.ok(validSave(restored));unchangedFailure(restored,{type:'purge',id});
});
test('resupply restores limited health and inventory without deleting remembered sound',()=>{
 const s=atCheckpoint(2);s.hp-=9;s.noise=7;s.echo[11]=5;const before=structuredClone(s);act(s,{type:'prepare',choice:'resupply'});
 assert.equal(s.hp,before.hp+6);assert.equal(s.noise,5);assert.equal(s.provisions,2);assert.deepEqual(s.echo,before.echo);assert.equal(s.stagePrepared[2],'resupply');assert.ok(validSave(s));unchangedFailure(s,{type:'prepare',choice:'resupply'});
});
test('extra trading is available only once per prepared checkpoint and survives a new turn and reload',()=>{
 const outside=newRun({layout:'staged'});unchangedFailure(outside,{type:'buy',index:0});unchangedFailure(outside,{type:'refresh'});
 const s=atCheckpoint(0);unchangedFailure(s,{type:'buy',index:0});act(s,{type:'prepare',choice:'recruit',id:'spark'});const count=pool(s),skill=s.resource.skill,cost=CARDS[s.market[0]].cost;
 act(s,{type:'buy',index:0});assert.equal(pool(s),count+1);assert.equal(s.resource.skill,skill-cost);assert.equal(s.stageTrades[0],1);
 const restored=JSON.parse(JSON.stringify(s));assert.ok(validSave(restored));unchangedFailure(restored,{type:'buy',index:1});unchangedFailure(restored,{type:'refresh'});act(restored,{type:'end'});unchangedFailure(restored,{type:'buy',index:0});
});
test('portable supplies use real noise modifiers, cannot be wasted at full health and are limited per turn',()=>{
 const s=newRun({layout:'staged',seed:4});unchangedFailure(s,{type:'provision'});s.hp-=9;s.provisions=2;s.resource.quiet=2;s.resource.rattle=0;
 const hp=s.hp;act(s,{type:'provision'});assert.equal(s.hp,hp+6);assert.equal(s.provisions,1);assert.equal(s.lastSound.strength,1);assert.equal(s.resource.quiet,0);unchangedFailure(s,{type:'provision'});
 assert.ok(validSave(JSON.parse(JSON.stringify(s))));act(s,{type:'end'});s.hp-=6;act(s,{type:'provision'});assert.equal(s.provisions,0);assert.ok(validSave(s));
});
test('the deep lift spends exactly once and transmits actual sound and breath to the upper checkpoint',()=>{
 const s=atCheckpoint(2);act(s,{type:'prepare',choice:'recruit',id:'fury'});s.pos=17;s.resource.skill=3;s.resource.move=10;s.echo.fill(0);s.echo[17]=9;s.echo[5]=3;
 assert.equal(breathPlan({...s,pos:5}).hit,false);const before=JSON.stringify(s);s.resource.skill=2;unchangedFailure(s,{type:'interact'});Object.assign(s,JSON.parse(before));
 act(s,{type:'interact'});assert.deepEqual(RETURN_LIFT_EDGE,[5,17]);assert.equal(s.resource.skill,0);assert.equal(s.lastSound.strength,8);assert.ok(s.lastSound.field.some(x=>x.id===5));assert.ok(neighbours(s,17).includes(5));assert.equal(breathPlan({...s,pos:5}).hit,true);unchangedFailure(s,{type:'interact'});
 for(const from of [5,17])for(const to of neighbours(s,from)){const p=exitAnchor(from,to);assert.ok(p);assert.equal(hitExit(from,neighbours(s,from),p.x,p.y),to);}
});
test('stage memory persists on return and malformed new progress cannot replace a valid save',()=>{
 const s=atCheckpoint(2);act(s,{type:'prepare',choice:'recruit',id:'fury'});s.pos=15;s.resource.move=20;act(s,{type:'move',id:19});s.rooms[19].enemy.hp=0;act(s,{type:'move',id:15});assert.equal(s.memory,3);assert.equal(echoFadeEvery(s),4);assert.ok(validSave(s));
 for(const mutate of [s=>s.rooms[0]=null,s=>s.stagePrepared[0]=false,s=>s.stagePrepared.pop(),s=>s.stageTrades[1]=2,s=>s.provisions=-1,s=>s.provisions=5,s=>s.rooms[0].stage=3,s=>s.rooms[10].type='relic',s=>s.rooms[5].used=false,s=>s.stagePrepared[0]=null]){const copy=structuredClone(s);mutate(copy);assert.equal(validSave(copy),false);}
});
test('only the deep relic completes the new goal and scoring rewards tempo and quiet rather than gold farming',()=>{
 const s=atCheckpoint(2);act(s,{type:'prepare',choice:'recruit',id:'fury'});s.pos=0;s.relic={name:'달의 눈물',value:18};unchangedFailure(s,{type:'interact'});
 s.relic=structuredClone(s.rooms[19].relic);s.countdown=9;s.rooms[19].used=true;s.turn=12;s.noiseMade=24;s.gold=999;
 const expected=56+20+s.hp+expeditionBonuses(s).tempo+expeditionBonuses(s).quiet;act(s,{type:'interact'});assert.equal(s.score,expected);
 const slower={...s,phase:'playing',turn:20,noiseMade:45,gold:999999};act(slower,{type:'interact'});assert.ok(slower.score<s.score);
});

function earnedExpedition(seed,role){
 const s=newRun({seed,role,layout:'staged'});let path=[1,5,6,7,11,15,14,13,17,18,19],index=0,returning=false,actions=0;
 while(s.phase==='playing'&&actions++<350){
  if(s.pending){act(s,{type:'skipReward'});continue;}
  const room=s.rooms[s.pos];
  if(s.hp<=s.maxHp-6&&s.provisions>0&&s.provisionTurn!==s.turn){act(s,{type:'provision'});continue;}
  if(room.enemy?.hp>0){act(s,{type:s.resource.sword?'attack':'end'});continue;}
  if(room.type==='checkpoint'){const camp=checkpointIndex(s);if(s.stagePrepared[camp]===null){act(s,{type:'prepare',choice:'recruit',id:STAGES[camp].offers[0]});continue;}if(!returning&&s.stageTrades[camp]===0){const i=s.market.findIndex(id=>CARDS[id].cost<=s.resource.skill&&(CARDS[id].e.sword||CARDS[id].e.move));if(i>=0){act(s,{type:'buy',index:i});continue;}}}
  if(room.type==='chest'&&!room.used){act(s,{type:'interact'});continue;}
  if(s.pos===17&&!room.used&&s.resource.skill>=3){act(s,{type:'interact'});continue;}
  if(s.pos===19&&!returning){act(s,{type:'interact'});returning=true;path=s.rooms[17].used?[18,17,5,1,0]:[15,11,7,6,5,1,0];index=0;continue;}
  if(s.pos===0&&returning){act(s,{type:'interact'});continue;}
  const to=path[index],mode=s.resource.move>=moveCost(s,to,'sneak')?'sneak':'walk';
  if(s.resource.move>=moveCost(s,to,mode)){if(s.mode!==mode)act(s,{type:'mode',id:mode});act(s,{type:'move',id:to});index++;}else act(s,{type:'end'});
  assert.ok(validSave(s));
 }
 assert.ok(actions<350);return s;
}
test('earned routes across all roles can build at all three checkpoints, recover the deep relic and return',()=>{
 for(const role of ['rogue','knight','mage']){let wins=0;for(let seed=1;seed<=10;seed++){const s=earnedExpedition(seed,role);assert.ok(['won','lost'].includes(s.phase));assert.ok(validSave(s));if(s.phase==='won'){wins++;assert.equal(s.relic.name,'용의 기억');assert.ok(s.stagePrepared.every(Boolean));}}assert.ok(wins>0,`${role}: a real earned route must be viable`);}
});
