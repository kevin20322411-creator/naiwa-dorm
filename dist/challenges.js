(function(root){
'use strict';
const endings=[
 {id:'hidden-cat-advisor',icon:'🐈',name:'猫比导师先认识我',quote:'导师还在认名字，校猫已经知道你几点下课了。',hidden:true},
 {id:'hidden-broke-chaos',icon:'🪙',name:'欠费也要整活',quote:'饭卡余额归零，奶娃的节目储备依然十分充足。',hidden:true},
 {id:'hidden-early-miracle',icon:'🌅',name:'早八奇迹',quote:'闹钟只响一遍，课也没有白上。今天连床板都承认你赢了。',hidden:true},
 {id:'hard-balanced-fortnight',icon:'💎',name:'双周满格奶娃',quote:'两周过去，电量、学业和饭钱一起在线。室友开始怀疑你偷偷升级了。',difficulty:'hard'},
 {id:'hard-library-maker',icon:'🛠️',name:'文理双修奶娃',quote:'书签夹着图纸，图纸压着笔记。知识终于从书架走到了宿舍桌上。',difficulty:'hard'},
 {id:'hard-perfect-month',icon:'👑',name:'月度满配奶娃',quote:'三十天的早八和熄灯之后，你还带着满满的电量、底气和饭钱。',difficulty:'hard'}
];
function unlocked(state,completedDays){
 // An unfinished day or a failure must never award a new challenge.
 if(!state||state.failed||!['dayEnd','ending'].includes(state.phase)||!Number.isInteger(state.day)||state.day<1||!(completedDays>=state.day)||!state.stats||!Array.isArray(state.log))return[];
 const daily={},flags=state.flags||{},stats=state.stats,ids=[];
 for(const entry of state.log)if(entry.day===state.day)for(const[key,value]of Object.entries(entry.flags||{}))daily[key]=(daily[key]||0)+value;
 if(completedDays>=7&&(flags.cat||0)>=6)ids.push('hidden-cat-advisor');
 if(stats.money===0&&stats.study>=50&&stats.energy>=50&&(daily.chaos||0)>=2)ids.push('hidden-broke-chaos');
 if((daily.early||0)>=1&&(daily.skip||0)===0&&stats.study>=90)ids.push('hidden-early-miracle');
 if(completedDays>=14&&stats.energy>=90&&stats.study>=95&&stats.money>=40)ids.push('hard-balanced-fortnight');
 if(completedDays>=21&&(flags.library||0)>=3&&(flags.maker||0)>=3&&stats.study>=90)ids.push('hard-library-maker');
 if(completedDays>=30&&stats.energy>=95&&stats.study>=95&&stats.money>=80)ids.push('hard-perfect-month');
 return ids;
}
const api={endings,unlocked};root.DormChallenges=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
