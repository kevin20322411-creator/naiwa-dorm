(()=>{
'use strict';
const G=window.DormGame,E=window.DormExpressions,W=window.DormWorld,M=window.DormCampus,C=window.DormCanteen,S=window.DormSchoolUI,U=window.DormMajorUI,A=window.DormAchievementBook,F=window.DormEndingBook,app=document.querySelector('#app'),saveKey='naiwa-dorm-run-v2',bookKey='naiwa-dorm-endings-v1',evidenceKey='naiwa-dorm-achievement-evidence-v1',backgroundKey='naiwa-dorm-backgrounds-v1',finalesKey='naiwa-dorm-finales-v1';
const RELEASE={version:'9.9',date:'2026.11.11',items:['新增科研进度','更新科研结局','更新男明星通讯录']};
const read=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k))??fallback;}catch{return fallback;}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
const esc=s=>String(s).replaceAll('饭钱','生活费').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const namedFanCopy=(text,name)=>String(text).replace(/奶粉|你的宝宝/g,()=>name);
const narrative=(s,name)=>{
 const text=String(s).replaceAll('饭钱','生活费').replaceAll('奶娃','奶蛙').replace(/今天她有些疲惫，想把节奏放慢一点。|今天她忙着赶任务，想先把手头的事做好。|今天她有件开心的小事，想找人分享。/g,'').replaceAll('这次，是奶蛙先发来的消息。','奶蛙给奶粉发了条消息。').replace(/不用等(?:奶粉|你的宝宝)来找你。可以分享一件小事，也可以认真问问对方今天怎么样。/g,'聊点什么呢？').replace(/(?:奶粉|你的宝宝)等了一会儿，最后把聊天窗口收了起来。/g,'奶粉等了一会儿，以为你正在忙，便先收起了聊天窗口。').replace(/最迟第 \d+ 天结束前，需要去医院处理并打疫苗；逾期会触发“奶蛙长眠”。/g,'需要及时去医院处理咬伤并接种疫苗。').replaceAll('一只粉色的奶蛙','奶粉').replaceAll('粉色的奶蛙','奶粉').replaceAll('旁边有人喊了一声“奶粉”。','').trim();
 return typeof name==='string'&&name?namedFanCopy(text,name):text.replaceAll('奶粉',state?.romance?.dating?'你的宝宝':'奶粉');
};
let state=G.restore(read(saveKey,null)),renderEpoch=0,campusPlace=null,mealStall='today',fanBookOpen=false;
if(state&&G.upgradeTimetable){const upgraded=G.upgradeTimetable(state);if(upgraded!==state){state=upgraded;write(saveKey,state);}}
if(state&&G.enableMajorLife){const upgraded=G.enableMajorLife(state);if(upgraded!==state){state=upgraded;write(saveKey,state);}}
if(state&&G.enableTalentEffects){const upgraded=G.enableTalentEffects(state);if(upgraded!==state){state=upgraded;write(saveKey,state);}}
let draftSeed=Date.now()>>>0,draftBatchSeed=draftSeed,offered=G.newDraft(draftSeed),selected=[],draftName='',draftBackground='freshman',draftSharedBackground=null,draftMajor='cs',schoolReturn='game',schoolTab='week',schoolOptInMajor='cs',sound=read('naiwa-dorm-sound',true)===true,view='home',toastTimer;
let draftIdentity=null,draftSharedIdentity=null,identityRound=0,identityBatch=[],talentRefreshes=2;
let draftSelection=defaultCourseSelection(),schoolOptInSelection=defaultCourseSelection(),courseEdit=null;
function defaultCourseSelection(){return{electives:['elective-photo'],pe:'pe-badminton'};}
function copyCourseSelection(value){return{electives:[...(value?.electives||[])],pe:value?.pe||''};}
function courseValidation(majorId,selection){return G.validateCourseSelection?G.validateCourseSelection(majorId,selection):{valid:true,errors:[],conflicts:[]};}
let seen=read(bookKey,[]);if(!Array.isArray(seen))seen=[];seen=[...new Set(seen.filter(id=>G.endings.some(e=>e.id===id)||A.items.some(e=>e.id===id)))];
let achievementEvidence=read(evidenceKey,{});if(!achievementEvidence||typeof achievementEvidence!=='object'||Array.isArray(achievementEvidence))achievementEvidence={};
achievementEvidence=Object.fromEntries(Object.entries(achievementEvidence).filter(([id,p])=>(G.endings.some(e=>e.id===id)||A.items.some(e=>e.id===id))&&typeof p?.rule==='string'&&Array.isArray(p?.facts)));
// A saved proof is also a durable unlock, even if the older ids-only key failed to save.
const provenIds=Object.keys(achievementEvidence).filter(id=>A.items.some(e=>e.id===id)&&typeof achievementEvidence[id]?.rule==='string'&&Array.isArray(achievementEvidence[id]?.facts));
seen=[...new Set([...seen,...provenIds])];
let achievementSavePending=false;
let backgroundAwards=read(backgroundKey,[]);if(!Array.isArray(backgroundAwards))backgroundAwards=[];
backgroundAwards=[...new Set([...backgroundAwards,...seen].filter(id=>['artist','inventor','athlete','week'].includes(id)))];
let collectionTab='current',achievementReturn='collection';
let finales=read(finalesKey,{});if(!finales||typeof finales!=='object'||Array.isArray(finales))finales={};
finales=Object.fromEntries(Object.entries(finales).filter(([id,p])=>F.items.some(e=>e.id===id)&&p&&typeof p==='object'&&Array.isArray(p.facts)));
for(const e of F.items)if(seen.includes(e.id)&&!finales[e.id])finales[e.id]={id:e.id,legacy:true,rule:e.rule,facts:[]};
let finaleSavePending=false;
function readSharedStart(){
 try{
  const params=new URLSearchParams((window.location?.search||'').replace(/\\&/g,'&'));
  const seed=params.get('seed'),backgroundId=params.get('bg'),traits=params.get('traits')?.split(','),identityId=params.get('identity');
  if(identityId&&!G.identities.some(i=>i.id===identityId))return null;
  if(!identityId&&traits?.some(id=>G.goldenTraits.some(t=>t.id===id)))return null;
  if(traits&&new Set(traits.map(G.identityFamily)).size!==traits.length)return null;
  if(!/^\d{1,10}$/.test(seed||'')||Number(seed)>4294967295||!G.backgrounds.some(b=>b.id===backgroundId)||!traits||traits.length!==3||new Set(traits).size!==3||traits.some(id=>!G.traits.some(t=>t.id===id)))return null;
  const courseFields=['major','electives','pe'];
  const hasCourses=courseFields.some(key=>params.has(key));
  if(!hasCourses)return{seed:Number(seed),backgroundId,identityId,traits,majorId:'cs',selection:defaultCourseSelection()};
  if(courseFields.some(key=>params.getAll(key).length!==1))return null;
  const majorId=params.get('major'),selection={electives:params.get('electives').split(','),pe:params.get('pe')};
  if(!courseValidation(majorId,selection).valid)return null;
  return{seed:Number(seed),backgroundId,identityId,traits,majorId,selection};
 }catch{return null;}
}
const sharedStart=readSharedStart();let sharedStartUsed=false;
const asset=name=>window.DormAssets?.[name]||'./assets/'+name;
let recent=read('naiwa-dorm-recent-v2',[]),seenEvents=read('naiwa-dorm-events-v2',[]);
if(!Array.isArray(recent))recent=[];if(!Array.isArray(seenEvents))seenEvents=[];
const awardVoice=new Audio(asset('eat-ganbadie.mp3'));awardVoice.volume=.25;awardVoice.preload='auto';
const laugh=new Audio(asset('laugh.mp3'));laugh.volume=.22;laugh.preload='auto';
let activeVoice=null,voiceTimer,cardUrl=null,majorAudio=null;
function stopMajorAudio(){if(!majorAudio)return;const context=majorAudio;majorAudio=null;window.DormMusic?.duck('melody',false);try{const closing=context.close();if(closing?.catch)closing.catch(()=>{});}catch{}}
function playMajorMelody(preview,current){
 if(!current())return;if(!sound){toast('音效已关闭');return;}
 const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext){toast('当前浏览器暂不支持试听');return;}
 stopMajorAudio();let context;try{context=new AudioContext();majorAudio=context;window.DormMusic?.duck('melody',true);const play=()=>{if(!current()||!sound||majorAudio!==context){if(majorAudio===context)stopMajorAudio();return;}let at=context.currentTime+.035;const beat=60/(Number(preview.bpm)||108);for(const note of preview.notes||[]){const duration=Math.max(.1,Math.min(4,Number(note.beats)||1))*beat;if(Number(note.frequency)>0){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=Number(note.frequency);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.12,at+.02);gain.gain.setValueAtTime(.12,at+Math.max(.02,duration-.06));gain.gain.linearRampToValueAtTime(0,at+duration);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(at);oscillator.stop(at+duration+.02);}at+=duration;}setTimeout(()=>{if(majorAudio===context)stopMajorAudio();},Math.ceil((at-context.currentTime+.1)*1000));};if(context.state==='suspended')context.resume().then(play).catch(()=>{if(majorAudio!==context)return;stopMajorAudio();if(current()&&sound)toast('试听暂时无法播放');});else play();}catch{stopMajorAudio();toast('试听暂时无法播放');}
}
function stopVoice(){clearTimeout(voiceTimer);window.DormMusic?.duck('voice',false);if(activeVoice){activeVoice.pause();activeVoice.currentTime=0;activeVoice=null;}}
function speak(kind='award',preview=false){
 if(!sound)return;stopVoice();activeVoice=kind==='failure'?laugh:awardVoice;
 window.DormMusic?.duck('voice',true);
 activeVoice.currentTime=0;activeVoice.play().catch(()=>{if(preview)toast('音效暂时无法播放，请再点一次。');});
 voiceTimer=setTimeout(stopVoice,kind==='failure'?1600:2200);
}
function clearCard(){stopMajorAudio();if(cardUrl){URL.revokeObjectURL(cardUrl);cardUrl=null;}}
function toast(s){const t=document.querySelector('#toast');t.textContent=s;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2400);}
function enableCurrentMoneyRules(s){
 if(G.enableCampusJobs)s=G.enableCampusJobs(s);
 if(G.enableUnlimitedMoney)s=G.enableUnlimitedMoney(s);
 return s;
}
function persist(){
 if(!state)return;
 if(G.upgradeTimetable)state=G.upgradeTimetable(state);
 if(G.enableMajorLife)state=G.enableMajorLife(state);
 if(G.enableTalentEffects)state=G.enableTalentEffects(state);
 state=enableCurrentMoneyRules(state);
 if(!write(saveKey,state))toast('当前浏览器不能保存进度，请保持页面打开。');
}
function goTop(){window.scrollTo({top:0,behavior:'instant'});}
function soundUI(){const b=document.querySelector('#sound-btn');b.textContent=sound?'音效开':'音效关';b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'关闭音效':'开启音效');}
function currentAchievementCount(){return A.items.filter(e=>seen.includes(e.id)).length;}
function updateBook(){document.querySelector('#collection-count').textContent=currentAchievementCount()+'/'+A.items.length;}
function showRelease(){
 const modal=document.querySelector('#release-modal');
 document.querySelector('#release-version').textContent='v'+RELEASE.version;
 document.querySelector('#release-date').textContent=RELEASE.date;
 document.querySelector('#release-list').innerHTML=RELEASE.items.map(item=>'<li>'+esc(item)+'</li>').join('');
 document.querySelector('#release-skip').checked=read('naiwa-dorm-release-hidden',null)===RELEASE.version;
 if(!modal.open)modal.showModal();
}
function dismissRelease(){write('naiwa-dorm-release-hidden',document.querySelector('#release-skip').checked?RELEASE.version:null);document.querySelector('#release-modal').close();}
function hungerHTML(){const v=G.fullness?.(state);return v===null||v===undefined?'':'<section class="satiety-card" aria-label="饱食度"><span>饱食度</span><div class="satiety-track" role="progressbar" aria-label="饱食度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(v)+'"><i style="width:'+v+'%;background:'+(v<20?'#cb8a60':'#99ad74')+'"></i></div><b>'+Math.round(v)+'</b></section>'; }
function statHTML(s){
 return G.statKeys(s).map(k=>{
  if(k==='money'){
   return `<div class="stat stat-money${s.money<8?' warning':''}${s.money>9999?' stat-money-wide':''}"><div class="stat-head"><span>${G.labels.money}</span><b>¥${s.money}</b></div></div>`;
  }
  const width=Math.max(0,Math.min(100,s[k]));
  return `<div class="stat ${s[k]<20?'warning':''}"><div class="stat-head"><span>${G.labels[k]}</span><b>${s[k]}</b></div><div class="stat-track"><i style="width:${width}%"></i></div></div>`;
 }).join('');
}
function startDraft(useShared=false){const shared=useShared&&sharedStart&&!sharedStartUsed?sharedStart:null;selected=shared?[...shared.traits]:[];draftSeed=shared?shared.seed:Date.now()>>>0;draftBatchSeed=draftSeed;draftIdentity=shared?.identityId||null;draftSharedIdentity=shared?.identityId||null;identityRound=0;talentRefreshes=2;identityBatch=G.identityDraft(draftSeed,0);if(draftIdentity&&!identityBatch.includes(draftIdentity))identityBatch[0]=draftIdentity;offered=shared&&!shared.identityId?G.newDraft(draftBatchSeed,selected):G.talentDraft(draftBatchSeed,selected);draftName=state?.name||'';draftBackground=shared?.backgroundId||'freshman';draftSharedBackground=shared?.backgroundId||null;draftMajor=shared?.majorId||'cs';draftSelection=copyCourseSelection(shared?.selection||defaultCourseSelection());traitsView();goTop();}
function canShareStart(s){return s&&G.selectedTraits(s).length===3;}
async function shareStart(s){
 if(!canShareStart(s)){toast('开始三天赋新局后，可分享同一起点。');return;}
 const background=s.journeys?.backgroundId||'freshman',traits=G.selectedTraits(s).map(encodeURIComponent).join(',');
 let link='https://kevin20322411-creator.github.io/naiwa-dorm/?seed='+s.seed+'&bg='+encodeURIComponent(background)+'&traits='+traits;
 if(s.admission)link+='&identity='+encodeURIComponent(s.admission.id);
 const major=s.school?.majorId||'cs';
 const initial=s.school?.enrollments?.[0]?.selection||defaultCourseSelection();
 const selection=courseValidation(major,initial).valid?initial:defaultCourseSelection();
 const defaults=defaultCourseSelection();
 if(major!=='cs'||selection.pe!==defaults.pe||selection.electives.length!==1||selection.electives[0]!==defaults.electives[0]){
  link+='&major='+encodeURIComponent(major)+'&electives='+selection.electives.map(encodeURIComponent).join(',')+'&pe='+encodeURIComponent(selection.pe);
 }
 try{await navigator.clipboard.writeText(link);toast('开局链接已复制，发给室友一起试试。');}
 catch{toast('复制暂不可用，请再试一次。');}
}
function backgroundHTML(){
 if(draftSharedBackground&&!draftSharedIdentity)return '<section class="identity-picker"><h2>旧版分享开局</h2><p>'+esc(G.backgrounds.find(b=>b.id===draftBackground)?.name||'校园生活')+' · 保留原规则</p></section>';
 return '<section class="identity-picker"><div class="identity-heading"><h2>身份 <small>三选一</small></h2><button id="identity-reroll" class="text-btn" '+(identityRound>=2?'disabled':'')+'>换一批 · '+(2-identityRound)+'</button></div><div class="identity-grid">'+identityBatch.map(id=>{const i=G.identities.find(x=>x.id===id);return '<button class="identity-card '+(i.gold?'rarity-gold ':'')+(draftIdentity===id?'selected':'')+'" data-identity="'+id+'" aria-pressed="'+(draftIdentity===id)+'"><strong>'+esc(i.name)+'</strong><span>'+esc(i.desc)+'</span></button>';}).join('')+'</div></section>';
}
function sharedSummary(){
 const bg=G.identities.find(i=>i.id===sharedStart.identityId)||G.backgrounds.find(b=>b.id===sharedStart.backgroundId),major=G.majors.find(m=>m.id===sharedStart.majorId);
 const names=sharedStart.traits.map(id=>G.traits.find(t=>t.id===id).name);
 return '<div class="shared-start-note"><strong>收到一个同起点开局</strong><span class="shared-background-name">'+esc(bg.name+' · '+major.name)+'</span><span class="shared-trait-names">'+names.map(esc).join(' · ')+'</span></div>';
}
function home(){
 renderEpoch++;clearCard();
 view='home';
 const pendingShared=sharedStart&&!sharedStartUsed;
 app.innerHTML=`<section class="hero"><div class="hero-copy"><p class="hero-kicker">重生之</p><h1>我在宿舍<span>当奶蛙。</span></h1>${pendingShared?sharedSummary():''}<div class="hero-actions"><button class="button dark" id="new-run">${pendingShared?'体验这个开局':'开始新生活'}</button>${state?'<button class="button white" id="resume-run">'+(pendingShared?'继续我的存档':state.phase==='ending'?'上次结局':state.version<6?'继续上次（原规则）':'继续上次')+'</button>':''}</div>${pendingShared?'<button class="text-btn start-share" id="random-run">开始随机新生活</button>':canShareStart(state)?'<button class="text-btn start-share" id="share-start">分享同一起点</button>':''}</div><div class="hero-visual">${window.DormHomeScene.render()}<img class="hero-frog" src="${asset('frog.png')}" alt="准备入住大学宿舍的奶蛙"></div></section>`;
 document.querySelector('#new-run').onclick=()=>startDraft(true);
 if(state)document.querySelector('#resume-run').onclick=()=>{
  const upgraded=enableCurrentMoneyRules(state);
  if(upgraded!==state){
   state=upgraded;
   if(!write(saveKey,state))toast('当前浏览器不能保存进度，请保持页面打开。');
  }
  gameView();
  goTop();
 };
 if(pendingShared)document.querySelector('#random-run').onclick=()=>startDraft(false);
 if(canShareStart(state)&&!pendingShared)document.querySelector('#share-start').onclick=()=>shareStart(state);
}

function traitsView(){
 renderEpoch++;clearCard();
 view='traits';const draftEpoch=renderEpoch,current=()=>view==='traits'&&renderEpoch===draftEpoch;
 app.innerHTML=`<div class="page-heading"><div><h1>${draftSharedBackground?'确认这次的开局。':'选三项天赋。'}</h1><p>${draftSharedBackground?'背景、专业、选课和三项天赋已带入，可调整后入学。':G.traits.length+' 种天赋 · 换批保留已选'}</p></div><button class="back" id="back-home">返回</button></div>${draftSharedBackground?'<p class="shared-draft-summary">已选：'+selected.map(id=>esc(G.traits.find(t=>t.id===id).name)).join(' · ')+'</p>':''}${backgroundHTML()}${S?.pickerHTML(G.majors,draftMajor)||''}${S?.selectionSummaryHTML(G.courseCatalog,draftSelection,{draft:true})||''}<div class="trait-layout"><div class="trait-grid">${offered.map(id=>{const t=G.traits.find(t=>t.id===id);return`<button class="trait-card ${selected.includes(id)?'selected':''} ${t.gold?'rarity-gold':''}" data-trait="${id}" aria-pressed="${selected.includes(id)}"><span class="check">${selected.includes(id)?'✓':''}</span><span class="icon">${t.icon}</span><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p><span class="trait-detail">${G.keys.filter(k=>!t.hideMods&&t.mods[k]).map(k=>G.labels[k]+(t.mods[k]>0?'+':'')+t.mods[k]).join(' · ')}</span></button>`;}).join('')}</div><aside class="admission"><img src="${asset('frog-wave.png')}" alt="挥手的奶蛙"><label class="name-label" for="player-name">你的名字</label><input class="name-input" id="player-name" maxlength="12" placeholder="奶蛙同学" value="${esc(draftName)}" autocomplete="off"><div class="selection-slots">${[0,1,2].map(i=>selected[i]?`<div class="selection-slot filled"><span>${esc(G.traits.find(t=>t.id===selected[i]).name)}</span><button class="remove-trait" data-remove-trait="${selected[i]}" aria-label="取消天赋：${esc(G.traits.find(t=>t.id===selected[i]).name)}">×</button></div>`:'<div class="selection-slot">未选择</div>').join('')}</div><button class="button dark full" id="enroll" ${selected.length!==3||(!draftIdentity&&!draftSharedBackground)?'disabled':''}>入住宿舍</button><button class="quit-btn" id="reroll" ${talentRefreshes<=0?'disabled':''}>换一批 · ${talentRefreshes}</button></aside></div>`;
 document.querySelectorAll('[data-major]').forEach(b=>b.onclick=()=>{if(!current())return;draftName=document.querySelector('#player-name').value;draftMajor=b.dataset.major;if(!courseValidation(draftMajor,draftSelection).valid){draftSelection=defaultCourseSelection();toast('已按新专业恢复推荐选课，可继续调整。');}traitsView();});
 document.querySelectorAll('[data-identity]').forEach(b=>b.onclick=()=>{if(!current())return;draftName=document.querySelector('#player-name').value;draftIdentity=b.dataset.identity;traitsView();});
 const identityReroll=document.querySelector('#identity-reroll');if(identityReroll)identityReroll.onclick=()=>{if(!current()||identityRound>=2)return;draftName=document.querySelector('#player-name').value;identityRound++;identityBatch=G.identityDraft(draftSeed,identityRound);draftIdentity=null;traitsView();};
 document.querySelectorAll('[data-trait]').forEach(b=>b.onclick=()=>{if(!current())return;draftName=document.querySelector('#player-name').value;const id=b.dataset.trait;if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<3)selected.push(id);else{toast('先取消一项天赋。');return;}traitsView();});
 document.querySelectorAll('[data-remove-trait]').forEach(b=>b.onclick=()=>{if(!current())return;draftName=document.querySelector('#player-name').value;selected=selected.filter(id=>id!==b.dataset.removeTrait);traitsView();});
 bindCourseEditor('draft',current);
 document.querySelector('#player-name').oninput=e=>{if(current())draftName=e.target.value;};
 document.querySelector('#back-home').onclick=()=>{if(current()){home();goTop();}};
 document.querySelector('#reroll').onclick=()=>{if(!current()||talentRefreshes<=0)return;draftName=document.querySelector('#player-name').value;talentRefreshes--;draftBatchSeed=(draftBatchSeed+7391)>>>0;offered=draftSharedBackground&&!draftSharedIdentity?G.newDraft(draftBatchSeed,selected,offered):G.talentDraft(draftBatchSeed,selected,offered);traitsView();};
 document.querySelector('#enroll').onclick=()=>{if(!current()||selected.length!==3||(!draftIdentity&&!draftSharedBackground))return;if(!courseValidation(draftMajor,draftSelection).valid){toast('请先调整冲突的选课。');return;}fanBookOpen=false;state=draftIdentity?G.createCampus(draftSeed,selected,draftName,draftIdentity,[],draftMajor,copyCourseSelection(draftSelection)):G.create(draftSeed,selected,draftName,[],draftBackground,draftMajor,copyCourseSelection(draftSelection));if(draftSharedBackground)sharedStartUsed=true;persist();gameView();goTop();};
}

