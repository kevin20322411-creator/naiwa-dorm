// 页面控制逻辑的隔离检查。这里使用最小 DOM 替身，不代替真实浏览器视觉检查。
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=__dirname+'/../dist/';
function boot(storage=new Map(),search='',blockedWrites=new Set()){
 const nodes=new Map(),lists=new Map();let html='';
 const staticIds=new Set(['app','toast','collection-count','sound-btn','music-btn','collection-btn','collection-modal','collection-grid','collection-tabs','achievement-detail','achievement-detail-title','achievement-detail-body','achievement-detail-close','achievement-detail-back','close-modal','close-modal-bottom','unlock-modal','unlock-title','unlock-list','unlock-close','unlock-accept','unlock-book','version-btn','footer-version','release-modal','release-version','release-date','release-list','release-skip','release-close','release-accept']);
 function element(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},setAttribute(){},focus(){},showModal(){this.open=true;},close(){this.open=false;},getBoundingClientRect(){return{left:0,top:0,right:100,bottom:100};}});return nodes.get(id);}
 const app=element('app');Object.defineProperty(app,'innerHTML',{get(){return html;},set(value){html=value;for(const key of nodes.keys())if(!staticIds.has(key)&&key!=='brand'&&key!=='intro')nodes.delete(key);lists.clear();}});
 const document={
  querySelector(q){if(q==='.brand')return element('brand');if(q==='.modal-intro')return element('intro');if(q.startsWith('#')){const id=q.slice(1);if(!staticIds.has(id)&&!html.includes('id="'+id+'"'))return null;const fresh=!nodes.has(id),node=element(id);if(fresh&&id==='player-name')node.value=html.match(/id="player-name"[^>]*value="([^"]*)"/)?.[1]||'';return node;}return null;},
  querySelectorAll(q){if(lists.has(q)&&!q.startsWith('[data-achievement')&&!q.startsWith('[data-unlock-achievement')&&!q.startsWith('[data-collection-tab')&&!q.startsWith('[data-finale'))return lists.get(q);const attr=q.match(/^\[data-([a-z-]+)\]$/)?.[1],arr=[];if(!attr)return arr;const pattern=new RegExp('\\bdata-'+attr+'(?:="([^"]*)")?(?=\\s|>)');for(const tag of (html+['collection-tabs','collection-grid','unlock-list'].map(id=>nodes.get(id)?.innerHTML||'').join('')).matchAll(/<button\b[^>]*>/g)){const found=tag[0].match(pattern);if(!found)continue;const node=Object.assign(element(attr+found[1]),{dataset:{[attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:found[1]||''},disabled:/\sdisabled(?:\s|>)/.test(tag[0])});arr.push(node);}lists.set(q,arr);return arr;}
 };
 const audioCalls=[],clipboardCalls=[];
 const ctx={document,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(blockedWrites.has(k))throw Error('Storage full');storage.set(k,v);}},console,setTimeout:()=>0,clearTimeout(){},Audio:function(src){return{pause(){audioCalls.push({type:'pause',src});},play(){audioCalls.push({type:'play',src});return Promise.resolve();}}},navigator:{clipboard:{writeText:async text=>{clipboardCalls.push(text);}}},URLSearchParams,location:{search},addEventListener(){},scrollTo(){},Date:class extends Date{static now(){return 0;}},Map,Set,JSON,Math,Object,Array,String,Number,RegExp};ctx.window=ctx;vm.createContext(ctx);
 const scripts=[...fs.readFileSync(source+'index.html','utf8').matchAll(/<script src="\.\/([^"?]+\.js)(?:\?[^"]*)?"><\/script>/g)].map(m=>m[1]);
 for(const file of scripts)vm.runInContext(fs.readFileSync(source+file,'utf8'),ctx,{filename:file});
 return{document,storage,audioCalls,clipboardCalls,G:ctx.DormGame,A:ctx.DormAchievementBook,html:()=>html,saved:()=>JSON.parse(storage.get('naiwa-dorm-run-v2')||'null')};
}
function pickIdentity(ui){const cards=ui.document.querySelectorAll('[data-identity]');if(cards.length&&!/class="identity-card[^"]*\bselected\b/.test(ui.html()))cards[0].onclick();}
const releaseUI=boot();assert(releaseUI.document.querySelector('#release-modal').open,'进入时自动展示公告');assert.equal(releaseUI.document.querySelector('#release-version').textContent,'v9.8');assert(releaseUI.document.querySelector('#release-list').innerHTML.includes('早餐分档菜单'));assert(!/概率|100万|1000000|20%|亲密度|触发条件/.test(releaseUI.document.querySelector('#release-list').innerHTML),'公告不泄露结果与条件');
releaseUI.document.querySelector('#release-accept').onclick();assert(!releaseUI.document.querySelector('#release-modal').open);assert(boot(releaseUI.storage).document.querySelector('#release-modal').open,'未选择不再提醒时，下次进入仍展示');releaseUI.document.querySelector('#version-btn').onclick();assert(releaseUI.document.querySelector('#release-modal').open,'顶部版本可重新查看');releaseUI.document.querySelector('#release-skip').checked=true;releaseUI.document.querySelector('#release-close').onclick();assert(!boot(releaseUI.storage).document.querySelector('#release-modal').open,'同版本不再提醒');const olderRelease=boot(new Map([['naiwa-dorm-release-hidden','"6.11"']]));assert(olderRelease.document.querySelector('#release-modal').open,'新版本重新提醒');olderRelease.document.querySelector('#release-modal').oncancel({preventDefault(){}});assert(!olderRelease.document.querySelector('#release-modal').open,'Escape可关闭');assert.equal(releaseUI.saved(),null,'公告操作不修改游戏存档');
const lockUI=boot();lockUI.document.querySelector('#new-run').onclick();
lockUI.document.querySelector('#player-name').value='锁定奶蛙';
const originalBatch=lockUI.document.querySelectorAll('[data-trait]').map(b=>b.dataset.trait),locked=originalBatch[0];
lockUI.document.querySelectorAll('[data-trait]')[0].onclick();lockUI.document.querySelector('#reroll').onclick();
const secondBatch=lockUI.document.querySelectorAll('[data-trait]').map(b=>b.dataset.trait);
assert.equal(secondBatch.length,6);assert(secondBatch.every(id=>!originalBatch.includes(id)));
assert.equal(lockUI.document.querySelectorAll('[data-remove-trait]')[0].dataset.removeTrait,locked);
lockUI.document.querySelectorAll('[data-trait]')[0].onclick();
const held=secondBatch[0];lockUI.document.querySelector('#reroll').onclick();
assert.equal(lockUI.document.querySelectorAll('[data-remove-trait]').length,2,'两项已选跨批保留');
lockUI.document.querySelectorAll('[data-remove-trait]').find(b=>b.dataset.removeTrait===locked).onclick();
assert.equal(lockUI.document.querySelectorAll('[data-remove-trait]').length,1);
lockUI.document.querySelectorAll('[data-trait]')[0].onclick();lockUI.document.querySelectorAll('[data-trait]')[1].onclick();pickIdentity(lockUI);lockUI.document.querySelector('#enroll').onclick();
assert.equal(lockUI.saved().name,'锁定奶蛙');assert(lockUI.G.selectedTraits(lockUI.saved()).includes(held));assert(!lockUI.G.selectedTraits(lockUI.saved()).includes(locked));
const ui=boot();assert(ui.document.querySelector('#new-run'),'首页保留入学入口');
ui.document.querySelector('#new-run').onclick();
ui.document.querySelectorAll('[data-trait]')[0].onclick();
ui.document.querySelectorAll('[data-trait]')[1].onclick();
ui.document.querySelectorAll('[data-trait]')[2].onclick();
pickIdentity(ui);ui.document.querySelector('#enroll').onclick();
const firstMenu=JSON.stringify(ui.G.getScene(ui.saved()).choices);
const choiceArea=ui.html().slice(ui.html().indexOf('<div class="choices">'));
assert(!/电量 [+-]\d|学业 [+-]\d|亲密度 [+-]\d|课设 \+\d/.test(choiceArea),'选择前不展示精确后果');assert(choiceArea.includes('¥'),'已知餐价仍可见');
for(let turn=0;turn<40&&ui.saved().phase!=='dayEnd';turn++){
 const state=ui.saved(),scene=ui.G.getScene(state);
 const options=scene.choices.map((c,i)=>({c,i,score:Math.min(100,state.stats.energy+(c.mods.energy||0))+Math.min(100,state.stats.study+(c.mods.study||0))})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-state.stats.money).sort((a,b)=>b.score-a.score);
 ui.document.querySelectorAll('[data-choice]')[options[0].i].onclick();
 ui.document.querySelector('#next-scene').onclick();
 assert(!ui.saved().failed,'稳健选择应至少能完成这个首日样本');
}
assert.equal(ui.saved().phase,'dayEnd');assert(ui.document.querySelector('#continue-day'));
assert(!ui.document.querySelector('#unlock-modal').open,'平安过一天不再解锁凑数成就');
assert(!ui.audioCalls.some(c=>c.type==='play'),'普通选择和普通结算保持安静');
assert(ui.html().includes('新课压力'));
ui.document.querySelector('#continue-day').onclick();
assert.equal(ui.saved().day,2);assert.notEqual(JSON.stringify(ui.G.getScene(ui.saved()).choices),firstMenu,'次日早餐菜单应有变化');
const afterReload=boot(ui.storage);afterReload.document.querySelector('#resume-run').onclick();
assert.equal(afterReload.saved().eventId,ui.saved().eventId);assert(afterReload.html().includes('第 2 天'));
assert(!afterReload.html().includes('奶士学位'),'游戏页面不再显示学位进度');
afterReload.document.querySelector('#sound-btn').onclick();
const playCount=afterReload.audioCalls.filter(c=>c.type==='play').length;
afterReload.document.querySelectorAll('[data-choice]').find(c=>!c.disabled).onclick();
assert.equal(afterReload.audioCalls.filter(c=>c.type==='play').length,playCount,'静音后选择不能继续播放声音');
const G=ui.G;
const oldKept=require('../dist/relationships.js').choose(require('./relationships.cjs').fixtures().keep,4),keptUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(oldKept)]])),shownKeptResult=oldKept.outcome.result.replaceAll('奶粉',oldKept.romance.dating?'你的宝宝':'奶粉').replace(/\n/g,'<br>');
assert.doesNotThrow(()=>keptUI.document.querySelector('#resume-run').onclick(),'旧档履约结果可以打开');assert(keptUI.html().includes(oldKept.outcome.title));assert(keptUI.html().includes('食堂 · 甜品窗口'));assert(keptUI.html().includes(shownKeptResult));assert(keptUI.G.valid(keptUI.saved()));
const keptReload=boot(keptUI.storage);keptReload.document.querySelector('#resume-run').onclick();assert(keptReload.html().includes(shownKeptResult));const keptNext=keptReload.document.querySelector('#next-scene').onclick;keptNext();const keptAdvanced=keptReload.storage.get('naiwa-dorm-run-v2');assert.equal(keptReload.saved().phase,'choice','履约结果应继续到新选择');assert(keptReload.G.valid(keptReload.saved()));keptNext();assert.equal(keptReload.storage.get('naiwa-dorm-run-v2'),keptAdvanced,'连续点击不跳过新事件');assert(!keptReload.html().includes(oldKept.relationships.pending.previous.outcome.result),'不再显示约会前的旧结果');
for(const target of ['energy','study']){
 let found=null;
 for(let seed=0;seed<30&&!found;seed++){
  let s=G.create(seed,['bed','chaos'],'失败检查');
  for(let turn=0;turn<180&&s.phase!=='ending';turn++){
   if(s.phase==='choice'){
    const scene=G.getScene(s),opts=scene.choices.map((c,i)=>({c,i})).filter(o=>!o.c.disabledReason&&(o.c.mods.money||0)>=-s.stats.money).sort((a,b)=>(a.c.mods[target]||0)-(b.c.mods[target]||0));s=G.choose(s,opts[0].i);
   }else if(s.phase==='outcome')s=G.next(s);else s=G.continueDay(s);
  }
  if(s.failed==='fail-'+target)found=s;
 }
 assert(found,'应能通过正常选择走到目标失败结局');
 const failStore=new Map([['naiwa-dorm-run-v2',JSON.stringify(found)]]),failureUI=boot(failStore);failureUI.document.querySelector('#resume-run').onclick();
 assert(failureUI.html().includes(target==='energy'?'奶蛙强制关机':'学业劝退通知'));
 assert.equal(failureUI.document.querySelector('#continue-day'),null);
}
const duplicateBook=boot(new Map([['naiwa-dorm-endings-v1','["ordinary","ordinary"]']]));
assert.equal(duplicateBook.document.querySelector('#collection-count').textContent,'0/'+duplicateBook.A.items.length);
const legacyDay8=require('./fixtures/v2-saves.json').find(f=>f.name==='dayEnd').save;
const awardUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(legacyDay8)]]));
awardUI.document.querySelector('#resume-run').onclick();
assert.equal(awardUI.audioCalls.filter(c=>c.type==='play').length,0,'旧版七天称号不再触发新成就');awardUI.document.querySelector('#sound-btn').onclick();awardUI.document.querySelector('#sound-btn').onclick();
awardUI.document.querySelector('#sound-btn').onclick();
assert(awardUI.audioCalls.some(c=>c.type==='pause'),'静音立即停止已有声音');
const deadlineUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(require('./fixtures/v6-deadline.json'))]]));
deadlineUI.document.querySelector('#resume-run').onclick();assert(deadlineUI.html().includes('这周的课设，要交了。'));
assert(deadlineUI.html().includes('本周课设'));assert(deadlineUI.html().includes('通宵补完再交'));
deadlineUI.document.querySelectorAll('[data-choice]')[0].onclick();assert.equal(deadlineUI.saved().term.passed,1);
deadlineUI.document.querySelector('#next-scene').onclick();assert.equal(deadlineUI.saved().phase,'dayEnd');
deadlineUI.document.querySelector('#continue-day').onclick();assert.equal(deadlineUI.saved().day,8);assert.equal(deadlineUI.saved().term.progress,0);
const loveSample=require('./romance.cjs').simulate(0);
const noContact=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.encounter)]]));noContact.document.querySelector('#resume-run').onclick();assert(!noContact.html().includes('aria-label="亲密度"'));assert(noContact.html().includes('奶粉'));assert(!noContact.html().includes('粉色的奶蛙'));assert(!noContact.html().includes('一只奶粉'));
const contactUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.contact)]]));contactUI.document.querySelector('#resume-run').onclick();assert(contactUI.html().includes('aria-valuenow="20"'));assert(contactUI.html().includes('alt="奶粉"'));
const confessUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.confession)]]));confessUI.document.querySelector('#resume-run').onclick();confessUI.document.querySelectorAll('[data-choice]')[0].onclick();assert(confessUI.saved().romance.dating);assert(!confessUI.document.querySelector('#unlock-modal').open,'刚表白成功还不足以解锁更高门槛恋爱成就');
assert.equal(confessUI.audioCalls.filter(c=>c.type==='play').length,0);assert(!JSON.parse(confessUI.storage.get('naiwa-dorm-endings-v1')||'[]').includes('love-ending'));
const loveReload=boot(confessUI.storage);loveReload.document.querySelector('#resume-run').onclick();assert(loveReload.html().includes('恋人'));assert(!loveReload.document.querySelector('#unlock-modal').open);
const storyContact=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(require('./fixtures/v6-romance.json'))]]));storyContact.document.querySelector('#resume-run').onclick();assert(storyContact.saved().storyMode);assert(storyContact.G.valid(storyContact.saved()));assert(storyContact.html().includes('class="changes"'),'选择后保留真实变化');
const rapidUI=boot();rapidUI.document.querySelector('#new-run').onclick();rapidUI.document.querySelectorAll('[data-trait]')[0].onclick();rapidUI.document.querySelectorAll('[data-trait]')[1].onclick();rapidUI.document.querySelectorAll('[data-trait]')[2].onclick();pickIdentity(rapidUI);rapidUI.document.querySelector('#enroll').onclick();
const staleChoice=rapidUI.document.querySelectorAll('[data-choice]').find(b=>!b.disabled).onclick;
staleChoice();let rapidSnapshot=rapidUI.storage.get('naiwa-dorm-run-v2');assert.doesNotThrow(staleChoice);assert.equal(rapidUI.storage.get('naiwa-dorm-run-v2'),rapidSnapshot);
const staleNext=rapidUI.document.querySelector('#next-scene').onclick;staleNext();rapidSnapshot=rapidUI.storage.get('naiwa-dorm-run-v2');assert.doesNotThrow(staleNext);assert.doesNotThrow(staleChoice);assert.equal(rapidUI.storage.get('naiwa-dorm-run-v2'),rapidSnapshot,'旧事件按钮不能操作新事件');
rapidUI.document.querySelectorAll('[data-choice]').find(b=>!b.disabled).onclick();rapidSnapshot=rapidUI.storage.get('naiwa-dorm-run-v2');staleNext();assert.equal(rapidUI.storage.get('naiwa-dorm-run-v2'),rapidSnapshot,'上一场的继续按钮不能跳过这一场');
const rapidDay=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.last)]]));rapidDay.document.querySelector('#resume-run').onclick();
const staleContinue=rapidDay.document.querySelector('#continue-day').onclick,staleRetire=rapidDay.document.querySelector('#retire-run').onclick;staleContinue();rapidSnapshot=rapidDay.storage.get('naiwa-dorm-run-v2');assert.doesNotThrow(staleContinue);assert.doesNotThrow(staleRetire);assert.equal(rapidDay.storage.get('naiwa-dorm-run-v2'),rapidSnapshot);
for(const bad of ['broken JSON','null','{}','[]'])assert.doesNotThrow(()=>boot(new Map([['naiwa-dorm-run-v2',bad]])));
const gymUI=boot();gymUI.document.querySelector('#new-run').onclick();gymUI.document.querySelectorAll('[data-trait]')[0].onclick();gymUI.document.querySelectorAll('[data-trait]')[1].onclick();gymUI.document.querySelectorAll('[data-trait]')[2].onclick();pickIdentity(gymUI);gymUI.document.querySelector('#enroll').onclick();gymUI.document.querySelectorAll('[data-choice]').find(b=>!b.disabled).onclick();
const gymButton=gymUI.document.querySelectorAll('[data-activity]').find(b=>b.dataset.activity==='gym');assert(gymButton,'事件后有主动健身入口');gymButton.onclick();assert(gymUI.saved().rhythm.pending);assert(gymUI.html().includes('自重练习'));
const gymReload=boot(gymUI.storage);gymReload.document.querySelector('#resume-run').onclick();const gymHealth=gymReload.saved().stats.health;gymReload.document.querySelectorAll('[data-choice]')[1].onclick();assert(gymReload.saved().stats.health>=gymHealth);assert.equal(gymReload.saved().outcome.origin,'self');assert(gymReload.G.valid(gymReload.saved()));assert(!gymReload.html().includes(' / 8'));
const admissionUI=boot();admissionUI.document.querySelector('#new-run').onclick();admissionUI.document.querySelectorAll('[data-trait]')[0].onclick();admissionUI.document.querySelectorAll('[data-trait]')[1].onclick();admissionUI.document.querySelectorAll('[data-trait]')[2].onclick();
pickIdentity(admissionUI);const delayedEnroll=admissionUI.document.querySelector('#enroll').onclick;delayedEnroll();admissionUI.document.querySelectorAll('[data-choice]').find(b=>!b.disabled).onclick();
const admissionSave=admissionUI.storage.get('naiwa-dorm-run-v2');delayedEnroll();assert.equal(admissionUI.storage.get('naiwa-dorm-run-v2'),admissionSave,'重复或延迟入学操作不能重置已经进行的游戏');
const illnessSamples=require('./illness.cjs').fixtures();
const sickUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(illnessSamples.onset)]]));sickUI.document.querySelector('#resume-run').onclick();assert(sickUI.html().includes('生病状态'));assert(sickUI.document.querySelector('#clinic-btn'));
sickUI.document.querySelector('#clinic-btn').onclick();assert(sickUI.html().includes('奶蛙决定去校医院'));sickUI.document.querySelectorAll('[data-choice]')[0].onclick();assert(!sickUI.saved().illness.active);assert(!sickUI.html().includes('生病状态'));assert(sickUI.G.valid(sickUI.saved()));
const sickDayUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(illnessSamples.dayEnd)]]));sickDayUI.document.querySelector('#resume-run').onclick();assert(sickDayUI.html().includes('预约明早校医'));assert(!sickDayUI.html().includes('<b>+-'));assert(/健康 <b>-\d/.test(sickDayUI.html()));
sickDayUI.document.querySelector('#clinic-btn').onclick();const careIndex=sickDayUI.document.querySelectorAll('[data-choice]').findIndex(b=>!b.disabled);sickDayUI.document.querySelectorAll('[data-choice]')[careIndex].onclick();assert(sickDayUI.saved().illness.appointment);assert(sickDayUI.html().includes('已预约明早校医'));assert.equal(sickDayUI.document.querySelector('#clinic-btn'),null);sickDayUI.document.querySelector('#continue-day').onclick();assert(!sickDayUI.saved().illness.active);assert(sickDayUI.G.valid(sickDayUI.saved()));
const meetingSamples=require('./meetings.cjs').fixtures();
const groupUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(meetingSamples.group)]]));groupUI.document.querySelector('#resume-run').onclick();assert(groupUI.html().includes('小组作业'));if(groupUI.G.getScene(groupUI.saved()).naifenInitiated){assert(groupUI.html().includes('奶粉主动'));groupUI.document.querySelectorAll('[data-choice]')[0].onclick();assert(groupUI.saved().romance.connected);}else{assert(groupUI.html().includes('先一起拆解任务'));groupUI.document.querySelectorAll('[data-choice]')[1].onclick();assert.equal(groupUI.saved().outcome.project,6);}assert(groupUI.G.valid(groupUI.saved()));
const declinedUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(meetingSamples.declinedBefore)]]));declinedUI.document.querySelector('#resume-run').onclick();declinedUI.document.querySelectorAll('[data-choice]')[0].onclick();if(!declinedUI.saved().romance.connected){assert.equal(declinedUI.saved().outcome.changes.mood,-6);assert(declinedUI.html().includes('心情 -6'));}assert(declinedUI.G.valid(declinedUI.saved()));
const junkUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(illnessSamples.menu)]]));junkUI.document.querySelector('#resume-run').onclick();assert(junkUI.G.getScene(junkUI.saved()).choices.some(c=>c.riskFood));assert(!junkUI.html().includes('可能引起身体不适'));assert(!junkUI.html().includes('患病风险'));
const wellnessSamples=require('./wellness.cjs').fixtures();
const mouseUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(wellnessSamples.mouseStudy)]]));mouseUI.document.querySelector('#resume-run').onclick();assert(mouseUI.html().includes('naishu-cutout.png'));assert(mouseUI.html().includes('奶鼠'));assert(mouseUI.html().includes('mouse-art'));assert(mouseUI.html().includes('自习'));mouseUI.document.querySelectorAll('[data-choice]')[0].onclick();assert(mouseUI.G.valid(mouseUI.saved()));
const coldUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(wellnessSamples.cold)]]));coldUI.document.querySelector('#resume-run').onclick();assert(coldUI.html().includes('奶蛙感冒了'));assert(coldUI.html().includes('先休息一阵'));const coldHealth=coldUI.saved().stats.health;coldUI.document.querySelectorAll('[data-choice]')[1].onclick();assert.equal(coldUI.saved().stats.health,coldHealth);assert(coldUI.saved().illness.active);assert(coldUI.G.valid(coldUI.saved()));
const campusTests=require('./campus-life.cjs'),bugSamples=campusTests.legacyBugs(),campusSamples=campusTests.fixtures();
const failedCourseUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(bugSamples.courseAfter)]]));failedCourseUI.document.querySelector('#resume-run').onclick();assert.equal(failedCourseUI.saved().failed,'fail-course');assert(failedCourseUI.html().includes('重修'));assert.equal(failedCourseUI.document.querySelector('#continue-day'),null);
const mouseContextUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(bugSamples.mouseBefore)]]));mouseContextUI.document.querySelector('#resume-run').onclick();mouseContextUI.document.querySelector('#next-scene').onclick();assert.equal(mouseContextUI.G.getScene(mouseContextUI.saved()).place,'食堂外');assert(mouseContextUI.G.valid(mouseContextUI.saved()));
const campusUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(campusSamples.newCampus)]]));campusUI.document.querySelector('#resume-run').onclick();assert(campusUI.html().includes('校园征集'));campusUI.document.querySelectorAll('[data-choice]').find(c=>!c.disabled).onclick();assert(campusUI.G.valid(campusUI.saved()));
console.log('通过：二次缺交终止、奶鼠场景一致、新校园事件，以及原有UI、互动和存档恢复。');

