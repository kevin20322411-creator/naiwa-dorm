(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./wallet.js');
const identityEvents=browser?root.DormIdentityEvents:require('./identity-events.js');
const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),clamp=n=>Math.max(0,Math.min(100,n));
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const rng=(seed,key)=>B.rng(hash(seed+':admission-v1:'+key));
const identities=[
 {id:'director',name:'校长儿子',gold:true,mods:{money:60,social:10},desc:'生活费＋60，人缘＋10；每7天额外补助30。'},
 {id:'admitted',name:'保送生',mods:{study:12},desc:'学业＋12；学业65即可申请进组。'},
 {id:'competitor',name:'竞赛生',mods:{study:8},desc:'学业＋8；专业实践达2分，每章额外奖励20。'},
 {id:'workstudy',name:'勤工助学生',mods:{money:15},desc:'生活费＋15；兼职工钱增加30%。'},
 {id:'local',name:'本地生',mods:{money:20},desc:'生活费＋20；校外用餐九折，少用10分钟。'},
 {id:'classmate',name:'奶粉的老同学',mods:{},desc:'已有奶粉联系方式、亲密度20，并知道一项喜好。'},
 {id:'blogger',name:'校园博主',mods:{charm:8},desc:'魅力＋8；拍到目标照片获稿费10，每天一次。'},
 {id:'celebrity',name:'男明星',gold:true,mods:{},desc:'开局魅力 100。有时会被人要联系方式。'},
 {id:'rich',name:'富二代',gold:true,mods:{money:1000},desc:'开局生活费＋1000；家里每天给150。'},
 {id:'liang',name:'良子',mods:{},desc:'饱食度消耗翻倍，心情恒定100。'},
 {id:'researcher',name:'先天科研圣体',mods:{},researchBonus:30,desc:'进组后，每次完成实验室活动的科研进度增加30%。'}
].map(Object.freeze);
const golden=[
 {id:'gold-flirt',family:'flirt',name:'情场宗师',icon:'💗',mods:{charm:30},desc:'魅力＋30；每日首次认真互动，额外亲密度＋3。'},
 {id:'gold-brain',family:'brain',name:'学神附体',icon:'📖',mods:{study:30},desc:'学业＋30；每日首次到课，额外课设＋3。'},
 {id:'gold-job',family:'jobHand',name:'打工皇帝',icon:'🧾',mods:{},desc:'每次兼职额外获得15生活费，每日最多两次。'},
 {id:'gold-battery',family:'battery',name:'永动奶蛙',icon:'⚡',mods:{energy:40},desc:'电量＋40；每日首次休息，额外电量＋10。'},
 {id:'gold-bank',family:'piggyBank',name:'财运亨通',icon:'💰',mods:{money:200},desc:'开局生活费＋200；每7天额外补贴＋50。'}
].map(t=>Object.freeze({...t,gold:true,hideMods:true}));
const byIdentity=new Map(identities.map(i=>[i.id,i])),byGold=new Map(golden.map(t=>[t.id,t]));
const traits=[...B.traits,...golden],family=id=>byGold.get(id)?.family||id;
function shuffle(values,r){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function identityDraft(seed,batch=0){
 const r=rng(seed,'identity:'+batch),gold=shuffle(identities.filter(i=>i.gold),r),normal=shuffle(identities.filter(i=>!i.gold),r);
 // Binomial gold count + uniform subsets gives exactly 5% per gold identity
 // per displayed position, while every batch contains three distinct cards.
 let count=0;for(let i=0;i<3;i++)if(r()<.15)count++;
 return shuffle([...gold.slice(0,count),...normal.slice(0,3-count)],r).map(i=>i.id);
}
function talentDraft(seed,selected=[],previous=[]){
 const r=rng(seed,'talent'),locked=new Set(selected.map(family)),avoid=new Set(previous.map(family)),result=[];
 for(let i=0;i<6;i++){
  let normal=B.traits.filter(t=>!locked.has(t.id)),gold=golden.filter(t=>!locked.has(t.family));
  const freshN=normal.filter(t=>!avoid.has(t.id)),freshG=gold.filter(t=>!avoid.has(t.family));
  if(freshN.length+freshG.length){normal=freshN;gold=freshG;}
  const pool=gold.length&&(!normal.length||r()<.05)?gold:normal;
  if(!pool.length)break;const t=pool[Math.floor(r()*pool.length)];result.push(t.id);locked.add(family(t.id));
 }
 return result;
}
const selected=s=>s.admission?.loadout||B.selectedTraits(s),has=(s,id)=>selected(s).includes(id);
const labThreshold=s=>s?.admission?.id==='admitted'?65:75;
const identityOf=s=>byIdentity.get(s?.admission?.id);
const openingMoney=(id,revision)=>id==='rich'&&revision<3?300:byIdentity.get(id).mods.money||0;
function identityDetails(s){
 const identity=identityOf(s);
 if(!identity)return null;
 const {id,name,gold,mods,researchBonus}=identity;
 const rows=Object.entries(mods).map(([key,value])=>key==='money'
  ?['开局生活费','+'+openingMoney(id,s.admission.revision)+' 元']
  :['开局'+B.labels[key],'+'+value]);
 const effects={
  director:[['每周额外补助','+30 元']],
  admitted:[['申请进组门槛','学业 '+labThreshold(s)]],
  competitor:[['专业实践达 2 分','每章 +20 元']],
  workstudy:[['兼职工钱','+30%']],
  local:[['校外餐费','9 折'],['校外用餐用时','−10 分钟']],
  classmate:[['开局亲密度','20'],['开局已知喜好','1 项']],
  blogger:[['拍到目标照片','+10 元，每天 1 次']],
  celebrity:[['开局魅力','100'],['校园日常','有时会被人要联系方式']],
  rich:[['家里发放生活费',s.admission.allowance?'每天 150 元':'每周 300 元']],
  liang:[['饱食度消耗','×2'],['心情','固定 100']]
 };
 if(researchBonus)rows.push(['每次科研进度','+'+researchBonus+'%']);
 return{name,gold:!!gold,rows:[...rows,...(effects[id]||[])]};
}
function scope(s,run){
 if(!s?.admission?.id)return run();
 const id=s.admission.id,execute=()=>B.withUncappedMoney(()=>B.withCampusRules({labThreshold:labThreshold(s),researchBonus:identityOf(s).researchBonus||0},()=>B.withDiningRules({newMenu:true,menuRevision:s.admission.mealRevision||s.admission.revision,factor:id==='liang'?2:1,outsideFactor:id==='local'?.9:1,outsideMinutes:id==='local'?35:45,outsideBreakfastMinutes:id==='local'?20:30},run)));
 return id==='liang'?B.withMoodLock(execute):execute();
}
function apply(s,mods){return B.withUncappedMoney(()=>B.apply(s,mods));}
function offers(s){
 if(s.admission.id!=='celebrity')return[];
 const names=['小桃','小柚','小棠','小梨','小满','小夏','小岚','小橙','小葵','小禾','小桐','小星','小鹿','小茉','小晴','小溪','小初','小晚','小秋','小月'];
 const clubs=['摄影社','图书馆','同课班级','志愿队','篮球场','校园广播站','乐队'];
 const r=rng(s.seed,'fans:'+s.day),n=r()<.5?2:3;
 const history=s.admission.fanBook?{lastTalkDay:0,talks:0,lastPlanDay:0,lastCrisisDay:0}:{};
 return Array.from({length:n},(_,i)=>{const p=(s.day-1)*3+i;return{id:'fan-'+s.day+'-'+i,day:s.day,name:names[p%names.length]+' · '+clubs[Math.floor(p/names.length)%clubs.length],status:'offered',notes:[],romance:{connected:true,intimacy:20,dating:false,familiar:0,lastMeet:s.day,lastInteraction:s.day,earned:false,earnedDay:0},relationships:{...clone(s.relationships),...history,activity:['quiet','art','sport'][Math.floor(r()*3)],taste:['fruit','cocoa','tea'][Math.floor(r()*3)],known:[],promise:null,strain:0,kept:0,pending:null}};});
}
const fanSurnames=Array.from('林许陈周沈苏夏宋叶陆梁唐程温乔顾江黎方何');
function fanIdentity(contact){
 const [nickname,place]=contact.name.split(' · ');
 const match=/^fan-(\d+)-(\d+)$/.exec(contact.id);
 if(!match)return{name:nickname,place};
 const position=(Number(match[1])-1)*3+Number(match[2]),group=Math.floor(position/20);
 const series=Math.floor(group/fanSurnames.length);
 return{name:fanSurnames[(group+position%20*7)%fanSurnames.length]+nickname+(series?'（'+(series+1)+'）':''),place};
}
const isFanInteraction=scene=>!!scene&&(scene.romanceScene||scene.id==='campus83-campus-chat');
const campusGivenNames=['知夏','予安','书禾','清遥','念初','星晚','听雨','栀宁','晨溪','见月','初晴','时满','南枝','若棠','云舒','晚晴','芷溪','乐宁','初语','映秋'];
function campusName(s,day,step){
 const position=(day-1)*8+step,index=(hash(s.seed+':campus-names')+position)%400;
 const round=Math.floor(index/20),series=Math.floor(position/400);
 return fanSurnames[(round+index%20*7)%20]+campusGivenNames[index%20]+(series?'（'+(series+1)+'）':'');
}
function meetingPerson(s){
 return s.admission.metContact||{id:'campus-fan-'+s.day+'-'+s.step,name:campusName(s,s.day,s.step+1),familiar:0};
}
function meetingName(s){
 return s.admission?.fanBook>=3&&s.eventId==='love-encounter'?meetingPerson(s).name:'';
}
function contactSnapshot(s){return{romance:clone(s.romance),relationships:clone(s.relationships),notes:clone(s.campusLife?.notes||[])};}
function strangerInput(s){
 const person=meetingPerson(s),r=rng(s.seed,'campus-contact:'+person.id);
 const romance={connected:false,intimacy:0,dating:false,familiar:person.familiar,lastMeet:0,lastInteraction:0,earned:false,earnedDay:0};
 const relationships={...s.relationships,activity:['quiet','art','sport'][Math.floor(r()*3)],taste:['fruit','cocoa','tea'][Math.floor(r()*3)],
  known:[],promise:null,strain:0,lastTalkDay:0,talks:0,lastPlanDay:0,lastCrisisDay:0,kept:0,pending:null};
 return{...s,romance,relationships,campusLife:{...s.campusLife,notes:[]}};
}
function chooseCampusMeeting(s,index){
 const n=scope(s,()=>B.choose(strangerInput(s),index));
 const currentCampusLife={...n.campusLife,notes:s.campusLife.notes};
 if(n.outcome?.eventId!=='love-encounter'||n.log.length===s.log.length)return{...n,romance:s.romance,relationships:s.relationships,campusLife:currentCampusLife};
 const person=meetingPerson(s),{name,id}=person,added=!!n.outcome.contactAdded;
 const outcome={...n.outcome,fanName:name,...(added?{fanContactId:id}:{})};
 const talkedWithoutAdding=n.outcome.index===1&&!n.outcome.naifenInitiated&&n.romance.familiar>0;
 const admission={...s.admission,metContact:talkedWithoutAdding?{...person,familiar:n.romance.familiar}:null};
 if(added){
  admission.contacts=[...admission.contacts,{id,name,day:s.day,status:'known',...contactSnapshot(n)}];
  if(!s.romance.connected)admission.partnerId=id;
 }
 const keepCurrent=s.romance.connected||!added;
 const romance=keepCurrent?(s.romance.connected?s.romance:{...s.romance,lastMeet:s.day,familiar:0}):n.romance;
 return{...n,romance,relationships:keepCurrent?s.relationships:n.relationships,campusLife:keepCurrent?currentCampusLife:n.campusLife,outcome,log:[...n.log.slice(0,-1),outcome],admission};
}
function initialContactsOnly(base){
 return{...base,admission:{id:null,revision:4,base:clone(base),moves:[],chapters:[],daily:{day:base.day,used:{}},contacts:[],partnerId:null,pending:null}};
}
const canAddBook=s=>!!(s?.romance&&s.relationships&&s.campusLife)&&s.phase!=='ending'&&!s.positiveEnding;
function enableFanBook(s,revision=1){
 if(!s.admission||(s.admission.fanBook||0)>=revision||![1,2,3].includes(revision)||s.phase==='ending'||s.positiveEnding)return s;
 if(revision<3&&s.admission.id!=='celebrity'||revision===3&&!canAddBook(s))return s;
 const pending=s.relationships?.pending;
 const relationships=pending?.done&&s.eventId!=='love-'+pending.key?{...s.relationships,pending:null}:s.relationships;
 const book={...s.admission,fanBook:revision};
 if(revision===3){
  book.contacts=book.contacts.map(c=>c.id==='campus-naifen'?{...c,name:campusName(s,1,0)}:c);
  if(s.romance.connected&&!book.partnerId){
   const contact={id:'campus-naifen',name:campusName(s,1,0),day:s.day,status:'known',...contactSnapshot({...s,relationships})};
   book.contacts=[...book.contacts.filter(c=>c.id!==contact.id),contact];
   book.partnerId=contact.id;
  }
 }
 return{...s,relationships,admission:book};
}
function initial(base,id,loadout,revision=4){
 const definition=byIdentity.get(id);if(!definition)throw Error('请选择一个身份');
 let stats=apply(base.stats,{money:260,...Object.fromEntries(Object.entries(definition.mods).filter(([k])=>k!=='money'))});stats.money=base.stats.money+260+openingMoney(id,revision);
 for(const key of loadout){
  if(key==='gold-flirt')stats=apply(stats,{charm:20});
  if(key==='gold-brain')stats=apply(stats,{study:10,energy:8});
  if(key==='gold-battery')stats=apply(stats,{energy:15,money:5});
  if(key==='gold-bank')stats=apply(stats,{money:188});
 }
 if(id==='celebrity')stats.charm=100;if(id==='liang')stats.mood=100;
 let s={...base,stats,admission:{revision,id,loadout:[...loadout],base:clone(base),moves:[],chapters:[],daily:{day:base.day,used:{}},contacts:[],partnerId:null,pending:null,...(revision>=2?{mealPerk:null}:{})}};
 if(id==='classmate')s={...s,romance:{...s.romance,connected:true,intimacy:20,lastMeet:s.day,lastInteraction:s.day},relationships:{...s.relationships,known:[rng(s.seed,'known')()<.5?'activity':'taste']}};
 s.admission.contacts=offers(s);return s;
}
function createCampus(seed,loadout,name,id,recent=[],major='cs',selection){
 if(loadout.length!==3||new Set(loadout.map(family)).size!==3||loadout.some(t=>!traits.some(x=>x.id===t)))throw Error('请选择三个不同系列的天赋');
 return wrapped.enableFanBook(wrapped.enableDailyAllowance(wrapped.upgradeIdentityEvents(wrapped.enableIdentityEvents(initial(B.create(seed,loadout.map(family),name,recent,'freshman',major,selection),id,loadout)))),3);
}
const jobs=[
 {id:'work-library',label:'图书馆整理',place:'图书馆',minutes:30,money:25,energy:8},
 {id:'work-errands',label:'校园跑腿',place:'校门服务点',minutes:40,money:40,energy:14},
 {id:'work-event',label:'活动协助',place:'活动中心',minutes:60,money:60,energy:20},
 {id:'work-tutor',label:'课后家教',place:'家教课堂',minutes:120,money:160,energy:40}
];
const workById=new Map(jobs.map(j=>[j.id,j]));
function enableIdentityEvents(s){if(!s?.admission||s.admission.identityLife||s.phase==='ending'||s.positiveEnding)return s;return{...s,admission:{...s.admission,identityLife:{revision:1,lastRollDay:0,lastEventDay:0,lastId:null,count:0}}};}
function upgradeIdentityEvents(s){if(!s?.admission?.identityLife||s.admission.identityLife.revision>=2||s.phase==='ending'||s.positiveEnding||s.admission.pending?.kind==='identity')return s;return{...s,admission:{...s.admission,identityLife:{...s.admission.identityLife,revision:2}}};}
const storyPool=s=>s.admission.identityLife.revision>=2?identityEvents.pool:identityEvents.legacyPool;
function ordinaryCampusChoice(s){
 if(s.phase!=='choice'||!alive(s)||s.admission.pending||s.school?.pending||s.majorLife?.pending||s.miniGames?.pending||s.relationships?.pending||s.campusLife?.pending||s.journeys?.pending||s.rhythm?.pending||s.medical||s.evolution?.care||s.campusRevision?.proposal)return false;
 const scene=scope(s,()=>B.getScene(s));
 return !!scene?.choices?.length&&scene.kind!=='三餐'&&!scene.schoolScene&&!scene.majorScene&&!scene.romanceScene&&!scene.mouseScene&&!/^(term-|evo-|well-|ill-|clinic|lottery-|love-|active-|campus83-|major-|school-|journey-)/.test(s.eventId);
}
function anotherCampusMeeting(s){
 if(!(s.admission.fanBook>=3)||!s.romance.connected||![1,3,4,6].includes(s.step)||s.log.some(e=>e.eventId==='love-encounter'&&s.day-e.day<3)||rng(s.seed,'campus-meet:'+s.day+':'+s.step)()>=.22||!ordinaryCampusChoice(s))return s;
 return{...s,eventId:'love-encounter',rhythm:{...s.rhythm,meetingSource:null}};
}
function encounter(s){
 const life=s.admission.identityLife;if(!life||s.phase!=='choice'||s.failed||s.lottery?.won||s.admission.pending||life.lastRollDay===s.day||life.lastEventDay&&s.day-life.lastEventDay<3)return s;
 const pool=storyPool(s)[s.admission.id];if(!pool?.length)return s;
 if(s.school?.pending||s.majorLife?.pending||s.miniGames?.pending||s.relationships?.pending||s.campusLife?.pending||s.journeys?.pending||s.rhythm?.pending||s.medical||s.evolution?.care||s.campusRevision?.proposal)return s;
 const scene=scope(s,()=>B.getScene(s));
 if(!scene?.choices?.length||scene.kind==='三餐'||scene.schoolScene||scene.majorScene||scene.romanceScene||scene.mouseScene||/^(term-|evo-|clinic|love-|active-|campus83-|major-|school-|journey-)/.test(s.eventId))return s;
 if(s.admission.id==='classmate'&&(!s.romance?.connected||s.admission.fanBook>=3&&s.admission.partnerId!=='campus-naifen')||scope(s,()=>B.freeMinutes({...s,phase:'outcome'}))<10)return s;
 const nextLife={...life,lastRollDay:s.day},ad={...s.admission,identityLife:nextLife};
 const r=rng(s.seed,'identity-event:'+s.day);if(r()>=.5)return{...s,admission:ad};
 const choices=pool.filter(e=>e.id!==life.lastId),event=choices[Math.floor(r()*choices.length)];
 return{...s,admission:{...ad,identityLife:{...nextLife,lastEventDay:s.day,lastId:event.id,count:life.count+1},pending:{kind:'identity',key:event.id,at:s.rhythm.clock,done:false,previous:{eventId:s.eventId}}}};
}
function identityScene(s){const p=s.admission.pending,e=storyPool(s)[s.admission.id].find(e=>e.id===p.key);return{...e,time:clock(p.at),choices:p.done?[]:e.choices.map(c=>({...c,mods:{...c.mods},flags:{...c.flags},...((c.mods.money||0)<-s.stats.money?{disabledReason:'生活费不足'}:{})}))};}
function chooseIdentity(s,index){
 const p=s.admission.pending,scene=identityScene(s),c=scene.choices[index];if(p.done||s.phase!=='choice'||!Number.isInteger(index)||!c||c.disabledReason)throw Error('当前不能这样选择');
 const stats=scope(s,()=>apply(s.stats,c.mods)),romance={...s.romance};if(c.affection&&romance.connected){romance.intimacy=clamp(romance.intimacy+c.affection);romance.lastMeet=s.day;romance.lastInteraction=s.day;}
 const entry={day:s.day,step:s.step,eventId:scene.id,index,time:scene.time,place:scene.place,title:scene.title,choice:c.text,result:c.result,changes:delta(s.stats,stats),flags:{...c.flags},project:c.project,minutes:10,identityEvent:scene.id,intimacyChange:romance.intimacy-s.romance.intimacy};
 if(s.admission.fanBook>=3&&scene.id.startsWith('classmate-'))entry.fanContactId=s.admission.partnerId;
 const flags={...s.flags};for(const [k,v]of Object.entries(c.flags))flags[k]=(flags[k]||0)+v;
 let n={...s,stats,romance,flags,term:{...s.term,progress:s.term.progress+c.project},phase:'outcome',outcome:entry,log:[...s.log,entry],rhythm:{...s.rhythm,clock:p.at+10,spent:s.rhythm.spent+10},admission:{...s.admission,pending:{...p,done:true}}};n.failed=failure(n);return scope(s,()=>B.settleNutrition(s,n,c.satiety||0,true));
}
const alive=s=>!s.failed&&!s.lottery?.won&&['energy','study','health','mood'].every(k=>s.stats[k]>0);
const clock=n=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const delta=(a,b)=>Object.fromEntries(B.statKeys(a).filter(k=>a[k]!==b[k]).map(k=>[k,b[k]-a[k]]));
function quotedPay(s,j){return j.money+(s.admission.id==='workstudy'?Math.round(j.money*.3):0)+(has(s,'gold-job')&&(s.admission.daily.day!==s.day||(s.admission.daily.used.job||0)<2)?15:has(s,'jobHand')&&!has(s,'gold-job')&&!s.talentEffects?.daily.used.includes('jobHand')?2:0);}
function failure(s){return s.failed==='fail-mouse-family'?s.failed:s.stats.health<=0?'fail-health':s.stats.mood<=0?'fail-mood':s.stats.energy<=0?'fail-energy':s.stats.study<=0?'fail-study':s.term?.missed>=2?'fail-course':null;}
function ready(s){return!!s.admission?.id&&s.phase==='outcome'&&alive(s)&&!s.admission.pending&&!s.journeys?.pending&&!s.relationships?.pending&&!s.campusLife?.pending&&!s.rhythm?.pending&&!s.evolution?.care&&!s.evolution?.breakPrevious&&!s.medical&&!s.majorLife?.pending&&!s.miniGames?.pending;}
function jobList(s){
 if(!ready(s))return[];
 if(!s.admission||s.phase!=='outcome'||!alive(s)||s.admission.pending||s.miniGames?.pending||s.majorLife?.pending)return[];
 const free=scope(s,()=>B.freeMinutes(s));
 return jobs.filter(j=>free>=j.minutes).map(j=>({id:j.id,label:j.label+' · ¥'+quotedPay(s,j)+' · '+j.minutes+' 分钟',...(j.id==='work-tutor'&&(s.stats.study<=80||s.log.some(e=>e.day===s.day&&e.campusActivity==='work-tutor'))?{disabledReason:s.stats.study<=80?'学业高于80可以接家教':'今天已完成一单家教'}:{})}));
}
function workScene(s){const p=s.admission.pending;if(p.kind==='identity')return identityScene(s);if(p.kind==='club')return{id:s.eventId,time:clock(p.at),place:'学生活动中心',kind:'校园新篇',title:s.outcome.title,text:'',emoji:'🤝',choices:[]};const j=workById.get(p.key);return{id:'admission-'+j.id,time:clock(p.at),place:j.place,kind:'校园兼职',title:j.label,text:j.id==='work-tutor'?'学生带来了几道没想明白的题，先听听卡在了哪一步。':'岗位已经准备好了，确认一下今天的安排。',emoji:'🧾',choices:p.done?[]:[{text:'认真完成这份工作',mods:{energy:-j.energy,money:quotedPay(s,j)},minutes:j.minutes,flags:{job:1},...(j.id==='work-tutor'&&s.stats.study<=80?{disabledReason:'学业高于80可以接家教'}:{})},{text:'今天先不接',mods:{},flags:{},cancel:true}]};}
function startActivity(s,key){
 if(s.admission&&['join-creative','join-sport'].includes(key)){
  if(!ready(s)||scope(s,()=>B.freeMinutes(s))<5)throw Error('先完成眼前的安排');
  const route=key.slice(5);if(s.journeys.backgroundId===route)throw Error('已经加入这个社团');
  const label=route==='creative'?'创作社':'运动社',entry={day:s.day,step:-1,eventId:key,index:0,time:clock(s.rhythm.clock),title:'加入了'+label,choice:'登记参加社团',result:'报名已经记下，之后会有同伴来找你一起准备活动。',changes:{},flags:{},project:0,minutes:5};const pending={key,kind:'club',done:true,at:s.rhythm.clock,previous:{eventId:s.eventId,phase:s.phase,outcome:s.outcome}};
  const n={...s,outcome:entry,log:[...s.log,entry],journeys:{backgroundId:route,startDay:s.day,stage:0,decisions:[],completedDay:0,earned:false,pending:null},rhythm:{...s.rhythm,clock:s.rhythm.clock+5,spent:s.rhythm.spent+5},admission:{...s.admission,pending}};return scope(s,()=>B.settleNutrition(s,n,0,false));
 }
 const j=workById.get(key);if(!s.admission||!j)return scope(s,()=>B.startActivity(s,key));
 const option=jobList(s).find(x=>x.id===key);if(!option||option.disabledReason)throw Error(option?.disabledReason||'这段时间安排不了这份兼职');
 const pending={key,at:s.rhythm.clock,done:false,previous:{phase:s.phase,eventId:s.eventId,outcome:s.outcome}};
 return{...s,phase:'choice',eventId:'admission-'+key,outcome:null,admission:{...s.admission,pending}};
}
function choose(s,index){
 const p=s.admission?.pending;
 if(!p)return meetingName(s)&&s.phase==='choice'?chooseCampusMeeting(s,index):scope(s,()=>B.choose(s,index));
 if(p.kind==='identity')return chooseIdentity(s,index);
 if(p.done||s.phase!=='choice'||![0,1].includes(index))throw Error('工作已经结束');
 if(index===1)return{...s,...p.previous,admission:{...s.admission,pending:null}};
 const j=workById.get(p.key);if(j.id==='work-tutor'&&s.stats.study<=80)throw Error('学业高于80可以接家教');
 const stats=scope(s,()=>apply(s.stats,{energy:-j.energy,money:j.money})),entry={day:s.day,step:-1,eventId:s.eventId,campusActivity:j.id,index:0,time:clock(p.at),title:j.label+' · 已完成',choice:'认真完成工作',result:j.id==='work-tutor'?'你把思路讲清楚，也等学生自己算完了最后一步。课酬已经到账。':'完成了约定的工作，工钱已经到账。',changes:delta(s.stats,stats),flags:{job:1},project:0,minutes:j.minutes};
 const n={...s,stats,phase:'outcome',outcome:entry,log:[...s.log,entry],rhythm:{...s.rhythm,clock:p.at+j.minutes,spent:s.rhythm.spent+j.minutes},admission:{...s.admission,pending:{...p,done:true}}};n.failed=failure(n);
 return scope(s,()=>B.settleNutrition(s,n,0,true));
}
function next(s){
 const p=s.admission?.pending;
 if(!p){
  const conversation=s.relationships?.pending;
  if(s.admission?.fanBook&&s.phase==='outcome'&&!s.failed&&conversation?.done){
   // Close the finished conversation before the timetable can open a lesson.
   const returned={...s,...conversation.previous,relationships:{...s.relationships,pending:null}};
   return scope(s,()=>B.next(returned));
  }
  return scope(s,()=>B.next(s));
 }
 if(!p.done||s.phase!=='outcome')throw Error('先完成眼前的安排');
 if(p.kind==='identity')return scope(s,()=>B.next({...s,eventId:p.previous.eventId,admission:{...s.admission,pending:null}}));
 if(s.failed)return{...s,phase:'ending',finalEnding:s.failed,admission:{...s.admission,pending:null}};
 return scope(s,()=>B.next({...s,...p.previous,admission:{...s.admission,pending:null}}));
}
function enableDailyAllowance(s){if(!s?.admission||s.admission.allowance||s.phase==='ending'||s.positiveEnding)return s;return{...s,admission:{...s.admission,allowance:{revision:1,lastPaidDay:s.day}}};}
function support(s,n){
 if(!s.admission?.id||n.day<=s.day||n.failed)return 0;
 const weekChanged=Math.floor((n.day-1)/7)>Math.floor((s.day-1)/7),allowance=s.admission.allowance;
 if(allowance){if(n.day<=allowance.lastPaidDay)return 0;return(s.admission.id==='rich'?150:50)+(weekChanged?(s.admission.id==='director'?30:0)+(has(s,'gold-bank')?50:0):0);}
 if(!weekChanged)return 0;return 200+(s.admission.id==='director'?30:s.admission.id==='rich'?100:0)+(has(s,'gold-bank')?50:0);
}
function missedFanPromises(s,day){
 const ad=s.admission;
 if(!(ad?.fanBook>=2))return [];
 return ad.contacts.filter(c=>c.id!==ad.partnerId&&c.status==='known'&&c.romance.connected&&c.relationships.promise?.dueDay<day);
}
function settleFanPromises(s,day,stats,log,contacts){
 const missed=new Set(missedFanPromises(s,day).map(c=>c.id));
 return contacts.map(c=>{
  if(!missed.has(c.id))return c;
  const {name}=fanIdentity(c),{promise}=c.relationships;
  const intimacy=Math.max(0,c.romance.intimacy-8),connected=intimacy>0,mood=Math.max(0,stats.mood-3);
  const romance={...c.romance,intimacy,connected,...(connected?{}:{dating:false,lastMeet:day})};
  const relationships={...c.relationships,promise:null,strain:connected?Math.min(4,c.relationships.strain+1):0};
  log.push({day,step:-1,eventId:'love-bond-missed',index:0,time:'06:59',title:'错过了和'+name+'的约定',choice:promise.label,
   result:'约好的时间过去了，'+name+'有些失落。',changes:mood===stats.mood?{}:{mood:mood-stats.mood},flags:{},project:0,
   intimacyChange:intimacy-c.romance.intimacy,contactDeleted:!connected,fanContactId:c.id});
  stats.mood=mood;
  return{...c,romance,relationships};
 });
}
function effects(s,n,key){
 if(n===s)return s;
 const ad={...(n.admission||s.admission),daily:s.admission.daily.day===n.day?clone(s.admission.daily):{day:n.day,used:{}},chapters:[...s.admission.chapters]};
 let stats={...n.stats},romance=n.romance,term=n.term,outcome=n.outcome,log=[...n.log];
 const contactId=ad.fanBook&&s.admission.partnerId;
 const namedScene=contactId&&s.romance.connected&&key==='choose'&&!s.admission.pending&&!meetingName(s)&&isFanInteraction(scope(s,()=>B.getScene(s)));
 for(let i=s.log.length;i<log.length;i++){
  const original=log[i],e={...original,changes:{...original.changes}},used=ad.daily.used;let money=0,project=0,energy=0,mood=0,affection=0;
  if(contactId&&((namedScene&&e.eventId===s.eventId)||e.eventId==='love-bond-missed'))e.fanContactId=contactId;
  if(!ad.id){log[i]=e;if(outcome===original)outcome=e;continue;}
  const replaced=has(s,'gold-job')?(e.talentTriggers||[]).filter(t=>t.id==='jobHand').reduce((a,t)=>a+(t.changes?.money||0),0):0;
  const wage=Math.max(0,(e.changes.money||0)-(e.journalRewardReceived||0)-replaced),isJob=!!e.flags?.job||e.eventId==='term-shift'&&e.index===0;
  if(isJob&&wage>0){
   if((e.eventId.startsWith('admission-work-')||e.identityEvent)&&!has(s,'gold-job')&&has(s,'jobHand')&&n.talentEffects&&!n.talentEffects.daily.used.includes('jobHand')){money+=2;n={...n,talentEffects:{...n.talentEffects,daily:{...n.talentEffects.daily,used:[...n.talentEffects.daily.used,'jobHand']}}};}
   if(ad.id==='workstudy')money+=Math.round(wage*.3);
   if(has(s,'gold-job')&&(used.job||0)<2){used.job=(used.job||0)+1;money+=15-replaced;}
  }
  if(ad.id==='competitor'&&e.majorWork&&!e.majorWork.skipped&&e.majorWork.score>=2){const chapter=e.majorWork.majorId+':'+e.majorWork.chapter;if(!ad.chapters.includes(chapter)){ad.chapters.push(chapter);money+=20;}}
  if(ad.id==='blogger'&&e.miniGame==='mini-photo'&&e.miniScore===1&&!used.photo){used.photo=1;money+=10;}
  if(has(s,'gold-brain')&&e.flags?.schoolAttend&&!used.class){used.class=1;project=3;}
  if(has(s,'gold-battery')&&!used.rest&&(e.flags?.rest||e.flags?.nap||e.flags?.sleep||e.eventId==='active-rest'||e.campusActivity==='garden-rest')){used.rest=1;energy=10;}
  if(has(s,'gold-flirt')&&!used.flirt&&e.intimacyChange>0&&!e.contactAdded&&!e.fanReply&&!e.contactDeleted){used.flirt=1;affection=Math.min(3,100-romance.intimacy);romance={...romance,intimacy:romance.intimacy+affection};}
  if((ad.mealRevision||ad.revision)>=2){
   const perk=ad.mealPerk;
   if(e.mealPerk)ad.mealPerk={...e.mealPerk,until:e.day+1};
   else if(perk&&perk.until>=e.day&&perk.remaining>0&&!e.flags?.meal&&!e.fanReply&&!n.failed&&(['choose','completeMini','majorAct'].includes(key)||e.schoolAutoPlan)){
    const recoverEnergy=Math.max(0,Math.min(perk.energy,100-stats.energy-energy)),recoverMood=ad.id==='liang'?0:Math.max(0,Math.min(perk.mood,100-stats.mood));
    if(recoverEnergy||recoverMood){energy+=recoverEnergy;mood+=recoverMood;e.mealRecovery={energy:recoverEnergy,mood:recoverMood};ad.mealPerk=perk.remaining>1?{...perk,remaining:perk.remaining-1}:null;}
   }
  }
  const after=scope(s,()=>apply(stats,{money,energy,mood})),actual=delta(stats,after);stats=after;
  for(const [k,v]of Object.entries(actual))e.changes[k]=(e.changes[k]||0)+v;
  if(ad.id==='liang'){delete e.changes.mood;stats.mood=100;}
  if(project){term={...term,progress:term.progress+project};e.project=(e.project||0)+project;}
  if(affection)e.intimacyChange+=affection;
  const words=[...(money?['生活费＋'+money]:[]),...(actual.energy?['电量＋'+actual.energy]:[]),...(project?['课设＋'+project]:[]),...(affection?['亲密度＋'+affection]:[])];
  if(words.length)e.result+='\n额外收获：'+words.join('，')+'。';
  if(e.mealRecovery)e.result+='\n这一餐攒下的精神还在，做完事情也没那么疲惫。';
  log[i]=e;if(outcome===original)outcome=e;
 }
 const advancingDay=key==='continueDay'&&n.day>s.day;
 let failed=n.failed;
 if(advancingDay&&!failed&&ad.fanBook>=2){
  ad.contacts=settleFanPromises(s,n.day,stats,log,ad.contacts);
  if(stats.mood===0)failed='fail-mood';
 }
 const amount=advancingDay?support(s,{...n,failed}):0;
 if(amount){stats.money+=amount;const daily=!!s.admission.allowance;if(daily)ad.allowance={...ad.allowance,lastPaidDay:n.day};log.push({day:n.day,step:-1,eventId:'admission-support',index:0,time:'07:00',title:'生活费到账',choice:daily?'收下今日生活费':'收下本周生活费',result:daily?'家里转来的生活费已经到账。'+(amount>(s.admission.id==='rich'?150:50)?'额外补助也一并到账。':''):'本周生活费与额外补助已经到账。',changes:{money:amount},flags:{},project:0});}
 if(ad.id==='liang')stats.mood=100;
 if(ad.mealPerk&&ad.mealPerk.until<n.day)ad.mealPerk=null;
 if(failed==='fail-mood'&&stats.mood>0)failed=failure({...n,stats,failed:null});
 if(advancingDay&&ad.id==='celebrity'&&!failed)ad.contacts=[...ad.contacts,...offers({...n,admission:ad})];
 const partner=ad.contacts.find(c=>c.id===ad.partnerId);if(partner){ad.contacts=ad.contacts.map(c=>c.id===partner.id?{...c,romance:clone(romance),relationships:clone(n.relationships),notes:clone(n.campusLife?.notes||[])}:c);}
 if(ad.fanBook>=2&&partner&&!romance.connected){
  ad.partnerId=null;
  romance={...romance,familiar:0,earned:false,earnedDay:0};
  const relationships={...clone(ad.base.relationships),pending:n.relationships.pending};
  n={...n,relationships,campusLife:{...n.campusLife,notes:[]}};
 }
 if(advancingDay&&failed&&!n.failed)n={...n,phase:'ending',finalEnding:failed};
 const settled={...n,stats,romance,term,outcome,log,failed,admission:ad};
 return key==='next'?encounter(anotherCampusMeeting(settled)):settled;
}
function canManageFans(s){return!!s.admission&&s.phase==='outcome'&&alive(s)&&!s.admission.pending&&!s.relationships?.pending&&!s.miniGames?.pending&&!s.majorLife?.pending&&!s.campusRevision?.proposal;}
const canRespondToFan=(s,c)=>c.status==='offered'&&(s.admission.fanBook>=3||c.day===s.day);
function respondFan(s,id,accept){
 if(!canManageFans(s))throw Error('先完成眼前的安排');const offered=s.admission.contacts.find(c=>c.id===id&&canRespondToFan(s,c));if(!offered)throw Error('已经回应过这次邀请');
 const contact=accept&&s.admission.fanBook>=3?{...offered,romance:{...offered.romance,lastMeet:s.day,lastInteraction:s.day}}:offered;
 let romance={...s.romance},relationships=s.relationships,stats={...s.stats},partnerId=s.admission.partnerId;
 let result=accept?'你们交换了联系方式，之后可以再聊。':'你礼貌说明了自己的想法，对方点点头，继续自己的安排。';
 if(accept&&!romance.connected){romance=clone(contact.romance);relationships=clone(contact.relationships);partnerId=id;}
 else if(accept&&romance.dating&&!s.admission.fanBook){romance.intimacy=Math.max(0,romance.intimacy-8);stats=scope(s,()=>apply(stats,{mood:-3}));result+='\n新的联系让现有关系有些紧张，需要认真沟通。';if(!romance.intimacy){romance.connected=false;romance.dating=false;relationships={...relationships,promise:null,strain:0};result+=' 这段关系结束了。';}}
 const name=s.admission.fanBook?fanIdentity(contact).name:contact.name;
 const entry={day:s.day,step:-1,eventId:'fan-contact',index:accept?0:1,time:clock(s.rhythm.clock),title:name+'向你要联系方式',choice:accept?'交换联系方式':'礼貌婉拒',result,changes:delta(s.stats,stats),flags:{},project:0,fanReply:true,contactDeleted:s.romance.connected&&!romance.connected,intimacyChange:romance.intimacy-s.romance.intimacy};
 return{...s,stats,romance,relationships,failed:failure({...s,stats}),...(accept&&!s.romance.connected?{campusLife:{...s.campusLife,notes:clone(contact.notes||[])}}:{}),log:[...s.log,entry],admission:{...s.admission,partnerId,contacts:s.admission.contacts.map(c=>c.id===id?{...contact,status:accept?'known':'declined'}:c)}};
}
function focusContact(s,id){
 if(!canManageFans(s))throw Error('先完成眼前的安排');if(s.romance.dating)throw Error('先和当前恋人认真决定如何继续');
 const c=s.admission.contacts.find(c=>c.id===id&&c.status==='known'&&c.romance.connected);if(!c||s.admission.partnerId===id)throw Error('这位同学目前无法继续联系');
 const contacts=s.admission.contacts.map(x=>x.id===s.admission.partnerId?{...x,romance:clone(s.romance),relationships:clone(s.relationships),notes:clone(s.campusLife?.notes||[])}:x);
 if(!s.admission.partnerId&&s.romance.connected){
  const index=contacts.findIndex(x=>x.id==='campus-naifen');
  const original={id:'campus-naifen',name:s.admission.fanBook>=3?campusName(s,1,0):'奶粉',day:s.day,status:'known',...contactSnapshot(s)};
  if(index<0)contacts.push(original);
  else if(s.admission.fanBook>=2)contacts[index]=original;
 }
 return{...s,romance:clone(c.romance),relationships:clone(c.relationships),campusLife:{...s.campusLife,notes:clone(c.notes||[])},admission:{...s.admission,contacts,partnerId:id}};
}
function upgradeAdmission(s){if(!s?.admission||(s.admission.mealRevision||s.admission.revision)>=2||s.phase==='ending'||s.positiveEnding)return s;return{...s,admission:{...s.admission,mealRevision:2,mealPerk:null}};}
function upgradeDiningMenu(s){if(!s?.admission||(s.admission.mealRevision||s.admission.revision)>=3||s.phase==='ending'||s.positiveEnding)return s;return{...s,admission:{...s.admission,mealRevision:3}};}
function upgradeBreakfastRewards(s){if(!s?.admission||(s.admission.mealRevision||s.admission.revision)>=4||s.phase==='ending'||s.positiveEnding)return s;return{...s,admission:{...s.admission,mealRevision:4}};}
const mutations=new Set(['choose','next','startActivity','completeMini','cancelMini','continueDay','retire','selectCourses','planCourseAttendance','upgradeTimetable','startMajor','majorAct','cancelMajor','skipMajor',...Object.keys(B).filter(k=>k.startsWith('enable')&&typeof B[k]==='function'),'respondFan','focusContact','upgradeAdmission','enableIdentityEvents','upgradeIdentityEvents','enableDailyAllowance','upgradeDiningMenu','upgradeBreakfastRewards','enableFanBook']);
const custom={choose,next,startActivity,respondFan,focusContact,upgradeAdmission,enableIdentityEvents,upgradeIdentityEvents,enableDailyAllowance,upgradeDiningMenu,upgradeBreakfastRewards,enableFanBook},wrapped={};
for(const key of mutations)if(custom[key]||typeof B[key]==='function')wrapped[key]=(s,...args)=>{
 if(!s?.admission&&key==='enableFanBook'&&args[0]===3&&canAddBook(s))return wrapped.enableFanBook(initialContactsOnly(s),3);
 if(!s?.admission)return key==='upgradeAdmission'||key==='enableIdentityEvents'||key==='upgradeIdentityEvents'||key==='enableDailyAllowance'||key==='upgradeDiningMenu'||key==='upgradeBreakfastRewards'||key==='enableFanBook'?s:B[key](s,...args);
 if(!s.admission.id&&['upgradeAdmission','enableIdentityEvents','upgradeIdentityEvents','enableDailyAllowance','upgradeDiningMenu','upgradeBreakfastRewards'].includes(key))return s;
 const n=scope(s,()=>custom[key]?custom[key](s,...args):B[key](s,...args));if(n===s)return s;
 const value=effects(s,n,key);return{...value,admission:{...value.admission,moves:[...s.admission.moves,JSON.stringify([key,args])]}};
};
function restore(raw){
 if(!raw?.admission)return B.restore(raw);
 try{const a=raw.admission;if(![1,2,3,4].includes(a.revision)||a.base?.admission||!Array.isArray(a.moves)||a.moves.length>30000)return null;
  const base=B.restore(a.base);if(!base)return null;
  const contactOnly=a.id===null;
  if(contactOnly?(a.revision!==4||!canAddBook(base)||a.loadout!==undefined):(!Array.isArray(a.loadout)||new Set(a.loadout.map(family)).size!==3||!byIdentity.has(a.id)||!same(B.selectedTraits(base),a.loadout.map(family))))return null;
  let s=contactOnly?initialContactsOnly(base):initial(base,a.id,a.loadout,a.revision);
  for(const move of a.moves){const row=JSON.parse(move);if(!Array.isArray(row)||row.length!==2||!wrapped[row[0]]||!Array.isArray(row[1]))return null;s=wrapped[row[0]](s,...row[1]);}
  return same(s,raw)?s:null;
 }catch{return null;}
}
const moneyLabel=t=>String(t).replaceAll('饭钱','生活费');
function getScene(s){
 if(s.admission?.pending)return workScene(s);
 if(!meetingName(s)||s.phase!=='choice')return scope(s,()=>B.getScene(s));
 const scene=scope(s,()=>B.getScene(strangerInput(s)));
 if(scene?.id!=='love-encounter')return scene;
 if(scene.naifenInitiated&&!s.admission.metContact)return{...scene,bubble:'',text:'“同学你好，方便加个联系方式吗？”奶粉拿出手机，等着你的回应。'};
 if(s.admission.metContact)return{...scene,bubble:'',title:'你又遇到了奶粉。'};
 return{...scene,bubble:''};
}
function availableActivities(s){
 if(s.admission?.pending)return[];
 const contact=s.admission?.contacts.find(c=>c.id===s.admission.partnerId);
 const name=contact&&(s.admission.fanBook>=3||contact.id.startsWith('fan-'))?fanIdentity(contact).name:'';
 const activities=scope(s,()=>B.availableActivities(s)).map(a=>name&&a.partner
  ?{...a,label:a.label.replace(/奶粉|你的宝宝|她的(?=近况)/g,word=>word==='她的'?name+'的':name)}:a);
 const clubs=ready(s)&&scope(s,()=>B.freeMinutes(s))>=5
  ?['creative','sport'].filter(id=>s.journeys?.backgroundId!==id).map(id=>({id:'join-'+id,label:id==='creative'?'加入创作社':'加入运动社'})):[];
 return [...activities,...jobList(s),...clubs];
}
function restPreview(s){
 const rest=scope(s,()=>B.restPreview(s));
 if(!s.admission)return rest;
 const day=s.day+1,stats={...rest.stats},changes={...rest.changes};
 let failed=rest.failed;
 if(!failed){
  const penalty=Math.min(stats.mood,missedFanPromises(s,day).length*3);
  if(penalty){
   stats.mood-=penalty;
   changes.mood=(changes.mood||0)-penalty;
   if(stats.mood===0)failed='fail-mood';
  }
 }
 const extra=support(s,{day,failed});
 stats.money+=extra;
 if(extra)changes.money=(changes.money||0)+extra;
 return{...rest,stats,changes,failed};
}
const api={...B,...wrapped,identities,goldenTraits:golden,traits,identityDraft,talentDraft,createCampus,selectedTraits:selected,identityOf,identityDetails,identityFamily:family,canManageFans,canRespondToFan,fanIdentity,meetingName,isFanInteraction,labThreshold,
 getScene,availableActivities,
 labels:{...B.labels,money:'生活费'},restore,valid:s=>restore(s)!==null,
 restPreview,
 fullness:s=>scope(s,()=>B.fullness(s)),freeMinutes:s=>s.admission?.pending?0:scope(s,()=>B.freeMinutes(s)),
 ending:s=>{const e=B.ending(s);return{...e,name:moneyLabel(e.name),quote:moneyLabel(e.quote)};}
};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
