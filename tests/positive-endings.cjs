'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../dist/positive-endings.js'),B=require('../dist/wallet.js');
const Expansion=require('../dist/campus-expansion.js'),LifeTests=require('./wellness.cjs');
const clone=value=>JSON.parse(JSON.stringify(value));
const ids=s=>G.availablePositiveEndings(s).map(item=>item.id);
const researchRuns=new Map();

// Real actions reach this state. The school/wallet/practice upgrades are added
// at the day boundary, so the test also exercises an upgraded historical run.
function realResearch(legacy=false){
 if(researchRuns.has(legacy))return clone(researchRuns.get(legacy));
 const proxy={...Expansion,
  create:(seed,traits,name)=>Expansion.create(seed,['brain','budget','athletic'],name),
  next(s){
   const acts=Expansion.availableActivities(s),allowed=id=>acts.some(a=>a.id===id&&!a.disabledReason);
   let key=['vaccine','psych','clinic'].find(allowed);
   if(!key&&s.stats.study>=75&&!s.campusLife.joined&&allowed('lab-apply'))key='lab-apply';
   if(!key&&s.log.filter(row=>row.campusActivity==='lab-work').length<18&&s.stats.energy>=35&&allowed('lab-work'))key='lab-work';
   return key?Expansion.startActivity(s,key==='lab-work'&&!legacy?Expansion.researchVisitKey:key):Expansion.next(s);
  },
  choose(s,index){
   if(s.eventId==='campus83-lab-work')index=s.log.filter(row=>row.campusActivity==='lab-work').length%3;
   return Expansion.choose(s,index);
  }
 };
 const endDay=legacy?14:20;
 let s=LifeTests.run(proxy,1,endDay).s;
 assert.equal(s.phase,'dayEnd');assert.equal(s.day,endDay);
 assert(G.availablePositiveEndings(s,legacy?1:2).some(e=>e.id==='ending-research'));
 assert(G.valid(s),'真实科研路线可按历史规则重放');
 s=G.enableCampusJobs(s);s=G.enableUnlimitedMoney(s);s=G.enableSchool(s,'cs');s=G.enableMajorLife(s);s=G.enableTalentEffects(s);
 assert(s.wallet&&s.school&&s.majorLife,'升级后包含完整钱包、课表与专业实践层');
 assert(G.valid(s),'升级后的科研日终仍可精确回放');
 researchRuns.set(legacy,clone(s));return clone(s);
}

function allDirections(){
 const attendance=Array.from({length:20},(_,i)=>({day:Math.floor(i/2)+1,eventId:'school-'+i,schoolLessonId:'lesson-'+i,schoolCourse:'cs101',schoolStatus:i%2?'late':'attended'}));
 const join={day:16,eventId:'campus83-lab-apply',campusActivity:'lab-apply',index:0};
 const lab=Array.from({length:12},(_,i)=>({day:Math.floor(i/2)+17,eventId:'campus83-lab-work',campusActivity:'lab-work',index:i%3,researchGain:9}));
 const confession={day:18,eventId:'love-confession',index:0,intimacyChange:0};
 const promises=Array.from({length:5},(_,i)=>({day:19+i,eventId:'love-bond-keep',index:0,intimacyChange:0}));
 return{day:30,phase:'dayEnd',failed:null,name:'边界样本',seed:1,stats:{energy:90,study:95,health:80,mood:80,charm:70,money:200,social:70},
  term:{passed:3,missed:0},campusLife:{joined:true},romance:{connected:true,dating:true,intimacy:95,earnedDay:18},
  relationships:{known:['activity','taste'],strain:0,kept:5},log:[...attendance,join,...lab,confession,...promises].sort((a,b)=>a.day-b.day)};
}

