import {newRun,resolvePool} from './engine.js';

export const TUTORIAL_STEPS=[
 {title:'금빛 방 이름을 누르세요',text:'망각의 창고로 이동하세요. 이동력 1을 사용합니다.',action:'move',id:1,target:'.scene-exit[data-id="1"]'},
 {title:'상자를 직접 눌러 여세요',text:'금화를 얻고 대기 소음이 쌓입니다. 이 소음은 용의 공격 때 주머니에 들어갑니다.',action:'interact',target:'#sceneTarget'},
 {title:'누가 들었는지 확인하세요',text:'오른쪽 위 미니맵을 누르세요. 소리는 벽을 뚫지 않고 통로로 퍼집니다.',action:'panel',id:'sound',target:'#mapToggle'},
 {title:'교역으로 덱을 키우세요',text:'지도를 닫고 교역에서 잰걸음을 기술 2로 영입하세요. 빈 상품 칸은 턴 끝에 보충됩니다.',action:'buy',index:0,target:'#marketToggle'},
 {title:'다른 방으로 시선을 돌리세요',text:'교역을 닫고 유인 → 부서진 무기고. 기술 1로 돌멩이를 던집니다.',action:'lure',id:5},
 {title:'발소리가 위험으로 남습니다',text:'이동 방식에서 질주를 고르고 파수병의 방으로 이동하세요. 대기 소음이 더 쌓입니다.',action:'move',id:2,mode:'rush'},
 {title:'용이 주머니에서 뽑습니다',text:'풀 뽑기를 누르세요. 연습은 순찰이 오는 3턴째입니다. 상품을 보충하고 소음 큐브를 주머니에 넣어 뽑습니다.',action:'end',target:'#endTurn'},
 {title:'모인 공격력으로 적을 누르세요',text:'파수병을 직접 눌러 공격하세요. 방어는 반격 피해를 자동으로 막습니다.',action:'attack',target:'#sceneTarget'},
 {title:'보상으로 풀을 성장시키세요',text:'능력 하나를 고르세요. 영입한 능력은 다음 순환부터 뽑힙니다.',action:'reward',target:'.ability-choice'}
];

export function createTutorialRun(){
 const s=newRun({seed:42028,role:'rogue'}),r=s.rooms[2];
 // A disclosed training scenario uses prepared hands and the normal turn-three
 // patrol. All actions, refills, bag draws and damage use the real engine.
 s.turn=3;s.played=[];s.discard=[];s.hand=[];
 s.deck=['tread','scheme','stumble','scrap','scrap'];
 s.resource={move:0,sword:0,skill:0,block:0,quiet:0,rattle:0};
 s.dragon.pending=0;s.log=[];
 resolvePool(s,['scout','step','slash','focus','sneak']);
 s.market[0]='step';
 r.name='파수병의 방';r.type='enemy';r.enemy={kind:'skeleton',name:'금고의 파수병',hp:2,maxHp:2,damage:1,gold:2,home:2,mode:'idle',target:null,memory:0,awareness:0,anchored:false};
 return s;
}
export function tutorialAllows(index,action){
 const step=TUTORIAL_STEPS[index];if(!step)return false;
 if(step.mode&&action.type==='mode')return action.id===step.mode;
 if(step.action==='reward'&&action.type==='skipReward')return true;
 return action.type===step.action&&(step.id===undefined||step.id===action.id)&&(step.index===undefined||step.index===action.index);
}
export function tutorialAdvance(index,action){
 return action.type!=='mode'&&tutorialAllows(index,action)?index+1:index;
}
