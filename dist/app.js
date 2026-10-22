(()=>{
'use strict';
const G=window.DormGame,app=document.querySelector('#app'),saveKey='naiwa-dorm-run-v2',bookKey='naiwa-dorm-endings-v1';
const read=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k))??fallback;}catch{return fallback;}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=G.restore(read(saveKey,null));
let draftSeed=Date.now()>>>0,offered=G.newDraft(draftSeed),selected=[],draftName='',sound=read('naiwa-dorm-sound',true)===true,view='home',toastTimer;
let seen=read(bookKey,[]);if(!Array.isArray(seen))seen=[];seen=[...new Set(seen.filter(id=>G.endings.some(e=>e.id===id)))];
const asset=name=>window.DormAssets?.[name]||'./assets/'+name;
let recent=read('naiwa-dorm-recent-v2',[]),seenEvents=read('naiwa-dorm-events-v2',[]);
if(!Array.isArray(recent))recent=[];if(!Array.isArray(seenEvents))seenEvents=[];
const awardVoice=new Audio(asset('eat-ganbadie.mp3'));awardVoice.volume=.25;awardVoice.preload='auto';
const laugh=new Audio(asset('laugh.mp3'));laugh.volume=.22;laugh.preload='auto';
let activeVoice=null,voiceTimer,cardUrl=null;
function stopVoice(){clearTimeout(voiceTimer);if(activeVoice){activeVoice.pause();activeVoice.currentTime=0;activeVoice=null;}}
function speak(kind='award',preview=false){
 if(!sound)return;stopVoice();activeVoice=kind==='failure'?laugh:awardVoice;
 activeVoice.currentTime=0;activeVoice.play().catch(()=>{if(preview)toast('音效暂时无法播放，请再点一次。');});
 voiceTimer=setTimeout(stopVoice,kind==='failure'?1600:2200);
}
function clearCard(){if(cardUrl){URL.revokeObjectURL(cardUrl);cardUrl=null;}}
function toast(s){const t=document.querySelector('#toast');t.textContent=s;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2400);}
function persist(){if(state&&!write(saveKey,state))toast('当前浏览器不能保存进度，请保持页面打开。');}
function goTop(){window.scrollTo({top:0,behavior:'instant'});}
function soundUI(){const b=document.querySelector('#sound-btn');b.textContent=sound?'音效开':'音效关';b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'关闭音效':'开启音效');}
function updateBook(){document.querySelector('#collection-count').textContent=seen.length+'/'+G.endings.length;}
function statHTML(s){return G.statKeys(s).map(k=>`<div class="stat ${s[k]<(k==='money'?8:20)?'warning':''}"><div class="stat-head"><span>${G.labels[k]}</span><b>${k==='money'?'¥':''}${s[k]}</b></div><div class="stat-track"><i style="width:${Math.min(100,s[k])}%"></i></div></div>`).join('');}
function home(){
 clearCard();
 view='home';
 app.innerHTML=`<section class="hero"><p class="hero-kicker">重生之</p><h1>我在宿舍<span>当奶娃。</span></h1><p class="hero-description">选两项天赋，过一天大学生活。</p><div class="hero-actions"><button class="button dark" id="new-run">开始新生活</button>${state?'<button class="button white" id="resume-run">'+(state.phase==='ending'?'上次结局':'继续上次')+'</button>':''}</div><div class="hero-visual"><img class="hero-frog" src="${asset('frog.png')}" alt="准备入住大学宿舍的奶娃"></div><div class="tiny-info"><span>${G.traits.length} 种天赋</span><span>${G.eventCount} 种校园事件</span><span>${G.endings.length} 项成就</span></div></section>`;
 document.querySelector('#new-run').onclick=()=>{selected=[];draftSeed=Date.now()>>>0;offered=G.newDraft(draftSeed);draftName=state?.name||'';traitsView();goTop();};
 if(state)document.querySelector('#resume-run').onclick=()=>{gameView();goTop();};
}

