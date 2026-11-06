import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,apply,moveCost,moveStatus,validSave,breathPlan} from '../dist/engine.js';
import {createTutorialRun,TUTORIAL_STEPS,tutorialAllows,tutorialAdvance,tutorialChapter,tutorialTargets,tutorialHint} from '../dist/tutorial.js';

function practice(){
 const s=createTutorialRun();let index=0,actions=0;
 const perform=action=>{
  assert.ok(actions++<180,'practice must not get stuck in an action loop');
  assert.ok(tutorialAllows(index,action,s),`${TUTORIAL_STEPS[index]?.key} must allow ${JSON.stringify(action)}`);
  if(action.type!=='panel'){const result=apply(s,action);assert.ok(result.ok,`${TUTORIAL_STEPS[index]?.key}: ${result.message}`);}
  index=tutorialAdvance(index,action,s);assert.ok(validSave(s));return s;
 };
 const can=action=>tutorialAllows(index,action,s)&&apply(JSON.parse(JSON.stringify(s)),action).ok;
 const move=id=>{
  assert.ok(tutorialAllows(index,{type:'move',id},s));let waits=0;
  while(!moveStatus(s,id).allowed){
   if(s.rooms[s.pos].enemy?.hp>0&&TUTORIAL_STEPS[index]?.key==='escape'){
    if(s.resource.sword)perform({type:'attack'});else perform({type:'end'});
    if(s.pending)perform({type:'skipReward'});
    continue;
   }
   assert.ok(s.resource.move<moveCost(s,id),'only insufficient movement may delay this practice route');
   assert.ok(waits++<8,'drawing real medals must eventually provide enough movement');perform({type:'end'});
  }
  perform({type:'move',id});
 };
 return {s,perform,can,move,get index(){return index;},get key(){return TUTORIAL_STEPS[index]?.key;}};
}

function recruit(){
 const p=practice();
 for(const action of [{type:'move',id:1},{type:'interact'},{type:'panel',id:'sound'},{type:'hide'},{type:'lure',id:5}])p.perform(action);
 assert.equal(p.key,'wait-lure');assert.equal(p.s.rooms[6].enemy.target,5);assert.equal(p.s.rooms[5].enemy,null);
 p.perform({type:'end'});assert.equal(p.s.rooms[6].enemy,null);assert.equal(p.s.rooms[5].enemy.home,6);assert.equal(p.s.hp,22);
 for(const id of [2,6,7])p.move(id);
 assert.equal(p.s.rooms[6].visited,true);assert.equal(p.s.hp,22);assert.equal(p.s.rooms[5].enemy.target,6,'the new footstep is heard after the empty room was crossed');
 p.perform({type:'buy',index:0});assert.equal(p.s.resource.sword,2,'buying a medal does not immediately grant its power');assert.deepEqual(p.s.discard,['spark']);
 p.perform({type:'end'});assert.equal(p.key,'approach');assert.equal(p.s.rooms[6].enemy.home,6);assert.equal(p.s.hp,22);
 assert.ok(p.s.played.includes('spark'));assert.ok(p.s.played.includes('slash'));assert.equal(p.s.resource.sword,5);
 return p;
}

function recover({chest=false,reward=0,mode='walk',extraTurns=0}={}){
 const p=recruit();
 for(let i=0;i<extraTurns;i++)p.perform({type:'end'});
 p.perform({type:'mode',id:mode});p.move(11);
 if(chest)p.perform({type:'interact'});
 p.move(10);
 let attacks=0;
 while(p.key==='attack'){
  assert.ok(attacks++<10);
  if(!p.s.resource.sword)p.perform({type:'end'});else p.perform({type:'attack'});
 }
 assert.equal(p.key,'reward');p.perform(reward==='skip'?{type:'skipReward'}:{type:'reward',id:p.s.pending.options[reward]});
 p.perform({type:'interact'});assert.equal(p.key,'forecast');assert.equal(p.s.relic.name,'첫 불씨');assert.equal(p.s.countdown,14);assert.equal(p.s.memory,1);
 p.perform({type:'panel',id:'sound'});assert.equal(p.key,'escape');
 return p;
}

function clearEnemy(p,reward='skip'){
 let attempts=0;
 while(p.s.rooms[p.s.pos].enemy?.hp>0){
  assert.ok(attempts++<10);
  if(p.s.resource.sword)p.perform({type:'attack'});else p.perform({type:'end'});
 }
 if(p.s.pending)p.perform(reward==='skip'?{type:'skipReward'}:{type:'reward',id:p.s.pending.options[0]});
}

function escape({route='quiet',chest=false,reward=0,mode='walk',extraTurns=0,prepare=true,rest=false}={}){
 const p=recover({chest,reward,mode,extraTurns});
 const before={hp:p.s.hp,gold:p.s.gold,noise:p.s.noise};
 p.perform({type:'mode',id:mode});
 if(route==='quiet'&&prepare&&mode==='walk'&&p.can({type:'hide'})&&p.s.resource.move>=3)p.perform({type:'hide'});
 const path=route==='quiet'?[11,7,3,2,1,0]:[6,2,1,0];
 for(const id of path){
  clearEnemy(p);p.move(id);
  if(route==='quiet'&&prepare&&id===7&&p.s.resource.move===0)p.perform({type:'end'});
  if(rest&&id===3&&p.can({type:'interact'}))p.perform({type:'interact'});
 }
 clearEnemy(p);assert.equal(p.key,'escape');assert.equal(p.s.phase,'playing');assert.equal(tutorialTargets(p.index,p.s),'#sceneTarget');
 p.perform({type:'interact'});assert.equal(p.index,TUTORIAL_STEPS.length);assert.equal(p.s.phase,'won');assert.ok(p.s.hp>0);assert.ok(p.s.countdown>0);
 return {p,before};
}

