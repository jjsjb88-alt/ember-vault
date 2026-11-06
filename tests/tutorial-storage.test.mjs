import test from 'node:test';
import assert from 'node:assert/strict';
import {apply,moveStatus,newRun} from '../dist/engine.js';
import {createTutorialRun,TUTORIAL_STEPS,tutorialAllows,tutorialAdvance} from '../dist/tutorial.js';
import {createTutorialJournal,recordTutorialAction,tutorialRecap} from '../dist/tutorial-journal.js';
import {TUTORIAL_SAVE_KEY,validTutorialProgress,saveTutorialProgress,loadTutorialProgress,clearTutorialProgress} from '../dist/tutorial-storage.js';

function memory(){
 const map=new Map();
 return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
}
function practice({reload=true}={}){
 const storage=memory(),main=JSON.stringify(newRun({seed:741,role:'mage'}));
 storage.setItem('ember-vault-save-v2',main);storage.setItem('ember-vault-best-v1','123');
 const state=createTutorialRun();let p={state,index:0,journal:createTutorialJournal(state),checkpoint:null,feedback:'',mapOpen:false,paused:false};
 const key=()=>TUTORIAL_STEPS[p.index]?.key;
 const persist=()=>{
  assert.ok(validTutorialProgress(p),`valid ${key()||'complete'} snapshot`);
  const before=JSON.stringify(p);assert.deepEqual(saveTutorialProgress(storage,{...p,saved:JSON.parse(main)}),{ok:true});assert.equal(JSON.stringify(p),before);
  const loaded=loadTutorialProgress(storage);assert.equal(loaded.status,'loaded');assert.deepEqual(loaded.progress,p);
  assert.equal(storage.getItem('ember-vault-save-v2'),main);assert.equal(storage.getItem('ember-vault-best-v1'),'123');
  assert.equal(storage.getItem('ember-vault-tutorial-v1'),null);assert.equal(JSON.parse(storage.getItem(TUTORIAL_SAVE_KEY)).progress.saved,undefined);
  if(reload)p=loaded.progress;
  return p;
 };
 const step=action=>{
  const beforeIndex=p.index,before=structuredClone(p.state);
  assert.ok(tutorialAllows(p.index,action,p.state),`${key()}: ${JSON.stringify(action)}`);
  if(!['panel','tutorialContinue'].includes(action.type)){
   const result=apply(p.state,action);assert.ok(result.ok,result.message);p.feedback=recordTutorialAction(p.journal,before,action,p.state)||result.message;
  }
  if(action.type==='panel')p.mapOpen=true;
  if(action.type==='tutorialContinue')p.mapOpen=false;
  p.index=tutorialAdvance(p.index,action,p.state);
  if(beforeIndex!==p.index&&TUTORIAL_STEPS[p.index]?.checkpoint)p.checkpoint=JSON.stringify({state:p.state,index:p.index,journal:p.journal});
  return persist();
 };
 const observe=()=>{const was=p.index;step({type:'panel',id:'sound'});assert.equal(p.index,was);assert.equal(p.mapOpen,true);step({type:'tutorialContinue',id:key()});};
 const move=id=>{let turns=0;while(!moveStatus(p.state,id).allowed){assert.ok(++turns<8);step({type:'end'});}step({type:'move',id});};
 const recruit=()=>{
  step({type:'move',id:1});step({type:'interact'});observe();
  step({type:'hide'});step({type:'lure',id:5});step({type:'end'});
  for(const id of [2,6,7])move(id);
  step({type:'buy',index:0});step({type:'end'});assert.equal(key(),'approach');
 };
 const recover=()=>{
  recruit();move(11);step({type:'interact'});move(10);step({type:'attack'});
  assert.equal(key(),'reward');assert.equal(p.state.pending.type,'reward');
  step({type:'reward',id:p.state.pending.options[1]});step({type:'interact'});assert.equal(key(),'forecast');observe();
 };
 const escape=()=>{
  step({type:'hide'});move(11);move(7);step({type:'end'});
  for(const id of [3,2,1,0])move(id);
  step({type:'interact'});assert.equal(p.state.phase,'won');assert.equal(p.index,TUTORIAL_STEPS.length);
 };
 persist();return {storage,main,persist,step,observe,move,recruit,recover,escape,key,get p(){return p;},set p(value){p=value;}};
}

