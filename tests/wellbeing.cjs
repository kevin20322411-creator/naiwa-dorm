const assert=require('node:assert/strict'),G=require('../dist/wellbeing.js'),B=require('../dist/rhythm.js'),{simulate}=require('./romance.cjs');
const milestones=['freshman','week','degree','honor'];
function failHealthOnLastChoice(s){
 const last=s.log.length-1;
 return {...s,phase:'ending',failed:'fail-health',finalEnding:'fail-health',stats:{...s.stats,health:0},log:s.log.map((e,i)=>i===last?{...e,changes:{...e.changes,health:(e.changes.health||0)-s.stats.health}}:e)};
}
for(const day of [3,7,14]){
 const completed=simulate(0,day,B).last;assert.equal(completed.day,day);assert.equal(completed.phase,'dayEnd');
 const failed=failHealthOnLastChoice(completed),before=B.achievements({...failed,log:failed.log.slice(0,-1)}).filter(e=>milestones.includes(e.id)).map(e=>e.id);
 assert.deepEqual(G.achievements(failed).filter(e=>milestones.includes(e.id)).map(e=>e.id),before);
 assert.equal(G.completedDays(failed),day-1);assert.equal(G.ending(failed).id,'fail-health');
 if(day===14){assert(B.degreeStatus(failed).awarded,'冻结旧规则用于复现第14天误发学位');assert(!G.degreeStatus(failed).awarded);assert(G.achievements(failed).some(e=>e.id==='week'),'之前完成的一周成就继续保留');assert(G.degreeStatus(completed).awarded,'健康完成14天的学位正常发放');}
 assert.deepEqual(G.achievements(completed),B.achievements(completed));
}
const old=require('./fixtures/v6-rhythm.json');assert.deepEqual(G.restore(old),old);assert(G.valid(old));
const next=G.choose(old,1);assert(G.valid(next));assert.deepEqual(G.achievements(next),B.achievements(next));
console.log('通过：健康失败不误发当日里程碑，历史成就保留，正常学位与6.5旧存档恢复不受影响。');
