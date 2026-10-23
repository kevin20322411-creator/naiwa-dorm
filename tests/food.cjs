const assert=require('node:assert/strict'),G=require('../dist/food.js'),B=require('../dist/wellbeing.js'),{simulate}=require('./romance.cjs');
assert.equal(G.foodCount,60);
const observed=[new Set(),new Set(),new Set()],steps=[0,2,5],cap=[8,12,12];
for(let seed=0;seed<200;seed++)for(let slot=0;slot<3;slot++){
 const s={...G.create(seed,['brain','toolkit'],'菜单检查'),step:steps[slot],eventId:['meal-breakfast','meal-lunch','meal-dinner'][slot]},scene=G.getScene(s);
 assert.equal(scene.choices.length,5);assert.deepEqual(G.getScene(s),scene);
 const prices=scene.choices.slice(0,4).map(c=>Math.abs(c.mods.money||0));assert.equal(prices[0],0);assert(prices[1]>0&&prices[1]<prices[2]);assert(prices[2]<=cap[slot]);assert(prices[3]>cap[slot]);
 assert.equal(new Set(scene.choices.map(c=>c.text)).size,5);
 for(const c of scene.choices.slice(0,4)){observed[slot].add(c.text);assert(c.flags.meal);assert(c.mods.energy>0);assert(c.mods.health>=-2);assert(c.mods.mood>0);}
 assert(scene.choices[4].flags.missedMeal);assert.equal(scene.choices[4].project,0);
 const broke={...s,stats:{...s.stats,money:0}},fed=G.choose(broke,0);assert.equal(fed.stats.money,0);assert(!fed.failed);assert.throws(()=>G.choose(broke,3),/饭钱/);
 const nextDay={...s,day:2,log:[{day:1,eventId:s.eventId,choice:scene.choices[1].text}]};assert(!G.getScene(nextDay).choices.some(c=>c.text===scene.choices[1].text),'第二天避免重复刚吃过的同价位菜品');
}
assert.deepEqual(observed.map(s=>s.size),[20,20,20],'所有新菜品都可抽到');
const initial=G.create(4,['reader','luck'],'菜谱存档');assert(G.valid(initial));const meal=G.getScene(initial),fed=G.choose(initial,1);assert(G.valid(fed));assert.deepEqual(fed.stats,G.apply(initial.stats,meal.choices[1].mods));assert.throws(()=>G.choose(fed,1));assert.deepEqual(G.restore(JSON.parse(JSON.stringify(fed))),fed);
for(const file of ['v6-story.json','v6-rhythm.json','v6-deadline.json']){
 const old=require('./fixtures/'+file);assert.deepEqual(G.restore(old),old);const upgraded=G.enableFood(old);assert(G.valid(upgraded));assert.deepEqual(upgraded.log,old.log);assert.deepEqual(upgraded.stats,old.stats);assert.deepEqual(G.getScene(upgraded),B.getScene(old),'正在看的旧事件保持不变');
}
let oldLunch=B.create(0,['brain','toolkit'],'旧菜单');
for(let turn=0;turn<20&&!(oldLunch.step===2&&oldLunch.phase==='choice');turn++){
 if(oldLunch.phase==='choice'){const opts=B.getScene(oldLunch).choices.map((c,i)=>({c,i})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-oldLunch.stats.money).sort((a,b)=>(b.c.mods.energy||0)+(b.c.mods.study||0)-(a.c.mods.energy||0)-(a.c.mods.study||0));oldLunch=B.choose(oldLunch,opts[0].i);}else oldLunch=B.next(oldLunch);
}
assert.equal(oldLunch.eventId,'meal-lunch');const kept=G.enableFood(oldLunch);assert.deepEqual(G.getScene(kept),B.getScene(oldLunch));assert(G.valid(kept));
const previousMeal=B.getScene(oldLunch).choices.findIndex(c=>c.flags.meal&&c.mods.money===0),keptOutcome=G.choose(kept,previousMeal);assert.deepEqual(keptOutcome.outcome,B.choose(oldLunch,previousMeal).outcome);assert(G.valid(keptOutcome));
let survived=0,freeRoute=false,luckSeen=false;
for(let seed=0;seed<16;seed++){
 const sample=simulate(seed,14,G),s=sample.last;assert(G.valid(s));assert(s.log.length);if(s.phase==='dayEnd'&&s.day>=14&&!s.failed)survived++;
 for(const day of new Set(s.log.filter(e=>e.step===7).map(e=>e.day)))for(const id of ['meal-breakfast','meal-lunch','meal-dinner'])assert.equal(s.log.filter(e=>e.day===day&&e.eventId===id).length,1);
 let x=G.create(seed,['reader','luck'],'省饭钱');
 for(let turn=0;turn<100&&x.phase!=='ending';turn++){
  if(x.phase==='choice'){
   const scene=G.getScene(x);if(scene.kind==='三餐'){const before=x;x=G.choose(x,0);freeRoute=true;if(before.step===2){assert.equal(x.outcome.changes.money,8);luckSeen=true;}}else{const opts=scene.choices.map((c,i)=>({c,i})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-x.stats.money).sort((a,b)=>(b.c.mods.energy||0)+(b.c.mods.study||0)-(a.c.mods.energy||0)-(a.c.mods.study||0));x=G.choose(x,opts[0].i);}
  }else if(x.phase==='outcome')x=G.next(x);else x=G.continueDay(x);
 }
 assert(G.valid(x));
}
assert(survived);assert(freeRoute&&luckSeen);
console.log(JSON.stringify({passed:true,foods:observed.map(s=>s.size),breakfastPrices:'0–22',lunchDinnerPrices:'0–38',longRuns:16,survived14:survived,saveCompatibility:true,freeMeal:true}));
