const assert=require('node:assert/strict'),G=require('../dist/survival.js');
let hits=0;const kinds=new Set(),baseline={energy:62,money:40,social:45,study:70,health:80,mood:65};
for(let seed=0;seed<10000;seed++){
 const s=G.create(seed,['brain','ddl'],'开局加成检查');assert.equal(s.version,5);
 if(s.openingBuff){hits++;kinds.add(s.openingBuff.id);for(const key of G.keys)assert.equal(s.stats[key],baseline[key]+(key===s.openingBuff.key?12:0));}
 else assert.deepEqual(s.stats,baseline);
 if(seed<20||seed%1000===0)assert.deepEqual(G.restore(s),s,'刷新不能重抽开局加成');
}
assert(hits>1800&&hits<2200,'固定样本的触发率应接近20%');assert.equal(kinds.size,6);
for(let seed=0;seed<2000;seed++){
 const s=G.create(seed,['bed','battery'],'满电开局');
 if(s.openingBuff)assert.notEqual(s.openingBuff.key,'energy','满值属性不能空发加成');
}
let bonusState;for(let seed=0;!bonusState;seed++){const s=G.create(seed,['brain','ddl'],'篡改检查');if(s.openingBuff)bonusState=s;}
const altered=structuredClone(bonusState);altered.openingBuff.amount=99;assert(!G.valid(altered));
for(let seed=0;seed<30;seed++){
 const first=G.newDraft(seed),locked=first.slice(0,2),next=G.newDraft(seed+1,locked,first);
 assert.equal(next.length,6);assert.equal(new Set(next).size,6);assert(next.every(id=>!first.includes(id)));assert(next.every(id=>!locked.includes(id)));
}
const oldDayEnd=require('./fixtures/v3-saves.json').find(x=>x.name==='dayEnd').save;
const upgraded=G.enableEconomy(oldDayEnd);assert(upgraded.actions.includes('e'));assert(G.valid(upgraded));
assert(G.valid(G.continueDay(upgraded)));assert.equal(G.enableEconomy(upgraded),upgraded);
assert.throws(()=>G.enableEconomy(require('./fixtures/v2-saves.json')[0].save));
// A controlled snapshot compares earning opportunities before and after the update.
let standard=0,boosted=0;
for(let seed=0;seed<1000;seed++){
 const input={...oldDayEnd,seed,stats:{...oldDayEnd.stats,money:19,study:90,energy:70}};
 for(const [enabled,count]of [[false,'standard'],[true,'boosted']]){
  const s=G.continueDay(enabled?G.enableEconomy(input):input),hasIncome=G.getScene(s).choices.some(c=>(c.mods.money||0)>0);
  if(hasIncome){if(count==='standard')standard++;else boosted++;}
 }
}
assert(boosted>standard+100,'缺钱时赚钱事件的出现率应显著增加');
let rescue;
for(let seed=0;seed<200&&!rescue;seed++){
 let s=G.create(seed,['food','toolkit'],'低预算奶娃');
 while(!s.failed&&s.phase!=='dayEnd'){
  if(s.phase==='outcome'){s=G.next(s);continue;}
  const options=G.getScene(s).choices.map((c,i)=>({c,i})).filter(o=>(o.c.mods.money||0)>=-s.stats.money&&s.stats.energy+(o.c.mods.energy||0)>5&&s.stats.study+(o.c.mods.study||0)>12).sort((a,b)=>(a.c.mods.money||0)-(b.c.mods.money||0));
  if(!options.length)break;s=G.choose(s,options[0].i);
 }
 if(s.phase==='dayEnd'&&s.stats.money<14&&!G.restPreview(s).failed)rescue=G.continueDay(s);
}
assert(rescue,'应有真实低预算次日样本');assert(G.valid(rescue));
let offered=false;
for(let slot=0;slot<2&&!offered;slot++){
 const scene=G.getScene(rescue),earning=scene.choices.map((c,i)=>({c,i})).find(o=>(o.c.mods.money||0)>0&&rescue.stats.energy+(o.c.mods.energy||0)>0&&rescue.stats.study+(o.c.mods.study||0)>0);
 if(earning){const previous=rescue.stats.money;rescue=G.choose(rescue,earning.i);assert(rescue.stats.money>previous);offered=true;}
 else{const safe=scene.choices.findIndex(c=>(c.mods.money||0)>=-rescue.stats.money&&rescue.stats.energy+(c.mods.energy||0)>0&&rescue.stats.study+(c.mods.study||0)>0);assert(safe>=0);rescue=G.next(G.choose(rescue,safe));}
}
assert(offered,'低预算次日上午必须有实际赚钱路线');assert(G.valid(rescue));
for(const fixture of [...require('./fixtures/v2-saves.json'),...require('./fixtures/v3-saves.json')]){
 if(fixture.save.phase==='ending')continue;
 const updated=G.enableLife(fixture.save);assert(G.valid(updated));assert.equal(updated.stats.health,80);assert.equal(updated.stats.mood,65);
 if(updated.phase==='choice'){
  const affordable=G.getScene(updated).choices.findIndex(c=>(c.mods.money||0)>=-updated.stats.money);
  assert(affordable>=0);assert(G.valid(G.choose(updated,affordable)));
 }
 if(updated.phase==='dayEnd'){
  const continued=G.continueDay(updated);assert(G.valid(continued));
  if(continued.phase==='choice'){
   const choices=G.getScene(continued).choices;assert.equal(choices.length,5);
   const affordable=choices.findIndex(c=>(c.mods.money||0)>=-continued.stats.money);
   assert(affordable>=0);assert(G.valid(G.next(G.choose(continued,affordable))));
  }
 }
}
console.log(JSON.stringify({passed:true,openingHits:hits,sampleSize:10000,openingKinds:kinds.size,incomeFrequency:{standard,boosted},legacyUpgrade:true,morningIncome:true}));
