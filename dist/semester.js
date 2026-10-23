(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports;
const B=browser?root.DormGame:require('./survival.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function hash(text){let h=2166136261;for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
const addedEndings=[
 {id:'course-pass',icon:'🗂️',name:'课设按时交',quote:'这周没有靠一句“在做了”糊弄过去。奶娃真的交出了作品。'},
 {id:'course-clutch',icon:'🌙',name:'凌晨补交人',quote:'文件传完的那一刻天还没亮。交上了，但身体记住了这一晚。',hidden:true},
 {id:'course-streak',icon:'🏆',name:'三周不欠账',quote:'连续三周按时完成课设，没有通宵补交，也没有把任务扔给室友。',difficulty:'hard'},
 {id:'fail-course',icon:'📋',name:'课设重修通知',quote:'两次没有交出课设。这一局的学期只能先暂停，下次别等到最后一晚。',failure:true}
];
const choice=(text,mods,result,project=0)=>({text,mods,result,flags:{},project});
const crises=[
 {id:'term-charger',title:'充电器突然退休了。',emoji:'🔌',bubble:'电量和钱包，只能先救一个。',choices:[choice('买一个新的',{money:-18,energy:4},'新充电器到位，饭卡余额退后一步。'),choice('自己研究怎么修',{energy:-14,mood:-4},'修了半晚，顺手把排障过程写进课设。',12),choice('借室友的充电器',{social:-15,mood:-3},'室友递过充电器，也把下次跑腿名额留给了你。')]},
 {id:'term-cold',title:'奶娃有点感冒前兆。',emoji:'🤧',bubble:'今天不能每件事都要。',choices:[choice('去校医室看看',{money:-15,energy:-6,health:12},'校医让你慢一点，今天的预算也跟着慢了下来。'),choice('请半天假休息',{energy:15,health:6,study:-14},'睡醒舒服一些，落下的课需要之后补。'),choice('照常赶进度',{study:12,energy:-10,health:-14,mood:-6},'任务推进了，鼻音也更重了。')]},
 {id:'term-print',title:'小组突然要交纸质材料。',emoji:'🖨️',bubble:'打印机没有免费的选项。',choices:[choice('凑钱赶紧打印',{money:-12,study:6},'打印店接住了你们的临时需求。'),choice('替全组排版换打印费',{energy:-16,mood:-4},'你没出钱，但把整个空闲时段交给了页码。',16),choice('删减材料，交简版',{study:-12,social:-8},'交是交了，小组成员看着缩水的附件叹气。')]},
 {id:'term-shift',title:'兼职临时缺人。',emoji:'🧾',bubble:'多赚一点，还是多做一点？',choices:[choice('顶班赚一笔',{money:28,energy:-22,health:-3,study:-6},'工资到账，你错过了今晚的小组讨论。'),choice('请室友帮忙换班',{social:-16,study:10,energy:-6},'室友接走了班次，这个人情得记着。'),choice('按原计划休息',{energy:12,money:-6,mood:3},'保住了休息，临时换班的交通费还是花了。')]},
 {id:'term-noise',title:'隔壁寝室突然开麦。',emoji:'🎤',bubble:'忍耐也会花掉心情。',choices:[choice('去沟通一下',{social:-12,energy:8,mood:6},'声音小了，对方的表情也冷了一点。'),choice('买副耳塞',{money:-10,energy:10,mood:3},'关上声音的那一刻，奶娃也放松下来。'),choice('转战图书馆',{energy:-12,study:16,mood:-4},'夜路有点累，好在找到了安静的角落。')]},
 {id:'term-laptop',title:'电脑在关键时刻蓝屏。',emoji:'💻',bubble:'救文件，还是救余额？',choices:[choice('找维修点处理',{money:-22,study:8},'文件回来了，余额少了一块。'),choice('自己排查到恢复',{energy:-18,mood:-6},'修好以后，你对这台电脑的脾气更熟了。',15),choice('借同学电脑继续',{social:-18,energy:-6,study:5},'换了台电脑，还欠下一个不小的人情。')]}
];
function isNew(s){return s.version===6;}
function task(s){
 if(!isNew(s))return null;
 const week=Math.ceil(s.day/7),names=['课程小组作业','校园调研报告','作品展示答辩','实验课程设计','社团实践项目','期末综合展示'];
 const target=Math.min(260,140+(week-1)*35),daysLeft=7-(s.day-1)%7;
 return {week,name:names[(week-1)%names.length],target,progress:s.term.progress,daysLeft,passed:s.term.passed,missed:s.term.missed};
}
function crisisPlan(s){const week=Math.ceil(s.day/7),r=B.rng(hash(s.seed+':term-crisis:'+week));return{day:(week-1)*7+3+Math.floor(r()*3),step:[3,4,6][Math.floor(r()*3)],event:crises[Math.floor(r()*crises.length)]};}
function override(s){if(!isNew(s)||s.phase!=='choice')return s;const plan=crisisPlan(s);const id=s.day%7===0&&s.step===7?'term-deadline':s.day===plan.day&&s.step===plan.step?plan.event.id:s.eventId;return id===s.eventId?s:{...s,eventId:id};}
function create(seed,traits,name,recent=[]){const s=B.create(seed,traits,name,recent);return override({...s,version:6,term:{progress:0,passed:0,missed:0,clutch:0,cleanStreak:0,bestStreak:0}});}
function projectGain(scene,c){return Number.isFinite(c.project)?c.project:scene.kind==='三餐'?0:Math.ceil(Math.max(0,c.mods.study||0)*.75);}
function deadline(s){const t=task(s),gap=Math.max(0,t.target-s.term.progress);
 const choices=[
  {...choice('按时提交',{money:18,study:6,mood:5},'课设提交成功，项目补贴也到账了。'),submit:true,disabledReason:gap?'课设还差 '+gap+' 点':''},
  {...choice('通宵补完再交',{energy:-24,health:-10,mood:-12},'赶上了补交窗口，但今晚的睡眠已经找不回来了。',25),submit:true,clutch:true,disabledReason:gap>25?'课设还差 '+gap+' 点，通宵也补不完':s.stats.energy<=24||s.stats.health<=10?'身体撑不住通宵':''},
  {...choice('请室友一起救火',{money:-12,energy:-10,social:-22,mood:-5},'室友陪你补完了最后一段，欠下的人情不会自动消失。',40),submit:true,clutch:true,disabledReason:gap>40?'课设还差 '+gap+' 点，来不及救火':s.stats.social<40?'人缘不足，暂时请不到帮手':''},
  {...choice('接受这次挂科',{study:-25,mood:-15},s.term.missed?'第二次没交上课设，本学期转入重修。':'这次先记一次挂科。再缺交一次，这段学期就得暂停。'),miss:true}
 ];
 return {id:'term-deadline',time:time(s),place:'课程平台',kind:'课设截止',title:'这周的课设，要交了。',text:'进度 '+s.term.progress+' / '+t.target+'。钱、体力和人情，你还留了哪一张牌？',emoji:'📋',bubble:'“在做了”已经不能当附件交。',choices};
}
function time(s){const L=browser?root.DormLife:require('./life.js');return L.eventTime(s);}
function getScene(s){
 if(!isNew(s))return B.getScene(s);
 if(s.phase==='dayEnd'||s.phase==='ending')return null;
 if(s.eventId==='term-deadline')return deadline(s);
 const crisis=crises.find(e=>e.id===s.eventId);
 let scene=crisis?{...clone(crisis),time:time(s),place:'校园临时状况',kind:'临时状况',text:'计划之外的事来了，今天的空闲不能同时留给所有事。'}:clone(B.getScene(s));
 if(scene.kind==='三餐'){
  for(const c of scene.choices){
   if(c.flags.missedMeal)continue;
   c.mods.energy=Math.ceil(c.mods.energy*.65);c.mods.health=Math.ceil(c.mods.health*.6);c.mods.mood=Math.ceil(c.mods.mood*.6);
   if(c.mods.money===0){
    if(/室友|共享/.test(c.text)){c.mods.social=(c.mods.social||0)-7;c.result+='\n这餐省了饭钱，也欠下一个人情。';}
    else{c.mods.energy-=4;c.mods.study=(c.mods.study||0)-4;c.result+='\n准备或帮工占去一些时间，今天的课得多补一点。';}
   }
  }
 }else{
  let streak=0;for(let i=s.log.length-1;i>=0&&s.log[i].day===s.day;i--){const entry=s.log[i];if(['meal-breakfast','meal-lunch','meal-dinner'].includes(entry.eventId))continue;if((entry.changes.study||0)<=0)break;streak++;}
  for(const c of scene.choices){
   const learning=Math.max(0,c.mods.study||0);
   c.mods.energy=(c.mods.energy||0)-Math.min(8,4+Math.ceil(s.day/7))-Math.ceil(learning/8)-(learning?streak*2:0);
   c.mods.health=(c.mods.health||0)-2-(learning?streak:0);c.mods.mood=(c.mods.mood||0)-2-(learning?streak:0);
   if(learning&&s.stats.mood<35)c.mods.study=Math.ceil(learning*.7);
  }
  if(streak)scene.callback=(scene.callback?scene.callback+'\n':'')+'连续学习会更累，换个节奏也能留力气。';
  if(s.stats.mood<35)scene.callback=(scene.callback?scene.callback+'\n':'')+'心情低落，学习收益降至七成。';
 }
 for(const c of scene.choices)c.project=projectGain(scene,c);
 return scene;
}
function choose(s,index){
 if(!isNew(s))return B.choose(s,index);
 if(s.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('当前不能选择');
 const scene=getScene(s),c=scene.choices[index];if(!c)throw Error('当前不能选择');
 if(c.disabledReason)throw Error(c.disabledReason);if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
 const mods={...c.mods},flags={...s.flags},term={...s.term};let result=c.result,bonus=s.bonus;
 for(const[k,v]of Object.entries(c.flags||{}))flags[k]=(flags[k]||0)+v;
 if(scene.kind!=='三餐'&&(mods.social||0)>0)mods.mood=(mods.mood||0)+1;
 if(s.traits.includes('luck')&&s.step===2){mods.money=(mods.money||0)+8;result+='\n🍀 锦鲤天赋触发：饭卡活动返还了8元。';bonus=true;}
 if(c.roll){const chance=Math.min(.95,c.roll.rate+(s.traits.includes('luck')?.15:0));const won=B.rng(hash(s.seed+':roll:'+s.day+':'+scene.id+':'+index))()<chance;const branch=won?c.roll.win:c.roll.lose;for(const[k,v]of Object.entries(branch.mods||{}))mods[k]=(mods[k]||0)+v;result+='\n'+branch.text;}
 const gain=projectGain(scene,c);term.progress+=gain;
 if(c.submit){if(term.progress<task(s).target)throw Error('课设尚未完成');term.passed++;term.clutch+=c.clutch?1:0;term.cleanStreak=c.clutch?0:term.cleanStreak+1;term.bestStreak=Math.max(term.bestStreak,term.cleanStreak);}
 if(c.miss){term.missed++;term.cleanStreak=0;}
 const stats=B.apply(s.stats,mods),actual={};for(const k of B.keys)if(stats[k]!==s.stats[k])actual[k]=stats[k]-s.stats[k];
 const failed=stats.energy<=0?'fail-energy':stats.study<=0?'fail-study':stats.health<=0?'fail-health':term.missed>=2?'fail-course':null;
 const entry={day:s.day,step:s.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result,changes:actual,flags:{...c.flags},project:gain};
 return {...s,stats,flags,term,bonus,phase:'outcome',outcome:entry,log:[...s.log,entry],failed,actions:[...s.actions,'c'+index]};
}
function next(s){if(!isNew(s))return B.next(s);return override(B.next(s));}
function continueDay(s){if(!isNew(s))return B.continueDay(s);let n=B.continueDay(s);if(s.day%7===0)n={...n,term:{...s.term,progress:0}};return override(n);}
function ending(s){if(s.failed==='fail-course')return addedEndings.find(e=>e.id===s.failed);return B.ending(s);}
function achievements(s){
 if(!isNew(s))return B.achievements(s);
 const source=s.failed==='fail-course'?{...s,failed:'fail-study',finalEnding:'fail-study'}:s;
 const found=B.achievements(source).filter(e=>s.failed!=='fail-course'||e.id!=='fail-study');
 if(!['ending','dayEnd'].includes(s.phase))return found;
 const ids=[];if(s.term.passed)ids.push('course-pass');if(s.term.clutch)ids.push('course-clutch');if(s.term.bestStreak>=3)ids.push('course-streak');if(s.failed==='fail-course')ids.push('fail-course');
 return [...found,...ids.map(id=>addedEndings.find(e=>e.id===id))];
}
function restore(raw){
 if(raw?.version!==6)return B.restore(raw);
 try{
  if(!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>10000)return null;
  let s=create(raw.seed,raw.traits,raw.name,raw.recent);
  for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='e')s=B.enableEconomy(s);else if(a==='l')s=B.enableLife(s);else return null;}
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
const api={...B,create,getScene,choose,next,continueDay,ending,achievements,restore,valid:s=>restore(s)!==null,task,events:[...B.events,...crises,{id:'term-deadline',kind:'课设截止'}],eventCount:B.eventCount+crises.length+1,endings:[...B.endings,...addedEndings]};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
