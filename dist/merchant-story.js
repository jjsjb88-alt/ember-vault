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
  ['녹스','어머, 저 불빛을 기억하는 메달들이네. 깜부기, 아직도 길 잃은 손을 데려오는구나.'],
  ['녹스','수호자에게 갈 테지? 끝까지 누군가를 지켰던 사수가 있어. 네 손을 빌려주겠니?']
 ];
 const {present}=marketContext(s);
 return [
  ['녹스',present?'등불들이 수군거리더니… 손님이었구나. 날 녹스라고 불러.':'작은 함에서 이렇게 큰 이야기가 들리다니. 날 녹스라고 불러.'],
  ['녹스','난 잊힌 이야기를 먹고 살아. 남은 솜씨는 메달로 엮지. 네 손끝으로 깨워 보겠니?'],
  ['녹스','이 함은 내 둥지와 이어져 있어. 어디서든 불러. 네 결말은 직접 듣고 싶으니까.']
 ];
}
export const MEMORY_LORE={
 spark:'마지막 사람이 끊어진 다리를 건널 때까지, 사수는 불붙은 화살을 놓지 않았다.',
 step:'쫓기는 이를 살려 냈던 마지막 두 걸음.',
 scout:'길을 잃고도 입구를 잊지 않은 정찰병의 기억.',
 sneak:'잠든 금고 사이를 바람처럼 빠져나간 발끝.',
};
export function memoryLore(id,card){return MEMORY_LORE[id]||({attack:'돌아갈 이를 위해 끝까지 들었던 무기의 기억.',move:'무너지는 길에서도 멈추지 않았던 발걸음.',guard:'등 뒤의 사람을 지켜 낸 한순간.',skill:'잊힌 손끝에서 다시 깨어나는 솜씨.'})[card.family]||'이름을 잃어도, 솜씨는 메달 속에 남는다.';}
export function purchaseLines(id,card,practice=false){
 return practice&&id==='spark'?[
  ['녹스','이 화살의 주인은 무너지는 다리 앞에 남았어. 마지막 사람이 건널 때까지.'],
  ['도적','활도 없는 내게… 이걸?'],
  ['녹스','빌려주는 건 활이 아니라 끝까지 겨눴던 손이야. 네 단검에도 그 불씨가 옮겨붙겠지.'],
  ['깜부기','네가 메달의 문양을 짚어 줘. 내가 저 기억에 익숙한 불빛을 새길게.'],
  ['도적','문양이 새겨졌어. 그런데 메달은 아직 차갑네.'],
  ['녹스','오래 잠든 손이니까. 식은 메달들 곁에 넣어 둬. 불빛이 다시 닿으면 네 손을 찾아갈 거야.']
 ]:[['녹스',`「${card.name}」… 안목이 귀엽네. 이 문양을 네 등불에 익혀 두렴.`],['녹스','식은 메달들과 함께 넣어 둬. 다시 불빛을 받을 때 깨어날 거야.'],['녹스','돌아와서 들려줘. 네 손에선 어떤 기억이 됐는지.']];
}
export const MERCHANT_STORY=[['탐험가','뿔에 매달린 건… 누구의 등불이야?'],['녹스','아무도 기억하지 않는 이야기들. 내가 먹고 나면, 마지막 불빛이 이렇게 남아.'],['녹스','그런데 네 등불은 걸고 싶지 않네. 이름을 부르면 돌아보는 손님이 더 좋거든.']];