function fanName(id=state?.admission?.partnerId){
 const contact=state?.admission?.contacts.find(c=>c.id===id);
 return contact&&contact.id!=='campus-naifen'?G.fanIdentity(contact).name:'';
}
function sceneFanName(scene){
 if(state.phase==='outcome')return state.outcome?.fanContactId?fanName(state.outcome.fanContactId):'';
 return G.isFanInteraction(scene)&&state.romance.connected?fanName():'';
}
const partnerName=()=>fanName()||(state?.romance?.dating?'你的宝宝':'奶粉');
function fanHTML(){
 if(state.admission?.id!=='celebrity')return '';
 const {contacts,partnerId}=state.admission,canManage=G.canManageFans(state);
 const offered=contacts.filter(c=>c.status==='offered'&&c.day===state.day),known=contacts.filter(c=>c.status==='known');
 if(!offered.length&&!known.length)return '';
 const person=({name,place})=>{
  return '<img class="naiwa-pink" src="'+asset('frog-wave.png')+'" alt=""><div class="fan-person"><strong>'+esc(name)+'</strong>'+(place?'<small>'+esc(place)+'</small>':'')+'</div>';
 };
 const invitations=offered.map(c=>{
  const identity=G.fanIdentity(c),name=esc(identity.name);
  const actions=canManage?`<div class="fan-actions"><button class="text-btn" data-fan-reply="${c.id}|yes" aria-label="添加 ${name}">添加</button><button class="text-btn" data-fan-reply="${c.id}|no" aria-label="婉拒 ${name}">婉拒</button></div>`:'<span>待回应</span>';
  return '<li class="fan-row">'+person(identity)+actions+'</li>';
 });
 const entries=known.map(c=>{
  const identity=G.fanIdentity(c);
  const active=c.id===partnerId,romance=active?state.romance:c.romance;
  const status=!romance.connected?'已断联':active?(romance.dating?'恋人':'当前互动'):'亲密度 '+romance.intimacy;
  const action=romance.connected&&!active&&canManage&&!state.romance.dating?'<button class="text-btn" data-fan-focus="'+c.id+'" aria-label="切换到 '+esc(identity.name)+'">切换</button>':'';
  return '<li class="fan-row'+(active&&romance.connected?' is-active':'')+'">'+person(identity)+'<span>'+status+'</span>'+action+'</li>';
 });
 const count=[known.length+' 位联系人',...(offered.length?[offered.length+' 条新邀请']:[])].join(' · ');
 return '<details class="fan-contacts" id="fan-book"'+(fanBookOpen?' open':'')+'><summary><strong>通讯录</strong><span>'+count+'</span></summary><div class="fan-book-content">'+(invitations.length?'<section><h2>新的邀请</h2><ul>'+invitations.join('')+'</ul></section>':'')+(entries.length?'<section><h2>联系人</h2><ul>'+entries.join('')+'</ul></section>':'')+'</div></details>';
}
function bindFans(current){
 const book=document.querySelector('#fan-book');
 if(!book)return;
 book.ontoggle=()=>{if(current())fanBookOpen=book.open;};
 const update=(action,message)=>{
  if(!current())return;
  try{fanBookOpen=book.open??fanBookOpen;state=action();persist();gameView();toast(message());}
  catch(error){toast(error.message);}
 };
 document.querySelectorAll('[data-fan-reply]').forEach(b=>b.onclick=()=>{
  const [id,response]=b.dataset.fanReply.split('|'),accept=response==='yes';
  update(()=>G.respondFan(state,id,accept),()=>accept?'已添加 '+fanName(id):'已婉拒');
 });
 document.querySelectorAll('[data-fan-focus]').forEach(b=>b.onclick=()=>{
  update(()=>G.focusContact(state,b.dataset.fanFocus),()=> '当前互动 · '+partnerName());
 });
}
function openingBuffHTML(){
 if(!state.openingBuff||state.day!==1||state.step!==0)return '';
 const buff=G.openingBuffs.find(b=>b.id===state.openingBuff.id);
 return '<div class="opening-buff" role="status"><span aria-hidden="true">✦</span> 开局加成 · '+esc(buff.name)+'<b>'+G.labels[buff.key]+' +'+state.openingBuff.amount+'</b></div>';
}
function mealRecoveryHTML(){const p=state.admission?.mealPerk;return p&&p.until>=state.day?'<div class="opening-buff"><span aria-hidden="true">✦</span> 餐后余裕<b>还能恢复 '+p.remaining+' 次</b></div>':'';}
function researchHTML(){
 const r=G.researchStatus(state);
 if(!r)return '';
 return '<section class="term-card" aria-label="科研进展"><div><strong>科研进度</strong><span>'+r.progress+'%</span></div><div class="term-meter" role="progressbar" aria-label="科研进度" aria-valuemin="0" aria-valuemax="'+r.target.progress+'" aria-valuenow="'+r.progress+'"><i style="width:'+r.progress+'%"></i></div><p><span>入组 '+r.days+' / '+r.target.days+' 天</span><span>实验室 '+r.visits+' / '+r.target.visits+' 次</span></p></section>';
}
function lotteryCreditHTML(){return state.lottery?.credit?'<div class="opening-buff">奖金余额 <b>¥'+state.lottery.credit+'</b></div>':'';}
function taskHTML(){
 const t=G.task?.(state);if(!t)return '';
 return '<section class="term-card" aria-label="本周课设"><div><strong>第 '+t.week+' 周 · '+esc(t.name)+'</strong><span>剩 '+t.daysLeft+' 天</span></div><div class="term-meter" role="progressbar" aria-label="课设进度" aria-valuemin="0" aria-valuemax="'+t.target+'" aria-valuenow="'+Math.min(t.progress,t.target)+'"><i style="width:'+Math.min(100,t.progress/t.target*100)+'%"></i></div><p><span>课设 '+t.progress+' / '+t.target+'</span><span>缺交 '+t.missed+' / 2</span></p></section>';
}
function romanceHTML(){
 const r=state.romance;if(!r?.connected)return '';
 const bond=G.relationshipStatus(state),known=G.preferenceNotes(state),promise=bond?.promise;
 const note=bond&&(known.length||promise)?'<div class="relationship-note">'+(known.length?'<p class="preference-diary">喜好手账</p><p class="relationship-known">'+known.map(esc).join(' · ')+'</p>':'')+(promise?'<p class="relationship-promise">约好：'+esc(promise.label)+'<span>第 '+promise.earliestDay+(promise.dueDay!==promise.earliestDay?'—'+promise.dueDay:'')+' 天</span></p>':'')+'</div>':'';
 const oldClassmate=state.admission?.id==='classmate'&&!state.admission.partnerId;
 const name=esc(partnerName());
 return '<section class="romance-card" aria-label="与'+name+'的亲密度"><div class="romance-person"><img class="naiwa-pink" src="'+asset('frog-wave.png')+'" alt=""><div><strong>'+name+'</strong><span>'+ (r.dating?'恋人':r.intimacy>=80?'心意渐明':oldClassmate?'老同学':'慢慢认识')+'</span></div><b>亲密度 '+r.intimacy+' <small>/ 100</small></b></div><div class="romance-meter" role="progressbar" aria-label="亲密度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+r.intimacy+'"><i style="width:'+r.intimacy+'%"></i></div>'+note+'</section>';
}
function recordAchievements(){
 if(!state)return [];
 if(achievementSavePending)saveAchievementBook();
 // Background eligibility stays separate from the smaller achievement catalogue.
 const earnedBackgrounds=G.achievements(state).map(e=>e.id).filter(id=>['artist','inventor','athlete','week'].includes(id));
 const nextBackgrounds=[...new Set([...backgroundAwards,...earnedBackgrounds])];
 if(nextBackgrounds.length!==backgroundAwards.length){backgroundAwards=nextBackgrounds;write(backgroundKey,backgroundAwards);}
 const unlocked=A.unlocked(state).filter(e=>!seen.includes(e.id));
 if(!unlocked.length)return [];
 for(const e of unlocked){if(achievementEvidence[e.id])continue;const proof=A.describe(e.id,state);achievementEvidence[e.id]={day:state.day,name:state.name,seed:state.seed,rule:proof.rule,facts:proof.facts};}
 seen.push(...unlocked.map(e=>e.id));
 if(!saveAchievementBook())toast('成就暂时未能保存，请保留此页面。');
 updateBook();return unlocked;
}
function saveAchievementBook(){
 const evidenceSaved=write(evidenceKey,achievementEvidence);
 const bookSaved=evidenceSaved&&write(bookKey,seen);
 achievementSavePending=!bookSaved;return bookSaved;
}
function recordFinale(){
 const proof=F.capture(state);if(!proof)return null;
 const saved=finales[proof.id];
 if(!saved||saved.legacy||(proof.revision||1)>(saved.revision||1)){finales[proof.id]=proof;finaleSavePending=true;}
 if(finaleSavePending)finaleSavePending=!write(finalesKey,finales);
 return proof;
}
function collectAchievements(){const unlocked=recordAchievements();if(unlocked.length){showUnlocks(unlocked);if(!state.failed)speak('award');}}
function choiceText(c,name){
 const choice=state?.eventId==='love-active-ask-chat'?c.text.replace('只发一句“在吗”，收到回复又不接话','聊到一半刷起手机，迟迟没有回复'):c.text;
 const text=name?namedFanCopy(choice,name):choice,price=Math.max(0,-(c.mods.money||0));
 return text+(price&&!text.includes('¥')?' · ¥'+price:'')+(c.minutes?' · '+c.minutes+' 分钟':'');
}
function choiceNotice(c){
 if(c.disabledReason)return '<i class="danger">'+esc(c.disabledReason)+'</i>';
 if((c.mods.money||0)<-state.stats.money)return '<i class="danger">生活费不足</i>';
 if(['energy','health','study','mood'].some(k=>state.stats[k]+(c.mods[k]||0)<=0))return '<i class="danger">当前状态下有透支风险</i>';
 return '';
}
function illnessHTML(){
 const i=state.illness;if(!i?.active||state.failed)return '';
 const canVisit=state.phase==='outcome'&&(G.availableActivities?.(state)||[]).some(a=>a.id==='clinic'),canBook=state.phase==='dayEnd'&&!state.failed;
 const title=i.kind==='cold'?(i.level>=3?'感冒加重了':i.level===2?'感冒还没好':'奶蛙感冒了'):(i.level>=3?'身体不适加重':i.level===2?'身体仍然不适':'奶蛙生病了');
 return '<section class="illness-card" aria-label="生病状态"><div><strong>'+title+'</strong><span>'+(i.days?'已持续 '+i.days+' 天':'刚出现不适')+'</span></div><p>'+(i.appointment?'已预约明早校医，就诊后缓解。':'未就诊，次日会继续损失健康和心情。')+'</p>'+(!i.appointment&&(canVisit||canBook)?'<button class="text-btn" id="clinic-btn">'+(canBook?'预约明早校医':'去校医院')+'</button>':!i.appointment?'<p class="illness-hint">可在空闲时就诊，或在今日结算预约。</p>':'')+'</section>';
}
function careHTML(){
 if(!state.evolution||state.failed)return '';const ev=state.evolution,list=G.availableActivities(state),book=state.phase==='dayEnd';let html='';
 for(const type of ['vaccine','psych']){const vaccine=type==='vaccine',needed=vaccine?!!ev.bite:state.stats.mood<35&&ev.psychDay!==state.day;if(!needed)continue;const booked=vaccine?ev.bite.appointment:ev.psychBooked,can=book||list.some(a=>a.id===type);html+='<section class="illness-card" aria-label="'+(vaccine?'奶鼠咬伤':'心情照护')+'"><div><strong>'+(vaccine?'奶蛙被奶鼠咬伤了':'心情持续低落')+'</strong><span>'+(vaccine?'需要及时接种':'心情 '+state.stats.mood+' / 100')+'</span></div><p>'+(booked?'已预约明早医院就诊。':vaccine?'请及时去医院处理咬伤并接种疫苗。':'心情低于 25，次日会额外损失健康。')+'</p>'+(!booked&&can?'<button class="text-btn" data-care="'+type+'">'+(book?'预约明早就诊':vaccine?'去医院打疫苗':'去心理门诊')+'</button>':!booked?'<p class="illness-hint">可在空闲时就诊，或在今日结算预约。</p>':'')+'</section>';}
 return html;
}
function bindExtraCare(renderedState){document.querySelectorAll('[data-care]').forEach(b=>b.onclick=()=>{if(state!==renderedState)return;try{state=G.startActivity(state,b.dataset.care);persist();gameView();goTop();}catch{toast('可以换个空闲时段，或在今日结算预约。');}});}
function bindClinic(renderedState){const button=document.querySelector('#clinic-btn');if(button)button.onclick=()=>{if(!['game','ending'].includes(view)||state!==renderedState)return;try{state=G.startActivity(state,'clinic');persist();gameView();goTop();}catch{toast('可以换个空闲时段，或在今日结算预约明早校医。');}};}
function sceneProgress(){
 return state.rhythm?'第 '+(state.log.filter(e=>e.day===state.day&&(e.step>=0||e.campusActivity||e.schoolCourse||e.courseId||e.origin==='relationship'||e.origin==='journey'||['clinic-visit','evo-vaccine','evo-psych','evo-breakup','love-naifen-confession'].includes(e.eventId))).length+(state.phase==='choice'?1:0))+' 件事':(state.step+1)+' / 8';
}
function freeTimeHTML(){
 const list=G.availableActivities?.(state)||[];if(!list.length)return '';
 const buttons=partner=>list.filter(a=>Boolean(a.partner)===partner).map(a=>'<button class="activity-button" data-activity="'+a.id+'" '+(a.disabledReason?'disabled':'')+'>'+esc(a.label)+(a.disabledReason?'<small>'+esc(a.disabledReason)+'</small>':'')+'</button>').join('');
 return '<button class="campus-shortcut" id="campus-shortcut"><span aria-hidden="true">↗</span><span><strong>去校园逛逛</strong></span><b aria-hidden="true">›</b></button><details class="free-time"><summary><strong>自由安排</strong><span>还有 '+G.freeMinutes(state)+' 分钟</span></summary><div class="free-time-content"><p>独自</p><div class="activity-grid">'+buttons(false)+'</div>'+(list.some(a=>a.partner)?'<p>和'+esc(partnerName())+'一起</p><div class="activity-grid">'+buttons(true)+'</div>':'')+'</div></details>';
}