function traitsView(){
 clearCard();
 view='traits';
 app.innerHTML=`<div class="page-heading"><div><h1>选两项天赋。</h1><p>${G.traits.length} 种天赋 · 换批保留已选</p></div><button class="back" id="back-home">返回</button></div><div class="trait-layout"><div class="trait-grid">${offered.map(id=>{const t=G.traits.find(t=>t.id===id);return`<button class="trait-card ${selected.includes(id)?'selected':''}" data-trait="${id}" aria-pressed="${selected.includes(id)}"><span class="check">${selected.includes(id)?'✓':''}</span><span class="icon">${t.icon}</span><h3>${t.name}</h3><p>${t.desc}</p><span class="trait-detail">${G.keys.filter(k=>t.mods[k]).map(k=>G.labels[k]+(t.mods[k]>0?'+':'')+t.mods[k]).join(' · ')}</span></button>`;}).join('')}</div><aside class="admission"><img src="${asset('frog-wave.png')}" alt="挥手的奶娃"><label class="name-label" for="player-name">你的名字</label><input class="name-input" id="player-name" maxlength="12" placeholder="奶娃同学" value="${esc(draftName)}" autocomplete="off"><div class="selection-slots">${[0,1].map(i=>selected[i]?`<div class="selection-slot filled"><span>${esc(G.traits.find(t=>t.id===selected[i]).name)}</span><button class="remove-trait" data-remove-trait="${selected[i]}" aria-label="取消天赋：${esc(G.traits.find(t=>t.id===selected[i]).name)}">×</button></div>`:'<div class="selection-slot">未选择</div>').join('')}</div><button class="button dark full" id="enroll" ${selected.length!==2?'disabled':''}>入住宿舍</button><button class="quit-btn" id="reroll">换一批</button></aside></div>`;
 document.querySelectorAll('[data-trait]').forEach(b=>b.onclick=()=>{draftName=document.querySelector('#player-name').value;const id=b.dataset.trait;if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<2)selected.push(id);else{toast('先取消一项天赋。');return;}traitsView();});
 document.querySelectorAll('[data-remove-trait]').forEach(b=>b.onclick=()=>{draftName=document.querySelector('#player-name').value;selected=selected.filter(id=>id!==b.dataset.removeTrait);traitsView();});
 document.querySelector('#player-name').oninput=e=>draftName=e.target.value;
 document.querySelector('#back-home').onclick=()=>{home();goTop();};
 document.querySelector('#reroll').onclick=()=>{draftName=document.querySelector('#player-name').value;draftSeed=(draftSeed+7391)>>>0;offered=G.newDraft(draftSeed,selected,offered);traitsView();};
 document.querySelector('#enroll').onclick=()=>{if(selected.length!==2)return;state=G.create(draftSeed,selected,draftName,recent);persist();gameView();goTop();};
}

