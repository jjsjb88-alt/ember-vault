import {EXTRA_CARDS,AXES} from './content/memories.js?v=20261112a';
import {KEEPSAKES} from './content/keepsakes.js?v=20261112a';
export const PROFILE_KEY='ember-vault-profile-v1';
export function freshProfile(){return {version:1,runs:0,wins:0,embers:0,heat:0,maxHeat:0,settled:[],endings:[],history:[]};}
export function validProfile(p){return !!(p&&p.version===1&&['runs','wins','embers','heat','maxHeat'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0)&&p.wins<=p.runs&&p.heat<=p.maxHeat&&p.maxHeat<=10&&Array.isArray(p.settled)&&p.settled.length<=10000&&new Set(p.settled).size===p.settled.length&&p.settled.every(v=>typeof v==='string'&&v.length>0&&v.length<=100)&&Array.isArray(p.endings)&&p.endings.every(e=>['seal','remember'].includes(e))&&Array.isArray(p.history)&&p.history.length<=30&&p.history.every(e=>e&&typeof e.id==='string'&&typeof e.won==='boolean'&&Number.isSafeInteger(e.turn)&&e.turn>0&&['rogue','knight','mage','warden','cantor'].includes(e.role)&&Number.isInteger(e.heat)&&e.heat>=0&&e.heat<=10&&[null,'seal','remember'].includes(e.ending)&&Number.isFinite(e.score)&&e.score>=0));}
export function loadProfile(storage){try{const p=JSON.parse(storage.getItem(PROFILE_KEY));return validProfile(p)?p:freshProfile();}catch{return freshProfile();}}
export function unlocks(p){
 const byAxis=AXES.map(axis=>Object.keys(EXTRA_CARDS).filter(id=>EXTRA_CARDS[id].axis===axis));
 const extra=Array.from({length:6},(_,i)=>byAxis.map(ids=>ids[i])).flat(),artifacts=Object.keys(KEEPSAKES);
 return {cards:extra.slice(0,Math.min(extra.length,6+Math.floor(p.runs/5)*5)),keepsakes:artifacts.slice(0,Math.min(artifacts.length,5+Math.floor(p.runs/2))),roles:['rogue','knight','mage',...(p.runs>=5?['warden']:[]),...(p.runs>=10?['cantor']:[])]};
}
export function settleProfile(p,s){
 if(s.campaignVersion!==1||!['won','lost'].includes(s.phase)||p.settled.includes(s.runId))return {changed:false,earned:0};
 p.settled.push(s.runId);p.settled=p.settled.slice(-10000);p.runs++;const won=s.phase==='won',earned=won?5+Math.min(5,s.heat):1+Math.min(2,Math.floor(s.rooms[s.pos].stage/2));p.embers+=earned;if(won){p.wins++;p.maxHeat=Math.max(p.maxHeat,Math.min(10,s.heat+1));if(!p.endings.includes(s.ending))p.endings.push(s.ending);}
 p.history.unshift({id:s.runId,won,turn:s.turn,ending:s.ending,heat:s.heat,role:s.role,score:s.score||0});p.history=p.history.slice(0,30);return {changed:true,earned,unlocks:unlocks(p)};
}
export function saveProfile(storage,p){try{storage.setItem(PROFILE_KEY,JSON.stringify(p));return true;}catch{return false;}}
