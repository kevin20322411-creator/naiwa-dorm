(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./meetings.js'),L=browser?root.DormLife:require('./life.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function hash(x){let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const rand=(s,salt)=>B.rng(hash(s.seed+':wellness-1:'+s.day+':'+salt))();
const minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const failed=v=>v.energy<=0?'fail-energy':v.study<=0?'fail-study':v.health<=0?'fail-health':null;
const actual=(a,b)=>Object.fromEntries(B.keys.filter(k=>a[k]!==b[k]).map(k=>[k,b[k]-a[k]]));
const colds=[
 {id:'well-cold-room',title:'室友感冒后，奶娃也开始打喷嚏。',text:'早上的鼻音有点重，桌边还放着刚用过的纸巾。今天要不要先为身体腾出一点安排？'},
 {id:'well-cold-rain',title:'淋雨回来，奶娃有些发冷。',text:'进了教学楼，奶娃还是提不起精神，还接连打了几个喷嚏。手里的事不少，身体也需要处理。'},
 {id:'well-cold-season',title:'换季这天，奶娃的嗓子有点不舒服。',text:'奶娃说话带了些鼻音，热水也没让不适立刻消失。今天的节奏，可能要重新排一下。'}
];
const mice=[
 {id:'well-mouse-study',place:'自习室',title:'自习到一半，奶鼠轻轻凑了过来。',text:'奶鼠看了看你的笔记，又指了指旁边的空位。他没有急着打扰，等你抬头才挥了挥手。',a:'和奶鼠小声聊两句，再继续看书',b:'合上书，陪奶鼠玩一小会儿再回来'},
 {id:'well-mouse-canteen',place:'食堂',title:'奶鼠端着餐盘，问能不能坐旁边。',text:'他刚发现一个不错的食堂窗口，正想找人分享。你挪了挪桌上的东西，也有点想听听。',a:'边吃边聊今天的小事',b:'和奶鼠玩一轮食堂口味猜谜'},
 {id:'well-mouse-sport',place:'操场边',title:'操场边，奶鼠朝你招了招手。',text:'奶鼠刚跑完一圈，正慢慢往回走。他说今天的晚风不错，问你要不要一起走一小段。',a:'沿操场走一小段，轻松聊聊天',b:'和奶鼠玩一个不计输赢的小游戏'},
 {id:'well-mouse-hobby',place:'活动室',title:'奶鼠抱着一个没完成的小作品来了。',text:'他想听听你的想法，也很乐意看看你手边在做的东西。这次见面，没有打分，也没有截止日期。',a:'互相看看作品，说说有趣的细节',b:'陪奶鼠一起试一个小点子'},
 {id:'well-mouse-corridor',place:'教学楼走廊',title:'课间出门，正好碰见奶鼠。',text:'奶鼠今天遇到了一件小小的趣事，讲到一半自己先笑了。你本来绷着的那根弦，也松开了一点。',a:'听奶鼠讲完，也分享一件小事',b:'留一小段时间，和奶鼠多聊一会儿'},
 {id:'well-mouse-dorm',place:'回寝的小路',title:'回寝路上，奶鼠刚好和你同路。',text:'奶鼠没有问今天完成了多少任务，只说走到路灯那边就好。你也可以短暂地不赶进度。',a:'和奶鼠慢慢走一小段',b:'找张长椅，和奶鼠听一首歌'}
];
function enableWellness(s){return s.version!==6||s.wellness||s.phase==='ending'?s:{...s,wellness:{lastColdDay:0,lastColdId:null,nextMouseDay:s.day+3+Math.floor(rand(s,'first-mouse')*2),lastMouseId:null,mouse:null},actions:[...s.actions,'w']};}
function create(...args){return enableWellness(B.create(...args));}
function recovery(value,key,current){if(value<=0)return value;return current>=(key==='health'?85:80)?Math.floor(value*(key==='health'?.3:.2)):Math.max(1,Math.floor(value*(key==='health'?.6:.55)));}
function strain(s,scene,c){
 if(scene.kind==='三餐'||scene.kind==='就诊安排'||c.activity==='rest'||c.flags?.rest||c.flags?.sleep||c.flags?.nap)return 0;
 const t=minute(scene.time),late=/熬夜|通宵/.test(c.text);
 return late?(/通宵/.test(c.text)?10:4):t>=1350&&((c.mods.study||0)>0||(c.project||0)>0||/刷到|再打一局|再刷一会/.test(c.text))?(t>=1380?4:2):0;
}
function offerCold(s){
 if(!s.wellness||s.phase!=='choice'||![1,3,4,6].includes(s.step)||s.rhythm?.pending||s.illness?.active||s.eventId.startsWith('term-')||s.eventId.startsWith('love-')||(s.step===1&&s.stats.money<10))return s;
 if(s.wellness.lastColdDay&&s.day-s.wellness.lastColdDay<4)return s;if(s.illness?.since&&s.day-s.illness.since<3)return s;
 const slots=s.rhythm.slots.filter(k=>[1,3,4,6].includes(k)),target=slots[Math.floor(rand(s,'cold-slot')*slots.length)];if(s.step!==target||rand(s,'cold-day')>=.22)return s;
 const pool=colds.filter(c=>c.id!==s.wellness.lastColdId),c=pool[Math.floor(rand(s,'cold-kind')*pool.length)];
 return{...s,eventId:c.id,wellness:{...s.wellness,lastColdDay:s.day,lastColdId:c.id},illness:{...s.illness,active:true,kind:'cold',level:1,days:0,since:s.day,appointment:null}};
}
function mouseContext(s){
 const o=s.outcome,flags=o.flags||{};if(flags.library||/study|library|reading/.test(o.eventId))return mice[0];if(o.eventId.startsWith('meal-'))return mice[1];if(flags.sport)return mice[2];if(flags.art||flags.maker)return mice[3];return s.step>=4?mice[5]:mice[4];
}
function openMouse(s){
 if(!s.wellness||s.phase!=='outcome'||s.failed||s.wellness.mouse||s.day<s.wellness.nextMouseDay||B.freeMinutes(s)<10)return null;
 const slots=s.rhythm.slots.filter(k=>k>0&&k<7),target=slots[Math.floor(rand(s,'mouse-slot')*slots.length)],study=s.outcome.flags?.library||/study|library|reading/.test(s.outcome.eventId);
 if(s.day===s.wellness.nextMouseDay&&s.step<target&&!study)return null;
 let m=mouseContext(s);if(m.id===s.wellness.lastMouseId&&!study){const pool=mice.filter(x=>x.id!==m.id);m=pool[Math.floor(rand(s,'mouse-variety')*pool.length)];}
 return{...s,eventId:m.id,phase:'choice',outcome:null,actions:[...s.actions,'n'],wellness:{...s.wellness,nextMouseDay:s.day+4+Math.floor(rand(s,'next-mouse')*2),lastMouseId:m.id,mouse:{id:m.id,at:s.rhythm.clock}}};
}
function getScene(s){
 if(!s.wellness)return B.getScene(s);if(['dayEnd','ending'].includes(s.phase))return null;
 const cold=colds.find(c=>c.id===s.eventId);if(cold)return{...cold,time:L.eventTime(s),place:'校园 · 身体状况',kind:'感冒插曲',emoji:'🤧',bubble:'身体也有自己的进度。',choices:[
  {text:'调整安排，先去校医处处理',mods:{money:-12,energy:-6,health:2,mood:1},flags:{care:1},cure:true,project:0,result:'校医处理了奶娃的感冒，今天的安排也留出了恢复的余地。'},
  {text:'先休息一阵，之后再安排就诊',mods:{energy:6,mood:1},flags:{rest:1},project:0,result:'休息让精力缓过来一些，感冒还需要处理。空闲时可去校医院，日终也能预约。'},
  {text:'先硬撑着赶今天的进度',mods:{energy:-10,health:-5,mood:-4,study:8},flags:{},project:6,result:'进度往前走了一点，身体却更累了。奶娃还需要安排就诊。'}]};
 const m=mice.find(m=>m.id===s.eventId);if(m&&s.wellness.mouse)return{...m,time:clock(s.wellness.mouse.at),kind:'奶鼠偶遇',emoji:'🐭',bubble:'偶尔，也可以不用赶进度。',mouseScene:true,choices:[
  {text:m.a,mods:{energy:-2,mood:6},minutes:5,flags:{},project:0,result:'奶鼠认真接住了你的话。只是几分钟，心情却轻松了一点。'},
  {text:m.b,mods:{energy:-5,study:-2,mood:9},minutes:10,flags:{},project:0,result:'你把任务暂时放下，和奶鼠笑了一会儿。回去继续时，心里没有刚才那么紧。'},
  {text:'笑着说还有安排，下次再聊',mods:{mood:1},minutes:0,flags:{},project:0,result:'奶鼠没有催你，挥挥手说下次见。这声招呼也让今天柔和了一点。'}]};
 const scene=clone(B.getScene(s));if(!scene||scene.kind==='就诊安排')return scene;
 for(const c of scene.choices){for(const k of ['health','mood'])if((c.mods[k]||0)>0)c.mods[k]=recovery(c.mods[k],k,s.stats[k]);const cost=strain(s,scene,c);if(cost){c.mods.health=Math.min(c.mods.health||0,-cost);c.mods.mood=Math.min(c.mods.mood||0,-(cost>=10?3:1));}}
 return scene;
}
function choose(s,index){
 if(!s.wellness)return B.choose(s,index);
 const custom=colds.some(c=>c.id===s.eventId)||mice.some(m=>m.id===s.eventId);
 if(custom){
  if(s.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('当前不能选择');const scene=getScene(s),c=scene.choices[index];if(!c)throw Error('没有这个选择');if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
  const stats=B.apply(s.stats,c.mods),flags={...s.flags};for(const[k,v]of Object.entries(c.flags))flags[k]=(flags[k]||0)+v;
  const illness=c.cure?{...s.illness,active:false,level:0,days:0,streak:0,appointment:null}:s.illness,mouse=!!scene.mouseScene;
  const entry={day:s.day,step:s.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result:c.result,changes:actual(s.stats,stats),flags:{...c.flags},project:c.project||0,...(mouse?{origin:'mouse',minutes:c.minutes}: {})};
  const rhythm={...s.rhythm,clock:minute(scene.time)+(mouse?c.minutes:10),lastActivity:null,...(mouse?{spent:s.rhythm.spent+c.minutes}:{})};
  return{...s,stats,flags,illness,failed:failed(stats),term:{...s.term,progress:s.term.progress+entry.project},phase:'outcome',outcome:entry,log:[...s.log,entry],actions:[...s.actions,'c'+index],rhythm};
 }
 const scene=B.getScene(s),n=B.choose(s,index);if(scene.kind==='就诊安排')return n;
 const stats={...n.stats};for(const k of ['health','mood']){const gain=n.stats[k]-s.stats[k];if(gain>0)stats[k]=s.stats[k]+recovery(gain,k,s.stats[k]);}
 const cost=strain(s,scene,scene.choices[index]);if(cost){stats.health=Math.max(0,Math.min(stats.health,s.stats.health-cost));stats.mood=Math.max(0,Math.min(stats.mood,s.stats.mood-(cost>=10?3:1)));}
 const illness=!s.illness?.active&&n.illness?.active?{...n.illness,kind:'stomach'}:n.illness;
 const entry={...n.outcome,changes:actual(s.stats,stats),result:n.outcome.result+(cost&&stats.health<n.stats.health?'\n夜已经深了，继续加码也让身体和心情更疲惫。':'')};
 return{...n,stats,illness,failed:failed(stats),outcome:entry,log:[...n.log.slice(0,-1),entry]};
}
function next(s){if(s.wellness){const mouse=openMouse(s);if(mouse)return mouse;}const n=B.next(s);return offerCold(s.wellness?.mouse?{...n,wellness:{...n.wellness,mouse:null}}:n);}
function continueDay(s){return offerCold(B.continueDay(s));}
function restore(raw){
 if(!raw?.wellness)return B.restore(raw);
 try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);
  for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='h')s=B.enableCare(s);else if(a==='b')s=B.enableBalance(s);else if(a==='v')s=B.enableRomance(s);else if(a==='p')s=B.enableStory(s);else if(a==='y')s=B.enableRhythm(s);else if(a==='f')s=B.enableFood(s);else if(a==='i')s=B.enableIllness(s);else if(a==='q')s=B.enableMeetings(s);else if(a==='w')s=enableWellness(s);else if(a==='e')s=B.enableEconomy(s);else if(a==='l')s=B.enableLife(s);else if(typeof a==='string'&&a.startsWith('a:'))s=B.startActivity(s,a.slice(2));else return null;}
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
const events=[...B.events,...colds,...mice],api={...B,create,enableWellness,getScene,choose,next,continueDay,restore,valid:s=>restore(s)!==null,events,eventCount:events.length};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
