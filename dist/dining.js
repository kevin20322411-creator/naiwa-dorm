(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./character.js'),L=browser?root.DormLife:require('./life.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function hash(x){let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const roll=(s,key)=>B.rng(hash(s.seed+':dining-1:'+s.day+':'+s.step+':'+key))();
const delta=(a,b)=>Object.fromEntries(B.keys.filter(k=>Number.isFinite(a[k])&&a[k]!==b[k]).map(k=>[k,b[k]-a[k]]));
const failure=s=>s.stats.health<=0?'fail-health':s.stats.mood<=0?'fail-mood':s.stats.energy<=0?'fail-energy':s.stats.study<=0?'fail-study':s.term?.missed>=2?'fail-course':null;
// These are fictional recovery rewards, not nutritional or medical estimates.
const dish=(name,price,energy,health,mood,result,extra={})=>({name,price,energy,health,mood,result,...extra});
const menu={
 breakfast:[
  dish('鸡蛋蔬菜三明治',7,12,2,3,'面包夹着鸡蛋和蔬菜，奶蛙坐下来吃完再出门。'),
  dish('现蒸肠粉',9,14,2,4,'肠粉刚刚出锅，奶蛙终于从起床气里缓过来了。'),
  dish('紫米饭团配豆浆',8,13,2,3,'豆浆温热，饭团扎实，这个早晨有了着落。'),
  dish('小笼包配鲜肉馄饨',18,19,4,7,'一笼小包子配一碗热汤，奶蛙慢慢吃完了早餐。'),
  dish('港式早茶拼盘',28,23,6,10,'虾饺、烧卖和粥摆满小桌，这个早晨值得慢一点。',{feast:true}),
  dish('牛油果鸡蛋早午餐',32,25,7,11,'蔬菜、鸡蛋和主食都备齐，奶蛙给自己放了一个丰盛的早晨。',{feast:true})
 ],
 lunch:[
  dish('鸡丝凉面',7,13,2,3,'拌好一碗鸡丝凉面，午后的安排也没那么急了。'),
  dish('大盘鸡拼饭',16,19,3,6,'鸡肉和土豆拌进米饭，这一顿吃得很踏实。'),
  dish('韩式石锅拌饭',22,21,4,7,'锅边还冒着热气，奶蛙把配菜和米饭认真拌匀。'),
  dish('椰子鸡双人拼单',58,27,9,15,'和同学各付各的钱，喝一碗热汤，再慢慢吃鸡肉和蔬菜。',{feast:true}),
  dish('鲜切牛肉蔬菜火锅',70,32,12,22,'肉、蔬菜和主食下进锅里。奶蛙吃饱喝暖，和同桌聊得很开心，整个人都松快了。',{feast:true}),
  dish('烤肉自助',88,34,5,25,'烤盘滋滋响，喜欢的菜一盘盘端来。今天的烦心事暂时留在了店门外。',{feast:true})
 ],
 dinner:[
  dish('紫菜鱼丸汤面',8,14,2,3,'汤面端上桌，奶蛙先好好吃完这一碗，再想晚上的事。'),
  dish('菌菇鸡肉煲仔饭',18,20,4,6,'打开锅盖，米饭和菌菇的香气一起冒出来。'),
  dish('番茄肥牛乌冬',24,22,4,8,'番茄汤热乎乎的，奶蛙把最后一口乌冬也吃完了。'),
  dish('寿喜锅套餐',42,26,7,14,'牛肉、豆腐和蔬菜慢慢煮熟，奶蛙把这一顿当作今天的小奖励。',{feast:true}),
  dish('菌汤牛肉火锅',70,32,12,22,'锅底咕嘟响，肉和蔬菜一份份煮好。奶蛙吃得满足，也给自己留足了喘口气的时间。',{feast:true}),
  dish('海鲜蒸锅套餐',78,30,11,19,'鱼虾和蔬菜热气腾腾，奶蛙认真吃完了这顿丰盛晚餐。',{feast:true})
 ]};
function enableDining(s){return s.version!==6||s.dining||s.phase==='ending'?s:{...s,dining:{revision:1},actions:[...s.actions,'g']};}
const create=(...args)=>enableDining(B.create(...args));
function recovery(amount,current){if(amount<=0)return amount;if(current>=80)return Math.floor(amount*.25);if(current>=65)return Math.max(1,Math.round(amount*.5));return amount;}
const medical=(scene,c)=>scene.kind==='就诊安排'||c.cure||c.treatment||c.flags?.care||['evo-psych','evo-vaccine'].includes(scene.id);
function option(d,meal,s){const first=!s.log.some(e=>e.day===s.day&&e.flags?.meal&&!e.riskFood&&!e.flags.missedMeal);return{text:d.name+' · ¥'+d.price,mods:{money:-d.price,energy:d.energy,health:d.health,mood:d.mood,...(first?{charm:1}:{})},result:d.result,flags:{meal:1,[meal.key]:1},project:0,feast:!!d.feast};}
function getScene(s){const base=B.getScene(s);if(!s.dining||!base)return base;const scene=clone(base),meal=L.meals.find(m=>m.id===s.eventId);
 if(meal&&scene.kind==='三餐'){
  const dishes=menu[meal.key],previous=s.log.filter(e=>e.day<s.day&&e.eventId===meal.id).at(-1)?.choice;
  if(roll(s,'everyday')<.55){const d=dishes[Math.floor(roll(s,'everyday-kind')*3)],index=d.price<=(meal.key==='breakfast'?3:6)?1:2;scene.choices[index]=option(d,meal,s);}
  if(roll(s,'treat')<.75){const pool=dishes.slice(3).filter(d=>!previous?.startsWith(d.name+' ·')),d=pool[Math.floor(roll(s,'treat-kind')*pool.length)];scene.choices[3]=option(d,meal,s);}
 }
 for(const c of scene.choices){if(!c.feast&&!medical(scene,c))for(const k of ['health','mood'])if((c.mods[k]||0)>0)c.mods[k]=recovery(c.mods[k],s.stats[k]);}
 return scene;
}
function mealChoice(s,scene,index){const c=scene.choices[index];if(!c||s.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('当前不能选择');if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
 const mods={...c.mods},flags={...s.flags};let result=c.result,bonus=s.bonus;for(const[k,v]of Object.entries(c.flags||{}))flags[k]=(flags[k]||0)+v;
 if(B.selectedTraits(s).includes('luck')&&s.step===2){mods.money=(mods.money||0)+8;bonus=true;result+='\n🍀 锦鲤天赋触发：饭卡活动返还了8元。';}
 let stats=B.apply(s.stats,mods),illness=clone(s.illness);
 if(c.riskFood){const rate=Math.min(.6,(illness.active?.25:.1)+Math.min(4,illness.streak)*.08+(s.stats.health<35?.06:0));illness.streak++;
  const symptom=B.rng(hash(s.seed+':illness-1:'+s.day+':'+s.step+':symptom:'+index))();
  if(!failure({...s,stats})&&symptom<rate){stats=B.apply(stats,{health:illness.active?-4:-5,mood:illness.active?-8:-14});if(illness.active){illness.level=Math.min(3,illness.level+1);result+='\n身体不适加重了。奶蛙需要尽快去校医院处理。';}else{Object.assign(illness,{active:true,kind:'stomach',level:1,days:0,since:s.day});result+='\n奶蛙的肚子开始不舒服，心情也低落下来。空闲时可以去校医院，今日结算也能预约明早就诊。';}}
 }else if(c.flags.meal)illness.streak=0;
 const entry={day:s.day,step:s.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result,changes:delta(s.stats,stats),flags:{...c.flags},project:0,riskFood:!!c.riskFood,...(c.feast?{feast:true}:{})};
 return{...s,stats,flags,bonus,illness,failed:failure({...s,stats}),phase:'outcome',outcome:entry,log:[...s.log,entry],actions:[...s.actions,'c'+index],rhythm:{...s.rhythm,clock:Number(scene.time.slice(0,2))*60+Number(scene.time.slice(3))+10,lastActivity:null}};
}
function choose(s,index){if(!s.dining)return B.choose(s,index);const scene=getScene(s);if(scene?.kind==='三餐')return mealChoice(s,scene,index);let n=B.choose(s,index);if(n.log.length<=s.log.length||!n.outcome||n.log.at(-1)!==n.outcome||medical(scene,scene.choices[index]))return n;
 const stats={...n.stats};for(const k of ['health','mood']){const gain=stats[k]-s.stats[k];if(gain>0)stats[k]=s.stats[k]+recovery(gain,s.stats[k]);}
 const entry={...n.outcome,changes:delta(s.stats,stats)};return{...n,stats,outcome:entry,log:[...n.log.slice(0,-1),entry]};
}
function restPreview(s){const rest=B.restPreview(s);if(!s.dining||s.illness?.appointment||s.evolution?.psychBooked||s.evolution?.bite?.appointment)return rest;const stats={...rest.stats};for(const k of ['health','mood'])if(stats[k]>s.stats[k])stats[k]=s.stats[k]+recovery(stats[k]-s.stats[k],s.stats[k]);return{...rest,stats,changes:delta(s.stats,stats)};}
function continueDay(s){const n=B.continueDay(s);if(!s.dining)return n;const rest=restPreview(s),stats={...n.stats,health:rest.stats.health,mood:rest.stats.mood},change=delta(n.stats,stats);if(!Object.keys(change).length)return n;return{...n,stats,rest,log:[...n.log,{day:n.day,step:-1,eventId:'dining-recovery',index:0,time:'06:58',title:'新一天，慢慢找回状态。',choice:'日常恢复',result:'状态较好时，日常恢复会放缓，身体和心情仍需要持续照顾。',changes:change,flags:{},project:0}]};}
function restore(raw){if(!raw?.dining)return B.restore(raw);try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);const upgrades={h:'enableCare',b:'enableBalance',v:'enableRomance',p:'enableStory',y:'enableRhythm',f:'enableFood',i:'enableIllness',q:'enableMeetings',w:'enableWellness',u:'enableCampus',t:'enableEvolution',j:'enableLottery',k:'enableCampusRevision',e:'enableEconomy',l:'enableLife'};
 for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=B.next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='m')s=B.enableCharacter(s,raw.character.selected,raw.character.fresh);else if(a==='g')s=enableDining(s);else if(upgrades[a])s=B[upgrades[a]](s);else if(typeof a==='string'&&a.startsWith('a:'))s=B.startActivity(s,a.slice(2));else return null;}return JSON.stringify(s)===JSON.stringify(raw)?s:null;}catch{return null;}}
const api={...B,create,enableDining,getScene,choose,restPreview,continueDay,restore,valid:s=>restore(s)!==null,foodCount:B.foodCount+Object.values(menu).flat().length};root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
