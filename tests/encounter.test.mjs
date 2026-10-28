import test from 'node:test';
import assert from 'node:assert/strict';
import {apply,newRun,emitNoise} from '../dist/engine.js';
import {roomInteraction,soundWavePlan,turnImpact,tensionNeeded} from '../dist/encounter.js';
import {createTutorialRun,tutorialAdvance,tutorialAllows,TUTORIAL_STEPS} from '../dist/tutorial.js';
import {buildRevealPlan,noiseDrawState} from '../dist/pool-reveal.js';

test('the complete tutorial reaches dragon breath, a real victory reward, and a finish without dead ends',()=>{
 const s=createTutorialRun();let step=0;
 const perform=action=>{assert.ok(tutorialAllows(step,action));if(action.type!=='panel')assert.equal(apply(s,action).ok,true);step=tutorialAdvance(step,action);};
 perform({type:'move',id:1});assert.equal(s.noise,2);
 perform({type:'interact'});assert.equal(s.noise,4);assert.ok(s.gold>=5);
 perform({type:'panel',id:'sound'});perform({type:'lure',id:5});assert.equal(s.noise,7);
 perform({type:'mode',id:'rush'});assert.equal(step,4);perform({type:'move',id:2});assert.equal(s.noise,10);
 const before=JSON.stringify(s),impact=turnImpact(s);assert.equal(JSON.stringify(s),before);assert.equal(impact.raw,3);assert.equal(impact.enemyTaken,1);assert.equal(impact.taken,3);
 perform({type:'end'});assert.equal(s.hp,18);assert.equal(s.resource.sword,2);
 perform({type:'attack'});assert.equal(s.rooms[2].enemy.hp,0);assert.equal(s.pending.type,'reward');
 perform({type:'reward',id:s.pending.options[0]});assert.equal(step,TUTORIAL_STEPS.length);assert.equal(s.pending,null);assert.equal(s.phase,'playing');
});

test('the dragon forecast accounts for armor spent on the enemy first and stops after a lethal enemy hit',()=>{
 const s=createTutorialRun();s.pos=2;s.noise=8;s.resource.block=3;
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
