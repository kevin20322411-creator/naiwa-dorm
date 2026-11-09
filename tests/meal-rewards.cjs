const assert=require('node:assert/strict'),G=require('../dist/positive-endings.js'),C=require('../dist/canteen-ui.js');
const clone=s=>JSON.parse(JSON.stringify(s)),old=require('./fixtures/admission-v96-preview.json');
for(const saved of Object.values(old)){assert.deepEqual(G.restore(clone(saved)),saved);const up=G.upgradeAdmission(saved);assert.equal(up.admission.mealRevision,2);assert.deepEqual(G.restore(clone(up)),up);assert.strictEqual(G.upgradeAdmission(up),up);assert.deepEqual(up.stats,saved.stats);assert.deepEqual(up.log,saved.log);}
let s=G.createCampus(72,['gold-brain','gold-battery','gold-bank'],'用餐','rich');
const options=G.getScene(s).choices,cheap=options.find(c=>c.text.startsWith('街边葱油拌面')),premium=options.find(c=>c.text.startsWith('酒店主厨品鉴套餐'));
assert.equal(cheap.mods.energy,24);assert.equal(premium.mods.energy,68);assert(premium.mods.mood>cheap.mods.mood*5);assert(!cheap.mealPerk);assert.equal(premium.mealPerk.remaining,6);
assert.equal(G.getScene(old.initial).choices.find(c=>c.text.startsWith('酒店主厨品鉴套餐')).mods.energy,35,'preview history retains its original recovery');
assert.equal(G.getScene(G.upgradeAdmission(old.initial)).choices.find(c=>c.text.startsWith('酒店主厨品鉴套餐')).mods.energy,68,'continuing a preview save enables revised meals');
s=G.choose(s,options.indexOf(premium));assert.equal(s.admission.mealPerk.remaining,6);assert(G.valid(s));const before=s;
s=G.next(s);assert.equal(s.admission.mealPerk.remaining,6,'turning a page does not consume recovery');
const c=G.getScene(s).choices.findIndex(c=>!c.disabledReason);s=G.choose(s,c);assert(s.outcome.mealRecovery?.energy>0);assert.equal(s.admission.mealPerk.remaining,5);assert(s.stats.energy<=100&&s.stats.mood<=100);assert.deepEqual(G.restore(clone(s)),s);
const tampered=clone(s);tampered.admission.mealPerk.remaining=99;assert.equal(G.restore(tampered),null);
const result=C.mealStory(old.meal.outcome);assert(result.includes('酒店餐厅'));assert(!result.includes('小店'));assert.equal(C.mealStory({...old.meal.outcome,result:old.meal.outcome.result+'\n肚子有点不舒服。'}).split('\n').at(-1),'肚子有点不舒服。','illness and bonus messages survive presentation correction');
assert.equal(C.nameOf({text:'海鲜自助晚餐 · ¥128'}),'海鲜自助餐');assert(C.foodArt(C.nameOf({text:'海鲜自助晚餐'})).includes('data-food-recipe="named"'));
assert.equal(C.mealStory({choice:'茶',result:'另一段正常叙述。'}),'另一段正常叙述。');assert.deepEqual(before.log.at(-1),before.outcome);
console.log('Meal rewards passed: visible recovery tiers, useful after-meal recovery, single-use charges, strict preview migration, replay integrity, and matching restaurant copy.');
