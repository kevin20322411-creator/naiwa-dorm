const assert=require('node:assert/strict');
const G=require('../dist/engine.js');
const reached=new Set();
for(let seed=0;seed<25000;seed++){
 const random=G.rng(seed+57),ids=G.newDraft(seed);
 assert.equal(new Set(ids).size,6);
 let state=G.create(seed,[ids[0],ids[1]],'测试奶娃');
 while(state.phase!=='ending'){
  assert(G.valid(state),'选择前的存档应可恢复');
  state=G.choose(state,Math.floor(random()*3));
  assert(G.valid(state),'展示结果时的存档应可恢复');
  assert.throws(()=>G.choose(state,0),'不能重复结算同一个选择');
  state=G.next(state);
  for(const k of G.keys)assert(state.stats[k]>=0&&state.stats[k]<=(k==='money'?150:100));
 }
 assert.equal(state.log.length,8);
 assert(G.valid(state));
 reached.add(G.ending(state).id);
 if(seed===1){const tampered=structuredClone(state);tampered.stats.study=999;assert.equal(G.valid(tampered),false);}
}
assert.equal(reached.size,G.endings.length,'所有结局应能通过正常路线达到');
assert.throws(()=>G.create(0,['bed','bed'],'测试'));
assert.throws(()=>G.create(0,['unknown','luck'],'测试'));
assert.throws(()=>G.next(G.create(0,['bed','luck'],'测试')));
assert.throws(()=>G.choose(G.create(0,['bed','luck'],'测试'),-1));
assert.equal(G.valid(null),false);
console.log('通过：25000 条完整路线、12 个可达结局、存档与操作边界。');
