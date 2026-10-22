(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports;
const L=browser?root.DormGame:require('./engine.js');
const makeEvents=browser?root.DormEvents:require('./events.js');
const campus=browser?root.DormCampus:require('./campus.js');
const makeEconomy=browser?root.DormEconomy:require('./economy.js');
const challenges=browser?root.DormChallenges:require('./challenges.js');
const life=browser?root.DormLife:require('./life.js');
const {rng}=L,keys=[...L.keys,'health','mood'],labels={...L.labels,health:'健康',mood:'心情'};
function statKeys(stats){return keys.filter(k=>Number.isFinite(stats[k]));}
function apply(stats,mods){const next={...stats};for(const k of statKeys(stats))next[k]=Math.max(0,Math.min(k==='money'?150:100,next[k]+(mods[k]||0)));return next;}
function fullLife(s){return s.version>=5||s.lifeUpdate===true;}
const traits=[...L.traits,...campus.traits],traitMap=new Map(traits.map(t=>[t.id,t]));
const c=(text,hint,mods,result,flags={},roll=null)=>({text,hint,mods,result,flags,roll});
// V2 is frozen: changing its pool or replay text would invalidate existing saves.
const legacyEvents=[...L.stages.map((x,i)=>({...x,id:'base-'+i,slot:i,weight:8})),...makeEvents(c)];
const v3Events=[...legacyEvents,...campus.makeEvents(c)];
const events=[...v3Events,...makeEconomy(c)];
const eventMap=new Map(events.map(e=>[e.id,e]));
const legacyMap=new Map(legacyEvents.map(e=>[e.id,e]));
const v3Map=new Map(v3Events.map(e=>[e.id,e]));
const bySlot=Array.from({length:8},(_,slot)=>events.filter(e=>e.slot===slot));
const v3BySlot=Array.from({length:8},(_,slot)=>v3Events.filter(e=>e.slot===slot));
const legacyBySlot=Array.from({length:8},(_,slot)=>legacyEvents.filter(e=>e.slot===slot));
const stages=L.stages.map((s,i)=>({time:s.time,label:['出门之前','上午校园','午饭时分','午后忙碌','回寝插曲','晚间自由','夜间突发','熄灯之前'][i]}));
const milestones=[
 {id:'freshman',days:3,icon:'🌱',name:'新生适应证',quote:'门禁、课表和洗衣机，你终于把大学的基础操作摸熟了。',hint:'完整度过三天。'},
 {id:'week',days:7},
 {id:'degree',days:14,study:80,icon:'📜',name:'奶士学位',quote:'兹授予本奶娃奶士学位。所修专业：在早八、DDL和生活之间，认真活下来。',hint:'同一局完整度过十四天，并在当日结算时学业达到八十。'},
 {id:'honor',days:30,study:80,icon:'🏅',name:'宿舍荣誉奶士',quote:'三十天后，你还是会忘带饭卡，但已经懂得如何把日子接着过下去。',hint:'同一局完整度过三十天，并在当日结算时学业达到八十。'}
];
const endings=[...L.endings,
 {id:'cat',icon:'🐈',name:'校猫编外饲养员',quote:'你还没拿到学位，已经被橘猫列入可信任人类名单。',hint:'和校猫多认识几次，关系才会慢慢熟起来。'},
 {id:'viral',icon:'📹',name:'全校共享表情包',quote:'你只想好好上大学，班群、寝室群和隔壁专业都想好好用你。',hint:'让你的抽象现场有两次以上后续传播。'},
 {id:'artist',icon:'🎭',name:'校园野生艺术家',quote:'台上、台下、洗衣房，你总能找到自己的舞台。',hint:'多参加几次演出或创作，作品会自己长出来。'},
 {id:'week',icon:'🏁',name:'一周仍在校',quote:'早八没吞掉你，DDL没淹没你。第七天，你还是一只在读奶娃。',hint:'连续平安度过七天，就能见到这一版人生。'},
 {id:'fail-energy',icon:'🪫',name:'奶娃强制关机',quote:'电量归零。你在回寝路上累得一步都不想挪，只好结束这段奶娃人生。',hint:'电量归零，会立刻触发失败。记得给休息留位置。',failure:true},
 {id:'fail-study',icon:'🚩',name:'学业劝退通知',quote:'学业归零。这一局的奶娃没能守住在读身份，只能收拾课本，重新入学。',hint:'学业归零，会立刻触发失败。别把所有任务都交给明天。',failure:true},
 ...campus.endings,...milestones.filter(m=>m.name),...challenges.endings,
 {id:'fail-health',icon:'🩹',name:'奶娃请假休养',quote:'健康见底，奶娃给这段忙乱的生活按下暂停键。下次先把饭吃好，把觉睡够。',failure:true}
];
const endingMap=new Map(endings.map(e=>[e.id,e]));
const themeRules=[['athlete','sport',3],['trader','trade',3],['worker','job',3],['informant','intel',3],['gardener','plant',3],['inventor','maker',3],['meal-pal','mealFriend',3],['helper','kindness',5],['library','library',3]];
const openingBuffs=[
 {id:'rested',name:'睡了个好觉',key:'energy',amount:12},
 {id:'meal-credit',name:'饭卡小红包',key:'money',amount:12},
 {id:'good-company',name:'室友好眼缘',key:'social',amount:12},
 {id:'clear-mind',name:'开学好状态',key:'study',amount:12},
 {id:'well-rested',name:'元气好底子',key:'health',amount:12},
 {id:'sunny-start',name:'今天心情晴',key:'mood',amount:12}
];
function hash(text){let h=2166136261;for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
function newDraft(seed,excluded=[],avoid=[]){
 const random=rng(seed),locked=new Set(excluded),previous=new Set(avoid);
 const ranked=[...traits].filter(t=>!locked.has(t.id)).sort((a,b)=>a.id.localeCompare(b.id)).map(t=>({t,k:random()})).sort((a,b)=>a.k-b.k);
 return [...ranked.filter(x=>!previous.has(x.t.id)),...ranked.filter(x=>previous.has(x.t.id))].slice(0,6).map(x=>x.t.id);
}
function initialStats(selected){let stats={energy:65,money:40,social:45,study:40};for(const id of selected)stats=apply(stats,traitMap.get(id).mods);return stats;}
function rollOpeningBuff(seed,stats){
 const random=rng(hash(seed+':opening-buff-v4'));if(random()>=.2)return null;
 const eligible=openingBuffs.filter(b=>(b.key==='money'?150:100)-stats[b.key]>=b.amount);
 if(!eligible.length)return null;
 const b=eligible[Math.floor(random()*eligible.length)];return{id:b.id,key:b.key,amount:b.amount};
}
function dayFlags(state){const f={};for(let i=state.log.length-1;i>=0&&state.log[i].day===state.day;i--)for(const[k,n]of Object.entries(state.log[i].flags||{}))f[k]=(f[k]||0)+n;return f;}
function economyEnabled(state){return state.version>=4||state.economyBoost===true||fullLife(state);}
function earnsMoney(event){return !!event&&event.choices.some(c=>(c.mods.money||0)>0);}
function pick(state){
 if(fullLife(state)&&[0,2,5].includes(state.step))return life.meals.find(m=>m.step===state.step).id;
 const economy=economyEnabled(state),slots=economy?bySlot:state.version===2?legacyBySlot:v3BySlot;
 const windows={1:[0,1,3],3:[1,3,4],4:[3,4,5],6:[4,5,6],7:[7]};
 const pool=fullLife(state)?events.filter(e=>windows[state.step].includes(e.slot)&&e.id!=='base-0'):slots[state.step];
 let candidates=pool.filter(e=>(!e.when||e.when(state))&&e.choices.some(c=>(c.mods.money||0)>=-state.stats.money));
 if(state.step===2&&state.stats.money<5)return'wallet-rescue';
 const recent=new Set([...state.recent,...state.log.slice(-24).map(e=>e.eventId)].slice(-24));
 // On a tight second-day budget, offer a real earning route before lunch.
 // If morning jobs were just seen, use the next slot to keep the opening varied.
 if(economy&&state.day>1&&state.stats.money<10&&state.step<=1){
  const offeredToday=state.log.slice(-8).some(e=>e.day===state.day&&earnsMoney(eventMap.get(e.eventId)));
  const income=candidates.filter(earnsMoney),freshIncome=income.filter(e=>!recent.has(e.id));
  if(!offeredToday&&(freshIncome.length||state.step===1)&&income.length)candidates=freshIncome.length?freshIncome:income;
 }
 const fresh=candidates.filter(e=>!recent.has(e.id));if(fresh.length)candidates=fresh;
 if(!candidates.length)throw Error('没有可用事件');
 const weights=candidates.map(e=>(e.weight||8)*(economy&&earnsMoney(e)?state.stats.money<8?6:state.stats.money<20?4:1.5:1)),total=weights.reduce((a,b)=>a+b,0);
 const signature=state.seed+':'+state.day+':'+state.step+':'+JSON.stringify(state.flags);
 let v=rng(hash(signature))()*total;for(let i=0;i<candidates.length;i++){v-=weights[i];if(v<0)return candidates[i].id;}return candidates[candidates.length-1].id;
}
function createForVersion(version,seed,selected,name,recent=[]){
 let old;
 if(version===2)old=L.create(seed,selected,name);
 else{
  if(!Array.isArray(selected)||selected.length!==2||new Set(selected).size!==2||selected.some(id=>!traitMap.has(id)))throw Error('请选择两张不同天赋');
  old={seed:seed>>>0,name:String(name||'奶娃同学').trim().slice(0,12)||'奶娃同学',traits:[...selected],stats:initialStats(selected)};
 }
 const map=version===2?legacyMap:version===3?v3Map:eventMap;
 const state={version,seed:old.seed,name:old.name,traits:old.traits,stats:old.stats,flags:{},day:1,step:0,phase:'choice',eventId:null,log:[],outcome:null,bonus:false,failed:null,finalEnding:null,recent:Array.isArray(recent)?recent.filter(id=>map.has(id)).slice(-24):[],actions:[],rest:null};
 if(version>=5)state.stats={...state.stats,...life.healthDefaults};
 if(version>=4){state.openingBuff=rollOpeningBuff(state.seed,state.stats);if(state.openingBuff)state.stats=apply(state.stats,{[state.openingBuff.key]:state.openingBuff.amount});}
 state.eventId=pick(state);return state;
}
function create(seed,selected,name,recent=[]){return createForVersion(5,seed,selected,name,recent);}
function getScene(state){
 if(state.phase==='ending'||state.phase==='dayEnd')return null;
 if(fullLife(state)&&life.meals.some(m=>m.id===state.eventId))return life.mealScene(state,life.eventTime(state));
 const original=eventMap.get(state.eventId);if(!original||(!fullLife(state)&&original.slot!==state.step))throw Error('事件存档不匹配');let scene;
 if(original.id.startsWith('base-')){
  const todayFlags=dayFlags(state);scene={...L.getScene({...state,step:fullLife(state)?original.slot:state.step,flags:todayFlags}),id:original.id};
  if(original.id==='base-0'&&state.day>1)scene.text='闹钟又响了。第'+state.day+'天，你依然是一只奶娃，早八也依然没有打算放过你。\n室友已经推开了门，床正在对你进行最后一次挽留。';
  if(original.id==='base-6'&&todayFlags.helped)scene.callback='今天你帮过室友。现在他主动来搭把手，所有选项额外电量 +5。';
 }else scene={...original,time:stages[state.step].time,callback:original.when?'前情后续 · 这件事和你此前的经历或当前状态有关。':'',choices:original.choices.map(x=>({...x,mods:{...x.mods},flags:{...x.flags}}))};
 scene.kind=original.rare?'少见奇遇':original.when?'条件事件':'随机日常';
 if(!original.id.startsWith('base-')&&state.traits.includes('ddl')&&state.step===3){scene.callback+=(scene.callback?'\n':'')+'天赋触发 · DDL觉醒体：完成学业的选项额外学业 +8。';scene.choices.forEach(x=>{if(x.mods.study>0)x.mods.study+=8;});}
 if(state.stats.money<10)scene.callback+=(scene.callback?'\n':'')+'钱包有点薄，超出余额的消费选项暂时不能选；仍可通过求助或小任务补救。';
 if(fullLife(state))scene.time=life.eventTime(state);
 return scene;
}
function failure(stats){return stats.energy<=0?'fail-energy':stats.study<=0?'fail-study':stats.health<=0?'fail-health':null;}
function choose(state,index){
 if(state.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('当前不能选择');
 const scene=getScene(state);if(index>=scene.choices.length)throw Error('当前不能选择');
 const option=scene.choices[index];if((option.mods.money||0)<-state.stats.money)throw Error('饭钱不足');
 let mods={...option.mods},result=option.result;const flags={...state.flags};for(const[k,v]of Object.entries(option.flags||{}))flags[k]=(flags[k]||0)+v;
 if(fullLife(state)&&scene.kind!=='三餐'){if((mods.social||0)>0||(mods.energy||0)>0)mods.mood=(mods.mood||0)+2;else if((mods.energy||0)<=-15)mods.mood=(mods.mood||0)-2;}
 let bonus=state.bonus;if(state.traits.includes('luck')&&state.step===2){mods.money=(mods.money||0)+8;result+='\n🍀 锦鲤天赋触发：饭卡活动返还了8元。';bonus=true;}
 if(option.roll){const chance=Math.min(.95,option.roll.rate+(state.traits.includes('luck')?.15:0));const won=rng(hash(state.seed+':roll:'+state.day+':'+scene.id+':'+index))()<chance;const branch=won?option.roll.win:option.roll.lose;for(const[k,v]of Object.entries(branch.mods||{}))mods[k]=(mods[k]||0)+v;result+='\n'+branch.text;}
 const stats=apply(state.stats,mods),actual={};for(const k of keys){if(stats[k]!==state.stats[k])actual[k]=stats[k]-state.stats[k];}
 const entry={day:state.day,step:state.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:option.text,result,changes:actual,flags:{...option.flags}};
 return{...state,stats,flags,bonus,phase:'outcome',outcome:entry,log:[...state.log,entry],failed:failure(stats),actions:[...state.actions,'c'+index]};
}
function next(state){
 if(state.phase!=='outcome')throw Error('请先做出选择');
 const n={...state,outcome:null,actions:[...state.actions,'n']};
 if(state.failed){n.phase='ending';n.finalEnding=state.failed;}else if(state.step===7)n.phase='dayEnd';else{n.phase='choice';n.step++;n.eventId=pick(n);}return n;
}
// Preserve V2's exact retirement title as part of deterministic save replay.
function legacyClassify(s){const f=dayFlags(s),v=s.stats;if(s.day===7)return'week';if(s.flags.cat>=2&&f.cat>0)return'cat';if(s.flags.viral>=2&&f.viral>0)return'viral';if(s.flags.art>=3&&f.art>0)return'artist';if(f.chaos>=4)return'chaos';if(v.money<=3)return'poor';if(v.energy<=10)return'tired';if(f.skip>=2)return'skip';if(f.rescue>=2)return'hero';if(v.social>=90&&f.helped>0)return'popular';if(v.study>=92)return'scholar';if(v.money>=70)return'rich';if((s.traits.includes('luck')&&s.bonus&&v.energy>=35&&v.study>=45)||f.lucky>=1)return'lucky';if(v.energy>=85&&v.study<60)return'battery';if(v.energy>=55&&v.social>=65&&v.study>=65&&v.money>=15)return'balanced';if(v.social>=90)return'popular';return'ordinary';}
function matchedTitles(s){
 const f=dayFlags(s),v=s.stats,ids=[];
 for(const[id,flag,threshold]of themeRules)if(s.flags[flag]>=threshold&&f[flag]>0)ids.push(id);
 if(s.flags.cat>=2&&f.cat>0)ids.push('cat');if(s.flags.viral>=2&&f.viral>0)ids.push('viral');if(s.flags.art>=3&&f.art>0)ids.push('artist');
 if(f.chaos>=4)ids.push('chaos');if(v.money<=3)ids.push('poor');if(v.energy<=10)ids.push('tired');if(f.skip>=2)ids.push('skip');if(f.rescue>=2)ids.push('hero');if(v.social>=90)ids.push('popular');if(v.study>=92)ids.push('scholar');if(v.money>=70)ids.push('rich');
 if((s.traits.includes('luck')&&s.bonus&&v.energy>=35&&v.study>=45)||f.lucky>=1)ids.push('lucky');if(v.energy>=85&&v.study<60)ids.push('battery');if(v.energy>=55&&v.social>=65&&v.study>=65&&v.money>=15)ids.push('balanced');
 return ids.length?ids:['ordinary'];
}
// This stored V3 title remains frozen for save replay; eligibility is assessed below.
function classify(s){return milestones.find(m=>m.days===s.day)?.id||matchedTitles(s)[0];}
const milestoneCache=new WeakMap();
function milestoneRecord(s){
 if(milestoneCache.has(s))return milestoneCache.get(s);
 const earned=new Map();let stats=initialStats(s.traits),day=1;
 if(s.version>=5)stats={...stats,...life.healthDefaults};
 if(s.version>=4&&s.openingBuff)stats=apply(stats,{[s.openingBuff.key]:s.openingBuff.amount});
 // Reconstruct each completed day's actual score, including overnight costs.
 // This preserves awards after later failures without adding fields to old saves.
 for(let index=0;index<s.log.length;index++){
  const entry=s.log[index];
  if(s.lifeUpdate&&index===s.lifeStartLog){while(day<s.lifeStartDay){stats=apply(stats,restMods(stats,day));day++;}stats={...stats,...life.healthDefaults};}
  while(day<entry.day){stats=apply(stats,restMods(stats,day));day++;}
  for(const k of statKeys(stats))stats[k]+=entry.changes[k]||0;
  if(entry.step===7&&stats.energy>0&&stats.study>0){
   for(const m of milestones)if(!earned.has(m.id)&&entry.day>=m.days&&stats.study>=(m.study||0))earned.set(m.id,entry.day);
  }
 }
 milestoneCache.set(s,earned);return earned;
}
function ending(state){
 if(state.failed)return endingMap.get(state.failed);
 const earned=milestoneRecord(state),current=[...milestones].reverse().find(m=>earned.get(m.id)===state.day);
 const stored=state.finalEnding&&!milestones.some(m=>m.id===state.finalEnding)?state.finalEnding:null;
 const id=current?.id||stored||(state.version===2?legacyClassify(state):matchedTitles(state)[0]);
 return endingMap.get(id)||endingMap.get('ordinary');
}
function completedDays(s){return s.phase==='dayEnd'||(s.phase==='ending'&&!s.failed)?s.day:Math.max(0,s.day-1);}
function achievements(s){
 if(s.phase!=='dayEnd'&&s.phase!=='ending')return[];
 const ids=new Set([ending(s).id]);
 for(const id of milestoneRecord(s).keys())ids.add(id);
 if(!s.failed)for(const id of matchedTitles(s))ids.add(id);
 for(const id of challenges.unlocked(s,completedDays(s)))ids.add(id);
 return [...ids].map(id=>endingMap.get(id));
}
function degreeStatus(s){return{days:completedDays(s),study:s.stats.study,requiredDays:14,requiredStudy:80,awarded:milestoneRecord(s).has('degree')};}
function restMods(stats,day){return{energy:Number.isFinite(stats.mood)?stats.mood>=75?16:stats.mood<25?8:12:12,money:-4,study:-Math.min(30,8+day*2),...(Number.isFinite(stats.health)?{health:2,mood:4}:{})};}
function restPreview(state){const pressure=Math.min(30,8+state.day*2),stats=apply(state.stats,restMods(state.stats,state.day));return{stats,pressure,changes:Object.fromEntries(statKeys(state.stats).filter(k=>stats[k]!==state.stats[k]).map(k=>[k,stats[k]-state.stats[k]])),failed:failure(stats)};}
function continueDay(state){
 if(state.phase!=='dayEnd')throw Error('请先过完今天');
 const rest=restPreview(state),n={...state,stats:rest.stats,day:state.day+1,step:0,phase:rest.failed?'ending':'choice',eventId:null,outcome:null,failed:rest.failed,finalEnding:rest.failed,rest,actions:[...state.actions,'d']};if(!rest.failed)n.eventId=pick(n);return n;
}
function enableEconomy(state){
 if(economyEnabled(state))return state;
 if(state.phase!=='dayEnd')throw Error('请在当日结算后更新生活机会');
 return{...state,actions:[...state.actions,'e'],economyBoost:true};
}
function enableLife(state){
 if(fullLife(state)||state.phase==='ending')return state;
 const n={...state,stats:{...state.stats,...life.healthDefaults},actions:[...state.actions,'l'],lifeUpdate:true,lifeStartLog:state.log.length,lifeStartDay:state.day};
 if(n.phase==='choice')n.eventId=pick(n);return n;
}
function retire(state){if(state.phase!=='dayEnd')throw Error('今天还没结束');return{...state,phase:'ending',finalEnding:state.version===2?legacyClassify(state):classify(state),actions:[...state.actions,'r']};}
function restore(raw){
 try{
  if(!raw||![2,3,4,5].includes(raw.version)||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>10000)return null;
  let s=createForVersion(raw.version,raw.seed,raw.traits,raw.name,raw.recent);
  for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=retire(s);else if(a==='e')s=enableEconomy(s);else if(a==='l')s=enableLife(s);else return null;}
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
function valid(raw){return restore(raw)!==null;}
const api={keys,labels,traits,endings,stages,events,openingBuffs,eventCount:events.length,rng,newDraft,apply,statKeys,create,getScene,choose,next,ending,achievements,completedDays,degreeStatus,continueDay,enableEconomy,enableLife,retire,restPreview,restore,valid};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
