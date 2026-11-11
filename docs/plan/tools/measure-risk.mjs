import {writeFileSync} from 'node:fs';
import {RISK} from '../../../dist/risk-rules.js';
import {runBot,summarize} from './risk-bots.mjs';
const result={scope:'Fixed map-aware policies; synthetic engine tests, not human difficulty or learning evidence',calibrationSeeds:[1,60],holdoutSeeds:[1001,1060],parameters:RISK,groups:{}};
for(const [name,offset] of [['calibration',0],['holdout',1000]]){
 const group={};
 for(const role of ['rogue','knight','mage']){group[role]={};for(const [policy,quiet,noiseControl] of [['walk',false,true],['quiet',true,true],['ablation',true,false]]){
  const runs=Array.from({length:60},(_,i)=>runBot(offset+i+1,role,quiet,{noiseControl}));group[role][policy]=summarize(runs);if(runs.some(r=>r.phase==='playing'||r.metrics.invalid))throw Error('Unfinished or invalid policy: '+name+role+policy);
 }}result.groups[name]=group;
}
const target=process.argv[2];if(target)writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