function statusPanelHTML(){return `<aside class="status-panel"><div class="player-title"><img class="player-avatar" src="${asset('frog.png')}" alt=""><b>${esc(state.name)}</b></div>${state.admission?'<p class="identity-name">'+esc(G.identityOf(state).name)+'</p>':''}<div class="stats">${statHTML(state.stats)}</div><p class="status-rule">电量、学业、健康或心情归零即结束。</p><div class="trait-chips">${G.selectedTraits(state).map(id=>`<span>${esc(G.traits.find(t=>t.id===id).name)}</span>`).join('')}</div><button class="quit-btn" id="pause-run">返回首页</button></aside>`;}
function normalSceneHTML(scene,expression,callback){
 const name=sceneFanName(scene),copy=value=>narrative(value,name),hasPartner=G.isFanInteraction(scene);
 return `${scene.majorScene||(scene.schoolScene&&state.phase==='outcome'&&state.outcome?.schoolWork)?'':scene.schoolScene&&S?S.sceneArtHTML(scene,state.school?.majorId):`<div class="scene-art expression-art ${scene.kind==='三餐'?'meal-art':hasPartner||scene.mouseScene?'romance-art'+(scene.mouseScene?' mouse-art':''):''}"><span class="scene-doodle" aria-hidden="true">${scene.emoji}</span>${state.phase==='choice'&&scene.bubble?'<div class="scene-bubble">'+esc(name?namedFanCopy(scene.bubble,name):scene.bubble)+'</div>':''}<img class="${expression.original?'original-expression':'expression-sticker'}" src="${asset(expression.file)}" alt="${esc(expression.alt)}">${hasPartner?`<img class="naiwa-pink" src="${asset('frog-wave.png')}" alt="${esc(name||'奶粉')}">`:""}${scene.mouseScene?`<img class="scene-naishu" src="${asset('naishu-cutout.png')}" alt="奶鼠">`:""}</div>`}<div class="story"><h1 tabindex="-1" id="scene-title">${esc(copy(name&&state.phase==='outcome'?state.outcome.title:scene.title))}</h1>${state.phase==='choice'?`${callback?`<div class="callback">${esc(name?namedFanCopy(callback,name):callback)}</div>`:''}<p>${esc(copy(scene.schoolScene?scene.text.replace(/^第 \d+ 周 [^。]+。今天的小目标：/,''):scene.text))}</p><div class="choices">${scene.choices.map((c,i)=>`<button class="choice" data-choice="${i}" ${c.disabledReason||(c.mods.money||0)<-state.stats.money?'disabled':''}><span class="choice-code">${'ABCDE'[i]}</span><span class="choice-content"><strong>${esc(choiceText(c,name))}</strong>${choiceNotice(c)?`<span class="choice-costs">${choiceNotice(c)}</span>`:""}</span><span class="choice-arrow" aria-hidden="true">›</span></button>`).join('')}</div><p class="mobile-rule">电量、学业、健康或心情归零即结束。</p>`:`<div class="outcome" role="status"><span class="outcome-label">${state.outcome.identityEvent?'身份日常':state.outcome.majorWork?'专业实践完成':scene.schoolScene?(state.outcome.schoolMakeup?'补学完成':'课堂记录'):state.outcome.miniGame?'活动完成':'选择 '+('ABCDE'[state.outcome.index]||'')}</span><p>${esc(copy(state.outcome.result)).replace(/\n/g,'<br>')}</p><div class="changes">${state.outcome.intimacyChange?'<span class="affection-change">亲密度 '+(state.outcome.intimacyChange>0?'+':'')+state.outcome.intimacyChange+'</span>':''}${state.outcome.project?'<span>课设 +'+state.outcome.project+'</span>':''}${G.keys.filter(k=>state.outcome.changes[k]).map(k=>`<span class="${state.outcome.changes[k]<0?'negative':''}">${G.labels[k]} ${state.outcome.changes[k]>0?'+':''}${state.outcome.changes[k]}</span>`).join('')}</div>${schoolWorkHTML()}${state.failed?'<div class="failure-notice">'+(state.failed==='fail-energy'?'电量归零，本局结束。':['fail-health','fail-mood'].includes(state.failed)?'健康或心情归零，奶蛙长眠。':state.failed==='fail-mouse-family'?'奶鼠全网呼叫奶家人，本局结束。':state.failed==='fail-course'?'两次缺交课设，本学期转入重修。':'学业归零，触发劝退。')+'</div>':''}<button class="button dark" id="next-scene">${state.failed||state.lottery?.won?'查看结局':scene.schoolScene||scene.majorScene?'继续':state.step===7?'今日结算':scene.kind==='三餐'&&!state.outcome.flags.missedMeal?'吃好了':'继续'}</button></div>`}</div>`;
}
function openCurrentMini(){const p=state.miniGames?.pending;if(!p)return;const a=G.miniDefinitions[p.key];const settle=value=>{if(state?.miniGames?.pending?.token!==p.token)return;state=G.completeMini(state,value);persist();};const done=value=>{try{settle(value);gameView();collectAchievements();}catch{toast('这次成绩没有结算，请再试一次。');gameView();}};window.DormMiniUI.open({key:p.key,token:p.token,title:a[1].split(' ·')[0],pink:!!state.romance?.connected,cost:a[2]+' 分钟'+(a[3]?' · ¥'+a[3]:''),onResult:settle,onCancel:()=>{if(state?.miniGames?.pending?.token===p.token){state=G.cancelMini(state);persist();}gameView();},onDone:done});}
function miniCollectionHTML(){if(!state.miniGames)return '';const p=state.miniGames.prizes;return '<section class="mini-prizes"><strong>校园收藏</strong><span>奶蛙 '+p.frog+'</span><span>奶粉 '+p.pink+'</span><span>奶鼠 '+p.mouse+'</span><button class="text-btn" id="open-mini-album">相册 ↗</button></section>';}
function bindCourseEditor(origin,current){
 document.querySelectorAll('[data-course-edit]').forEach(b=>b.onclick=()=>{
  if(!current()||b.disabled||!G.courseCatalog||!S?.coursePickerHTML)return;
  let majorId,selection,note;
  if(origin==='draft'){draftName=document.querySelector('#player-name').value;majorId=draftMajor;selection=draftSelection;}
  else if(origin==='legacy'){majorId=schoolOptInMajor;selection=schoolOptInSelection;note='确认选课后返回，加入课表时才会保存。';}
  else{const options=G.curriculumOptions(state);if(!options.canEdit)return;majorId=state.school.majorId;selection=options.queuedSelection||options.selection;note=options.note;}
  if(!selection?.electives?.length||!selection?.pe)selection=defaultCourseSelection();
  courseEdit={origin,majorId,selection:copyCourseSelection(selection),note,error:''};courseSelectionView();goTop();
 });
}
function courseSelectionView(){
 if(!courseEdit)return;
 renderEpoch++;clearCard();view='course-selection';const epoch=renderEpoch,editor=courseEdit,renderedState=state,current=()=>view==='course-selection'&&courseEdit===editor&&renderEpoch===epoch&&state===renderedState;
 const validation=courseValidation(editor.majorId,editor.selection);if(editor.error){validation.errors=[...(validation.errors||[]),editor.error];validation.valid=false;}
 const inGame=editor.origin==='school',legacy=inGame&&state.school?.revision===1,options=inGame?G.curriculumOptions(state):null;
 app.innerHTML=S.coursePickerHTML(G.courseCatalog,editor.selection,validation,{majorName:G.majors.find(m=>m.id===editor.majorId)?.name,note:editor.note,disabled:options?.canEdit===false,confirmLabel:inGame?(legacy?'加入选修 / 体育':'确认下周选课'):'确认选课',confirmNote:inGame?(legacy?'确认后加入后续课程，已发生的进度会保留。':'本周课表保持原安排，新选课从下周起生效。'):'确认后返回，入学时才会保存。'});
 const close=()=>{if(!current())return;courseEdit=null;if(editor.origin==='draft')traitsView();else schoolView();goTop();};
 document.querySelector('#course-cancel').onclick=close;
 document.querySelectorAll('[data-course-choice]').forEach(b=>b.onclick=()=>{
  if(!current())return;const id=b.dataset.courseChoice,isElective=G.courseCatalog.electives.some(c=>c.id===id),selection=copyCourseSelection(editor.selection);
  if(isElective)selection.electives=selection.electives.includes(id)?selection.electives.filter(x=>x!==id):[...selection.electives,id];else selection.pe=selection.pe===id?'':id;
  editor.selection=selection;editor.error='';courseSelectionView();
 });
 document.querySelector('#course-confirm').onclick=()=>{
  if(!current()||!courseValidation(editor.majorId,editor.selection).valid||(inGame&&!G.curriculumOptions(state).canEdit))return;
  try{
   if(editor.origin==='draft')draftSelection=copyCourseSelection(editor.selection);
   else if(editor.origin==='legacy')schoolOptInSelection=copyCourseSelection(editor.selection);
   else{state=G.selectCourses(state,copyCourseSelection(editor.selection));persist();}
   courseEdit=null;if(editor.origin==='draft')traitsView();else schoolView();goTop();
  }catch(error){editor.error=error?.message||'选课没有保存，请再调整一次。';courseSelectionView();}
 };
}
function schoolModel(){if(!S||!G.schoolView||!state?.school)return null;try{return G.schoolView(state);}catch{return null;}}
function schoolCardHTML(){return S&&G.schoolView?S.cardHTML(schoolModel()):'';}
function majorModel(){return U&&G.majorView&&state?G.majorView(state):null;}
function majorCardHTML(){return U?.cardHTML(majorModel())||'';}
function agendaHTML(){
 const model=schoolModel(),next=model?.next,t=G.task?.(state),late=t&&t.daysLeft<=1&&t.progress<t.target;
 const attendance=model?.records?.some(r=>r.risk>=4),urgent=late||attendance;
 const label=next?((next.day!==state.day?'第 '+next.day+' 天 · ':'')+next.time+' '+next.name):model?'今天没有待上课程':'我的课表';
 const alert=late?'课设即将截止':attendance?'留意缺勤记录':'';
 return '<details class="campus-agenda'+(urgent?' is-urgent':'')+'"><summary class="agenda-summary"><span class="agenda-label">校园日程</span><span class="agenda-next">'+esc(label)+'</span>'+(alert?'<span class="agenda-alert">'+esc(alert)+'</span>':'')+'<span class="agenda-chevron" aria-hidden="true">⌄</span></summary><div class="daily-dashboard">'+schoolCardHTML()+majorCardHTML()+'</div></details>'+taskHTML();
}
function bindMajorOpen(current){
 document.querySelectorAll('[data-major-listen-work]').forEach(b=>b.onclick=()=>{if(!current())return;try{playMajorMelody(JSON.parse(decodeURIComponent(b.dataset.majorListenWork)),current);}catch{toast('这段旋律暂时无法试听');}});
 document.querySelectorAll('[data-major-start]').forEach(b=>b.onclick=()=>{if(!current()||b.disabled)return;try{state=G.startMajor(state);persist();gameView();goTop();}catch(error){toast(error?.message||'完成眼前的安排后，再来试试。');}});
 document.querySelectorAll('[data-major-collection]').forEach(b=>b.onclick=()=>{if(!current())return;schoolReturn=view==='map'?'map':'game';schoolTab='catalog';schoolView();goTop();});
}
function majorInteractionView(){
 const renderedState=state,epoch=renderEpoch,model=majorModel(),current=()=>view==='game'&&state===renderedState&&renderEpoch===epoch&&!!state.majorLife?.pending;
 app.innerHTML='<div class="game-layout">'+statusPanelHTML()+'<section class="game-main"><div class="mobile-stats" style="--stat-count:'+G.statKeys(state.stats).length+'">'+statHTML(state.stats)+'</div>'+hungerHTML()+U.interactionHTML(model)+'</section></div>';
 const action=(name,value)=>{if(!current())return;try{state=G.majorAct(state,name,value);persist();gameView();collectAchievements();}catch(error){toast(error?.message||'这次修改没有保存，请再试一次。');}};
 document.querySelectorAll('[data-major-option]').forEach(b=>b.onclick=()=>{if(!current())return;const [field,value]=b.dataset.majorOption.split('|');action('set',{field,value});});
 document.querySelectorAll('[data-major-token]').forEach(b=>b.onclick=()=>{if(!current())return;action('set',{field:'token',value:b.dataset.majorToken});});
 const listen=document.querySelector('#major-listen');if(listen)listen.onclick=()=>{if(current())playMajorMelody(model.pending.preview,current);};
 const reference=document.querySelector('#major-listen-reference');if(reference)reference.onclick=()=>{if(current())playMajorMelody({...model.pending.preview,notes:model.pending.preview.referenceNotes},current);};
 document.querySelector('#major-submit').onclick=()=>{if(!document.querySelector('#major-submit')?.disabled)action(model.pending.submitAction);};
 document.querySelector('#major-cancel').onclick=()=>{if(!current())return;try{state=G.cancelMajor(state);persist();gameView();goTop();}catch(error){toast(error?.message||'暂时不能返回。');}};
 document.querySelector('#major-skip').onclick=()=>{if(!current())return;try{state=G.skipMajor(state);persist();gameView();goTop();}catch(error){toast(error?.message||'这次练习暂时不能完成。');}};
 document.querySelector('#pause-run').onclick=()=>{if(current()){home();goTop();}};
}
function schoolWorkHTML(){if(state.phase!=='outcome')return '';if(state.outcome?.majorWork)return U?.outcomeHTML(state.outcome.majorWork)||'';if(!S||!state.outcome?.schoolWork)return '';return '<section class="school-outcome-work" aria-label="本节课完成的作品"><div class="school-section-heading"><h2>课堂作品</h2></div>'+S.workHTML(state.outcome.schoolWork,state.school?.majorId)+'</section>';}
function bindSchoolOpen(origin,current){document.querySelectorAll('[data-school-open]').forEach(b=>b.onclick=()=>{if(!current())return;schoolReturn=origin;schoolTab='week';schoolOptInMajor='cs';schoolOptInSelection=defaultCourseSelection();schoolView();goTop();});}
function schoolView(){
 if(!state||!S||!G.schoolView){gameView();return;}
 renderEpoch++;clearCard();view='school';const epoch=renderEpoch,renderedState=state,current=()=>view==='school'&&state===renderedState&&renderEpoch===epoch,model=schoolModel();
 const back=()=>{if(!current())return;if(schoolReturn==='map')mapView();else gameView();goTop();};
 if(!model){
  app.innerHTML='<section class="school-page"><header class="school-page-heading"><div><h1>选择专业</h1></div><button class="back" id="school-back">返回'+(schoolReturn==='map'?'地图':'游戏')+'</button></header><p class="school-enroll-note">确认后加入课表，保留进度。</p>'+S.pickerHTML(G.majors,schoolOptInMajor,{legacy:true})+S.selectionSummaryHTML(G.courseCatalog,schoolOptInSelection,{note:'确认加入课表时保存选课。'})+'<div class="school-legacy-actions"><button class="button dark" id="school-enable">确认</button><button class="button white" id="school-cancel">取消</button></div></section>';
  document.querySelector('#school-back').onclick=back;document.querySelector('#school-cancel').onclick=back;
  document.querySelectorAll('[data-major]').forEach(b=>b.onclick=()=>{if(!current())return;schoolOptInMajor=b.dataset.major;if(!courseValidation(schoolOptInMajor,schoolOptInSelection).valid)schoolOptInSelection=defaultCourseSelection();schoolView();});
  document.querySelector('#school-enable').onclick=()=>{if(!current()||!G.enableSchool)return;try{const upgraded=G.enableSchool(state,schoolOptInMajor,copyCourseSelection(schoolOptInSelection));if(!upgraded?.school){toast('这份存档暂时不能加入课程。');return;}state=upgraded;persist();schoolView();toast('已启用课表');}catch{toast('这份存档暂时不能加入课程。');}};
  bindCourseEditor('legacy',current);return;
 }
 const options=G.curriculumOptions?G.curriculumOptions(state):{};options.legacy=state.school?.revision===1;options.pendingTimetable=state.school?.revision<3;
 app.innerHTML=S.timetableHTML(model,schoolTab,options).replace('</header>','</header>'+majorCardHTML())+(schoolTab==='catalog'?'<div class="major-school-collection">'+(U?.collectionHTML(majorModel())||'')+'</div>':'');const label=document.querySelector('.school-back-label');if(label)label.textContent=schoolReturn==='map'?'地图':'游戏';
 document.querySelector('#school-back').onclick=back;
 document.querySelectorAll('[data-school-tab]').forEach(b=>b.onclick=()=>{if(!current()||b.dataset.schoolTab===schoolTab)return;schoolTab=b.dataset.schoolTab;schoolView();});
 bindCourseEditor('school',current);
 bindMajorOpen(current);
}
function mapView(){
 clearCard();if(!state||['ending','dayEnd'].includes(state.phase)){gameView();return;}
 renderEpoch++;view='map';const renderedState=state,epoch=renderEpoch,model=W.model(state);if(!model.places.some(p=>p.id===campusPlace))campusPlace=model.currentId;const selected=campusPlace;
 app.innerHTML='<div class="game-layout map-game-layout">'+statusPanelHTML()+'<section class="game-main campus-main"><div class="mobile-stats" style="--stat-count:'+G.statKeys(state.stats).length+'">'+statHTML(state.stats)+'</div>'+hungerHTML()+agendaHTML()+M.render(state,model,selected,{asset,esc})+'</section></div>';
 const current=()=>view==='map'&&state===renderedState&&renderEpoch===epoch;bindSchoolOpen('map',current);
 bindMajorOpen(current);
 document.querySelector('#pause-run').onclick=()=>{if(current()){home();goTop();}};
 document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{if(!current())return;campusPlace=b.dataset.place;mapView();if(window.innerWidth<=600)document.querySelector('.campus-destination')?.scrollIntoView({block:'start',behavior:'smooth'});});
 document.querySelectorAll('[data-map-activity]').forEach(b=>b.onclick=()=>{if(!current()||b.disabled)return;try{state=W.startActivity(state,selected,b.dataset.mapActivity);persist();gameView();goTop();}catch{toast('这段空闲暂时安排不了，换一站看看。');}});
 document.querySelectorAll('[data-map-scene]').forEach(b=>b.onclick=()=>{if(current()){gameView();goTop();}});
 const back=document.querySelector('#campus-return');if(back)back.onclick=()=>{if(current()){gameView();goTop();}};
 const next=document.querySelector('#campus-next');if(next)next.onclick=()=>{if(!current()||state.phase!=='outcome')return;state=G.next(state);persist();gameView();goTop();};
}

