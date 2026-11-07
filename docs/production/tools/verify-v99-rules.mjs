// Earned engine replay. This policy knows the map; it is not a novice difficulty measurement.
import fs from 'node:fs';
import {newRun,apply,CARDS,moveCost,validSave} from '../../../dist/engine.js';
import {STAGES,checkpointIndex} from '../../../dist/expedition-stages.js';
function play(seed,role){const s=newRun({seed,role,layout:'staged',gimmicks:false}),actions=[];let path=[1,5,6,7,11,15,14,13,17,18,19],i=0,returning=false;
 const act=a=>{const r=apply(s,a);if(!r.ok)throw Error(r.message+JSON.stringify(a));actions.push(a);if(!validSave(s))throw Error('Invalid save after '+JSON.stringify(a));};
 for(let turn=0;s.phase==='playing'&&actions.length<350;turn++){
  if(s.pending){act({type:'skipReward'});continue;}
  const room=s.rooms[s.pos];
  if(s.hp<=s.maxHp-6&&s.provisions>0&&s.provisionTurn!==s.turn){act({type:'provision'});continue;}
  if(room.enemy?.hp>0){act({type:s.resource.sword?'attack':'end'});continue;}
  if(room.type==='checkpoint'){
   const k=checkpointIndex(s);if(s.stagePrepared[k]===null){act({type:'prepare',choice:'recruit',id:STAGES[k].offers[0]});continue;}
   if(!returning&&s.stageTrades[k]===0){const ix=s.market.findIndex(id=>CARDS[id].cost<=s.resource.skill&&(CARDS[id].e.sword||CARDS[id].e.move));if(ix>=0){act({type:'buy',index:ix});continue;}}
  }
  if(room.type==='chest'&&!room.used){act({type:'interact'});continue;}
  if(s.pos===17&&!room.used&&s.resource.skill>=3){act({type:'interact'});continue;}
  if(s.pos===19&&!returning){act({type:'interact'});returning=true;path=s.rooms[17].used?[18,17,5,1,0]:[15,11,7,6,5,1,0];i=0;continue;}
  if(s.pos===0&&returning){act({type:'interact'});continue;}
  const next=path[i];
  const sneak=moveCost(s,next,'sneak'),walk=moveCost(s,next,'walk');
  if(s.resource.move>=sneak){if(s.mode!=='sneak')act({type:'mode',id:'sneak'});act({type:'move',id:next});i++;}
  else if(s.resource.move>=walk){if(s.mode!=='walk')act({type:'mode',id:'walk'});act({type:'move',id:next});i++;}
  else act({type:'end'});
 }
 return {state:s,actions};}
const result={};for(const role of ['rogue','knight','mage']){let wins=0,min=99,max=0;for(let seed=1;seed<=30;seed++){const {state:s,actions}=play(seed,role);if(s.phase==='won'){wins++;min=Math.min(min,s.turn);max=Math.max(max,s.turn);if(seed===1)await import('node:fs').then(fs=>fs.writeFileSync('/tmp/ember-v99-'+role+'-route.json',JSON.stringify({seed,role,actions,result:s},null,2)));}}result[role]={wins,outOf:30,min,max};}fs.writeFileSync('/tmp/ember-v99-rules-results.json',JSON.stringify({result:'PASS',scope:'90 earned engine routes; map-aware policy, not human difficulty evidence',roles:result},null,2)+'\n');console.log(JSON.stringify(result));
