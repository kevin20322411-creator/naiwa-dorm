const assert=require('node:assert/strict'),G=require('../dist/audit-fixes.js'),W=require('../dist/campus-world.js'),C=require('../dist/canteen-ui.js'),M=require('../dist/campus-ui.js');
let checked=0;
for(let seed=0;seed<24;seed++){
 const start=G.create(seed,['budget','brain','athletic'],'地图测试',[],'freshman'),original=JSON.stringify(start),pending=W.model(start);assert.equal(pending.places.length,17);assert(!pending.canAct);assert(pending.places.every(p=>p.actions.length===0));assert.equal(JSON.stringify(start),original);assert.throws(()=>W.startActivity(start,'sports','gym'));
 const food=C.render(start,G.getScene(start));assert.equal((food.match(/data-choice=/g)||[]).length,5);assert(food.includes('免费'));assert(food.includes('不消费'));assert(!/电量 [+-]\d|健康 [+-]\d|心情 [+-]\d/.test(food));
 const fed=G.choose(start,0),snapshot=JSON.stringify(fed),map=W.model(fed),available=G.availableActivities(fed),mapped=map.places.flatMap(p=>p.actions.map(a=>a.id));assert.deepEqual(mapped.slice().sort(),available.map(a=>a.id).sort(),'所有已有活动都能从相应地点进入');assert.equal(JSON.stringify(fed),snapshot);assert.equal(map.currentId,'canteen');assert(map.canAct);
 for(const p of map.places)for(const a of p.actions){const n=W.startActivity(fed,p.id,a.id);assert.deepEqual(n,G.startActivity(fed,a.id),'地图活动沿用原规则');assert(G.valid(n),'地图活动存档可重放');checked++;}
 assert.throws(()=>W.startActivity(fed,'clinic','gym'));assert.equal((M.render(fed,map,'sports').match(/data-place=/g)||[]).length,17);assert(M.render(fed,{...map,time:'22:00',period:'夜晚'},'sports').includes('data-campus-map="night"'));assert(C.render(fed,G.getScene(fed)).includes('data-canteen="outcome"'));
}
for(const s of Object.values(require('./fixtures/v6-character.json')))assert.deepEqual(G.restore(s),s);
console.log(JSON.stringify({passed:true,seeds:24,mapActivities:checked,readOnlyBrowsing:true,menuIndices:true,saveReplay:true,legacySaves:true}));
