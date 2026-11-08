const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../dist/positive-endings.js'),E=require('../dist/ending-book.js');
const clone=x=>JSON.parse(JSON.stringify(x));
assert.equal(E.items.length,9);
assert.equal(new Set(E.items.map(item=>item.id)).size,9);
for(const item of E.items){const original=G.endings.find(row=>row.id===item.id);assert.equal(item.name,original.name);assert.equal(item.quote,original.quote);assert.equal(item.title,item.name);assert(item.rule);}

// Existing real saves must never be promoted to an ending merely because they
// already have an achievement/finalEnding, or the player chose to stop.
for(const file of ['v2-saves.json','v3-saves.json'])for(const row of require('./fixtures/'+file)){
 const before=clone(row.save);assert.equal(E.capture(row.save),null);assert.deepEqual(row.save,before);
}
assert.equal(E.capture(require('./fixtures/v6-evolution.json')),null);
assert.equal(E.capture(null),null);

// Replay the historical engine from a real fixture with a deterministic policy.
// This produces actual zero-stat endings, rather than editing a save's failure.
const initial=require('./fixtures/v2-saves.json')[0].save;
const B=require('../dist/survival.js');
function failBy(key){
 for(let seed=0;seed<30;seed++){
  let s=B.create(seed,['brain','toolkit'],'结局测试');
  for(let turn=0;turn<400&&s.phase!=='ending';turn++){
   if(s.phase==='choice'){
    const choices=B.getScene(s).choices.map((c,i)=>({c,i})).filter(({c})=>(c.mods.money||0)>=-s.stats.money);
    choices.sort((a,b)=>(a.c.mods[key]||0)-(b.c.mods[key]||0));s=B.choose(s,choices[0].i);
   }else if(s.phase==='outcome')s=B.next(s);else s=B.continueDay(s);
  }
  if(s.failed==='fail-'+key)return s;
 }
 throw Error('No actual '+key+' ending reached');
}
for(const key of ['energy','study']){const s=failBy(key),before=clone(s);assert(B.valid(s));assert.equal(E.capture(s).id,'fail-'+key);assert(E.capture(s).facts.includes(G.labels[key]+' 0'));assert.deepEqual(s,before);assert.equal(E.capture({...s,phase:'outcome'}),null);}
assert(G.restore(initial));

const actual=require('./lottery.cjs').fixtures().jackpot.after;
assert.equal(E.capture(actual).id,'lottery-winner');
assert(E.capture(actual).facts.includes('彩票奖金 ¥1,000,000'));
assert.equal(E.capture({...actual,lottery:{...actual.lottery,won:false}}),null);
assert.equal(E.capture({...actual,log:[]}),null);
assert.equal(E.capture({...actual,phase:'dayEnd'}),null);
assert.equal(E.capture({...actual,lottery:{won:false},log:[],finalEnding:'lottery-winner'}),null);

const dead={...actual,lottery:{won:false},failed:'fail-mood',stats:{...actual.stats,health:37,mood:0}};
assert.equal(E.capture(dead).id,'fail-health');assert(E.capture(dead).facts.includes('触发原因：心情归零'));
assert(E.capture({...dead,failed:'fail-health',stats:{health:0,mood:30}}).facts.includes('触发原因：健康归零'));
const bitten={...dead,failed:'fail-health',stats:{health:0,mood:30},evolution:{bite:{day:1,due:actual.day,appointment:false}}};
assert(E.capture(bitten).facts.includes('仍有未处理的咬伤'));
assert(!E.capture({...bitten,evolution:{bite:{...bitten.evolution.bite,appointment:true}}}).facts.some(f=>f.includes('咬伤')));
assert.equal(E.capture({...dead,failed:'unknown'}),null);
const context={DormGame:G};context.globalThis=context;
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/ending-book.js'),'utf8'),context);
assert.equal(context.DormEndingBook.items.length,9);assert.strictEqual(context.DormGame,G);
console.log('Ending book passed: nine endings, real failure/lottery replay, voluntary stop excluded, precise cause, read-only exports.');
