import test from 'node:test';
import assert from 'node:assert/strict';
import {TUTORIAL_STEPS,TUTORIAL_PROLOGUE,TUTORIAL_TURN,TUTORIAL_DONE,TUTOR_NAME,createTutorialRun,tutorialMapLesson,tutorialTargets,tutorialActionReason} from '../dist/tutorial.js';
import {makeQueue,typeDuration} from '../dist/cutscene.js';

const ok=talk=>Array.isArray(talk)&&talk.length&&talk.every(([who,line])=>who&&line&&!/연습|튜토리얼/.test(line));
test('every practice step has a reason told as dialogue and a control line',()=>{
 assert.equal(TUTORIAL_STEPS.length,18);
 assert.equal(new Set(TUTORIAL_STEPS.map(s=>s.key)).size,TUTORIAL_STEPS.length);
 for(const s of TUTORIAL_STEPS){
  assert.ok(s.title&&s.text&&ok(s.talk),s.title);
  assert.ok(s.talk.some(([who])=>who===TUTOR_NAME),`${TUTOR_NAME} speaks: ${s.title}`);
  for(const [,line] of s.talk)assert.ok(line.length<=70,`one cutscene line stays short: ${line}`);
 }
});
test('the prologue and turn dialogue stay brief and avoid rule lectures or boss spoilers',()=>{
 assert.ok(ok(TUTORIAL_PROLOGUE)&&ok(TUTORIAL_TURN)&&ok(TUTORIAL_DONE));
 const pro=TUTORIAL_PROLOGUE.map(x=>x[1]).join(' '),turn=TUTORIAL_TURN.map(x=>x[1]).join(' ');
 for(const w of ['발소리를 기억','깜빡','메달','따뜻'])assert.ok(pro.includes(w),w);
 assert.ok(!/종/.test(pro+turn),'no bell');
 // 설명조 금지: 자원 이름을 나열하거나 규칙을 숫자로 말하지 않는다
 for(const [,line] of [...TUTORIAL_PROLOGUE,...TUTORIAL_TURN]){
  const named=['공격','이동','기술','방어'].filter(w=>line.includes(w)).length;
  assert.ok(named<2,`no resource list in dialogue: ${line}`);
  assert.ok(!/[0-9]|다섯 개|한 턴|매 턴/.test(line),`no rule numbers in dialogue: ${line}`);
  assert.ok(!/숨|용/.test(line),`no breath or dragon: the final boss is left open: ${line}`);
 }
});
test('cutscenes play in the order they were queued; typing time grows with the line',()=>{
 const q=makeQueue();q.push('a');q.push('b');assert.equal(q.next(),'a');assert.equal(q.next(),'b');assert.equal(q.next(),null);
 assert.ok(typeDuration('가나다라')>typeDuration('가'));assert.ok(typeDuration('x'.repeat(70))<2500,'a full line types in under 2.5 s');
});
test('map lessons have a short reading prompt and an explicit, stage-specific continue target',()=>{
 const s=createTutorialRun();
 assert.deepEqual(TUTORIAL_STEPS.filter(step=>step.observe).map(step=>step.key),['sound','forecast']);
 for(const key of ['sound','forecast']){
  const index=TUTORIAL_STEPS.findIndex(step=>step.key===key),lesson=tutorialMapLesson(index,s);
  assert.equal(lesson.key,key);assert.equal(lesson.continueLabel,'지도 확인 · 계속');assert.ok(lesson.text.length<50);
  assert.equal(tutorialTargets(index,s),'#mapToggle');assert.equal(tutorialTargets(index,s,{mapOpen:true}),`[data-act="tutorialContinue"][data-id="${key}"]`);
 }
 assert.equal(tutorialMapLesson(0,s),null);
 const walk=TUTORIAL_STEPS.findIndex(step=>step.key==='pass-junction');
 assert.match(tutorialActionReason(walk,{type:'mode',id:'rush'},s),/지금은 걷기/);
 assert.equal(tutorialActionReason(walk,{type:'mode',id:'walk'},s),'');
});
