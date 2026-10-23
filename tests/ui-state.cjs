// 页面控制逻辑的隔离检查。这里使用最小 DOM 替身，不代替真实浏览器视觉检查。
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=__dirname+'/../dist/';
function boot(storage=new Map()){
 const nodes=new Map(),lists=new Map();let html='';
 const staticIds=new Set(['app','toast','collection-count','sound-btn','collection-btn','collection-modal','collection-grid','close-modal','close-modal-bottom','unlock-modal','unlock-title','unlock-list','unlock-close','unlock-accept','unlock-book']);
 function element(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},setAttribute(){},focus(){},showModal(){this.open=true;},close(){this.open=false;},getBoundingClientRect(){return{left:0,top:0,right:100,bottom:100};}});return nodes.get(id);}
 const app=element('app');Object.defineProperty(app,'innerHTML',{get(){return html;},set(value){html=value;for(const key of nodes.keys())if(!staticIds.has(key)&&key!=='brand'&&key!=='intro')nodes.delete(key);lists.clear();}});
 const document={
  querySelector(q){if(q==='.brand')return element('brand');if(q==='.modal-intro')return element('intro');if(q.startsWith('#')){const id=q.slice(1);if(!staticIds.has(id)&&!html.includes('id="'+id+'"'))return null;const fresh=!nodes.has(id),node=element(id);if(fresh&&id==='player-name')node.value=html.match(/id="player-name"[^>]*value="([^"]*)"/)?.[1]||'';return node;}return null;},
  querySelectorAll(q){if(lists.has(q))return lists.get(q);let match,arr=[];const attr=q==='[data-trait]'?'trait':q==='[data-choice]'?'choice':q==='[data-remove-trait]'?'remove-trait':null;if(!attr)return arr;const re=new RegExp('<button\\b[^>]*data-'+attr+'="([^"]+)"[^>]*>','g');while((match=re.exec(html))){const node={...element(attr+match[1]),dataset:{[attr==='remove-trait'?'removeTrait':attr]:match[1]},disabled:/\sdisabled(?:\s|>)/.test(match[0])};arr.push(node);}lists.set(q,arr);return arr;}
 };
 const audioCalls=[];
 const ctx={document,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},console,setTimeout:()=>0,clearTimeout(){},Audio:function(src){return{pause(){audioCalls.push({type:'pause',src});},play(){audioCalls.push({type:'play',src});return Promise.resolve();}}},navigator:{clipboard:{writeText:async()=>{}}},scrollTo(){},Date:class extends Date{static now(){return 0;}},Map,Set,JSON,Math,Object,Array,String,Number,RegExp};ctx.window=ctx;vm.createContext(ctx);
 for(const name of ['engine','events','campus','economy','challenges','life','survival','semester','romance','story','expressions','app'])vm.runInContext(fs.readFileSync(source+name+'.js','utf8'),ctx,{filename:name+'.js'});
 return{document,storage,audioCalls,G:ctx.DormGame,html:()=>html,saved:()=>JSON.parse(storage.get('naiwa-dorm-run-v2')||'null')};
}
const lockUI=boot();lockUI.document.querySelector('#new-run').onclick();
lockUI.document.querySelector('#player-name').value='锁定奶娃';
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
lockUI.document.querySelectorAll('[data-trait]')[0].onclick();lockUI.document.querySelector('#enroll').onclick();
assert.equal(lockUI.saved().name,'锁定奶娃');assert(lockUI.saved().traits.includes(held));assert(!lockUI.saved().traits.includes(locked));
const ui=boot();assert(ui.html().includes('100 种校园事件'));assert(ui.html().includes('20 种天赋'));
ui.document.querySelector('#new-run').onclick();
ui.document.querySelectorAll('[data-trait]')[0].onclick();
ui.document.querySelectorAll('[data-trait]')[1].onclick();
ui.document.querySelector('#enroll').onclick();
const firstMenu=JSON.stringify(ui.G.getScene(ui.saved()).choices);
const choiceArea=ui.html().slice(ui.html().indexOf('<div class="choices">'));
assert(!/电量 [+-]\d|学业 [+-]\d|亲密度 [+-]\d|课设 \+\d/.test(choiceArea),'选择前不展示精确后果');assert(choiceArea.includes('¥'),'已知餐价仍可见');
for(let turn=0;turn<8;turn++){
 const state=ui.saved(),scene=ui.G.getScene(state);
 const options=scene.choices.map((c,i)=>({c,i,score:Math.min(100,state.stats.energy+(c.mods.energy||0))+Math.min(100,state.stats.study+(c.mods.study||0))})).filter(o=>(o.c.mods.money||0)>=-state.stats.money).sort((a,b)=>b.score-a.score);
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
    const scene=G.getScene(s),opts=scene.choices.map((c,i)=>({c,i})).filter(o=>(o.c.mods.money||0)>=-s.stats.money).sort((a,b)=>(a.c.mods[target]||0)-(b.c.mods[target]||0));s=G.choose(s,opts[0].i);
   }else if(s.phase==='outcome')s=G.next(s);else s=G.continueDay(s);
  }
  if(s.failed==='fail-'+target)found=s;
 }
 assert(found,'应能通过正常选择走到目标失败结局');
 const failStore=new Map([['naiwa-dorm-run-v2',JSON.stringify(found)]]),failureUI=boot(failStore);failureUI.document.querySelector('#resume-run').onclick();
 assert(failureUI.html().includes(target==='energy'?'奶娃强制关机':'学业劝退通知'));
 assert.equal(failureUI.document.querySelector('#continue-day'),null);
}
const duplicateBook=boot(new Map([['naiwa-dorm-endings-v1','["ordinary","ordinary"]']]));
assert.equal(duplicateBook.document.querySelector('#collection-count').textContent,'1/45');
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
const noContact=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.encounter)]]));noContact.document.querySelector('#resume-run').onclick();assert(!noContact.html().includes('role="progressbar"'));assert(noContact.html().includes('你遇见了奶粉。'));assert(!noContact.html().includes('粉色的奶娃'));assert(!noContact.html().includes('一只奶粉'));
const contactUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.contact)]]));contactUI.document.querySelector('#resume-run').onclick();assert(contactUI.html().includes('aria-valuenow="20"'));assert(contactUI.html().includes('alt="奶粉"'));
const confessUI=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(loveSample.confession)]]));confessUI.document.querySelector('#resume-run').onclick();confessUI.document.querySelectorAll('[data-choice]')[0].onclick();assert(confessUI.saved().romance.dating);assert(confessUI.document.querySelector('#unlock-modal').open);assert(confessUI.document.querySelector('#unlock-list').innerHTML.includes('恋爱日常'));
assert.equal(confessUI.audioCalls.filter(c=>c.type==='play').length,1);assert(JSON.parse(confessUI.storage.get('naiwa-dorm-endings-v1')).includes('love-ending'));
const loveReload=boot(confessUI.storage);loveReload.document.querySelector('#resume-run').onclick();assert(loveReload.html().includes('恋人'));assert(!loveReload.document.querySelector('#unlock-modal').open);
const storyContact=boot(new Map([['naiwa-dorm-run-v2',JSON.stringify(require('./fixtures/v6-romance.json'))]]));storyContact.document.querySelector('#resume-run').onclick();assert(storyContact.saved().storyMode);assert(storyContact.G.valid(storyContact.saved()));assert(storyContact.html().includes('class="changes"'),'选择后保留真实变化');
console.log('通过：天赋跨批、成就弹框、选择静音、课设提交、亲密度显示、告白弹窗及刷新保留。');

