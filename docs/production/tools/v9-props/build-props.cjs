/* Original Ember Vault props. Uses Codixel (MIT, mankidev), see ATTRIBUTION.md. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const P = require(path.resolve(process.argv[2] || '/tmp/ember-tools/codixel/core/pixel.js'));
const repository = path.resolve(__dirname, '../../../..');
const output = path.resolve(process.argv[3] || path.join(repository, 'dist/assets/v9/props'));
const review = path.resolve(process.argv[4] || path.join(repository, 'docs/visual/implemented/v9/props'));
fs.mkdirSync(output, {recursive:true});
fs.mkdirSync(review, {recursive:true});
const gold = P.hueRamp(6, { hue: 36, shift: 20, sat: .65, satDrop: .18, light: [.16, .79] });
const teal = P.hueRamp(5, { hue: 177, shift: 20, sat: .40, satDrop: .08, light: [.12, .64] });
const stone = P.hueRamp(4, { hue: 216, shift: 12, sat: .29, satDrop: .08, light: [.08, .31] });
const fire = P.hueRamp(5, { hue: 23, shift: 23, sat: .85, satDrop: .10, light: [.22, .82] });
const ink = P.rgb(9, 17, 28), cream = P.rgb(255, 232, 174);
const blank = () => new P.Buf(64, 64);
const line = (b, x, y, xx, yy, color, width = 1) => {
  const d = Math.floor(width / 2);
  for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) b.line(x+i,y+j,xx+i,yy+j,color);
};
const outline = (b, pts, color, width = 1) => {
  for (let i=0;i<pts.length;i++) line(b,...pts[i],...pts[(i+1)%pts.length],color,width);
};
const disc = (b,cx,cy,r,color) => {
  for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if((x-cx)**2+(y-cy)**2<=r*r)b.pset(x,y,color);
};
function winch() {
  const b=blank();
  // A chain and separate crank distinguish this mechanism from a collectible coin.
  for(let y=10;y<=28;y+=6){
    b.rect(12,y,18,y+8,ink);b.rect(13,y+1,17,y+7,gold[2]);
    b.rect(14,y+2,16,y+6,ink);b.line(13,y+1,15,y+1,gold[4]);
  }
  b.poly([[20,44],[42,44],[49,56],[13,56]],ink);
  b.poly([[21,46],[40,46],[45,53],[17,53]],stone[2]);
  b.line(18,53,44,53,stone[3]);
  // Pixel-stepped eight-tooth gear, shaded from the upper left.
  for(let y=17;y<=54;y++)for(let x=12;x<=49;x++){
    const dx=x-31,dy=y-35,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
    const tooth=Math.cos(8*a)>.38,edge=tooth?18:15;
    if(r<=edge){
      const shade=r>edge-1.4?0:Math.max(1,Math.min(4,Math.round(2.8-(dx+dy)/24)));
      b.pset(x,y,gold[shade]);
    }
  }
  disc(b,31,35,11,ink);disc(b,31,35,9,teal[1]);
  line(b,24,28,38,42,gold[2],3);line(b,24,42,38,28,gold[2],3);
  b.line(24,27,37,40,gold[4]);b.line(24,41,37,28,gold[3]);
  disc(b,31,35,5,ink);disc(b,31,35,3,gold[4]);b.pset(30,34,cream);
  // Crank handle casts a deliberate dark border over the gear.
  line(b,31,35,45,21,ink,5);line(b,31,35,45,21,gold[3],3);
  b.line(31,33,44,20,gold[5]);
  b.poly([[42,12],[47,10],[53,16],[48,20],[44,18]],ink);
  b.poly([[44,13],[47,12],[51,16],[47,18]],teal[3]);
  b.line(44,13,47,12,teal[4]);
  return b;
}
function echo() {
  const b=blank();
  // Open concentric diamonds communicate a trace travelling along corridors.
  for(const [radius,c] of [[25,teal[1]],[18,teal[2]],[11,teal[3]]]){
    const pts=[[32,37-radius*.55],[32+radius,37],[32,37+radius*.55],[32-radius,37]];
    outline(b,pts,ink,3);outline(b,pts,c);
    b.pset(32-radius,37,teal[4]);
  }
  b.poly([[26,45],[38,45],[43,51],[32,56],[21,51]],ink);
  b.poly([[26,46],[38,46],[40,50],[32,53],[24,50]],stone[2]);
  b.line(25,50,32,53,gold[2]);b.line(32,53,39,50,gold[1]);
  const flame=[[31,9],[34,18],[40,22],[42,29],[39,36],[32,41],[25,37],[22,30],[25,23],[29,20]];
  b.poly(flame,ink);b.poly([[31,13],[32,21],[38,24],[39,30],[36,35],[31,38],[26,34],[25,29],[28,24]],fire[2]);
  b.poly([[30,22],[33,26],[35,30],[33,35],[30,36],[27,32],[28,28]],fire[3]);
  b.poly([[31,27],[33,31],[31,34],[29,32]],fire[4]);
  b.line(25,27,26,24,fire[1]);b.pset(31,31,cream);
  return b;
}
function cache() {
  const b=blank();
  const top=[[12,25],[27,17],[53,25],[40,34]];
  const front=[[12,25],[40,34],[40,55],[12,45]];
  const side=[[40,34],[53,25],[53,46],[40,55]];
  b.poly(front,teal[1]);b.poly(side,stone[1]);b.poly(top,teal[2]);
  outline(b,front,ink,3);outline(b,side,ink,3);outline(b,top,ink,3);
  // Planks keep material structure, rather than procedural speckling.
  b.line(14,33,38,41,teal[0]);b.line(14,39,38,47,teal[0]);
  b.line(14,34,38,42,teal[2]);b.line(14,40,38,48,teal[2]);
  b.line(42,41,51,35,stone[3]);b.line(42,47,51,41,stone[2]);
  b.line(17,25,39,31,teal[3]);b.line(24,22,46,28,teal[3]);
  // Gold edge bands and two straps wrap continuously across the lid and face.
  for(const offset of [0,17]){
    b.poly([[15+offset,27+offset*.32],[19+offset,28+offset*.32],[19+offset,46+offset*.32],[15+offset,44+offset*.32]],gold[2]);
    b.line(15+offset,28+offset*.32,15+offset,43+offset*.32,gold[4]);
    b.poly([[15+offset,25+offset*.28],[19+offset,26+offset*.28],[32+offset,19+offset*.28],[28+offset,18+offset*.28]],gold[3]);
  }
  b.line(13,25,39,33,gold[4]);b.line(40,34,52,26,gold[3]);
  b.line(13,45,39,54,gold[1]);
  // Teal wax/gem seal identifies this as a supply cache, not a coin chest.
  b.poly([[26,33],[32,38],[31,46],[25,49],[20,44],[20,37]],ink);
  b.poly([[26,35],[30,39],[29,45],[25,47],[22,43],[22,38]],gold[3]);
  b.poly([[26,37],[29,40],[26,44],[23,40]],teal[4]);
  b.pset(26,38,cream);
  for(const [x,y] of [[16,31],[34,37],[16,41],[34,47],[47,31],[47,44]])b.pset(x,y,gold[5]);
  return b;
}
function glyph(kind) {
  const b=new P.Buf(24,24);
  if(kind==='safe'){
    b.poly([[12,2],[21,5],[20,14],[17,19],[12,22],[7,19],[4,14],[3,5]],ink);
    b.poly([[12,4],[19,7],[18,14],[15,18],[12,20],[9,18],[6,14],[5,7]],gold[3]);
    b.poly([[12,6],[17,8],[16,14],[12,18],[8,14],[7,8]],teal[2]);
    b.rect(11,8,14,16,cream);b.rect(8,11,17,14,cream);
  } else if(kind==='risk'){
    b.poly([[11,2],[14,2],[22,20],[21,22],[3,22],[1,20]],ink);
    b.poly([[12,4],[21,20],[3,20]],fire[3]);
    b.poly([[12,7],[18,18],[6,18]],fire[1]);
    b.rect(11,9,14,14,cream);b.rect(11,16,14,18,cream);
  } else if(kind==='cache'){
    b.poly([[2,8],[9,3],[22,7],[22,19],[15,22],[2,18]],ink);
    b.poly([[4,9],[15,12],[15,20],[4,17]],teal[2]);
    b.poly([[16,12],[20,9],[20,18],[16,20]],stone[2]);
    b.poly([[5,8],[10,5],[19,8],[15,10]],teal[3]);
    b.rect(5,10,7,17,gold[3]);b.rect(12,12,14,19,gold[3]);
    b.line(5,8,10,5,gold[4]);b.line(12,10,17,7,gold[4]);
    b.rect(8,12,11,16,ink);b.pset(9,13,cream);b.pset(9,14,gold[4]);
  } else if(kind==='shortcut'){
    b.poly([[3,13],[5,11],[3,8],[6,5],[9,6],[11,3],[15,3],[17,6],[20,6],[22,10],[20,13],[21,16],[18,19],[15,18],[13,21],[9,20],[8,17],[5,17]],ink);
    disc(b,12,12,8,gold[3]);disc(b,12,12,5,teal[1]);
    b.rect(7,11,17,14,cream);b.rect(14,7,17,13,cream);
    b.poly([[12,8],[16,3],[20,8]],ink);
    b.poly([[13,7],[16,4],[19,7]],gold[5]);
  }
  return b;
}
const assets={'shortcut-key':winch(),'echo-marker':echo(),'supply-cache':cache(),
 'glyph-safe':glyph('safe'),'glyph-risk':glyph('risk'),'glyph-cache':glyph('cache'),'glyph-shortcut':glyph('shortcut')};
const report={};
for(const [name,b] of Object.entries(assets)){
  P.save(b,path.join(output,name+'.png'));
  report[name]={width:b.w,height:b.h,bounds:P.bounds(b),colors:P.colorCount(b).length,
    opaquePixels:Array.from(b.px).filter(c=>c>>>24).length,edgeFindings:P.edgeCheck(b)};
}
// A single review sheet includes 1x and 4x on both dark and pale backgrounds.
const panels=[];
for(const [name,b] of Object.entries(assets))for(const [bg,col] of [['DARK',P.rgb(16,27,36)],['LIGHT',P.rgb(226,220,200)]]){
  const panel=new P.Buf(b.w,b.h);panel.clear(col);panel.sprite(b,0,0);
  panels.push({buf:panel,label:name.toUpperCase()+' '+bg,scale:4});
  panels.push({buf:panel,label:'NATIVE',scale:1});
}
P.save(P.sheet(panels,{cols:4,gap:12}),path.join(review,'props-review.png'));
fs.writeFileSync(path.join(review,'props-analysis.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([k,v])=>[k,{width:v.width,height:v.height,bounds:v.bounds,colors:v.colors,opaquePixels:v.opaquePixels}]))));
