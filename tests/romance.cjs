const assert=require('node:assert/strict'),G=require('../dist/romance.js');
function score(s,c){
 const target={energy:48,money:28,social:40,study:65,health:60,mood:45},weights={energy:.45,money:.8,social:.35,study:.85,health:.8,mood:.25};let value=0;
 for(const[k,w]of Object.entries(weights)){const a=c.mods[k]||0;value+=a*w*(1+Math.max(0,target[k]-s.stats[k])/target[k]*4);if(a>0)value-=Math.max(0,s.stats[k]+a-(k==='money'?150:100))*w;if(['energy','study','health'].includes(k)&&s.stats[k]+a<=0)value-=10000;}
 const t=G.task(s);if(t.progress<t.target)value+=(c.project||0)*(.4+1.8/t.daysLeft);if(c.submit)value+=200;if(c.miss)value-=150;return value;
}
function simulate(seed,limit=18){
 let s=G.create(seed,['brain','toolkit'],'心动奶娃');const samples={initial:s};let turn=0;
 while(s.phase!=='ending'&&turn++<400){
  if(s.phase==='choice'){
   const scene=G.getScene(s),opts=scene.choices.map((c,i)=>({c,i})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-s.stats.money);assert(opts.length);
   let i=opts.sort((a,b)=>score(s,b.c)-score(s,a.c))[0].i;
   if(scene.id==='love-encounter'){i=0;samples.encounter??=s;}
   else if(scene.id==='love-confession'){i=0;samples.confession??=s;}
   else if(scene.id.startsWith('love-')){i=opts.sort((a,b)=>(b.c.affection||0)-(a.c.affection||0))[0].i;}
   s=G.choose(s,i);if(s.outcome.contactAdded)samples.contact??=s;if(scene.id==='love-encounter'&&!s.romance.connected)samples.declined??=s;
   if(s.romance.earned)samples.awarded??=s;
  }else if(s.phase==='outcome')s=G.next(s);else{if(s.day>=limit)break;s=G.continueDay(s);}
 }
 return{...samples,last:s};
}
function checks(){
 assert.equal(G.eventCount,100);assert.equal(new Set(G.events.map(e=>e.id)).size,100);assert.equal(G.endings.length,42);
 const initial=G.create(42,['brain','toolkit'],'存档检查');assert(G.valid(initial));assert(!initial.romance.connected);
 for(const file of ['v6-deadline.json','v6-care.json']){const old=require('./fixtures/'+file);assert.deepEqual(G.restore(old),old);const up=G.enableRomance(G.enableBalance(G.enableCare(old)));assert(G.valid(up));assert.equal(up.eventId,old.eventId);assert.deepEqual(up.log,old.log);assert.deepEqual(up.stats,old.stats);}
 const samples=Array.from({length:32},(_,seed)=>simulate(seed)),full=samples.find(x=>x.awarded),decline=samples.find(x=>x.declined);assert(full,'正常玩法可告白');assert(decline,'婉拒有实际路径');
 for(const x of samples.slice(0,8)){
  assert(G.valid(x.last));const daily=new Set();for(const e of x.last.log.filter(e=>e.eventId.startsWith('love-'))){assert(![0,2,5,7].includes(e.step));assert(!daily.has(e.day));daily.add(e.day);}
 }
 for(const key of ['initial','encounter','contact','confession','awarded','last'])assert(G.valid(full[key]),key+'存档可重演');
 assert.equal(full.contact.romance.intimacy,20);assert(full.confession.romance.intimacy>=80);assert(full.awarded.romance.dating);assert(G.romanceAwards(full.awarded).some(e=>e.id==='love-ending'));
 let poorReply=full.contact;for(let n=0;n<150&&poorReply.romance.connected&&poorReply.phase!=='ending';n++){
  if(poorReply.phase==='choice'){const scene=G.getScene(poorReply),opts=scene.choices.map((c,i)=>({c,i})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-poorReply.stats.money);opts.sort((a,b)=>scene.id.startsWith('love-')?(a.c.affection||0)-(b.c.affection||0):score(poorReply,b.c)-score(poorReply,a.c));poorReply=G.choose(poorReply,opts[0].i);}
  else if(poorReply.phase==='outcome')poorReply=G.next(poorReply);else poorReply=G.continueDay(poorReply);
 }
 assert(!poorReply.romance.connected,'真实选择可以走到删除联系');assert(G.valid(poorReply));
 const reload=JSON.parse(JSON.stringify(full.contact));assert.deepEqual(G.restore(reload),full.contact);reload.romance.intimacy=100;assert.equal(G.restore(reload),null);
 const connected={...full.contact,phase:'choice',eventId:'love-message',romance:{...full.contact.romance,intimacy:10}};
 const deleted=G.choose(connected,1);assert.equal(deleted.romance.intimacy,0);assert(!deleted.romance.connected);assert(deleted.outcome.contactDeleted);assert(deleted.outcome.result.includes('删除'));
 const earned=G.choose({...connected,romance:{...connected.romance,earned:true}},1);assert.equal(G.romanceAwards(earned).length,1);
 assert.throws(()=>G.choose({...connected,eventId:'love-confession',romance:{...connected.romance,intimacy:79}},0),/亲密度/);
 for(const id of G.events.filter(e=>e.id.startsWith('love-')).map(e=>e.id))assert(G.getScene({...connected,eventId:id,stats:{...connected.stats,money:0}}).choices.some(c=>(c.mods.money||0)>=0));
 assert.deepEqual(simulate(full.last.seed).last,full.last,'刷新不重抽相处结果');
 const count=samples.filter(x=>x.awarded).length;console.log(JSON.stringify({passed:true,runs:32,loveEndingReachable:count,seed:full.last.seed,contactDay:full.contact.day,confessionDay:full.awarded.day,legacyCompatible:true}));
 return full;
}
if(require.main===module)checks();
module.exports={simulate,checks};
