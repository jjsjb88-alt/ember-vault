// Explicit modal recovery fixture; not evidence of novice play.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {apply,moveStatus,newRun} from '../../../dist/engine.js';
import {createTutorialRun,TUTORIAL_STEPS,tutorialAllows,tutorialAdvance} from '../../../dist/tutorial.js';
import {createTutorialJournal,recordTutorialAction,tutorialRecap} from '../../../dist/tutorial-journal.js';
import {TUTORIAL_SAVE_KEY,validTutorialProgress,saveTutorialProgress,loadTutorialProgress,clearTutorialProgress} from '../../../dist/tutorial-storage.js';
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

const run=practice();run.recover();run.escape();
const main=JSON.parse(run.main);main.pending={type:'reward',options:['scout','step','spark']};
fs.writeFileSync(process.argv[2]||'/tmp/ember-v96-recovery-fixture.json',JSON.stringify({main,progress:JSON.parse(run.storage.getItem(TUTORIAL_SAVE_KEY))}));
console.log('Built legacy completed-practice + main pending-reward fixture using real engine actions');