test('first-time practice survives reload after every committed action, including map observation, pending reward and final recap',()=>{
 const run=practice();run.recover();assert.equal(run.key(),'escape');assert.equal(run.p.state.countdown,14);
 const checkpoint=JSON.parse(run.p.checkpoint);assert.equal(TUTORIAL_STEPS[checkpoint.index].key,'approach');assert.equal(checkpoint.state.resource.sword,5);
 run.escape();assert.ok(run.p.journal.escaped);assert.equal(tutorialRecap(run.p.state,run.p.journal).stats[2].value,String(run.p.state.score));
 assert.equal(clearTutorialProgress(run.storage),true);assert.equal(loadTutorialProgress(run.storage).status,'missing');
 assert.equal(run.storage.getItem('ember-vault-save-v2'),run.main);assert.equal(run.storage.getItem('ember-vault-best-v1'),'123');
});

test('actual collapse restores its failure and checkpoint, then retry restores journal and can finish',()=>{
 const run=practice();run.recover();run.step({type:'hide'});run.move(11);run.move(7);
 for(let i=0;i<14&&run.p.state.phase==='playing';i++)run.step({type:'end'});
 assert.equal(run.p.state.phase,'lost');assert.equal(run.p.state.countdown,0);
 assert.equal(loadTutorialProgress(run.storage).progress.state.phase,'lost');
 const abandoned=run.p.journal.actionCount,cp=JSON.parse(run.p.checkpoint);
 run.p={...run.p,...cp,journal:{...cp.journal,retryCount:1},feedback:'다시 시작',mapOpen:false};run.persist();
 assert.ok(run.p.journal.actionCount<abandoned);assert.equal(run.p.journal.retryCount,1);assert.equal(run.p.state.resource.sword,5);
 run.move(11);run.move(10);run.step({type:'attack'});run.step({type:'skipReward'});run.step({type:'interact'});run.observe();run.escape();
 assert.match(tutorialRecap(run.p.state,run.p.journal).subtitle,/다시 도전 1회/);
});

test('an arriving patrol and its reward resume inside the unfinished relic objective',()=>{
 const run=practice();run.recruit();run.move(11);run.move(10);run.step({type:'attack'});run.step({type:'skipReward'});
 assert.equal(run.key(),'relic');run.step({type:'end'});run.step({type:'end'});
 assert.equal(run.p.state.rooms[10].enemy.home,6);assert.equal(run.key(),'relic');
 run.step({type:'attack'});assert.equal(run.p.state.pending.type,'reward');assert.equal(run.key(),'relic');
 assert.equal(loadTutorialProgress(run.storage).progress.index,run.p.index);
 run.step({type:'reward',id:run.p.state.pending.options[0]});run.step({type:'interact'});
 assert.equal(run.key(),'forecast');assert.equal(run.p.state.relic.name,'첫 불씨');
});

test('explicit pause is round-tripped separately from the original save and defaults to active when omitted',()=>{
 const run=practice();run.recruit();run.p.paused=true;run.p.mapOpen=true;run.persist();
 assert.equal(loadTutorialProgress(run.storage).progress.paused,true);
 delete run.p.paused;assert.deepEqual(saveTutorialProgress(run.storage,run.p),{ok:true});
 assert.equal(loadTutorialProgress(run.storage).progress.paused,false);assert.equal(loadTutorialProgress(run.storage).progress.mapOpen,true);
});

