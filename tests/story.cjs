const assert=require('node:assert/strict'),G=require('../dist/story.js'),B=require('../dist/romance.js'),{simulate}=require('./romance.cjs');
assert.equal(G.endings.length,45);
for(const file of ['v6-deadline.json','v6-care.json','v6-romance.json']){
 const old=require('./fixtures/'+file);assert.deepEqual(G.restore(old),old);
 const up=G.enableStory(G.enableRomance(G.enableBalance(G.enableCare(old))));assert(G.valid(up));assert.deepEqual(up.stats,old.stats);assert.deepEqual(up.log,old.log);assert.equal(up.eventId,old.eventId);
}
let accepted=0;const reasons=new Set(),places=new Set();
for(let seed=0;seed<256;seed++){
 const s={...G.create(seed,['brain','toolkit'],'问候检查'),step:1,eventId:'love-encounter'};
 const n=G.choose(s,0);assert.deepEqual(G.choose(s,0),n,'同一偶遇不会刷新重抽');assert.deepEqual(n.stats,B.choose(s,0).stats);
 places.add(G.getScene(s).place);reasons.add(n.outcome.result);accepted+=Number(n.romance.connected);
 if(n.romance.connected){assert.equal(n.romance.intimacy,20);assert(n.outcome.contactAdded);assert(n.outcome.result.includes('加上了联系方式'));}
 else{assert.equal(n.romance.intimacy,0);assert(!n.outcome.contactAdded);assert(n.outcome.result.includes('没有加上'));}
}
assert(accepted>70&&accepted<200);assert.equal(places.size,3);assert(reasons.size>=10);
const runs=Array.from({length:24},(_,seed)=>simulate(seed,18,G));
assert(runs.some(x=>x.declined));const successful=runs.find(x=>x.awarded);assert(successful);
for(const run of runs.slice(0,6))for(const point of ['initial','encounter','contact','awarded','last'])if(run[point])assert(G.valid(run[point]),point+'可重演');
const altered=structuredClone(successful.last);altered.romance.intimacy=0;assert.equal(G.restore(altered),null);
const base={...G.create(3,['brain','toolkit'],'结局检查'),phase:'dayEnd',day:2,stats:{energy:60,money:25,social:60,study:80,health:40,mood:60},flags:{sport:4,library:4},log:[{day:2,step:7,eventId:'campus-rope',changes:{},flags:{sport:1,library:1}}]};
assert.equal(B.ending(base).id,'athlete');assert.notEqual(G.ending(base).id,'athlete');assert.equal(G.ending(base).id,'library');
assert.equal(G.ending({...base,stats:{...base.stats,health:80}}).id,'athlete');
assert(!G.achievements(base).some(e=>e.id==='athlete'));assert(G.achievements(base).some(e=>e.id==='library'));
const plain={...base,flags:{},log:[],stats:{energy:60,money:25,social:30,study:60,health:90,mood:85}};
assert.equal(G.ending(plain).id,'steady-life');assert.equal(G.ending({...plain,stats:{...plain.stats,mood:20}}).id,'quiet-break');
const recovered={...plain,stats:{...plain.stats,health:70,mood:60},log:[{day:2,step:7,changes:{health:45},flags:{}}]};assert.equal(G.ending(recovered).id,'recovery');
const love={...plain,romance:{...plain.romance,earned:true,earnedDay:2}};
const variations=[{health:35,money:25,study:65,mood:50},{health:80,money:5,study:65,mood:60},{health:80,money:25,study:90,mood:65},{health:80,money:25,study:65,mood:90}].map(v=>G.ending({...love,stats:{...love.stats,...v}}).quote);
assert.equal(new Set(variations).size,4);
const before=JSON.stringify(base);G.ending(base);G.achievements(base);assert.equal(JSON.stringify(base),before,'结局不能修改玩家属性');
console.log(JSON.stringify({passed:true,contactTrials:256,accepted,distinctReplies:reasons.size,storyRuns:24,loveEndingReachable:runs.filter(x=>x.awarded).length,statBasedEndings:true,legacyCompatible:true}));
