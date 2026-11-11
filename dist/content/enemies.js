export const ENEMIES={
 skeleton:{name:'떠도는 파수병',art:'skeleton',sense:'sound',text:'마지막으로 들은 소리를 조사합니다.'},
 sentinel:{name:'봉인의 수비병',art:'sentinel',sense:'sound',text:'소리를 듣고 통로를 봉쇄합니다.'},
 dragon:{name:'기억의 수호룡',art:'dragon',sense:'sound',text:'자리를 지키며 회수자를 막습니다.'},
 deaf:{name:'귀먹은 문지기',art:'sentinel',sense:'sight',hue:35,text:'소리에는 반응하지 않고 열린 인접 통로의 모습을 봅니다.'},
 echohound:{name:'메아리 사냥개',art:'skeleton',sense:'echo',hue:180,text:'근처에서 가장 진한 메아리를 따라갑니다.'},
 drummer:{name:'뼈 북지기',art:'skeleton',sense:'sound',hue:315,text:'턴 끝에 소리3을 내어 다른 적을 부릅니다.'},
 hushpriest:{name:'침묵의 사제',art:'sentinel',sense:'sound',hue:270,text:'같은 방에서 턴을 넘기면 은신을2 잃습니다.'},
 bellrunner:{name:'종소리 추격자',art:'skeleton',sense:'loud',hue:15,text:'소리4 이상에만 반응하며 추적 중 두 통로를 움직입니다.'},
 moth:{name:'등불 나방',art:'skeleton',sense:'quiet',hue:130,text:'근처의 은신3 이상인 등불을 따라옵니다.'},
 choir:{name:'망각의 합창단',art:'sentinel',sense:'sound',hue:220,text:'턴 끝에 연결된 다른 적의 체력을1 회복시킵니다.'},
};
export function enemyArt(kind){return ENEMIES[kind]?.art||kind;}
