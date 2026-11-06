import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,apply} from '../dist/engine.js';
import {createTutorialJournal,recordTutorialAction,tutorialRecap} from '../dist/tutorial-journal.js';

const clone=value=>JSON.parse(JSON.stringify(value));
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function fixture(){
 const s=newRun({seed:12,layout:'classic'});
 s.rooms.forEach(r=>{r.enemy=null;r.used=false;});s.noise=0;s.echo.fill(0);s.played=[];s.discard=[];
 s.deck=['step','step','slash','focus','guard'];s.resource={move:30,sword:5,skill:10,block:0,quiet:0,rattle:0};
 return s;
}
function enemy(room,hp=2,damage=1){return {home:room,kind:'skeleton',name:'연습 파수병',hp,maxHp:hp,damage,gold:2,mode:'idle',target:null,memory:0,awareness:0,anchored:false};}
function perform(s,journal,action){
 const before=freeze(clone(s)),result=apply(s,action);assert.ok(result.ok,result.message);
 const after=freeze(clone(s)),beforeText=JSON.stringify(before),afterText=JSON.stringify(after);
 const feedback=recordTutorialAction(journal,before,action,after);
 assert.equal(JSON.stringify(before),beforeText);assert.equal(JSON.stringify(after),afterText);
 assert.equal(typeof feedback,'string');return feedback;
}
function lureFixture(){const s=fixture();s.edges=[[0,1],[0,2],[1,2]];s.rooms[1].enemy=enemy(1);s.rooms[1].terrain='stone';s.rooms[2].terrain='stone';return s;}

test('lure credit requires real pursuit, an empty original room, and an actual visit',()=>{
 const s=lureFixture(),j=createTutorialJournal(s);
 perform(s,j,{type:'lure',id:2});assert.equal(j.bypasses.length,0);assert.equal(j.lures[0].displacements.length,0);
 const feedback=perform(s,j,{type:'end'});assert.deepEqual(s.pursuits,[{from:1,to:2}]);assert.match(feedback,/원래 방이 비었/);
 assert.equal(j.bypasses.length,0,'an opened route alone is not a traversed route');
 const entered=perform(s,j,{type:'move',id:1});assert.match(entered,/적 없이 통과/);assert.equal(j.bypasses.length,1);
 assert.equal(j.lures[0].displacements.length,1,'stale pursuits on a move are not recorded again');
 const recap=tutorialRecap(freeze(clone(s)),freeze(clone(j)));assert.match(recap.highlights[0].text,/적 없이 통과/);
});

test('later sound, even at the same target, and reoccupation prevent false lure attribution',()=>{
 const overwritten=lureFixture(),first=createTutorialJournal(overwritten);
 perform(overwritten,first,{type:'lure',id:2});perform(overwritten,first,{type:'mode',id:'rush'});perform(overwritten,first,{type:'move',id:2});perform(overwritten,first,{type:'end'});
 assert.ok(overwritten.pursuits.length);assert.equal(first.lures[0].displacements.length,0,'running produced a newer signal at the same destination');
 const s=lureFixture(),j=createTutorialJournal(s);
 perform(s,j,{type:'lure',id:2});perform(s,j,{type:'end'});
 perform(s,j,{type:'lure',id:1});perform(s,j,{type:'end'});assert.ok(s.rooms[1].enemy?.hp>0);
 perform(s,j,{type:'move',id:1});perform(s,j,{type:'attack'});perform(s,j,{type:'skipReward'});
 perform(s,j,{type:'move',id:0});perform(s,j,{type:'move',id:1});
 assert.equal(j.bypasses.length,0,'a guard killed after returning does not turn into an earlier lure bypass');
});

test('a pursuit immediately replaced by another guard never describes the source room as empty',()=>{
 const s=fixture();s.edges=[[0,2],[2,1],[1,3]];
 for(const id of [0,1,2,3])s.rooms[id].terrain='stone';
 s.rooms[1].enemy={...enemy(1),name:'앞 파수병'};s.rooms[3].enemy={...enemy(3),name:'뒤 파수병',awareness:1};
 const j=createTutorialJournal(s);perform(s,j,{type:'lure',id:2});perform(s,j,{type:'end'});
 assert.deepEqual(s.pursuits,[{from:1,to:2},{from:3,to:1}]);assert.equal(j.lures[0].displacements[0].clear,false);
 assert.equal(j.vacancies.some(v=>v.room===1),false);assert.match(tutorialRecap(s,j).highlights[0].text,/원래 방에는 다른 적/);
});