function gameView(){
 renderEpoch++;clearCard();
 view='game';
 if(!state){home();return;}
 const withoutAttendancePlan=G.enableAttendancePlanRemoval(state);
 if(withoutAttendancePlan!==state){state=withoutAttendancePlan;persist();}
 const admissionUpgrade=G.enableFanBook(G.upgradeBreakfastRewards(G.upgradeDiningMenu(G.enableDailyAllowance(G.upgradeIdentityEvents(G.enableIdentityEvents(G.upgradeAdmission(state)))))),2);if(admissionUpgrade!==state){state=admissionUpgrade;persist();}
 const characterUpgrade=G.enableCharacter(G.enableCampusRevision(G.enableLottery(G.enableEvolution(G.enableCampus(G.enableWellness(G.enableMeetings(G.enableIllness(G.enableFood(G.enableRhythm(G.enableStory(G.enableRomance(G.enableBalance(G.enableCare(G.enableLife(state)))))))))))))));const upgraded=G.enableMini(G.enableMealTuning(G.enableExpansion(G.enableNutrition(G.enableAudit(G.enableJourneys(G.enableRelationships(G.enableSocialUpdate(G.enableDining(characterUpgrade)))))))));if(upgraded!==state){state=upgraded;persist();}
 if(state.phase==='ending'||state.phase==='dayEnd'){endingView();return;}
 if(U&&state.majorLife?.pending){majorInteractionView();return;}
 const renderedState=state,renderedEpoch=renderEpoch,scene=G.getScene(state),expression=E.scene(state,scene);
 if(!seenEvents.includes(scene.id)){seenEvents.push(scene.id);write('naiwa-dorm-events-v2',seenEvents);}
 recent=recent.filter(id=>id!==scene.id).concat(scene.id).slice(-24);write('naiwa-dorm-recent-v2',recent);
 const callback=scene.callback?.replace('前情后续 · 这件事和你此前的经历或当前状态有关。','').trim();
 app.innerHTML=`<div class="game-layout">${statusPanelHTML()}<section class="game-main"><div class="mobile-stats" style="--stat-count:${G.statKeys(state.stats).length}">${statHTML(state.stats)}</div>${hungerHTML()}${agendaHTML()}${miniCollectionHTML()}${openingBuffHTML()}${mealRecoveryHTML()}${fanHTML()}${lotteryCreditHTML()}${illnessHTML()}${careHTML()}${romanceHTML()}<div class="scene-campus-nav"><button id="campus-open" class="campus-open">校园地图 <span aria-hidden="true">↗</span></button></div><div class="scene-header"><span class="scene-time">${esc(scene.time)} · ${esc(scene.place)}${scene.schoolScene?'<span class="school-course-label">'+esc(scene.categoryLabel||({pe:'体育课',elective:'选修课',common:'公共课'}[scene.category])||'专业课')+'</span>':''}</span><span class="scene-step">第 ${state.day} 天 · ${sceneProgress()}</span></div>${['lab-work','lab-apply'].includes(state.campusLife?.pending?.key)?researchHTML():''}${scene.kind==='三餐'?C.render(state,scene,{asset,esc,narrative,stall:mealStall}):normalSceneHTML(scene,expression,callback)}${freeTimeHTML()}</section></div>`;
 bindSchoolOpen('game',()=>view==='game'&&state===renderedState&&renderEpoch===renderedEpoch);
 bindFans(()=>view==='game'&&state===renderedState&&renderEpoch===renderedEpoch);
 bindMajorOpen(()=>view==='game'&&state===renderedState&&renderEpoch===renderedEpoch);
 document.querySelector('#pause-run').onclick=()=>{if(view==='game'&&state===renderedState&&renderEpoch===renderedEpoch){home();goTop();}};
 document.querySelector('#campus-open').onclick=()=>{if(view!=='game'||state!==renderedState||renderEpoch!==renderedEpoch)return;campusPlace=W.currentPlace(state);mapView();goTop();};
 const mapShortcut=document.querySelector('#campus-shortcut');if(mapShortcut)mapShortcut.onclick=()=>{if(view!=='game'||state!==renderedState||renderEpoch!==renderedEpoch)return;campusPlace=W.currentPlace(state);mapView();goTop();};
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{if(view!=='game'||state!==renderedState||renderEpoch!==renderedEpoch||state.phase!=='choice'||b.disabled)return;try{state=G.choose(state,Number(b.dataset.choice));persist();if(state.failed)speak('failure');gameView();collectAchievements();}catch{toast('这个选择暂时不可用。');}});
 document.querySelectorAll('[data-activity]').forEach(b=>b.onclick=()=>{if(view!=='game'||state!==renderedState||renderEpoch!==renderedEpoch)return;try{state=G.startActivity(state,b.dataset.activity);persist();gameView();goTop();}catch{toast('这段时间暂时安排不了，可以换一个选择。');}});
 if(state.miniGames?.pending)openCurrentMini();const miniAlbum=document.querySelector('#open-mini-album');if(miniAlbum)miniAlbum.onclick=()=>window.DormMiniUI.open({key:'mini-photo',token:'album-'+renderEpoch,title:'校园相册',readonly:true,pink:!!state.romance?.connected,cost:'照片保存在当前浏览器，可单独保存',onCancel:()=>{},onDone:()=>{}});
 bindClinic(renderedState);bindExtraCare(renderedState);
 document.querySelectorAll('[data-stall]').forEach(b=>b.onclick=()=>{if(view!=='game'||state!==renderedState||renderEpoch!==renderedEpoch)return;mealStall=b.dataset.stall;gameView();});
 const next=document.querySelector('#next-scene');
 if(next)next.onclick=()=>{if(view!=='game'||state!==renderedState||renderEpoch!==renderedEpoch||state.phase!=='outcome')return;state=G.next(state);persist();gameView();goTop();document.querySelector('#scene-title')?.focus({preventScroll:true});};
 if(state.phase==='outcome')collectAchievements();
}

