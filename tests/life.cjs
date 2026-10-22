const assert=require('node:assert/strict');
const G=require('../dist/survival.js');
const life=require('../dist/life.js');

assert.deepEqual(life.healthDefaults,{health:80,mood:65});
assert.deepEqual(life.meals.map(m=>m.step),[0,2,5]);
assert(G.keys.includes('health')&&G.keys.includes('mood'));
const windows=[[420,480],[500,650],[690,765],[810,960],[970,1040],[1050,1140],[1200,1340],[1360,1435]];
const minute=time=>{assert.match(time,/^\d{2}:\d{2}$/);const[h,m]=time.split(':').map(Number);return h*60+m;};
const menus=new Map(life.meals.map(m=>[m.id,new Set()]));
let negativeFood=false;
for(let seed=0;seed<24;seed++)for(let day=1;day<=3;day++){
 const times=[];
 for(let step=0;step<8;step++){
  const state={seed,day,step},time=life.eventTime(state),value=minute(time);
  assert.equal(life.eventTime(state),time,'同一种子、天数和步骤的时间保持不变');
  assert(value>=windows[step][0]&&value<=windows[step][1],'事件时间必须位于对应窗口');
  if(step)assert(value>minute(times[step-1]),'每天八幕的时间严格递增');
  times.push(time);
  const meal=life.meals.find(m=>m.step===step),scene=life.mealScene(state,time);
  if(!meal){assert.equal(scene,null);continue;}
  assert.equal(scene.id,meal.id);assert.equal(scene.time,time);assert.equal(scene.kind,'三餐');
  assert.equal(scene.choices.length,5,'每餐固定四道菜与一项不吃');
  assert.deepEqual(life.mealScene(state,time),scene,'同一餐重新渲染不会重抽菜单');
  const food=scene.choices.slice(0,4),skip=scene.choices[4];
  assert.equal(new Set(food.map(c=>c.text)).size,4,'四道菜不能重复');
  assert(food.some(c=>c.mods.money===0),'没钱时至少有一份免费饭可吃');
  for(const choice of food){
   assert.match(choice.text,/¥\d+/,'选项文字明示价格');
   assert.equal(choice.flags.meal,1);assert.equal(choice.flags[meal.key],1);
   assert(choice.mods.energy>0&&choice.mods.money<=0);
   if(choice.mods.health<0){negativeFood=true;assert.equal(choice.mods.mood,9);}
   else{assert(choice.mods.health>=3&&choice.mods.health<=7);assert(choice.mods.mood>=2&&choice.mods.mood<=8);}
  }
  assert.equal(skip.flags.missedMeal,1);assert(!skip.flags.meal);
  assert(skip.mods.energy>=-12&&skip.mods.energy<=-8);
  assert(skip.mods.health>=-10&&skip.mods.health<=-7);
  assert(skip.mods.mood>=-7&&skip.mods.mood<=-4);
  assert.equal(skip.mods.study,3);
  menus.get(meal.id).add(food.map(c=>c.text).join('|'));
 }
 if(day===1)assert.notDeepEqual(times,Array.from({length:8},(_,step)=>life.eventTime({seed,day:2,step})),'跨天日程会发生变化');
}
assert(negativeFood,'食物库包含心情加分但健康扣分的小吃选择');
for(const variants of menus.values())assert(variants.size>8,'每餐菜单有足够多的抽取组合');

function best(state,value){
 const options=G.getScene(state).choices.map((c,i)=>({c,i}))
  .filter(o=>(o.c.mods.money||0)>=-state.stats.money)
  .map(o=>({state:G.choose(state,o.i),index:o.i}));
 assert(options.length,'任一场景都有能负担的选项');
 options.sort((a,b)=>value(b.state)-value(a.state)||a.index-b.index);
 return options[0].state;
}
function restore(state){const copy=G.restore(JSON.parse(JSON.stringify(state)));assert(copy,'真实生活存档能够恢复');return copy;}

