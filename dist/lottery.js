(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./evolution.js'),L=browser?root.DormLife:require('./life.js');
const winner={id:'lottery-winner',icon:'🏆',name:'奶生赢家',quote:'五元的小票，开出了 100 万大奖。奶娃认真核对了好多遍，终于可以为这段校园人生写下一个意想不到的句号。',hidden:true};
function hash(x){let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const random=(s,key)=>B.rng(hash(s.seed+':lottery-1:'+s.day+':'+key))();
const prize=roll=>roll<.01?1000000:roll<.21?10:roll<.31?20:roll<.35?50:0;
const minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
function enableLottery(s){return s.version!==6||s.lottery||s.phase==='ending'?s:{...s,lottery:{lastOfferDay:0,credit:0,won:false},actions:[...s.actions,'j']};}
function create(...args){return enableLottery(B.create(...args));}
function arrive(s){
 if(!s.lottery||s.phase!=='choice'||s.failed||s.rhythm?.pending||s.evolution?.care||s.lottery.lastOfferDay===s.day||![1,3,4,6].includes(s.step))return s;
 if(!['base-','campus-','uni-'].some(p=>s.eventId.startsWith(p))||['uni-photo-result','uni-job-reply'].includes(s.eventId)||(s.step===1&&s.stats.money<10))return s;
 const slots=s.rhythm.slots.filter(k=>[1,3,4,6].includes(k)),target=slots[Math.floor(random(s,'slot')*slots.length)];
 if(s.step!==target||random(s,'offer')>=.18)return s;
 return{...s,eventId:'lottery-ticket',lottery:{...s.lottery,lastOfferDay:s.day}};
}
function getScene(s){if(!s.lottery||s.eventId!=='lottery-ticket')return B.getScene(s);if(['ending','dayEnd'].includes(s.phase))return null;return{id:'lottery-ticket',kind:'校园偶遇',time:L.eventTime(s),place:'校门口',emoji:'🎟️',bubble:'要不要试一次手气？',title:'路过校门口，奶娃看见了彩票摊。',text:'一张即开票，五元。奶娃摸了摸口袋里的零钱，也想了想今天还没吃的那顿饭。',choices:[{text:'买一张，刮开看看',mods:{money:-5},minutes:5,flags:{},project:0,result:''},{text:'今天不买，继续自己的安排',mods:{},minutes:0,flags:{},project:0,result:'奶娃把零钱放回口袋，继续往前走。'}]};}
function choose(s,index){
 if(!s.lottery||s.eventId!=='lottery-ticket')return B.choose(s,index);
 if(s.phase!=='choice'||!Number.isInteger(index)||![0,1].includes(index))throw Error('当前不能选择');
 if(index===0&&s.stats.money<5)throw Error('饭钱不足');
 const scene=getScene(s),c=scene.choices[index],award=index===0?prize(random(s,'draw:'+s.step)):0,paid=index===0?5:0,room=150-(s.stats.money-paid),cash=Math.min(award,room),credit=award===1000000?0:Math.max(0,award-cash);
 const won=award===1000000,stats={...s.stats,money:won?s.stats.money-paid+award:s.stats.money-paid+cash};
 let result=index===1?c.result:award?'刮开之后，票面显示中了 '+award.toLocaleString('en-US')+' 元！'+(won?'奶娃再三核对，确认是 100 万大奖。获得结局「奶生赢家」，本局结束。':'奖金已经领到，奶娃把小票收好，继续今天的生活。'):'刮开了，是一张没有中奖的小票。五元花掉了，奶娃收好纸屑，继续今天的安排。';
 if(credit)result+='\n饭钱余额已满，余下 '+credit+' 元存入奖金余额，之后消费会自动补入。';
 const entry={day:s.day,step:s.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result,changes:stats.money===s.stats.money?{}:{money:stats.money-s.stats.money},flags:{},project:0,minutes:c.minutes,lotteryPrize:award};
 return{...s,stats,lottery:{...s.lottery,credit:s.lottery.credit+credit,won},phase:won?'ending':'outcome',finalEnding:won?winner.id:s.finalEnding,outcome:entry,log:[...s.log,entry],actions:[...s.actions,'c'+index],rhythm:{...s.rhythm,clock:minute(scene.time)+c.minutes,lastActivity:null}};
}
// Small prizes retain any amount above the normal wallet limit; nothing is discarded.
function cashCredit(s,time){if(!s.lottery?.credit||s.failed||s.phase==='ending')return s;const paid=Math.min(s.lottery.credit,150-s.stats.money);if(paid<=0)return s;
 const entry={day:s.day,step:-1,eventId:'lottery-credit',index:0,time:time||clock(s.rhythm.clock),title:'奖金余额补入饭钱。',choice:'自动到账',result:'此前保留的奖金补入 '+paid+' 元。',changes:{money:paid},flags:{},project:0};return{...s,stats:{...s.stats,money:s.stats.money+paid},lottery:{...s.lottery,credit:s.lottery.credit-paid},log:[...s.log,entry]};
}
function next(s){if(s.lottery?.won)throw Error('本局已经结束');return arrive(B.next(cashCredit(s)));}
function continueDay(s){if(s.lottery?.won)throw Error('本局已经结束');return arrive(cashCredit(B.continueDay(s),'06:56'));}
function ending(s){return s.lottery?.won?winner:B.ending(s);}
const awardSource=s=>s.lottery?.won?{...s,failed:'fail-energy',finalEnding:'fail-energy'}:s;
function achievements(s){return s.lottery?.won?[winner,...B.achievements(awardSource(s)).filter(e=>e.id!=='fail-energy')]:B.achievements(s);}
function restore(raw){if(!raw?.lottery)return B.restore(raw);try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);const upgrades={h:'enableCare',b:'enableBalance',v:'enableRomance',p:'enableStory',y:'enableRhythm',f:'enableFood',i:'enableIllness',q:'enableMeetings',w:'enableWellness',u:'enableCampus',t:'enableEvolution',e:'enableEconomy',l:'enableLife'};
 for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='j')s=enableLottery(s);else if(upgrades[a])s=B[upgrades[a]](s);else if(typeof a==='string'&&a.startsWith('a:'))s=B.startActivity(s,a.slice(2));else return null;}return JSON.stringify(s)===JSON.stringify(raw)?s:null;}catch{return null;}}
const events=[...B.events,{id:'lottery-ticket'}],api={...B,create,enableLottery,getScene,choose,next,continueDay,ending,achievements,completedDays:s=>B.completedDays(awardSource(s)),degreeStatus:s=>B.degreeStatus(awardSource(s)),restore,valid:s=>restore(s)!==null,endings:[...B.endings,winner],events,eventCount:events.length};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
