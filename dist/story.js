(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./romance.js');
const added=[
 {id:'steady-life',icon:'🍵',name:'把日子过稳的奶娃',quote:'作业没有耽误，饭也按时吃了。奶娃不必每晚透支，照样能把生活一点点往前推。'},
 {id:'quiet-break',icon:'🌧️',name:'今天先照顾自己',quote:'身体还能走，心情却已经需要停一停。奶娃把不紧急的事推到明天，给自己留了一段安静。'},
 {id:'recovery',icon:'🌿',name:'慢慢养回来的奶娃',quote:'从勉强撑着，到重新有力气走出宿舍。这一天没有奇迹，只有一顿顿饭和一次次认真休息。'}
];
function random(s,salt){let h=2166136261;for(const ch of s.seed+':'+s.day+':'+s.step+':'+salt)h=Math.imul(h^ch.charCodeAt(0),16777619);return B.rng(h>>>0)();}
function enableStory(s){return s.version!==6||s.storyMode||s.phase==='ending'?s:{...s,storyMode:true,actions:[...s.actions,'p']};}
function create(...args){return enableStory(B.create(...args));}
const contactReplies={
 '图书馆门口':{
  yes:['你们聊起刚借的书。奶粉愿意加上联系方式，说回去把提到的书名发给你。','聊完几句借书的事，奶粉笑着拿出手机：“好呀，下次可以一起借书。”'],
  no:['奶粉看了眼预约时间，说自己马上要进馆自习，今天先不交换联系方式。你道了别，没有继续拦着。','奶粉坦白说，不太习惯刚见面就加联系方式。你点点头，把这次认识停在了一个招呼。']},
 '食堂排队处':{
  yes:['你们聊到了常去的食堂窗口。奶粉接过手机，说下次可以互相推荐好吃的。','排队的几分钟聊得很自然。轮到取餐前，奶粉笑着同意加上联系方式。'],
  no:['队伍忽然往前走，奶粉正忙着取热汤，没腾出手加好友。你让开位置，说下次碰见再聊。','奶粉说今天是来给同学带饭，正赶着回去，这次先不加好友。你没有耽误对方的安排。']},
 '校园小路':{
  yes:['你们顺路聊起了校园里常走的那条路。奶粉觉得聊得来，同意加上联系方式。','奶粉听完你的自我介绍，也认真介绍了自己：“可以呀，以后在校园碰到就不是陌生人了。”'],
  no:['奶粉正赶去上课，听见铃声后有些着急。你收起手机，说了声“先去上课吧”。','奶粉有些不好意思地说，暂时想先保持普通同学的距离。你表示理解，没有追问。']}
};
function choose(s,index){
 const n=B.choose(s,index);if(!s.storyMode||s.eventId!=='love-encounter'||!B.getScene(s).choices[index].ask)return n;
 const rate=Math.min(.8,.48+Math.min(100,s.stats.social)*.001+s.romance.familiar*.1),accepted=random(s,'story-contact')<rate;
 const r={...s.romance,lastMeet:s.day};if(accepted){r.connected=true;r.intimacy=20;r.lastInteraction=s.day;}
 const scene=B.getScene(s),replies=contactReplies[scene.place][accepted?'yes':'no'];
 const result=replies[Math.floor(random(s,'story-reply')*replies.length)]+(accepted?'\n你们加上了联系方式，亲密度从这里开始。':'\n这次没有加上联系方式。');
 const entry={...n.outcome,result,intimacyChange:r.intimacy-s.romance.intimacy,contactAdded:accepted,contactDeleted:false};
 return{...n,romance:r,outcome:entry,log:[...n.log.slice(0,-1),entry]};
}
// Narrative titles depend on both the original behaviour conditions and a fitting current state.
const requirements={
 chaos:v=>v.mood>=55,poor:v=>v.money<=3,tired:v=>v.energy<=10,skip:v=>v.study<=65,
 hero:v=>v.study>=65&&v.social>=35,popular:v=>v.social>=90,scholar:v=>v.study>=92,rich:v=>v.money>=70,
 lucky:v=>v.energy>=35&&v.study>=45,battery:v=>v.energy>=85&&v.study<60,
 balanced:v=>v.energy>=55&&v.money>=15&&v.social>=65&&v.study>=65&&v.health>=65&&v.mood>=60,
 cat:v=>v.mood>=45&&v.health>=35,viral:v=>v.social>=55&&v.mood>=55,artist:v=>v.mood>=60,
 athlete:v=>v.energy>=50&&v.health>=65,trader:v=>v.money>=30,worker:v=>v.money>=20&&v.energy>=30,
 informant:v=>v.study>=65,gardener:v=>v.health>=60&&v.mood>=55,inventor:v=>v.study>=70&&v.energy>=35,
 'meal-pal':v=>v.social>=55&&v.mood>=55,helper:v=>v.social>=65&&v.health>=40,library:v=>v.study>=75&&v.mood>=35
};
const qualifies=(s,e)=>!requirements[e.id]||requirements[e.id](s.stats);
function extraAwards(s){
 if(s.failed||!['dayEnd','ending'].includes(s.phase))return[];
 const v=s.stats,ids=[];
 const startHealth=v.health-s.log.filter(e=>e.day===s.day).reduce((sum,e)=>sum+(e.changes.health||0),0);
 if(v.health>=85&&v.mood>=75&&v.energy>=50&&v.study>=55)ids.push('steady-life');
 if(v.mood<=25&&v.health>0&&v.energy>0)ids.push('quiet-break');
 if(startHealth<=35&&v.health>=65&&v.mood>=45)ids.push('recovery');
 return ids.map(id=>added.find(e=>e.id===id));
}
function decorate(s,e){
 if(!s.storyMode||e.id!=='love-ending')return e;
 const v=s.stats;
 const quote=v.health<45?'你们把这次约会改成了早些回寝。奶粉认真听完你最近的疲惫，约好以后一起把作息慢慢养回来。':
  v.money<=10?'没有昂贵的礼物，你们分着吃了一份小点心，沿着校园慢慢走。奶粉记住的，是你认真留给这次见面的时间。':
  v.study>=80&&v.health>=65?'你们给彼此留出了学习的时间，也认真安排下次见面。图书馆有相邻的座位，日历上也有了两个人的约定。':
  v.mood>=80&&v.health>=70?'你们从食堂一路聊到操场，连平常的晚风也像多了一点甜。今天的你有余力，把喜欢认真地说给奶粉听。':e.quote;
 return{...e,quote};
}
function ending(s){
 const base=B.ending(s);if(!s.storyMode||s.failed)return base;
 if(base.id==='love-ending'||['freshman','week','degree','honor'].includes(base.id))return decorate(s,base);
 if(base.id!=='ordinary'&&qualifies(s,base))return base;
 const extra=extraAwards(s);if(extra.length)return extra.find(e=>e.id==='recovery')||extra[0];
 return B.achievements(s).find(e=>Object.hasOwn(requirements,e.id)&&qualifies(s,e))||B.endings.find(e=>e.id==='ordinary');
}
function achievements(s){
 const base=B.achievements(s);if(!s.storyMode)return base;
 if(!['dayEnd','ending'].includes(s.phase))return base;
 const found=[...base.filter(e=>qualifies(s,e)),...extraAwards(s),ending(s)];
 return [...new Map(found.map(e=>[e.id,decorate(s,e)])).values()];
}
function romanceAwards(s){return B.romanceAwards(s).map(e=>decorate(s,e));}
function restore(raw){
 if(!raw?.storyMode)return B.restore(raw);
 try{
  if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>10000)return null;
  let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);
  for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=B.next(s);else if(a==='d')s=B.continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='h')s=B.enableCare(s);else if(a==='b')s=B.enableBalance(s);else if(a==='v')s=B.enableRomance(s);else if(a==='p')s=enableStory(s);else if(a==='e')s=B.enableEconomy(s);else if(a==='l')s=B.enableLife(s);else return null;}
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
const api={...B,create,choose,ending,achievements,romanceAwards,enableStory,restore,valid:s=>restore(s)!==null,endings:[...B.endings,...added]};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