const lotterySamples=require('./lottery.cjs').fixtures();
const lotteryUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(lotterySamples.offers[0])]]));lotteryUI.document.querySelector('#resume-run').onclick();assert(lotteryUI.html().includes('彩票摊'));assert(lotteryUI.html().includes('¥5'));lotteryUI.document.querySelectorAll('[data-choice]')[1].onclick();assert.equal(lotteryUI.saved().lottery.won,false);assert(lotteryUI.G.valid(lotteryUI.saved()));
const jackpotUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(lotterySamples.jackpot.before)]]));jackpotUI.document.querySelector('#resume-run').onclick();jackpotUI.document.querySelectorAll('[data-choice]')[0].onclick();assert.equal(jackpotUI.saved().phase,'ending');assert(jackpotUI.html().includes('奶生赢家'));assert(jackpotUI.html().includes('large-money'));assert.equal(jackpotUI.document.querySelector('#continue-day'),null);assert(jackpotUI.document.querySelector('#unlock-modal').open);assert(jackpotUI.G.valid(jackpotUI.saved()));
console.log('通过：彩票价格、不买继续、百万大奖结局和金额显示。');

assert.equal(lockUI.G.selectedTraits(lockUI.saved()).length,3,'三项天赋实际进入存档');assert(Number.isFinite(lockUI.saved().stats.charm));assert.equal(ui.G.traits.length,41);
const charFixture=require('./fixtures/v6-character.json');const bittenUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(charFixture.bitten)]]));bittenUI.document.querySelector('#resume-run').onclick();assert(bittenUI.html().includes('及时'));const biteNotice=bittenUI.html().split('aria-label="奶鼠咬伤"')[1]?.split('</section>')[0]||'';assert(!/最迟|逾期|长眠/.test(biteNotice));assert(!bittenUI.html().includes('逾期会触发'));
const proposalUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(charFixture.proposal)]]));proposalUI.document.querySelector('#resume-run').onclick();assert(proposalUI.html().includes('奶粉认真说出了自己的心意'));proposalUI.document.querySelectorAll('[data-choice]')[1].onclick();assert(!proposalUI.saved().romance.connected);assert(proposalUI.G.valid(proposalUI.saved()));
const mouseHiddenUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(charFixture.hidden)]]));mouseHiddenUI.document.querySelector('#resume-run').onclick();assert(mouseHiddenUI.html().includes('奶鼠全网呼叫'));assert(mouseHiddenUI.html().includes('奶蛙被赶来的奶家人'));assert(!mouseHiddenUI.html().includes('奶娃'));assert.equal(mouseHiddenUI.document.querySelector('#continue-day'),null);
console.log('通过：三天赋、魅力、无剧透疫苗提示、奶粉主动表白和奶鼠隐藏结局。');

