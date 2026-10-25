const assert=require('node:assert/strict'),G=require('../dist/campus-life.js'),B=require('../dist/wellness.js'),W=require('./wellness.cjs');
function legacyBugs(){
 let courseBefore,courseAfter,mouseBefore;
 const course={...B,choose(s,i){if(s.eventId==='term-deadline'&&s.term.missed<2){if(s.term.missed===1)courseBefore=s;const n=B.choose(s,3);if(n.term.missed===2)courseAfter=n;return n;}return B.choose(s,i);}};
 W.run(course,0,22,false);
 const mouse={...B,next(s){const n=B.next(s);if(!mouseBefore&&s.outcome?.eventId.startsWith('meal-')&&n.eventId?.startsWith('well-mouse-')&&n.eventId!=='well-mouse-canteen')mouseBefore=s;return n;}};
 W.run(mouse,2,24,false);assert(courseBefore&&courseAfter&&mouseBefore);return{courseBefore,courseAfter,mouseBefore};
}
function collect(limit=16){
 const seen=new Map(),states=[];let submitted=0,jobApplied=0;
 for(let seed=0;seed<limit;seed++){
  const proxy={...G,getScene(s){const scene=G.getScene(s);if(s.phase==='choice'&&s.eventId.startsWith('uni-'))seen.set(s.eventId,s);return scene;},choose(s,i){const options=G.getScene(s).choices,k=options.findIndex(c=>(c.submitPhoto||c.applyJob)&&!c.disabledReason&&(c.mods.money||0)>=-s.stats.money);if(k>=0){if(options[k].submitPhoto)submitted++;if(options[k].applyJob)jobApplied++;return G.choose(s,k);}return G.choose(s,i);}};
  states.push(W.run(proxy,seed,16,seed<2).s);
 }
 return{seen,states,submitted,jobApplied};
}
function fixtures(){const c=collect(12);assert(c.seen.size>=18);return{...c,newCampus:c.seen.get('uni-photo-call')||c.seen.values().next().value,followUp:c.seen.get('uni-photo-result')||c.seen.get('uni-job-reply')};}
function checks(){
 assert.equal(G.eventCount,145);assert.equal(new Set(G.events.map(e=>e.id)).size,G.events.length);
 const old=legacyBugs();assert(B.valid(old.courseAfter));assert.equal(old.courseAfter.failed,null);assert.equal(old.courseAfter.term.missed,2);assert.deepEqual(G.restore(old.courseAfter),old.courseAfter);
 const before=G.enableCampus(old.courseBefore),failed=G.choose(before,3);assert.equal(failed.failed,'fail-course');assert(G.valid(failed));assert.equal(G.next(failed).phase,'ending');assert.equal(G.ending(G.next(failed)).id,'fail-course');
 const repaired=G.enableCampus(old.courseAfter);assert.equal(repaired.phase,'ending');assert.equal(repaired.failed,'fail-course');assert.deepEqual(repaired.log,old.courseAfter.log);assert.deepEqual(repaired.stats,old.courseAfter.stats);assert(G.valid(repaired));
 const mouse=G.next(G.enableCampus(old.mouseBefore));assert.equal(mouse.eventId,'well-mouse-canteen');assert(G.valid(mouse));assert.equal(G.getScene(mouse).place,'食堂');
 const result=collect(36);assert.equal(result.seen.size,20,'20个新增场景和后续都可实际触发');assert(result.submitted&&result.jobApplied);
 let choices=0;for(const[id,s]of result.seen){assert(G.valid(s),id);const scene=G.getScene(s);assert(scene.choices.some(c=>!c.disabledReason&&(c.mods.money||0)>=-s.stats.money));
  for(let i=0;i<scene.choices.length;i++){const c=scene.choices[i];if(c.disabledReason||(c.mods.money||0)<-s.stats.money)continue;const n=G.choose(s,i);assert(G.valid(n),id+'/'+i);assert.deepEqual(G.restore(JSON.parse(JSON.stringify(n))),n);assert.throws(()=>G.choose(n,i));choices++;}
 }
 for(const s of result.states){assert(G.valid(s));const days=new Set(s.log.filter(e=>e.step===7).map(e=>e.day));for(const day of days){const log=s.log.filter(e=>e.day===day);for(const id of ['meal-breakfast','meal-lunch','meal-dinner'])assert.equal(log.filter(e=>e.eventId===id).length,1);assert.equal(log.filter(e=>e.step===7).length,1);let end=0;for(const e of log){const[h,m]=e.time.split(':').map(Number),at=h*60+m;assert(at>=end,'事件时间不能倒退或重叠');end=at+(e.minutes||0);}}
  for(const id of ['uni-photo-result','uni-job-reply']){const count=s.log.filter(e=>e.eventId===id).length;const applied=s.log.filter(e=>e.eventId===(id==='uni-photo-result'?'uni-photo-call':'uni-campus-job')&&e.index===(id==='uni-photo-result'?0:1)).length;assert(count<=applied,'一次申请只对应一次结果');}
 }
 assert(result.states.some(s=>s.day>=14&&!s.failed),'仍然保留有计划活过两周的路线');
 const prior=require('./fixtures/v6-wellness.json');assert.deepEqual(G.restore(prior),prior);const up=G.enableCampus(prior);assert(G.valid(up));assert.deepEqual(up.stats,prior.stats);assert.deepEqual(up.log,prior.log);
 console.log(JSON.stringify({passed:true,newEvents:20,runs:36,choiceRoutes:choices,courseFailure:true,mouseContext:true,followups:true,timeOrder:true,oldSaves:true}));return result;
}
if(require.main===module)checks();module.exports={fixtures,checks,legacyBugs};
