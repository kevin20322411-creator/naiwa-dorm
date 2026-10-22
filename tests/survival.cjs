const assert=require('node:assert/strict');
const G=require('../dist/survival.js');
const endings=new Set(),events=new Set(),firstDays=new Set();
let completedDays=0,failedRuns=0,continued=0;
assert.equal(G.eventCount,85);
assert.equal(G.traits.length,20);
assert.equal(G.endings.length,37);
assert.equal(new Set(G.events.map(e=>e.id)).size,G.eventCount);
assert.equal(new Set(G.traits.map(e=>e.id)).size,G.traits.length);
assert.equal(new Set(G.endings.map(e=>e.id)).size,G.endings.length);
for(const e of G.events){assert(e.slot>=0&&e.slot<8);assert.equal(e.choices.length,3);if(e.id.startsWith('campus-'))assert(e.choices.some(c=>(c.mods.money||0)>=0));}
for(const trait of G.traits){const s=G.create(0,[trait.id,trait.id==='brain'?'battery':'brain'],'天赋检查');assert(G.valid(s));}
for(let seed=0;seed<6000;seed++){
 const random=G.rng(seed+97),ids=G.newDraft(seed);
 let state=G.create(seed,[ids[0],ids[1]],'测试奶娃'),first=[];
 for(let action=0;action<600&&state.phase!=='ending';action++){
  if(seed<3)assert(G.valid(state),'刷新时能够恢复同一事件及状态');
  if(state.phase==='choice'){
   const scene=G.getScene(state);events.add(scene.id);
   assert.equal(G.getScene(state).id,scene.id,'重新渲染不能重抽事件');
   if(state.day===1)first.push(scene.id);
   const choices=scene.choices.map((choice,index)=>({choice,index})).filter(o=>(o.choice.mods.money||0)>=-state.stats.money);
   assert(choices.length>0,'余额不足也必须存在能够执行的路线');
   state=G.choose(state,choices[Math.floor(random()*choices.length)].index);
   assert.throws(()=>G.choose(state,0),'同一个选择不能重复结算');
   if(state.failed)assert.equal(G.next(state).phase,'ending','归零后不能再继续挑事件');
  }else if(state.phase==='outcome')state=G.next(state);
  else if(state.phase==='dayEnd'){
   for(const e of G.achievements(state))endings.add(e.id);completedDays++;
   if(state.day>=30)state=G.retire(state);
   else{
    const previous=state,preview=G.restPreview(state);state=G.continueDay(state);continued++;
    assert.equal(state.day,previous.day+1);
    assert.deepEqual(state.stats,preview.stats,'次日变化应与结算页预告一致');
    if(state.phase==='choice'&&state.eventId!=='wallet-rescue'&&!state.eventId.startsWith('meal-'))assert(!previous.log.slice(-24).some(e=>e.eventId===state.eventId),'近期日常不应原样重复');
   }
  }
  for(const k of G.keys)assert(state.stats[k]>=0&&state.stats[k]<=(k==='money'?150:100));
 }
 firstDays.add(first.join(','));
 if(state.phase==='ending'){
  for(const e of G.achievements(state))endings.add(e.id);if(state.failed)failedRuns++;
  assert.throws(()=>G.choose(state,0),'失败后不能再选择事件');
 }
 if(seed<20)assert(G.valid(state));
 if(seed===1){const bad=structuredClone(state);bad.stats.study=999;assert.equal(G.valid(bad),false);}
}
for(const e of G.events.filter(e=>e.slot!==2&&e.id!=='base-0'))assert(events.has(e.id),'V5可用校园事件均可达：'+e.id);
for(const id of ['meal-breakfast','meal-lunch','meal-dinner'])assert(events.has(id));
for(const e of G.endings.filter(e=>!e.hidden&&e.difficulty!=='hard'&&e.id!=='fail-health'))assert(endings.has(e.id),'普通结局均可达：'+e.id);
assert(firstDays.size>5000,'不能只靠少量固定剧本排列');
assert(continued>0&&failedRuns>0);
assert.throws(()=>G.create(0,['bed','bed'],'测试'));
assert.throws(()=>G.create(0,['unknown','luck'],'测试'));
assert.equal(G.valid(null),false);
console.log(JSON.stringify({passed:true,runs:6000,completedDays,continued,failedRuns,distinctFirstDays:firstDays.size,events:events.size,catalogEvents:G.eventCount,endings:endings.size}));
