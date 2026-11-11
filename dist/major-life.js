(function(root){
'use strict';
// The published school engine stays frozen. One validated boundary starts this
// optional story layer; subsequent actions replay without growing new snapshots.
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./school.js');
const extra=browser?root.DormMajorCatalog:require('./major-catalog.js'),expanded=id=>!!extra?.has(id);
const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const now=s=>s.rhythm?.clock||0,clock=n=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const previous=s=>({phase:s.phase,eventId:s.eventId,outcome:s.outcome}),duration=12;
const titles={cs:'校园工具维修部',bio:'小花园观察站',business:'钟楼小摊营业中',literature:'校刊最后一遍',design:'校园海报工作室'};
const kinds={cs:'debug',bio:'experiment',business:'business',literature:'editing',design:'design'};
const chapters={
 cs:[['排队人数，怎么多了一个蛙','食堂阿姨：屏幕总说多一位，难道把锅也算进去了？','让屏幕显示真实排队人数。'],['电量换算，不是拼数字','机房同学：每格代表 10%，三格却只显示 13%。','把电量格数乘上每格百分比。'],['空座提醒，别让空气占座','图书馆同学：明明零个空座，它还在热情招手。','只有空座数大于 0 时显示“有座”。']],
 bio:[['豆苗为什么短一点','小花园管理员：两盘豆苗都叫“努力生长”，身高却不同。','选择只改变盐水条件的对照，并给出有证据的结论。'],['光照与叶片观察','社团想做植物展签：别把“看着像”写成“已经证明”。','比较只改变光照的样本；结论限于本次观察。'],['池水样本，数完再说','生态社团：看到一杯水，先别宣布研究完整片池塘。','比较同体积的水样，不把小样本推成普遍规律。']],
 business:[['第一摊：柠檬水试营业','钟楼义卖摊：杯子不收摊位费，但柠檬也不会凭空长出来。','模拟本金 16 元，单杯成本 2 元；兼顾利润和余货。'],['第二摊：书签别囤成墙','校刊摊主：上回卖水，这回卖一点精神食粮。','模拟本金 21 元，单枚成本 3 元；按需求定价进货。'],['第三摊：徽章收官','社团给了最后一箱徽章：今天的对手是自己的库存。','模拟本金 24 元，单枚成本 4 元；留下清楚的账本。']],
 literature:[['食堂招募，不要“在接在厉”','校刊编辑：这张招募启事差一点就要上墙了。','点出错字所在片段，改成规范表达。'],['图书馆标题，谁在“迫不急待”','图书馆来稿：读者可以心急，标题可不能跟着急。','找到标题中的错字，并选择合适的修订。'],['毕业特刊，“一愁莫展”的封面','编辑递来最后一版：我们可以有愁，成语先写对。','找出成语错误，交付能够直接刊印的短句。']],
 design:[['读书会：安静也要被看见','图书馆委托：海报别喊太大声，读者会自己走过来。','用纸墨配色、居中版式和书本图形制作读书会海报。'],['校园音乐夜：先让标题发光','社团委托：远处的人先看见活动，再看见我们的审美。','用夜光配色、大标题版式和音符图形传达音乐夜。'],['旧物交换：让信息排好队','环保社团委托：东西可以旧，时间地点得清楚。','用草木配色、分栏版式和叶片图形呈现交换市集。']]
};
const option=(id,label,extra={})=>({id,label,...extra}),field=(id,label,options)=>({id,label,options});
const palettes=[option('paper','纸墨 · 米白与深墨',{bg:'#f6efd9',ink:'#263a38',accent:'#bb6845'}),option('neon','夜光 · 深蓝与亮黄',{bg:'#162449',ink:'#fff8df',accent:'#f4ce4b'}),option('garden','草木 · 淡绿与森林绿',{bg:'#e4f1db',ink:'#254d37',accent:'#d08043'})];
const elements=[option('book','书本',{glyph:'📖'}),option('note','音符',{glyph:'♫'}),option('leaf','叶片',{glyph:'🍃'})];
function chapter(s){const id=s.school?.majorId,stage=s.majorLife?.completedCount||0;if(expanded(id))return extra.chapter(id,stage);const c=chapters[id]?.[stage];return c?{id:id+'-'+(stage+1),title:c[0],brief:c[1],request:c[2],kind:kinds[id],duration}:null;}
function config(s){
 const id=s.school.majorId,stage=s.majorLife.completedCount,r=hash(s.seed+':major:'+id+':'+stage)%3;
 if(expanded(id))return extra.config(id,stage);
 if(id==='cs'){
  const n=4+r,units=3,slots=0;
  const options=stage===0?[option('correct','显示 students'),option('plus','显示 students + 1'),option('minus','显示 students - 1')]:stage===1?[option('plus','用格数 + 每格百分比'),option('correct','用格数 × 每格百分比'),option('divide','用格数 ÷ 每格百分比')]:[option('equal','条件 seats === 0'),option('ge','条件 seats >= 0'),option('correct','条件 seats > 0')];
  return{fields:[field('patch','选择修复',options)],initial:{patch:null},n,units,slots,submitAction:'run',submitLabel:'运行并交付'};
 }
 if(id==='bio'){
  const rows=stage===0?[['A','清水豆苗','同品种、同光照、同温度；清水',5+r,'厘米'],['B','盐水豆苗','同品种、同光照、同温度；盐水',2+r,'厘米'],['C','另一盘豆苗','不同品种、弱光、盐水',1+r,'厘米']]:stage===1?[['A','普通光照','同品种、同水量；普通光照',7+r,'片叶'],['B','弱光','同品种、同水量；弱光',4+r,'片叶'],['C','弱光少水','不同品种、少水；弱光',2+r,'片叶']]:[['A','池边水样','同一时段；10 毫升',8+r,'个观察点'],['B','池心水样','同一时段；10 毫升',4+r,'个观察点'],['C','另一杯池心水','另一时段；20 毫升',9+r,'个观察点']];
  const samples=rows.map(([id,label,conditions,value,unit])=>({id,label,conditions,value,unit,dots:value}));
  const correct=stage===0?'本次盐水组豆苗更短；仍需重复实验':stage===1?'本次弱光组叶片更少；仍需重复观察':'本次等体积池边样本观察点更多；不能代表整个池塘';
  return{samples,correct,fields:[field('control','选择能比较的样本',[option('AB','A 与 B：其余条件一致'),option('AC','A 与 C：条件有多处不同'),option('BC','B 与 C：条件有多处不同')]),field('conclusion','写下结论',[option('universal','从此可以断定所有植物 / 所有池水都一样'),option('evidence',correct),option('reverse','B 的数值更大，已证明原因')])],initial:{control:null,conclusion:null},submitAction:'observe',submitLabel:'提交观察记录'};
 }
 if(id==='business'){
  const cost=stage+2,budget=[16,21,24][stage],prices=[cost+1,cost+2,cost+3],stocks=[[4,6,8],[3,5,7],[2,4,6]][stage];
  return{cost,budget,r,fields:[field('price','定价',[...prices.map(n=>option(String(n),n+' 元 / 件'))]),field('stock','进货量',[...stocks.map(n=>option(String(n),n+' 件 · 进货 '+n*cost+' 元'))])],initial:{price:String(prices[0]),stock:String(stocks[0])},submitAction:'sell',submitLabel:'开摊并结账'};
 }
 if(id==='literature'){
  const texts=[['食堂招新：','在接在厉','，热饭常在。'],['新书上架，','迫不急待','想读完。'],['封面卡住了？别','一愁莫展','，先喝口水。']][stage],correct=['再接再厉','迫不及待','一筹莫展'][stage],wrong=['再接再励','迫不急待','一愁莫展'][stage];
  return{texts,correct,fields:[field('token','点出需要修改的片段',texts.map((t,i)=>option(String(i),t))),field('replacement','改成什么',[option('correct',correct),option('wrong',wrong),option('other',['在接在励','迫不及代','一筹莫战'][stage])])],initial:{token:null,replacement:null},submitAction:'publish',submitLabel:'修订并交刊'};
 }
 return{fields:[field('palette','配色',palettes),field('layout','版式',[option('center','居中 · 安静聚焦'),option('headline','大标题 · 远处可读'),option('grid','分栏 · 信息有序')]),field('element','主图形',elements)],initial:{palette:null,layout:null,element:null},submitAction:'publish',submitLabel:'制作并交付海报'};
}
function preview(s,c,selection){
 const stage=s.majorLife.completedCount,id=s.school.majorId;
 if(expanded(id))return extra.preview(id,stage,c,selection);
 if(id==='cs'){
  const p=selection.patch;let code,output,expected;
  if(stage===0){code='const students = '+c.n+';\nshow('+(p==='correct'?'students':p==='minus'?'students - 1':'students + 1')+');';output=String(p==='correct'?c.n:p==='minus'?c.n-1:c.n+1);expected=String(c.n);}
  else if(stage===1){code='const bars = '+c.units+';\nconst perBar = 10;\nshow(bars '+(p==='correct'?'*':p==='divide'?'/':'+')+' perBar);';output=String(p==='correct'?c.units*10:p==='divide'?c.units/10:c.units+10)+'%';expected=String(c.units*10)+'%';}
  else{const test=p==='correct'?c.slots>0:p==='equal'?c.slots===0:c.slots>=0;code='const seats = '+c.slots+';\nshow(seats '+(p==='correct'?'>':p==='equal'?'===':'>=')+' 0 ? "有座" : "满座");';output=test?'有座':'满座';expected=c.slots>0?'有座':'满座';}
  return{code,output,expected,status:!p?'尚未选择修复':p==='correct'?'本次与边界用例通过':'本次或零值边界用例未通过',tests:stage===2?[{input:0,expected:'满座',output:selection.patch==='correct'?'满座':'有座'},{input:1,expected:'有座',output:selection.patch==='equal'?'满座':'有座'}]:[]};
 }
 if(id==='bio')return{samples:c.samples,control:selection.control||'尚未选择',result:c.fields[1].options.find(o=>o.id===selection.conclusion)?.label||'观察数值，先保留判断。'};
 if(id==='business'){
  const price=Number(selection.price),stock=Number(selection.stock),demand=Math.max(1,7-stage-Math.max(0,price-c.cost-1)*2+c.r),sold=Math.min(stock,demand),expense=stock*c.cost,revenue=sold*price;
  return{budget:c.budget,cost:c.cost,price,stock,demand,sold,revenue,expense,leftover:stock-sold,profit:revenue-expense,balance:c.budget-expense+revenue,caption:'模拟账本：需求由本章固定客流决定；不会扣玩家饭钱。'};
 }
 if(id==='literature'){
  const tokens=c.texts.map((text,i)=>({id:String(i),text})),replacement=c.fields[1].options.find(o=>o.id===selection.replacement)?.label;
  if(selection.token!==null&&replacement)tokens[Number(selection.token)].text=replacement;
  return{original:c.texts.join(''),text:tokens.map(t=>t.text).join(''),tokens,corrections:replacement&&selection.token!==null?[{from:c.texts[Number(selection.token)],to:replacement}]:[],headline:['食堂招募启事','图书馆新书讯','毕业特刊校样'][stage]};
 }
 return{palette:clone(palettes.find(p=>p.id===selection.palette)||palettes[0]),layout:selection.layout||'center',element:clone(elements.find(e=>e.id===selection.element)||elements[0]),title:['把一页书读成一段好时光','今晚，让钟楼听见音乐','旧物交换 · 新的相遇'][stage],subtitle:['校园读书会','钟楼音乐夜','校园交换市集'][stage],footer:['周三 16:00 · 图书馆一楼','周五 19:00 · 钟楼草坪','周六 14:00 · 活动中心'][stage]};
}
function disabledReason(s){
 if(!s.majorLife)return'加入新版课表后开启专业故事。';
 if(s.majorLife.completedCount>=3)return'三章委托已完成，作品都收进专业手册了。';
 if(s.majorLife.pending)return'先完成眼前这份专业委托。';
 if(s.phase!=='outcome'||!s.outcome)return'先处理眼前的校园安排。';
 if(s.failed||s.lottery?.won||s.stats.health<25||s.stats.energy<12||s.stats.mood<12||s.stats.study<8)return'先照顾好身体和状态，再接委托。';
 if(now(s)>=1260)return'今天太晚了，明天再接委托。';
 if(s.school?.pending||s.school?.returnTo||s.outcome.schoolCourse||s.miniGames?.pending||s.miniGames?.returnOutcome||s.campusLife?.pending||s.relationships?.pending||s.rhythm?.pending||s.journeys?.pending||s.medical||s.evolution?.care||s.wellness?.mouse||s.campusRevision?.proposal)return'先完成眼前的课程、就诊或校园活动。';
 if(B.freeMinutes(s)<duration)return'距下一项安排不足 12 分钟，换个空闲时段再来。';
 return'';
}
function majorView(s){
 const majorId=s.school?.majorId,name=B.majors.find(m=>m.id===majorId)?.name||'尚未选择专业',enabled=!!s.majorLife,c=enabled?chapter(s):null,reason=disabledReason(s),count=s.majorLife?.completedCount||0;
 return{enabled,majorId,name,majorLabel:name,title:titles[majorId]||extra?.titles[majorId]||'专业故事',stage:count,completedCount:count,progress:count,total:3,chapter:c,next:c,works:clone(s.majorLife?.works||[]),canStart:!reason,available:!reason,disabledReason:reason,reason,pending:s.majorLife?.pending?clone(s.majorLife.pending):null};
}
function record(s,n,name,args=[]){return n===s?s:{...n,actions:[...s.actions,'major-'+name+':'+encodeURIComponent(JSON.stringify(args))]};}
function enableMajorLife(s){
 if(s.majorLife||s.school?.revision!==3||s.phase==='ending'||s.failed||s.school.pending||s.miniGames?.pending)return s;
 return{...s,actions:[...s.actions,'major-v1'],majorLife:{revision:1,base:clone(s),completedCount:0,pending:null,returnTo:null,works:[]}};
}
function create(...args){return enableMajorLife(B.create(...args));}
function startMajor(s){
 const reason=disabledReason(s);if(reason)throw Error(reason);const c=config(s),ch=chapter(s),selection=clone(c.initial),pending={...ch,majorId:s.school.majorId,chapter:s.majorLife.completedCount,fields:clone(c.fields),selection,preview:preview(s,c,selection),submitAction:c.submitAction,submitLabel:c.submitLabel,previous:previous(s)};
 return record(s,{...s,eventId:'major-'+s.school.majorId+'-'+s.majorLife.completedCount,phase:'choice',outcome:null,majorLife:{...s.majorLife,pending}},'start');
}
function score(s,p,c){
 if(expanded(p.majorId))return extra.score(p.majorId,p,c);
 if(p.majorId==='cs')return p.selection.patch==='correct'?3:0;
 if(p.majorId==='bio')return(p.selection.control==='AB'?1:0)+(p.selection.conclusion==='evidence'?2:0);
 if(p.majorId==='business')return p.preview.profit>=4&&p.preview.leftover<=1?3:p.preview.profit>0?2:0;
 if(p.majorId==='literature')return(p.selection.token==='1'?1:0)+(p.selection.token==='1'&&p.selection.replacement==='correct'?2:0);
 const targets=[['paper','center','book'],['neon','headline','note'],['garden','grid','leaf']][s.majorLife.completedCount];return ['palette','layout','element'].reduce((n,key,i)=>n+(p.selection[key]===targets[i]?1:0),0);
}
function feedback(p,points,c,skipped){
 if(skipped)return'跟着委托人做了一遍普通练习，收好这份示范记录。';
 if(expanded(p.majorId))return extra.feedback(p.majorId,p,points,c);
 if(p.majorId==='cs')return points===3?'程序通过样例与边界检查。食堂、机房和图书馆，又少了一个小麻烦。':'运行结果已留下：'+p.preview.output+'。'+p.preview.status+'；正确修复是'+c.fields[0].options.find(o=>o.id==='correct').label+'。委托人陪你核对后收下练习稿。';
 if(p.majorId==='bio')return points===3?'对照条件和结论都站得住脚。管理员：这次展签终于不抢着替全宇宙下结论了。':'观察记录已保存。更合适的是 A 与 B；'+c.correct+'。社团帮你标注了需要改进的判断。';
 if(p.majorId==='business')return'模拟卖出 '+p.preview.sold+' 件，收入 '+p.preview.revenue+' 元，进货 '+p.preview.expense+' 元，余货 '+p.preview.leftover+' 件，'+(p.preview.profit>=0?'利润 ':'亏损 ')+Math.abs(p.preview.profit)+' 元。'+(points===3?'库存和利润都照顾到了。':'账本如实记录，摊主帮你复盘定价与进货量。');
 if(p.majorId==='literature')return points===3?'错字已修正，校样可以直接上墙。编辑：这次终于不用在印完后贴一张纸了。':'交付了修订稿；应当把“'+c.texts[1]+'”改成“'+c.correct+'”。编辑在旁边留了批注。';
 return points===3?'三项要求都匹配，海报交付。委托人：这回不用把时间地点写在评论区补充了。':'海报已经生成，满足 '+points+' / 3 项要求。委托人收下方案，并提醒下次再核对配色、版式与主图形。';
}
function finish(s,skipped=false){
 const p=s.majorLife?.pending;if(!p)throw Error('没有待完成的专业委托');const c=config(s);
 if(!skipped&&p.fields.some(f=>!f.options.some(o=>o.id===p.selection[f.id])))throw Error('先完成每一项选择，再交付作品');
 let pending=p;
 if(skipped){const selection=expanded(p.majorId)?extra.demonstration(c):p.majorId==='cs'?{patch:'correct'}:p.majorId==='bio'?{control:'AB',conclusion:'evidence'}:p.majorId==='literature'?{token:'1',replacement:'correct'}:p.majorId==='design'?{palette:['paper','neon','garden'][p.chapter],layout:['center','headline','grid'][p.chapter],element:['book','note','leaf'][p.chapter]}:clone(c.initial);pending={...p,selection,preview:preview(s,c,selection)};}
 const points=skipped?0:score(s,pending,c),good=points===3,mods={energy:-1},id=p.majorId;let project=0;
 if(id==='cs'){project=skipped?1:good?3:2;mods.study=skipped?0:good?1:0;}
 if(id==='bio'){mods.study=skipped?1:good?3:2;project=skipped?0:1;}
 if(id==='business'){mods.money=skipped?1:good?3:2;mods.social=skipped?0:good?1:0;}
 if(id==='literature'){mods.social=skipped?1:good?3:2;mods.study=skipped?0:good?1:0;}
 if(id==='design'){mods.mood=skipped?1:good?4:2;project=skipped?0:1;}
 if(expanded(id)){const reward=extra.rewards(id,good,skipped);Object.assign(mods,reward.mods);project=reward.project;}
 // Match the released systems' diminishing mood/health returns.
 for(const key of ['health','mood'])if(mods[key]>0)mods[key]=s.stats[key]>=80?Math.floor(mods[key]*.25):s.stats[key]>=65?Math.max(1,Math.floor(mods[key]*.5)):mods[key];
 const stats=B.apply(s.stats,mods),result=feedback(pending,points,c,skipped),work={majorId:id,chapter:p.chapter,kind:p.kind,title:p.title,brief:p.brief,day:s.day,preview:clone(pending.preview),selection:clone(pending.selection),quality:skipped?'普通练习':good?'完成委托':'已交付 · 可改进',feedback:result,score:points,skipped};
 const entry={day:s.day,step:-1,eventId:'major-'+id+'-'+p.chapter,time:clock(now(s)),title:p.title,place:'校园专业工作室',choice:skipped?'普通练习':p.submitLabel,result,changes:Object.fromEntries(B.keys.filter(k=>stats[k]!==s.stats[k]).map(k=>[k,stats[k]-s.stats[k]])),flags:{},project,minutes:duration,majorWork:work};
 const n={...s,stats,phase:'outcome',outcome:entry,eventId:entry.eventId,log:[...s.log,entry],term:{...s.term,progress:s.term.progress+project},rhythm:{...s.rhythm,clock:now(s)+duration,spent:s.rhythm.spent+duration},majorLife:{...s.majorLife,completedCount:s.majorLife.completedCount+1,pending:null,returnTo:s.majorLife.returnTo||p.previous,works:[...s.majorLife.works,work]}};
 // Nutrition settles once, with the elapsed 12 minutes and no extra incident roll.
 return B.settleNutrition(s,n,0,false);
}
function majorAct(s,action,value){
 const p=s.majorLife?.pending;if(!p)throw Error('先接一份专业委托');
 if(action==='set'){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('无效的专业选择');const f=p.fields.find(f=>f.id===value.field);if(!f||!f.options.some(o=>o.id===value.value))throw Error('无效的专业选项');
  if(p.selection[f.id]===value.value)return s;const selection={...p.selection,[f.id]:value.value};return record(s,{...s,majorLife:{...s.majorLife,pending:{...p,selection,preview:preview(s,config(s),selection)}}},'act',[action,{field:f.id,value:value.value}]);
 }
 if(action!==p.submitAction||value!==undefined)throw Error('无效的专业操作');return record(s,finish(s),'act',[action]);
}
function cancelMajor(s){const p=s.majorLife?.pending;if(!p)throw Error('没有可以取消的专业委托');return record(s,{...s,...p.previous,majorLife:{...s.majorLife,pending:null}},'cancel');}
function skipMajor(s){const input=s.majorLife?.pending?s:startMajor(s),n=finish(input,true);return record(s,n,'skip');}
const mutators=['choose','next','startActivity','completeMini','cancelMini','continueDay','retire','selectCourses','planCourseAttendance','upgradeTimetable','enableSchool',...Object.keys(B).filter(k=>k.startsWith('enable')&&k!=='enableSchool'&&typeof B[k]==='function')];
const wrapped={};
function resume(s){return s.outcome?.majorWork&&s.majorLife?.returnTo?{...s,...s.majorLife.returnTo,majorLife:{...s.majorLife,returnTo:null}}:s;}
for(const key of mutators)wrapped[key]=(s,...args)=>{
 if(!s.majorLife)return B[key](s,...args);
 if(s.majorLife.pending){if(key.startsWith('enable')||key==='upgradeTimetable'){const n=B[key](s,...args);if(n===s)return s;}throw Error('先完成或取消眼前的专业委托');}
 // Starting another campus activity also leaves the work-result page. Anchor its
 // return to the original event, so it cannot resurrect an old work result later.
 const input=key==='next'||key==='startActivity'?resume(s):s;
 const n=B[key](input,...args);return record(s,n,'base',[key,args]);
};
function getScene(s){
 const p=s.majorLife?.pending,w=s.phase==='outcome'&&s.outcome?.majorWork;if(!p&&!w)return B.getScene(s);const view=p||w;
 return{id:s.eventId,kind:'专业委托',majorScene:true,title:view.title,text:p?p.brief+' '+p.request:'',time:p?clock(now(s)):s.outcome.time,place:'校园专业工作室',emoji:B.majors.find(m=>m.id===s.school.majorId)?.icon||'📓',bubble:p?'做一次选择，看看作品怎样改变。':'这份作品，属于你的校园生活。',choices:[]};
}
function curriculumOptions(s,...args){const n=B.curriculumOptions(s,...args);return s?.majorLife?.pending?{...n,canEdit:false,note:'先完成或取消眼前的专业委托。'}:n;}
function restore(raw){
 if(!raw?.majorLife)return B.restore(raw);
 try{
  if(raw.majorLife.revision!==1||!Array.isArray(raw.actions)||raw.actions.length>30000||raw.majorLife.base?.majorLife)return null;
  const base=B.restore(raw.majorLife.base);if(!base)return null;const boundary=base.actions.length;
  if(raw.actions[boundary]!=='major-v1'||!same(raw.actions.slice(0,boundary),base.actions))return null;let s=enableMajorLife(base);if(!s.majorLife)return null;
  for(const a of raw.actions.slice(boundary+1)){
   const m=/^major-(start|act|cancel|skip|base):(.+)$/.exec(a);if(!m)return null;const args=JSON.parse(decodeURIComponent(m[2]));if(!Array.isArray(args))return null;
   if(m[1]==='base'){const [key,values]=args;if(args.length!==2||!mutators.includes(key)||!Array.isArray(values))return null;s=wrapped[key](s,...values);}
   else{const fn={start:startMajor,act:majorAct,cancel:cancelMajor,skip:skipMajor}[m[1]];s=fn(s,...args);}
  }
  return same(s,raw)?s:null;
 }catch{return null;}
}
root.DormSchoolV3=B;
root.DormGame={...B,...wrapped,create,enableMajorLife,majorView,startMajor,majorAct,cancelMajor,skipMajor,getScene,curriculumOptions,freeMinutes:s=>s.majorLife?.pending?0:B.freeMinutes(s),availableActivities:s=>s.majorLife?.pending?[]:B.availableActivities(resume(s)),restore,valid:s=>restore(s)!==null};
if(!browser)module.exports=root.DormGame;
})(typeof globalThis!=='undefined'?globalThis:this);
