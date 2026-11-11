const GROUPS=[[1,4],[2,3,6],[8,9,10,11,12,14,15],[16,18]];
export const site=(s,id)=>s.worldVersion===1?s.worldSites[id]:id;
export const semantic=(s,id)=>s.worldVersion===1?s.rooms[id].site:id;
const edgeKey=(a,b)=>[a,b].sort((x,y)=>x-y).join(':');
export function isCollapsed(s,a,b){return s.blockedEdges?.some(([x,y])=>edgeKey(x,y)===edgeKey(a,b))||false;}
export function configureWorld(s){
 let x=(s.seed^0x93a4dc51)>>>0;const rand=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};
 const sites=Array.from({length:20},(_,i)=>i);
 for(const ids of GROUPS){const shuffled=[...ids];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}ids.forEach((id,i)=>sites[id]=shuffled[i]);}
 s.worldVersion=1;s.worldSites=sites;s.blockedEdges=[];s.collapseSaved=false;
 const rooms=s.rooms.map(r=>structuredClone(r));
 for(const r of rooms){const to=sites[r.id];s.rooms[to]={...r,id:to,row:Math.floor(to/4),col:to%4,site:r.id,seen:false,visited:false};if(s.rooms[to].enemy)s.rooms[to].enemy.home=to;}
 s.edges=s.edges.map(([a,b])=>[sites[a],sites[b]]);
 // The quiet middle route bypasses the optional soldier; both paths remain available.
 s.edges.push([site(s,2),7]);
 // Optional loops vary actual topology; no mandatory room or return route relies on them.
 for(const [a,b]of [[1,4],[6,3],[8,10],[12,14],[9,15]])if(rand()<.55)s.edges.push([site(s,a),site(s,b)]);
 s.fragileEdge=[site(s,10),site(s,9)];
 const lower=[8,9,11,12,14,15];const offset=Math.floor(rand()*lower.length);
 s.rooms[site(s,lower[offset])].biome='resonant';s.rooms[site(s,lower[(offset+2)%lower.length])].biome='absorb';s.rooms[site(s,10)].biome='fragile';
 for(const id of [1,2,6,8,9,11,12,14,15,16]){const r=s.rooms[site(s,id)];if(![2,9].includes(id))r.terrain=['stone','water','shards','moss'][Math.floor(rand()*4)];}
 s.rooms[site(s,2)].terrain='moss';s.rooms[site(s,16)].terrain='moss';s.rooms[0].visited=true;for(const id of [0,1,4])s.rooms[site(s,id)].seen=true;
 s.worldPaths={quick:[0,site(s,1),5,site(s,6),7,site(s,11),site(s,15),site(s,14),13,17,site(s,18),19],quiet:[0,site(s,1),5,site(s,6),site(s,2),7,site(s,11),site(s,15),site(s,14),13,17,site(s,16),19]};
}
export function worldValid(s){
 if(s.worldVersion!==1||!Array.isArray(s.worldSites)||s.worldSites.length!==20||new Set(s.worldSites).size!==20||!s.worldSites.every(n=>Number.isInteger(n)&&n>=0&&n<20))return false;
 if([0,5,7,13,17,19].some(id=>s.worldSites[id]!==id))return false;
 if(!GROUPS.every(ids=>ids.every(id=>ids.includes(s.worldSites[id]))))return false;
 if(!s.rooms.every((r,id)=>r.site===s.worldSites.indexOf(id)&&[undefined,'resonant','absorb','fragile'].includes(r.biome)))return false;
 if(!Array.isArray(s.fragileEdge)||s.fragileEdge.join(':')!==[site(s,10),site(s,9)].join(':')||typeof s.collapseSaved!=='boolean')return false;
 if(!Array.isArray(s.blockedEdges)||s.blockedEdges.length>1||!s.blockedEdges.every(e=>Array.isArray(e)&&e.length===2&&edgeKey(...e)===edgeKey(...s.fragileEdge)))return false;
 if(!s.worldPaths||!['quick','quiet'].every(key=>Array.isArray(s.worldPaths[key])&&s.worldPaths[key].every(id=>Number.isInteger(id)&&id>=0&&id<20)))return false;
 return true;
}
export function structuralRoutes(s){
 // Capability check: keys, preparation, sluice and either seal can all be earned.
 // An open conduit supplies the final quiet edge; this does not predict combat victory.
 const edges=[...s.edges,[site(s,16),19]].filter(([a,b])=>!isCollapsed(s,a,b)),q=[0],seen=new Set(q);
 while(q.length){const id=q.shift();for(const [a,b]of edges){const n=a===id?b:b===id?a:-1;if(n>=0&&!seen.has(n)){seen.add(n);q.push(n);}}}
 return {all:seen.size===20,deep:seen.has(19),return:seen.has(19)&&seen.has(0)};
}
export function worldSignature(s){return JSON.stringify({sites:s.worldSites,edges:s.edges.map(e=>[...e].sort((a,b)=>a-b)).sort(),rooms:s.rooms.map(r=>[r.terrain,r.biome,r.enemy?.kind])});}
