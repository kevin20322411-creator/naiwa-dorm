(function(root){'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./campus-expansion.js'),legacy=browser?root.DormPublishedJourneys:require('./journeys.js');
const definitions={
 'mini-basket':['basketball','投篮挑战',25,0,-10,'sport'],
 'mini-badminton':['badminton','羽毛球接杀',25,0,-10,'sport'],
 'mini-runner':['classroom','早八赶路',10,0,-4,'runner'],
 'mini-photo':['tower','校园相机',15,0,-2,'photo'],
 'mini-claw':['gate','抓奶蛙 · ¥4',10,4,-1,'claw'],
 'mini-squish':['dorm','揉揉奶蛙',5,0,0,'squish'],
 'mini-pinball':['club','奶蛙弹珠台',15,0,-3,'pinball']
};
const awards=[{id:'mini-basket-perfect',icon:'🏀',name:'今日手感王',quote:'三次出手，三次命中。今天的好手感留下了。'},{id:'mini-badminton-perfect',icon:'🏸',name:'接杀不慌',quote:'六次来球都接住了，奶蛙找到了自己的节奏。'},{id:'mini-early',icon:'⏰',name:'踩点大师',quote:'最后这段路，奶蛙还是赶上了。'},{id:'mini-friends',icon:'🧸',name:'小伙伴到齐',quote:'奶蛙、奶粉和奶鼠，都被夹回了自己的小架子。'}];
function hash(t){let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function enableMini(s){if(s.version!==6||s.miniGames||s.phase==='ending')return s;return{...s,miniGames:{revision:1,pending:null,daily:null,prizes:{frog:0,pink:0,mouse:0},awards:[],returnOutcome:null},actions:[...s.actions,'mini-v1']};}
const create=(...args)=>enableMini(B.create(...args));
function daily(s){return s.miniGames.daily?.day===s.day?s.miniGames.daily:{day:s.day,base:{},best:{},bonus:{},mood:0,social:0};}
function list(s){if(!s.miniGames||s.phase!=='outcome'||s.failed||s.lottery?.won||s.miniGames.pending||s.campusLife?.pending||s.rhythm?.pending||s.relationships?.pending)return[];const d=daily(s),free=B.freeMinutes(s);return Object.entries(definitions).filter(([key,a])=>free>=a[2]&&(key!=='mini-runner'||s.rhythm.clock<600&&!d.base.runner)&&(key!=='mini-pinball'||B.clubUnlocked(s))).map(([id,a])=>({id,label:a[1]+' · '+a[2]+' 分钟',partner:false,...(s.stats.money<a[3]?{disabledReason:'饭钱不足'}:{})}));}
function availableActivities(s){return s.miniGames?.pending?[]:[...B.availableActivities(s),...list(s)];}
function startActivity(s,key){if(!definitions[key]){if(s.miniGames?.pending)throw Error('先完成眼前的互动');return B.startActivity(s,key);}const a=list(s).find(a=>a.id===key);if(!a||a.disabledReason)throw Error('这会儿安排不了这项活动');const token=hash(s.seed+':'+s.day+':'+s.actions.length+':'+key).toString(36);return{...s,miniGames:{...s.miniGames,pending:{key,day:s.day,token}},actions:[...s.actions,'mini-start:'+key]};}
function cancelMini(s){if(!s.miniGames?.pending)throw Error('没有待完成的互动');return{...s,miniGames:{...s.miniGames,pending:null},actions:[...s.actions,'mini-cancel']};}
function normalScore(key,value){if(!Number.isInteger(value))throw Error('无效成绩');const max={'mini-basket':3,'mini-badminton':6,'mini-runner':1,'mini-photo':1,'mini-claw':63,'mini-squish':0,'mini-pinball':10000}[key];if(value< -1||value>max)throw Error('成绩越界');if(key==='mini-claw'&&value>=0){const counts=[value%4,Math.floor(value/4)%4,Math.floor(value/16)%4];if(counts.reduce((a,b)=>a+b,0)>3)throw Error('公仔数量无效');}return value;}
function completeMini(s,value){
 const pending=s.miniGames?.pending;if(!pending||pending.day!==s.day)throw Error('互动已结束');const key=pending.key,a=definitions[key];value=normalScore(key,value);const d=JSON.parse(JSON.stringify(daily(s))),first=!d.base[a[5]],skipped=value===-1,mods={energy:a[4],money:-a[3]},flags={},collection={...s.miniGames.prizes};let result='',project=0;
 // Positive status gains diminish at high values; every extra game shares one daily mood budget.
 const gain=(k,n,scaled=false)=>{if(n<=0){mods[k]=(mods[k]||0)+n;return;}if(!scaled&&(k==='health'||k==='mood'))n=s.stats[k]>=80?Math.floor(n*.25):s.stats[k]>=65?Math.max(1,Math.floor(n*.5)):n;if(k==='mood'){n=Math.min(n,6-d.mood);d.mood+=n;}if(k==='social'){n=Math.min(n,2-d.social);d.social+=n;}mods[k]=(mods[k]||0)+n;};
 const bonus=tier=>{const target=s.stats.mood>=80?Math.floor(tier*.25):s.stats.mood>=65?(tier?Math.max(1,Math.floor(tier*.5)):0):tier;d.bonus=d.bonus||{};const before=d.mood;gain('mood',Math.max(0,target-(d.bonus[key]||0)),true);d.bonus[key]=(d.bonus[key]||0)+d.mood-before;};
 let tier=0;
 if(a[5]==='sport'){
  flags.sport=1;if(first){gain('health',3);gain('mood',2);mods.charm=1;}
  tier=skipped?0:value===(key==='mini-basket'?3:6)?2:value>=(key==='mini-basket'?1:3)?1:0;
  const previous=d.best[key]||0;if(tier>previous){bonus(tier);if(tier===2&&previous<2)gain('social',1);}d.best[key]=Math.max(previous,tier);
  const count=s.log.filter(e=>e.day===s.day&&e.flags?.sport).length,r=B.rng(hash(s.seed+':mini-injury:'+s.day+':'+s.log.length))();
  if(r<(count===0?0:count===1?.3:.5)){mods.health=(mods.health||0)-12;mods.energy-=6;gain('mood',-4);mods.charm=0;flags.injury=1;}
  result=skipped?'奶蛙完成了这段练习，认真活动后做了放松。':'奶蛙完成了练习，'+(key==='mini-basket'?'三次出手命中 '+value+' 球。':'六次来球接住 '+value+' 球。');
  if(flags.injury)result+=' 运动中不慎拉伤，今天该停下来休息了。';
 }else if(a[5]==='runner'){
  mods.study=value===1?3:skipped?1:-1;project=value===1?3:skipped?1:0;if(value===0)gain('mood',-1);
  result=value===1?'奶蛙赶在铃响前到了教室，跟上了今天的课程。':skipped?'奶蛙按平常的节奏走到教室，开始今天的课。':'路上耽误了一会儿，奶蛙迟到了，课后补上漏听的内容。';
 }else{
  if(first){gain('mood',1);if(a[5]==='squish')mods.energy=1;}
  if(a[5]==='photo'){flags.art=1;tier=value===1?1:0;result=skipped?'奶蛙在校园里走了走，留意今天的光线。':'奶蛙把今天的校园留在了相册里。';}
  else if(a[5]==='pinball'){flags.art=1;tier=value>=350?2:value>=150?1:0;result=skipped?'玩了一会儿弹珠，奶蛙放松了心情。':'弹珠叮叮当当，这轮拿到 '+value+' 分。';}
  else if(a[5]==='claw'){if(!skipped){const counts={frog:value%4,pink:Math.floor(value/4)%4,mouse:Math.floor(value/16)%4};for(const k of Object.keys(collection))collection[k]=Math.min(99,collection[k]+counts[k]);result='花了 4 元玩一轮，夹到 '+Object.values(counts).reduce((x,y)=>x+y,0)+' 只公仔，带回自己的小架子。';}else result='奶蛙玩了一轮夹娃娃，带着轻松的心情离开小店。';}
  else result='揉一揉，松开手。奶蛙和你都放松了一点。';
  const previous=d.best[key]||0;if(tier>previous)bonus(tier);d.best[key]=Math.max(previous,tier);
 }
 d.base[a[5]]=true;
 const stats=B.apply(s.stats,mods),changes=Object.fromEntries(B.keys.filter(k=>stats[k]!==s.stats[k]).map(k=>[k,stats[k]-s.stats[k]]));
 const unlocked=[...s.miniGames.awards];const award=id=>{if(!unlocked.includes(id))unlocked.push(id);};if(key==='mini-basket'&&value===3)award(awards[0].id);if(key==='mini-badminton'&&value===6)award(awards[1].id);if(key==='mini-runner'&&value===1)award(awards[2].id);if(Object.values(collection).every(n=>n>0))award(awards[3].id);
 const time=String(Math.floor(s.rhythm.clock/60)%24).padStart(2,'0')+':'+String(s.rhythm.clock%60).padStart(2,'0'),entry={day:s.day,step:-1,eventId:a[5]==='sport'?'active-gym-'+key:key,index:0,time,title:a[1].split(' ·')[0],choice:skipped?'普通完成':a[1].split(' ·')[0],result,changes,flags,project,minutes:a[2],miniGame:key,miniScore:value,campusActivity:key};
 const totals={...s.flags};for(const[k,v]of Object.entries(flags))totals[k]=(totals[k]||0)+v;
 const failed=stats.health<=0?'fail-health':stats.mood<=0?'fail-mood':stats.energy<=0?'fail-energy':stats.study<=0?'fail-study':s.failed;
 const n={...s,stats,flags:totals,failed,outcome:entry,phase:'outcome',log:[...s.log,entry],actions:[...s.actions,'mini-done:'+value],term:{...s.term,progress:s.term.progress+project},rhythm:{...s.rhythm,clock:s.rhythm.clock+a[2],spent:s.rhythm.spent+a[2]},miniGames:{...s.miniGames,pending:null,daily:d,prizes:collection,awards:unlocked,returnOutcome:s.miniGames.returnOutcome||s.outcome}};
 return B.settleNutrition(s,n,0,true);
}
function choose(s,i){if(s.miniGames?.pending)throw Error('先完成互动');return B.choose(s,i);}
function next(s){if(s.miniGames?.pending)throw Error('先完成互动');if(!s.miniGames?.returnOutcome)return B.next(s);const previous=s.outcome?.miniGame?s.miniGames.returnOutcome:s.outcome,back={...s,outcome:previous,miniGames:{...s.miniGames,returnOutcome:null}},n=B.next(back);return{...n,actions:[...s.actions,'mini-next']};}
function getScene(s){const scene=B.getScene(s),o=s.phase==='outcome'&&s.outcome?.miniGame?s.outcome:null;if(!o)return scene;const a=definitions[o.miniGame],places={basketball:'篮球场',badminton:'羽毛球馆',classroom:'教学楼',tower:'钟楼草坪',gate:'校门小店',dorm:'宿舍',club:'活动室'},icons={sport:'🏀',runner:'⏰',photo:'📷',claw:'🧸',squish:'☁️',pinball:'🔵'};return{id:o.miniGame,kind:'校园互动',title:o.title,text:'',choices:[],place:places[a[0]],time:o.time,emoji:icons[a[5]],bubble:'活动结束，回校园。'};}
function miniAwards(s){return awards.filter(a=>s.miniGames?.awards.includes(a.id));}
function restore(raw){if(!raw?.miniGames)return B.restore(raw);try{let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);const up={h:'enableCare',b:'enableBalance',v:'enableRomance',p:'enableStory',y:'enableRhythm',f:'enableFood',i:'enableIllness',q:'enableMeetings',w:'enableWellness',u:'enableCampus',t:'enableEvolution',j:'enableLottery',k:'enableCampusRevision',g:'enableDining',z:'enableSocialUpdate',R:'enableRelationships',e:'enableEconomy',l:'enableLife',X:'enableAudit',N:'enableNutrition',H:'enableMealTuning'};if(!Array.isArray(raw.actions)||raw.actions.length>30000)return null;for(const a of raw.actions){if(a==='mini-v1')s=enableMini(s);else if(a.startsWith('mini-start:'))s=startActivity(s,a.slice(11));else if(/^mini-done:-?\d+$/.test(a))s=completeMini(s,+a.slice(10));else if(a==='mini-cancel')s=cancelMini(s);else if(a==='mini-next')s=next(s);else if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(/^meal:\d+$/.test(a))s=choose(s,+a.slice(5));else if(a==='V')s=B.enableExpansion(s);else if(a.startsWith('U:'))s=B.startActivity(s,a.slice(2));else if(a==='Z')s=B.next(s);else if(a==='n')s=B.settleNutrition(s,legacy.next(s));else if(a==='Y')s=B.next(s);else if(a==='d')s=B.continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='m')s=B.enableCharacter(s,raw.character.selected,raw.character.fresh);else if(a==='J')s=B.enableJourneys(s,raw.journeys.backgroundId);else if(up[a])s=B[up[a]](s);else if(a.startsWith('a:'))s=B.settleNutrition(s,legacy.startActivity(s,a.slice(2)));else if(a.startsWith('P:'))s=B.startActivity(s,a.slice(2));else return null;}return JSON.stringify(s)===JSON.stringify(raw)?s:null;}catch{return null;}}
root.DormGame={...B,create,enableMini,availableActivities,startActivity,completeMini,cancelMini,choose,next,getScene,restore,valid:s=>restore(s)!==null,miniDefinitions:definitions,campusDefinitions:{...B.campusDefinitions,...definitions},achievements:s=>[...B.achievements(s),...miniAwards(s)],romanceAwards:s=>[...(B.romanceAwards?.(s)||[]),...miniAwards(s)],endings:[...B.endings,...awards]};if(!browser)module.exports=root.DormGame;
})(typeof globalThis!=='undefined'?globalThis:this);
