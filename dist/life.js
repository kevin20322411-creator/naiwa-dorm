(function(root){
'use strict';
const healthDefaults={health:80,mood:65};
const meals=[
 {id:'meal-breakfast',key:'breakfast',step:0,label:'早餐',place:'食堂 · 早饭先到位',title:'早八之前，先喂饱奶娃。',text:'食堂蒸汽已经上线，奶娃的脑子还在缓冲。今天从吃点什么开始。',bubble:'肚子比闹钟更准时。',emoji:'🥯'},
 {id:'meal-lunch',key:'lunch',step:2,label:'午餐',place:'食堂 · 午饭补给站',title:'知识先放下，饭碗先端好。',text:'下课的人流涌进食堂。窗口菜单换了几道，奶娃的下午也需要一份补给。',bubble:'午饭吃好，下午再跑。',emoji:'🍱'},
 {id:'meal-dinner',key:'dinner',step:5,label:'晚餐',place:'校园 · 晚饭时间',title:'天快黑了，先把晚饭安排上。',text:'食堂灯亮了，小吃摊也开始飘香。奶娃看了看钱包，决定给今天一个热乎的收尾。',bubble:'今天的最后一顿正餐。',emoji:'🍜'}
];
const timeWindows=[[420,480],[500,650],[690,765],[810,960],[970,1040],[1050,1140],[1200,1340],[1360,1435]];
function hash(text){let h=2166136261;for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
function seededrng(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function shuffled(items,random){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function food(name,price,energy,health,mood,result,extra={}){return{text:name+' · ¥'+price+(price===0?'（免费）':''),hint:'',mods:{energy,money:-price,health,mood,...extra},result};}
const foodPools={
 breakfast:[
  food('宿舍燕麦',0,10,5,3,'热水一冲，宿舍也有了早餐窗口。'),
  food('室友共享吐司',0,10,3,5,'室友分来两片吐司，奶娃负责认真说谢谢。',{social:2}),
  food('勤工早餐',0,12,5,3,'早班同学留好了早餐，热包子还没凉。'),
  food('鸡蛋豆浆',5,16,7,5,'豆浆暖手，鸡蛋垫肚子，早八有了队友。'),
  food('小米粥配包子',4,15,6,4,'粥不催人，包子也没有截止日期。'),
  food('番茄鸡蛋面',6,18,6,6,'吸完最后一口面，奶娃终于开机。'),
  food('玉米酸奶杯',6,14,7,6,'颜色很清爽，奶娃吃出了认真生活的感觉。'),
  food('鲜肉小馄饨',7,17,5,7,'小馄饨浮上来，奶娃的精神也浮上来了。'),
  food('豆浆油条',4,16,3,7,'油条蘸进豆浆，早晨发出一声快乐的脆响。'),
  food('巧克力甜甜圈',6,12,-2,9,'糖霜治好了起床气，正餐这题留到午饭再答。')
 ],
 lunch:[
  food('勤工午餐',0,18,5,4,'勤工窗口递来一份热饭，奶娃的午饭有着落了。'),
  food('室友共享饭盒',0,16,4,6,'室友多备了一份饭，你们把小桌拼成了食堂。',{social:3}),
  food('校园餐券套餐',0,17,5,4,'领到的餐券换成热饭，今天也有具体的支持。'),
  food('两荤一素',12,24,7,6,'荤素都到位，奶娃的餐盘像一份完整计划。'),
  food('番茄鸡蛋盖饭',8,22,6,6,'酱汁拌开，今天没有一粒米需要独自加班。'),
  food('香菇鸡腿饭',10,23,5,8,'鸡腿很完整，奶娃的快乐也很完整。'),
  {...food('黄焖鸡（取餐乌龙）',10,22,5,7,'取餐时和同学拿反了袋子。你们交换回来，顺便互加好友，奶娃终于吃上自己的黄焖鸡。'),flags:{wrongMeal:1,mealFriend:1}},
  food('香菇青菜面',7,20,7,5,'热汤配青菜，下午的电量慢慢接上了。'),
  food('咖喱土豆饭',9,22,5,7,'土豆吸满咖喱，奶娃决定暂时原谅上午。'),
  food('紫菜双拼饭团',6,16,4,5,'两个饭团刚刚好，下午也能稳稳接住。'),
  food('炸鸡小食盒',10,19,-2,9,'第一口咔嚓，奶娃的心情先跳了两格。')
 ],
 dinner:[
  food('寝室共享杂粮粥',0,16,6,5,'室友分来一碗杂粮粥，热气把晚上的疲惫吹散一点。',{social:2}),
  food('志愿者晚餐',0,18,5,4,'活动结束领到的餐盒还温着，今晚不用空着肚子回寝。'),
  food('校园热汤饭',0,17,4,5,'晚间互助窗口盛了热汤饭，奶娃把胃先照顾好。'),
  food('番茄鸡蛋面',6,20,6,6,'酸甜热汤下肚，晚上的任务没那么吓人了。'),
  food('清汤牛肉面',10,23,7,7,'面条很长，奶娃希望今晚的电量也能这么长。'),
  food('西兰花鸡肉饭',11,22,7,6,'蔬菜和鸡肉一起报道，今晚吃得很踏实。'),
  food('砂锅豆腐饭',9,21,6,7,'砂锅还在咕嘟，奶娃已经开始期待第一口。'),
  food('白菜猪肉饺子',8,22,5,7,'一盘饺子排排坐，奶娃终于不用赶路吃饭。'),
  food('烤红薯配酸奶',5,17,5,6,'红薯甜得认真，晚风也没那么凉了。'),
  food('烤串小拼盘',10,20,-2,9,'孜然香先到了，奶娃的好心情随后赶到。')
 ]
};
function eventTime(state){
 const window=timeWindows[state.step];if(!window)throw Error('没有对应的日程时间');
 const random=seededrng(hash((state.seed>>>0)+':life-time-v5:'+state.day+':'+state.step));
 const minute=window[0]+Math.floor(random()*(window[1]-window[0]+1));
 return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
}
function mealScene(state,time){
 const meal=meals.find(m=>m.step===state.step);if(!meal)return null;
 const random=seededrng(hash((state.seed>>>0)+':life-menu-v5:'+state.day+':'+meal.key)),pool=foodPools[meal.key];
 const free=pool.filter(item=>item.mods.money===0),guaranteed=free[Math.floor(random()*free.length)];
 const picked=shuffled([guaranteed,...shuffled(pool.filter(item=>item!==guaranteed),random).slice(0,3)],random);
 const choices=picked.map(item=>({...item,mods:{...item.mods},flags:{...item.flags,meal:1,[meal.key]:1}}));
 const skipped=meal.key==='breakfast'?{energy:-8,health:-7,mood:-4,study:3}:meal.key==='lunch'?{energy:-12,health:-10,mood:-7,study:3}:{energy:-10,health:-8,mood:-6,study:3};
 choices.push({text:'不吃这餐 · ¥0',hint:'省下吃饭时间，身体和心情会受影响。',mods:skipped,result:'你把这顿饭划掉了，挤出一点学习时间。肚子安静了一会，身体却记下了这一餐。',flags:{missedMeal:1}});
 return{id:meal.id,time:time||eventTime(state),place:meal.place,title:meal.title,text:meal.text,bubble:meal.bubble,emoji:meal.emoji,kind:'三餐',choices};
}
const api={healthDefaults,mealScene,eventTime,meals};root.DormLife=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
