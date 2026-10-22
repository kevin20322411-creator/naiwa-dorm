const assert=require('node:assert/strict'),G=require('../dist/survival.js');
const fixtures=[...require('./fixtures/v2-saves.json'),...require('./fixtures/v3-saves.json')];
for(const {name,save,expectedAfter}of fixtures){
 assert(G.valid(save),'旧版V'+save.version+' '+name+'存档必须保留');
 assert.deepEqual(G.restore(save),save);
 if(expectedAfter){const next=name==='choice'?G.choose(save,0):G.continueDay(save);assert.deepEqual(next,expectedAfter,'旧局后续抽取与结果必须完全一致');}
 const altered=structuredClone(save);altered.stats.study=999;assert.equal(G.restore(altered),null);
}
let s=G.create(0,['brain','ddl'],'长期在读奶娃'),day13,day14;
const earned=new Set();
for(let action=0;action<600&&s.phase!=='ending';action++){
 if(s.phase==='choice'){
  const options=G.getScene(s).choices.map((c,i)=>({c,i,score:Math.min(100,s.stats.energy+(c.mods.energy||0))+1.4*Math.min(100,s.stats.study+(c.mods.study||0))+Math.min(24,s.stats.money+(c.mods.money||0))})).filter(o=>(o.c.mods.money||0)>=-s.stats.money).sort((a,b)=>b.score-a.score);
  s=G.choose(s,options[0].i);
 }else if(s.phase==='outcome')s=G.next(s);
 else{
  assert.equal(G.completedDays(s),s.day);
  for(const e of G.achievements(s))earned.add(e.id);
  if(s.day===13){day13=s;assert(!earned.has('degree'));}
  if(s.day===14){day14=s;assert.equal(G.ending(s).id,'degree');assert(earned.has('degree'));}
  if(s.day===30){assert.equal(G.ending(s).id,'honor');s=G.retire(s);}else s=G.continueDay(s);
 }
 assert(!s.failed,'稳健路线应能完成长期生存样本');
}
assert.equal(s.day,30);assert.equal(s.phase,'ending');assert(G.valid(s));
for(const id of ['freshman','week','degree','honor'])assert(earned.has(id));
assert(G.achievements(day14).length>1,'里程碑与当天称号同时收录');
const started14=G.continueDay(day13);assert.equal(G.completedDays(started14),13);
function findEnd(state,accept){
 if(state.failed||state.phase==='ending')return null;
 if(state.phase==='dayEnd')return accept(state)?state:null;
 if(state.phase==='outcome')return findEnd(G.next(state),accept);
 const scene=G.getScene(state);
 for(let i=0;i<3;i++)if((scene.choices[i].mods.money||0)>=-state.stats.money){const found=findEnd(G.choose(state,i),accept);if(found)return found;}
 return null;
}
const belowThreshold=findEnd(started14,s=>s.stats.study<80);
assert(belowThreshold);assert(G.valid(belowThreshold));
assert(!G.degreeStatus(belowThreshold).awarded);
assert.notEqual(G.ending(belowThreshold).id,'degree','满14天但学业不足不能授予学位');
assert(!G.achievements(belowThreshold).some(e=>e.id==='degree'));
assert(G.valid(G.retire(belowThreshold)),'评定门槛变化不能破坏已发布V3的存档重演');
const lateDegree=findEnd(G.continueDay(belowThreshold),s=>s.stats.study>=80);
assert(lateDegree);assert(G.valid(lateDegree));assert.equal(G.ending(lateDegree).id,'degree','过14天后仍可补足成绩获得学位');
// Model a failure on the fourteenth day: entering that day is not completing it.
const failed14={...started14,phase:'ending',failed:'fail-study',finalEnding:'fail-study'};
assert(!G.achievements(failed14).some(e=>e.id==='degree'));
const failed15={...G.continueDay(day14),phase:'ending',failed:'fail-study',finalEnding:'fail-study'};
assert(G.achievements(failed15).some(e=>e.id==='degree'),'后续失败不会撤回已获得学位');
console.log('通过：旧V2/V3存档兼容、30天路线、14天及学业80门槛、未达标后补领、多成就收录、篡改拒绝。');
