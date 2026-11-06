// Non-creative post-processing and contact sheets using Codixel's image core.
const P=require(process.argv[2]||'/tmp/ember-tools/codixel/core/pixel.js');
const fs=require('fs');const base='dist/assets/v95';
const props=['moon','crown','heart','dragon-memory','chest','camp','shrine','mechanism','key','seal','lantern','coin'];
for(const id of props){const path=`${base}/props/${id}.png`;P.save(P.removeBg(P.load(path),{tol:20,flood:true}),path);}
const tokenIds=['step','scout','slash','focus','guard','sneak','spark','rush','blade','bash','insight','ghost','potion','greed','fury','lantern','acrobat','treasure','sentinel','ambush','healing','wisdom','echo','silence'];
for(const id of tokenIds){const path=`${base}/tokens/${id}.png`;P.save(P.removeBg(P.load(path),{tol:18,flood:true}),path);}
P.save(P.sheet(tokenIds.map(id=>({buf:P.load(`${base}/tokens/${id}.png`),label:id})),{cols:6,fit:128,labelScale:1}),'/tmp/ember-v95-token-contact.png');
P.save(P.sheet(props.map(id=>({buf:P.load(`${base}/props/${id}.png`),label:id})),{cols:4,fit:128,labelScale:1}),'/tmp/ember-v95-prop-contact.png');
console.log('Codixel: 12 prop alpha cutouts and 36-asset contact sheets complete');
