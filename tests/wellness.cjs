const assert=require('node:assert/strict'),G=require('../dist/wellness.js'),B=require('../dist/meetings.js');
function score(s,c){let n=0;const targets={energy:50,money:25,study:70,health:65,mood:50},weights={energy:.5,money:.8,study:.85,health:.8,mood:.3};for(const[k,target]of Object.entries(targets)){const m=c.mods[k]||0;n+=m*weights[k]*(1+Math.max(0,target-s.stats[k])/target*4);if(m>0)n-=Math.max(0,s.stats[k]+m-(k==='money'?150:100))*weights[k];if(['energy','study','health'].includes(k)&&s.stats[k]+m<=0)n-=10000;}const t=G.task(s);if(t.progress<t.target)n+=(c.project||0)*(.4+1.8/t.daysLeft);if(c.submit)n+=200;if(c.miss)n-=200;return n;}
function run(Engine,seed,days=16,study=false){let s=Engine.create(seed,['brain','toolkit'],'校园生活'),turn=0;const points=[],samples={};
 while(s.phase!=='ending'&&turn++<1600){
  if(s.phase==='choice'){
   const scene=Engine.getScene(s);if(scene.mouseScene){samples.mouse??=s;if(scene.id==='well-mouse-study')samples.mouseStudy??=s;}if(scene.id.startsWith('well-cold-'))samples.cold??=s;
   if(scene.time>='22:30'&&scene.choices.some(c=>(c.mods.study||0)>0&&!c.flags?.rest))samples.late??=s;
   const opts=scene.choices.map((c,i)=>({c,i})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-s.stats.money&&!(scene.kind==='就诊安排'&&o.c.cancel)).sort((a,b)=>score(s,b.c)-score(s,a.c));assert(opts.length);s=Engine.choose(s,scene.mouseScene?0:opts[0].i);
  }else if(s.phase==='outcome'){
   const acts=Engine.availableActivities(s),doStudy=study&&s.wellness&&s.day>=s.wellness.nextMouseDay&&!s.log.some(e=>e.day===s.day&&e.origin==='self'&&e.eventId==='active-study')&&s.stats.energy>35&&acts.some(a=>a.id==='study');
   if(acts.some(a=>a.id==='clinic'))s=Engine.startActivity(s,'clinic');else if(doStudy)s=Engine.startActivity(s,'study');else s=Engine.next(s);
  }else{points.push(s);if(s.day>=days)break;s=Engine.continueDay(s);}
 }
 assert(turn<1600);return{s,points,samples};
}
function fixtures(){let result={};for(let seed=0;seed<32&&(!result.mouseStudy||result.mouseStudy.stats.mood>=95||!result.cold||!result.late);seed++){const r=run(G,seed,16,true);for(const[k,v]of Object.entries(r.samples))if(!result[k]||(k.startsWith('mouse')&&result[k].stats.mood>=95&&v.stats.mood<95))result[k]=v;}assert(result.mouse&&result.mouseStudy&&result.cold&&result.late);return result;}
function checks(){
 assert.equal(G.eventCount,B.eventCount+9);let baseline=[],current=[],f={};
 for(let seed=0;seed<20;seed++){
  const old=run(B,seed),now=run(G,seed,16,seed<3);baseline.push(...old.points);current.push(...now.points);for(const[k,v]of Object.entries(now.samples))f[k]??=v;assert(G.valid(now.s));
  const visits=now.s.log.filter(e=>e.origin==='mouse');for(let i=1;i<visits.length;i++)assert(visits[i].day-visits[i-1].day>=4,'奶鼠至少间隔四天');
  for(const p of now.points){const log=p.log.filter(e=>e.day===p.day);for(const id of ['meal-breakfast','meal-lunch','meal-dinner'])assert.equal(log.filter(e=>e.eventId===id).length,1);assert.equal(log.filter(e=>e.step===7).length,1);}
 }
 const rate=(a,k)=>a.filter(s=>s.stats[k]===100).length/a.length;
 assert(rate(current,'health')<rate(baseline,'health'));assert(rate(current,'mood')<rate(baseline,'mood'));
 assert(f.cold&&f.mouse&&f.mouseStudy&&f.late);
 const rested=G.choose(f.cold,1);assert.equal(rested.stats.health,f.cold.stats.health,'休息不额外扣健康');assert(rested.illness.active);assert(G.valid(rested));
 if(f.cold.stats.money>=12){const cured=G.choose(f.cold,0);assert(!cured.illness.active);assert(G.valid(cured));}
 const mouse=G.choose(f.mouseStudy,0);assert.equal(mouse.stats.mood,Math.min(100,f.mouseStudy.stats.mood+6));assert(G.valid(mouse));assert(G.valid(G.next(mouse)));
 const lateChoices=G.getScene(f.late).choices,index=lateChoices.findIndex(c=>(c.mods.study||0)>0&&!c.flags?.rest);assert(index>=0);const late=G.choose(f.late,index);assert(late.outcome.changes.health<=-2);assert(G.valid(late));
 let s=G.choose(G.create(1,['brain','toolkit'],'休息检查'),0);s=G.startActivity(s,'rest');const before=s.stats;s=G.choose(s,0);assert(s.stats.health>=before.health);assert(s.stats.mood>=before.mood);assert(G.valid(s));
 const old=require('./fixtures/v6-illness.json');assert.deepEqual(G.restore(old),old);const upgraded=G.enableWellness(old);assert(G.valid(upgraded));assert.deepEqual(upgraded.stats,old.stats);assert.deepEqual(upgraded.log,old.log);
 console.log(JSON.stringify({passed:true,runs:20,fullHealthBefore:rate(baseline,'health'),fullHealthAfter:rate(current,'health'),fullMoodBefore:rate(baseline,'mood'),fullMoodAfter:rate(current,'mood'),cold:true,mouseStudy:true,minMouseGap:4,restDoesNotHurt:true}));return f;
}
if(require.main===module)checks();module.exports={run,fixtures,checks};
