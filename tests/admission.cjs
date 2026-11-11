const assert=require('node:assert/strict'),G=require('../dist/positive-endings'),B=require('../dist/wallet');
const clone=x=>JSON.parse(JSON.stringify(x));
function pick(s){const scene=G.getScene(s),candidates=scene.choices.map((c,i)=>({c,i,score:Object.entries(c.mods||{}).reduce((score,[k,v])=>score+v*(k==='money'?.06:k==='study'?1:k==='mood'?.8:1.2),0)})).filter(x=>!x.c.disabledReason&&(x.c.mods.money||0)>=-s.stats.money);for(const x of candidates){for(const k of ['energy','health','study','mood']){if(s.stats[k]+(x.c.mods[k]||0)<=0)x.score-=10000;if(s.stats[k]<40)x.score+=(x.c.mods[k]||0)*2;}if(x.c.submit)x.score+=1000;if(x.c.miss)x.score-=1000;}candidates.sort((a,b)=>b.score-a.score);assert(candidates.length,scene.id);return candidates[0].i;}
function step(s){if(s.miniGames?.pending){const p=s.miniGames.pending;return G.completeMini(s,{'mini-runner':1,'mini-basket':3,'mini-badminton':6}[p.key]||0);}if(s.majorLife?.pending)return G.skipMajor(s);if(s.phase==='choice')return G.choose(s,pick(s));if(s.phase==='outcome')return G.next(s);if(s.phase==='dayEnd')return G.continueDay(s);return s;}
function until(s,test,max=700){for(let i=0;i<max;i++){if(test(s))return s;if(s.phase==='ending')break;s=step(s);}throw Error('Target not reached '+JSON.stringify({day:s.day,phase:s.phase,failed:s.failed,stats:s.stats}));}
const create=(id,traits=['gold-brain','gold-battery','optimist'],seed=4)=>G.createCampus(seed,traits,'身份测试',id);
function checkFanBook(){
 const fresh=create('celebrity',undefined,72),{fanBook,...admission}=fresh.admission;
 // Rebuild a save from before the revised contact rules without altering its game progress.
 const legacy={...fresh,admission:{...admission,moves:admission.moves.slice(0,-1)}};
 assert(G.valid(legacy));
 let run=G.choose(G.enableFanBook(legacy),0);
 const [first,second]=run.admission.contacts;
 for(const contact of [first,second])run=G.respondFan(run,contact.id,true);
 run=G.choose(G.startActivity(run,'bond-plan'),0);
 const dueDay=run.relationships.promise.dueDay,intimacy=run.romance.intimacy;
 run=G.focusContact(until(G.next(run),G.canManageFans),second.id);
 run=until(run,s=>s.phase==='dayEnd'&&s.day===dueDay);
 assert(G.valid(run));
 assert(G.continueDay(run).admission.contacts.find(c=>c.id===first.id).relationships.promise,'旧版存档按当时的规则回放');
 run=G.enableFanBook(run,2);
 const preview=G.restPreview(run),next=G.continueDay(run);
 const inactive=next.admission.contacts.find(c=>c.id===first.id);
 assert.equal(inactive.relationships.promise,null);
 assert.equal(inactive.romance.intimacy,intimacy-8);
 assert.equal(next.romance.intimacy,run.romance.intimacy);
 assert.equal(next.stats.mood,preview.stats.mood);
 assert.equal(next.stats.money,preview.stats.money);
 const expired=s=>s.log.filter(e=>e.eventId==='love-bond-missed'&&e.fanContactId===first.id);
 assert.equal(expired(next).length,1);
 const following=until(next,s=>s.day===next.day+1);
 assert.equal(expired(following).length,1);
 assert(G.valid(following));
 const free=until(next,s=>G.canManageFans(s)&&G.freeMinutes(s)>=15);
 const repair=G.startActivity(G.focusContact(free,first.id),'bond-repair');
 const goodbye=G.choose(repair,3);
 assert.equal(goodbye.admission.partnerId,null);
 assert.equal(G.getScene(goodbye).id,'love-bond-repair','主动结束关系后仍可查看本次结果');
 assert.equal(G.next(goodbye).relationships.pending,null);
 assert(G.valid(goodbye));

 let separate=G.respondFan(G.choose(fresh,0),first.id,true);
 for(let i=0;i<400&&separate.romance.connected&&separate.phase!=='ending';i++){
  if(G.canManageFans(separate)&&G.availableActivities(separate).some(a=>a.id==='ask-chat')){
   const chat=G.startActivity(separate,'ask-chat');
   const bad=G.getScene(chat).choices.findIndex(c=>c.affection<0&&!c.disabledReason);
   if(bad>=0){separate=G.choose(chat,bad);continue;}
  }
  separate=step(separate);
 }
 assert.equal(separate.romance.connected,false);
 assert.equal(separate.admission.partnerId,null);
 assert.equal(separate.admission.contacts.find(c=>c.id===first.id).romance.connected,false);
 assert(G.valid(separate));
 for(let i=0;i<400&&separate.phase!=='ending'&&!separate.outcome?.contactAdded;i++){
  separate=separate.phase==='choice'&&separate.eventId==='love-encounter'?G.choose(separate,0):step(separate);
 }
 assert(separate.outcome?.contactAdded);
 assert.equal(separate.admission.partnerId,null);
 assert.equal(separate.admission.contacts.find(c=>c.id===first.id).romance.connected,false);
 assert(G.valid(separate));
 console.log('Fan book passed: inactive promise expiry, forecast agreement, legacy replay, and distinct reconnection.');
}
function checkRetiredAttendancePlan(){
 const legacy=require('../dist/admission');
 assert.equal(G.planCourseAttendance,undefined);
 const fresh=create('blogger',undefined,70);
 assert.equal(G.enableAttendancePlanRemoval(fresh),fresh);
 const plan=legacy.planCourseAttendance(fresh,'all','attend');
 assert(G.valid(plan));
 const afterBreakfast=legacy.choose(plan,0);
 const manual=G.next(afterBreakfast);
 assert.equal(manual.phase,'choice');
 assert(manual.school.pending);
 assert.equal(manual.school.attendancePlan,undefined);
 assert(G.valid(manual));

 const completed=legacy.next(afterBreakfast);
 assert.equal(completed.outcome.schoolAutoPlan,'attend');
 assert(G.valid(completed));
 const resumed=G.enableAttendancePlanRemoval(G.restore(clone(completed)));
 assert.equal(resumed.school.attendancePlan,undefined);
 assert.deepEqual(resumed.school.attendance,completed.school.attendance);
 assert.deepEqual(resumed.stats,completed.stats);
 assert(G.valid(resumed));
 const following=until(resumed,s=>s.phase==='choice'&&s.school.pending);
 assert.equal(following.school.pending.notice,undefined);
 assert(G.valid(following));

 const invite=legacy.next(legacy.choose(legacy.planCourseAttendance(create('blogger',undefined,81),'all','attend'),0));
 assert.equal(invite.school.pending.notice,'invite');
 assert(G.valid(invite));
 const pending=G.enableAttendancePlanRemoval(G.restore(clone(invite)));
 assert.equal(pending.school.pending.notice,undefined);
 assert(!G.getScene(pending).choices.some(c=>c.schoolChoice==='invite'));
 assert(G.valid(G.choose(pending,0)));
 console.log('Retired attendance plan passed: manual flow, legacy history and pending lesson migration.');
}
function checks(){
 checkFanBook();
 checkRetiredAttendancePlan();
 assert.equal(G.identities.length,10);assert.equal(G.goldenTraits.length,5);assert.equal(G.labels.money,'生活费');
 const count=new Map(G.identities.map(x=>[x.id,0]));for(let seed=0;seed<20000;seed++){const batch=G.identityDraft(seed);assert.equal(batch.length,3);assert.equal(new Set(batch).size,3);for(const id of batch)count.set(id,count.get(id)+1);}
 for(const i of G.identities){const rate=count.get(i.id)/60000;assert(Math.abs(rate-(i.gold?.05:.85/7))<.007,i.id+' '+rate);}
 for(let seed=0;seed<400;seed++){const first=G.talentDraft(seed),second=G.talentDraft(seed+1,first.slice(0,2),first);assert.equal(first.length,6);assert.equal(second.length,6);assert.equal(new Set(first.map(G.identityFamily)).size,6);assert(second.every(id=>!first.slice(0,2).map(G.identityFamily).includes(G.identityFamily(id))));}
 for(const id of G.identities.map(x=>x.id)){const s=create(id),before=clone(s);assert(G.valid(s));assert.deepEqual(G.restore(clone(s)),s);assert.deepEqual(s,before);assert(s.stats.money>150);}
 const neutral=['chosen','flirt','optimist'],base=B.create(2,neutral,'x',[],'freshman','cs'),fresh=G.createCampus(2,neutral,'x','rich');assert.equal(fresh.stats.money-base.stats.money,1260);
 const celebrity=create('celebrity');assert.equal(celebrity.stats.charm,100);assert([2,3].includes(celebrity.admission.contacts.length));assert.deepEqual(create('celebrity').admission.contacts,celebrity.admission.contacts);
 let fanReady=G.choose(celebrity,0),fan=fanReady.admission.contacts[0],next=G.respondFan(fanReady,fan.id,true);assert(G.valid(next));assert(next.admission.contacts.find(x=>x.id===fan.id).status==='known');assert(next.romance.connected);assert.throws(()=>G.respondFan(next,fan.id,true));const fan2=next.admission.contacts[1];next=G.respondFan(next,fan2.id,true);next=G.focusContact(next,fan2.id);assert.equal(next.admission.partnerId,fan2.id);assert(G.valid(next));
 const classmate=create('classmate');assert(classmate.romance.connected);assert.equal(classmate.romance.intimacy,20);assert.equal(classmate.relationships.known.length,1);
 let local=G.createCampus(72,neutral,'x','local'),other=G.createCampus(72,neutral,'x','blogger');const ls=G.getScene(local),os=G.getScene(other),idx=ls.choices.findIndex(c=>c.outside&&!c.disabledReason);assert(idx>=0);assert.equal(-ls.choices[idx].mods.money,Math.round(-os.choices[idx].mods.money*.9));local=G.choose(local,idx);other=G.choose(other,idx);assert.equal(local.outcome.minutes,20);assert.equal(other.outcome.minutes,30);assert.equal(other.rhythm.clock-local.rhythm.clock,10);assert(G.valid(local));assert(G.valid(other));
 let competitor=G.choose(G.createCampus(72,neutral,'x','competitor'),0);for(let i=0;i<3;i++){competitor=G.startMajor(competitor);competitor=G.majorAct(competitor,'set',{field:'patch',value:'correct'});competitor=G.majorAct(competitor,'run');assert.equal(competitor.outcome.changes.money,20);assert(G.valid(competitor));}assert.equal(competitor.admission.chapters.length,3);
 let tutor=until(create('admitted'),s=>s.phase==='outcome'&&G.availableActivities(s).some(x=>x.id==='work-tutor'&&!x.disabledReason));const tutorBefore=clone(tutor);tutor=G.startActivity(tutor,'work-tutor');assert.equal(G.getScene(tutor).choices[0].mods.money,160);tutor=G.choose(tutor,0);assert.equal(tutor.outcome.changes.money,160);assert.equal(tutor.outcome.changes.energy,-40+(tutor.outcome.mealRecovery?.energy||0));assert(G.valid(tutor));assert(!G.availableActivities(G.next(tutor)).some(x=>x.id==='work-tutor'&&!x.disabledReason));assert.deepEqual(G.choose(G.startActivity(tutorBefore,'work-tutor'),1).stats,tutorBefore.stats);
 assert(!G.availableActivities({...tutorBefore,stats:{...tutorBefore.stats,study:80}}).find(x=>x.id==='work-tutor'&&!x.disabledReason));assert(G.availableActivities({...tutorBefore,stats:{...tutorBefore.stats,study:81}}).find(x=>x.id==='work-tutor'&&!x.disabledReason));
 let liang=create('liang');for(let i=0;i<160&&liang.phase!=='ending'&&liang.day<4;i++){assert.equal(liang.stats.mood,100);liang=step(liang);assert.equal(liang.stats.mood,100);}assert(G.valid(liang));assert.equal(liang.stats.mood,100);
 const l=G.choose(create('liang'),0),n=G.choose(create('blogger'),0),target=l.rhythm.clock+30;assert(Math.abs((G.fullness({...l,rhythm:{...l.rhythm,clock:target}})-G.fullness(l))-(G.fullness({...n,rhythm:{...n.rhythm,clock:n.rhythm.clock+30}})-G.fullness(n))*2)<.001);
 let week=until(create('director'),s=>s.day===7&&s.phase==='dayEnd'),preview=G.restPreview(week),tomorrow=G.continueDay(week);assert.equal(tomorrow.stats.money,preview.stats.money);assert(tomorrow.log.some(e=>e.day===8&&e.eventId==='admission-support'&&e.changes.money===80));assert(G.valid(tomorrow));
 for(const change of [s=>s.stats.money++,s=>s.admission.id='rich',s=>s.admission.loadout[0]='gold-bank',s=>s.admission.moves.push('["unknown",[]]'),s=>s.admission.base.stats.study++]){const bad=clone(tomorrow);change(bad);assert.equal(G.restore(bad),null);}

 const quoted=until(create('workstudy',['gold-brain','gold-job','gold-battery']),s=>s.phase==='outcome'&&G.availableActivities(s).some(x=>x.id==='work-tutor'&&!x.disabledReason));
 assert(G.availableActivities(quoted).find(x=>x.id==='work-tutor').label.includes('223'));const taught=G.choose(G.startActivity(quoted,'work-tutor'),0);assert.equal(taught.outcome.changes.money,223);assert(G.valid(taught));
 let photo=G.choose(G.createCampus(72,neutral,'摄影','blogger'),0);photo=G.completeMini(G.startActivity(photo,'mini-photo'),1);assert.equal(photo.outcome.changes.money,10);assert(G.valid(photo));photo=G.completeMini(G.startActivity(photo,'mini-photo'),1);assert(!photo.outcome.changes.money,'稿费每日只结算一次');assert(G.valid(photo));
 let lab=G.choose(G.createCampus(72,['brain','regularSleep','slowWarm'],'保送','admitted'),0);assert.equal(lab.stats.study,72);assert(!G.availableActivities(lab).find(x=>x.id==='lab-apply').disabledReason);lab=G.choose(G.startActivity(lab,'lab-apply'),0);assert(lab.campusLife.joined);assert(G.valid(lab));
 let club=G.choose(create('admitted',neutral,72),0);club=G.startActivity(club,'join-creative');assert(G.getScene(club).title.includes('创作社'));assert.equal(club.journeys.backgroundId,'creative');assert(G.valid(club));club=G.next(club);assert(G.valid(club));assert(!club.admission.pending);
 const school=until(create('admitted'),s=>s.phase==='outcome'&&s.log.some(e=>e.flags?.schoolAttend));assert(school.log.find(e=>e.flags?.schoolAttend).result.includes('课设＋3'));assert(G.valid(school));
 const lover=G.choose(G.createCampus(72,['gold-flirt','chosen','optimist'],'相处','classmate'),0),talk=G.startActivity(lover,'bond-talk'),affection=G.getScene(talk).choices[0].affection,spoken=G.choose(talk,0);assert.equal(spoken.outcome.intimacyChange,affection+3);assert(G.valid(spoken));
 const highBalance={...tutorBefore,stats:{...tutorBefore.stats,money:1000000}};const highPaid=G.choose(G.startActivity(highBalance,'work-tutor'),0);assert.equal(highPaid.stats.money,1000160,'生活费在百万余额上仍可继续增加');
 assert.deepEqual(G.restore(base),B.restore(base));assert.deepEqual(G.restore(require('./fixtures/v6-evolution.json')),B.restore(require('./fixtures/v6-evolution.json')));
 console.log('Admission passed: weighted unique draws, five gold talents, ten identities, real buffs/jobs/fans/discounts, double hunger, locked mood, weekly preview, and strict replay.');
 return{tutor:tutorBefore,week,liang};
}
if(require.main===module)checks();module.exports={checks,create,pick,step,until};