test('the lure moves the guard before the player crosses its actual empty room without damage',()=>{
 const p=recruit();assert.equal(p.s.kills,0);assert.equal(p.s.hp,p.s.maxHp);assert.equal(p.s.rooms[6].enemy.home,6);
 assert.equal(p.s.log.some(x=>x.message.includes('파수병')&&x.message.includes('반격')),false);
});

test('the purchased attack is physically drawn, automatically adds power, and defeats a guardian the original dagger cannot',()=>{
 const p=recruit();assert.equal(p.s.purchases,1);assert.equal(p.s.played.length,6);assert.equal(p.s.resource.sword,5);
 p.move(11);p.move(10);assert.equal(p.s.rooms[10].enemy.hp,5);assert.equal(CARDS.slash.e.sword,2);
 p.perform({type:'attack'});assert.equal(p.s.rooms[10].enemy.hp,0);assert.equal(p.s.resource.sword,0);assert.equal(p.key,'reward');
 const cyc=createTutorialRun();cyc.market=['spark'];apply(cyc,{type:'buy',index:0});
 for(let i=0;i<20;i++){apply(cyc,{type:'end'});assert.ok(cyc.played.includes('spark'));assert.ok(cyc.played.includes('slash'));assert.equal(cyc.resource.sword,5);}
});

test('the return forecast supports a damage-free prepared detour and a shorter fought route with real costs',()=>{
 const p=recover({reward:'skip'});assert.ok(breathPlan(p.s).hit);assert.equal(breathPlan(p.s).damage,4);
 assert.match(tutorialHint(p.index,p.s),/4칸.*6칸/);
 p.perform({type:'hide'});p.move(11);p.move(7);assert.equal(p.s.echo[7],0);assert.equal(breathPlan(p.s).hit,false);
 p.perform({type:'end'});assert.equal(p.s.attack.hit,false);assert.equal(p.s.hp,22);
 const quiet=escape({route:'quiet',reward:'skip'}),short=escape({route:'short',reward:'skip'});
 assert.equal(quiet.p.s.hp,22);assert.ok(short.p.s.hp<quiet.p.s.hp);assert.equal(quiet.p.s.kills,1);assert.equal(short.p.s.kills,2);
 assert.ok(short.p.s.steps<quiet.p.s.steps);assert.ok(short.p.s.gold>quiet.p.s.gold,'fighting the returning guard grants its actual loot');
});

test('opening the optional chest changes gold and the return echo without blocking either escape',()=>{
 const quiet=recover({chest:false}),loot=recover({chest:true});
 assert.equal(quiet.s.rooms[11].used,false);assert.equal(loot.s.rooms[11].used,true);
 assert.ok(loot.s.gold>quiet.s.gold);assert.equal(quiet.s.echo[11],0);assert.ok(loot.s.echo[11]>0);
 for(const chest of [false,true])for(const route of ['quiet','short'])assert.equal(escape({chest,route}).p.s.phase,'won');
});

test('all guardian rewards and skipping survive both return choices, travel modes, and optional chest choices',()=>{
 let count=0;
 for(const reward of [0,1,2,'skip'])for(const route of ['quiet','short'])for(const mode of ['walk','sneak','rush'])for(const chest of [false,true]){
  const {p}=escape({reward,route,mode,chest,rest:true});assert.ok(validSave(p.s));count++;
 }
 assert.equal(count,48);console.log(`Tutorial escapes: ${count}/${count} (all rewards/skip, both return routes, all travel modes, optional chest)`);
});

test('free preparation cannot skip objectives, and actual entrance escape completes the lesson',()=>{
 const p=recruit(),checkpoint=JSON.stringify(p.s);assert.equal(TUTORIAL_STEPS[p.index].checkpoint,true);
 assert.equal(tutorialChapter(p.index),'2 · 새 능력으로 돌파');
 for(const action of [{type:'mode',id:'sneak'},{type:'hide'},{type:'end'}]){p.perform(action);assert.equal(p.key,'approach');}
 assert.equal(tutorialAllows(p.index,{type:'move',id:6},p.s),false);
 const restored=JSON.parse(checkpoint);assert.ok(validSave(restored));assert.equal(restored.pos,7);assert.equal(restored.resource.sword,5);
 const q=recover();assert.equal(tutorialAllows(q.index,{type:'move',id:5},q.s),false);
 assert.equal(tutorialAdvance(q.index,{type:'interact'},q.s),q.index,'holding the relic is not completion');
 assert.equal(tutorialAllows(TUTORIAL_STEPS.length,{type:'end'},q.s),false);
});


test('waiting before relic recovery can bring the patrol in without locking combat or rewards',()=>{
 const p=recruit();p.move(11);p.move(10);p.perform({type:'attack'});p.perform({type:'skipReward'});
 assert.equal(p.key,'relic');p.perform({type:'end'});p.perform({type:'end'});
 assert.equal(p.s.rooms[10].enemy.home,6);assert.equal(p.key,'relic');assert.equal(tutorialTargets(p.index,p.s),'#sceneTarget');
 p.perform({type:'attack'});assert.equal(p.key,'relic');assert.equal(tutorialTargets(p.index,p.s),'.ability-choice');
 p.perform({type:'reward',id:p.s.pending.options[0]});assert.equal(p.key,'relic');p.perform({type:'interact'});assert.equal(p.key,'forecast');
});

