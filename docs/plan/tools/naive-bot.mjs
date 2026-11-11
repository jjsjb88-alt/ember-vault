// Current walking-only policy. Frozen PR baseline: node docs/plan/tools/baseline-v101.mjs.
import {runBot,summarize} from './risk-bots.mjs';
const out={};for(const role of ['rogue','knight','mage'])out[role]=summarize(Array.from({length:60},(_,i)=>runBot(i+1,role,false,{risk:!process.argv.includes('--legacy')})));
console.log(JSON.stringify(out,null,2));