const backgroundUI=boot();backgroundUI.document.querySelector('#new-run').onclick();
const initialIdentities=backgroundUI.document.querySelectorAll('[data-identity]');assert.equal(initialIdentities.length,3);assert.equal(new Set(initialIdentities.map(x=>x.dataset.identity)).size,3);assert(!backgroundUI.html().includes('data-background='),'旧身份入口已移除');
const veteranUI=boot(new Map([['naiwa-dorm-endings-v1','["week"]']]));veteranUI.document.querySelector('#new-run').onclick();assert.equal(veteranUI.document.querySelectorAll('[data-identity]').length,3);pickIdentity(veteranUI);veteranUI.document.querySelectorAll('[data-trait]')[0].onclick();veteranUI.document.querySelectorAll('[data-trait]')[1].onclick();veteranUI.document.querySelectorAll('[data-trait]')[2].onclick();veteranUI.document.querySelector('#enroll').onclick();assert(veteranUI.saved().admission);assert(veteranUI.G.valid(veteranUI.saved()));
const existingRun=JSON.stringify(lockUI.saved()),sharedStorage=new Map([['naiwa-dorm-run-v2',existingRun],['naiwa-dorm-recent-v2','["lost-key","love-message"]']]),sharedUI=boot(sharedStorage,'?seed=424242&bg=creative&traits=brain,toolkit,flirt');assert(sharedUI.html().includes('收到一个同起点开局'));assert.equal(sharedStorage.get('naiwa-dorm-run-v2'),existingRun,'打开分享链接不覆盖进度');sharedUI.document.querySelector('#new-run').onclick();assert.equal(sharedStorage.get('naiwa-dorm-run-v2'),existingRun,'进入确认页仍保留原局');assert.equal(sharedUI.document.querySelectorAll('[data-remove-trait]').length,3);assert(sharedUI.html().includes('旧版分享开局'));assert.equal(sharedUI.document.querySelectorAll('[data-background]').length,0,'旧身份选项已移除');sharedUI.document.querySelector('#reroll').onclick();pickIdentity(sharedUI);sharedUI.document.querySelector('#enroll').onclick();assert.equal(sharedUI.saved().seed,424242,'换批不改变人生起点');assert.equal(sharedUI.saved().recent.length,0,'新起点不受接收者以往事件影响');assert.equal(sharedUI.saved().journeys.backgroundId,'creative');assert.deepEqual(sharedUI.G.selectedTraits(sharedUI.saved()),['brain','toolkit','flirt']);assert(!JSON.parse(sharedStorage.get('naiwa-dorm-endings-v1')||'[]').includes('week'),'分享体验不写入永久解锁');assert(sharedUI.G.valid(sharedUI.saved()));sharedUI.document.querySelector('#pause-run').onclick();sharedUI.document.querySelector('#share-start').onclick();assert.deepEqual(sharedUI.clipboardCalls,['https://kevin20322411-creator.github.io/naiwa-dorm/?seed=424242&bg=creative&traits=brain,toolkit,flirt']);sharedUI.document.querySelector('#new-run').onclick();assert.equal(sharedUI.document.querySelectorAll('[data-identity]').length,3,'普通新局显示三选一身份');
for(const query of ['?seed=-1&bg=freshman&traits=brain,toolkit,flirt','?seed=4294967296&bg=freshman&traits=brain,toolkit,flirt','?seed=8&bg=unknown&traits=brain,toolkit,flirt','?seed=8&bg=freshman&traits=brain,brain,flirt','?seed=8&bg=freshman&traits=brain,toolkit,%3Cscript%3E']){const invalidUI=boot(new Map(),query);assert(!invalidUI.html().includes('class="shared-start-note"'),'无效分享参数应忽略');assert.equal(invalidUI.saved(),null);}
const talkButton=contactUI.document.querySelectorAll('[data-activity]').find(b=>b.dataset.activity==='bond-talk');assert(talkButton,'关系卡与聊天入口已接入');const undiscovered=contactUI.G.relationshipStatus(contactUI.saved());assert.equal(undiscovered.knownActivity,null);assert.equal(undiscovered.knownTaste,null);talkButton.onclick();contactUI.document.querySelectorAll('[data-choice]')[0].onclick();const discovered=contactUI.G.relationshipStatus(contactUI.saved());assert(discovered.knownActivity);assert(contactUI.html().includes('喜欢'+discovered.knownActivity));assert.equal(discovered.knownTaste,null);const nextPlan=contactUI.document.querySelectorAll('[data-activity]').find(b=>b.dataset.activity==='bond-plan');assert(nextPlan,'聊天结果页可直接继续安排');nextPlan.onclick();contactUI.document.querySelectorAll('[data-choice]')[0].onclick();assert(contactUI.html().includes('约好：'));const promiseReload=boot(contactUI.storage);promiseReload.document.querySelector('#resume-run').onclick();assert(promiseReload.html().includes('约好：'));assert(promiseReload.G.valid(promiseReload.saved()));
console.log('通过：背景解锁、临时分享背景、开局链接安全校验与不覆盖进度、三天赋同起点、偏好发现和约定恢复。');

