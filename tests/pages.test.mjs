import test from 'node:test';
import assert from 'node:assert/strict';
import {pageOf} from '../dist/pages.js';
import {CARDS} from '../dist/engine.js';

test('paged ability and pool lists expose every choice, including the final partial page',()=>{
 for(const size of [4,5]){
  const ids=Object.keys(CARDS),original=[...ids],pages=pageOf(ids,0,size).pages;
  const shown=Array.from({length:pages},(_,i)=>pageOf(ids,i,size).items).flat();
  assert.deepEqual(shown,ids);assert.deepEqual(ids,original);
  assert.equal(pageOf(ids,999,size).page,pages-1);
  assert.equal(pageOf(ids,-2,size).page,0);
 }
 assert.deepEqual(pageOf([],12),{items:[],page:0,pages:1,total:0,start:0});
});
