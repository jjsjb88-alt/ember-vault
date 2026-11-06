// The case explains why trading is available even away from Sera's refuge.
export const MERCHANT={name:'세라',title:'꺼진 기억을 벼리는 사람',art:'./assets/sera-refuge-v93.png'};
export function marketContext(s,practice=false){
 const present=s.rooms[s.pos].type==='merchant'||practice&&s.pos===7;
 const title=present?'이끼 피난처 · 세라의 작업대':'황동 기억함 · 세라의 잔상';
 const greeting=practice?'저 문 너머 갑옷엔 틈이 있어. 네 단검에 이 불씨를 실어 봐.':s.relic?'손에 든 것보다 돌아갈 두 발이 먼저야. 귀환에 쓸 기억을 골라.':s.hp<s.maxHp/2?'그 상처로 더 내려갈 셈이니? 살아 돌아올 수 있는 걸 골라.':s.noise>=8?'조금 작게 말해. 금고가 네 발소리를 기억하고 있어.':'날카로운 칼도, 도망치던 발도… 누군가 남긴 기억이지. 무엇이 필요하니?';
 return {present,title,greeting,explanation:present?'이끼가 소리를 삼키는 틈에서, 작은 망치가 조용히 기억을 두드린다.':'뚜껑을 열자 호박빛 잔상이 피어난다. 피난처의 세라와 이어진 기억함이다.'};
}
export function meetingLines(s,practice=false){
 if(practice)return [
  ['깜부기','불빛이 있어. 조용히… 저 사람은 우리 편이야.'],
  ['세라','쉿. 이끼도 삼키지 못하는 소리가 있거든. 난 세라야.'],
  ['도적','이런 곳에서 장사를 해?'],
  ['세라','사람들이 두고 간 기억을 벼려. 돌아가지 못한 발걸음, 마지막에 놓은 화살 같은 것.'],
  ['세라','수호자에게 갈 거라면 이 불씨를 가져가. 금 대신 네 손으로 기억을 깨워 줘.']
 ];
 const {present}=marketContext(s);
 return [
  ['세라',present?'오랜만에 살아 있는 발소리네. 난 기억을 벼리는 세라야.':'황동 함을 찾았구나. 내 목소리가 들리니? 난 기억장수 세라야.'],
  ['세라','함 안의 메달은 누군가 남긴 솜씨야. 네 손으로 깨우면 다시 힘을 낼 수 있어.'],
  ['세라','함은 내 작업대와 이어져 있어. 어디서 열든 대가는 같아. 살아서 돌아와.']
 ];
}
export const MEMORY_LORE={
 spark:'꺼지기 직전, 누군가 끝까지 놓지 않았던 화살.',
 step:'쫓기는 이를 살려 냈던 마지막 두 걸음.',
 scout:'길을 잃고도 입구를 잊지 않은 정찰병의 기억.',
 sneak:'잠든 금고 사이를 바람처럼 빠져나간 발끝.',
};
export function memoryLore(id,card){return MEMORY_LORE[id]||({attack:'돌아갈 이를 위해 끝까지 들었던 무기의 기억.',move:'무너지는 길에서도 멈추지 않았던 발걸음.',guard:'등 뒤의 사람을 지켜 낸 한순간.',skill:'잊힌 손끝에서 다시 깨어나는 솜씨.'})[card.family]||'이름을 잃어도, 솜씨는 메달 속에 남는다.';}
export function purchaseLines(id,card,practice=false){
 return practice&&id==='spark'?[
  ['세라','뜨겁지? 아직 끝나지 않은 기억이라 그래. 주머니에 잘 넣어.'],
  ['도적','지금 바로 쏠 수는 없는 거야?'],
  ['세라','서두르지 마. 다음에 주머니가 섞이면 네 손에 떠오를 거야.'],
  ['깜부기','다음 불씨가 켜지면 단검과 함께 써 보자. 저 갑옷도 뚫을 수 있어.']
 ]:[['세라',`「${card.name}」… 좋은 눈이네. 네 주머니에 넣어 뒀어.`],['세라','주머니를 다시 섞을 때부터 만날 거야. 네 이야기로 만들어 줘.']];
}
export const SERA_STORY=[['도적','왜 여기 남아 있는 거야?'],['세라','주인을 기다리는 기억이 아직 많아서. 내가 가면, 누가 이걸 기억하겠어.'],['세라','난 금고를 열지 못해. 대신 네 손에 돌아갈 힘 하나쯤은 쥐여 줄 수 있지.']];
