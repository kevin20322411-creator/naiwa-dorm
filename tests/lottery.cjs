const assert=require('node:assert/strict'),G=require('../dist/lottery.js'),B=require('../dist/evolution.js'),W=require('./wellness.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixtures(){const all=new Map(),offers=[];let jackpot;
 for(let seed=0;seed<1200&&(!jackpot||all.size<5);seed++){
  const engine={...G,choose(s,i){if(s.eventId==='lottery-ticket'){offers.push(s);const n=G.choose(s,0);all.set(n.outcome.lotteryPrize,{before:s,after:n});if(n.lottery.won)jackpot??={before:s,after:n};return n;}return G.choose(s,i);}};
  W.run(engine,seed,8,false);
 }
 assert(jackpot&&all.size===5,'实际日程可以遇到所有奖档');return{all,offers,jackpot};
}
function checks(){const f=fixtures(),first=f.offers[0],counts={0:0,10:0,20:0,50:0,1000000:0};
 for(let seed=0;seed<20000;seed++){const s={...first,seed},n=G.choose(s,0);assert(Object.hasOwn(counts,n.outcome.lotteryPrize));counts[n.outcome.lotteryPrize]++;assert.equal(n.log.length,s.log.length+1);assert.equal(n.stats.money,s.stats.money-5+n.outcome.lotteryPrize);}
 const expected={0:.65,10:.2,20:.1,50:.04,1000000:.01};for(const[k,p]of Object.entries(expected))assert(Math.abs(counts[k]/20000-p)<.012,'奖档概率 '+k);
 const byRunDay=new Set();for(const s of f.offers){assert([1,3,4,6].includes(s.step));assert(!s.rhythm.pending);const key=s.seed+':'+s.day;assert(!byRunDay.has(key));byRunDay.add(key);assert.equal(s.lottery.lastOfferDay,s.day);}
 for(const[award,{before,after}]of f.all){assert(G.valid(before));assert(G.valid(after));assert.deepEqual(G.restore(clone(after)),after);assert.deepEqual(G.choose(clone(before),0),after,'刷新不会重抽 '+award);assert.equal(after.stats.money,before.stats.money-5+award);assert.equal(after.lottery.won,award===1000000);assert.equal(after.phase,award===1000000?'ending':'outcome');}
 const skip=G.choose(first,1);assert.equal(skip.stats.money,first.stats.money);assert.equal(skip.outcome.lotteryPrize,0);assert(!skip.lottery.won);assert(G.valid(skip));assert(G.valid(G.next(skip)));assert.throws(()=>G.choose({...first,stats:{...first.stats,money:4}},0),/饭钱不足/);assert.doesNotThrow(()=>G.choose({...first,stats:{...first.stats,money:0}},1));
 const {before,after}=f.jackpot;assert.equal(G.ending(after).name,'奶生赢家');assert.equal(after.finalEnding,'lottery-winner');assert(G.achievements(after).some(e=>e.id==='lottery-winner'));assert(!G.achievements(after).some(e=>e.id==='fail-energy'));assert.equal(G.completedDays(after),after.day-1);if(after.day<14)assert(!G.achievements(after).some(e=>e.id==='degree'));assert.equal(G.availableActivities(after).length,0);assert.throws(()=>G.next(after));assert.throws(()=>G.continueDay(after));assert.throws(()=>G.retire(after));assert.throws(()=>G.choose(after,0));
 const altered=clone(after);altered.stats.money++;assert.equal(G.restore(altered),null);
 const sample=f.all.get(50).before,nearCap={...sample,stats:{...sample.stats,money:149}},award=G.choose(nearCap,0);assert.equal(award.stats.money,150);assert.equal(award.lottery.credit,44);assert.equal(award.stats.money+award.lottery.credit,149-5+50);
 const cost={...award,stats:{...award.stats,money:130}};const replenished=G.next(cost);assert.equal(replenished.stats.money,150);assert.equal(replenished.lottery.credit,24);assert.equal(replenished.log.filter(e=>e.eventId==='lottery-credit').length,1);
 const old=require('./fixtures/v6-evolution.json');assert.deepEqual(G.restore(old),old);const upgraded=G.enableLottery(old);assert(G.valid(upgraded));assert.deepEqual(upgraded.stats,old.stats);assert.deepEqual(upgraded.log,old.log);assert.equal(upgraded.eventId,old.eventId);assert.deepEqual(G.restore(B.choose(B.create(20,['brain','toolkit'],'旧存档'),0)),B.choose(B.create(20,['brain','toolkit'],'旧存档'),0));
 console.log(JSON.stringify({passed:true,realOffers:f.offers.length,prizeSamples:counts,oldSaves:true,jackpotEnds:true,overflowPreserved:true}));return f;
}
if(require.main===module)checks();module.exports={fixtures,checks};
