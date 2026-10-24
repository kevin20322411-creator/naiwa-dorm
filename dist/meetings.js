(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./illness.js');
// Keep earlier encounter rules frozen. q enables the new scenes and rejection
// response at an explicit save boundary; declined contact keeps its seeded result.
const scene=(id,place,title,text,ask,familiar,leave,yes,no,extra={})=>({id,place,title,text,ask,familiar,leave,yes,no,...extra});
const encounters=[
 scene('group','小组作业教室','这次小组作业，和奶粉分到了一组。','分工表传到你手上，奶粉也在看同一份任务。先把合作的第一步说清楚，似乎就能自然认识。','对齐分工，再问能否加联系方式','先一起拆解任务，下次再交换联系方式','在大群确认分工，先按自己的安排走',
 '奶粉也想方便对接任务，同意加上联系方式。你们顺便聊起了各自擅长的部分。','奶粉说这次先在课程群里对接，暂时不另外加好友。你表示理解，心里还是有一点失落。',
 {emoji:'📋',energy:[-8,-9,0],study:[3,5,0],project:[4,6,0]}),
 scene('class-pair','课堂讨论区','课堂临时配对，搭档是奶粉。','老师让两人讨论一道开放题。奶粉先说了一个想法，你发现自己的思路正好能接上。','讨论结束，问能否加好友交流笔记','先把这次讨论完成，多聊两句','记好自己的思路，先回座位',
 '奶粉觉得这次讨论很合拍，愿意加好友交换笔记。','奶粉说平时主要在课堂交流，暂时不交换联系方式。你点点头，也难免有些失落。',
 {emoji:'📝',energy:[-6,-7,0],study:[2,4,0],project:[2,3,0]}),
 scene('badminton','体育课球场','体育课分组，奶粉刚好和你一队。','第一轮配合还有点生疏，第二轮已经会互相提醒。下场休息时，要不要把话题接下去？','聊聊刚才的配合，问能否加好友约球','先聊球拍和打法，下次再问','挥挥手，先按自己的节奏训练',
 '奶粉笑着说下次还可以搭档，拿出手机加了好友。','奶粉说自己的课外时间还没排好，先不加约球好友。你说没关系，还是有一点泄气。',{emoji:'🏸'}),
 scene('volunteer','志愿服务点','你和奶粉排到了同一班志愿岗。','整理完最后一袋物品，你们一起核对清单。合作的这段时间，已经有了几句自然的闲聊。','收工时问能否加好友，下次再搭班','先聊这次活动，等以后熟一点再问','道声辛苦，先去处理自己的安排',
 '奶粉觉得一起做事很轻松，同意加好友留意下次活动。','奶粉说通常只在志愿群里联系，这次先不单独加。你道了别，心里有些空落落的。',{emoji:'🤝'}),
 scene('club','社团活动室','社团试练时，奶粉坐在了旁边。','你们都对新规则有点没把握，一边试一边笑。活动快结束了，话题倒还没有聊完。','聊聊共同的兴趣，问能否加好友','先约下次活动再见，不急着加好友','把器材收好，和大家一起道别',
 '奶粉也想继续聊刚才的话题，很自然地同意加好友。','奶粉说还想先在活动中慢慢认识，不急着加好友。你接受了这个节奏，也有一点失落。',{emoji:'🎲'}),
 scene('library-seat','图书馆自习区','奶粉轻声问，旁边的座位有人吗？','你挪开桌角的书，给奶粉留出位置。休息时，你们聊到了各自正在看的那一本。','休息时问能否加好友交流书单','先聊两本书，下次遇到再问','微笑回应，继续自己的阅读',
 '奶粉提到还有几本想推荐的书，同意加好友把书单发给你。','奶粉说来图书馆主要想安静自习，先不交换好友。你放轻声音说了声好，心情还是低落了一点。',{emoji:'📚'}),
 scene('canteen','食堂拼桌处','食堂满座，奶粉问能否一起拼桌。','你把餐盘往里挪了一点。聊起不同窗口的口味，这顿饭也没那么匆忙了。','聊完食堂推荐，问能否加好友','先聊几句，以后遇到再打招呼','点点头，吃完按自己的安排离开',
 '奶粉也想交换食堂推荐，笑着同意加好友。','奶粉这会儿赶着给同学送饭，说这次先不加。你让开了位置，心里还是有一点失落。',{emoji:'🍱'}),
 scene('campus-road','校园小路','问路的奶粉，刚好要去你熟悉的地方。','导航把两个入口混在了一起。你知道常走的那条路，可以把方向说清楚，也可以顺路走一小段。','顺路讲清路线，问能否加联系方式','先带到路口，下次有缘再聊','指明方向，先去处理自己的事',
 '这段路聊得很自然，奶粉同意加好友，也认真介绍了自己。','奶粉快赶不上课了，说这次先不加好友。你收起手机，理解归理解，还是有一点失落。',{emoji:'🌳'}),
 scene('lost-item','校园失物招领处','失物招领登记时，你和奶粉同时开口。','你们帮同学核对物品信息，一来一回聊了几句。忙完之后，奶粉也没有立刻走开。','事情处理完，问能否加好友认识一下','先介绍自己，以后遇到再聊','道声再见，继续自己的安排',
 '奶粉觉得你处理事情很认真，同意加好友再聊几句。','奶粉有些不好意思地说，想先保持普通同学的距离。你表示理解，回头时心情有点低落。',{emoji:'🔎'}),
 scene('workshop','校园手作工坊','手作体验课上，奶粉和你借了一支笔。','你们的作品都卡在了同一步，交换一下想法，反而顺利往前走了一点。','交换制作心得，问能否加好友','先一起做完这一小步，下次再问','把工具收好，先完成自己的作品',
 '奶粉想看看你之后做出的成品，同意加好友互相分享。','奶粉说平时不太用私聊交流活动，先在工坊见面就好。你点点头，也有一点失落。',
 {emoji:'🛠️',energy:[-6,-7,0],study:[2,3,0],project:[2,3,0]}),
 scene('study-group','课程答疑小组','答疑小组里，你和奶粉在看同一道题。','你讲清了前半步，奶粉补上了后半步。题目终于接起来，你也有点想把这次认识继续下去。','聊完思路，问能否加好友交流','先把这道题讲清，下次再问','记好解题步骤，回去继续学习',
 '奶粉觉得一起讨论很顺畅，愿意加好友再交流课程问题。','奶粉说课程问题先放在答疑群里交流，这次不另加好友。你认真记下了思路，心里仍有一点失落。',
 {emoji:'📖',energy:[-6,-8,0],study:[3,5,0],project:[2,4,0]})
];
function hash(x){let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function enableMeetings(s){return s.version!==6||s.meetings||s.phase==='ending'?s:{...s,meetings:{day:s.day,step:s.step,keepCurrent:s.log.length>0},actions:[...s.actions,'q']};}
function create(...args){return enableMeetings(B.create(...args));}
function fresh(s){const m=s.meetings;return !!m&&(!m.keepCurrent||m.day!==s.day||m.step!==s.step);}
function variant(s){
 const recent=s.log.filter(e=>e.encounterId&&!(e.day===s.day&&e.step===s.step)).slice(-2).map(e=>e.encounterId),pool=encounters.filter(e=>!recent.includes(e.id));
 return pool[Math.floor(B.rng(hash(s.seed+':meeting-1:'+s.day+':'+s.step))()*pool.length)];
}
function getScene(s){
 const base=B.getScene(s);if(!s.meetings||!fresh(s)||s.eventId!=='love-encounter'||!base)return base;
 const e=variant(s);return{...base,place:e.place,title:e.title,text:e.text,emoji:e.emoji,bubble:'这次认识，从一件小事开始。',encounterId:e.id,choices:base.choices.map((c,i)=>({...c,text:[e.ask,e.familiar,e.leave][i],mods:{...c.mods,...(e.energy?{energy:e.energy[i]}:{}),...(e.study?{study:e.study[i]}:{})},project:e.project?.[i]||0}))};
}
function choose(s,index){
 const n=B.choose(s,index);if(!s.meetings||s.eventId!=='love-encounter')return n;
 const current=getScene(s),c=current.choices[index],e=fresh(s)?variant(s):null,mods={...c.mods};let result=n.outcome.result;
 if(index===0){
  if(e)result=(n.outcome.contactAdded?e.yes:e.no)+(n.outcome.contactAdded?'\n你们加上了联系方式，亲密度从这里开始。':'\n这次没有加上联系方式。');
  if(!n.outcome.contactAdded){mods.mood=(mods.mood||0)-6;if(!e)result+='\n你理解对方的安排，但还是有一点失落。';}
 }else if(e)result=index===1?'你们先把眼前的事聊完，也记住了彼此。等下次自然遇见，再决定要不要多认识一点。':'奶娃先按自己的安排往前走，认真向奶粉道了别。';
 const stats=B.apply(s.stats,mods),changes=Object.fromEntries(B.keys.filter(k=>s.stats[k]!==stats[k]).map(k=>[k,stats[k]-s.stats[k]])),gain=c.project||0;
 const entry={...n.outcome,title:current.title,choice:c.text,result,changes,project:gain,...(e?{encounterId:e.id}:{})};
 const failed=stats.energy<=0?'fail-energy':stats.study<=0?'fail-study':stats.health<=0?'fail-health':null;
 return{...n,stats,failed,term:{...n.term,progress:s.term.progress+gain},outcome:entry,log:[...n.log.slice(0,-1),entry]};
}
function restore(raw){
 if(!raw?.meetings)return B.restore(raw);
 try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);
  for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=B.next(s);else if(a==='d')s=B.continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='h')s=B.enableCare(s);else if(a==='b')s=B.enableBalance(s);else if(a==='v')s=B.enableRomance(s);else if(a==='p')s=B.enableStory(s);else if(a==='y')s=B.enableRhythm(s);else if(a==='f')s=B.enableFood(s);else if(a==='i')s=B.enableIllness(s);else if(a==='q')s=enableMeetings(s);else if(a==='e')s=B.enableEconomy(s);else if(a==='l')s=B.enableLife(s);else if(typeof a==='string'&&a.startsWith('a:'))s=B.startActivity(s,a.slice(2));else return null;}
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
const api={...B,create,enableMeetings,getScene,choose,restore,valid:s=>restore(s)!==null,encounterCount:encounters.length};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