function positiveRoutesHTML(){
 const routes=G.availablePositiveEndings(state);if(!routes.length)return '';
 return '<section class="positive-routes" aria-label="可达成的正向结局"><h2>新的结局</h2>'+routes.map(e=>'<button type="button" class="positive-route" data-positive-finish="'+esc(e.id)+'"><img src="'+asset(E.ending(e).file)+'" alt=""><strong>'+esc(e.name)+'</strong><span aria-hidden="true">↗</span></button>').join('')+'</section>';
}
function endingView(){
 renderEpoch++;clearCard();
 view='ending';
 const renderedState=state,e=G.ending(state),daily=state.phase==='dayEnd',failed=!!e.failure,positive=!!state.positiveEnding,rest=daily?G.restPreview(state):null;
 const unlocked=recordAchievements();
 const finale=recordFinale(),finaleTag=finale?'<button class="ending-route-tag" data-ending-route="'+esc(finale.id)+'">结局 · '+esc(finale.name)+' <span aria-hidden="true">↗</span></button>':'';
 if(unlocked.length&&!failed)speak('award');
 const today=state.log.filter(x=>x.day===state.day);
 const stats=G.statKeys(state.stats).map(k=>`<span class="${k==='money'&&state.stats[k]>9999?'large-money':''}">${G.labels[k]}<b>${k==='money'?'¥':''}${state.stats[k]}</b></span>`).join('');
 const recap=today.map(x=>{
  const name=x.fanContactId?fanName(x.fanContactId):'';
  return `<li><time>${x.time}</time><span><strong>${esc(narrative(x.title,name))}</strong><br><b>${esc(name?namedFanCopy(x.choice,name):x.choice)}</b></span></li>`;
 }).join('');
 const signed=n=>(n>=0?'+':'')+n;
 const positiveActions=positive?`
  <p class="ending-next-note" id="ending-next-note">卡片保存为图片。接下来可以继续本局，或开始新一局。</p>
  <button class="button dark" id="resume-positive">继续本局 · 第 ${state.day+1} 天</button>
  <button class="button white" id="restart">开始新一局</button>`:'';
 const dailyActions=daily?`<div class="rest-note"><h3>明日变化</h3><div><span>电量 <b>+${rest.changes.energy||0}</b></span><span>生活费 <b>${signed(rest.changes.money||0)}</b></span><span>新课压力 <b>学业 −${rest.pressure}</b></span>${Number.isFinite(state.stats.health)?`<span>健康 <b>${signed(rest.changes.health||0)}</b></span><span>心情 <b>${signed(rest.changes.mood||0)}</b></span>`:''}</div>${rest.failed?'<strong class="rest-warning">'+(['fail-health','fail-mood'].includes(rest.failed)?'健康或心情不足，继续拖延会触发奶蛙长眠。':'学业不足，继续明天会触发劝退。')+'</strong>':''}</div><button class="button dark" id="continue-day">继续第 ${state.day+1} 天</button><button class="button white" id="retire-run">结束本局</button>`:'';
 app.innerHTML=`<section class="ending-page"><div class="ending-top"><p class="eyebrow">第 ${state.day} 天</p><h1>${failed?'这次，先到这里。':daily?'今天，平安回寝。':positive?'这一段，圆满收尾。':'本次人生已结束。'}</h1>${finaleTag}<p>${unlocked.length?'新成就 +'+unlocked.length:'今日结算'} · 成就 ${currentAchievementCount()} / ${A.items.length}</p></div><div class="ending-layout"><article class="ending-card ${failed?'failed-card':positive?'positive-card':''}" id="result-card"><div class="card-top"><span>奶蛙宿舍</span><span>${e.icon}</span></div><img class="ending-frog ending-meme" src="${asset(E.ending(e).file)}" alt="${esc(E.ending(e).alt)}"><span class="eyebrow">${esc(state.name)}</span><h2 class="ending-name">${e.name}</h2><p class="ending-quote">${e.quote}</p><div class="ending-stats" style="--ending-columns:${G.statKeys(state.stats).length>4?3:4}">${stats}</div><div class="ending-card-bottom"><span>重生之我在宿舍当奶蛙</span><span>第 ${state.day} 天</span></div></article><div class="ending-extra">${daily?positiveRoutesHTML():''}${taskHTML()}${illnessHTML()}${careHTML()}${romanceHTML()}<div class="ending-actions">${dailyActions}<button class="button ${daily||positive?'white':'dark'}" id="save-card"${positive?' aria-describedby="ending-next-note"':''}>保存卡片</button><button class="button white" id="copy-result">复制结果</button>${positiveActions}${canShareStart(state)?'<button class="text-btn" id="share-start">分享同一起点</button>':''}${positive?'':'<button class="quit-btn" id="restart">重新开始</button>'}</div><div id="image-fallback"></div><details class="recap"><summary>今日回顾</summary><ol>${recap||'<li>今天还没来得及出门。</li>'}</ol></details></div></div></section>`;
 bindClinic(renderedState);bindExtraCare(renderedState);
 document.querySelectorAll('[data-ending-route]').forEach(b=>b.onclick=()=>{collectionTab='finales';showAchievement(b.dataset.endingRoute,'collection',true);});
 document.querySelector('#restart').onclick=()=>startDraft();
 document.querySelector('#copy-result').onclick=()=>copyResult(e);
 if(canShareStart(state))document.querySelector('#share-start').onclick=()=>shareStart(state);
 document.querySelector('#save-card').onclick=()=>saveCard(e);
 document.querySelectorAll('[data-positive-finish]').forEach(b=>b.onclick=()=>{if(view!=='ending'||state!==renderedState||state.phase!=='dayEnd')return;try{state=G.finishPositive(state,b.dataset.positiveFinish);persist();endingView();speak('award');goTop();}catch(error){toast(error?.message||'这条结局还没有达成。');}});
 if(positive)document.querySelector('#resume-positive').onclick=()=>{if(view!=='ending'||state!==renderedState||!state.positiveEnding)return;try{state=G.continueDay(G.resumePositive(state));persist();if(state.failed)speak('failure');gameView();goTop();}catch(error){toast(error?.message||'暂时不能继续，请重新打开存档。');}};
 if(daily){document.querySelector('#continue-day').onclick=()=>{if(view!=='ending'||state!==renderedState||state.phase!=='dayEnd')return;state=G.continueDay(G.enableEconomy(state));persist();if(state.failed)speak('failure');gameView();goTop();};document.querySelector('#retire-run').onclick=()=>{if(view!=='ending'||state!==renderedState||state.phase!=='dayEnd')return;state=G.retire(state);persist();endingView();goTop();};}
 if(unlocked.length)showUnlocks(unlocked);
}


