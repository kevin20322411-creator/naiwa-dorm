const assert=require('node:assert/strict'),G=require('../dist/semester.js');
for(const file of ['v6-deadline.json','v6-care.json']){const old=require('./fixtures/'+file);assert.deepEqual(G.restore(old),old);const upgraded=G.enableBalance(G.enableCare(old));assert(G.valid(upgraded));assert.deepEqual(upgraded.stats,old.stats);assert.deepEqual(upgraded.log,old.log);}
const s={...G.create(8,['brain','toolkit'],'恢复检查'),step:1,stats:{energy:60,money:40,social:50,study:60,health:40,mood:40}};
const scene=id=>G.getScene({...s,eventId:id});
const reading=scene('campus-reading-wishlist');assert.equal(reading.choices[0].mods.health,0);assert.equal(reading.choices[0].mods.mood,1);assert.equal(reading.choices[1].mods.mood,2);assert(reading.choices[2].mods.health>=4);
const move=scene('campus-five-minute-move');assert(move.choices[0].mods.health>move.choices[1].mods.health);assert(move.choices[1].mods.mood>move.choices[0].mods.mood);
const recovery=G.choose({...s,eventId:'campus-five-minute-move'},0);assert.equal(recovery.stats.health,46);
const study=scene('base-1');assert.equal(study.choices[0].mods.health,0);assert.equal(study.choices[1].mods.social,5);
const popular=G.getScene({...s,eventId:'base-1',stats:{...s.stats,social:90}});assert.equal(popular.choices[1].mods.social,2);
const work=scene('base-3');assert(work.choices[0].mods.health<work.choices[1].mods.health);
const tired=G.getScene({...s,eventId:'base-1',stats:{...s.stats,energy:15}});assert(tired.choices[0].mods.health<study.choices[0].mods.health);
const chained=G.getScene({...s,eventId:'base-1',log:[1,2].map(step=>({day:1,step,eventId:'base-1',changes:{study:10},flags:{}}))});assert(chained.choices[0].mods.health<0);
assert(scene('term-cold').choices[2].mods.health<=-14);
console.log('通过：选项健康心情差异、普通学习不伤健康、运动恢复、硬撑代价、人缘递减、历史存档兼容。');
