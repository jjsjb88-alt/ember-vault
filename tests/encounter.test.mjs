import test from 'node:test';
import assert from 'node:assert/strict';
import {apply,newRun,emitNoise,breathPlan,moveCost,CARDS} from '../dist/engine.js';
import {roomInteraction,soundWavePlan,turnImpact,tensionNeeded} from '../dist/encounter.js';
import {createTutorialRun,tutorialAdvance,tutorialAllows,TUTORIAL_STEPS} from '../dist/tutorial.js';
import {buildRevealPlan,noiseDrawState} from '../dist/pool-reveal.js';

test('the revised tutorial introduces each rule through a successful real action',()=>{
 const s=createTutorialRun();let step=0;
 const perform=action=>{assert.ok(tutorialAllows(step,action,s));if(action.type!=='panel')assert.equal(apply(s,action).ok,true);step=tutorialAdvance(step,action,s);};
 for(const action of [{type:'move',id:1},{type:'interact'},{type:'panel',id:'sound'},{type:'hide'},{type:'lure',id:5},{type:'end'}])perform(action);
 assert.equal(s.hp,22);assert.equal(s.rooms[6].enemy,null);assert.equal(s.rooms[5].enemy.home,6);
 for(const id of [2,6,7])perform({type:'move',id});
 perform({type:'buy',index:0});assert.equal(s.resource.sword,2);perform({type:'end'});assert.equal(s.resource.sword,5);
 assert.ok(s.played.includes('spark'));assert.equal(s.rooms[6].enemy.home,6);assert.equal(s.hp,22);
 perform({type:'move',id:11});perform({type:'move',id:10});perform({type:'attack'});assert.equal(s.rooms[10].enemy.hp,0);
 perform({type:'skipReward'});perform({type:'interact'});perform({type:'panel',id:'sound'});
 assert.equal(breathPlan(s).damage,4);perform({type:'hide'});perform({type:'move',id:11});perform({type:'move',id:7});perform({type:'end'});
 assert.equal(s.attack.hit,false);assert.equal(s.hp,22);
 for(const id of [3,2,1,0])perform({type:'move',id});perform({type:'interact'});
 assert.equal(step,TUTORIAL_STEPS.length);assert.equal(s.phase,'won');assert.ok(s.score>0);
});

test('the dragon forecast accounts for armor spent on the enemy first and stops after a lethal enemy hit',()=>{
 const s=createTutorialRun();s.rooms[2].enemy={name:'test guard',hp:2,damage:1};s.echo=null;s.pos=2;s.noise=8;s.resource.block=3;
 let impact=turnImpact(s);assert.equal(impact.enemyTaken,0);assert.equal(impact.blocked,2);assert.equal(impact.taken,1);
 s.hp=1;s.resource.block=0;impact=turnImpact(s);assert.equal(impact.enemyTaken,1);assert.equal(impact.raw,0);
 s.hp=22;s.noise=7;assert.equal(turnImpact(s).raw,0);
 s.relic={name:'test'};s.turn=3;assert.equal(turnImpact(s).raw,2);
});

test('the acoustic animation uses only audible corridors, including absorption and unseen listeners',()=>{
 const s=newRun({seed:3});s.resource.quiet=0;s.resource.rattle=0;emitNoise(s,1,5,'test');
 const before=JSON.stringify(s),plan=soundWavePlan(s);assert.equal(JSON.stringify(s),before);
 const ids=new Set(s.lastSound.field.map(e=>e.id));
 for(const e of plan.edges){assert.ok(s.edges.some(([a,b])=>a===e.from&&b===e.to||b===e.from&&a===e.to));assert.ok(ids.has(e.from)&&ids.has(e.to));}
 assert.equal(plan.nodes.find(n=>n.id===1).delay,0);assert.ok(plan.heard.some(h=>!h.known));
 s.resource.quiet=12;emitNoise(s,1,3,'silent');assert.deepEqual(soundWavePlan(s),{nodes:[],edges:[],heard:[]});
 assert.equal(tensionNeeded(s,{type:'interact'},s.soundSeq-1,0),false);
});

test('noise draw warnings use only already revealed debt and quiet; drawing never raises dungeon rage',()=>{
 const s=newRun({seed:2}),before=JSON.stringify(s),plan=buildRevealPlan(s);
 const step=plan.steps.find(p=>p.id==='slash'),warning=noiseDrawState(step);
 assert.deepEqual(warning,{added:1,stored:1,quiet:0,exposed:1});
 assert.equal(noiseDrawState(plan.steps.at(-1)).quiet,2);assert.equal(JSON.stringify(s),before);assert.equal(s.noise,0);
});

test('object availability follows one-use, enemy, health, money, and minimum-pool rules',()=>{
 const s=newRun({seed:5});s.pos=1;assert.equal(roomInteraction(s).enabled,true);s.rooms[1].used=true;assert.equal(roomInteraction(s).act,'');
 s.pos=4;s.resource.sword=0;assert.equal(roomInteraction(s).enabled,false);s.resource.sword=2;assert.equal(roomInteraction(s).enabled,true);
 s.pos=8;s.noise=0;assert.equal(roomInteraction(s).enabled,false);s.hp--;assert.equal(roomInteraction(s).enabled,true);
 const shrine=s.rooms.find(r=>r.type==='shrine');s.pos=shrine.id;s.deck=[];s.discard=[];assert.equal(s.played.length,5);assert.equal(roomInteraction(s).enabled,false);
});