const playerQuery='?seed=2112117372&bg=sport&traits=chosen,food,athletic',playerShare=boot(new Map([['naiwa-dorm-run-v2',existingRun]]),playerQuery);assert(playerShare.html().includes('体验这个开局'));assert(playerShare.html().includes('继续我的存档'));for(const name of ['运动社新成员','天选之子','天选干饭人','运动底子'])assert(playerShare.html().includes(name));assert(!playerShare.document.querySelector('#share-start'),'受邀页面不混入旧存档分享入口');playerShare.document.querySelector('#new-run').onclick();assert(playerShare.html().includes('确认这次的开局'));assert(playerShare.html().includes('已选：天选之子 · 天选干饭人 · 运动底子'));assert.equal(playerShare.storage.get('naiwa-dorm-run-v2'),existingRun);playerShare.document.querySelector('#back-home').onclick();assert(playerShare.html().includes('体验这个开局'),'取消确认后仍可返回同一起点');playerShare.document.querySelector('#random-run').onclick();assert.equal(playerShare.document.querySelectorAll('[data-remove-trait]').length,0);playerShare.document.querySelector('#back-home').onclick();playerShare.document.querySelector('#new-run').onclick();pickIdentity(playerShare);playerShare.document.querySelector('#enroll').onclick();assert.equal(playerShare.saved().seed,2112117372);assert.equal(playerShare.saved().journeys.backgroundId,'sport');assert.deepEqual(playerShare.G.selectedTraits(playerShare.saved()),['chosen','food','athletic']);assert(playerShare.G.valid(playerShare.saved()));assert(boot(new Map(),playerQuery.replaceAll('&','\\&')).html().includes('体验这个开局'),'兼容聊天文本中的转义连接符');console.log('通过：用户实际分享链接、清晰入口、取消返回、随机开局与旧档保护。');

