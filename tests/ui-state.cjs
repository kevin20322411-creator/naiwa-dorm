// 页面控制逻辑的隔离检查。这里使用最小 DOM 替身，不代替真实浏览器视觉检查。
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=__dirname+'/../dist/';
function boot(storage=new Map(),search=''){
 const nodes=new Map(),lists=new Map();let html='';
 const staticIds=new Set(['app','toast','collection-count','sound-btn','collection-btn','collection-modal','collection-grid','close-modal','close-modal-bottom','unlock-modal','unlock-title','unlock-list','unlock-close','unlock-accept','unlock-book','version-btn','footer-version','release-modal','release-version','release-date','release-list','release-skip','release-close','release-accept']);
 function element(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},setAttribute(){},focus(){},showModal(){this.open=true;},close(){this.open=false;},getBoundingClientRect(){return{left:0,top:0,right:100,bottom:100};}});return nodes.get(id);}
 const app=element('app');Object.defineProperty(app,'innerHTML',{get(){return html;},set(value){html=value;for(const key of nodes.keys())if(!staticIds.has(key)&&key!=='brand'&&key!=='intro')nodes.delete(key);lists.clear();}});
 const document={
  querySelector(q){if(q==='.brand')return element('brand');if(q==='.modal-intro')return element('intro');if(q.startsWith('#')){const id=q.slice(1);if(!staticIds.has(id)&&!html.includes('id="'+id+'"'))return null;const fresh=!nodes.has(id),node=element(id);if(fresh&&id==='player-name')node.value=html.match(/id="player-name"[^>]*value="([^"]*)"/)?.[1]||'';return node;}return null;},
  querySelectorAll(q){if(lists.has(q))return lists.get(q);let match,arr=[];const attr=q==='[data-trait]'?'trait':q==='[data-choice]'?'choice':q==='[data-remove-trait]'?'remove-trait':q==='[data-activity]'?'activity':q==='[data-background]'?'background':null;if(!attr)return arr;const re=new RegExp('<button\\b[^>]*data-'+attr+'="([^"]+)"[^>]*>','g');while((match=re.exec(html))){const node={...element(attr+match[1]),dataset:{[attr==='remove-trait'?'removeTrait':attr]:match[1]},disabled:/\sdisabled(?:\s|>)/.test(match[0])};arr.push(node);}lists.set(q,arr);return arr;}
 };
 const audioCalls=[],clipboardCalls=[];
 const ctx={document,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},console,setTimeout:()=>0,clearTimeout(){},Audio:function(src){return{pause(){audioCalls.push({type:'pause',src});},play(){audioCalls.push({type:'play',src});return Promise.resolve();}}},navigator:{clipboard:{writeText:async text=>{clipboardCalls.push(text);}}},URLSearchParams,location:{search},scrollTo(){},Date:class extends Date{static now(){return 0;}},Map,Set,JSON,Math,Object,Array,String,Number,RegExp};ctx.window=ctx;vm.createContext(ctx);
 for(const name of ['engine','events','campus','economy','challenges','life','survival','semester','romance','story','rhythm','wellbeing','food','illness','meetings','wellness','campus-life','evolution','lottery','campus-revision','character','dining','social-update','relationships','journeys','expressions','app'])vm.runInContext(fs.readFileSync(source+name+'.js','utf8'),ctx,{filename:name+'.js'});
 return{document,storage,audioCalls,clipboardCalls,G:ctx.DormGame,html:()=>html,saved:()=>JSON.parse(storage.get('naiwa-dorm-run-v2')||'null')};
}
const releaseUI=boot();assert(releaseUI.document.querySelector('#release-modal').open,'进入时自动展示公告');assert.equal(releaseUI.document.querySelector('#release-version').textContent,'v6.15');assert(releaseUI.document.querySelector('#release-list').innerHTML.includes('丰富奶粉的偏好与日常约定'));assert(!/概率|100万|1000000|20%|亲密度|触发条件/.test(releaseUI.document.querySelector('#release-list').innerHTML),'公告不泄露结果与条件');
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
lockUI.document.querySelectorAll('[data-trait]')[0].onclick();lockUI.document.querySelectorAll('[data-trait]')[1].onclick();lockUI.document.querySelector('#enroll').onclick();
assert.equal(lockUI.saved().name,'锁定奶蛙');assert(lockUI.G.selectedTraits(lockUI.saved()).includes(held));assert(!lockUI.G.selectedTraits(lockUI.saved()).includes(locked));
const ui=boot();assert(ui.html().includes(ui.G.eventCount+' 种校园事件'));assert(ui.html().includes(ui.G.traits.length+' 种天赋'));
ui.document.querySelector('#new-run').onclick();
ui.document.querySelectorAll('[data-trait]')[0].onclick();
ui.document.querySelectorAll('[data-trait]')[1].onclick();
ui.document.querySelectorAll('[data-trait]')[2].onclick();
ui.document.querySelector('#enroll').onclick();
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
assert.equal(ui.document.querySelector('#unlock-modal').open,true,'首次成就有弹窗');
assert(ui.document.querySelector('#unlock-list').innerHTML.includes('<h3>'));
ui.document.querySelector('#unlock-accept').onclick();assert.equal(ui.document.querySelector('#unlock-modal').open,false);
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
assert.equal(duplicateBook.document.querySelector('#collection-count').textContent,'1/'+duplicateBook.G.endings.length);
const legacyDay8=require('./fixtures/v2-saves.json').find(f=>f.name==='dayEnd').save;
const awardUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(legacyDay8)]]));
awardUI.document.querySelector('#resume-run').onclick();
assert.equal(awardUI.audioCalls.filter(c=>c.type==='play').length,1,'首次重要里程碑只播放一段语音');
awardUI.document.querySelector('#sound-btn').onclick();
assert(awardUI.audioCalls.some(c=>c.type==='pause'),'静音立即停止已有声音');
const deadlineUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(require('./fixtures/v6-deadline.json'))]]));
deadlineUI.document.querySelector('#resume-run').onclick();assert(deadlineUI.html().includes('这周的课设，要交了。'));
assert(deadlineUI.html().includes('本周课设'));assert(deadlineUI.html().includes('通宵补完再交'));
deadlineUI.document.querySelectorAll('[data-choice]')[0].onclick();assert.equal(deadlineUI.saved().term.passed,1);
deadlineUI.document.querySelector('#next-scene').onclick();assert.equal(deadlineUI.saved().phase,'dayEnd');
deadlineUI.document.querySelector('#continue-day').onclick();assert.equal(deadlineUI.saved().day,8);assert.equal(deadlineUI.saved().term.progress,0);
const loveSample=require('./romance.cjs').simulate(0);
const noContact=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.encounter)]]));noContact.document.querySelector('#resume-run').onclick();assert(!noContact.html().includes('role="progressbar"'));assert(noContact.html().includes('奶粉'));assert(!noContact.html().includes('粉色的奶蛙'));assert(!noContact.html().includes('一只奶粉'));
const contactUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.contact)]]));contactUI.document.querySelector('#resume-run').onclick();assert(contactUI.html().includes('aria-valuenow="20"'));assert(contactUI.html().includes('alt="奶粉"'));
const confessUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.confession)]]));confessUI.document.querySelector('#resume-run').onclick();confessUI.document.querySelectorAll('[data-choice]')[0].onclick();assert(confessUI.saved().romance.dating);assert(confessUI.document.querySelector('#unlock-modal').open);assert(confessUI.document.querySelector('#unlock-list').innerHTML.includes('恋爱日常'));
assert.equal(confessUI.audioCalls.filter(c=>c.type==='play').length,1);assert(JSON.parse(confessUI.storage.get('naiwa-dorm-endings-v1')).includes('love-ending'));
const loveReload=boot(confessUI.storage);loveReload.document.querySelector('#resume-run').onclick();assert(loveReload.html().includes('恋人'));assert(!loveReload.document.querySelector('#unlock-modal').open);
const storyContact=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(require('./fixtures/v6-romance.json'))]]));storyContact.document.querySelector('#resume-run').onclick();assert(storyContact.saved().storyMode);assert(storyContact.G.valid(storyContact.saved()));assert(storyContact.html().includes('class="changes"'),'选择后保留真实变化');
const rapidUI=boot();rapidUI.document.querySelector('#new-run').onclick();rapidUI.document.querySelectorAll('[data-trait]')[0].onclick();rapidUI.document.querySelectorAll('[data-trait]')[1].onclick();rapidUI.document.querySelectorAll('[data-trait]')[2].onclick();rapidUI.document.querySelector('#enroll').onclick();
const staleChoice=rapidUI.document.querySelectorAll('[data-choice]').find(b=>!b.disabled).onclick;
staleChoice();let rapidSnapshot=rapidUI.storage.get('naiwa-dorm-run-v2');assert.doesNotThrow(staleChoice);assert.equal(rapidUI.storage.get('naiwa-dorm-run-v2'),rapidSnapshot);
const staleNext=rapidUI.document.querySelector('#next-scene').onclick;staleNext();rapidSnapshot=rapidUI.storage.get('naiwa-dorm-run-v2');assert.doesNotThrow(staleNext);assert.doesNotThrow(staleChoice);assert.equal(rapidUI.storage.get('naiwa-dorm-run-v2'),rapidSnapshot,'旧事件按钮不能操作新事件');
rapidUI.document.querySelectorAll('[data-choice]').find(b=>!b.disabled).onclick();rapidSnapshot=rapidUI.storage.get('naiwa-dorm-run-v2');staleNext();assert.equal(rapidUI.storage.get('naiwa-dorm-run-v2'),rapidSnapshot,'上一场的继续按钮不能跳过这一场');
const rapidDay=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.last)]]));rapidDay.document.querySelector('#resume-run').onclick();
const staleContinue=rapidDay.document.querySelector('#continue-day').onclick,staleRetire=rapidDay.document.querySelector('#retire-run').onclick;staleContinue();rapidSnapshot=rapidDay.storage.get('naiwa-dorm-run-v2');assert.doesNotThrow(staleContinue);assert.doesNotThrow(staleRetire);assert.equal(rapidDay.storage.get('naiwa-dorm-run-v2'),rapidSnapshot);
for(const bad of ['broken JSON','null','{}','[]'])assert.doesNotThrow(()=>boot(new Map([['naiwa-dorm-run-v2',bad]])));
const gymUI=boot();gymUI.document.querySelector('#new-run').onclick();gymUI.document.querySelectorAll('[data-trait]')[0].onclick();gymUI.document.querySelectorAll('[data-trait]')[1].onclick();gymUI.document.querySelectorAll('[data-trait]')[2].onclick();gymUI.document.querySelector('#enroll').onclick();gymUI.document.querySelectorAll('[data-choice]').find(b=>!b.disabled).onclick();
const gymButton=gymUI.document.querySelectorAll('[data-activity]').find(b=>b.dataset.activity==='gym');assert(gymButton,'事件后有主动健身入口');gymButton.onclick();assert(gymUI.saved().rhythm.pending);assert(gymUI.html().includes('自重练习'));
const gymReload=boot(gymUI.storage);gymReload.document.querySelector('#resume-run').onclick();const gymHealth=gymReload.saved().stats.health;gymReload.document.querySelectorAll('[data-choice]')[1].onclick();assert(gymReload.saved().stats.health>=gymHealth);assert.equal(gymReload.saved().outcome.origin,'self');assert(gymReload.G.valid(gymReload.saved()));assert(!gymReload.html().includes(' / 8'));
const admissionUI=boot();admissionUI.document.querySelector('#new-run').onclick();admissionUI.document.querySelectorAll('[data-trait]')[0].onclick();admissionUI.document.querySelectorAll('[data-trait]')[1].onclick();admissionUI.document.querySelectorAll('[data-trait]')[2].onclick();
const delayedEnroll=admissionUI.document.querySelector('#enroll').onclick;delayedEnroll();admissionUI.document.querySelectorAll('[data-choice]').find(b=>!b.disabled).onclick();
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