// Check all three meal slots through real choices, including both sides of a
// refresh. No manual score or action edits are used in the game-flow samples.
let fed=G.create(0,['reader','ddl'],'正常吃饭验证'),mealsSeen=0;
assert.equal(fed.version,5);
for(let action=0;action<30&&fed.phase!=='dayEnd';action++){
 if(fed.phase==='choice'){
  const scene=G.getScene(fed);
  if(scene.kind==='三餐'){
   assert.deepEqual(G.getScene(restore(fed)),scene,'刷新三餐保持菜品、价格和时间');
   const choiceIndex=scene.choices.findIndex(c=>c.flags.meal&&c.mods.money===0&&c.mods.health>0);
   assert(choiceIndex>=0);
   const before=fed,choice=scene.choices[choiceIndex];fed=G.choose(fed,choiceIndex);
   assert.deepEqual(fed.stats,G.apply(before.stats,choice.mods),'吃饭的费用和属性只结算一次');
   if(mealsSeen===0){assert(fed.stats.health>before.stats.health);assert(fed.stats.mood>before.stats.mood);}
   assert.equal(fed.stats.money,before.stats.money,'免费餐不扣钱');
   assert.deepEqual(restore(fed),fed,'吃饭后刷新不会重复扣费或增加属性');
   assert.throws(()=>G.choose(fed,choiceIndex),'同一顿饭不能重复结算');
   mealsSeen++;
  }else fed=best(fed,s=>s.failed?-1e9:s.stats.energy+1.5*s.stats.study+.3*s.stats.health);
 }else if(fed.phase==='outcome')fed=G.next(fed);
 else assert.fail('正常饮食不应提前结束');
}
assert.equal(fed.phase,'dayEnd');assert.equal(mealsSeen,3);assert(G.valid(fed));
assert(fed.stats.health>=life.healthDefaults.health&&fed.stats.mood>=life.healthDefaults.mood);

// A fixed spending route reaches a genuine empty wallet at day-three breakfast.
let broke=G.create(0,['reader','ddl'],'免费餐验证'),freeMeal=false;
for(let action=0;action<100&&broke.phase!=='ending';action++){
 if(broke.phase==='choice'){
  const scene=G.getScene(broke);
  if(scene.kind==='三餐'&&broke.stats.money===0){
   const index=scene.choices.findIndex(c=>c.flags.meal&&c.mods.money===0);
   assert(index>=0);assert(G.valid(broke));
   const fedFree=G.choose(broke,index);
   assert.equal(fedFree.stats.money,0);assert(!fedFree.failed);assert(G.valid(fedFree));
   assert.equal(fedFree.flags.meal,(broke.flags.meal||0)+1);
   freeMeal=true;break;
  }
  broke=best(broke,s=>s.failed?-1e9:-100*s.stats.money+s.stats.energy+s.stats.study+.3*s.stats.health);
 }else if(broke.phase==='outcome')broke=G.next(broke);
 else broke=G.continueDay(broke);
}
assert(freeMeal,'真实零余额存档仍能选择免费正餐');

// Skip every meal while protecting energy and study in the five campus scenes.
// Health, rather than another score, must cause the eventual end of this run.
let hungry=G.create(0,['reader','ddl'],'健康验证');
for(let action=0;action<200&&hungry.phase!=='ending';action++){
 if(hungry.phase==='choice'){
  const scene=G.getScene(hungry);
  hungry=scene.kind==='三餐'?G.choose(hungry,4):best(hungry,s=>s.failed?-1e9:s.stats.energy+1.5*s.stats.study);
 }else if(hungry.phase==='outcome')hungry=G.next(hungry);
 else hungry=G.continueDay(hungry);
}
assert.equal(hungry.failed,'fail-health','持续跳餐会触发健康归零失败');
assert.equal(hungry.phase,'ending');assert.equal(hungry.stats.health,0);
assert(hungry.stats.energy>0&&hungry.stats.study>0);
assert(hungry.flags.missedMeal>=9);assert(!hungry.flags.meal);
assert.equal(G.ending(hungry).id,'fail-health');assert(G.valid(hungry));
assert.deepEqual(restore(hungry),hungry);
console.log(JSON.stringify({passed:true,menuCases:24*3*3,mealsPerDay:mealsSeen,zeroBudgetMeal:true,skippingFailure:{day:hungry.day,id:hungry.failed}}));