const chatFixture=require('./relationships.cjs').fixtures().start,chatUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(chatFixture)]]));chatUI.document.querySelector('#resume-run').onclick();assert(!/今天她有件开心的小事|今天她有些疲惫|今天她忙着赶任务/.test(chatUI.html()),'关系卡不直接展示奶粉的想法');chatUI.document.querySelectorAll('[data-activity]').find(b=>b.dataset.activity==='ask-chat').onclick();assert(chatUI.html().includes('奶蛙给你的宝宝发了条消息。'));assert(chatUI.html().includes('聊点什么呢？'));assert(chatUI.html().includes('聊到一半刷起手机，迟迟没有回复'));assert(!/今天她有件开心的小事|今天她有些疲惫|今天她忙着赶任务/.test(chatUI.html()),'场景正文不重复公开对方想法');chatUI.document.querySelectorAll('[data-choice]')[2].onclick();assert(chatUI.html().includes('以为你正在忙'));assert(chatUI.G.valid(chatUI.saved()),'文案调整不影响游戏存档');console.log('通过：自然聊天文案、不泄露奶粉想法、旧流程回放。');

const relationTests=require('./relationships.cjs'),promiseFixture=relationTests.fixtures().promise,promiseDue=relationTests.until(promiseFixture,s=>s.phase==='dayEnd'&&s.day===promiseFixture.relationships.promise.dueDay),dueUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(promiseDue)]]));dueUI.document.querySelector('#resume-run').onclick();const expectedRest=dueUI.G.restPreview(dueUI.saved()),expectedMood=expectedRest.changes.mood;assert(dueUI.html().includes('心情 <b>'+(expectedMood>=0?'+':'')+expectedMood+'</b>'),'失约的次日预览显示实际心情变化');dueUI.document.querySelector('#continue-day').onclick();assert.equal(dueUI.saved().stats.mood,expectedRest.stats.mood);assert(dueUI.G.valid(dueUI.saved()));console.log('通过：失约次日预览、实际结算与存档一致。');



const mapUI=boot();mapUI.document.querySelector('#new-run').onclick();mapUI.document.querySelectorAll('[data-trait]')[0].onclick();mapUI.document.querySelectorAll('[data-trait]')[1].onclick();mapUI.document.querySelectorAll('[data-trait]')[2].onclick();pickIdentity(mapUI);mapUI.document.querySelector('#enroll').onclick();
assert(mapUI.html().includes('data-canteen="choice"'));assert.equal(mapUI.document.querySelectorAll('[data-choice]').length,5);const mapInitial=mapUI.storage.get('naiwa-dorm-run-v2'),oldMealClick=mapUI.document.querySelectorAll('[data-choice]')[0].onclick;
mapUI.document.querySelector('#campus-open').onclick();assert.equal(mapUI.document.querySelectorAll('[data-place]').length,17);assert(mapUI.html().includes('天赐庄校区'));assert.equal(mapUI.document.querySelectorAll('[data-map-activity]').length,0,'眼前事件未处理时只浏览地图');mapUI.document.querySelectorAll('[data-place]').find(b=>b.dataset.place==='sports').onclick();assert(mapUI.html().includes('运动场'));mapUI.document.querySelector('#campus-return').onclick();oldMealClick();assert.equal(mapUI.storage.get('naiwa-dorm-run-v2'),mapInitial,'浏览地图不改状态，旧页面按钮不能操作返回后的页面');
mapUI.document.querySelectorAll('[data-choice]')[0].onclick();assert(mapUI.html().includes('data-canteen="outcome"'));assert(mapUI.G.valid(mapUI.saved()));const fedMapSave=mapUI.storage.get('naiwa-dorm-run-v2');mapUI.document.querySelector('#campus-shortcut').onclick();mapUI.document.querySelectorAll('[data-place]').find(b=>b.dataset.place==='sports').onclick();assert.equal(mapUI.storage.get('naiwa-dorm-run-v2'),fedMapSave,'选择目的地不消耗资源');const gymMapClick=mapUI.document.querySelectorAll('[data-map-activity]').find(b=>b.dataset.mapActivity==='gym').onclick;gymMapClick();assert.equal(mapUI.saved().rhythm.pending.key,'gym');const gymMapSave=mapUI.storage.get('naiwa-dorm-run-v2');gymMapClick();assert.equal(mapUI.storage.get('naiwa-dorm-run-v2'),gymMapSave,'地图旧按钮不能重复安排活动');assert(mapUI.G.valid(mapUI.saved()));
const mapReload=boot(mapUI.storage);mapReload.document.querySelector('#resume-run').onclick();assert.equal(mapReload.saved().eventId,mapUI.saved().eventId);assert(mapReload.html().includes('自重练习'));assert(mapReload.G.valid(mapReload.saved()));
console.log('通过：可视化点餐、校园地图17地点、只读浏览、地点健身、连续点击与旧档恢复。');

const stallUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(ui.G.create(72,['budget','brain','athletic'],'档口',[],'freshman'))]]));stallUI.document.querySelector('#resume-run').onclick();const stallBefore=stallUI.storage.get('naiwa-dorm-run-v2');assert.equal(stallUI.document.querySelectorAll('[data-stall]').length,6);stallUI.document.querySelectorAll('[data-stall]').find(b=>b.dataset.stall==='outside').onclick();assert.equal(stallUI.storage.get('naiwa-dorm-run-v2'),stallBefore);assert(stallUI.html().includes('校外用餐'));const outsideClick=stallUI.document.querySelectorAll('[data-choice]').find(b=>b.dataset.choice==='21').onclick;outsideClick();assert(stallUI.saved().outcome.outside);assert.equal(stallUI.saved().nutrition.value,100);assert(stallUI.G.valid(stallUI.saved()));const outsideSaved=stallUI.storage.get('naiwa-dorm-run-v2');outsideClick();assert.equal(stallUI.storage.get('naiwa-dorm-run-v2'),outsideSaved);console.log('通过：档口只读切换、校外用餐、饱食度、重复点击与存档恢复。');

const expanded=ui.G.choose(ui.G.create(72,['budget','brain','athletic'],'探索',[],'freshman'),0),expUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(expanded)]]));expUI.document.querySelector('#resume-run').onclick();assert(expUI.document.querySelectorAll('[data-activity]').some(b=>b.dataset.activity==='sports-run'),'自由安排显示新增活动');assert(expUI.document.querySelectorAll('[data-activity]').find(b=>b.dataset.activity==='lab-apply').disabled,'学业不足的申请按钮禁用');expUI.document.querySelector('#campus-open').onclick();expUI.document.querySelectorAll('[data-place]').find(b=>b.dataset.place==='basketball').onclick();const openBasket=expUI.document.querySelectorAll('[data-map-activity]').find(b=>b.dataset.mapActivity==='sports-basketball').onclick;openBasket();assert(expUI.html().includes('球场还有人'));const takeShot=expUI.document.querySelectorAll('[data-choice]')[0].onclick;takeShot();assert(expUI.html().includes('第 2 件事'),'新活动结算保持事件序号');const shotSaved=expUI.storage.get('naiwa-dorm-run-v2');takeShot();openBasket();assert.equal(expUI.storage.get('naiwa-dorm-run-v2'),shotSaved,'旧地图和选择按钮不能重复推进');const shotReload=boot(expUI.storage);shotReload.document.querySelector('#resume-run').onclick();assert(shotReload.html().includes('手感慢慢找回来了'));shotReload.document.querySelector('#next-scene').onclick();assert(!shotReload.html().includes('球场还有人'));assert(shotReload.G.valid(shotReload.saved()));console.log('通过：新地图活动、门槛按钮、事件计数、旧点击隔离、刷新恢复与继续衔接。');

// The new collection separates targets from historical titles and stores first-unlock facts.
duplicateBook.document.querySelector('#collection-btn').onclick();
assert.equal((duplicateBook.document.querySelector('#collection-grid').innerHTML.match(/class="collection-item locked"/g)||[]).length,24);
assert(!duplicateBook.document.querySelector('#collection-grid').innerHTML.includes('普通奶'),'锁定格不写名字或条件');
const historyTab=duplicateBook.document.querySelectorAll('[data-collection-tab]').find(b=>b.dataset.collectionTab==='legacy');historyTab.onclick();
const legacyOpen=duplicateBook.document.querySelectorAll('[data-achievement]')[0];assert.equal(legacyOpen.dataset.achievement,'ordinary');
const beforeLegacyDetail=duplicateBook.storage.get('naiwa-dorm-run-v2');legacyOpen.onclick();
assert(duplicateBook.document.querySelector('#achievement-detail').open);assert(!duplicateBook.document.querySelector('#collection-modal').open);
assert(duplicateBook.document.querySelector('#achievement-detail-body').innerHTML.includes('未保存当时的触发记录'));
assert.equal(duplicateBook.storage.get('naiwa-dorm-run-v2'),beforeLegacyDetail,'看详情不修改游戏');
duplicateBook.document.querySelector('#achievement-detail').oncancel({preventDefault(){}});assert(duplicateBook.document.querySelector('#collection-modal').open);
const jackpotFacts=JSON.parse(jackpotUI.storage.get('naiwa-dorm-achievement-evidence-v1'))['lottery-winner'];assert(jackpotFacts.facts.some(f=>f.includes('1,000,000')));
jackpotUI.document.querySelectorAll('[data-unlock-achievement]').find(b=>b.dataset.unlockAchievement==='lottery-winner').onclick();
assert(jackpotUI.document.querySelector('#achievement-detail').open);assert(jackpotUI.document.querySelector('#achievement-detail-body').innerHTML.includes('本局彩票记录'));
assert(jackpotUI.document.querySelector('#achievement-detail-body').innerHTML.includes('天解锁'));jackpotUI.document.querySelector('#achievement-detail-back').onclick();assert(jackpotUI.document.querySelector('#unlock-modal').open);
const jackpotProofCopy=jackpotUI.storage.get('naiwa-dorm-achievement-evidence-v1'),jackpotReload=boot(jackpotUI.storage);jackpotReload.document.querySelector('#resume-run').onclick();assert(!jackpotReload.document.querySelector('#unlock-modal').open);assert.equal(jackpotUI.storage.get('naiwa-dorm-achievement-evidence-v1'),jackpotProofCopy,'首解锁证据不可被别局改写');
jackpotReload.document.querySelector('#collection-btn').onclick();jackpotReload.document.querySelectorAll('[data-achievement]').find(b=>b.dataset.achievement==='lottery-winner').onclick();assert(jackpotReload.document.querySelector('#achievement-detail-body').innerHTML.includes('本局彩票记录'));
// Either individual browser storage write may fail. A durable proof must still recover as earned.
for(const failedKey of ['naiwa-dorm-achievement-evidence-v1','naiwa-dorm-endings-v1']){
 const brokenStorage=new Map([['naiwa-dorm-run-v2',JSON.stringify(lotterySamples.jackpot.before)]]),blocked=new Set([failedKey]),broken=boot(brokenStorage,'',blocked);
 broken.document.querySelector('#resume-run').onclick();broken.document.querySelectorAll('[data-choice]')[0].onclick();
 if(failedKey.endsWith('evidence-v1'))assert(!JSON.parse(brokenStorage.get('naiwa-dorm-endings-v1')||'[]').includes('lottery-winner'),'不能写出缺少证据的半条新成就');
 const recovered=boot(brokenStorage);recovered.document.querySelector('#resume-run').onclick();
 assert.equal(recovered.document.querySelector('#collection-count').textContent,'1/24');
 recovered.document.querySelector('#collection-btn').onclick();recovered.document.querySelectorAll('[data-achievement]').find(b=>b.dataset.achievement==='lottery-winner').onclick();
 assert(recovered.document.querySelector('#achievement-detail-body').innerHTML.includes('本局彩票记录'));
}
assert(mapUI.html().includes('<details class="campus-agenda'),'日程不再三张卡常驻在剧情前');
console.log('通过：24项精简目标、锁定不剧透、旧称号独立保留、可点触发记录、详情返回、证据只读和部分存储失败恢复。');

