(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./wellbeing.js'),L=browser?root.DormLife:require('./life.js');
// Values are game balance, not nutritional estimates. Keep released menus and
// all earlier actions frozen; f enables this catalogue at a replayable boundary.
const dish=(name,price,energy,health,mood,result,extra={})=>({name,price,energy,health,mood,result,...extra});
const pools={
 breakfast:[
  dish('宿舍燕麦',0,4,3,2,'热水一冲，早餐有着落了；自己准备也占去一点时间。',{study:-4}),
  dish('室友共享吐司',0,7,2,3,'接过室友分来的吐司，你认真道谢，也记下这份人情。',{social:-5}),
  dish('勤工早餐',0,4,3,2,'早班帮忙换到热包子，省下饭钱，课上的进度要多补一点。',{study:-4}),
  dish('白馒头',1,6,1,1,'蒸笼里刚取出的馒头很热，简单，也能先垫垫肚子。'),
  dish('茶叶蛋',2,5,3,2,'剥开蛋壳慢慢吃，这一口方便，想吃饱还得等下一餐。'),
  dish('蒸玉米',3,7,3,2,'玉米粒还带着热气，边走边吃，也没有太狼狈。'),
  dish('小烤红薯',3,8,2,3,'捧在手里暖一会儿，甜味也让早八没那么难。'),
  dish('青菜包配热水',3,9,2,2,'早餐不用很复杂，坐下吃完再出门就不错。'),
  dish('小米粥配包子',4,10,4,3,'粥不催人，包子也没有截止日期。'),
  dish('豆浆油条',4,11,2,5,'油条蘸进豆浆，早晨有了一声快乐的脆响。'),
  dish('鸡蛋豆浆',5,11,5,3,'豆浆暖手，鸡蛋垫肚子，早八有了队友。'),
  dish('番茄鸡蛋面',6,12,4,4,'热汤下肚，奶娃的脑子慢慢开机。'),
  dish('玉米酸奶杯',6,9,5,4,'清爽的一杯，适合今天不想吃太重的时候。'),
  dish('巧克力甜甜圈',6,8,-2,6,'甜味先赶走了起床气，今天这一餐偏向了心情。'),
  dish('鲜肉小馄饨',7,12,4,5,'小馄饨一颗颗浮上来，早上也能慢一点。'),
  dish('火腿双蛋煎饼',12,15,3,7,'多加的蛋和火腿塞得很满，奶娃满足地捧着走。'),
  dish('鲜虾云吞',14,14,5,7,'鲜虾很弹，热汤很鲜，今天想吃的这一口吃到了。'),
  dish('牛肉面加蛋',16,16,6,6,'面、肉和蛋都到位，早饭吃出了正餐的气势。'),
  dish('贝果咖啡套餐',18,12,3,8,'找个靠窗的位置，给今天留一点仪式感。'),
  dish('周末早午餐拼盘',22,16,5,9,'这一盘慢慢吃完，钱包轻了一点，早晨倒是很完整。')
 ],
 lunch:[
  dish('勤工午餐',0,8,3,3,'帮完窗口的忙再吃热饭，省下了饭钱，也用去一点学习时间。',{study:-4}),
  dish('室友共享饭盒',0,11,3,4,'你们把小桌拼成食堂，奶娃把这份照顾记在心里。',{social:-5}),
  dish('校园餐券套餐',0,8,3,3,'领券和排队花了些时间，热饭端到面前时就踏实了。',{study:-4}),
  dish('土豆丝盖饭',4,11,2,2,'盖饭朴素，分量倒很认真，今天先把肚子照顾好。'),
  dish('白菜豆腐套餐',5,12,4,2,'清清爽爽的一盘，少花一点，也能坐下吃顿饭。'),
  dish('紫菜双拼饭团',6,11,3,3,'两个饭团方便又省事，适合今天事情排得比较满。'),
  dish('豆芽炒面',6,12,2,3,'刚出锅的炒面带着香气，便宜，也足够管饱。'),
  dish('香菇青菜面',7,13,5,3,'热汤配青菜，下午的电量慢慢接上。'),
  dish('番茄鸡蛋盖饭',8,14,4,4,'酱汁拌进米饭，奶娃认真吃完了这一盘。'),
  dish('咖喱土豆饭',9,14,3,5,'土豆吸满咖喱，奶娃决定暂时原谅上午。'),
  dish('香菇鸡腿饭',10,15,4,5,'鸡腿很完整，奶娃的快乐也很完整。'),
  dish('黄焖鸡（取餐乌龙）',10,14,3,5,'你和同学拿反了袋子，交换回来时顺便互加了好友。',{flags:{wrongMeal:1,mealFriend:1}}),
  dish('炸鸡小食盒',10,12,-2,7,'第一口咔嚓，奶娃今天就是想吃这一口。'),
  dish('两荤一素',12,16,5,4,'荤素都到位，下午的安排也更有底气了。'),
  dish('牛肉双拼饭',18,17,5,7,'两种喜欢的口味放在一起，这顿吃得满足。'),
  dish('酸汤肥牛米线',20,15,4,8,'酸汤热热地冒着气，奶娃慢慢嗦完了米线。'),
  dish('脆皮烤肉饭',22,17,1,9,'脆皮咬下去很香，这一餐选的是自己想吃的口味。'),
  dish('麻辣香锅小锅',26,16,-2,10,'选了几样喜欢的菜，香锅很过瘾，口味也确实重了点。'),
  dish('现煎牛排饭',32,17,6,8,'牛排滋滋作响，今天决定认真奖励一下自己。'),
  dish('食堂庆祝套餐',38,18,5,10,'主菜、配菜和小甜品摆齐，奶娃给这一顿找到了庆祝的理由。')
 ],
 dinner:[
  dish('寝室共享杂粮粥',0,11,4,3,'室友分来一碗热粥，奶娃道了谢，也想好下次回请。',{social:-5}),
  dish('志愿者晚餐',0,8,3,3,'帮忙收完活动现场，拿到的餐盒还是热的。',{study:-4}),
  dish('校园热汤饭',0,8,3,3,'排过互助窗口，热汤饭让今天有了一个稳妥的收尾。',{study:-4}),
  dish('紫菜蛋花汤配馒头',3,10,2,2,'一碗热汤配馒头，简单地吃，也能暖暖和和回寝。'),
  dish('青菜鸡蛋面',4,12,4,3,'青菜和鸡蛋都在，汤面不用贵也能吃得踏实。'),
  dish('清粥配小菜',4,10,4,2,'今晚想清淡一点，慢慢喝完这一碗再走。'),
  dish('蔬菜炒饭',5,12,2,3,'炒饭分量足，锅气也让这一餐很有存在感。'),
  dish('烤红薯配酸奶',5,11,3,4,'红薯甜得认真，晚风也没那么凉了。'),
  dish('番茄鸡蛋面',6,13,4,4,'热汤下肚，晚上的任务没那么吓人了。'),
  dish('白菜猪肉饺子',8,14,3,5,'一盘饺子排排坐，这顿终于不用赶着吃。'),
  dish('砂锅豆腐饭',9,14,4,5,'砂锅还在咕嘟，奶娃已经期待起第一口。'),
  dish('清汤牛肉面',10,15,5,5,'面条很长，奶娃希望今晚的电量也能这么长。'),
  dish('烤串小拼盘',10,13,-2,7,'孜然香先到了，奶娃的好心情随后赶到。'),
  dish('西兰花鸡肉饭',11,14,5,4,'蔬菜和鸡肉一起到位，今晚吃得很踏实。'),
  dish('铁板鸡排饭',18,16,3,7,'铁板冒着热气，奶娃慢慢切完了整块鸡排。'),
  dish('砂锅鱼片饭',20,15,6,7,'鱼片很嫩，汤也很暖，今晚想认真吃顿热饭。'),
  dish('小份寿司拼盘',22,13,4,8,'挑了几种喜欢的口味，吃完还想把这一盘拍下来。'),
  dish('酸菜鱼拼单餐',26,16,3,9,'和同学拼了一份鱼，各付各的饭钱，也多聊了一会儿。'),
  dish('烤肉饭加小食',28,17,0,9,'喜欢的小食也加上了，这一顿确实吃得开心。'),
  dish('期末庆功小火锅',38,18,4,10,'小锅咕嘟，奶娃把这一顿吃成了今天的小庆祝。')
 ]
};
function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function enableFood(s){return s.version!==6||s.foodUpdate||s.phase==='ending'?s:{...s,foodUpdate:{day:s.day,step:s.step,keepCurrent:s.log.length>0},actions:[...s.actions,'f']};}
function create(...args){return enableFood(B.create(...args));}
function enabled(s){const u=s.foodUpdate;return !!u&&(!u.keepCurrent||s.day!==u.day||s.step!==u.step);}
function mealScene(s){
 const meal=L.meals.find(m=>m.step===s.step);if(!meal)return null;
 const random=B.rng(hash(s.seed+':campus-food-1:'+s.day+':'+meal.key));
 const tiers=meal.key==='breakfast'?[0,3,8]:[0,6,12],pool=pools[meal.key];
 const previous=s.log.filter(e=>e.day<s.day&&e.eventId===meal.id).at(-1)?.choice;
 const groups=[pool.filter(d=>d.price===0),pool.filter(d=>d.price>0&&d.price<=tiers[1]),pool.filter(d=>d.price>tiers[1]&&d.price<=tiers[2]),pool.filter(d=>d.price>tiers[2])];
 const choices=groups.map(group=>{const fresh=group.filter(d=>!previous?.startsWith(d.name+' ·'));const candidates=fresh.length?fresh:group;const d=candidates[Math.floor(random()*candidates.length)];
  return{text:d.name+' · ¥'+d.price+(d.price===0?'（免费）':''),mods:{energy:d.energy,money:-d.price,health:d.health,mood:d.mood,...(d.study?{study:d.study}:{}),...(d.social?{social:d.social}:{})},result:d.result,flags:{...d.flags,meal:1,[meal.key]:1},project:0};
 });
 const skipped=meal.key==='breakfast'?{energy:-8,health:-7,mood:-4,study:3}:meal.key==='lunch'?{energy:-12,health:-10,mood:-7,study:3}:{energy:-10,health:-8,mood:-6,study:3};
 choices.push({text:'不吃这餐 · ¥0',mods:skipped,result:'你省下了吃饭时间，挤出一点学习进度。肚子没再催促，身体却记下了这一餐。',flags:{missedMeal:1},project:0});
 return{...meal,time:L.eventTime(s),kind:'三餐',choices};
}
function getScene(s){return enabled(s)&&!['dayEnd','ending'].includes(s.phase)&&L.meals.some(m=>m.id===s.eventId)?mealScene(s):B.getScene(s);}
function choose(s,index){
 if(!enabled(s)||!L.meals.some(m=>m.id===s.eventId))return B.choose(s,index);
 if(s.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('当前不能选择');
 const scene=mealScene(s),c=scene.choices[index];if(!c)throw Error('没有这个选择');if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
 const mods={...c.mods},flags={...s.flags};let bonus=s.bonus,result=c.result;
 for(const[k,v]of Object.entries(c.flags))flags[k]=(flags[k]||0)+v;
 if(s.traits.includes('luck')&&s.step===2){mods.money+=8;bonus=true;result+='\n🍀 锦鲤天赋触发：饭卡活动返还了8元。';}
 const stats=B.apply(s.stats,mods),changes={};for(const k of B.keys)if(stats[k]!==s.stats[k])changes[k]=stats[k]-s.stats[k];
 const failed=stats.energy<=0?'fail-energy':stats.study<=0?'fail-study':stats.health<=0?'fail-health':null;
 const entry={day:s.day,step:s.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result,changes,flags:{...c.flags},project:0};
 const rhythm=s.rhythm?{...s.rhythm,clock:Number(scene.time.slice(0,2))*60+Number(scene.time.slice(3))+10,lastActivity:null}:undefined;
 return{...s,stats,flags,bonus,failed,phase:'outcome',outcome:entry,log:[...s.log,entry],actions:[...s.actions,'c'+index],...(rhythm?{rhythm}:{})};
}
function restore(raw){
 if(!raw?.foodUpdate)return B.restore(raw);
 try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;
  let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);
  for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=B.next(s);else if(a==='d')s=B.continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='h')s=B.enableCare(s);else if(a==='b')s=B.enableBalance(s);else if(a==='v')s=B.enableRomance(s);else if(a==='p')s=B.enableStory(s);else if(a==='y')s=B.enableRhythm(s);else if(a==='f')s=enableFood(s);else if(a==='e')s=B.enableEconomy(s);else if(a==='l')s=B.enableLife(s);else if(typeof a==='string'&&a.startsWith('a:'))s=B.startActivity(s,a.slice(2));else return null;}
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
const api={...B,create,enableFood,getScene,choose,restore,valid:s=>restore(s)!==null,foodCount:Object.values(pools).reduce((n,p)=>n+p.length,0)};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
