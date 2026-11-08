const assert=require('node:assert/strict');
const G=require('../dist/campus-jobs.js');
const B=require('../dist/talent-effects.js');
const W=require('../dist/campus-world.js');
const old=require('./fixtures/campus-jobs-v90.json');
const traits=['budget','brain','athletic'];
const offered=(state,key)=>G.availableActivities(state).some(activity=>activity.id===key);
function check(state){
 assert.deepEqual(G.restore(structuredClone(state)),state);
 return state;
}
const breakfast=(seed,loadout=traits)=>check(G.choose(G.create(seed,loadout,'兼职测试'),0));

// These snapshots were written by v9.0, including one that is still on the
// original wage offer. Completing that offer cannot silently change its rate.
for(const state of Object.values(old)){
 assert.equal(state.school,undefined);
 assert.equal(state.campusJobs,undefined);
 check(state);
}
assert.strictEqual(G.enableCampusJobs(old.offered),old.offered);
assert.equal(G.getScene(old.offered).choices[2].mods.money,8);
assert.deepEqual(check(G.choose(old.offered,2)),old.settled);
const migrated=check(G.enableCampusJobs(old.settled));
assert.equal(migrated.school,undefined);
assert.deepEqual(migrated.stats,old.settled.stats);
assert.deepEqual(migrated.log,old.settled.log);
assert.strictEqual(G.enableCampusJobs(migrated),migrated);
const newOffer=check(G.startActivity(migrated,'job'));
assert.deepEqual(G.getScene(newOffer).choices.slice(0,3).map(choice=>choice.mods.money),[21,26,10]);
assert.equal(check(G.choose(newOffer,2)).outcome.changes.money,10);

const sample=breakfast(72);
assert.deepEqual(sample.stats,B.choose(B.create(72,traits,'兼职测试'),0).stats);
for(const [key,place,time,pay] of [
 ['job-returns','library',12,9],
 ['job-gear','sports',25,17],
 ['job-exhibit','museum',35,23]
]){
 const action=W.model(sample).places.find(p=>p.id===place).actions.find(a=>a.id===key);
 assert(action?.label.includes('¥'+pay));
 const pending=check(W.startActivity(sample,place,key));
 assert.equal(W.model(pending).currentId,place);
 assert.equal(G.getScene(pending).choices[0].mods.money,pay);
 const cancelled=check(G.choose(pending,1));
 assert.deepEqual(cancelled.stats,sample.stats);
 assert.equal(cancelled.rhythm.clock,sample.rhythm.clock);
 assert.equal(cancelled.log.length,sample.log.length);
 const settled=check(G.choose(pending,0));
 assert.equal(settled.stats.money-sample.stats.money,pay);
 assert.equal(settled.outcome.changes.money,pay);
 assert.equal(settled.outcome.flags.job,1);
 assert.equal(settled.rhythm.clock-sample.rhythm.clock,time);
 assert.equal(settled.nutrition.at-sample.nutrition.at,time);
 assert.throws(()=>G.choose(settled,0));
 let later=check(G.next(settled));
 if(later.phase==='choice')later=check(G.choose(later,0));
 assert.equal(later.day,sample.day);
 assert(!offered(later,key));
 assert.throws(()=>G.startActivity(later,key));
}

const shortGap=breakfast(4);
assert.equal(G.freeMinutes(shortGap),15);
assert(offered(shortGap,'job-returns'));
assert(!offered(shortGap,'job-gear'));
assert(!offered(shortGap,'job-exhibit'));
assert.throws(()=>G.startActivity(shortGap,'job-exhibit'));

const talent=breakfast(72,['jobHand','brain','athletic']);
const first=check(G.choose(G.startActivity(talent,'job'),2));
assert.equal(first.outcome.changes.money,12);
assert.deepEqual(first.outcome.talentTriggers.map(t=>t.id),['jobHand']);
const second=check(G.choose(G.startActivity(first,'job-returns'),0));
assert.equal(second.outcome.changes.money,9);
assert.equal(second.outcome.talentTriggers,undefined);
const altered=structuredClone(second);
altered.stats.money++;
assert.equal(G.restore(altered),null);

// v9.4 receipts are real saved games. Restore past payments unchanged, but
// use the corrected talent rules when the player is still choosing.
const v94=require('./fixtures/campus-jobs-v94.json');
for(const [sample,id,expected,bonus] of [
 [v94.termShift,'jobHand',34,2],
 [v94.mealReward,'lunchbox',35,1]
]){
 const {before,index,after}=sample;
 check(before);
 check(after);
 assert.deepEqual(G.choose(before,index),after);
 const upgraded=check(G.enableCampusJobs(before));
 assert.deepEqual(upgraded.log,before.log);
 assert.deepEqual(upgraded.stats,before.stats);
 assert.strictEqual(G.enableCampusJobs(upgraded),upgraded);
 const paid=check(G.choose(upgraded,index));
 assert.equal(paid.stats.money,expected);
 assert.equal(paid.stats.money-after.stats.money,bonus);
 assert.deepEqual(paid.outcome.talentTriggers.map(item=>item.id),[id]);
 assert(paid.talentEffects.daily.used.includes(id));
}
console.log('Campus jobs passed: exact 9.0 wages and saves, paid rates, map access, duration and nutrition, cancellation and repeats, short class gaps and trait bonus.');
