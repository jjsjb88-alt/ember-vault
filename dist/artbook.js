import {CARDS} from './engine.js?v=20261107b';
import {TOKEN_IDS,PROP_IDS,tokenMarkup,gradeLabel,itemMarkup,paintTokens,tokenInfo} from './token-art.js?v=20261107b';
import {memoryLore} from './merchant-story.js?v=20261107b';
const heroes=[['rogue','그림자 도적','발소리를 숨기고, 기억을 손안에 훔친다.'],['knight','잿빛 기사','낡은 맹세를 방패에 새긴 귀환의 수호자.'],['mage','불씨 마법사','금지된 서고에서 불씨가 된 기억을 읽는다.']];
document.querySelector('#heroes').innerHTML=heroes.map(([id,name,lore])=>`<article class="hero"><img src="./assets/v95/heroes/${id}.webp" alt="${name}"><h3>${name}</h3><p>${lore}</p></article>`).join('');
const names=['달의 눈물','잊힌 왕관','잿불의 심장','용의 기억','보급 상자','작은 모닥불','기억의 제단','귀환 윈치','귀환 열쇠','소음의 봉인','기억 등불','오래된 금화'];
const lore=['달빛을 품은 가장 얕은 금고의 보물.','이름보다 오래 남은 왕의 무게.','금고의 불길이 심장처럼 뛰는 결정.','가장 깊은 곳에서 돌아보는 고대의 눈.','어디까지 챙길지, 소리를 남길지.','돌아갈 두 발을 위해 잠깐 머무는 빛.','덜어 낸 기억만큼 주머니는 가벼워진다.','길을 열면 돌아올 선택이 하나 더 생긴다.','잠든 귀환로를 깨우는 작은 이빨.','작은 소란도 금고에는 오래 남는다.','녹스가 먹고 남긴 이야기의 마지막 불씨.','주인을 잃어도 빛을 잊지 않는 것.'];
document.querySelector('#props').innerHTML=PROP_IDS.map((id,i)=>`<article class="prop-card">${itemMarkup(id,150)}<strong>${names[i]}</strong><p>${lore[i]}</p></article>`).join('');
let grade;
function render(){document.querySelector('#memoriesGrid').innerHTML=TOKEN_IDS.map(id=>{const info=tokenInfo(id,grade);return `<button class="memory-card" data-memory="${id}">${tokenMarkup(id,{size:112,grade})}<strong>${CARDS[id].name}</strong><small>${CARDS[id].text}</small><span class="memory-grade tier-${info.tier}">${info.name}${grade?' 외형':''} · 기술 ${CARDS[id].cost}</span></button>`;}).join('');paintTokens(document);}
document.querySelector('#tiers').addEventListener('click',e=>{const b=e.target.closest('[data-grade]');if(!b)return;grade=b.dataset.grade||undefined;document.querySelectorAll('[data-grade]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));render();});
document.querySelector('#memoriesGrid').addEventListener('click',e=>{const b=e.target.closest('[data-memory]');if(!b)return;const id=b.dataset.memory,info=tokenInfo(id,grade);document.querySelector('#detailBody').innerHTML=`${tokenMarkup(id,{size:210,grade,awaken:true})}<h2>${CARDS[id].name}</h2><span class="memory-grade tier-${info.tier}">${info.name} · ${CARDS[id].kind}</span><p>${CARDS[id].text} · 기술 ${CARDS[id].cost}</p><p>“${memoryLore(id,CARDS[id])}”</p>`;document.querySelector('#detail').showModal();paintTokens(document.querySelector('#detail'));});
document.querySelector('#closeDetail').addEventListener('click',()=>document.querySelector('#detail').close());render();
