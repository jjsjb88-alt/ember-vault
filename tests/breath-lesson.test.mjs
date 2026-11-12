import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newRun,emitNoise,breathPlan,dragonDue} from '../dist/engine.js';
import {LESSONS,LESSON_KEY,loadLessons,markLesson,lessonAfterAction,lessonBeforeBreath,breathWarning} from '../dist/breath-lesson.js';

const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
test('the breath is taught in order, once per device: echo, then alert, then the first breath',()=>{
 const s=newRun({seed:5,layout:'staged',risk:true,campaign:true}),st=store(),seen=loadLessons(st);
 assert.equal(lessonAfterAction(s,seen),null,'silent start teaches nothing');
 s.echo[s.pos]=1;assert.equal(lessonAfterAction(s,seen),null,'a single soft step is not worth a lesson');s.echo[s.pos]=3;
 let l=lessonAfterAction(s,seen,'기사');assert.equal(l.key,'echo');assert.ok(l.lines.some(([who])=>who==='기사'),'the hero speaks under the role name');
 markLesson(st,seen,l.key);assert.equal(lessonAfterAction(s,seen),null,'not repeated, alert still low');
 s.noise=6;l=lessonAfterAction(s,seen);assert.equal(l.key,'alert');markLesson(st,seen,l.key);
 assert.equal(lessonAfterAction(s,seen),null);
 assert.deepEqual(loadLessons(st),['echo','alert'],'remembered on the device');assert.ok(JSON.parse(st.getItem(LESSON_KEY)));
});
test('the first breath lesson tells the truth about this room and never changes the run',()=>{
 const s=newRun({seed:5,layout:'staged',risk:true,campaign:true});emitNoise(s,s.pos,12,'test');emitNoise(s,s.pos,12,'test');assert.ok(dragonDue(s));
 const before=JSON.stringify(s),plan=breathPlan(s);assert.ok(plan.hit);
 const hit=lessonBeforeBreath(s,plan,[]);assert.equal(hit.key,'breath');assert.deepEqual(hit.lines.map(x=>x[1]),LESSONS.breathHit.map(x=>x[1]));
 assert.ok(hit.lines.some(([,line])=>line.includes('턴으로 돌아가기')),'the way out is named');
 const safe=lessonBeforeBreath(s,{...plan,hit:false},[]);assert.deepEqual(safe.lines.map(x=>x[1]),LESSONS.breathSafe.map(x=>x[1]));
 assert.equal(lessonBeforeBreath(s,plan,['breath']),null);assert.equal(JSON.stringify(s),before,'lessons only read');
 const warn=breathWarning(s,plan,true);assert.ok(warn.danger);assert.ok(warn.title.includes(String(plan.damage)));assert.ok(warn.text.includes(String(plan.echo)));
 assert.equal(breathWarning(s,{...plan,hit:false},true).danger,false);assert.equal(breathWarning(s,plan,false),null);
 const classic=newRun({seed:5,layout:'classic'});classic.echo=null;assert.equal(lessonAfterAction(classic,[]),null);assert.equal(lessonBeforeBreath(classic,plan,[]),null);
});
test('every lesson line stays one short cutscene line and exists in both locales',()=>{
 const en=JSON.parse(fs.readFileSync(new URL('../dist/locales/en.json',import.meta.url))),ja=JSON.parse(fs.readFileSync(new URL('../dist/locales/ja.json',import.meta.url)));
 for(const lines of Object.values(LESSONS))for(const [who,line] of lines){assert.ok(who&&line.length<=95,line);assert.ok(en[line]&&!/[가-힣]/.test(en[line]),'en: '+line);assert.ok(ja[line]&&!/[가-힣]/.test(ja[line]),'ja: '+line);}
});
