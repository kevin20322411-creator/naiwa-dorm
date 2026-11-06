(function(root){
'use strict';
// These fictional curricula and workshops extend the released five majors.
// Helpers are pure: no random draws, player state, clock or rewards are changed here.
const clone=x=>JSON.parse(JSON.stringify(x));
const option=(id,label,extra={})=>({id,label,...extra}),field=(id,label,options)=>({id,label,options});
const majorData=[
 ['math','数学与应用数学','📐','从数与图形出发，把校园的小问题写成清楚的模型。','route',[
  ['analysis','数学分析入门','理科楼 301','函数变化观察页','foundation'],['algebra','高等代数基础','理科楼 302','向量与矩阵练习页','foundation'],['geometry','解析几何','理科楼 303','坐标与曲线联系图','foundation'],['discrete','离散数学导论','理科楼 304','校园路线图','core'],['probability','概率论基础','理科楼 305','简单随机试验记录','core'],['numerical','数值计算入门','理科楼机房','近似值与误差比较页','core'],['modeling','数学建模实践','理科楼研讨室','有约束的校园路线方案','practice'],['data','数据分析实践','理科楼机房','校园数据与结论核对表','practice']]],
 ['law','法学','⚖️','从阅读规则到核对条款，在模拟任务中练习清楚表达。','contract',[
  ['intro','法学导论','法学院 201','概念与规则阅读卡','foundation'],['constitution','宪法学基础','法学院 202','制度框架学习页','foundation'],['civil','民法学入门','法学院 203','模拟关系分析图','core'],['criminal','刑法学导论','法学院 204','课堂案例阅读札记','core'],['administrative','行政法学基础','法学院 205','程序与职责联系图','core'],['procedure','诉讼程序导论','法学院 206','模拟流程顺序卡','core'],['contract','模拟条款写作','法学院研讨室','校园虚构委托修订稿','practice'],['debate','模拟论证实践','法学院实训室','事实与理由核对表','practice']]],
 ['electronics','电子信息工程','💡','从电路、信号到器件，做出能解释的小装置。','circuit',[
  ['circuits','电路基础','电子楼 201','简单回路连接图','foundation'],['physics','大学物理基础','理科楼 101','电与磁观察记录','foundation'],['analog','模拟电子技术入门','电子楼 202','元件与信号比较页','core'],['digital','数字电子技术基础','电子楼 203','逻辑门状态表','core'],['signals','信号与系统导论','电子楼 204','简单波形观察页','core'],['communication','通信原理入门','电子楼 205','信息传递流程图','core'],['lab','电路搭建实践','电子楼实验室','可点亮的模拟LED回路','practice'],['embedded','嵌入式入门实践','电子楼机房','校园提醒器原型图','practice']]],
 ['journalism','新闻学','🎙️','从现场、记录和采访出发，让报道中的每句话有出处。','reporting',[
  ['intro','新闻学概论','新闻楼 201','报道要素阅读卡','foundation'],['history','新闻史导论','新闻楼 202','媒介发展时间页','foundation'],['communication','传播学基础','新闻楼 203','信息传播路径图','core'],['interview','采访基础','新闻楼研讨室','有来源的采访笔记','core'],['writing','新闻写作基础','新闻楼 204','事实与标题核对稿','core'],['ethics','新闻伦理导论','新闻楼 205','署名与来源讨论卡','core'],['verification','校园报道核验实践','新闻楼编辑室','现场与记录核验表','practice'],['audio','融媒体报道实践','新闻楼录音室','校园短报道成稿','practice']]],
 ['music','音乐学','🎵','从听辨、节奏到旋律，把听见的想法写进小作品。','melody',[
  ['theory','基本乐理','艺术楼 301','音高与时值练习页','foundation'],['solfege','视唱练耳','艺术楼琴房','短旋律听辨记录','foundation'],['harmony','和声入门','艺术楼 302','简单和弦连接页','core'],['history','音乐史导论','艺术楼 303','作品与时代聆听卡','core'],['analysis','音乐作品分析','艺术楼 304','短乐句结构观察页','core'],['folk','民族音乐概论','艺术楼 305','音乐风格比较笔记','core'],['rhythm','节奏与合奏实践','艺术楼排练室','四拍节奏合作记录','practice'],['melody','旋律编写实践','艺术楼琴房','可试听的校园短旋律','practice']]]
];
const titles={math:'校园路线研究室',law:'模拟委托核对桌',electronics:'小灯泡实验台',journalism:'校园事实核验台',music:'钟楼四拍小乐室'};
const kinds={math:'route',law:'contract',electronics:'circuit',journalism:'reporting',music:'melody'};
const chapters={
 math:[['给送书蛙找条近路','图书管理员：书有点重。','从校门到书屋，选总长度最短的路线。'],['这回还要经过书屋','社团同学：顺路取本书。','从校门到礼堂，经过书屋后选最短路线。'],['修路日的绕行方案','后勤同学：台阶暂时封闭。','从校门到礼堂，避开封闭路段后选最短路线。']],
 law:[['投影仪几点还','社团同学：约好的时间对不上。','按模拟委托要求，选出归还条款并改正时间。'],['海报到底做几张','美术社：数量写少了一张。','按模拟委托要求，修正海报数量条款。'],['配音稿交付到哪里','广播社：文件不要发错地方。','按模拟委托要求，修正配音稿交付位置。']],
 electronics:[['让第一盏灯亮起来','维修部：先接成一个回路。','闭合开关、正向接灯，选电阻使电流在3–6毫安。'],['换了电源要重算','维修部：今天用5伏电源。','闭合开关、正向接灯，选电阻使电流在3–6毫安。'],['灯脚这次反过来了','维修部：再核对一次方向。','用3伏电源闭合回路，正向接灯并使电流在3–6毫安。']],
 journalism:[['延长开放，是哪一天','校报值班：群里传成通宵了。','选择当日公告作证据，刊出范围准确的标题。'],['书摊有多少个','校报值班：先数完再写。','选择现场逐一清点记录，刊出不夸大的标题。'],['雨天活动是否改期','校报值班：早上的旧消息过时了。','选择最新的社团通知，刊出改期报道。']],
 music:[['钟楼的第一句招呼','音乐社：这句少了第二个音。','先听示范，补齐第二音和它的拍数。'],['半拍也要站稳','音乐社：第三音轻轻接上。','先听示范，补齐第三音和它的拍数。'],['给乐句一个落点','音乐社：最后一个音等你。','先听示范，补齐第四音和它的拍数。']]
};
function chapter(id,stage){const c=chapters[id]?.[stage];return c?{id:id+'-'+(stage+1),title:c[0],brief:c[1],request:c[2],kind:kinds[id],duration:12}:null;}
const routeNode=(id,label,x,y)=>({id,label,x,y}),edge=(from,to,length,blocked=false)=>({from,to,length,...(blocked?{blocked:true}:{})});
function routeConfig(stage){
 const nodes=[routeNode('gate','校门',30,90),routeNode('garden','花园',150,25),routeNode('library','书屋',150,155),routeNode('hall','礼堂',285,90)];
 const edges=[edge('gate','garden',80),edge('garden','hall',90,stage===2),edge('gate','library',120),edge('library','hall',100),edge('garden','library',50),edge('gate','hall',260)];
 const routes=stage===0?[{id:'garden',label:'校门 → 花园 → 书屋',path:['gate','garden','library']},{id:'direct',label:'校门 → 书屋',path:['gate','library']},{id:'hall',label:'校门 → 礼堂 → 书屋',path:['gate','hall','library']}]:stage===1?[{id:'garden',label:'校门 → 花园 → 礼堂',path:['gate','garden','hall']},{id:'library',label:'校门 → 书屋 → 礼堂',path:['gate','library','hall']},{id:'both',label:'校门 → 花园 → 书屋 → 礼堂',path:['gate','garden','library','hall']}]:[{id:'garden',label:'校门 → 花园 → 礼堂',path:['gate','garden','hall']},{id:'library',label:'校门 → 书屋 → 礼堂',path:['gate','library','hall']},{id:'direct',label:'校门 → 礼堂',path:['gate','hall']}];
 return{nodes,edges,routes,goal:chapters.math[stage][2],stage,answer:{route:stage===0?'direct':'library'},optimalLength:stage===0?120:220,fields:[field('route','选择路线',routes.map(r=>option(r.id,r.label)))],initial:{route:null},submitAction:'deliver',submitLabel:'交付路线图'};
}
function contractConfig(stage){
 const tasks=[
  {documentTitle:'投影仪借用 · 模拟文本',reference:'委托要求：借投影仪一台，周五17:00前归还到活动室。',clauses:[['item','物品：投影仪一台。'],['time','归还时间：周六17:00前。'],['place','归还位置：活动室。']],target:'time',revisions:['归还时间：周五17:00前。','归还时间：周五20:00前。','归还时间：下周一17:00前。']},
  {documentTitle:'社团海报 · 模拟文本',reference:'委托要求：制作3张海报，周四18:00前送到美术社。',clauses:[['count','制作数量：2张海报。'],['time','交付时间：周四18:00前。'],['place','交付位置：美术社。']],target:'count',revisions:['制作数量：3张海报。','制作数量：4张海报。','制作数量：1张海报。']},
  {documentTitle:'广播配音 · 模拟文本',reference:'委托要求：录制1分钟配音，周三12:00前上传社团共享盘。',clauses:[['length','配音长度：1分钟。'],['place','交付位置：私人聊天窗口。'],['time','交付时间：周三12:00前。']],target:'place',revisions:['交付位置：社团共享盘。','交付位置：校园留言墙。','交付位置：私人聊天窗口。']}
 ][stage];
 return{...tasks,clauses:tasks.clauses.map(([id,text])=>({id,text})),answer:{clause:tasks.target,revision:'match'},fields:[field('clause','需要改哪一条',tasks.clauses.map(([id,text])=>option(id,text))),field('revision','替换为',[option('match',tasks.revisions[0]),option('other',tasks.revisions[1]),option('unchanged',tasks.revisions[2])])],initial:{clause:null,revision:null},submitAction:'deliver',submitLabel:'交付核对稿'};
}
function circuitConfig(stage){return{goal:chapters.electronics[stage][2],supplyVoltage:stage===1?5:3,answer:{switch:'closed',component:stage===1?'1000':'220',polarity:'forward'},fields:[field('switch','开关',[option('open','断开'),option('closed','闭合')]),field('component','串联元件',[option('220','220Ω 电阻'),option('1000','1000Ω 电阻'),option('wire','一段导线 · 0Ω')]),field('polarity','LED方向',[option('forward','正向 · 长脚接正极一侧'),option('reverse','反向 · 短脚接正极一侧')])],initial:stage===0?{switch:null,component:null,polarity:null}:{switch:null,component:'220',polarity:stage===1?'forward':'reverse'},submitAction:'deliver',submitLabel:'测试并收好电路图'};}
function reportingConfig(stage){
 const data=[
  {topic:'图书馆周五开放时间',brief:'核验本周五的闭馆时间。',evidence:[['record','馆方当日公告','记录','周五开放至21:00；其余日期安排不变。',true],['onsite','昨天20:00的现场','现场','昨天20:00闭馆，不能直接代表本周五。',false],['rumor','群聊转述','传闻','听说以后天天通宵。',false]],source:'record',headlines:['图书馆本周五延长开放至21时','图书馆从此全天通宵开放','图书馆每天20时闭馆'],copy:'馆方当日公告显示，本周五图书馆开放至21:00，其余日期安排不变。'},
  {topic:'校园旧书市集',brief:'报道今天现场开摊的数量。',evidence:[['onsite','15:00逐摊清点表','现场','今天15:00，在市集逐一清点到8个开摊摊位。',true],['record','上周报名表','记录','报名表有12组；不能代表今天实际开摊。',false],['rumor','路过同学猜测','传闻','大概有上百个摊吧。',false]],source:'onsite',headlines:['今天15时旧书市集有8个摊位开摊','旧书市集每天都有12个摊位','校园旧书市集摊位超过一百'],copy:'记者今天15:00在校园旧书市集逐一清点，现场共有8个摊位开摊。'},
  {topic:'露天电影雨天改期',brief:'核验今天18:00更新后的安排。',evidence:[['record','18:00社团更新通知','记录','因雨，露天电影改至周日19:00；地点仍为草坪。',true],['onsite','上午搭台照片','现场','上午舞台搭建中；拍摄早于改期通知。',false],['rumor','未署名群消息','传闻','电影永久取消了。',false]],source:'record',headlines:['因雨露天电影改至周日19时','露天电影今晚照常举行','露天电影今后永久取消'],copy:'社团18:00更新通知称，受降雨影响，露天电影改至周日19:00，地点仍为草坪。'}
 ][stage];
 return{...data,evidence:data.evidence.map(([id,label,type,detail,verified])=>({id,label,type,detail,verified})),answer:{evidence:data.source,headline:'accurate'},fields:[field('evidence','采用哪份证据',data.evidence.map(([id,label,type])=>option(id,type+' · '+label))),field('headline','刊出哪条标题',[option('accurate',data.headlines[0]),option('overclaim',data.headlines[1]),option('rumor',data.headlines[2])])],initial:{evidence:null,headline:null},submitAction:'publish',submitLabel:'核验并出稿'};
}
const midi={C4:60,D4:62,E4:64,G4:67},solfege={C4:'do',D4:'re',E4:'mi',G4:'so'};
const note=(name,beats,gap=false)=>({name:name||'空位',midi:midi[name]??null,frequency:name?440*Math.pow(2,(midi[name]-69)/12):0,beats,gap});
function melodyConfig(stage){
 const names=[['C4','E4','G4','E4'],['C4','D4','E4','C4'],['G4','E4','D4','C4']][stage],beats=[[1,1,1,1],[1,.5,.5,2],[.5,.5,1,2]][stage],gap=[1,2,3][stage];
 return{title:chapters.music[stage][0],names,beats,gap,bpm:108,answer:{note:names[gap],beat:String(beats[gap])},fields:[field('note','空位的音高',['C4','D4','E4','G4'].map(n=>option(n,solfege[n]+' · '+n))),field('beat','这个音占几拍',[option('0.5','半拍'),option('1','一拍'),option('2','两拍')])],initial:{note:null,beat:null},submitAction:'deliver',submitLabel:'保存这句旋律'};
}
function config(id,stage){return id==='math'?routeConfig(stage):id==='law'?contractConfig(stage):id==='electronics'?circuitConfig(stage):id==='journalism'?reportingConfig(stage):id==='music'?melodyConfig(stage):null;}
function preview(id,stage,c,selection){
 if(id==='math'){
  const route=c.routes.find(r=>r.id===selection.route),path=route?.path||[],pathEdges=path.slice(1).map((to,i)=>c.edges.find(e=>e.from===path[i]&&e.to===to||e.to===path[i]&&e.from===to)),totalLength=route?pathEdges.reduce((n,e)=>n+e.length,0):null;
  const constraints=[{label:stage===0?'从校门到书屋':'从校门到礼堂',met:!!route&&path[0]==='gate'&&path.at(-1)===(stage===0?'library':'hall')}];
  if(stage===1)constraints.push({label:'经过书屋',met:path.includes('library')});if(stage===2)constraints.push({label:'避开封闭路段',met:!!route&&pathEdges.every(e=>!e.blocked)});
  return{goal:c.goal,nodes:clone(c.nodes),edges:clone(c.edges),routes:clone(c.routes),selectedRouteId:route?.id||null,path:clone(path),pathEdges:clone(pathEdges),totalLength,unit:'米',constraints,eligible:constraints.every(c=>c.met)};
 }
 if(id==='law'){
  const revisionText=c.fields[1].options.find(o=>o.id===selection.revision)?.label||'',clauses=c.clauses.map(r=>({...r,text:r.id===selection.clause&&revisionText?revisionText:r.text,selected:r.id===selection.clause,changed:r.id===selection.clause&&!!revisionText&&r.text!==revisionText}));
  return{documentTitle:c.documentTitle,reference:c.reference,clauses,selectedClauseId:selection.clause,revisionText,status:!selection.clause||!selection.revision?'尚未完成核对':selection.clause===c.answer.clause&&selection.revision===c.answer.revision?'与模拟委托要求一致':'还有条款与模拟委托要求不一致'};
 }
 if(id==='electronics'){
  // Idealized 2 V LED model. A zero-resistance branch has no finite predicted
  // current in this model; do not invent a measured value for it.
  const closed=selection.switch==='closed',forward=selection.polarity==='forward',present=['220','1000','wire'].includes(selection.component),resistance=present?Number(selection.component==='wire'?0:selection.component):null,current=closed&&forward&&present?(resistance===0?null:Math.round((c.supplyVoltage-2)/resistance*100000)/100):0,ledOn=closed&&forward&&present&&current>=1&&current<=10;
  const nodes=[routeNode('positive','电源 +',28,90),routeNode('switch','开关',125,25),routeNode('resistor','电阻',240,25),routeNode('led','LED',285,145),routeNode('negative','电源 −',28,145)],ids=['positive','switch','resistor','led','negative'];
  return{goal:c.goal,nodes,wires:ids.slice(1).map((to,i)=>({from:ids[i],to,active:closed&&present&&forward})),switches:[{id:'switch',label:'开关',closed}],component:{id:selection.component,label:c.fields[1].options.find(o=>o.id===selection.component)?.label||'尚未接入元件'},polarity:selection.polarity,supplyVoltage:c.supplyVoltage,current,closed,ledOn,status:!closed?'开关断开 · LED未亮':!present?'尚未接入元件':!forward?'LED方向相反 · 未亮':resistance===0?'尚未限流 · 请串联电阻':current>10?'电流过高 · 请增大电阻':ledOn?'LED已点亮 · '+current+'毫安':'电流不足 · LED未亮'};
 }
 if(id==='journalism'){
  const chosen=c.evidence.find(e=>e.id===selection.evidence),headline=c.fields[1].options.find(o=>o.id===selection.headline)?.label||'标题待定',accurate=selection.headline==='accurate';
  return{topic:c.topic,brief:c.brief,evidence:c.evidence.map(e=>({...e,selected:e.id===selection.evidence})),headline,copy:!chosen?'先选出能支持报道的证据。':accurate&&chosen.verified?c.copy:'据'+chosen.label+'：'+chosen.detail+' 拟刊标题：'+headline+'。',status:!chosen||!selection.headline?'待核验':chosen.verified&&accurate?'证据与标题范围一致':'来源或标题范围还需要核对'};
 }
 if(id==='music'){
  const notes=c.names.map((n,i)=>note(i===c.gap?selection.note:n,i===c.gap?Number(selection.beat)||c.beats[i]:c.beats[i],i===c.gap));
  return{title:c.title,notes,referenceNotes:c.names.map((n,i)=>note(n,c.beats[i])),beatSequence:notes.map(n=>n.beats),bpm:c.bpm,gap:[c.gap],scoreText:notes.map(n=>solfege[n.name]||'?').join(' · '),status:!selection.note||!selection.beat?'尚未补全':selection.note===c.answer.note&&selection.beat===c.answer.beat?'音高与节奏接上了':'这句旋律与示范还有差别'};
 }
 return null;
}
function score(id,p,c){
 if(id==='math')return p.preview.eligible?(p.preview.totalLength===c.optimalLength?3:1):0;
 if(id==='law')return(p.selection.clause===c.answer.clause?1:0)+(p.selection.clause===c.answer.clause&&p.selection.revision===c.answer.revision?2:0);
 if(id==='electronics')return(p.preview.closed?1:0)+(p.preview.ledOn?1:0)+(p.preview.ledOn&&p.preview.current>=3&&p.preview.current<=6?1:0);
 if(id==='journalism')return(p.selection.evidence===c.answer.evidence?1:0)+(p.selection.evidence===c.answer.evidence&&p.selection.headline===c.answer.headline?2:0);
 if(id==='music')return(p.selection.note===c.answer.note?1:0)+(p.selection.beat===c.answer.beat?2:0);
 return 0;
}
function rewards(id,good,skipped){
 if(id==='math')return{mods:{study:skipped?1:good?3:1},project:!skipped&&good?1:0};
 if(id==='law')return{mods:{social:skipped?1:good?3:1,study:!skipped&&good?1:0},project:0};
 if(id==='electronics')return{mods:{study:!skipped&&good?1:0},project:skipped?1:good?3:1};
 if(id==='journalism')return{mods:{social:skipped?1:good?2:1,study:!skipped&&good?1:0},project:0};
 return{mods:{mood:skipped?1:good?3:1,social:!skipped&&good?1:0},project:0};
}
function feedback(id,p,points,c){
 if(id==='math')return points===3?'路线满足条件，总长'+p.preview.totalLength+'米。送书蛙：这条路记住了。':'路线图已收好；满足条件的最短路线是'+c.routes.find(r=>r.id===c.answer.route).label+'，共'+c.optimalLength+'米。';
 if(id==='law')return points===3?'条款已与模拟委托对齐，核对稿收好了。':'核对稿已保存；本次应修正“'+c.clauses.find(r=>r.id===c.answer.clause).text+'”，改为“'+c.revisions[0]+'”。';
 if(id==='electronics')return points===3?'LED亮了，电流'+p.preview.current+'毫安，电路图收好了。':'保留这次电路图；闭合开关、正向接灯并串联'+c.answer.component+'Ω电阻，可达到本次3–6毫安的目标。';
 if(id==='journalism')return points===3?'报道已出稿，证据和标题都能对上。':'练习稿已收好；本次应核对'+c.evidence.find(e=>e.id===c.answer.evidence).label+'，标题写作“'+c.headlines[0]+'”。';
 return points===3?'四拍乐句接好了，可以再听一遍自己的小作品。':'旋律已保存；空位应为'+solfege[c.answer.note]+'（'+c.answer.note+'），'+c.answer.beat+'拍。';
}
const catalog={majorData,titles,kinds,chapters,has:id=>Object.hasOwn(kinds,id),chapter,config,preview,score,rewards,feedback,demonstration:c=>clone(c.answer)};
root.DormMajorCatalog=catalog;if(typeof module!=='undefined'&&module.exports)module.exports=catalog;
})(typeof globalThis!=='undefined'?globalThis:this);
