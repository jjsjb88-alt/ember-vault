// Fixed map-aware policy; no seed-specific branches, future draw inspection or resource injection.
import {runBot,summarize} from './risk-bots.mjs';
const offset=process.argv.includes('--holdout')?1000:0,out={};
for(const role of ['rogue','knight','mage'])out[role]=summarize(Array.from({length:60},(_,i)=>runBot(offset+i+1,role,true,{risk:true,noiseControl:!process.argv.includes('--ablation')})));
console.log(JSON.stringify(out,null,2));
