(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./semester.js');
const loveEnding={id:'love-ending',icon:'💗',name:'奶娃和奶粉的恋爱日常',quote:'不是每次都选最贵的礼物，而是一次次认真听见彼此。今天，你们约好了下次见面。'};
const option=(text,mods,result,affection=0,extra={})=>({text,mods,result,affection,flags:{},...extra});
const dates=[
 {id:'love-message',title:'奶粉分享了一件小事。',place:'课间 · 聊天窗口',emoji:'💬',text:'奶粉发来一张粉色云朵的照片：“今天这个颜色，像不像我？”',choices:[option('认真看完，分享自己今天的小事',{energy:-5,mood:4},'你们从云朵聊到食堂，平凡的一天多了一点回声。',9),option('只回一个万能表情',{energy:3},'聊天停在了表情包那里，奶粉没有再接话。',-12),option('说清现在在忙，约好晚些聊',{energy:-4,study:7},'奶粉回了句“那你先忙”，晚点的聊天没有被误会成敷衍。',3)]},
 {id:'love-walk',title:'奶粉问你要不要去操场走走。',place:'操场 · 晚风经过',emoji:'🌷',text:'“就走一小圈。”你看了一眼还没做完的事，也看了一眼消息。',choices:[option('留一段时间，认真陪着走走',{energy:-9,study:-4,mood:8},'你们聊起一些不急着有答案的问题。那一圈，走得比平时慢。',13),option('买点礼物，让对方自己逛',{money:-16,mood:2},'礼物收到了，只是奶粉原本想和你一起走。',2),option('说明自己的安排，约一个具体时间',{energy:-4,study:10},'你们约好了下次的时间。认真安排，也算认真回应。',3)]},
 {id:'love-library',title:'图书馆空出了相邻的座位。',place:'图书馆 · 两个书签',emoji:'📚',text:'奶粉把旁边的椅子轻轻拉开：“一起写一会儿？”',choices:[option('各做各的任务，休息时再聊天',{energy:-12,study:10,mood:3},'两个人安静地完成了各自的那一页，休息时交换了一小段今天。',10,{project:8}),option('一直拉着奶粉聊天',{energy:4,study:-7},'你很开心，奶粉的任务却没往前走。对方收起了笑，指了指课本。',-15),option('今天忙别的，认真约好下次',{energy:-5,study:10},'你说明了原因，也没有把“下次”留成一句空话。',3)]},
 {id:'love-dessert',title:'路过甜品窗口，奶粉停了一下。',place:'食堂 · 甜品窗口',emoji:'🍓',text:'柜台里摆着几种甜品。你发现，自己还不知道奶粉最喜欢什么口味。',choices:[option('先问喜欢什么，再一起挑',{money:-12,mood:5},'奶粉挑了小小的一份，也记住了你认真问的那一句。',11),option('直接买最贵的，不用问了',{money:-22,mood:2},'包装很漂亮，只是里面有奶粉不太喜欢的口味。',2),option('一起买一小份，坐着分着吃',{money:-6,energy:-3,mood:5},'一小份刚刚好，你们倒是聊了很久。',8),option('今天不消费，陪着聊一会儿',{energy:-5,mood:3},'你说明今天的预算，奶粉把小勺放下，和你聊起了下午。',5)]},
 {id:'love-rain',title:'下课时，校园突然下雨。',place:'教学楼 · 雨檐下',emoji:'☔',text:'奶粉站在雨檐下，手里只有一把没带伞套的折伞，正纠结要不要撑开。',choices:[option('问要不要一起走，慢慢送到路口',{energy:-10,mood:5},'你们走得很慢，聊起了雨停以后想做的事。',12),option('帮忙整理好雨伞，约好之后再见',{energy:-4,mood:3},'奶粉挥了挥手：“那下次一起走。”',7),option('不解释，自己先走',{energy:4},'奶粉看到你走远，没来得及说出的那句话也收了回去。',-14)]},
 {id:'love-listen',title:'奶粉今天有点不开心。',place:'校园长椅 · 没讲完的话',emoji:'🫧',text:'奶粉说起了一件烦心事，讲到一半又停下：“是不是有点打扰你？”',choices:[option('先听完，再问希望我怎么帮忙',{energy:-8,mood:-2},'问题没有立刻消失，但奶粉终于不用急着把话咽回去。',12),option('直接说“别想那么多”',{energy:3},'奶粉点了点头，后面的事情没有再讲。',-16),option('说明现在有事，约好晚点认真听',{energy:-5,study:6},'你给了一个能做到的时间。奶粉说，等你忙完再聊。',4)]}
];
function random(s,salt){let h=2166136261;for(const ch of s.seed+':'+s.day+':'+s.step+':'+salt)h=Math.imul(h^ch.charCodeAt(0),16777619);return B.rng(h>>>0)();}
function enableRomance(s){if(s.version!==6||s.romance||s.phase==='ending')return s;return{...s,romance:{connected:false,intimacy:0,dating:false,familiar:0,lastMeet:0,lastInteraction:0,earned:false,earnedDay:0},actions:[...s.actions,'v']};}
function create(...args){return enableRomance(B.create(...args));}
function eligible(s){return s.romance&&s.phase==='choice'&&[1,3,4,6].includes(s.step)&&!s.eventId.startsWith('term-')&&!s.log.some(e=>e.day===s.day&&e.eventId.startsWith('love-'));}
function override(s){
 if(!eligible(s))return s;
 const r=s.romance;if(!r.connected){if(s.day-r.lastMeet<3&&r.lastMeet)return s;if(random(s,'love-meet')<.17)return{...s,eventId:'love-encounter'};return s;}
 if(random(s,'love-followup')>=.34&&s.day-r.lastInteraction<2)return s;
 return{...s,eventId:r.intimacy>=80&&!r.dating?'love-confession':dates[Math.floor(random(s,'love-scene')*dates.length)].id};
}
function encounter(s){const places=['图书馆门口','食堂排队处','校园小路'];return{id:'love-encounter',title:'你遇见了一只粉色的奶娃。',place:places[Math.floor(random(s,'love-place')*places.length)],emoji:'🌸',text:'粉色的奶娃正把掉落的书签夹回书里。旁边有人喊了一声“奶粉”。你忽然有点想认识对方。',choices:[option('打个招呼，礼貌地问能否加联系方式',{energy:-4},'',0,{ask:true}),option('先聊两句，留到下次再问',{energy:-3,social:3,mood:2},'你们聊了几句。奶粉笑着道别，下次再见时，应该不会完全陌生了。',0,{familiar:true}),option('微笑点头，先去做自己的事',{mood:1},'你们短暂地对视了一下。你把这次偶遇留在心里，继续往前走。')]};}
function confession(){return{id:'love-confession',title:'这一次，想把心意说清楚。',place:'校园 · 约好的路口',emoji:'💗',text:'相处了这些日子，你发现奶粉也在认真回应你。要不要问问，愿不愿意把下一次见面叫作约会？',choices:[option('认真表达心意，问能否在一起',{energy:-6,mood:8},'奶粉认真听完，笑着点了点头：“我也想和你一起。”你们确认了彼此的心意。',5,{confess:true}),option('再相处一阵，不急着定义关系',{energy:-3,mood:3},'你们继续并肩走着。喜欢可以慢慢说，也可以慢慢确认。',2),option('坦白自己暂时只想做朋友',{mood:-3},'奶粉听完了你的想法。你们把关系放回了双方都能理解的位置。',-20)]};}
function getScene(s){
 if(!s.eventId?.startsWith('love-'))return B.getScene(s);
 let scene=s.eventId==='love-encounter'?encounter(s):s.eventId==='love-confession'?confession():JSON.parse(JSON.stringify(dates.find(e=>e.id===s.eventId)));
 const L=browser?root.DormLife:require('./life.js');return{...scene,time:L.eventTime(s),kind:'心动日常',bubble:'是奶粉，不是奶茶。',romanceScene:true};
}
function choose(s,index){
 if(!s.eventId?.startsWith('love-'))return B.choose(s,index);
 if(s.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('当前不能选择');
 const scene=getScene(s),c=scene.choices[index];if(!c)throw Error('当前不能选择');if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
 const r={...s.romance},before=r.intimacy,wasConnected=r.connected;let result=c.result;
 if(scene.id==='love-encounter'){
  r.lastMeet=s.day;
  if(c.ask){const rate=Math.min(.9,.65+Math.min(100,s.stats.social)*.0015+r.familiar*.1);if(random(s,'love-contact')<rate){r.connected=true;r.intimacy=20;r.lastInteraction=s.day;result='奶粉愿意加上联系方式。聊天框里出现了第一句“你好”，亲密度从这里开始。';}else result='奶粉有点不好意思地婉拒了。你说了句“没关系”，把选择留给对方。以后还有机会自然地认识。';}
  if(c.familiar)r.familiar=Math.min(2,r.familiar+1);
 }else{
  if(!r.connected)throw Error('尚未添加联系方式');
  r.lastInteraction=s.day;r.intimacy=Math.max(0,Math.min(100,r.intimacy+c.affection));
  if(c.confess){if(before<80)throw Error('亲密度还不足以告白');r.dating=true;r.earned=true;r.earnedDay=s.day;}
  if(r.intimacy===0){r.connected=false;r.dating=false;r.lastMeet=s.day;result+='\n亲密度归零，联系方式已删除。';}
 }
 const stats=B.apply(s.stats,c.mods),changes={};for(const k of B.keys)if(stats[k]!==s.stats[k])changes[k]=stats[k]-s.stats[k];
 const entry={day:s.day,step:s.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result,changes,flags:{},project:c.project||0,intimacyChange:r.intimacy-before,contactAdded:!wasConnected&&r.connected,contactDeleted:wasConnected&&!r.connected};
 const failed=stats.energy<=0?'fail-energy':stats.study<=0?'fail-study':stats.health<=0?'fail-health':null;
 return{...s,stats,romance:r,term:{...s.term,progress:s.term.progress+(c.project||0)},phase:'outcome',outcome:entry,log:[...s.log,entry],failed,actions:[...s.actions,'c'+index]};
}
function next(s){return override(B.next(s));}
function continueDay(s){return override(B.continueDay(s));}
function romanceAwards(s){return s.romance?.earned?[loveEnding]:[];}
function achievements(s){return [...B.achievements(s),...(['dayEnd','ending'].includes(s.phase)?romanceAwards(s):[])];}
function ending(s){return !s.failed&&s.romance?.earnedDay===s.day?loveEnding:B.ending(s);}
function restore(raw){
 if(!raw?.romance)return B.restore(raw);
 try{if(raw.version!==6||!Array.isArray(raw.actions)||raw.actions.length>10000||!Number.isInteger(raw.seed))return null;
  let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);
  for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='h')s=B.enableCare(s);else if(a==='v')s=enableRomance(s);else if(a==='b')s=B.enableBalance(s);else if(a==='e')s=B.enableEconomy(s);else if(a==='l')s=B.enableLife(s);else return null;}
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
const events=[...B.events,...dates,{id:'love-encounter'},{id:'love-confession'}];
const api={...B,create,getScene,choose,next,continueDay,restore,ending,achievements,romanceAwards,enableRomance,events,eventCount:events.length,endings:[...B.endings,loveEnding],valid:s=>restore(s)!==null};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
