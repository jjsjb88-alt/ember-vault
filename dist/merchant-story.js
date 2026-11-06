// Nox feeds on forgotten stories. Its case links distant rooms to the same den.
export const MERCHANT={name:'녹스',identity:'nox-v1',title:'기억 등불의 여주인',art:'./assets/v95/nox.webp'};
export function marketContext(s,practice=false){
 const present=s.rooms[s.pos].type==='merchant'||practice&&s.pos===7;
 const title=present?'이끼 피난처 · 녹스의 둥지':'황동 기억함 · 녹스의 잔상';
 const greeting=practice?'저 갑옷 속엔 틈이 있지. 네 단검에 이 불씨를 실어. 끝이 제법 맛있어질 거야.':s.relic?'반짝이는 결말을 주웠네. 이제 살아서 돌아오는 문장을 써 볼까?':s.hp<s.maxHp/2?'이런, 이야기 끝에 피 냄새가 나. 결말을 서두르진 말아 줘.':s.noise>=8?'쉬이. 금고가 네 이야기에 귀를 기울였어. 아직 끝을 들려주진 마.':'어서 와, 아직 끝나지 않은 이야기. 오늘은 어떤 기억을 두르고 갈까?';
 return {present,title,greeting,explanation:present?'뿔에 매달린 등불들이 고개를 든다. 은발 아래 황금빛 눈매가 당신을 향해 휘어진다.':'뚜껑 사이로 푸른 불씨가 스민다. 함 너머에서 뿔의 등불들이 하나씩 깨어난다.'};
}
export function meetingLines(s,practice=false){
 if(practice)return [
  ['깜부기','뿔의 등불을 봐. 녹스야. 인사는 해도, 네 이름까지 주진 마.'],
  ['녹스','후후. 작은 불씨가 말을 참 야박하게 하네. 어서 와, 아직 끝나지 않은 이야기.'],
  ['도적','…지금 나를 먹을 것처럼 봤는데.'],
  ['녹스','잊힌 이야기만 먹어. 넌 아직 너무 따뜻해서, 뒷이야기가 궁금하거든.'],
  ['녹스','수호자에게 갈 테지? 이 불씨를 깨워 봐. 네 단검에 재미있는 결말을 달아 줄게.']
 ];
 const {present}=marketContext(s);
 return [
  ['녹스',present?'등불들이 수군거리더니… 손님이었구나. 날 녹스라고 불러.':'작은 함에서 이렇게 큰 이야기가 들리다니. 날 녹스라고 불러.'],
  ['녹스','난 잊힌 이야기를 먹고 살아. 남은 솜씨는 메달로 엮지. 네 손끝으로 깨워 보겠니?'],
  ['녹스','이 함은 내 둥지와 이어져 있어. 어디서든 불러. 네 결말은 직접 듣고 싶으니까.']
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
  ['녹스','손 조심. 마지막까지 꺼지지 않던 화살이야. 아직 제 끝을 못 찾았지.'],
  ['도적','지금 바로 쏠 수는 없는 거야?'],
  ['녹스','성급하기도 해라. 주머니가 다시 섞이면 널 찾아갈 거야. 그때 단검에 실어 줘.'],
  ['깜부기','약속대로 메달이 들어왔어. 다음 추출에서 저 갑옷을 뚫어 보자.']
 ]:[['녹스',`「${card.name}」… 안목이 귀엽네. 네 주머니에 살짝 숨겨 뒀어.`],['녹스','다시 섞이면 만날 거야. 돌아와서 들려줘. 네 손에선 어떤 기억이 됐는지.']];
}
export const MERCHANT_STORY=[['탐험가','뿔에 매달린 건… 누구의 등불이야?'],['녹스','아무도 기억하지 않는 이야기들. 내가 먹고 나면, 마지막 불빛이 이렇게 남아.'],['녹스','그런데 네 등불은 걸고 싶지 않네. 이름을 부르면 돌아보는 손님이 더 좋거든.']];
