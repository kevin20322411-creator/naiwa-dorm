(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./food.js'),L=browser?root.DormLife:require('./life.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function hash(x){let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const random=(s,salt)=>B.rng(hash(s.seed+':illness-1:'+s.day+':'+s.step+':'+salt))();
const junk=(text,price,energy,health,mood)=>({text:text+' · ¥'+price,mods:{money:-price,energy,health,mood},result:'这顿先吃自己想吃的口味，奶娃把包装收好，再继续今天的安排。',riskFood:true});
// Fictional gameplay risks and values, not a model of real food or disease.
const snacks={
 breakfast:[junk('可乐配辣条',3,5,-3,5),junk('薯片配汽水',7,7,-3,7),junk('奶油蛋糕加冰饮',8,8,-2,9),junk('炸鸡早餐桶',16,13,-3,9)],
 lunch:[junk('大份方便面',5,10,-2,5),junk('双辣条配汽水',6,7,-3,6),junk('薯片汉堡凑一餐',12,11,-3,8),junk('炸物零食大礼包',26,14,-4,10)],
 dinner:[junk('方便面加火腿',6,11,-2,5),junk('冰奶茶配薯片',10,7,-3,8),junk('加辣炸串盒',12,12,-4,9),junk('深夜炸鸡配可乐',28,14,-4,10)]
};
const risky=/^(巧克力甜甜圈|炸鸡小食盒|麻辣香锅小锅|烤串小拼盘) ·/;
function enableIllness(s){return s.version!==6||s.illness||s.phase==='ending'?s:{...s,illness:{active:false,level:0,days:0,streak:0,appointment:null,since:0,startDay:s.day,startStep:s.step,keepCurrent:s.log.length>0},medical:null,actions:[...s.actions,'i']};}
function create(...args){return enableIllness(B.create(...args));}
function fresh(s){const i=s.illness;return !!i&&(!i.keepCurrent||s.day!==i.startDay||s.step!==i.startStep);}
const failure=v=>v.energy<=0?'fail-energy':v.study<=0?'fail-study':v.health<=0?'fail-health':null;
const changes=(before,after)=>Object.fromEntries(B.keys.filter(k=>before[k]!==after[k]).map(k=>[k,after[k]-before[k]]));
const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const treatments=[
 {id:'clinic',text:'到校医门诊就诊',price:12,minutes:30,health:10,mood:4,result:'校医处理了奶娃的不适，也交代了后续休息安排。这次生病已经缓解。'},
 {id:'aid',text:'申请临时医疗补助并就诊',price:0,minutes:15,health:6,mood:2,result:'医务室协助申请了临时补助，奶娃完成了这次处理，不必因为饭钱不足一直硬撑。'},
 {id:'roommate',text:'请室友陪同联系校医',price:6,minutes:20,health:8,mood:6,social:-8,result:'室友陪着完成了就诊，奶娃把这份照顾记在心里，身体也缓过来一些。'}
];
function canCare(s){return !!s.illness?.active&&!s.illness.appointment&&!s.failed;}
function careChoices(s,mode){
 const free=mode==='book'?Infinity:B.freeMinutes({...s,phase:'outcome',outcome:s.medical?.previous.outcome||s.outcome});
 return treatments.map(t=>{
  const c={text:(mode==='book'?'预约明早：':'')+t.text,mods:{money:-t.price,...(mode==='book'?{}:{health:t.health,mood:t.mood}),...(t.social?{social:t.social}:{})},minutes:mode==='book'?0:t.minutes,flags:{},treatment:t.id,result:t.result};
  if(t.id==='aid'&&s.stats.money>=12)c.disabledReason='饭钱不足12元时可申请';
  else if(t.social&&s.stats.social<8)c.disabledReason='暂时没有足够的人情请室友陪同';
  else if(c.minutes>free)c.disabledReason='这段空闲只剩 '+Math.max(0,free)+' 分钟';
  return c;
 });
}
function availableActivities(s){const list=B.availableActivities(s);if(canCare(s)&&s.phase==='outcome'&&careChoices(s,'visit').some(c=>!c.disabledReason&&(c.mods.money||0)>=-s.stats.money))list.unshift({id:'clinic',label:'去校医院',partner:false});return list;}
function startActivity(s,key){
 if(key!=='clinic')return B.startActivity(s,key);
 if(!canCare(s)||!['outcome','dayEnd'].includes(s.phase))throw Error('现在不能安排就诊');
 const mode=s.phase==='dayEnd'?'book':'visit';if(mode==='visit'&&!availableActivities(s).some(a=>a.id==='clinic'))throw Error('这段空闲暂时来不及就诊，可以在今日结算预约明早');
 const medical={mode,done:false,at:s.rhythm?.clock||minutes(L.eventTime(s)),previous:{phase:s.phase,eventId:s.eventId,outcome:s.outcome}};
 return{...s,eventId:'clinic-visit',phase:'choice',outcome:null,medical,actions:[...s.actions,'a:clinic']};
}
function getScene(s){
 if(!s.illness)return B.getScene(s);if(['ending','dayEnd'].includes(s.phase))return null;
 if(s.eventId==='clinic-visit'&&s.medical){const m=s.medical;return{id:'clinic-visit',kind:'就诊安排',time:clock(Math.min(1439,m.at)),place:'校医院',title:m.mode==='book'?'明早，先把身体照顾好。':'奶娃决定去校医院。',text:m.mode==='book'?'先预约好明早的处理方式。现在只支付费用，次日就诊后缓解，不再承受拖延就诊的额外损耗。':'休息能补充体力，生病还需要处理。可以按自己的饭钱和空闲时间选择。',emoji:'🏥',bubble:'不舒服，就认真照顾自己。',choices:[...careChoices(s,m.mode),{text:m.mode==='book'?'暂不预约':'先返回原来的安排',mods:{},minutes:0,flags:{},cancel:true,result:''}]};}
 const scene=B.getScene(s),meal=L.meals.find(m=>m.id===s.eventId);if(!meal||!fresh(s))return scene;
 const result=clone(scene);for(const c of result.choices)if(risky.test(c.text))c.riskFood=true;
 if(random(s,'offer')<.45){const previous=s.log.filter(e=>e.day<s.day&&e.eventId===meal.id).at(-1)?.choice,candidates=snacks[meal.key].filter(c=>c.text!==previous),c=clone(candidates[Math.floor(random(s,'snack')*candidates.length)]),price=-c.mods.money,cheap=meal.key==='breakfast'?3:6,daily=meal.key==='breakfast'?8:12,index=price<=cheap?1:price<=daily?2:3;
  c.flags={meal:1,[meal.key]:1};c.project=0;result.choices[index]=c;
 }
 return result;
}
function choose(s,index){
 if(!s.illness)return B.choose(s,index);
 if(s.eventId==='clinic-visit'&&s.medical&&!s.medical.done){
  if(s.phase!=='choice')throw Error('请先查看当前就诊安排');const scene=getScene(s),c=scene.choices[index];if(!c||!Number.isInteger(index)||index<0)throw Error('没有这个选择');if(c.disabledReason)throw Error(c.disabledReason);if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
  const m=s.medical;if(c.cancel)return{...s,...m.previous,medical:null,actions:[...s.actions,'c'+index]};
  const t=treatments.find(t=>t.id===c.treatment),stats=B.apply(s.stats,c.mods),illness={...s.illness};
  if(m.mode==='book')illness.appointment=t.id;else Object.assign(illness,{active:false,level:0,days:0,streak:0,appointment:null});
  const entry={day:s.day,step:-1,eventId:'clinic-visit',index,time:scene.time,title:scene.title,choice:c.text,result:m.mode==='book'?'已经预约明早的就诊，届时处理不适。':t.result,changes:changes(s.stats,stats),flags:{care:1},project:0,minutes:c.minutes};
  const base={...s,stats,illness,log:[...s.log,entry],actions:[...s.actions,'c'+index]};
  if(m.mode==='book')return{...base,...m.previous,medical:null};
  return{...base,phase:'outcome',outcome:entry,medical:{...m,done:true},rhythm:{...s.rhythm,spent:s.rhythm.spent+c.minutes,clock:m.at+c.minutes,lastActivity:null}};
 }
 if(!fresh(s)||!L.meals.some(m=>m.id===s.eventId))return B.choose(s,index);
 const scene=getScene(s),c=scene.choices[index];if(!c||s.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('当前不能选择');if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
 const mods={...c.mods},flags={...s.flags};let result=c.result,bonus=s.bonus;
 for(const[k,v]of Object.entries(c.flags))flags[k]=(flags[k]||0)+v;
 if(s.traits.includes('luck')&&s.step===2){mods.money=(mods.money||0)+8;bonus=true;result+='\n🍀 锦鲤天赋触发：饭卡活动返还了8元。';}
 let stats=B.apply(s.stats,mods);const illness={...s.illness};
 if(c.riskFood){
  const rate=Math.min(.6,(illness.active?.25:.1)+Math.min(4,illness.streak)*.08+(s.stats.health<35?.06:0));illness.streak++;
  if(!failure(stats)&&random(s,'symptom:'+index)<rate){
   stats=B.apply(stats,{health:illness.active?-4:-5,mood:illness.active?-8:-14});
   if(illness.active){illness.level=Math.min(3,illness.level+1);result+='\n身体不适加重了。奶娃需要尽快去校医院处理。';}
   else{Object.assign(illness,{active:true,level:1,days:0,since:s.day});result+='\n奶娃的肚子开始不舒服，心情也低落下来。空闲时可以去校医院，今日结算也能预约明早就诊。';}
  }
 }else if(c.flags.meal)illness.streak=0;
 const entry={day:s.day,step:s.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result,changes:changes(s.stats,stats),flags:{...c.flags},project:0,riskFood:!!c.riskFood};
 const rhythm=s.rhythm?{...s.rhythm,clock:minutes(scene.time)+10,lastActivity:null}:undefined;
 return{...s,stats,flags,bonus,illness,failed:failure(stats),phase:'outcome',outcome:entry,log:[...s.log,entry],actions:[...s.actions,'c'+index],...(rhythm?{rhythm}:{})};
}
function next(s){const n=B.next(s);return s.medical?{...n,medical:null}:n;}
function restPreview(s){
 const base=B.restPreview(s);if(!s.illness?.active)return base;
 const i=s.illness,t=treatments.find(t=>t.id===i.appointment),extra=t?{health:t.health,mood:t.mood}:{health:-(4+i.level*2+Math.min(3,i.days)),mood:-(6+Math.min(3,i.days))};
 const stats=B.apply(base.stats,extra);return{...base,stats,changes:changes(s.stats,stats),failed:failure(stats)};
}
function continueDay(s){
 const n=B.continueDay(s);if(!s.illness?.active)return n;
 const rest=restPreview(s),illness={...s.illness},treated=treatments.find(t=>t.id===illness.appointment),extra=changes(n.stats,rest.stats);
 if(treated)Object.assign(illness,{active:false,level:0,days:0,streak:0,appointment:null});else{illness.days++;illness.level=Math.min(3,Math.max(illness.level,1+Math.floor(illness.days/2)));}
 const entry={day:n.day,step:-1,eventId:treated?'clinic-followup':'illness-overnight',index:0,time:'06:50',title:treated?'按预约完成了校医就诊。':'不适还在，奶娃醒来更疲惫了。',choice:treated?'按预约就诊':'尚未就诊',result:treated?treated.result:'生病没有自行消失，健康和心情继续下降。',changes:extra,flags:{},project:0};
 return{...n,stats:rest.stats,rest,illness,medical:null,failed:rest.failed,finalEnding:rest.failed,phase:rest.failed?'ending':'choice',eventId:rest.failed?null:n.eventId,log:[...n.log,entry]};
}
function restore(raw){
 if(!raw?.illness)return B.restore(raw);
 try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);
  for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='h')s=B.enableCare(s);else if(a==='b')s=B.enableBalance(s);else if(a==='v')s=B.enableRomance(s);else if(a==='p')s=B.enableStory(s);else if(a==='y')s=B.enableRhythm(s);else if(a==='f')s=B.enableFood(s);else if(a==='i')s=enableIllness(s);else if(a==='e')s=B.enableEconomy(s);else if(a==='l')s=B.enableLife(s);else if(typeof a==='string'&&a.startsWith('a:'))s=startActivity(s,a.slice(2));else return null;}
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
const api={...B,create,enableIllness,getScene,choose,next,continueDay,restPreview,availableActivities,startActivity,restore,valid:s=>restore(s)!==null,foodCount:B.foodCount+12};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
