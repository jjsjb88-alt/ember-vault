import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,apply,moveCost,moveStatus,validSave} from '../dist/engine.js';
import {createTutorialRun,TUTORIAL_STEPS,tutorialAllows,tutorialAdvance,tutorialChapter,tutorialTargets} from '../dist/tutorial.js';

function practice(){
 const s=createTutorialRun();let index=0,actions=0;
 const perform=action=>{
  assert.ok(actions++<160,'practice must not get stuck in an action loop');
  const before=index;assert.ok(tutorialAllows(index,action,s),`step ${index+1} must allow ${JSON.stringify(action)}`);
  if(action.type!=='panel'){const result=apply(s,action);assert.ok(result.ok,`step ${index+1}: ${result.message}`);}
  index=tutorialAdvance(index,action,s);
  // The app returns from the scripted rush to walking before the free-choice chapter.
  if(before===4&&index===5)s.mode='walk';
  assert.ok(validSave(s));return s;
 };
 const can=action=>tutorialAllows(index,action,s)&&apply(JSON.parse(JSON.stringify(s)),action).ok;
 const move=id=>{
  assert.ok(tutorialAllows(index,{type:'move',id},s));let waits=0;
  while(!moveStatus(s,id).allowed){
   assert.ok(s.resource.move<moveCost(s,id),'only insufficient movement may delay this practice route');
   assert.ok(waits++<8,'drawing real medals must eventually provide enough movement');perform({type:'end'});
  }
  perform({type:'move',id});
 };
 return {s,perform,can,move,get index(){return index;}};
}

function reachReward(){
 const p=practice();
 for(const action of [{type:'move',id:1},{type:'interact'},{type:'panel',id:'sound'},{type:'lure',id:5},{type:'mode',id:'rush'},{type:'move',id:2},{type:'end'},{type:'attack'}])p.perform(action);
 assert.equal(p.index,7);assert.equal(p.s.pending?.type,'reward');return p;
}

function reachChoice({reward='healing',buy=0}={}){
 const p=reachReward();
 p.perform(reward==='skip'?{type:'skipReward'}:{type:'reward',id:reward});
 assert.equal(p.index,8);assert.ok(CARDS[p.s.market[buy]].cost<=p.s.resource.skill);
 p.perform({type:'buy',index:buy});p.perform({type:'hide'});assert.equal(p.index,10);return p;
}

function escape({branch=3,reward='healing',buy=0,mode='walk',extraTurns=0,hide=false,useObject=true,returnBranch=branch}={}){
 const p=reachChoice({reward,buy});
 for(let i=0;i<extraTurns;i++){p.perform({type:'end'});assert.equal(p.index,10);}
 p.perform({type:'mode',id:mode});assert.equal(p.index,10);
 if(hide&&p.can({type:'hide'})){p.perform({type:'hide'});assert.equal(p.index,10);}
 p.move(branch);assert.equal(p.index,11);
 if(useObject&&p.can({type:'interact'})){p.perform({type:'interact'});assert.equal(p.index,11);}
 const choice={hp:p.s.hp,noise:p.s.noise,gold:p.s.gold,move:p.s.resource.move};
 p.move(7);assert.equal(p.index,12);p.perform({type:'interact'});assert.equal(p.index,13);
 assert.equal(p.s.relic.name,'첫 불씨');assert.equal(p.s.countdown,14);assert.equal(p.s.memory,1);
 for(const id of [returnBranch,2,1,0]){
  if(hide&&p.can({type:'hide'})&&p.s.resource.move>moveCost(p.s,id)){p.perform({type:'hide'});assert.equal(p.index,13);}
  p.move(id);assert.equal(p.index,13);
 }
 assert.equal(p.s.phase,'playing');p.perform({type:'interact'});
 assert.equal(p.index,TUTORIAL_STEPS.length);assert.equal(p.s.phase,'won');assert.ok(p.s.hp>0);assert.ok(p.s.countdown>0);assert.ok(p.s.score>0);
 return {p,choice};
}

test('the safe and treasure branches both escape and make visibly different health, noise and gold choices',()=>{
 const safe=escape({branch:3}),treasure=escape({branch:6});
 assert.ok(safe.choice.hp>treasure.choice.hp,'resting restores health');
 assert.ok(safe.choice.noise<treasure.choice.noise,'moss and rest leave less alarm');
 assert.ok(safe.choice.gold<treasure.choice.gold,'the noisy chest buys a real reward');
 assert.equal(safe.p.s.rooms[3].used,true);assert.equal(treasure.p.s.rooms[6].used,true);
 assert.equal(safe.p.s.rooms[7].used,true);assert.equal(treasure.p.s.rooms[7].used,true);
});

test('all offered rewards, reward skipping and affordable purchases survive both routes with different travel choices',()=>{
 const probe=reachReward(),rewards=[...probe.s.pending.options,'skip'];
 const buys=probe.s.market.flatMap((id,index)=>CARDS[id].cost<=probe.s.resource.skill?[index]:[]);
 assert.deepEqual(buys,[0,3],'both currently affordable purchases must be exercised');
 const seenRewards=new Set(),seenBuys=new Set();let count=0;
 for(const reward of rewards)for(const buy of buys)for(const branch of [3,6])for(const mode of ['walk','sneak','rush'])for(const extraTurns of [0,2]){
  const {p}=escape({reward,buy,branch,mode,extraTurns,hide:extraTurns>0});
  assert.ok(validSave(p.s));seenRewards.add(reward);seenBuys.add(buy);count++;
 }
 assert.equal(count,96);assert.equal(seenRewards.size,rewards.length);assert.equal(seenBuys.size,buys.length);
 console.log(`Tutorial escapes: ${count}/${count} (both routes, all rewards/skip, all affordable purchases, three modes, waiting and hiding)`);
});

test('optional room interactions may be skipped and the other branch remains a legal return route',()=>{
 for(const branch of [3,6]){
  const {p}=escape({branch,reward:'skip',useObject:false,returnBranch:branch===3?6:3});
  assert.equal(p.s.rooms[branch].used,false);assert.equal(p.s.phase,'won');
 }
});

test('preparation and optional actions do not skip objectives, and completion requires actual escape',()=>{
 const p=reachChoice();
 assert.equal(tutorialChapter(p.index),'3 · 선택과 귀환');
 assert.equal(tutorialAllows(p.index,{type:'move',id:0},p.s),false);
 for(const action of [{type:'mode',id:'sneak'},{type:'end'},{type:'hide'}]){p.perform(action);assert.equal(p.index,10);}
 p.move(3);assert.equal(p.index,11);p.perform({type:'interact'});assert.equal(p.index,11);
 p.move(7);assert.equal(p.index,12);assert.equal(tutorialAllows(p.index,{type:'move',id:3},p.s),false);
 p.perform({type:'interact'});assert.equal(p.index,13);
 assert.equal(tutorialAdvance(13,{type:'interact'},p.s),13,'collecting the relic is not the finish');
 assert.equal(tutorialAllows(13,{type:'move',id:5},p.s),false,'the lure-only room is outside the return lesson');
 for(const id of [3,2,1,0])p.move(id);
 assert.equal(tutorialTargets(13,p.s),'#sceneTarget');assert.equal(p.index,13);
 p.perform({type:'interact'});assert.equal(p.index,14);assert.equal(tutorialAllows(14,{type:'end'},p.s),false);
});

