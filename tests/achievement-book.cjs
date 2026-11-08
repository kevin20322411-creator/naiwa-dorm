const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const G=require('../dist/wallet.js'),A=require('../dist/achievement-book.js');
const ids=state=>A.unlocked(state).map(item=>item.id);
const clone=state=>JSON.parse(JSON.stringify(state));
const stat={energy:96,money:200,social:85,study:96,health:85,mood:85,charm:50};
const fixture=extra=>({day:30,phase:'outcome',failed:null,stats:{...stat},log:[],...extra});
const rows=(count,key,perDay=2)=>Array.from({length:count},(_,index)=>({day:Math.floor(index/perDay)+1,eventId:'test-'+index,title:'记录'+index,time:'12:00',choice:'实际完成',flags:{[key]:1},changes:{}}));

assert.equal(A.items.length,24);
assert.equal(new Set(A.items.map(item=>item.id)).size,A.items.length);
assert(!A.items.some(item=>item.failure||['ordinary','poor','tired','freshman'].includes(item.id)));
assert(G.endings.every(item=>!A.legacyRule(item.id).includes('未保存')),'旧版57个条目均应保留条件');
assert(A.items.every(item=>item.rule&&item.hint===item.rule));
for(const item of A.items){assert.deepEqual(A.describe(item.id).facts,[]);assert.equal(A.describe(item.id).eligible,false);}

// A single perfect game used to award a title. It must no longer finish the
// current challenge, while the original engine and historical replay stay exact.
let actual=G.choose(G.create(72,['budget','brain','athletic'],'成就测试'),0);
const before=clone(actual),originalEnds=G.endings.map(item=>item.id);
assert.equal(G.valid(actual),true);
let basket=G.completeMini(G.startActivity(actual,'mini-basket'),3);
assert(G.achievements(basket).some(item=>item.id==='mini-basket-perfect'));
assert(!ids(basket).includes('mini-basket-perfect'));
assert.deepEqual(G.restore(clone(basket)),basket);
assert.equal(A.describe('mini-basket-perfect',basket).facts[0],'三投全中 1 次');
assert.deepEqual(actual,before);
assert.deepEqual(G.endings.map(item=>item.id),originalEnds);

// Three perfect attempts in one day are distinct from skilled play on 3 days.
const perfect=day=>({day,miniGame:'mini-basket',miniScore:3,eventId:'active-gym-mini-basket',title:'投篮挑战',time:'16:00',choice:'投篮挑战',flags:{sport:1},changes:{}});
assert(!ids(fixture({log:[perfect(1),perfect(1),perfect(1)]})).includes('mini-basket-perfect'));
const threeDays=fixture({log:[perfect(1),perfect(2),perfect(3)]});
assert(ids(threeDays).includes('mini-basket-perfect'));
assert(A.describe('mini-basket-perfect',threeDays).facts.includes('完成日：第1天、第2天、第3天'));
assert.equal(A.describe('mini-basket-perfect',threeDays).entry.day,3);
assert(!ids({...threeDays,failed:'fail-health',phase:'ending'}).length);
assert(!ids({...threeDays,phase:'choice'}).length);

// Announcements that merely promise work and unrelated journal rewards are not
// wages; an exhausted wallet must not erase the already earned total, either.
const jobs=rows(8,'job');jobs.forEach(row=>{row.changes.money=15;});
const wageState=fixture({log:jobs,stats:{...stat,money:0}});
assert(ids(wageState).includes('worker'));
assert(A.describe('worker',wageState).facts.includes('实际工钱累计 ¥120'));
const rewards=jobs.map(row=>({...row,changes:{money:15},journalRewardReceived:10}));
assert(!ids(fixture({log:rewards})).includes('worker'));
assert(!ids(fixture({log:jobs.map(row=>({...row,changes:{}}))})).includes('worker'));
assert(!ids(fixture({log:jobs.map(row=>({...row,day:1}))})).includes('worker'));