test('purchase records the old market slot; actual draw and same-turn damage stay distinct',()=>{
 const s=fixture();s.market[0]='spark';s.deck=['focus','guard','step','slash','spark'];s.rooms[1].enemy={...enemy(1,5),name:'유물 수호자'};s.edges=[[0,1]];
 const j=createTutorialJournal(s),buy=perform(s,j,{type:'buy',index:0});assert.match(buy,/불씨 화살.*주머니 순환/);assert.equal(j.purchases[0].id,'spark');
 assert.match(tutorialRecap(s,j).highlights[1].text,/추출된 기록은 아직 없/);
 const drawn=perform(s,j,{type:'end'});assert.match(drawn,/불씨 화살 추출 · 공격 \+3 합산/);
 perform(s,j,{type:'move',id:1});perform(s,j,{type:'attack'});
 assert.equal(j.combats[0].damage,5);assert.deepEqual(j.combats[0].bought,['spark']);
 const text=tutorialRecap(s,j).highlights[1].text;
 assert.match(text,/공격 \+3 합산/);assert.match(text,/같은 턴 유물 수호자에게 5 피해/);
 assert.doesNotMatch(text,/화살로 5|화살이 5|구매한 한/,'engine identifies card types, not individual purchased copies');
});

test('recap prefers a later matching draw with combat over an earlier draw without combat',()=>{
 const s=fixture();s.market[0]='spark';s.deck=['focus','guard','step','slash','spark'];s.rooms[1].enemy={...enemy(1,8),name:'유물 수호자'};s.edges=[[0,1]];
 const j=createTutorialJournal(s);perform(s,j,{type:'buy',index:0});perform(s,j,{type:'end'});
 for(let tries=0;tries<8;tries++){
  perform(s,j,{type:'end'});
  if(s.played.includes('spark')&&s.resource.move>=1)break;
 }
 assert.ok(s.played.includes('spark'));assert.ok(s.turn>j.draws[0].turn);
 perform(s,j,{type:'move',id:1});perform(s,j,{type:'attack'});
 assert.match(tutorialRecap(s,j).highlights[1].text,/같은 턴 유물 수호자에게/);
 const dead=fixture();dead.hp=1;dead.rooms[0].enemy=enemy(0,3,2);dead.market[0]='spark';dead.attack={hit:true,taken:3,beforeHp:10,afterHp:7,blocked:0,pos:0,start:0,path:[0]};
 const stopped=createTutorialJournal(dead);perform(dead,stopped,{type:'buy',index:0});perform(dead,stopped,{type:'end'});
 assert.equal(dead.phase,'lost');assert.equal(stopped.draws.length,0);assert.equal(stopped.breaths.length,0);assert.equal(stopped.damageTaken,1);
});

test('damage survives same-turn healing; a fully blocked breath is a hit, not an avoidance',()=>{
 for(const [guardDamage,block,breath,expectedDamage,expectedHp]of [[2,0,false,2,11],[0,0,true,3,10],[2,1,true,4,9],[0,9,true,0,13]]){
  const s=fixture();s.hp=10;s.resource.block=block;s.deck=['step','focus','guard','slash','potion'];
  if(guardDamage)s.rooms[0].enemy=enemy(0,3,guardDamage);
  if(breath){s.noise=8;s.echo[0]=3;}
  const j=createTutorialJournal(s);perform(s,j,{type:'end'});
  assert.equal(s.hp,expectedHp);assert.equal(j.damageTaken,expectedDamage);assert.equal(j.healed,3);
  if(breath){assert.equal(j.breaths.length,1);assert.equal(j.breaths[0].hit,true);assert.match(tutorialRecap(s,j).subtitle,/비껴감 0 · 도달 1/);}
 }
 const s=fixture();s.noise=8;s.echo[3]=3;const j=createTutorialJournal(s);perform(s,j,{type:'end'});
 assert.equal(j.breaths[0].hit,false);assert.match(tutorialRecap(s,j).subtitle,/비껴감 1 · 도달 0/);
});

