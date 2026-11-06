// V9.2: map observations are acknowledged explicitly; V9.1 evidence remains unchanged.
import {apply,moveStatus} from '../../../dist/engine.js';
import {createTutorialRun,TUTORIAL_STEPS,tutorialAllows,tutorialAdvance} from '../../../dist/tutorial.js';
let won=0,lost=0,checks=0,firstLure=0,firstDraw=0;
const failures=[];
const prefix=[{type:'move',id:1},{type:'interact'},{type:'panel',id:'sound'},{type:'tutorialContinue',id:'sound'},{type:'hide'},{type:'lure',id:5},{type:'end'},{type:'move',id:2},{type:'move',id:6},{type:'move',id:7},{type:'buy',index:0},{type:'end'}];
function run(opts){
 const s=createTutorialRun();let index=0,count=0;
 const key=()=>TUTORIAL_STEPS[index]?.key;
 const step=a=>{
  if(s.phase!=='playing')throw new Error('expected-death');
  if(count++>200)throw new Error('loop');
  if(!tutorialAllows(index,a,s))throw new Error('DENIED '+key()+' '+JSON.stringify(a));
  if(!['panel','tutorialContinue'].includes(a.type)){const result=apply(s,a);if(!result.ok)throw new Error('INVALID '+key()+' '+JSON.stringify(a)+' '+result.message);}
  index=tutorialAdvance(index,a,s);
 };
 const reward=()=>{if(s.pending)step(opts.reward==='skip'?{type:'skipReward'}:{type:'reward',id:s.pending.options[opts.reward%s.pending.options.length]});};
 const fight=()=>{let n=0;while(s.rooms[s.pos].enemy?.hp>0){if(n++>30)throw new Error('fight-loop');if(s.resource.sword)step({type:'attack'});else step({type:'end'});reward();}};
 const move=id=>{fight();reward();let n=0;while(!moveStatus(s,id).allowed){if(n++>10)throw new Error('move-loop');step({type:'end'});fight();reward();}step({type:'move',id});};
 const wait=stage=>{
  for(let i=0;i<(opts.waits[stage]||0);i++){
   reward();
   if(opts.hide&&tutorialAllows(index,{type:'hide'},s)){const copy=structuredClone(s);if(apply(copy,{type:'hide'}).ok)step({type:'hide'});}
   step({type:'end'});
  }
  if(s.phase!=='playing')throw new Error('expected-death');
 };
 try{
  for(let i=0;i<prefix.length;i++){
   step(prefix[i]);
   if(TUTORIAL_STEPS[index-1]?.key==='wait-lure'&&prefix[i].type==='end'){if(s.hp!==22||s.rooms[6].enemy||s.rooms[5].enemy?.home!==6)throw new Error('lure-regression');firstLure++;}
  }
  if(s.resource.sword!==5||!s.played.includes('spark')||!s.played.includes('slash'))throw new Error('draw-regression');firstDraw++;
  wait('approach');if(s.resource.sword!==5)throw new Error('lost-attack-5-before-first-fight');
  step({type:'mode',id:opts.mode});move(11);
  if(opts.chest)step({type:'interact'});wait('guardian');move(10);wait('attack');fight();reward();
  if(key()!=='relic')throw new Error('wrong-relic-stage:'+key());
  wait('relic');fight();reward();step({type:'interact'});
  if(key()!=='forecast'||!s.relic)throw new Error('false-relic-progress');
  step({type:'panel',id:'sound'});
  if(key()!=='forecast')throw new Error('map-open-skipped-observation');
  step({type:'tutorialContinue',id:'forecast'});wait('escape');
  for(const id of opts.route==='quiet'?[11,7,3,2,1,0]:[6,2,1,0])move(id);
  fight();reward();step({type:'interact'});
  if(s.phase!=='won'||index!==TUTORIAL_STEPS.length)throw new Error('not-complete');won++;
 }catch(error){
  if(s.phase==='lost')lost++;
  else failures.push({opts,key:key(),pos:s.pos,enemy:s.rooms[s.pos].enemy?.name,pending:s.pending?.type,error:error.message});
 }
 checks++;
}
for(const stage of ['approach','guardian','attack','relic','escape'])
 for(const turns of [0,1,2,4,8])
  for(const mode of ['walk','sneak','rush'])
   for(const route of ['quiet','short'])
    for(const reward of [0,1,2,'skip'])
     for(const chest of [false,true])
      run({waits:{[stage]:turns},mode,route,reward,chest,hide:turns%2===0});
for(const mode of ['walk','sneak','rush'])
 for(const route of ['quiet','short'])
  for(const reward of [0,1,2,'skip'])
   run({waits:{approach:2,guardian:2,attack:2,relic:2,escape:2},mode,route,reward,chest:true,hide:true});
console.log(JSON.stringify({version:'9.2',checks,won,expectedLosses:lost,firstLure,firstDraw,unexpectedFailures:failures.length,examples:failures.slice(0,5)},null,2));
if(failures.length||won!==1224)process.exitCode=1;
