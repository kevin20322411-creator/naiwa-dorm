(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./major-life.js');
const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ids=['classRep','keyListener','napSwitch','jobHand','morningExercise','lunchbox','steadyPractice','observationNotes','clubBuddy','piggyBank','slowWarm','regularSleep'],added=new Set(ids);
const selected=s=>B.selectedTraits(s)||[],alive=s=>!s.failed&&!s.lottery?.won&&['health','mood','energy','study'].every(k=>s.stats[k]>0);
const delta=(a,b)=>Object.fromEntries(B.keys.filter(k=>Number.isFinite(a[k])&&a[k]!==b[k]).map(k=>[k,b[k]-a[k]]));
function enableTalentEffects(s){
 if(s.version!==6||s.talentEffects||s.phase==='ending'||!selected(s).some(id=>added.has(id)))return s;
 return{...s,actions:[...s.actions,'talent-v1'],talentEffects:{revision:1,base:clone(s),daily:{day:s.day,used:[]}}};
}
function mealPayment(e,s){
 const netMoney=e.changes?.money||0;
 // The journal may credit a reward on the same receipt as the meal.
 return -(netMoney-(s.campusJobs?.rules===2?e.journalRewardReceived||0:0));
}
function matches(id,e,s){
 const f=e.flags||{},academic=f.schoolAttend&&['major','common'].includes(e.category),practice=!!e.majorWork&&!e.majorWork.skipped;
 if(id==='classRep')return!!academic&&e.category==='major';
 if(id==='keyListener')return!!academic;
 if(id==='napSwitch')return!!(f.rest||f.nap||f.sleep||e.campusActivity==='garden-rest');
 if(id==='jobHand')return!!f.job||(s.campusJobs?.rules===2&&e.eventId==='term-shift'&&e.index===0);
 if(id==='morningExercise')return!!f.sport;
 if(id==='lunchbox')return!!f.meal&&!f.missedMeal&&!e.outside&&!e.lotteryPrize&&e.eventId!=='lottery-ticket'&&mealPayment(e,s)>0&&(/^meal-/.test(e.eventId)||/食堂/.test(e.place||''));
 if(id==='steadyPractice'||id==='observationNotes')return practice;
 if(id==='clubBuddy')return !e.schoolCourse&&!e.majorWork&&!f.job&&!f.meal&&!e.ignored&&!!(f.social||f.kindness||f.help||f.helped||f.rescue||f.mealFriend||e.intimacyChange>0||e.campusActivity==='campus-chat'||e.changes?.social>0);
 return false;
}
function reward(id,e,s){
 if(id==='classRep'||id==='steadyPractice')return{project:1,mods:{}};
 const mods=id==='keyListener'||id==='observationNotes'?{study:1}:id==='napSwitch'?{energy:2}:id==='jobHand'?{money:2}:id==='lunchbox'?{money:Math.min(1,mealPayment(e,s))}:id==='clubBuddy'?{social:1}:{mood:1};
 // Use the same pre-activity thresholds as the underlying status rewards.
 for(const k of ['health','mood'])if(mods[k]>0)mods[k]=s.stats[k]>=80?Math.floor(mods[k]*.25):s.stats[k]>=65?Math.max(1,Math.floor(mods[k]*.5)):mods[k];
 return{mods,project:0};
}
function effects(s,n){
 if(!s.talentEffects||n===s)return n;
 let daily=s.talentEffects.daily.day===n.day?{day:n.day,used:[...s.talentEffects.daily.used]}:{day:n.day,used:[]};
 n={...n,talentEffects:{...s.talentEffects,daily}};
 if(!alive(s)||!alive(n)||n.log.length<=s.log.length)return n;
 const loadout=selected(s),log=[...n.log];let stats=n.stats,project=0,outcome=n.outcome;
 for(let i=s.log.length;i<log.length;i++){
  const entry=log[i];if(entry.day!==n.day)continue;let e=entry,changes={...entry.changes},messages=[],triggers=[];
  for(const id of ids){
   if(!loadout.includes(id)||daily.used.includes(id)||!matches(id,entry,s))continue;
   daily.used.push(id);const bonus=reward(id,entry,s),after=B.apply(stats,bonus.mods),actual=delta(stats,after),parts=Object.entries(actual).map(([key,value])=>B.labels[key]+(value>0?'+':'')+value);
   for(const [key,value] of Object.entries(actual)){changes[key]=(changes[key]||0)+value;if(changes[key]===0)delete changes[key];}
   if(bonus.project){project+=bonus.project;e={...e,project:(e.project||0)+bonus.project};parts.push('课设+'+bonus.project);}
   if(parts.length){messages.push('天赋·'+B.traits.find(t=>t.id===id).name+'：'+parts.join('、'));triggers.push({id,changes:actual,project:bonus.project});}
   stats=after;
  }
  if(messages.length){e={...e,changes,result:e.result+'\n'+messages.join('\n'),talentTriggers:triggers};log[i]=e;if(outcome===entry)outcome=e;}
 }
 return{...n,stats,log,outcome,...(project?{term:{...n.term,progress:n.term.progress+project}}:{})};
}
const mutators=[...new Set(['choose','next','startActivity','completeMini','cancelMini','continueDay','retire','selectCourses','upgradeTimetable','startMajor','majorAct','cancelMajor','skipMajor',...Object.keys(B).filter(k=>k.startsWith('enable')&&typeof B[k]==='function')])],wrapped={};
for(const key of mutators)wrapped[key]=(s,...args)=>{
 if(!s.talentEffects)return B[key](s,...args);
 const n=B[key](s,...args);if(n===s)return s;
 return{...effects(s,n),actions:[...s.actions,'talent-base:'+encodeURIComponent(JSON.stringify([key,args]))]};
};
function restore(raw){
 if(!raw?.talentEffects)return B.restore(raw);
 try{
  const layer=raw.talentEffects;if(layer.revision!==1||layer.base?.talentEffects||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;
  const base=B.restore(layer.base);if(!base)return null;const boundary=base.actions.length;
  if(raw.actions[boundary]!=='talent-v1'||!same(raw.actions.slice(0,boundary),base.actions))return null;
  let s=enableTalentEffects(base);if(!s.talentEffects)return null;
  for(const a of raw.actions.slice(boundary+1)){
   const m=/^talent-base:(.+)$/.exec(a);if(!m)return null;const args=JSON.parse(decodeURIComponent(m[1]));
   if(!Array.isArray(args)||args.length!==2||!mutators.includes(args[0])||!Array.isArray(args[1]))return null;
   s=wrapped[args[0]](s,...args[1]);
  }
  return same(s,raw)?s:null;
 }catch{return null;}
}
root.DormGame={...B,...wrapped,create:(...args)=>enableTalentEffects(B.create(...args)),enableTalentEffects,restore,valid:s=>restore(s)!==null};
if(!browser)module.exports=root.DormGame;
})(typeof globalThis!=='undefined'?globalThis:this);
