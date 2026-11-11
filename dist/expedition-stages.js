import {configureGimmicks} from './dungeon-gimmicks.js?v=20261111a';
// Four expedition stages share the existing twenty-room canvas. Older layouts
// keep their own topology, relics and rules; this is only for a new staged run.
export const STAGES=[
 {name:'상층',title:'주머니의 기초',description:'보급함과 순찰길 중 필요한 자원을 골라 첫 정비소로 가세요.',color:'#8acbb8',checkpoint:5,offers:['spark','scout','silence'],stock:['spark','scout','silence','step']},
 {name:'중층',title:'힘의 순환',description:'곧바로 정비소로 가거나 기억 창고와 수비병을 거쳐 능력을 더 모으세요.',color:'#8dbfe8',checkpoint:7,offers:['blade','acrobat','lantern'],stock:['blade','acrobat','lantern','insight']},
 {name:'하층',title:'소리를 남기는 선택',description:'파수병의 짧은 길과 이끼·수로의 우회로를 비교하고 심층용 능력을 준비하세요.',color:'#c1a5e4',checkpoint:13,offers:['fury','ghost','healing'],stock:['fury','ghost','healing','wisdom']},
 {name:'심층',title:'유물과 돌아올 힘',description:'용의 기억을 회수하세요. 승강기와 비상 보급소를 미리 살펴 귀환을 준비하세요.',color:'#e7b276',checkpoint:null,offers:[],stock:[]},
];
export const STAGE_ROOMS=[0,0,1,1,0,0,1,1,2,2,2,2,2,2,2,2,3,3,3,3];
export const STAGE_EDGES=[[0,1],[0,4],[1,5],[4,5],[5,6],[6,2],[2,3],[3,7],[6,7],[7,11],[11,10],[10,9],[9,8],[8,12],[12,13],[9,13],[11,15],[15,14],[14,13],[13,17],[15,19],[16,17],[17,18],[18,19]];
export const RETURN_LIFT_EDGE=[5,17];
export function isStaged(s){return s?.layout==='staged';}
export function stageIndex(s,id=s.pos){return isStaged(s)?s.rooms[id].stage:null;}
export function checkpointIndex(s){return isStaged(s)&&s.rooms[s.pos].type==='checkpoint'?STAGES.findIndex(stage=>stage.checkpoint===s.pos):-1;}
export function stageLabel(s){return isStaged(s)?STAGES[stageIndex(s)].name:`B${s.rooms[s.pos].row+1}`;}
export function expeditionBonuses(s){return {tempo:Math.max(0,60-s.turn),quiet:Math.max(0,30-Math.ceil(s.noiseMade/3))};}
export function configureStages(s,{gimmicks=true}={}){
 s.layout='staged';s.edges=STAGE_EDGES.map(e=>[...e]);s.stagePrepared=[null,null,null];s.stageTrades=[0,0,0];s.provisions=1;s.provisionTurn=0;
 const specs={
  0:['entry','무너진 입구','stone'],1:['chest','전초 보급함','stone'],4:['enemy','부서진 순찰길','shards'],5:['checkpoint','상층 정비소','moss'],
  6:['enemy','잔향의 갈림길','shards'],2:['chest','중층 기억 창고','water'],3:['enemy','잊힌 수비실','stone'],7:['checkpoint','중층 정비소','moss'],
  11:['enemy','울림의 문턱','stone'],10:['enemy','파수병의 회랑','shards'],9:['enemy','낮은 수로','water'],8:['camp','먼지 속 모닥불','moss'],12:['chest','하층 금고','shards'],13:['checkpoint','하층 정비소','moss'],14:['enemy','이끼 우회로','moss'],15:['enemy','침수 서가','water'],
  16:['camp','심층 비상 보급소','moss'],17:['mechanism','심층 귀환 승강기','stone'],18:['enemy','봉인 수비실','shards'],19:['relic','용의 기억실','stone'],
 };
 for(const r of s.rooms){
  const [type,name,terrain]=specs[r.id];Object.assign(r,{type,name,terrain,stage:STAGE_ROOMS[r.id],used:false,enemy:null,seen:[0,1,4].includes(r.id),visited:r.id===0});delete r.relic;delete r.host;
  if(type==='checkpoint')r.host='nox';
 }
 for(const [id,kind,name,hp,damage,gold,anchored] of [[4,'skeleton','전초 순찰병',3,1,2,false],[3,'skeleton','중층 수비병',5,2,3,false],[10,'sentinel','회랑 파수병',6,2,4,false],[12,'skeleton','금고 약탈자',5,2,3,false],[18,'sentinel','심층 봉인병',7,2,5,false],[19,'dragon','기억의 수호룡',10,3,8,true]])s.rooms[id].enemy={kind,name,hp,maxHp:hp,damage,gold,home:id,mode:'idle',target:null,memory:0,awareness:0,anchored};
 s.rooms[19].relic={name:'용의 기억',value:56,icon:'heartgem'};
 if(gimmicks)configureGimmicks(s);
 s.market=[...STAGES[0].stock];
}
