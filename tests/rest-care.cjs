const assert=require('node:assert/strict'),G=require('../dist/semester.js');
const old=require('./fixtures/v6-deadline.json');assert.deepEqual(G.restore(old),old);
const updated=G.enableCare(old);assert(G.valid(updated));assert.deepEqual(updated.log,old.log);assert.deepEqual(updated.stats,old.stats);assert.equal(G.enableCare(updated),updated);
const initial=G.create(42,['brain','toolkit'],'休息检查');assert(G.valid(initial));
const state={...initial,step:7,eventId:'campus-reading-wishlist',stats:{...initial.stats,health:50,mood:40,energy:50},log:[{day:1,eventId:'base-1',changes:{study:15}}]};
const scene=G.getScene(state);assert.equal(scene.choices[2].mods.energy,18);assert.equal(scene.choices[2].mods.health,4);assert.equal(scene.choices[2].mods.mood,5);assert.equal(scene.choices[2].project,0);
assert.equal(scene.choices[1].mods.health,0);assert.equal(scene.choices[1].mods.mood,0);assert(scene.choices[0].mods.health<0);
const chosen=G.choose(state,2);assert.equal(chosen.stats.health,54);assert.equal(chosen.stats.mood,45);assert(chosen.outcome.flags.rest);
const oldScene=G.getScene({...state,restCare:false});assert.equal(oldScene.choices[2].mods.health,-2);assert.equal(oldScene.choices[2].mods.mood,-2);
for(const [id,i]of [['base-4',1],['campus-fan-listing',2],['alarm-committee',0],['term-cold',1]]){const rest=G.getScene({...state,eventId:id}).choices[i];assert(rest.mods.health>0&&rest.mods.mood>0);}
console.log('通过：休息恢复、轻活动免罚、劳累消耗、已发布V6存档无损升级。');