function openingBuffHTML(){
 if(!state.openingBuff||state.day!==1||state.step!==0)return '';
 const buff=G.openingBuffs.find(b=>b.id===state.openingBuff.id);
 return '<div class="opening-buff" role="status"><span aria-hidden="true">✦</span> 开局加成 · '+esc(buff.name)+'<b>'+G.labels[buff.key]+' +'+state.openingBuff.amount+'</b></div>';
}
function gameView(){
 clearCard();
 view='game';
 if(!state){home();return;}
 const upgraded=G.enableLife(state);if(upgraded!==state){state=upgraded;persist();}
 if(state.phase==='ending'||state.phase==='dayEnd'){endingView();return;}
 const scene=G.getScene(state);
 if(!seenEvents.includes(scene.id)){seenEvents.push(scene.id);write('naiwa-dorm-events-v2',seenEvents);}
 recent=recent.filter(id=>id!==scene.id).concat(scene.id).slice(-24);write('naiwa-dorm-recent-v2',recent);
 const callback=scene.callback?.replace('前情后续 · 这件事和你此前的经历或当前状态有关。','').trim();
 app.innerHTML=`<div class="game-layout"><aside class="status-panel"><div class="player-title"><img class="player-avatar" src="${asset('frog.png')}" alt=""><b>${esc(state.name)}</b></div><div class="stats">${statHTML(state.stats)}</div><p class="status-rule">电量、学业或健康归零，本局结束。</p><div class="trait-chips">${state.traits.map(id=>`<span>${esc(G.traits.find(t=>t.id===id).name)}</span>`).join('')}</div><button class="quit-btn" id="pause-run">返回首页</button></aside><section class="game-main"><div class="mobile-stats" style="--stat-count:${G.statKeys(state.stats).length}">${statHTML(state.stats)}</div>${openingBuffHTML()}<div class="scene-header"><span class="scene-time">${scene.time} · ${esc(scene.place)}</span><span class="scene-step">第 ${state.day} 天 · ${state.step+1} / 8</span></div><div class="scene-art ${scene.kind==='三餐'?'meal-art':''}"><span class="scene-doodle" aria-hidden="true">${scene.emoji}</span><div class="scene-bubble">${esc(scene.bubble)}</div><img src="${asset(state.step%2?'frog-wave.png':'frog.png')}" alt="今日份奶娃"></div><div class="story"><h1 tabindex="-1" id="scene-title">${esc(scene.title)}</h1>${state.phase==='choice'?`${callback?`<div class="callback">${esc(callback)}</div>`:''}<p>${esc(scene.text)}</p><div class="choices">${scene.choices.map((c,i)=>`<button class="choice" data-choice="${i}" ${(c.mods.money||0)<-state.stats.money?'disabled':''}><span class="choice-code">${'ABCDE'[i]}</span><span class="choice-content"><strong>${esc(c.text)}</strong><span class="choice-costs">${G.keys.filter(k=>c.mods[k]).map(k=>`<i class="${(k==='energy'||k==='study'||k==='health')&&state.stats[k]+c.mods[k]<=0?'danger':''}">${G.labels[k]} ${c.mods[k]>0?'+':''}${c.mods[k]}</i>`).join('')}${c.roll?'<i>概率变化</i>':''}${(c.mods.money||0)<-state.stats.money?'<i class="danger">饭钱不足</i>':''}</span></span><span class="choice-arrow" aria-hidden="true">›</span></button>`).join('')}</div><p class="mobile-rule">电量、学业或健康归零，本局结束。</p>`:`<div class="outcome" role="status"><span class="outcome-label">选择 ${'ABCDE'[state.outcome.index]}</span><p>${esc(state.outcome.result).replace(/\n/g,'<br>')}</p><div class="changes">${G.keys.filter(k=>state.outcome.changes[k]).map(k=>`<span class="${state.outcome.changes[k]<0?'negative':''}">${G.labels[k]} ${state.outcome.changes[k]>0?'+':''}${state.outcome.changes[k]}</span>`).join('')}</div>${state.failed?'<div class="failure-notice">'+(state.failed==='fail-energy'?'电量归零，本局结束。':state.failed==='fail-health'?'健康归零，奶娃需要休养。':'学业归零，触发劝退。')+'</div>':''}<button class="button dark" id="next-scene">${state.failed?'查看结局':state.step===7?'今日结算':scene.kind==='三餐'&&!state.outcome.flags.missedMeal?'吃好了':'继续'}</button></div>`}</div></section></div>`;
 document.querySelector('#pause-run').onclick=()=>{home();goTop();};
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{try{state=G.choose(state,Number(b.dataset.choice));persist();if(state.failed)speak('failure');gameView();}catch{toast('这个选择暂时不可用。');}});
 const next=document.querySelector('#next-scene');
 if(next)next.onclick=()=>{state=G.next(state);persist();gameView();goTop();document.querySelector('#scene-title')?.focus({preventScroll:true});};
}