assert.equal(lockUI.G.selectedTraits(lockUI.saved()).length,3,'三项天赋实际进入存档');assert(Number.isFinite(lockUI.saved().stats.charm));assert.equal(ui.G.traits.length,24);
const charFixture=require('./fixtures/v6-character.json');const bittenUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(charFixture.bitten)]]));bittenUI.document.querySelector('#resume-run').onclick();assert(bittenUI.html().includes('及时'));const biteNotice=bittenUI.html().split('aria-label="奶鼠咬伤"')[1]?.split('</section>')[0]||'';assert(!/最迟|逾期|长眠/.test(biteNotice));assert(!bittenUI.html().includes('逾期会触发'));
const proposalUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(charFixture.proposal)]]));proposalUI.document.querySelector('#resume-run').onclick();assert(proposalUI.html().includes('奶粉认真说出了自己的心意'));proposalUI.document.querySelectorAll('[data-choice]')[1].onclick();assert(!proposalUI.saved().romance.connected);assert(proposalUI.G.valid(proposalUI.saved()));
const mouseHiddenUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(charFixture.hidden)]]));mouseHiddenUI.document.querySelector('#resume-run').onclick();assert(mouseHiddenUI.html().includes('奶鼠全网呼叫'));assert(mouseHiddenUI.html().includes('奶蛙被赶来的奶家人'));assert(!mouseHiddenUI.html().includes('奶娃'));assert.equal(mouseHiddenUI.document.querySelector('#continue-day'),null);
console.log('通过：三天赋、魅力、无剧透疫苗提示、奶粉主动表白和奶鼠隐藏结局。');

