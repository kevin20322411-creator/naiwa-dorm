const assert=require('node:assert/strict'),G=require('../dist/semester.js'),B=require('../dist/survival.js');
function score(s,c){
 const target={energy:48,money:28,social:40,study:65,health:60,mood:45},base={energy:.45,money:.8,social:.35,study:.85,health:.8,mood:.25};let v=0;
 for(const[k,w]of Object.entries(base)){const a=c.mods[k]||0,need=Math.max(0,target[k]-s.stats[k])/target[k];v+=a*w*(1+need*4);if(a>0)v-=Math.max(0,s.stats[k]+a-(k==='money'?150:100))*w;if(['energy','study','health'].includes(k)&&s.stats[k]+a<=0)v-=10000;}
 const t=G.task(s);if(t.progress<t.target)v+=(c.project||0)*(.4+1.8/t.daysLeft);if(c.submit)v+=200;if(c.miss)v-=150;return v;
}
function run(seed,policy='planned',limit=28){
 let s=G.create(seed,['brain','toolkit'],'挑战检查'),turn=0;const checkpoints=[];
 while(s.phase!=='ending'&&++turn<600){
  if(s.phase==='choice'){
   const scene=G.getScene(s),opts=scene.choices.map((c,i)=>({c,i})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-s.stats.money);assert(opts.length,'不能出现全部选项不可用');
   const o=policy==='random'?opts[Math.floor(G.rng(seed+turn*79)()*opts.length)]:opts.sort((a,b)=>score(s,b.c)-score(s,a.c))[0];s=G.choose(s,o.i);
  }else if(s.phase==='outcome')s=G.next(s);else{checkpoints.push(s);if(s.day>=limit)break;s=G.continueDay(s);}
 }
 return {s,checkpoints};
}
assert.equal(G.eventCount,new Set(G.events.map(e=>e.id)).size);assert.equal(G.endings.length,41);
const initial=G.create(42,['brain','toolkit'],'存档检查');assert.equal(initial.version,6);assert.deepEqual(G.restore(initial),initial);
const meal=G.getScene(initial);assert.equal(meal.choices.length,5);
assert(meal.choices.some(c=>(c.mods.money||0)===0&&!c.flags.missedMeal));
for(const c of meal.choices.filter(c=>(c.mods.money||0)===0&&!c.flags.missedMeal))assert((c.mods.social||0)<0||(c.mods.study||0)<0,'免费餐必须付出时间或人情');
const snapshot=JSON.stringify(initial);G.getScene(initial);assert.equal(JSON.stringify(initial),snapshot,'展示选项不应修改存档');
const classState={...initial,step:1,eventId:'base-1'},classScene=G.getScene(classState),studyIndex=classScene.choices.findIndex(c=>c.mods.study>0);assert(studyIndex>=0);
const tiredScene=G.getScene({...classState,log:[{day:1,eventId:'meal-reunion',changes:{study:8}}]});assert.equal(tiredScene.choices[studyIndex].mods.energy,classScene.choices[studyIndex].mods.energy-2);
const sadScene=G.getScene({...classState,stats:{...initial.stats,mood:20}});assert(sadScene.choices[studyIndex].mods.study<classScene.choices[studyIndex].mods.study);
const due={...initial,day:7,step:7,eventId:'term-deadline',stats:{energy:70,money:40,social:60,study:100,health:80,mood:70}};
assert.throws(()=>G.choose(due,0),/课设/);assert.throws(()=>G.choose(due,1),/课设/);
const firstMiss=G.choose(due,3);assert.equal(firstMiss.term.missed,1);assert(!firstMiss.failed);
const second=G.choose({...due,day:14,term:{...firstMiss.term}},3);assert.equal(second.failed,'fail-course');const ended=G.next(second);assert.equal(G.ending(ended).id,'fail-course');assert(G.achievements(ended).some(e=>e.id==='fail-course'));
const short={...due,term:{...initial.term,progress:115}},rescue=G.getScene(short).choices;assert(!rescue[1].disabledReason);assert(G.choose(short,1).term.passed===1);assert.equal(G.choose(short,1).stats.energy,46);
assert(G.getScene({...short,stats:{...short.stats,health:10}}).choices[1].disabledReason);
assert(G.getScene({...due,term:{...initial.term,progress:100},stats:{...due.stats,social:39}}).choices[2].disabledReason);
assert.throws(()=>G.choose({...due,term:{...initial.term,progress:100},stats:{...due.stats,money:0}},2),/饭钱/);
const passed=G.next(G.choose({...due,term:{...initial.term,progress:140}},0));assert.equal(passed.phase,'dayEnd');const following=G.continueDay(passed);assert.equal(following.day,8);assert.equal(following.term.progress,0);assert.equal(G.task(following).target,175);
const v5=B.create(91,['brain','toolkit'],'旧档');assert.deepEqual(G.restore(v5),v5);assert.equal(G.getScene(v5).choices[0].mods.energy,B.getScene(v5).choices[0].mods.energy);
for(const f of [...require('./fixtures/v2-saves.json'),...require('./fixtures/v3-saves.json')])assert.deepEqual(G.restore(f.save),B.restore(f.save));
const data={random:[],planned:[]};const crisisDays=new Set();let success,clutch;
for(const policy of Object.keys(data))for(let seed=0;seed<300;seed++){
 const {s,checkpoints}=run(seed,policy);data[policy].push(s);
 if(seed<8){assert(G.valid(s));for(const point of checkpoints)assert(G.valid(point));}
 for(const log of s.log.filter(e=>e.eventId.startsWith('term-')&&e.eventId!=='term-deadline'))crisisDays.add(log.day%7+':'+log.step);
 if(s.term.bestStreak>=3)success=s;if(s.term.clutch&&s.term.passed)clutch=s;
}
assert(crisisDays.size>=6,'突发状况应出现在不同日期和时段');assert(success);assert(clutch);
assert(G.achievements(success).some(e=>e.id==='course-streak'));assert(G.achievements(clutch).some(e=>e.id==='course-clutch'));
const altered=JSON.parse(JSON.stringify(initial));altered.term.progress=999;assert.equal(G.restore(altered),null);
const planned28=data.planned.filter(s=>G.completedDays(s)>=28).length,random14=data.random.filter(s=>G.completedDays(s)>=14).length;
assert(planned28>=75,'规划路线应存在长期生存空间');assert(planned28<295,'规划也不能保证每局安稳通关');assert(random14<30,'无规划选择不应长期稳定生存');
console.log(JSON.stringify({passed:true,runs:600,planned28,random14,variableCrisisSlots:crisisDays.size,legacyCompatible:true}));
