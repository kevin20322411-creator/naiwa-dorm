const assert=require('node:assert/strict');
const G=require('../dist/wallet.js');
const Legacy=require('../dist/campus-jobs.js');
const v90=require('./fixtures/campus-jobs-v90.json');
const v94=require('./fixtures/campus-jobs-v94.json');

function check(state){
 assert.deepEqual(G.restore(JSON.parse(JSON.stringify(state))),state);
 return state;
}

for(const state of [...Object.values(v90),...Object.values(v94).flatMap(item=>[item.before,item.after])]){
 check(state);
}

// A legacy job already on screen keeps its original quote. Upgrading the
// rules later must not embed the wallet in any lower save snapshot.
let legacy=G.enableCampusJobs(v90.offered);
assert.strictEqual(legacy,v90.offered);
legacy=check(G.enableUnlimitedMoney(legacy));
legacy=check(G.choose(legacy,2));
assert.equal(legacy.outcome.changes.money,8);
legacy=check(G.enableCampusJobs(legacy));
assert(!legacy.campusJobs.base.wallet);
legacy=check(G.enableSchool(legacy,'cs'));
legacy=check(G.enableMajorLife(legacy));
assert.equal(legacy.school.majorId,'cs');
assert.strictEqual(G.enableUnlimitedMoney(legacy),legacy);

// Three days of real classes, meals and shifts. Both runs follow identical
// choices until the original limit starts withholding pay and rewards.
const moves=[
 0,'a:job-returns',0,'n',1,'n',0,'n',1,'n',0,'n',0,'a:job-exhibit',0,'n',0,'n',0,'n',2,'n',10,'a:job-gear',0,'n',1,'n',2,'n',2,'n','d',
 0,'n',0,'n',0,'a:job-returns',0,'n',2,'a:job-exhibit',0,'n',2,'n',0,'n',16,'a:job-gear',0,'n',2,'a:garden-rest',0,'n',1,'a:study',0,'n',0,'n','d',
 0,'a:job-returns',0,'n',0,'a:job-exhibit',0,'n',2,'n',0,'n',16,'a:job-gear',0,'n',0
];
function play(state,move){
 if(typeof move==='number')return G.choose(state,move);
 if(move==='n')return G.next(state);
 if(move==='d')return G.continueDay(state);
 return G.startActivity(state,move.slice(2));
}
const loadout=['budget','piggyBank','luck'];
let capped=Legacy.create(0,loadout,'原规则');
let wallet=G.create(0,loadout,'不限额');
let paidAbove150=false,spentAbove150=false,overnight=false;
for(const move of moves){
 const before=wallet;
 capped=play(capped,move);
 wallet=play(wallet,move);
 if(wallet.outcome?.campusActivity==='job-exhibit'&&before.stats.money===139){
  assert.equal(capped.stats.money,150);
  assert.equal(wallet.stats.money,162);
  assert.equal(wallet.outcome.changes.money,23);
  check(wallet);
  paidAbove150=true;
 }
 if(wallet.outcome?.flags?.meal&&wallet.outcome.changes.money<0&&before.stats.money>150){
  assert.equal(wallet.stats.money,before.stats.money+wallet.outcome.changes.money);
  spentAbove150=true;
 }
 if(wallet.phase==='dayEnd'&&wallet.stats.money>150){
  const preview=G.restPreview(wallet);
  assert.equal(preview.stats.money,wallet.stats.money+preview.changes.money);
  assert(preview.stats.money>150);
  overnight=true;
 }
}
assert(paidAbove150&&spentAbove150&&overnight);
assert.equal(capped.lottery.credit,5);
assert.equal(wallet.outcome.journalRewardReceived,8);
assert.equal(wallet.stats.money,209);
assert.equal(wallet.lottery.credit,0);
check(wallet);

const credited=check(G.enableUnlimitedMoney(check(capped)));
assert.equal(credited.stats.money,155);
assert.equal(credited.lottery.credit,0);
assert.deepEqual(credited.log,capped.log);
assert.strictEqual(G.enableUnlimitedMoney(credited),credited);
assert.equal(G.restore({...credited,stats:{...credited.stats,money:999}}),null);
assert.equal(Legacy.statLimit('money'),150,'The new rule must not leak into a historical replay');
console.log('Wallet passed: full pay and journals, spending and overnight preview, one-time credit release, exact old saves and staged upgrades.');
