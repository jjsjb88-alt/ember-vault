// 기준선 측정: 은밀·유인·교역 없이 걷기만 하는 봇. 실행: node docs/plan/tools/naive-bot.mjs
import {newRun,apply,CARDS,moveCost,validSave} from '../../../dist/engine.js';
import {STAGES,checkpointIndex} from '../../../dist/expedition-stages.js';
const act=(s,a)=>apply(s,a);
function run(seed,role,snap){
 const s=newRun({seed,role,layout:'staged',risk:false});let path=[1,5,6,7,11,15,14,13,17,18,19],index=0,returning=false,actions=0,attacks=0,hits=0,minHp=s.hp,stuck=0;
 while(s.phase==='playing'&&actions++<400){
  minHp=Math.min(minHp,s.hp);
  if(s.attack&&s.attack._c!==1){s.attack._c=1;attacks++;if(s.attack.hit)hits++;}
  if(s.pending){act(s,{type:'skipReward'});continue;}
  const room=s.rooms[s.pos];
  
  
  if(s.hp<=s.maxHp-6&&s.provisions>0&&s.provisionTurn!==s.turn){if(act(s,{type:'provision'}).ok)continue;}
  if(room.enemy?.hp>0){act(s,{type:s.resource.sword?'attack':'end'});continue;}
  if(room.type==='checkpoint'){const camp=checkpointIndex(s);if(s.stagePrepared[camp]===null){act(s,{type:'prepare',choice:'recruit',id:STAGES[camp].offers[0]});continue;}}
  if(room.type==='chest'&&!room.used){if(act(s,{type:'interact'}).ok)continue;}
  if(s.pos===17&&!room.used&&s.resource.skill>=3){if(act(s,{type:'interact'}).ok)continue;}
  if(s.pos===19&&!returning){if(act(s,{type:'interact'}).ok){returning=true;path=s.rooms[17].used?[18,17,5,1,0]:[15,11,7,6,5,1,0];index=0;continue;}}
  if(s.pos===0&&returning){act(s,{type:'interact'});continue;}
  const to=path[index],mode='walk';
  if(s.mode!==mode)act(s,{type:'mode',id:mode});
  const r=s.resource.move>=moveCost(s,to,mode)?act(s,{type:'move',id:to}):{ok:false};
  if(r.ok){index++;stuck=0;}else{act(s,{type:'end'});if(++stuck>12)break;}
 }
 return {phase:s.phase,turn:s.turn,hp:s.hp,minHp,attacks,hits,noiseMade:s.noiseMade,score:s.score,reason:s.reason,pos:s.pos};
}
const out={};
for(const role of ['rogue','knight','mage']){const rs=[];for(let seed=1;seed<=60;seed++)rs.push(run(seed,role));
 const w=rs.filter(r=>r.phase==='won');const avg=(a,f)=>(a.reduce((x,y)=>x+f(y),0)/Math.max(1,a.length)).toFixed(1);
 out[role]={wins:w.length+'/60',turns:avg(w,r=>r.turn),hpLeft:avg(w,r=>r.hp),minHp:avg(rs,r=>r.minHp),breaths:avg(rs,r=>r.attacks),breathHits:avg(rs,r=>r.hits),score:avg(w,r=>r.score),other:[...new Set(rs.filter(r=>r.phase!=='won').map(r=>r.phase+':'+(r.reason||'stuck@'+r.pos)))].slice(0,3)};}
console.log(JSON.stringify(out,null,1));
