import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,apply,resolvePool} from '../dist/engine.js';
import {buildRevealPlan,revealStakes} from '../dist/pool-reveal.js';

test('last-seal hint uses only revealed resources, never the committed final draw',()=>{
 const s=newRun({seed:1});s.pos=4;
 const shown={sword:1,move:1,skill:0,block:0};
 assert.equal(revealStakes(s,shown),'공격력이 2 더 필요하다');
 s.poolTotal.sword=100;s.resource.sword=100;s.played=['fury'];
 assert.equal(revealStakes(s,shown),'공격력이 2 더 필요하다');
 assert.equal(revealStakes(s,{...shown,sword:3}),'돌파할 공격력이 모였다');
});

test('movement stakes follow current stance cost and do not expose the final movement total',()=>{
 const s=newRun({seed:1});s.mode='sneak';
 const shown={sword:0,move:1,skill:0,block:0};
 assert.equal(revealStakes(s,shown),'한 걸음 더. 이동력이 1 더 필요하다');
 s.poolTotal.move=99;s.resource.move=99;
 assert.equal(revealStakes(s,shown),'한 걸음 더. 이동력이 1 더 필요하다');
 assert.equal(revealStakes(s,{...shown,move:2}),'다음 발걸음은, 이 추출에 달려 있다');
});

test('cinematic totals match committed draws across roles and turns without changing game or RNG',()=>{
 for(const role of ['rogue','knight','mage'])for(let seed=1;seed<=15;seed++){
  const s=newRun({role,seed});
  for(let turn=0;turn<8;turn++){
   const before=JSON.stringify(s),plan=buildRevealPlan(s);
   assert.deepEqual(plan.steps.at(-1).totals,s.poolTotal);
   assert.equal(plan.steps.length,s.played.length);
   assert.deepEqual(plan.steps.map(x=>x.id),s.played);
   assert.equal(plan.base.block,role==='knight'?1:0);
   assert.equal(plan.base.skill,role==='mage'?1:0);
   assert.equal(plan.base.move,1);
   assert.equal(JSON.stringify(s),before,'viewing or skipping a reveal cannot reroll, spend or award resources');
   assert.equal(apply(s,{type:'end'}).ok,true);
  }
 }
});
test('chain slots appear when the source ability is revealed, with no phantom slots on an empty pool',()=>{
 const s=newRun({seed:16});s.played=[];s.discard=[];
 s.deck=['echo','blade','step','guard','focus','echo','scout','slash','focus'];
 s.resource={move:1,sword:0,skill:0,block:0,quiet:0,rattle:0};resolvePool(s);
 const plan=buildRevealPlan(s);
 assert.equal(plan.initialSlots,5);assert.equal(plan.steps.length,7);
 assert.equal(plan.steps[2].id,'scout');assert.equal(plan.steps[2].slots,5);
 assert.equal(plan.steps[3].id,'echo');assert.equal(plan.steps[3].added,2);assert.equal(plan.steps[3].slots,7);
 assert.equal(plan.steps.filter(x=>x.last).length,1);assert.equal(plan.steps.at(-1).slots,7);
 assert.deepEqual(plan.steps.at(-1).totals,s.poolTotal);
 const t=newRun();t.deck=['echo','echo'];t.discard=[];t.played=[];t.resource={move:1,sword:0,skill:0,block:0,quiet:0,rattle:0};resolvePool(t);
 const depleted=buildRevealPlan(t);assert.equal(depleted.initialSlots,2);assert.ok(depleted.steps.every(x=>x.slots===2&&x.added===0));
});
test('quiet and first-action rattle accumulate separately and completed-save viewing does not spend them',()=>{
 const s=newRun();s.played=[];s.deck=[];s.discard=[];s.resource={move:1,sword:0,skill:0,block:0,quiet:0,rattle:0};
 resolvePool(s,['fury','silence','ghost','greed','ambush']);
 const plan=buildRevealPlan(s);assert.equal(plan.totals.quiet,9);assert.equal(plan.totals.rattle,4);
 const original=JSON.stringify(s);buildRevealPlan(s);buildRevealPlan(s);assert.equal(JSON.stringify(s),original);
 assert.equal(plan.steps[0].totals.sword,6);assert.equal(plan.steps[0].totals.quiet,0);assert.equal(plan.steps[1].totals.quiet,4);
});