const backgroundUI=boot();backgroundUI.document.querySelector('#new-run').onclick();
const initialBackgrounds=backgroundUI.document.querySelectorAll('[data-background]');assert.equal(initialBackgrounds.length,3);assert(initialBackgrounds.find(b=>b.dataset.background==='creative').disabled);assert(initialBackgrounds.find(b=>b.dataset.background==='sport').disabled);assert(backgroundUI.html().includes('完成相关经历后解锁'));
const veteranUI=boot(new Map([['naiwa-dorm-endings-v1','["week"]']]));veteranUI.document.querySelector('#new-run').onclick();assert(veteranUI.document.querySelectorAll('[data-background]').every(b=>!b.disabled));veteranUI.document.querySelectorAll('[data-background]').find(b=>b.dataset.background==='creative').onclick();veteranUI.document.querySelectorAll('[data-trait]')[0].onclick();veteranUI.document.querySelectorAll('[data-trait]')[1].onclick();veteranUI.document.querySelectorAll('[data-trait]')[2].onclick();veteranUI.document.querySelector('#enroll').onclick();assert.equal(veteranUI.saved().journeys.backgroundId,'creative');assert(veteranUI.G.valid(veteranUI.saved()));
const existingRun=JSON.stringify(lockUI.saved()),sharedStorage=new Map([['naiwa-dorm-run-v2',existingRun],['naiwa-dorm-recent-v2','["lost-key","love-message"]']]),sharedUI=boot(sharedStorage,'?seed=424242&bg=creative&traits=brain,toolkit,flirt');assert(sharedUI.html().includes('同一起点，选你自己的生活'));assert.equal(sharedStorage.get('naiwa-dorm-run-v2'),existingRun,'打开分享链接不覆盖进度');sharedUI.document.querySelector('#new-run').onclick();assert.equal(sharedStorage.get('naiwa-dorm-run-v2'),existingRun,'进入确认页仍保留原局');assert.equal(sharedUI.document.querySelectorAll('[data-remove-trait]').length,3);assert(sharedUI.html().includes('本次分享体验'));assert(!sharedUI.document.querySelectorAll('[data-background]').find(b=>b.dataset.background==='creative').disabled);assert(sharedUI.document.querySelectorAll('[data-background]').find(b=>b.dataset.background==='sport').disabled);sharedUI.document.querySelector('#reroll').onclick();sharedUI.document.querySelector('#enroll').onclick();assert.equal(sharedUI.saved().seed,424242,'换批不改变人生起点');assert.equal(sharedUI.saved().recent.length,0,'新起点不受接收者以往事件影响');assert.equal(sharedUI.saved().journeys.backgroundId,'creative');assert.deepEqual(sharedUI.G.selectedTraits(sharedUI.saved()),['brain','toolkit','flirt']);assert(!JSON.parse(sharedStorage.get('naiwa-dorm-endings-v1')||'[]').includes('week'),'分享体验不写入永久解锁');assert(sharedUI.G.valid(sharedUI.saved()));sharedUI.document.querySelector('#pause-run').onclick();sharedUI.document.querySelector('#share-start').onclick();assert.equal(sharedUI.clipboardCalls.at(-1),'https://kevin20322411-creator.github.io/naiwa-dorm/?seed=424242&bg=creative&traits=brain,toolkit,flirt');assert(!sharedUI.clipboardCalls.at(-1).includes(sharedUI.saved().name));sharedUI.document.querySelector('#new-run').onclick();assert(sharedUI.document.querySelectorAll('[data-background]').find(b=>b.dataset.background==='creative').disabled,'普通新局不继承临时背景体验');
for(const query of ['?seed=-1&bg=freshman&traits=brain,toolkit,flirt','?seed=4294967296&bg=freshman&traits=brain,toolkit,flirt','?seed=8&bg=unknown&traits=brain,toolkit,flirt','?seed=8&bg=freshman&traits=brain,brain,flirt','?seed=8&bg=freshman&traits=brain,toolkit,%3Cscript%3E']){const invalidUI=boot(new Map(),query);assert(!invalidUI.html().includes('class="shared-start-note"'),'无效分享参数应忽略');assert.equal(invalidUI.saved(),null);}
const talkButton=contactUI.document.querySelectorAll('[data-activity]').find(b=>b.dataset.activity==='bond-talk');assert(talkButton,'关系卡与聊天入口已接入');const undiscovered=contactUI.G.relationshipStatus(contactUI.saved());assert.equal(undiscovered.knownActivity,null);assert.equal(undiscovered.knownTaste,null);talkButton.onclick();contactUI.document.querySelectorAll('[data-choice]')[0].onclick();const discovered=contactUI.G.relationshipStatus(contactUI.saved());assert(discovered.knownActivity);assert(contactUI.html().includes('喜欢'+discovered.knownActivity));assert.equal(discovered.knownTaste,null);contactUI.document.querySelector('#next-scene').onclick();contactUI.document.querySelectorAll('[data-activity]').find(b=>b.dataset.activity==='bond-plan').onclick();contactUI.document.querySelectorAll('[data-choice]')[0].onclick();assert(contactUI.html().includes('约好：'));const promiseReload=boot(contactUI.storage);promiseReload.document.querySelector('#resume-run').onclick();assert(promiseReload.html().includes('约好：'));assert(promiseReload.G.valid(promiseReload.saved()));
console.log('通过：背景解锁、临时分享背景、开局链接安全校验与不覆盖进度、三天赋同起点、偏好发现和约定恢复。');