test('bad phase/index, nested engine data, journal references and checkpoints cannot be resumed',()=>{
 const run=practice();run.recover();const base=structuredClone(run.p);
 const cases=[
  p=>{p.index=0;},p=>{p.state.edges=[];},p=>{p.index=TUTORIAL_STEPS.length;},p=>{p.index=2.5;},
  p=>{p.state.pending={type:'purge',options:['step']};},p=>{p.state.rooms[1].type='broken';},p=>{p.state.rooms[1].type='camp';},
  p=>{delete p.state.rooms[10].relic;},p=>{p.state.deck.push('constructor');},p=>{p.state.mode='constructor';},p=>{p.state.rooms[2].terrain='constructor';},p=>{p.state.rooms[6].enemy.damage='one';},
  p=>{p.state.lastSound.field=null;},p=>{p.state.poolTotal=null;},p=>{p.state.log=[{}];},
  p=>{p.journal.draws[0].played=null;},p=>{p.journal.lures[0].displacements=null;},
  p=>{p.journal.bypasses[0].lure=999;},p=>{p.journal.signals.bad=999;},
  p=>{p.journal.combats[0].bought=['unknown'];},p=>{p.journal.relicTurn=null;},
  p=>{p.journal.escaped={turn:3,hp:22,gold:10,score:90};},p=>{p.checkpoint=null;},
  p=>{p.checkpoint='{';},p=>{const cp=JSON.parse(p.checkpoint);cp.index=0;p.checkpoint=JSON.stringify(cp);},
  p=>{p.paused='yes';},p=>{p.mapOpen=1;}
 ];
 for(const mutate of cases){
  const candidate=structuredClone(base);mutate(candidate);assert.equal(validTutorialProgress(candidate),false);
  const previous=run.storage.getItem(TUTORIAL_SAVE_KEY);assert.deepEqual(saveTutorialProgress(run.storage,candidate),{ok:false,reason:'invalid'});
  assert.equal(run.storage.getItem(TUTORIAL_SAVE_KEY),previous,'invalid attempted save must preserve a previous valid checkpoint');
  const envelope=JSON.parse(previous);envelope.progress=candidate;run.storage.setItem(TUTORIAL_SAVE_KEY,JSON.stringify(envelope));
  assert.equal(loadTutorialProgress(run.storage).status,'invalid');assert.equal(run.storage.getItem(TUTORIAL_SAVE_KEY),null);
  run.storage.setItem(TUTORIAL_SAVE_KEY,previous);
 }
 assert.equal(run.storage.getItem('ember-vault-save-v2'),run.main);
});

test('malformed, oversized and incompatible records are discarded without touching other keys',()=>{
 const run=practice(),good=run.storage.getItem(TUTORIAL_SAVE_KEY);
 const incompatible=JSON.parse(good);incompatible.version++;
 const wrongScenario=JSON.parse(good);wrongScenario.scenario='different lesson';
 const wrongSteps=JSON.parse(good);wrongSteps.steps='other';
 const wrongKey=JSON.parse(good);wrongKey.step='escape';
 for(const raw of ['{','null','[]','x'.repeat(2_000_001),...Object.values({incompatible,wrongScenario,wrongSteps,wrongKey}).map(JSON.stringify)]){
  run.storage.setItem(TUTORIAL_SAVE_KEY,raw);assert.deepEqual(loadTutorialProgress(run.storage),{status:'invalid',progress:null});assert.equal(run.storage.getItem(TUTORIAL_SAVE_KEY),null);
  assert.equal(run.storage.getItem('ember-vault-save-v2'),run.main);assert.equal(run.storage.getItem('ember-vault-best-v1'),'123');
 }
});

test('storage denial and quota failures return status instead of interrupting the game',()=>{
 const run=practice(),denied={getItem(){throw Error('blocked');},setItem(){throw Error('quota');},removeItem(){throw Error('blocked');}};
 assert.deepEqual(loadTutorialProgress(denied),{status:'unavailable',progress:null});
 assert.deepEqual(saveTutorialProgress(denied,run.p),{ok:false,reason:'unavailable'});assert.equal(clearTutorialProgress(denied),false);
 assert.deepEqual(loadTutorialProgress(undefined),{status:'unavailable',progress:null});
 assert.deepEqual(saveTutorialProgress(undefined,run.p),{ok:false,reason:'unavailable'});
 const corruptButCannotRemove={getItem(){return '{';},removeItem(){throw Error('blocked');}};
 assert.deepEqual(loadTutorialProgress(corruptButCannotRemove),{status:'invalid',progress:null});
});
