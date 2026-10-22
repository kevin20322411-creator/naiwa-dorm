const assert=require('node:assert/strict');
const G=require('../dist/survival.js');
const C=require('../dist/challenges.js');

assert.equal(C.endings.length,6);
assert.equal(C.endings.filter(e=>e.hidden).length,3);
assert.equal(C.endings.filter(e=>e.difficulty==='hard').length,3);
assert.equal(new Set(C.endings.map(e=>e.id)).size,6);
for(const ending of C.endings)assert(G.endings.some(e=>e.id===ending.id),'挑战成就已接入引擎图鉴');

function todayFlag(state,key){
 return state.log.filter(e=>e.day===state.day).reduce((total,e)=>total+(e.flags[key]||0),0);
}
// These fixed policies choose only genuine, affordable game options. Scores
// encourage a target without changing the save, event pool, or award thresholds.
function score(state,goal){
 if(state.failed)return-1e9;
 const v=state.stats;
 let value=v.energy+1.4*v.study+.65*Math.min(v.money,goal==='hard-perfect-month'?100:50)+.3*v.health+.12*v.mood;
 if(goal==='hidden-cat-advisor')value+=35*(state.flags.cat||0);
 if(goal==='hidden-early-miracle')value+=40*todayFlag(state,'early')-100*todayFlag(state,'skip');
 if(goal==='hidden-broke-chaos')value=Math.min(v.energy,65)+1.5*Math.min(v.study,65)-.8*v.money+22*Math.min(2,todayFlag(state,'chaos'))+.3*v.health+.12*v.mood;
 if(goal==='hard-library-maker')value+=24*(Math.min(3,state.flags.library||0)+Math.min(3,state.flags.maker||0));
 return value;
}
function reach(goal,seed){
 let state=G.create(seed,['reader','ddl'],'成就验证');
 assert.equal(state.version,5,'六项成就使用当前完整生活规则验证');
 for(let action=0;action<1100&&state.day<=35&&state.phase!=='ending';action++){
  if(state.phase==='choice'){
   assert(!G.achievements(state).some(e=>e.id===goal),'未过完当天不能提前获得挑战成就');
   const options=G.getScene(state).choices.map((choice,index)=>({choice,index}))
    .filter(o=>(o.choice.mods.money||0)>=-state.stats.money)
    .map(o=>({state:G.choose(state,o.index),index:o.index}));
   assert(options.length,'真实游戏中应保留可负担选项');
   options.sort((a,b)=>score(b.state,goal)-score(a.state,goal)||a.index-b.index);
   state=options[0].state;
  }else if(state.phase==='outcome')state=G.next(state);
  else if(state.phase==='dayEnd'){
   if(G.achievements(state).some(e=>e.id===goal))return state;
   if(state.day===35)break;
   state=G.continueDay(state);
  }else assert.fail('未知游戏阶段：'+state.phase);
 }
 assert.fail(goal+'应在固定种子'+seed+'的35天内通过正常选择达成');
}

const scenarios=[
 {id:'hidden-cat-advisor',seed:1,check:s=>G.completedDays(s)>=7&&s.flags.cat>=6},
 {id:'hidden-broke-chaos',seed:0,check:s=>s.stats.money===0&&s.stats.study>=50&&s.stats.energy>=50&&todayFlag(s,'chaos')>=2},
 {id:'hidden-early-miracle',seed:0,check:s=>todayFlag(s,'early')>=1&&todayFlag(s,'skip')===0&&s.stats.study>=90},
 {id:'hard-balanced-fortnight',seed:0,check:s=>G.completedDays(s)>=14&&s.stats.energy>=90&&s.stats.study>=95&&s.stats.money>=40},
 {id:'hard-library-maker',seed:0,check:s=>G.completedDays(s)>=21&&s.flags.library>=3&&s.flags.maker>=3&&s.stats.study>=90},
 {id:'hard-perfect-month',seed:5,check:s=>G.completedDays(s)>=30&&s.stats.energy>=95&&s.stats.study>=95&&s.stats.money>=80}
];
const results=[];
for(const {id,seed,check}of scenarios){
 const sample=reach(id,seed);
 assert.equal(sample.phase,'dayEnd');
 assert.equal(sample.failed,null);
 assert.equal(sample.log.filter(e=>e.day===sample.day).length,8,'样本必须真实完成当天八幕');
 assert(check(sample),id+'样本满足完整门槛');
 assert(G.valid(sample),id+'成功样本必须通过完整存档重演');
 const restored=G.restore(JSON.parse(JSON.stringify(sample)));
 assert(restored,id+'刷新后仍能恢复成功样本');
 assert(G.achievements(restored).some(e=>e.id===id),id+'刷新后仍能识别成就');
 assert.deepEqual(C.unlocked(sample,sample.day-1),[],'未确认完整天数时不能解锁');
 assert.deepEqual(C.unlocked({...sample,failed:'fail-study',phase:'ending'},sample.day),[],'失败时不能新解锁挑战');
 assert(!G.achievements(G.continueDay(sample)).some(e=>e.id===id),'进入下一天时不能提前解锁当天挑战');
 results.push({id,seed,day:sample.day});
}
console.log(JSON.stringify({passed:true,reachableChallenges:results}));