function checks(){
 assert.equal(G.positiveEndings.length,3);assert.equal(new Set(G.positiveEndings.map(x=>x.id)).size,3);
 const legacy=require('./fixtures/v2-saves.json')[0].save;
 assert.deepEqual(G.restore(clone(legacy)),B.restore(clone(legacy)),'未达标旧存档原样交给原引擎');
 assert.deepEqual(G.restore(clone(require('./fixtures/v6-evolution.json'))),B.restore(clone(require('./fixtures/v6-evolution.json'))));
 const all=allDirections(),unchanged=clone(all);
 assert.deepEqual(ids(all),['ending-graduation','ending-research','ending-together'],'同时达成时保留全部方向，不隐式抢占结局');
 assert.deepEqual(all,unchanged,'条件查询保持只读');
 for(const id of ids(all)){
  const final=G.finishPositive(all,id);assert.equal(final.finalEnding,id);assert.equal(G.ending(final).id,id);
  assert.equal(G.positiveEndingReport(final).id,id);assert.deepEqual(G.resumePositive(final),all);
  assert.equal(G.restore(final),null,'边界用的人工经历不可冒充可回放真实存档');
 }
 for(const extra of [{phase:'choice'},{phase:'outcome'},{phase:'ending'},{failed:'fail-health'},{lottery:{won:true}}]){
  const s={...all,...extra};assert.deepEqual(ids(s),[]);assert.throws(()=>G.finishPositive(s,'ending-research'));
 }
 for(const key of ['energy','study','health','mood'])assert.deepEqual(ids({...all,stats:{...all.stats,[key]:0}}),[]);
 assert.throws(()=>G.finishPositive(all,'unknown'));assert.throws(()=>G.resumePositive(all));
 assert(!ids({...all,day:20}).includes('ending-graduation'));
 assert(!ids({...all,term:{passed:3,missed:1}}).includes('ending-graduation'));
 assert(!ids({...all,term:{passed:2,missed:0}}).includes('ending-graduation'));
 assert(!ids({...all,stats:{...all.stats,study:79}}).includes('ending-graduation'));
 const attendance=all.log.map(row=>row.schoolCourse?{...row,day:1}:row);
 assert(!ids({...all,log:attendance}).includes('ending-graduation'),'同日20节记录不等同于跨10天到课');
 const duplicate=all.log.map(row=>row.schoolCourse?{...row,schoolLessonId:'same-lesson',day:1}:row);
 assert(!ids({...all,log:duplicate}).includes('ending-graduation'),'重复课堂条目不会重复计课');
 assert(!ids({...all,log:all.log.map(row=>row.schoolCourse?{...row,schoolStatus:'absent'}:row)}).includes('ending-graduation'));
 for(const extra of [{day:29},{campusLife:{joined:false}}])assert(!ids({...all,...extra}).includes('ending-research'));
 assert(ids({...all,stats:{...all.stats,study:80,health:45}}).includes('ending-research'),'结局直接检查科研经历和进度');
 const labs=all.log.filter(row=>row.campusActivity==='lab-work'),changeLabs=fn=>all.log.map(row=>labs.includes(row)?fn(row):row).filter(Boolean);
 assert(!ids({...all,log:changeLabs(row=>row===labs[0]?null:row)}).includes('ending-research'),'进度满但只做过11次');
 assert(!ids({...all,log:changeLabs(row=>({...row,researchGain:4}))}).includes('ending-research'),'次数够但进度不足');
 assert(ids({...all,log:changeLabs(row=>({...row,index:0}))}).includes('ending-research'),'实验室活动种类由玩家自行选择');
 assert(!ids({...all,log:all.log.map(row=>row.campusActivity==='lab-work'?{...row,index:3}:row)}).includes('ending-research'),'取消实验室活动不计经历');
 for(const extra of [{romance:{...all.romance,dating:false}},{romance:{...all.romance,connected:false}},{romance:{...all.romance,intimacy:89}},{romance:{...all.romance,earnedDay:24}},{relationships:{...all.relationships,strain:1}},{relationships:{...all.relationships,known:['activity']}},{stats:{...all.stats,charm:59}},{stats:{...all.stats,mood:64}}])assert(!ids({...all,...extra}).includes('ending-together'));
 assert(ids(all).includes('ending-together'),'满亲密度时零增益的认真履约依然计数');
 assert(!ids({...all,log:all.log.map(row=>row.eventId==='love-bond-keep'?{...row,day:19}:row)}).includes('ending-together'),'同日刷约定不算跨5天');
 const newRelationship={...all,day:32,romance:{...all.romance,earnedDay:24},relationships:{...all.relationships,kept:100},log:[...all.log,{day:24,eventId:'love-naifen-confession',index:0,intimacyChange:0}]};
 assert(!ids(newRelationship).includes('ending-together'),'前一段关系的约定不能抵扣本次交往经历');

 const base=realResearch(),before=clone(base),final=G.finishPositive(base,'ending-research');
 assert.deepEqual(base,before,'结束时不修改日终输入');assert(G.valid(final));assert.deepEqual(G.restore(clone(final)),final);
 assert.equal(G.ending(final).name,'顶刊大佬');assert.equal(final.phase,'ending');assert.equal(final.failed,null);
 const historical=realResearch(true),oldFinal={...historical,phase:'ending',failed:null,finalEnding:'ending-research',positiveEnding:{revision:1,id:'ending-research',base:clone(historical)}};
 assert.deepEqual(G.restore(clone(oldFinal)),oldFinal);
 assert.equal(G.ending(oldFinal).name,'科研成功');
 assert.equal(G.researchStatus(historical).visits,18);
 assert(!G.researchStatus(historical).ready,'旧活动可折算进度，入组天数仍从入组当天计算');
 const {until}=require('./admission.cjs');
 let player=G.choose(G.createCampus(72,['brain','regularSleep','slowWarm'],'科研测试','admitted'),0);
 assert.equal(G.researchStatus(player),null);
 player=G.next(G.choose(G.startActivity(player,'lab-apply'),0));
 player=until(player,s=>s.phase==='outcome'&&G.availableActivities(s).some(a=>a.id==='lab-work'&&!a.disabledReason));
 const visit=G.startActivity(player,'lab-work'),worked=G.choose(visit,0);
 assert.deepEqual(G.researchStatus(G.choose(visit,3)),G.researchStatus(player),'取消不会记次数或进度');
 assert.deepEqual(G.restore(clone(worked)),worked);
 assert.equal(G.researchStatus(worked).progress,worked.outcome.researchGain);
 const gain=(study,mood,seed=visit.seed)=>G.choose({...visit,seed,stats:{...visit.stats,study,mood}},0).outcome.researchGain;
 const low=gain(0,0);
 assert.equal(gain(100,0),low+3);
 assert.equal(gain(0,100),low+3);
 assert.equal(gain(100,100),low+6);
 assert(new Set(Array.from({length:16},(_,seed)=>gain(50,50,seed))).size>1);
 const corrupt=clone(worked);corrupt.log.at(-1).researchGain++;
 assert.equal(G.restore(corrupt),null);
 const draftResearcher=G.identities.find(i=>i.id==='researcher');
 assert.equal(draftResearcher.name,'先天科研圣体');
 assert(!draftResearcher.gold);
 assert(Array.from({length:40},(_,seed)=>G.identityDraft(seed)).some(draft=>draft.includes('researcher')));
 let researcher=G.createCampus(72,['gold-brain','gold-battery','optimist'],'身份加成','researcher');
 assert.equal(G.labThreshold(researcher),75);
 researcher=until(researcher,s=>G.availableActivities(s).some(a=>a.id==='lab-apply'&&!a.disabledReason));
 researcher=G.next(G.choose(G.startActivity(researcher,'lab-apply'),0));
 researcher=until(researcher,s=>G.availableActivities(s).some(a=>a.id==='lab-work'&&!a.disabledReason));
 const researcherVisit=G.startActivity(researcher,'lab-work');
 const regularGain=G.choose({...researcherVisit,admission:{...researcherVisit.admission,id:'local'}},0).outcome.researchGain;
 const boosted=G.choose(researcherVisit,0);
 assert.equal(boosted.outcome.researchGain,regularGain*13/10);
 assert.equal(G.researchStatus(boosted).progress,boosted.outcome.researchGain);
 assert.deepEqual(G.restore(clone(boosted)),boosted);
 assert.equal(final.actions.length,base.actions.length);assert.deepEqual(final.wallet,base.wallet,'新结局不写入原钱包动作时间线');
 const proof=G.positiveEndingReport(final);assert(proof.facts.some(f=>f.includes('实验室活动 18 次')));assert.equal(proof.player,base.name);
 const reportBefore=clone(final);G.positiveEndingReport(final);G.availablePositiveEndings(final);G.achievements(final);assert.deepEqual(final,reportBefore);
 assert.deepEqual(G.availableActivities(final),[]);
 for(const key of ['upgradeTimetable','enableCampusJobs','enableUnlimitedMoney','enableMajorLife','enableTalentEffects'])assert.strictEqual(G[key](final),final,'终局中的自动升级保持原样 '+key);
 for(const [key,args] of [['choose',[0]],['next',[]],['continueDay',[]],['retire',[]],['startActivity',['study']],['startMajor',[]]])assert.throws(()=>G[key](final,...args),'终局不可直接执行日常动作 '+key);
 const resumed=G.resumePositive(final);assert.deepEqual(resumed,base);assert(!resumed.positiveEnding);assert(G.valid(resumed));
 const next=G.continueDay(resumed);assert.equal(next.day,base.day+1);assert(G.valid(next),'继续后仍能按学校与钱包规则回放');
 const detached=G.resumePositive(final);detached.stats.money++;assert.deepEqual(final,reportBefore,'继续游玩返回独立副本');
 for(const mutate of [
  x=>{x.finalEnding='ending-together';},x=>{x.positiveEnding.id='ending-together';},x=>{x.phase='dayEnd';},x=>{x.failed='fail-health';},
  x=>{x.stats.study--;},x=>{x.positiveEnding.base.stats.study++;},x=>{x.positiveEnding.base.log.pop();},
  x=>{x.positiveEnding.revision=3;},x=>{delete x.positiveEnding.base;},x=>{x.positiveEnding.base=clone(final);},x=>{x.unexpected=true;}
 ]){const bad=clone(final);mutate(bad);assert.equal(G.restore(bad),null,'篡改外层或基础快照必须被拒绝');}
 assert.equal(G.positiveEndingReport({...final,finalEnding:'ending-together'}),null);
 const ctx={DormGame:B};ctx.globalThis=ctx;vm.runInNewContext(fs.readFileSync(require.resolve('../dist/positive-endings.js'),'utf8'),ctx);
 assert.equal(ctx.DormGame.positiveEndings.length,3);assert.deepEqual(clone(ctx.DormGame.finishPositive(base,'ending-research')),final);
 console.log('Positive endings passed: three independent routes, cross-day and relationship boundaries, real research replay, wallet/school/practice upgrades, snapshot tampering, and exact continuation.');
 return{research:base,final};
}
if(require.main===module)checks();
module.exports={checks,realResearch};
