const assert=require('node:assert/strict'),G=require('../dist/positive-endings.js'),I=require('../dist/identity-events.js'),{step}=require('./admission.cjs');
const copy=s=>JSON.parse(JSON.stringify(s)),check=s=>{assert.deepEqual(G.restore(copy(s)),s);return s;};
assert(I.pool.rich.some(e=>e.id==='identity-rich-dinner'));assert(!I.pool.director.some(e=>e.id.includes('dinner')));assert(I.pool.director.some(e=>e.id==='identity-director-request'));
for(const old of Object.values(require('./fixtures/identity-events-v97-preview1.json'))){check(old);assert.strictEqual(G.upgradeIdentityEvents(old),old,'finish the existing story before upgrading its pool');check(G.upgradeIdentityEvents(G.next(old.phase==='choice'?G.choose(old,1):old)));}
for(const old of Object.values(require('./fixtures/admission-v96-formal.json'))){assert.deepEqual(G.restore(copy(old)),old);const next=check(G.enableIdentityEvents(old));assert.equal(next.admission.identityLife.revision,1);assert.deepEqual(next.stats,old.stats);assert.deepEqual(next.log,old.log);assert.strictEqual(G.enableIdentityEvents(next),next);}
let found=0,branches=0;const examples={};
for(const {id}of G.identities.filter(identity=>I.pool[identity.id])){
 assert.equal(I.pool[id].length,2);let pending;
 for(let seed=70;seed<85&&!pending;seed++){
  let s=G.createCampus(seed,['gold-brain','gold-battery','optimist'],'身份事件',id);
  for(let i=0;i<120&&s.phase!=='ending';i++){
   if(s.admission.pending?.kind==='identity'){pending=check(s);break;}
   const n=step(s);if(n===s)break;s=n;
  }
 }
 assert(pending,id+' can encounter a dedicated event');found++;examples[id]=pending;
 const scene=G.getScene(pending);assert(scene.identityScene);assert(I.pool[id].some(e=>e.id===scene.id));assert.equal(scene.choices.length,3);assert(!pending.school.pending);assert(!/^meal-/.test(pending.eventId));assert.equal(G.availableActivities(pending).length,0);assert(!G.canManageFans(pending));
 assert.throws(()=>G.choose(pending,99));assert.throws(()=>G.next(pending));
 for(let index=0;index<3;index++){
  if(scene.choices[index].disabledReason)continue;branches++;const result=check(G.choose(pending,index));assert.equal(result.outcome.identityEvent,scene.id);assert.equal(result.rhythm.clock,pending.rhythm.clock+10);assert.equal(result.outcome.minutes,10);if(id==='liang')assert.equal(result.stats.mood,100);if(id==='classmate'&&scene.choices[index].affection)assert.equal(result.romance.lastInteraction,result.day);
  assert.throws(()=>G.choose(result,index),'a result cannot settle twice');const continued=check(G.next(result));assert(!continued.admission.pending||continued.admission.pending.kind!=='identity','one event cannot immediately retrigger itself');assert(continued.day>result.day||continued.rhythm.clock>=result.rhythm.clock);
 }
 const bad=copy(pending);bad.admission.identityLife.count++;assert.equal(G.restore(bad),null);
}
const first=examples.rich;let continued=G.next(G.choose(first,2)),seen=1,previous=first.admission.identityLife.lastEventDay,otherId;
for(let i=0;i<350&&continued.phase!=='ending'&&!otherId;i++){
 if(continued.admission.pending?.kind==='identity'){
  assert(continued.day-previous>=3,'events have a multi-day cooldown');assert.notEqual(continued.admission.pending.key,first.admission.pending.key,'avoid immediate repetition');otherId=continued.admission.pending.key;seen++;break;
 }
 continued=step(continued);
}
assert(otherId,'a later day can encounter the other dedicated story');check(continued);
console.log(JSON.stringify({passed:true,identities:found,eventDefinitions:Object.values(I.pool).flat().length,choiceBranches:branches,spacedEvents:seen,oldSaveCompatibility:true}));
module.exports={examples};
