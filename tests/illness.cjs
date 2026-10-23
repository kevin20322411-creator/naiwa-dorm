const assert=require('node:assert/strict'),G=require('../dist/illness.js'),B=require('../dist/food.js');
function best(s){return G.getScene(s).choices.map((c,i)=>({c,i})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-s.stats.money).sort((a,b)=>score(s,b.c)-score(s,a.c))[0].i;}
function score(s,c){let n=0;const targets={energy:55,study:75,health:65,mood:55,money:20};for(const[k,target]of Object.entries(targets)){const m=c.mods[k]||0;n+=m*(1+Math.max(0,target-s.stats[k])/target*4);if(['energy','study','health'].includes(k)&&s.stats[k]+m<=0)n-=10000;}const task=G.task(s);if(task.progress<task.target)n+=(c.project||0)*1.5;if(c.submit)n+=200;if(c.miss)n-=200;return n;}
function fixtures(){
 let onset=null,menu=null,healthy=null,offers=0;
 for(let seed=0;seed<600&&(!onset||!healthy);seed++){
  const s=G.create(seed,['brain','toolkit'],'生病检查'),scene=G.getScene(s);
  for(let i=0;i<scene.choices.length;i++){const c=scene.choices[i];if(!c.riskFood||(c.mods.money||0)<-s.stats.money)continue;offers++;const n=G.choose(s,i);if(!n.illness.active)healthy??=n;
   if(n.illness.active&&!n.failed&&n.stats.money>=12&&G.freeMinutes(n)>=30){onset=n;menu=s;break;}
  }
 }
 assert(onset&&healthy,'垃圾食品既有不适也有未生病的真实路径');
 let dayEnd=onset;for(let n=0;n<70&&!['dayEnd','ending'].includes(dayEnd.phase);n++)dayEnd=dayEnd.phase==='choice'?G.choose(dayEnd,best(dayEnd)):G.next(dayEnd);
 assert.equal(dayEnd.phase,'dayEnd');assert(dayEnd.illness.active);
 return{onset,menu,healthy,dayEnd,offers};
}
function checks(){
 assert.equal(G.foodCount,72);const f=fixtures();
 const E=require('../dist/expressions.js');assert.equal(E.scene(f.onset,G.getScene(f.onset)).id,'blue');
 for(const s of [f.menu,f.onset,f.healthy,f.dayEnd])assert(G.valid(s));assert(f.onset.outcome.changes.health<0);assert(f.onset.outcome.changes.mood<0);
 assert.deepEqual(G.choose(f.menu,f.onset.outcome.index),f.onset,'刷新不能重抽病情');
 const visit=G.startActivity(f.onset,'clinic');assert(G.valid(visit));const cancelled=G.choose(visit,3);assert(G.valid(cancelled));assert(cancelled.illness.active);assert.deepEqual(cancelled.stats,f.onset.stats);
 const cured=G.choose(visit,0);assert(!cured.illness.active);assert.equal(cured.stats.money,f.onset.stats.money-12);assert(cured.stats.health>f.onset.stats.health);assert(G.valid(cured));assert(G.valid(G.next(cured)));
 const poor={...f.onset,stats:{...f.onset.stats,money:0}},aid=G.startActivity(poor,'clinic'),aided=G.choose(aid,1);assert(!aided.illness.active);assert.equal(aided.stats.money,0);assert.throws(()=>G.choose(aid,0),/饭钱/);
 const preview=G.restPreview(f.dayEnd);assert(preview.changes.health<0);assert(preview.changes.mood<0);const ignored=G.continueDay(f.dayEnd);assert(ignored.illness.active);assert.equal(ignored.illness.days,1);assert.deepEqual(ignored.stats,preview.stats);assert(G.valid(ignored));
 const booked=G.startActivity(f.dayEnd,'clinic');assert(G.valid(booked));const index=G.getScene(booked).choices.findIndex(c=>!c.cancel&&!c.disabledReason&&(c.mods.money||0)>=-booked.stats.money),appointment=G.choose(booked,index);assert.equal(appointment.phase,'dayEnd');assert(appointment.illness.appointment);assert.equal(appointment.stats.health,f.dayEnd.stats.health);assert(G.valid(appointment));
 const next=G.continueDay(appointment);assert(!next.illness.active);assert.deepEqual(next.stats,G.restPreview(appointment).stats);assert(G.valid(next));assert.equal(next.log.filter(e=>e.eventId==='clinic-followup').length,1);assert.throws(()=>G.startActivity(appointment,'clinic'));
 const critical={...f.dayEnd,stats:{...f.dayEnd.stats,health:2}};assert.equal(G.restPreview(critical).failed,'fail-health');assert.equal(G.continueDay(critical).failed,'fail-health');
 for(const file of ['v6-food.json','v6-rhythm.json','v6-story.json']){const old=require('./fixtures/'+file);assert.deepEqual(G.restore(old),old);const up=G.enableIllness(old);assert(G.valid(up));assert.deepEqual(up.stats,old.stats);assert.deepEqual(up.log,old.log);assert.deepEqual(G.getScene(up),B.getScene(old));}
 let samples=0;for(let seed=0;seed<50;seed++){let s=G.create(seed,['brain','toolkit'],'病情流程');const r=G.rng(seed+7);for(let turn=0;turn<170&&s.phase!=='ending';turn++){
  if(s.phase==='choice'){const opts=G.getScene(s).choices.map((c,i)=>({c,i})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-s.stats.money);assert(opts.length);s=G.choose(s,r()<.25?opts[Math.floor(r()*opts.length)].i:best(s));}
  else if(s.phase==='outcome'){if(G.availableActivities(s).some(a=>a.id==='clinic')&&r()<.65)s=G.startActivity(s,'clinic');else s=G.next(s);}
  else{const today=s.log.filter(e=>e.day===s.day);for(const id of ['meal-breakfast','meal-lunch','meal-dinner'])assert.equal(today.filter(e=>e.eventId===id).length,1);assert.equal(today.filter(e=>e.step===7).length,1);if(s.illness.active&&!s.illness.appointment&&r()<.65)s=G.startActivity(s,'clinic');else s=G.continueDay(s);}
  if(turn%27===0)assert(G.valid(s));samples++;
 }assert(G.valid(s));}
 console.log(JSON.stringify({passed:true,foods:72,randomTransitions:samples,clinic:true,aid:true,appointment:true,untreatedDamage:true,legacyCompatible:true}));return f;
}
if(require.main===module)checks();module.exports={fixtures,checks};
