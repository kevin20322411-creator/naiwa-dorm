const assert=require('node:assert/strict'),G=require('../dist/rhythm.js'),B=require('../dist/story.js');
function score(s,c){const targets={energy:48,money:28,social:40,study:65,health:60,mood:45},weights={energy:.45,money:.8,social:.35,study:.85,health:.8,mood:.25};let n=0;for(const[k,w]of Object.entries(weights)){const a=c.mods[k]||0;n+=a*w*(1+Math.max(0,targets[k]-s.stats[k])/targets[k]*4);if(a>0)n-=Math.max(0,s.stats[k]+a-(k==='money'?150:100))*w;if(['energy','study','health'].includes(k)&&s.stats[k]+a<=0)n-=10000;}const t=G.task(s);if(t.progress<t.target)n+=(c.project||0)*(.4+1.8/t.daysLeft);if(c.submit)n+=200;if(c.miss)n-=150;return n;}
function run(seed,active=false,days=18){
 let s=G.create(seed,['brain','toolkit'],'自由奶娃'),steps=0;const checkpoints=[];
 while(s.phase!=='ending'&&steps++<1200){
  if(s.phase==='choice'){const choices=G.getScene(s).choices.map((c,i)=>({c,i})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-s.stats.money);assert(choices.length,'每个场景必须有可选项');choices.sort((a,b)=>score(s,b.c)-score(s,a.c));if(s.eventId==='love-encounter')s=G.choose(s,0);else s=G.choose(s,choices[0].i);}
  else if(s.phase==='outcome'){
   const acts=G.availableActivities(s),mine=s.log.filter(e=>e.day===s.day&&e.origin==='self').length;
   const id=active&&mine<3&&(s.stats.energy<35?'rest':s.stats.money<10&&s.stats.energy>25?'job':G.task(s).progress<G.task(s).target&&s.stats.energy>40?'study':s.stats.health<65&&s.stats.energy>35?'gym':null);
   if(id&&acts.some(a=>a.id===id))s=G.startActivity(s,id);else s=G.next(s);
  }else{checkpoints.push(s);if(s.day>=days)break;s=G.continueDay(s);}
 }
 assert(steps<1200,'不能卡在同一天的无限事件');return {s,checkpoints};
}
assert.equal(G.eventCount,116);assert.equal(new Set(G.events.map(e=>e.id)).size,116);
for(const file of ['v6-deadline.json','v6-care.json','v6-romance.json','v6-story.json']){const old=require('./fixtures/'+file);assert.deepEqual(G.restore(old),old);const up=G.enableRhythm(old);assert(G.valid(up));assert.deepEqual(up.stats,old.stats);assert.deepEqual(up.log,old.log);assert.equal(up.eventId,old.eventId);}
let gym=G.create(1,['brain','toolkit'],'健身奶娃');assert(G.valid(gym));assert.throws(()=>G.startActivity(gym,'gym'));gym=G.choose(gym,0);assert(G.availableActivities(gym).some(a=>a.id==='gym'));assert(!G.availableActivities(gym).some(a=>a.partner));
gym=G.startActivity(gym,'gym');assert(G.valid(gym));assert(G.getScene(gym).title.includes('动一动'));const before=gym.stats;gym=G.choose(gym,1);assert.equal(gym.stats.health,before.health+5);assert.equal(gym.stats.energy,before.energy-12);assert.equal(gym.rhythm.spent,30);assert(G.valid(gym));assert(G.valid(G.next(gym)));
const cancel=G.choose(G.startActivity(G.choose(G.create(1,['brain','toolkit'],'取消检查'),0),'gym'),3);assert.equal(cancel.rhythm.counts.gym,0);assert.equal(cancel.rhythm.spent,5);assert(G.valid(cancel));
// Only real training counts toward fatigue; deciding not to join never damages health.
const tired=G.startActivity(G.choose(G.create(1,['brain','toolkit'],'加练检查'),0),'gym');tired.rhythm.counts.gym=2;
assert(G.getScene(tired).choices[1].mods.health<0);assert.equal(G.getScene(tired).choices[3].mods.health,undefined);
const passing=structuredClone(tired);passing.eventId='extra-open-gym';passing.rhythm.pending={...passing.rhythm.pending,key:'open-gym',extra:true,source:'chance'};
assert.equal(G.getScene(passing).choices[2].mods.health,undefined);const skipped=G.choose(passing,2);assert.equal(skipped.stats.health,passing.stats.health);assert.equal(skipped.rhythm.counts.gym,2);
const pending=G.startActivity(G.choose(G.create(1,['brain','toolkit'],'刷新检查'),0),'study');assert.deepEqual(G.restore(JSON.parse(JSON.stringify(pending))),pending);const tampered=structuredClone(pending);tampered.rhythm.minutes+=500;assert.equal(G.restore(tampered),null);
const counts=new Set(),coreCounts=new Set(),sources=new Set();let longRun=null,multiple=null,busy=null;
for(let seed=0;seed<32;seed++){
 const {s,checkpoints}=run(seed,seed%2===0);if(seed<4)assert(G.valid(s));if(s.day>=18&&!s.failed)longRun=s;
 for(const point of checkpoints){
  const today=point.log.filter(e=>e.day===point.day);counts.add(today.length);coreCounts.add(today.filter(e=>!e.origin).length);
  for(const id of ['meal-breakfast','meal-lunch','meal-dinner'])assert.equal(today.filter(e=>e.eventId===id).length,1,'不能漏掉或重复一餐');
  assert.equal(today.filter(e=>e.step===7).length,1,'每天只允许一个最终结算节点');
  let end=0;for(const e of today){const time=e.time.split(':').map(Number),start=time[0]*60+time[1];assert(start>=end,'活动时间必须顺序前进');end=start+(e.minutes||0);if(e.origin)sources.add(e.origin);}
  if(seed<2)assert(G.valid(point));
 }
 if(!multiple&&s.romance.connected){
  // Replay to an actual connected outcome with room for repeated proactive contact.
  let x=G.create(s.seed,s.traits,s.name,s.recent);
  for(const a of s.actions.slice(x.actions.length)){
   if(x.phase==='outcome'&&x.romance.connected&&G.freeMinutes(x)>=60&&x.stats.energy>35){let candidate=x;for(let k=0;k<3;k++){if(!G.availableActivities(candidate).some(a=>a.id==='ask-chat'))break;candidate=G.startActivity(candidate,'ask-chat');if(candidate.rhythm.pending.busy)busy=candidate;candidate=G.choose(candidate,candidate.rhythm.pending.busy?1:0);}if(candidate.log.filter(e=>e.day===x.day&&e.origin==='self'&&e.eventId==='love-active-ask-chat').length>=2){multiple=candidate;assert(G.valid(multiple));break;}}
   if(a.startsWith('c'))x=G.choose(x,+a[1]);else if(a==='n')x=G.next(x);else if(a==='d')x=G.continueDay(x);else if(a.startsWith('a:'))x=G.startActivity(x,a.slice(2));else throw Error(a);
  }
 }
}
assert(coreCounts.size>=3,'普通日常数量应该有变化');assert(counts.size>=4);assert(longRun,'仍应有长期生存路线');assert(multiple,'同一天能多次主动联系奶粉');if(busy){assert(G.getScene(busy).title.includes('自己的安排'));assert(G.valid(busy));}
assert(sources.has('chance'));assert(sources.has('self'));assert(sources.has('naifen'));
for(const seed of [1,3,5]){const {checkpoints}=run(seed,true,14),last=checkpoints.at(-1);if(last?.day===14){const crises=last.log.filter(e=>/^term-/.test(e.eventId)&&e.eventId!=='term-deadline');assert.equal(crises.length,2);assert.equal(last.log.filter(e=>e.eventId==='term-deadline').length,2);}}
console.log(JSON.stringify({passed:true,runs:32,dailyEventCounts:[...counts].sort((a,b)=>a-b),coreCounts:[...coreCounts].sort(),sources:[...sources],multipleContact:true,fitness:true,legacyCompatible:true}));
module.exports={run,score};
