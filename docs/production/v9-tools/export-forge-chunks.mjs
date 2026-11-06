// Export the live game's topology for Agent Sprite Forge's independent room validator.
// This exports QA data only; it does not rewrite game code, saves or assets.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {newRun,apply,neighbours,moveCost} from '../../../dist/engine.js';

const output=process.argv[2];
if(!output)throw new Error('Usage: node export-forge-chunks.mjs <new-output-directory>');
if(fs.existsSync(output))throw new Error('Output directory already exists; keep earlier evidence intact.');
fs.mkdirSync(output,{recursive:true});

const cell=8,size=64,door={offset:24,width:16,material:'stone'};
const sideByDelta={'0,-1':'N','1,0':'E','0,1':'S','-1,0':'W'};
const opposite={N:'S',E:'W',S:'N',W:'E'};
function chunkFile(state){
 const chunks=state.rooms.map(room=>({id:`room-${room.id}`,size:[size,size],sockets:{},grid:null}));
 for(const [a,b] of state.edges){
  const from=state.rooms[a],to=state.rooms[b];
  if(!from||!to)throw new Error(`Unknown room in edge ${a},${b}`);
  const side=sideByDelta[`${to.col-from.col},${to.row-from.row}`];
  // Lifts connect non-adjacent rooms. They are exported as reciprocal map portals below.
  if(!side)continue;
  chunks[a].sockets[side]=[{...door}];chunks[b].sockets[opposite[side]]=[{...door}];
 }
 for(const chunk of chunks){
  const cells=Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>x===0||y===0||x===7||y===7?'#':'.'));
  for(const side of Object.keys(chunk.sockets))for(const k of [3,4]){
   const [x,y]={N:[k,0],E:[7,k],S:[k,7],W:[0,k]}[side];cells[y][x]='.';
  }
  chunk.grid=cells.map(row=>row.join(''));
 }
 const columns=Math.max(...state.rooms.map(room=>room.col))+1;
 const rows=Math.max(...state.rooms.map(room=>room.row))+1;
 const graph=Array.from({length:rows},()=>Array(columns).fill(null));
 for(const room of state.rooms){
  if(graph[room.row][room.col]!==null)throw new Error(`Overlapping room at ${room.col},${room.row}`);
  graph[room.row][room.col]=`room-${room.id}`;
 }
 return {schema:'generate2dmap.room_chunk.v1',cell,start:'room-0',chunks,graph};
}
function costToEntry(state,start,weighted){
 const cost=state.rooms.map(()=>Infinity),done=new Set();cost[start]=0;
 while(done.size<state.rooms.length){
  let from=-1;
  for(const room of state.rooms)if(!done.has(room.id)&&(from<0||cost[room.id]<cost[from]))from=room.id;
  if(from<0||!Number.isFinite(cost[from]))return null;
  if(from===0)return cost[from];done.add(from);
  for(const to of neighbours(state,from))cost[to]=Math.min(cost[to],cost[from]+(weighted?moveCost(state,to):1));
 }
 return null;
}
function exportState(name,state){
 const file=path.join(output,`${name}.json`);
 fs.writeFileSync(file,JSON.stringify(chunkFile(state),null,2)+'\n');
 const lifts=state.edges.filter(([a,b])=>Math.abs(state.rooms[a].col-state.rooms[b].col)+Math.abs(state.rooms[a].row-state.rooms[b].row)!==1);
 const portals=lifts.map(([a,b])=>({edge:[a,b],files:[[a,b],[b,a]].map(([from,to])=>{
  const portalFile=path.join(output,`${name}-lift-room-${from}.json`);
  const bundle={schema:'generate2dmap.map_bundle.v2',id:`room-${from}`,world:{width:64,height:64,unit:'px'},layers:[],collision:{actorRadius:4},spawns:[{id:'start',x:32,y:32}],portals:[{id:`lift-to-${to}`,rect:[48,24,8,16],to:`room-${to}:start`,activation:'intent',travelDirection:[1,0],radius:6,reciprocal:true,entranceByFrom:{[`room-${to}`]:[32,32]}}]};
  fs.writeFileSync(portalFile,JSON.stringify(bundle,null,2)+'\n');return portalFile;
 })}));
 return {name,file,rooms:state.rooms.length,edges:state.edges.length,portals,returnRoutes:state.rooms.map(room=>({room:room.id,name:room.name,steps:costToEntry(state,room.id,false),walkingCost:costToEntry(state,room.id,true)}))};
}
const classic=newRun({seed:20261106,layout:'classic'});
const expanded=newRun({seed:20261106,layout:'expanded'});
const cases=[exportState('classic',classic),exportState('expanded',expanded)];
expanded.pos=17;expanded.resource.skill=Math.max(2,expanded.resource.skill);
const winch=apply(expanded,{type:'interact'});
if(!winch.ok)throw new Error(`Winch action failed: ${winch.message}`);
cases.push(exportState('expanded-winch',expanded));
const engine=fileURLToPath(new URL('../../../dist/engine.js',import.meta.url));
const report={source:'dist/engine.js',sha256:createHash('sha256').update(fs.readFileSync(engine)).digest('hex'),seed:20261106,cases,limits:['Room grids are a schematic export of adjacent corridors, not the painted rooms. Non-adjacent lifts use separate reciprocal-portal bundles.','Door matching and topology do not prove enemy balance, resource feasibility, artwork collision or mobile hit targets.','Lift bundles prove entry/arrival/reciprocity at both endpoints; they do not describe full room art or other room exits.','Return costs include every game edge, ignore living enemies and use walking; the game also supports sneak and rush.']};
fs.writeFileSync(path.join(output,'source-and-routes.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output:path.resolve(output),sourceSha256:report.sha256,cases:cases.map(({name,rooms,edges})=>({name,rooms,edges}))}));
