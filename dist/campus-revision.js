(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./lottery.js'),L=browser?root.DormLife:require('./life.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function hash(x){let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const random=(s,key)=>B.rng(hash(s.seed+':campus-revision-1:'+s.day+':'+key))();
const delta=(a,b)=>Object.fromEntries(B.keys.filter(k=>a[k]!==b[k]).map(k=>[k,b[k]-a[k]]));
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const hidden={id:'fail-mouse-family',icon:'🐭',name:'奶鼠全网呼叫',quote:'你让奶鼠感到不舒服，它全网呼叫奶家人。奶蛙被赶来的奶家人殴打至死，本局结束。',hidden:true,failure:true};
const failure=s=>s.stats.health<=0?'fail-health':s.stats.mood<=0?'fail-mood':s.stats.energy<=0?'fail-energy':s.stats.study<=0?'fail-study':s.term?.missed>=2?'fail-course':s.failed&&!['fail-health','fail-mood','fail-energy','fail-study','fail-course'].includes(s.failed)?s.failed:null;
function nameText(x){if(typeof x==='string')return x.replaceAll('奶娃','奶蛙');if(Array.isArray(x))return x.map(nameText);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,nameText(v)]));return x;}
function biteText(x){return typeof x==='string'?x.replace(/最迟第 \d+ 天结束前，需要去医院处理并打疫苗；逾期会触发“奶娃长眠”。/g,'需要及时去医院处理咬伤并接种疫苗。'):x;}
function normalizeBite(s){const b=s.evolution?.bite;if(!s.campusRevision||!b||b.due===b.day+4)return s;return{...s,evolution:{...s.evolution,bite:{...b,due:b.day+4}}};}
function enableCampusRevision(s){if(s.version!==6||s.campusRevision||s.phase==='ending')return s;return normalizeBite({...s,campusRevision:{confessDay:0,proposal:null},actions:[...s.actions,'k']});}
function create(...args){if(!args[2]||args[2]==='奶娃同学')args[2]='奶蛙同学';return enableCampusRevision(B.create(...args));}
const cleanMeal=text=>text.replace('；自己准备也占去一点时间。','。').replace('省下饭钱，课上的进度要多补一点。','省下了饭钱，也吃上了热乎的早餐。').replace('省下了饭钱，也用去一点学习时间。','省下了饭钱，也吃上了一顿热饭。').replace('领券和排队花了些时间，热饭端到面前时就踏实了。','热饭端到面前，奶蛙也踏实下来。').replace(/\n准备或帮工占去一些时间，今天的课得多补一点。/g,'');
function getScene(s){
 if(s.campusRevision?.proposal&&!['ending','dayEnd'].includes(s.phase))return{id:'love-naifen-confession',time:clock(s.campusRevision.proposal.at),kind:'心动日常',place:'聊天窗口',emoji:'💗',romanceScene:true,bubble:'这次，是奶粉先开口。',title:'奶粉认真说出了自己的心意。',text:'“我发现，越来越想和你分享每天的小事。你愿不愿意，和我正式在一起？”奶粉说完，等着你的回答。',choices:[{text:'认真回应：我也想和你在一起',mods:{energy:-3,mood:6},flags:{},project:0,minutes:10,result:'奶蛙认真回应了奶粉的心意。你们确认了恋爱关系，也约好了下一次见面。'},{text:'坦白拒绝，不勉强自己答应',mods:{mood:-4},flags:{},project:0,minutes:10,result:'你明确表达了自己的想法。奶粉收回了联系方式，与你告别。你们断开了联系。'}]};
 const scene=nameText(B.getScene(s));if(!s.campusRevision||!scene)return scene;
 if(scene.kind==='三餐')for(const c of scene.choices){if(c.mods.study<0)c.mods.study=0;c.result=cleanMeal(c.result);}
 if(scene.mouseScene)scene.choices.push({text:'奶鼠躲开了，还是追着逗它',mods:{energy:-4,mood:-2},minutes:10,flags:{},project:0,result:'奶鼠缩了缩身子，从你身边跑开。奶蛙收住了手。',annoyMouse:true});
 if(s.eventId==='evo-vaccine')scene.text='需要及时去医院处理咬伤，并安排疫苗接种。';
 return scene;
}
function replaceEntry(n,entry){return{...n,outcome:entry,log:[...n.log.slice(0,-1),entry]};}
function choose(s,index){
 if(!s.campusRevision)return B.choose(s,index);
 if(s.campusRevision.proposal){
  if(s.phase!=='choice'||!Number.isInteger(index)||![0,1].includes(index))throw Error('当前不能选择');const scene=getScene(s),c=scene.choices[index],before=s.romance,romance={...before,lastInteraction:s.day},stats=B.apply(s.stats,c.mods);
  if(index===0)Object.assign(romance,{dating:true,earned:true,earnedDay:s.day});else Object.assign(romance,{connected:false,dating:false,intimacy:0,familiar:0,lastMeet:s.day});
  const entry={day:s.day,step:-1,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result:c.result,changes:delta(s.stats,stats),flags:{},project:0,minutes:10,intimacyChange:romance.intimacy-before.intimacy,contactDeleted:index===1};
  return{...s,stats,romance,failed:failure({...s,stats}),phase:'outcome',outcome:entry,log:[...s.log,entry],actions:[...s.actions,'c'+index],campusRevision:{...s.campusRevision,proposal:{...s.campusRevision.proposal,done:true}},rhythm:{...s.rhythm,clock:s.campusRevision.proposal.at+10,spent:s.rhythm.spent+10}};
 }
 const scene=getScene(s),annoy=scene?.mouseScene&&index===4;
 let n=B.choose(s,annoy?1:index);if(!n.outcome||n.log.length<=s.log.length||n.log.at(-1)!==n.outcome)return normalizeBite(n);
 let entry={...n.outcome,result:biteText(n.outcome.result)};
 if(annoy){
  const c=scene.choices[4];let stats=B.apply(s.stats,c.mods),result=c.result;const bitten=n.outcome.result.includes('奶鼠突然咬了');if(bitten){stats=B.apply(stats,{health:-6,mood:-9});result+='\n奶鼠突然咬了奶蛙一口！需要及时去医院处理咬伤并接种疫苗。';}
  entry={...entry,index:4,title:scene.title,choice:c.text,result,changes:delta(s.stats,stats),minutes:10};n={...n,stats,failed:failure({...n,stats}),actions:[...s.actions,'c4']};
  if(random(s,'mouse-family:'+s.eventId)<.02){stats={...stats,health:0};entry={...entry,result:hidden.quote,changes:delta(s.stats,stats)};n={...n,stats,phase:'ending',failed:hidden.id,finalEnding:hidden.id};}
 }
 if(scene?.kind==='三餐'&&scene.choices[index].flags?.meal){const c=scene.choices[index],stats={...n.stats,study:Math.min(100,s.stats.study+Math.max(0,c.mods.study||0))};n={...n,stats,failed:failure({...n,stats})};entry={...entry,result:cleanMeal(entry.result),changes:delta(s.stats,stats)};}
 return normalizeBite(replaceEntry(n,entry));
}
function next(s){
 if(!s.campusRevision)return B.next(s);
 const r=s.campusRevision;if(r.proposal){if(s.phase!=='outcome')throw Error('请先回应奶粉');if(s.failed)return B.next(s);return{...s,...r.proposal.previous,campusRevision:{...r,proposal:null},actions:[...s.actions,'n']};}
 if(s.phase==='outcome'&&!s.failed&&s.romance?.connected&&!s.romance.dating&&s.romance.intimacy>90&&r.confessDay!==s.day&&B.freeMinutes(s)>=10&&!s.evolution?.care&&!s.medical&&!s.wellness?.mouse){
  s={...s,campusRevision:{...r,confessDay:s.day}};
  if(random(s,'naifen-confession')<.3){const proposal={at:s.rhythm.clock,done:false,previous:{eventId:s.eventId,phase:s.phase,outcome:s.outcome}};return{...s,eventId:'love-naifen-confession',phase:'choice',outcome:null,campusRevision:{...s.campusRevision,proposal},actions:[...s.actions,'n']};}
 }
 return normalizeBite(B.next(s));
}
function continueDay(s){return normalizeBite(B.continueDay(s));}
function availableActivities(s){return s.campusRevision?.proposal?[]:B.availableActivities(s);}
function startActivity(s,key){if(s.campusRevision?.proposal)throw Error('请先完成当前互动');return B.startActivity(s,key);}
const source=s=>s.failed===hidden.id?{...s,failed:'fail-health',finalEnding:'fail-health'}:s;
function ending(s){return s.failed===hidden.id?hidden:nameText(B.ending(s));}
function achievements(s){return nameText(B.achievements(source(s))).map(e=>s.failed===hidden.id&&e.id==='fail-health'?hidden:e);}
function restore(raw){if(!raw?.campusRevision)return B.restore(raw);try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);const upgrades={h:'enableCare',b:'enableBalance',v:'enableRomance',p:'enableStory',y:'enableRhythm',f:'enableFood',i:'enableIllness',q:'enableMeetings',w:'enableWellness',u:'enableCampus',t:'enableEvolution',j:'enableLottery',e:'enableEconomy',l:'enableLife'};
 for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='k')s=enableCampusRevision(s);else if(upgrades[a])s=B[upgrades[a]](s);else if(typeof a==='string'&&a.startsWith('a:'))s=startActivity(s,a.slice(2));else return null;}return JSON.stringify(s)===JSON.stringify(raw)?s:null;}catch{return null;}}
const events=[...B.events,{id:'love-naifen-confession'}],api={...B,create,enableCampusRevision,getScene,choose,next,continueDay,availableActivities,startActivity,ending,achievements,romanceAwards:s=>nameText(B.romanceAwards(s)),restore,valid:s=>restore(s)!==null,endings:[...nameText(B.endings),hidden],traits:nameText(B.traits),openingBuffs:nameText(B.openingBuffs),events,eventCount:events.length};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