function branchFixture(){
 const s=fixture();s.hp=12;s.edges=[[0,1],[0,2],[1,3],[2,3]];
 Object.assign(s.rooms[1],{name:'선택 보물고',type:'chest',terrain:'shards',lessonOptional:true,lessonReturn:'short'});
 Object.assign(s.rooms[2],{name:'이끼 쉼터',type:'camp',terrain:'moss',lessonOptional:true,lessonReturn:'quiet'});
 Object.assign(s.rooms[3],{name:'봉인실',type:'relic',terrain:'stone',relic:{name:'첫 불씨',value:18,icon:'crystal'}});return s;
}
function finishBranch(s,j,branch,{use=true,mixed=false}={}){
 perform(s,j,{type:'move',id:branch});if(use)perform(s,j,{type:'interact'});
 perform(s,j,{type:'move',id:3});perform(s,j,{type:'interact'});
 perform(s,j,{type:'move',id:branch});
 if(mixed){perform(s,j,{type:'move',id:3});perform(s,j,{type:'move',id:branch===1?2:1});}
 perform(s,j,{type:'move',id:0});perform(s,j,{type:'interact'});assert.equal(s.phase,'won');return tutorialRecap(s,j);
}

test('real short/quiet routes, optional chest, camp and changed return plans make different recaps',()=>{
 const safe=branchFixture(),safeJournal=createTutorialJournal(safe),safeRecap=finishBranch(safe,safeJournal,2);
 const risk=branchFixture(),riskJournal=createTutorialJournal(risk),riskRecap=finishBranch(risk,riskJournal,1);
 const skip=branchFixture(),skipJournal=createTutorialJournal(skip),skipRecap=finishBranch(skip,skipJournal,1,{use:false});
 assert.match(safeRecap.highlights[2].text,/조용한 귀환길.*체력 \+6/);
 assert.match(riskRecap.highlights[2].text,/짧은 귀환길.*금화 \+[567]/);
 assert.match(skipRecap.highlights[2].text,/상자는 열지 않음/);
 assert.notDeepEqual(safeRecap,riskRecap);assert.notDeepEqual(skipRecap,riskRecap);
 assert.equal(safeRecap.title,'첫 불씨를 품고 돌아왔어요');
 assert.equal(safeJournal.relicTurn,1);assert.equal(safeJournal.returnEnds,0);assert.equal(safeJournal.escaped.turn,1);
 assert.deepEqual(safeRecap.stats,[{label:'남은 체력',value:`${safe.hp} / ${safe.maxHp}`},{label:'금화',value:String(safe.gold)},{label:'점수',value:String(safe.score)}]);
 const mixed=branchFixture(),mixedJournal=createTutorialJournal(mixed),mixedRecap=finishBranch(mixed,mixedJournal,1,{mixed:true});
 assert.match(mixedRecap.highlights[2].title,/길을 바꾼/);assert.match(mixedRecap.highlights[2].text,/짧은 귀환길.*조용한 귀환길.*모두 방문/);assert.match(mixedRecap.talk[0][1],/길을 바꿨/);
});

test('checkpoint restoration discards abandoned actions but preserves an explicit retry count',()=>{
 let s=branchFixture(),j=createTutorialJournal(s);const checkpoint=clone({state:s,journal:j});
 perform(s,j,{type:'move',id:1});perform(s,j,{type:'interact'});assert.ok(s.gold>0);
 s=clone(checkpoint.state);j=clone(checkpoint.journal);j.retryCount=1;
 const recap=finishBranch(s,j,2);
 assert.equal(j.interactions.some(e=>e.room.id===1),false);assert.equal(s.gold,0);assert.match(recap.subtitle,/다시 도전 1회/);assert.match(recap.talk[0][1],/다시 1번 도전/);
 const snapshot=JSON.stringify(j);tutorialRecap(freeze(clone(s)),freeze(j));assert.equal(JSON.stringify(j),snapshot);
 const introState=fixture(),intro=tutorialRecap(introState,createTutorialJournal(introState));
 assert.equal(intro.title,'지금까지의 선택');assert.equal(intro.stats[2].value,'—');assert.match(intro.highlights[0].text,/기록이 없/);assert.doesNotMatch(JSON.stringify(intro),/5 피해|적 없이 통과했|탈출 T/);
 assert.equal(recap.stats.length,3);assert.equal(recap.highlights.length,3);assert.equal(recap.talk.length,2);
});