function endingView(){
 clearCard();
 view='ending';
 const e=G.ending(state),daily=state.phase==='dayEnd',failed=!!e.failure,rest=daily?G.restPreview(state):null;
 const unlocked=G.achievements(state).filter(item=>!seen.includes(item.id));
 if(unlocked.length){seen.push(...unlocked.map(item=>item.id));write(bookKey,seen);updateBook();if(!failed&&unlocked.some(item=>(['freshman','week','degree','honor'].includes(item.id)||item.hidden||item.difficulty==='hard')))speak('award');}
 const today=state.log.filter(x=>x.day===state.day);
 const stats=G.statKeys(state.stats).map(k=>`<span>${G.labels[k]}<b>${k==='money'?'¥':''}${state.stats[k]}</b></span>`).join('');
 const recap=today.map(x=>`<li><time>${x.time}</time><span><strong>${esc(x.title)}</strong><br><b>${esc(x.choice)}</b></span></li>`).join('');
 const dailyActions=daily?`<div class="rest-note"><h3>明日变化</h3><div><span>电量 <b>+${rest.changes.energy||0}</b></span><span>饭钱 <b>−${Math.abs(rest.changes.money||0)}</b></span><span>新课压力 <b>学业 −${rest.pressure}</b></span>${Number.isFinite(state.stats.health)?`<span>健康 <b>+${rest.changes.health||0}</b></span><span>心情 <b>+${rest.changes.mood||0}</b></span>`:''}</div>${rest.failed?'<strong class="rest-warning">学业不足，继续明天会触发劝退。</strong>':''}</div><button class="button dark" id="continue-day">继续第 ${state.day+1} 天</button><button class="button white" id="retire-run">结束本局</button>`:'';
 app.innerHTML=`<section class="ending-page"><div class="ending-top"><p class="eyebrow">第 ${state.day} 天</p><h1>${failed?'这次，先到这里。':daily?'今天，平安回寝。':'本次人生已结束。'}</h1><p>${unlocked.length?'新成就 +'+unlocked.length:'成就已收录'} · ${seen.length} / ${G.endings.length}</p></div><div class="ending-layout"><article class="ending-card ${failed?'failed-card':''}" id="result-card"><div class="card-top"><span>奶娃宿舍</span><span>${e.icon}</span></div><img class="ending-frog" src="${asset('frog.png')}" alt="你的奶娃结局"><span class="eyebrow">${esc(state.name)}</span><h2 class="ending-name">${e.name}</h2><p class="ending-quote">${e.quote}</p><div class="ending-stats" style="--ending-columns:${G.statKeys(state.stats).length>4?3:4}">${stats}</div><div class="ending-card-bottom"><span>重生之我在宿舍当奶娃</span><span>第 ${state.day} 天</span></div></article><div class="ending-extra"><div class="ending-actions">${dailyActions}<button class="button ${daily?'white':'dark'}" id="save-card">保存卡片</button><button class="button white" id="copy-result">复制结果</button><button class="quit-btn" id="restart">重新开始</button></div><div id="image-fallback"></div><details class="recap"><summary>今日回顾</summary><ol>${recap||'<li>今天还没来得及出门。</li>'}</ol></details></div></div></section>`;
 document.querySelector('#restart').onclick=()=>{selected=[];draftSeed=Date.now()>>>0;offered=G.newDraft(draftSeed);draftName=state.name;traitsView();goTop();};
 document.querySelector('#copy-result').onclick=()=>copyResult(e);
 document.querySelector('#save-card').onclick=()=>saveCard(e);
 if(daily){document.querySelector('#continue-day').onclick=()=>{state=G.continueDay(G.enableEconomy(state));persist();if(state.failed)speak('failure');gameView();goTop();};document.querySelector('#retire-run').onclick=()=>{state=G.retire(state);persist();endingView();goTop();};}
 if(unlocked.length)showUnlocks(unlocked);
}


