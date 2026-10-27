(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./relationships.js');
const clone=x=>JSON.parse(JSON.stringify(x));
const backgrounds=[
 {id:'freshman',name:'普通新生',desc:'从陌生到熟悉，慢慢找到自己的校园节奏。',unlockIds:[]},
 {id:'creative',name:'创作社新成员',desc:'把一个小点子做成作品，经历准备、试作与展出。',unlockIds:['artist','inventor','week']},
 {id:'sport',name:'运动社新成员',desc:'和队友一起准备校园接力，练习、磨合，再站上起点。',unlockIds:['athlete','week']}
];
const endings=[
 {id:'journey-freshman',icon:'🗺️',name:'校园慢慢熟了',quote:'从第一次找不到路，到能和新朋友约好下一次见面。奶蛙在校园里找到了自己的位置。'},
 {id:'journey-creative',icon:'🎨',name:'小点子有了展位',quote:'作品没有一步成形。奶蛙和同伴把想法做出来，也把这段共同完成的经历留在了校园。'},
 {id:'journey-sport',icon:'🏁',name:'这一棒有人接',quote:'从生疏到配合，奶蛙和队友认真跑完了属于自己的那一段。名次之外，也有值得记住的终点。'}
];
const choice=(text,minutes,mods,result,flags={})=>({text,minutes,mods,result,flags,project:0});
const stories={
 freshman:[
  {title:'刚开始不认识的人，今天又坐到了旁边。',place:'公共课教室',emoji:'🗺️',bubble:'原来，你也在慢慢适应。',text:'同学也在研究校园地图，问起你这几天有没有找到顺路的食堂。你可以决定怎样开始这段熟悉。',choices:[choice('交换各自踩过的坑，约一次顺路的饭',15,{energy:-4,social:3,mood:2},'你们把容易走错的路标记出来，也认真约好了之后顺路吃饭。'),choice('一起补全课表，把上课地点核对清楚',15,{energy:-5,study:4,social:2},'课表变得清楚，旁边的名字也从陌生变得好记。'),choice('先听听分享，今天按自己的安排走',5,{},'你记住了一个窗口和一个名字，没有急着把日程塞满。')]},
  {title:'之前见过的同学，把组队消息转给了你。',place:'教学楼休息区',emoji:'🤝',bubble:'那次聊天，有了后续。',text:'一个小组还差一位同学。对方说明任务不大，也愿意先聊清分工，你不需要把所有事情都包下来。',choices:[choice('接下自己能完成的一小部分',20,{energy:-8,study:5,social:3},'你认领了范围清楚的任务，队友知道了什么时候能收到你的那一份。'),choice('帮大家理清分工，再决定以后怎样合作',15,{energy:-5,social:3,study:2},'分工不再挤在一个人身上，大家把下一次确认进度的时间写了下来。'),choice('说明这周余力不够，保留下次合作的机会',5,{},'你说清了自己的安排，对方也把下次见面的机会留了下来。')]},
  {title:'食堂里，那张桌子有人替你留了位置。',place:'食堂门外',emoji:'🌿',bubble:'校园里，开始有熟悉的人。',text:'你们回头聊起刚开学时走错的路。现在，你也能向另一位新同学说清楚怎么去下一栋楼。',choices:[choice('分享自己的校园小地图，也听听他们的新发现',15,{energy:-4,social:4,mood:3},'你们添上了新窗口、新教室和下一次见面的地点。熟悉是这些小事慢慢堆起来的。'),choice('和大家约好下一次一起完成的小事',15,{energy:-4,social:3,mood:3},'约定很小，也留着各自的空间。奶蛙开始有了能一起行动的人。'),choice('挥挥手，带着熟悉的感觉继续今天',5,{mood:1},'你没有留下太久，但校园已经不再完全陌生。')]}
 ],
 creative:[
  {title:'创作社给新成员留了一张空白小卡。',place:'创作社活动室',emoji:'✏️',bubble:'小点子也可以有位置。',text:'社团想办一场小小的校园展览，每个人可以从一件身边的小事开始。没人要求你第一次就交出完整作品。',choices:[choice('画下校园里最想留住的一个场景',20,{energy:-7,mood:3},'你画下一个不算完整的草稿。同伴说，先留下想表达的东西就好。',{art:1}),choice('试着用手边材料做一个小模型',20,{energy:-7,study:3},'材料还很简单，小模型却已经有了轮廓。你和同伴约好下一次再试。',{maker:1}),choice('先看看大家的想法，记下自己感兴趣的方向',5,{},'你没有急着交稿，先把一两个想试的方向记在了卡片上。')]},
  {title:'展览前，同伴问你愿不愿意一起试作。',place:'创作社工作桌',emoji:'🛠️',bubble:'那张小卡，开始变成作品。',text:'第一次试作有点歪，材料也未必听话。同伴把能改的地方圈出来，想和你一起决定下一步。',choices:[choice('保留原来的想法，认真改掉一个最明显的问题',20,{energy:-8,study:4,mood:2},'你没有推倒全部重来，只改清楚了最需要的一处。作品慢慢站稳了。',{art:1,maker:1}),choice('和同伴交换看法，调整成大家都能完成的版本',15,{energy:-5,social:3,mood:2},'你们把范围收小，也把分工说清。原来的点子终于有了能做完的样子。',{art:1}),choice('说明这次先不继续，帮忙把材料整理好',5,{energy:-2},'你把能做的收尾完成，没有勉强承诺赶不完的作品。')]},
  {title:'校园小展览开门了。',place:'学生活动中心',emoji:'🖼️',bubble:'有人停下来，认真看了一会儿。',text:'展位很小，路过的人却真的停下了脚步。你可以说说制作时想表达什么，也可以先听听别人的感受。',choices:[choice('介绍自己的想法，也承认还没做好的一部分',20,{energy:-6,social:3,mood:4},'有人听懂了你想留下的那一点校园生活。你也记住了一句能带到下一次的建议。',{art:1}),choice('和同伴一起记录观众反馈，留一张合照',15,{energy:-4,mood:4,social:2},'反馈和合照被存进同一个文件夹。奶蛙和同伴共同完成的这件小事，有了可以回看的痕迹。',{art:1}),choice('路过时看一眼，把喜欢的作品记下来',5,{mood:1},'你在门口停了一会儿，记住了几件想法很好的作品。')]}
 ],
 sport:[
  {title:'运动社的校园接力，正在找愿意配合的队友。',place:'运动场边',emoji:'🏃',bubble:'先跑好自己的这一段。',text:'队友先问你平时怎样运动，再一起商量适合的位置。今天只做轻松的尝试，不急着比较成绩。',choices:[choice('热身后试跑一小段，看看适合自己的节奏',20,{energy:-9,health:2,mood:2},'你和队友试了几次交接，发现先把速度放稳，比一开始就冲出去更顺。',{sport:1}),choice('帮忙计时记录，和队友商量接力顺序',15,{energy:-4,social:3},'你记下每个人舒服的节奏，也让接力顺序更清楚了一点。'),choice('先在旁边了解安排，今天不加入训练',5,{},'你问清了之后的安排，给自己留了一点观察的时间。')]},
  {title:'第一次交接不太顺，队友想和你重新试试。',place:'接力练习区',emoji:'🤝',bubble:'磨合也算进度。',text:'有人出发早了，有人回头看得太久。大家决定先把动作说清楚，再按自己的余力试一次。',choices:[choice('先说清交接信号，再慢慢练一遍',20,{energy:-9,health:2,mood:2},'你们找到一个都听得清的信号，交接终于没有再撞成一团。',{sport:1}),choice('把发现的问题记下来，帮大家安排休息',15,{energy:-4,social:3,mood:1},'动作需要练，休息也需要留。队友认真听完了你的建议。'),choice('今天先退出练习，把自己的状态说明白',5,{},'你没有硬撑，队友也知道接下来该怎样调整人员。')]},
  {title:'接力赛这天，队友在起点向你挥手。',place:'校园运动场',emoji:'🏁',bubble:'这一段，认真跑过就算数。',text:'场边有人加油，也有人紧张。你们把之前约好的信号又确认了一遍，准备完成属于自己的这一段。',choices:[choice('按练过的节奏完成这一棒',20,{energy:-10,mood:4,social:2},'你没有抢别人的节奏。接力棒稳稳交到下一位手里，队友在终点认真拍了拍你的肩。',{sport:1}),choice('留在场边计时和加油，把队友接回终点',15,{energy:-4,mood:3,social:3},'你记下时间，也给跑回来的队友递上水。这场接力，有人跑，也有人稳稳接住。'),choice('说明今天不参赛，给队友留一句加油',5,{mood:1},'你没有勉强自己上场，也把祝福认真留给了出发的人。')]}
 ]};
function availableBackgrounds(seenIds=[]){const seen=new Set(Array.isArray(seenIds)?seenIds:[]);return backgrounds.filter(b=>!b.unlockIds.length||b.unlockIds.some(id=>seen.has(id))).map(clone);}
function enableJourneys(s,backgroundId='freshman'){if(s.version!==6||s.journeys||s.phase==='ending')return s;if(!backgrounds.some(b=>b.id===backgroundId))throw Error('没有这个入学背景');return{...s,journeys:{backgroundId,startDay:s.day,stage:0,decisions:[],completedDay:0,earned:false,pending:null},actions:[...s.actions,'J']};}
function create(seed,traits,name,recent=[],backgroundId='freshman'){return enableJourneys(B.create(seed,traits,name,recent),backgroundId);}
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const delta=(a,b)=>Object.fromEntries(B.keys.filter(k=>Number.isFinite(a[k])&&a[k]!==b[k]).map(k=>[k,b[k]-a[k]]));
function getScene(s){if(['ending','dayEnd'].includes(s.phase))return null;const j=s.journeys,p=j?.pending;if(!p)return B.getScene(s);const scene=clone(stories[j.backgroundId][p.stage]);return{...scene,id:'journey-'+j.backgroundId+'-'+p.stage,time:clock(p.at),kind:'校园新篇',callback:p.stage===0?'':j.decisions[p.stage-1]===2?'上次你先留在旁边了解情况，这次仍可以按自己的余力决定。':'之前留下的小约定，今天有了后续。',choices:scene.choices.map(c=>({...c,...(c.minutes>p.free?{disabledReason:'这段空闲只剩 '+p.free+' 分钟'}:{})}))};}
function choose(s,index){const j=s.journeys,p=j?.pending;if(!p)return B.choose(s,index);if(s.phase!=='choice'||p.done||!Number.isInteger(index))throw Error('当前不能选择');const scene=getScene(s),c=scene.choices[index];if(!c)throw Error('没有这个选择');if(c.disabledReason)throw Error(c.disabledReason);if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');const stats=B.apply(s.stats,c.mods),flags={...s.flags};for(const[k,v]of Object.entries(c.flags))flags[k]=(flags[k]||0)+v;
 const decisions=[...j.decisions,index],stage=p.stage+1,entry={day:s.day,step:-1,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result:c.result,changes:delta(s.stats,stats),flags:{...c.flags},project:0,minutes:c.minutes,origin:'journey'};
 const failed=stats.health<=0?'fail-health':stats.mood<=0?'fail-mood':stats.energy<=0?'fail-energy':stats.study<=0?'fail-study':s.term?.missed>=2?'fail-course':null;
 return{...s,stats,flags,failed,phase:'outcome',outcome:entry,log:[...s.log,entry],actions:[...s.actions,'c'+index],journeys:{...j,stage,decisions,completedDay:stage===3?s.day:j.completedDay,earned:j.earned||stage===3&&!failed&&decisions.filter(i=>i<2).length>=2,pending:{...p,done:true}},rhythm:{...s.rhythm,clock:p.at+c.minutes,spent:s.rhythm.spent+c.minutes,lastActivity:null}};
}
function canOpen(s){const j=s.journeys;return !!j&&!j.pending&&j.stage<3&&s.phase==='outcome'&&!s.failed&&!s.lottery?.won&&s.day>=j.startDay+[2,5,9][j.stage]&&B.freeMinutes(s)>=20&&!s.relationships?.pending&&!s.campusRevision?.proposal&&!s.evolution?.care&&!s.evolution?.breakPrevious&&!s.medical&&!s.wellness?.mouse&&!s.rhythm?.pending&&!s.rhythm?.lastActivity&&!s.eventId.startsWith('love-')&&!s.eventId.startsWith('evo-')&&!s.eventId.startsWith('term-');}
function next(s){const j=s.journeys,p=j?.pending;if(p){if(s.phase!=='outcome'||!p.done)throw Error('请先完成这段校园日常');if(s.failed)return B.next(s);return{...s,...p.previous,journeys:{...j,pending:null},actions:[...s.actions,'n']};}if(canOpen(s)){const pending={stage:j.stage,at:s.rhythm.clock,free:B.freeMinutes(s),done:false,previous:{eventId:s.eventId,phase:s.phase,outcome:s.outcome}};return{...s,eventId:'journey-'+j.backgroundId+'-'+j.stage,phase:'choice',outcome:null,journeys:{...j,pending},actions:[...s.actions,'n']};}return B.next(s);}
function availableActivities(s){return s.journeys?.pending?[]:B.availableActivities(s);}
function startActivity(s,key){if(s.journeys?.pending)throw Error('请先完成这段校园日常');return B.startActivity(s,key);}
function routeAward(s){const j=s.journeys;return j?.earned?endings.find(e=>e.id==='journey-'+j.backgroundId):null;}
function achievements(s){const list=B.achievements(s),e=routeAward(s);return e&&['dayEnd','ending'].includes(s.phase)?[...list,e]:list;}
function ending(s){const e=routeAward(s);return e&&!s.failed&&s.journeys.completedDay===s.day?e:B.ending(s);}
function restore(raw){if(!raw?.journeys)return B.restore(raw);try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);const upgrades={h:'enableCare',b:'enableBalance',v:'enableRomance',p:'enableStory',y:'enableRhythm',f:'enableFood',i:'enableIllness',q:'enableMeetings',w:'enableWellness',u:'enableCampus',t:'enableEvolution',j:'enableLottery',k:'enableCampusRevision',g:'enableDining',z:'enableSocialUpdate',R:'enableRelationships',e:'enableEconomy',l:'enableLife'};
 for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=B.continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='m')s=B.enableCharacter(s,raw.character.selected,raw.character.fresh);else if(a==='J')s=enableJourneys(s,raw.journeys.backgroundId);else if(upgrades[a])s=B[upgrades[a]](s);else if(typeof a==='string'&&a.startsWith('a:'))s=startActivity(s,a.slice(2));else return null;}return JSON.stringify(s)===JSON.stringify(raw)?s:null;}catch{return null;}}
const events=[...B.events,...Object.keys(stories).flatMap(id=>stories[id].map((_,i)=>({id:'journey-'+id+'-'+i})))],api={...B,backgrounds,availableBackgrounds,create,enableJourneys,getScene,choose,next,availableActivities,startActivity,achievements,ending,restore,valid:s=>restore(s)!==null,endings:[...B.endings,...endings],events,eventCount:events.length};root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