// Tightened current requirements coexist with the exact old rule in archive.
let milestone=fixture({day:14,phase:'dayEnd',stats:{...stat,study:84}});
assert(!ids(milestone).includes('degree'));
assert(ids({...milestone,stats:{...milestone.stats,study:85}}).includes('degree'));
assert(!ids({...milestone,phase:'outcome',stats:{...stat,study:90}}).includes('degree'));
assert(A.legacyRule('degree').includes('80'));
assert(A.describe('degree').rule.includes('85'));
assert(!ids(fixture({term:{bestStreak:3,missed:1}})).includes('course-streak'));
assert(ids(fixture({term:{bestStreak:3,missed:0}})).includes('course-streak'));

const sport=rows(8,'sport',1),sportState=fixture({log:sport,stats:{...stat,health:75}});
assert(ids(sportState).includes('athlete'));
assert(!ids({...sportState,stats:{...stat,health:74}}).includes('athlete'));
const love=fixture({romance:{dating:true,intimacy:90},relationships:{kept:3}});
assert(ids(love).includes('love-ending'));
assert(!ids({...love,relationships:{kept:2}}).includes('love-ending'));
assert(!ids({...love,romance:{dating:false,intimacy:100}}).includes('love-ending'));
assert(A.describe('love-ending',actual).facts.includes('尚未确认恋爱关系'));

const lab=rows(12,'library',2).map(row=>({...row,campusActivity:'lab-work'}));
assert(ids(fixture({log:lab,campusLife:{joined:true,visits:12}})).includes('lab-newcomer'));
assert(!ids(fixture({log:lab.map(row=>({...row,day:1})),campusLife:{joined:true,visits:12}})).includes('lab-newcomer'));
const recovery=fixture({day:1,phase:'dayEnd',stats:{...stat,health:70,mood:55},log:[{day:1,flags:{},changes:{health:40},title:'休养',time:'21:00'}]});
assert(ids(recovery).includes('recovery'));
assert(A.describe('recovery',recovery).facts.includes('当日开始时健康 30'));
assert(!ids({...recovery,stats:{...recovery.stats,health:76}}).includes('recovery'));

// Use the real professional practice engine, rather than a fabricated works
// record, to prove this new goal can actually be reached and replayed.
actual=G.choose(G.create(72,['budget','brain','athletic'],'专业成就',[],'freshman','cs'),0);
for(let chapter=0;chapter<3;chapter++){
 assert(G.majorView(actual).canStart,'应当能接专业实践');
 actual=G.startMajor(actual);
 actual=G.majorAct(actual,'set',{field:'patch',value:'correct'});
 actual=G.majorAct(actual,'run');
 assert.deepEqual(G.restore(clone(actual)),actual);
}
assert(ids(actual).includes('major-master'));
const report=A.describe('major-master',actual);
assert(report.eligible);
assert(report.facts.includes('实践评分 9 / 9'));
assert.equal(report.entry.title,actual.outcome.title);
assert(!A.describe('major-master',before).facts.includes('亲自交付 3 / 3 章'));
const readOnly=clone(actual);A.unlocked(actual);A.describe('major-master',actual);assert.deepEqual(actual,readOnly);

// No unknown prize or inferred big win may become unlock evidence.
assert(!ids(fixture({lottery:{won:true}})).includes('lottery-winner'));
assert(ids(fixture({phase:'ending',lottery:{won:true},log:[{day:30,lotteryPrize:1000000}]})).includes('lottery-winner'));
assert(A.describe('lottery-winner',before).facts.includes('本局尚未刮出100万元大奖'));

const context={DormGame:G};context.globalThis=context;
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/achievement-book.js'),'utf8'),context);
assert.equal(context.DormAchievementBook.items.length,24);
assert.strictEqual(context.DormGame,G,'浏览器模块不能覆盖游戏引擎');
console.log('Achievement book passed: 24 goals, 57 legacy rules, real mini/practice replay, day and wage boundaries, evidence accuracy, read-only browser export.');
