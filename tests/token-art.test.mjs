import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CARDS} from '../dist/engine.js';
import {TOKEN_IDS,PROP_IDS,GRADES,tokenInfo,tokenMarkup,richGlyph,itemMarkup} from '../dist/token-art.js';
const pngSize=path=>{const data=fs.readFileSync(new URL(path,import.meta.url));assert.equal(data.toString('ascii',1,4),'PNG');return [data.readUInt32BE(16),data.readUInt32BE(20)];};
test('every real ability and relic/prop has a separate delivered 256px image',()=>{
 assert.deepEqual(TOKEN_IDS,Object.keys(CARDS));assert.equal(TOKEN_IDS.length,24);assert.equal(PROP_IDS.length,12);
 for(const id of TOKEN_IDS)assert.deepEqual(pngSize(`../dist/assets/v95/tokens/${id}.png`),[256,256]);
 for(const id of PROP_IDS)assert.deepEqual(pngSize(`../dist/assets/v95/props/${id}.png`),[256,256]);
 assert.deepEqual(pngSize('../dist/assets/v95/rarity-frames.png'),[384,96]);
});
test('shared old symbols now resolve to distinct card art, while tiers retain the same identity',()=>{
 assert.notEqual(tokenInfo('guard').src,tokenInfo('bash').src);assert.notEqual(tokenInfo('sneak').src,tokenInfo('silence').src);assert.notEqual(tokenInfo('slash').src,tokenInfo('ambush').src);
 const before=structuredClone(CARDS),src=tokenInfo('spark').src;
 for(const [grade,meta]of Object.entries(GRADES)){
  assert.equal(tokenInfo('spark',grade).src,src);const html=tokenMarkup('spark',{grade});assert.ok(html.includes(`data-tier="${grade}"`));assert.ok(html.includes(meta.name));
 }
 assert.deepEqual(CARDS,before);assert.match(richGlyph('dagger'),/tokens\/slash.webp/);assert.match(itemMarkup('dragon-memory'),/dragon-memory.webp/);assert.equal(richGlyph('unmapped-symbol'),null);
});
test('invalid memory and grade references fail before making broken image markup',()=>{
 assert.throws(()=>tokenMarkup('missing'));assert.throws(()=>tokenMarkup('spark',{grade:'missing'}));assert.throws(()=>itemMarkup('missing'));
});