async function copyResult(e){const text=`我的奶娃人生来到第${state.day}天，称号是「${e.name}」！\n${e.quote}\n电量 ${state.stats.energy} · 饭钱 ¥${state.stats.money} · 人缘 ${state.stats.social} · 学业 ${state.stats.study}\n${Number.isFinite(state.stats.health)?'健康 '+state.stats.health+' · 心情 '+state.stats.mood+'\n':''}你会活成哪只奶娃？《重生之我在宿舍当奶娃》`;try{await navigator.clipboard.writeText(text);toast('结局已复制，发给室友对答案吧。');}catch{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.left='-9999px';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();toast(ok?'结局已复制。':'复制受限，可以直接保存结局卡。');}}
function wrap(ctx,text,x,y,width,line){let part='';for(const char of text){if(ctx.measureText(part+char).width>width){ctx.fillText(part,x,y);part=char;y+=line;}else part+=char;}if(part)ctx.fillText(part,x,y);return y+line;}
async function saveCard(e){const cardState=state;const b=document.querySelector('#save-card');b.disabled=true;b.textContent='正在制作结局卡…';try{const canvas=document.createElement('canvas');canvas.width=750;canvas.height=1050;const ctx=canvas.getContext('2d');ctx.fillStyle='#f5f5f7';ctx.fillRect(0,0,750,1050);ctx.strokeStyle='#1d1d1f';ctx.lineWidth=2;ctx.fillStyle='#6e6e73';ctx.font='bold 19px sans-serif';ctx.fillText('ROOM 404 / DAY '+cardState.day+' · 奶娃人生结算单',55,75);const img=new Image();img.src=asset('frog.png');await img.decode();const scale=Math.min(330/img.width,370/img.height),w=img.width*scale,h=img.height*scale;ctx.drawImage(img,375-w/2,115,w,h);ctx.fillStyle='#6e6e73';ctx.font='23px sans-serif';ctx.fillText(cardState.name+' 的今日称号',55,540);ctx.fillStyle='#1d1d1f';ctx.font='bold 52px sans-serif';ctx.fillText(e.name,55,615);ctx.font='25px sans-serif';wrap(ctx,e.quote,55,675,640,40);ctx.strokeStyle='#d2d2d7';ctx.beginPath();ctx.moveTo(55,800);ctx.lineTo(695,800);ctx.stroke();G.statKeys(cardState.stats).forEach((k,i)=>{const columns=G.statKeys(cardState.stats).length>4?3:4,x=55+(i%columns)*(640/columns),y=columns===3?825+Math.floor(i/3)*75:850;ctx.fillStyle='#6e6e73';ctx.font='21px sans-serif';ctx.fillText(G.labels[k],x,y);ctx.fillStyle='#1d1d1f';ctx.font='bold 37px monospace';ctx.fillText((k==='money'?'¥':'')+cardState.stats[k],x,y+42);});ctx.fillStyle='#6e6e73';ctx.font='19px sans-serif';ctx.fillText('重生之我在宿舍当奶娃',55,985);ctx.textAlign='right';ctx.fillText('你会活成哪只？',695,985);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('无法生成图片');if(state!==cardState||view!=='ending')return;clearCard();const url=cardUrl=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='奶娃宿舍-'+e.name+'.png';document.body.append(a);a.click();a.remove();const fallback=document.querySelector('#image-fallback');fallback.innerHTML='<p class="download-fallback">若手机没有弹出下载，长按下面的图片保存。</p>';const preview=document.createElement('img');preview.src=url;preview.className='download-preview';preview.alt='长按保存奶娃结局卡';fallback.append(preview);toast('结局卡已生成，可下载或长按图片保存。');}catch{toast('图片暂时没生成成功，可以先复制结局。');}finally{b.disabled=false;b.textContent='保存卡片';}}
function showUnlocks(items){
 document.querySelector('#unlock-list').innerHTML=items.map(e=>'<article class="unlock-card"><span class="unlock-icon" aria-hidden="true">'+e.icon+'</span><div>'+(e.hidden?'<small class="achievement-kind">隐藏成就</small>':e.difficulty==='hard'?'<small class="achievement-kind">高难成就</small>':'')+'<h3>'+esc(e.name)+'</h3><p>'+esc(e.quote)+'</p></div></article>').join('');
 document.querySelector('#unlock-modal').showModal();
}
function showCollection(){
 document.querySelector('.modal-intro').textContent='已解锁 '+seen.length+' / '+G.endings.length;
 const lock='<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
 document.querySelector('#collection-grid').innerHTML=G.endings.map(e=>{
  const known=seen.includes(e.id);
  return known?'<div class="collection-item unlocked"><span>'+e.icon+'</span><h3>'+esc(e.name)+'</h3>'+(e.hidden?'<small class="achievement-kind">隐藏</small>':e.difficulty==='hard'?'<small class="achievement-kind">高难</small>':'')+'</div>':'<div class="collection-item locked" aria-label="未解锁">'+lock+'</div>';
 }).join('');
 document.querySelector('#collection-modal').showModal();
}
document.querySelector('#collection-btn').onclick=showCollection;document.querySelector('#close-modal').onclick=document.querySelector('#close-modal-bottom').onclick=()=>document.querySelector('#collection-modal').close();document.querySelector('#collection-modal').onclick=e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();}};
document.querySelector('#unlock-close').onclick=document.querySelector('#unlock-accept').onclick=()=>document.querySelector('#unlock-modal').close();
document.querySelector('#unlock-book').onclick=()=>{document.querySelector('#unlock-modal').close();showCollection();};
document.querySelector('#unlock-modal').onclick=e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();}};
document.querySelector('#sound-btn').onclick=()=>{sound=!sound;write('naiwa-dorm-sound',sound);soundUI();if(sound)speak('award',true);else stopVoice();};
document.querySelector('.brand').onclick=e=>{e.preventDefault();home();goTop();};
soundUI();updateBook();home();
})();