const finaleStorage=jackpotUI.storage.get('naiwa-dorm-finales-v1');assert(finaleStorage);assert(JSON.parse(finaleStorage)['lottery-winner'].facts.includes('彩票奖金 ¥1,000,000'));
assert(jackpotUI.html().includes('class="ending-route-tag"'),'真正终局有可点标签');
jackpotReload.document.querySelector('#achievement-detail-back').onclick();
jackpotReload.document.querySelectorAll('[data-collection-tab]').find(b=>b.dataset.collectionTab==='finales').onclick();
assert.equal(jackpotReload.document.querySelector('.modal-intro').textContent,'已发现 1 / 9');
assert.equal((jackpotReload.document.querySelector('#collection-grid').innerHTML.match(/class="collection-item locked"/g)||[]).length,8);
jackpotReload.document.querySelectorAll('[data-finale]')[0].onclick();assert(jackpotReload.document.querySelector('#achievement-detail-body').innerHTML.includes('彩票奖金'));
jackpotReload.document.querySelector('#achievement-detail-back').onclick();assert.equal(jackpotReload.document.querySelector('.modal-intro').textContent,'已发现 1 / 9','详情返回对应的结局页');
assert.equal(jackpotReload.storage.get('naiwa-dorm-finales-v1'),finaleStorage,'看结局详情不重写记录');
assert(!ui.storage.has('naiwa-dorm-finales-v1'),'普通日终不冒充真正结局');
const oldEndingBook=boot(new Map([['naiwa-dorm-endings-v1','["fail-energy"]']]));oldEndingBook.document.querySelector('#collection-btn').onclick();oldEndingBook.document.querySelectorAll('[data-collection-tab]').find(b=>b.dataset.collectionTab==='finales').onclick();assert.equal(oldEndingBook.document.querySelector('.modal-intro').textContent,'已发现 1 / 9');oldEndingBook.document.querySelectorAll('[data-finale]')[0].onclick();assert(oldEndingBook.document.querySelector('#achievement-detail-body').innerHTML.includes('未保存当时的触发记录'));
console.log('通过：9种独立结局、真实终局标签、结局持久化与只读详情、旧终局兼容、普通日终不收录。');

// A real eligible run offers a positive route without ending or collecting it automatically.
const realResearch=require('./positive-endings.cjs').realResearch();
const researchUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(realResearch)]]));researchUI.document.querySelector('#resume-run').onclick();
assert.equal(researchUI.saved().phase,'dayEnd');assert(researchUI.G.valid(researchUI.saved()));
assert(researchUI.html().includes('可达成的正向结局'));
assert(!researchUI.storage.has('naiwa-dorm-finales-v1'),'只是满足科研条件时不提前收录结局');
const chooseResearch=researchUI.document.querySelectorAll('[data-positive-finish]').find(b=>b.dataset.positiveFinish==='ending-research').onclick;
const staleResearchContinue=researchUI.document.querySelector('#continue-day').onclick,staleResearchRetire=researchUI.document.querySelector('#retire-run').onclick;
const qualifiedDayEnd=researchUI.storage.get('naiwa-dorm-run-v2');chooseResearch();
assert.equal(researchUI.saved().phase,'ending');assert.equal(researchUI.saved().finalEnding,'ending-research');assert(researchUI.html().includes('科研成功'));assert(researchUI.html().includes('positive-card'));
assert(researchUI.G.valid(researchUI.saved()));assert.equal(JSON.stringify(researchUI.saved().positiveEnding.base),qualifiedDayEnd);
const finishedResearch=researchUI.storage.get('naiwa-dorm-run-v2');chooseResearch();staleResearchContinue();staleResearchRetire();assert.equal(researchUI.storage.get('naiwa-dorm-run-v2'),finishedResearch,'收尾后旧按钮不能重复结束或推进日期');
const researchProof=researchUI.storage.get('naiwa-dorm-finales-v1');assert(JSON.parse(researchProof)['ending-research'].facts.some(f=>f.includes('实验室活动 18 次')));
const researchReload=boot(researchUI.storage);researchReload.document.querySelector('#resume-run').onclick();assert.equal(researchReload.saved().finalEnding,'ending-research');assert.equal(researchReload.storage.get('naiwa-dorm-run-v2'),finishedResearch,'结局页面的自动升级不改写完整快照');
researchReload.document.querySelectorAll('[data-ending-route]')[0].onclick();assert(researchReload.document.querySelector('#achievement-detail-body').innerHTML.includes('实验室活动 18 次'));researchReload.document.querySelector('#achievement-detail-back').onclick();assert.equal(researchReload.document.querySelector('.modal-intro').textContent,'已发现 1 / 9');
assert.equal(researchReload.storage.get('naiwa-dorm-finales-v1'),researchProof,'刷新和看详情不重复发结局');
const resumeCampus=researchReload.document.querySelector('#resume-positive').onclick;resumeCampus();assert.equal(researchReload.saved().day,realResearch.day+1);assert(!researchReload.saved().positiveEnding);assert.equal(researchReload.saved().phase,'choice');assert(researchReload.G.valid(researchReload.saved()));
const afterPositiveContinue=researchReload.storage.get('naiwa-dorm-run-v2');resumeCampus();chooseResearch();staleResearchContinue();staleResearchRetire();assert.equal(researchReload.storage.get('naiwa-dorm-run-v2'),afterPositiveContinue,'结束和继续之后，任何旧回调都不可再次推进');
assert.equal(researchReload.storage.get('naiwa-dorm-finales-v1'),researchProof,'继续生活仍保留已收集的正向结局');
console.log('通过：真实正向结局的出现与选择、日终不强制结束、科研图鉴证据、刷新回放、继续校园生活、旧按钮重复点击隔离。');

const identityRefresh=boot();identityRefresh.document.querySelector('#new-run').onclick();assert.equal(identityRefresh.document.querySelectorAll('[data-identity]').length,3);assert(/id="enroll" disabled/.test(identityRefresh.html()),'未选身份与天赋时不能入学');
const oldIdentityReroll=identityRefresh.document.querySelector('#identity-reroll').onclick;oldIdentityReroll();const afterFirstIdentity=identityRefresh.html();oldIdentityReroll();assert.equal(identityRefresh.html(),afterFirstIdentity,'旧身份刷新回调不能继续消耗次数');identityRefresh.document.querySelector('#identity-reroll').onclick();const lastBatch=identityRefresh.html();identityRefresh.document.querySelector('#identity-reroll').onclick();assert.equal(identityRefresh.html(),lastBatch,'身份最多刷新两次');pickIdentity(identityRefresh);
identityRefresh.document.querySelectorAll('[data-trait]')[0].onclick();const heldTalent=identityRefresh.document.querySelectorAll('[data-remove-trait]')[0].dataset.removeTrait;identityRefresh.document.querySelector('#reroll').onclick();identityRefresh.document.querySelector('#reroll').onclick();const exhausted=identityRefresh.html();identityRefresh.document.querySelector('#reroll').onclick();assert.equal(identityRefresh.html(),exhausted,'天赋最多刷新两次');assert.equal(identityRefresh.document.querySelectorAll('[data-remove-trait]')[0].dataset.removeTrait,heldTalent,'已选天赋照常保留');
const celebrityQuery='?seed=72&bg=freshman&identity=celebrity&traits=gold-brain,gold-battery,optimist',celebrityUI=boot(new Map(),celebrityQuery);celebrityUI.document.querySelector('#new-run').onclick();assert(celebrityUI.html().includes('男明星'));assert(celebrityUI.html().includes('rarity-gold'));assert(!/SSR|金色天赋|金色身份/.test(celebrityUI.html()),'金色只通过按钮外观表现');celebrityUI.document.querySelector('#enroll').onclick();assert.equal(celebrityUI.saved().admission.id,'celebrity');assert.equal(celebrityUI.saved().stats.charm,100);assert(celebrityUI.html().includes('生活费'));assert(!celebrityUI.html().includes('饭钱'));
celebrityUI.document.querySelectorAll('[data-choice]')[0].onclick();const fanButtons=celebrityUI.document.querySelectorAll('[data-fan-reply]');assert([4,6].includes(fanButtons.length));const fanAccept=fanButtons.find(b=>b.dataset.fanReply.endsWith('|yes')).onclick;fanAccept();const afterFan=celebrityUI.storage.get('naiwa-dorm-run-v2');fanAccept();assert.equal(celebrityUI.storage.get('naiwa-dorm-run-v2'),afterFan,'重复点击搭讪不会重复添加或推进剧情');assert(celebrityUI.saved().romance.connected);assert(celebrityUI.G.valid(celebrityUI.saved()));
const celebReload=boot(celebrityUI.storage);celebReload.document.querySelector('#resume-run').onclick();assert(celebReload.G.valid(celebReload.saved()));assert(celebReload.html().includes('认识的同学'));celebReload.document.querySelector('#pause-run').onclick();celebReload.document.querySelector('#share-start').onclick();assert(celebReload.clipboardCalls[0].includes('identity=celebrity'));assert(celebReload.clipboardCalls[0].includes('gold-brain'));
const noIdentityGold=boot(new Map(),celebrityQuery.replace('&identity=celebrity',''));assert(!noIdentityGold.html().includes('体验这个开局'),'旧链接不能混入无法回放的新天赋');
console.log('通过：身份与天赋刷新上限、已选锁定、金色按钮、生活费标签、男明星多人搭讪、重复点击防护及新身份分享链接。');

