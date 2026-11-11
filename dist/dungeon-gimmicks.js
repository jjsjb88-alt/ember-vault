import {hasRisk,RISK} from './risk-rules.js?v=20261111a';
// Optional generation marker: previously saved expeditions retain their original rules.
export const SECRET_EDGE=[16,19];
export function hasGimmicks(s){return s?.layout==='staged'&&s.gimmicksVersion===1;}
export function configureGimmicks(s){
 Object.assign(s,{gimmicksVersion:1,hasKey:false,keyDoorOpen:false,sluiceOpen:false,sealForce:false,sealQuiet:false,crystalStopTurn:0});
 s.rooms[18].enemy.anchored=true;
 s.rooms[2].name='공명 수정고';s.rooms[14].name='수문 조작실';s.rooms[16].name='고요의 공명제단';
}
const pair=(a,b,x,y)=>a===x&&b===y||a===y&&b===x;
export function passageRule(s,from,to){
 if(!hasGimmicks(s))return {};
 if(pair(from,to,6,7))return {kind:'guard',label:'검문 통로',extra:1,guard:1,noise:1,description:'이동 +1 · 공격 1을 소비. 부족하면 피해 1(방어 적용) · 소리 +1'};
 if(pair(from,to,9,13))return {kind:'key',label:s.keyDoorOpen?'개방된 지름길':'열쇠 지름길',description:s.keyDoorOpen?'문이 열려 소리와 적도 지나갑니다.':'황동 열쇠 필요 · 열쇠는 소모되지 않음 · 열기 전에는 소리·적·숨결도 차단'};
 if(pair(from,to,11,15))return {kind:'drop',label:s.sluiceOpen?'수문 사다리':'일방 낙하',description:s.sluiceOpen?'수문을 열어 왕복할 수 있습니다.':'울림의 문턱 → 침수 서가로만 이동 · 수문 조작실에서 기술 1 / 소리 5로 귀환 사다리 개방 · 소리는 양방향'};
 if(pair(from,to,16,19))return {kind:'secret',label:'고요의 비밀길',description:'공명제단에서 개방한 왕복 통로 · 소리와 적도 지나갑니다.'};
 if(to===19||from===19)return {kind:'seal',label:s.sealForce||s.sealQuiet?'봉인 해제':'기억의 봉인',description:'봉인병 격파 또는 공명제단의 기술 2 + 은신 3으로 개방 · 유물 수호룡은 별도로 상대'};
 return {};
}
export function movementDirectionAllowed(s,from,to){return !hasGimmicks(s)||s.sluiceOpen||!(from===15&&to===11);}
export function worldPassageOpen(s,from,to){
 if(!hasGimmicks(s))return true;
 if(pair(from,to,9,13)&&!s.keyDoorOpen)return false;
 if((from===19||to===19)&&!(s.sealForce||s.sealQuiet))return false;
 return true;
}
export function gimmickPassable(s,from,to){
 if(!movementDirectionAllowed(s,from,to))return false;
 if(!worldPassageOpen(s,from,to))return pair(from,to,9,13)&&s.hasKey;
 return true;
}
export function movementGimmickReason(s,to){
 if(!hasGimmicks(s))return '';
 if(s.crystalStopTurn===s.turn)return '수정의 울림이 발을 붙잡았습니다. 이번 턴에는 더 이동할 수 없습니다. 다음 턴에 출발하세요.';
 if(!movementDirectionAllowed(s,s.pos,to))return '낙하 통로는 되돌아갈 수 없습니다. 수문 조작실에서 사다리를 열거나 다른 길로 돌아가세요.';
 if(!gimmickPassable(s,s.pos,to))return passageRule(s,s.pos,to).kind==='key'?'황동 열쇠가 필요합니다. 공명 수정고의 상자 또는 정비소에서 얻으세요.':'기억의 봉인이 닫혀 있습니다. 봉인병을 쓰러뜨리거나 공명제단에서 기술 2 · 은신 3을 바치세요.';
 return '';
}
export function roomGimmick(s,id){
 if(!hasGimmicks(s))return null;
 return ({2:{label:'수정 동굴',symbol:'◆',description:'들어오면 이번 턴 이동 종료. 상자에서 금화와 영구 황동 열쇠 획득. 다른 행동은 가능.'},9:{label:'압력 바닥',symbol:'▦',description:'걷기·질주로 들어오면 소리 +2. 살금살금으로 피할 수 있으며 은신도 적용.'},14:{label:'수문 사다리',symbol:'⚙',description:s.sluiceOpen?'수문 개방 완료 · 낙하 통로 왕복 가능.':'기술 1 · 소리 5로 낙하 통로의 귀환 사다리를 엽니다.'},16:{label:'고요의 공명제단',symbol:'◇',description:s.sealQuiet?'고요의 봉인 해제 · 기억실로 비밀길 개방. 휴식은 별도로 한 번 가능.':`기술 2 + 은신 3으로 봉인 해제 · 기억실 비밀길 개방 · 소리 없음. 체력 최대 +${hasRisk(s)?RISK.campHeal:6} / 경계 −3 휴식도 별도로 한 번.`},19:{label:'기억의 봉인',symbol:s.sealForce||s.sealQuiet?'◇':'▣',description:s.sealForce||s.sealQuiet?'봉인 해제 완료. 수호룡을 쓰러뜨린 뒤 유물을 회수하세요.':'심층 봉인병을 격파하거나 공명제단에 기술 2 + 은신 3을 바쳐야 진입.'}})[id]||null;
}
export const STAGE_GIMMICK_PLANS=[
 '다음 중층에는 검문 통로와 수정 동굴이 있습니다. 공격을 준비하면 검문 피해를 막고, 수정고를 돌아가면 열쇠를 얻지만 들어간 턴에는 더 이동할 수 없습니다.',
 '다음 하층에는 열쇠 지름길과 압력 바닥, 일방 낙하가 있습니다. 열쇠는 수정고 또는 정비소에서 확보하세요. 살금살금으로 압력 바닥을 피하고, 낙하 뒤에는 수문 사다리를 열어 귀환로를 만드세요.',
 '심층은 봉인병 격파 또는 공명제단의 기술 2 + 은신 3으로 문을 엽니다. 전투 능력과 고요한 능력 중 계획에 맞게 준비하세요. 귀환 승강기는 기술 3 / 소리 8이며 소리와 적도 지납니다.',
 '봉인병 격파와 고요의 공명제단 중 봉인을 풀 방법을 고르세요. 수호룡을 넘고 용의 기억을 회수한 뒤, 귀환로와 14턴 제한을 확인하세요.'
];
