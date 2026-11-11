export const KEEPSAKES={
 ember:{name:'작은 불씨',art:'lantern',text:'새 턴마다 은신 +1',lore:'돌아올 이를 기다리던 등불의 마지막 심지.'},
 ironheart:{name:'철의 심장',art:'heart',text:'획득 시 최대 체력 +3 · 체력 회복은 공용 한도 적용',lore:'쇠갑옷 속에서도 심장은 두려움을 잊지 않았다.'},
 waystone:{name:'길의 돌',art:'moon',text:'새 턴마다 이동 +1',lore:'측량사는 이 돌을 항상 출구 쪽에 놓았다.'},
 inklens:{name:'잉크 렌즈',art:'shrine',text:'새 턴마다 기술 +1',lore:'지워진 이름 사이로 다음 문장을 읽는다.'},
 copperward:{name:'황동 수호',art:'crown',text:'새 턴마다 방어 +1',lore:'왕관보다 오래 사람을 지킨 문고리.'},
 decoybell:{name:'속삭이는 종',art:'seal',text:'유인 기본 소리 +2 · 남기는 메아리 추가 +2',lore:'주인이 떠난 방에서도 한 번 더 울렸다.'},
 mistseal:{name:'안개의 인장',art:'moon',text:'내 행동의 기본 소리 −1 · 유인 제외',lore:'이름을 감추면 발소리도 한 겹 옅어진다.'},
 memorycup:{name:'기억의 잔',art:'camp',text:'휴식 회복 +1 · 공용 회복 한도 유지',lore:'다 마시지 않고 남겨 둔 한 모금.'},
 echothread:{name:'메아리 실타래',art:'seal',text:'메아리의 자연 감소 간격 −1 · 최소1턴',lore:'묶인 목소리를 풀어 주는 실.'},
 dragonscale:{name:'재의 비늘',art:'dragon-memory',text:'용의 숨결 원피해 −2',lore:'수호룡도 한때 누군가의 불씨였다.'},
 emberedge:{name:'불씨 칼집',art:'heart',text:'새 턴마다 공격 +1',lore:'비어 있어도 손끝에 검의 무게를 남긴다.'},
 hollowkey:{name:'속 빈 열쇠',art:'key',text:'획득 즉시 영구 황동 열쇠를 얻음',lore:'열고 싶었던 것은 문보다 오래된 후회.'},
 returnspindle:{name:'귀환 물레',art:'mechanism',text:'승강기 기술 비용 −1 · 기본 소리 −2',lore:'내려가는 이의 무게를 돌아올 힘으로 모은다.'},
 silentpurse:{name:'잠든 보급낭',art:'chest',text:'휴대 보급의 기본 소리0',lore:'헝겊 안쪽에 적힌 말. 살아서 뜯을 것.'},
 mirrorheart:{name:'거울 심장',art:'heart',text:'처음 닿는 숨결 피해를1회 무효화',lore:'다른 결말이 대신 금이 간다.'},
 stalestone:{name:'돌의 약속',art:'shrine',text:'종유석 붕괴를 최초1회 막음',lore:'버티겠다는 약속은 때로 돌보다 단단하다.'},
};
export const hasKeepsake=(s,id)=>s.keepsakes?.includes(id)===true;
export const lureRaw=s=>5+(hasKeepsake(s,'decoybell')?2:0);
export const provisionRaw=s=>hasKeepsake(s,'silentpurse')?0:3;
export const liftCost=s=>(s.layout==='staged'?3:2)-(hasKeepsake(s,'returnspindle')?1:0);
export const liftRaw=s=>(s.layout==='staged'?8:6)-(hasKeepsake(s,'returnspindle')?2:0);

export const restRaw=(s,base)=>base+(hasKeepsake(s,'memorycup')?1:0);