const classmateUI=boot(new Map(),'?seed=72&bg=freshman&identity=classmate&traits=gold-brain,gold-battery,optimist');
classmateUI.document.querySelector('#new-run').onclick();classmateUI.document.querySelector('#enroll').onclick();
assert(classmateUI.html().match(/class="romance-card"[\s\S]*?<span>老同学<\/span>/),'老同学身份不显示陌生人的关系阶段');
assert(!classmateUI.html().includes('慢慢认识'));assert.equal(classmateUI.saved().romance.intimacy,20);
function visibleCourseProject(ui){const html=ui.html(),task=html.indexOf('class="term-card"'),closed=html.indexOf('</details>',html.indexOf('class="campus-agenda'));assert(task>closed,'课设进度不藏在折叠日程内');assert.equal((html.match(/class="term-card"/g)||[]).length,1);assert(html.includes('aria-label="课设进度"'));assert(html.includes('课设 '+ui.saved().term.progress+' / '+ui.G.task(ui.saved()).target));}
visibleCourseProject(classmateUI);assert(!classmateUI.html().includes('canteen-wallet'));
classmateUI.document.querySelectorAll('[data-choice]')[0].onclick();visibleCourseProject(classmateUI);
classmateUI.document.querySelector('#campus-open').onclick();visibleCourseProject(classmateUI);
classmateUI.document.querySelector('#campus-return').onclick();visibleCourseProject(classmateUI);
assert(classmateUI.G.valid(classmateUI.saved()),'界面修复保持存档可回放');
console.log('通过：老同学关系文案、课设进度常驻并与存档同步、地图往返及移除饭卡。');

const soloActions=classmateUI.G.availableActivities(classmateUI.saved()).filter(a=>!a.partner),soloButtons=classmateUI.document.querySelectorAll('[data-activity]').map(b=>b.dataset.activity);
assert(soloActions.some(a=>a.id==='work-library'),'此时确实有新增兼职可选');
for(const action of soloActions)assert(soloButtons.includes(action.id),'自由安排不能漏掉：'+action.id);
const libraryMoney=classmateUI.saved().stats.money,openLibrary=classmateUI.document.querySelectorAll('[data-activity]').find(b=>b.dataset.activity==='work-library').onclick;
openLibrary();assert.equal(classmateUI.saved().admission.pending.key,'work-library');const libraryChoiceSave=classmateUI.storage.get('naiwa-dorm-run-v2');openLibrary();assert.equal(classmateUI.storage.get('naiwa-dorm-run-v2'),libraryChoiceSave,'旧兼职入口不能重复执行');
classmateUI.document.querySelectorAll('[data-choice]')[0].onclick();assert.equal(classmateUI.saved().stats.money-libraryMoney,25);assert(classmateUI.G.valid(classmateUI.saved()));
const admittedState=classmateUI.G.choose(classmateUI.G.createCampus(72,['brain','regularSleep','slowWarm'],'保送生','admitted'),0),admittedMap=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(admittedState)]]));
admittedMap.document.querySelector('#resume-run').onclick();admittedMap.document.querySelector('#campus-open').onclick();admittedMap.document.querySelectorAll('[data-place]').find(b=>b.dataset.place==='lab').onclick();
assert(admittedMap.html().includes('学业达到 65'),'地图说明要匹配保送生进组门槛');assert(!admittedMap.html().includes('学业达到 75 后可以申请加入课题组'));
console.log('通过：新增兼职与社团在自由安排中可见，地图进组门槛匹配身份。');

const appSource=fs.readFileSync(source+'app.js','utf8'),fanSource=appSource.slice(appSource.indexOf('function fanHTML(){'),appSource.indexOf('function bindFans('));
function contactStatus(connected){return vm.runInNewContext(fanSource+';fanHTML();',{state:{day:1,romance:{dating:false},admission:{id:'celebrity',partnerId:'fan-1',contacts:[{id:'fan-1',name:'小桃',day:1,status:'known',romance:{connected}}]}},G:{canManageFans:()=>true},asset:name=>'./assets/'+name,esc:s=>s});}
assert(contactStatus(true).includes('正在联系'));assert(!contactStatus(false).includes('正在联系'));assert(contactStatus(false).includes('已断联'));assert(/data-fan-focus="fan-1" disabled/.test(contactStatus(false)));
console.log('通过：联系人断联后显示准确状态，并禁止继续联系。');

const identityExample=require('./identity-events.cjs').examples.director,identityUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(identityExample)]]));
identityUI.document.querySelector('#resume-run').onclick();assert(identityUI.html().includes(identityUI.G.getScene(identityExample).title));assert.equal(identityUI.document.querySelectorAll('[data-choice]').length,3);
const identityBefore=identityUI.storage.get('naiwa-dorm-run-v2');identityUI.document.querySelector('#campus-open').onclick();identityUI.document.querySelector('#campus-return').onclick();assert.equal(identityUI.storage.get('naiwa-dorm-run-v2'),identityBefore,'查看地图不能推进身份事件');
const identityChoice=identityUI.document.querySelectorAll('[data-choice]')[0].onclick;identityChoice();assert(identityUI.saved().outcome.identityEvent);assert(identityUI.G.valid(identityUI.saved()));const identityResult=identityUI.storage.get('naiwa-dorm-run-v2');identityChoice();assert.equal(identityUI.storage.get('naiwa-dorm-run-v2'),identityResult,'身份事件不能重复结算');
const identityReload=boot(identityUI.storage);identityReload.document.querySelector('#resume-run').onclick();assert.equal(identityReload.storage.get('naiwa-dorm-run-v2'),identityResult);identityReload.document.querySelector('#next-scene').onclick();assert(identityReload.G.valid(identityReload.saved()));assert(!identityReload.saved().admission.pending||identityReload.saved().admission.pending.kind!=='identity');
console.log('通过：身份事件的选择、地图往返、刷新恢复、继续日程与重复点击保护。');

const breakfastUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(G.createCampus(72,['gold-brain','gold-battery','optimist'],'早餐菜单','rich'))]]));
breakfastUI.document.querySelector('#resume-run').onclick();const breakfastSave=breakfastUI.storage.get('naiwa-dorm-run-v2');
for(const stall of ['sweet','noodle','rice','special','outside']){breakfastUI.document.querySelectorAll('[data-stall]').find(b=>b.dataset.stall===stall).onclick();assert.equal(breakfastUI.storage.get('naiwa-dorm-run-v2'),breakfastSave,'切换早餐档口不推进事件');const html=breakfastUI.html();assert(!/data-food-dish="[^"]*(?:火锅|烤肉|牛排|酒店|海鲜自助|盖饭|烤鸡)/.test(html),'每个早餐档口都只呈现早餐');if(stall==='outside'){assert(html.includes('贝果咖啡套餐'));assert(html.includes('班尼迪克蛋早午餐'));assert(html.includes('data-food-part="croissant"'));}}
assert(breakfastUI.G.valid(breakfastUI.saved()));console.log('通过：早餐各档口分时菜单、独立配图与只读切换。');