async function copyResult(e){const text=`我的奶蛙人生来到第${state.day}天，称号是「${e.name}」！\n${e.quote}\n电量 ${state.stats.energy} · 生活费 ¥${state.stats.money} · 人缘 ${state.stats.social} · 学业 ${state.stats.study}\n${Number.isFinite(state.stats.health)?'健康 '+state.stats.health+' · 心情 '+state.stats.mood+(Number.isFinite(state.stats.charm)?' · 魅力 '+state.stats.charm:'')+'\n':''}你会活成哪只奶蛙？《重生之我在宿舍当奶蛙》`;try{await navigator.clipboard.writeText(text);toast('结局已复制，发给室友对答案吧。');}catch{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.left='-9999px';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();toast(ok?'结局已复制。':'复制受限，可以直接保存结局卡。');}}
function wrap(ctx,text,x,y,width,line){let part='';for(const char of text){if(ctx.measureText(part+char).width>width){ctx.fillText(part,x,y);part=char;y+=line;}else part+=char;}if(part)ctx.fillText(part,x,y);return y+line;}
async function saveCard(e){const cardState=state;const b=document.querySelector('#save-card');b.disabled=true;b.textContent='正在制作结局卡…';try{const canvas=document.createElement('canvas');canvas.width=750;canvas.height=G.statKeys(cardState.stats).length>6?1130:1050;const ctx=canvas.getContext('2d');ctx.fillStyle='#f5f5f7';ctx.fillRect(0,0,750,canvas.height);ctx.strokeStyle='#1d1d1f';ctx.lineWidth=2;ctx.fillStyle='#6e6e73';ctx.font='bold 19px sans-serif';ctx.fillText('ROOM 404 / DAY '+cardState.day+' · 奶蛙人生结算单',55,75);const img=new Image();img.src=asset(E.ending(e).file);await img.decode();const scale=Math.min(330/img.width,370/img.height),w=img.width*scale,h=img.height*scale;ctx.drawImage(img,375-w/2,115,w,h);ctx.fillStyle='#6e6e73';ctx.font='23px sans-serif';ctx.fillText(cardState.name+' 的今日称号',55,540);ctx.fillStyle='#1d1d1f';ctx.font='bold 52px sans-serif';ctx.fillText(e.name,55,615);ctx.font='25px sans-serif';wrap(ctx,e.quote,55,675,640,40);ctx.strokeStyle='#d2d2d7';ctx.beginPath();ctx.moveTo(55,800);ctx.lineTo(695,800);ctx.stroke();G.statKeys(cardState.stats).forEach((k,i)=>{const columns=G.statKeys(cardState.stats).length>4?3:4,x=55+(i%columns)*(640/columns),y=columns===3?825+Math.floor(i/3)*75:850;ctx.fillStyle='#6e6e73';ctx.font='21px sans-serif';ctx.fillText(G.labels[k],x,y);ctx.fillStyle='#1d1d1f';ctx.font='bold 37px monospace';ctx.fillText((k==='money'?'¥':'')+cardState.stats[k],x,y+42);});ctx.fillStyle='#6e6e73';ctx.font='19px sans-serif';ctx.fillText('重生之我在宿舍当奶蛙',55,canvas.height-65);ctx.textAlign='right';ctx.fillText('你会活成哪只？',695,canvas.height-65);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('无法生成图片');if(state!==cardState||view!=='ending')return;clearCard();const url=cardUrl=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='奶蛙宿舍-'+e.name+'.png';document.body.append(a);a.click();a.remove();const fallback=document.querySelector('#image-fallback');fallback.innerHTML='<p class="download-fallback">若手机没有弹出下载，长按下面的图片保存。</p>';const preview=document.createElement('img');preview.src=url;preview.className='download-preview';preview.alt='长按保存奶蛙结局卡';fallback.append(preview);toast('结局卡已生成，可下载或长按图片保存。');}catch{toast('图片暂时没生成成功，可以先复制结局。');}finally{b.disabled=false;b.textContent='保存卡片';}}
function showUnlocks(items){
 document.querySelector('#unlock-list').innerHTML=items.map(e=>'<button type="button" class="unlock-card" data-unlock-achievement="'+esc(e.id)+'" aria-label="查看'+esc(e.name)+'的触发记录"><span class="unlock-icon" aria-hidden="true"><img src="'+asset(E.ending(e).file)+'" alt=""></span><span class="unlock-copy">'+achievementBadge(e)+'<strong class="unlock-name">'+esc(e.name)+'</strong><span class="unlock-quote">'+esc(e.quote)+'</span><small class="collection-hint">查看触发记录 ↗</small></span></button>').join('');
 document.querySelectorAll('[data-unlock-achievement]').forEach(b=>b.onclick=()=>showAchievement(b.dataset.unlockAchievement,'unlock'));
 const modal=document.querySelector('#unlock-modal');if(!modal.open)modal.showModal();
}
function achievementBadge(e){return e.hidden?'<small class="achievement-kind">隐藏</small>':e.difficulty==='hard'&&e.category==='挑战'?'<small class="achievement-kind">高难</small>':'';}
function legacyAchievements(){return seen.filter(id=>!A.items.some(e=>e.id===id)).map(id=>G.endings.find(e=>e.id===id)).filter(Boolean);}
function showCollection(){
 const legacy=legacyAchievements(),historical=collectionTab==='legacy'&&legacy.length>0;
 if(!historical&&collectionTab!=='finales')collectionTab='current';
 const endingTab=collectionTab==='finales';
 document.querySelector('.modal-intro').textContent=endingTab?'已发现 '+Object.keys(finales).length+' / '+F.items.length:historical?'往期收录 · '+legacy.length:'已解锁 '+currentAchievementCount()+' / '+A.items.length;
 document.querySelector('#collection-tabs').innerHTML=['current','finales',...(legacy.length?['legacy']:[])].map(tab=>'<button type="button" class="collection-tab'+(collectionTab===tab?' selected':'')+'" data-collection-tab="'+tab+'" aria-pressed="'+(collectionTab===tab)+'">'+({current:'当前成就',finales:'结局',legacy:'往期收录'}[tab])+'</button>').join('');
 const lock='<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
 document.querySelector('#collection-grid').innerHTML=(endingTab?F.items:historical?legacy:A.items).map(e=>{
  const known=endingTab?!!finales[e.id]:seen.includes(e.id);
  const name=endingTab?finales[e.id]?.name||e.name:e.name;
  return known?'<button type="button" class="collection-item unlocked" '+(endingTab?'data-finale':'data-achievement')+'="'+esc(e.id)+'" aria-label="查看'+esc(name)+'的触发记录"><span class="collection-meme"><img src="'+asset(E.ending(e).file)+'" alt=""></span><strong class="collection-name">'+esc(name)+'</strong>'+achievementBadge(e)+'<span class="collection-hint" aria-hidden="true">↗</span></button>':'<div class="collection-item locked" aria-label="未解锁">'+lock+'</div>';
 }).join('');
 document.querySelectorAll('[data-collection-tab]').forEach(b=>b.onclick=()=>{collectionTab=b.dataset.collectionTab;showCollection();});
 document.querySelectorAll('[data-achievement]').forEach(b=>b.onclick=()=>showAchievement(b.dataset.achievement,'collection'));
 document.querySelectorAll('[data-finale]').forEach(b=>b.onclick=()=>showAchievement(b.dataset.finale,'collection',true));
 const modal=document.querySelector('#collection-modal');if(!modal.open)modal.showModal();
}
function showAchievement(id,origin,isFinale=false){
 if(isFinale?!finales[id]:!seen.includes(id))return;
 const current=A.items.find(e=>e.id===id),e=isFinale?F.items.find(e=>e.id===id):current||G.endings.find(e=>e.id===id);if(!e)return;
 const proof=isFinale?finales[id]:achievementEvidence[id],facts=Array.isArray(proof?.facts)?proof.facts.filter(s=>typeof s==='string').slice(0,8):[];
 const rule=typeof proof?.rule==='string'?proof.rule:isFinale?e.rule:current?A.describe(id).rule:A.legacyRule(id);
 const oldRule=!isFinale&&current&&!facts.length?'<p class="achievement-legacy">旧版收录条件：'+esc(A.legacyRule(id))+'</p>':'';
 document.querySelector('#achievement-detail-title').textContent=isFinale?proof?.name||e.name:e.name;
 document.querySelector('#achievement-detail-body').innerHTML='<div class="achievement-detail-art"><img src="'+asset(E.ending(e).file)+'" alt="'+esc(E.ending(e).alt)+'">'+achievementBadge(e)+'</div>'+oldRule+'<p class="achievement-detail-rule">'+esc(rule||'旧版结局记录。')+'</p>'+(facts.length?'<p class="collection-meta">'+esc(isFinale?proof.player||'奶蛙':proof.name||'奶蛙')+' · 第 '+esc(proof.day)+' 天'+(isFinale?'达成':'解锁')+'</p><ul class="achievement-facts">'+facts.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>':'<p class="achievement-legacy">旧版已收录，未保存当时的触发记录。'+(!isFinale&&current?'以上为当前解锁条件。':'')+'</p>');
 achievementReturn=origin;document.querySelector(origin==='unlock'?'#unlock-modal':'#collection-modal').close();
 document.querySelector('#achievement-detail').showModal();
}
function closeAchievement(){
 document.querySelector('#achievement-detail').close();
 if(achievementReturn==='unlock')document.querySelector('#unlock-modal').showModal();else showCollection();
}
document.querySelector('#achievement-detail-close').onclick=document.querySelector('#achievement-detail-back').onclick=closeAchievement;
document.querySelector('#achievement-detail').oncancel=e=>{e.preventDefault();closeAchievement();};
document.querySelector('#achievement-detail').onclick=e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeAchievement();}};
document.querySelector('#collection-btn').onclick=showCollection;document.querySelector('#close-modal').onclick=document.querySelector('#close-modal-bottom').onclick=()=>document.querySelector('#collection-modal').close();document.querySelector('#collection-modal').onclick=e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();}};
document.querySelector('#unlock-close').onclick=document.querySelector('#unlock-accept').onclick=()=>document.querySelector('#unlock-modal').close();
document.querySelector('#unlock-book').onclick=()=>{document.querySelector('#unlock-modal').close();showCollection();};
document.querySelector('#unlock-modal').onclick=e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();}};
document.querySelector('#sound-btn').onclick=()=>{sound=!sound;write('naiwa-dorm-sound',sound);soundUI();if(sound)speak('award',true);else{stopVoice();stopMajorAudio();}};
document.querySelector('.brand').onclick=e=>{e.preventDefault();home();goTop();};
document.querySelector('#version-btn').textContent=document.querySelector('#footer-version').textContent='v'+RELEASE.version;
document.querySelector('#version-btn').onclick=showRelease;
document.querySelector('#release-close').onclick=document.querySelector('#release-accept').onclick=dismissRelease;
document.querySelector('#release-modal').oncancel=e=>{e.preventDefault();dismissRelease();};
document.querySelector('#release-modal').onclick=e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dismissRelease();}};
window.DormMusic?.bind(document.querySelector('#music-btn'),()=>toast('背景音乐暂时无法播放，请再点一次。'));
soundUI();updateBook();home();
if(read('naiwa-dorm-release-hidden',null)!==RELEASE.version)showRelease();
})();
