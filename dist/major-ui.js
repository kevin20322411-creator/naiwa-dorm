(function(root){
'use strict';
const esc=s=>String(s??'').replaceAll('饭钱','生活费').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const symbols={cs:'</>',bio:'◉',business:'↗',literature:'文',design:'✦',math:'∑',law:'⚖',electronics:'⌁',journalism:'▤',music:'♪'};
const kindNames={debug:'校园工具实验室',experiment:'校园观察站',business:'校园小摊练习',editing:'校刊编辑室',design:'校园海报工作台',route:'校园路线模型',contract:'校园条款校对',circuit:'电路实验台',reporting:'校园新闻台',melody:'旋律练习室'};
const previewNames={debug:'运行预览',experiment:'样本观察',business:'模拟摊位',editing:'校刊',design:'海报预览',route:'路线图',contract:'修订稿',circuit:'电路预览',reporting:'新闻稿',melody:'乐谱与节奏'};
const summaries={cs:'修好校园小工具，运行代码看看结果。',bio:'比较样本，试一试对照实验。',business:'摆一次校园小摊，试定价、进货与售出。',literature:'校对一段校刊，把文字改得更清楚。',design:'换配色、排版和元素，做出自己的海报。',math:'在路线图上选路径，比较距离与限制。',law:'核对虚构校园条款，选择修订。',electronics:'配置开关和元件，观察 LED 电路。',journalism:'选证据和标题，编成校园新闻稿。',music:'补全音符与节奏，点试听听旋律。'};
function steps(model){return '<div class="major-progress" aria-label="专业实践进度 '+(model.completedCount||0)+' / 3">'+[0,1,2].map(i=>'<i class="'+(i<(model.completedCount||0)?'done':i===(model.stage||0)?'current':'')+'">'+(i<(model.completedCount||0)?'✓':i+1)+'</i>').join('<span></span>')+'<b>'+(model.completedCount||0)+' / 3</b></div>';}
function cardHTML(model){
 if(!model?.enabled)return '';
 const next=model.next||model.chapter,done=(model.completedCount||0)>=3;
 return '<section class="major-practice-card" aria-label="专业专属实践"><span class="major-practice-icon" aria-hidden="true">'+esc(symbols[model.majorId]||'✦')+'</span><div class="major-practice-copy"><span class="school-eyebrow">'+esc(model.name||model.majorLabel)+' · 专业实践</span><strong>'+esc(done?'已完成':next?.title||model.title||'校园委托')+'</strong>'+steps(model)+(done?'':'<p>'+esc(model.canStart?(next?.duration||12)+' 分钟 · '+(next?.brief||summaries[model.majorId]||'校园委托'):model.reason||model.disabledReason||'暂不可用')+'</p>')+'</div>'+(done?'<button class="school-open" data-major-collection>作品 ↗</button>':'<button class="major-start" data-major-start '+(!model.canStart?'disabled':'')+'>开始 <span aria-hidden="true">↗</span></button>')+'</section>';
}
function svg(body,label,cls=''){return '<svg class="major-svg '+cls+'" viewBox="0 0 440 280" role="img" aria-label="'+esc(label)+'" xmlns="http://www.w3.org/2000/svg">'+body+'</svg>';}
function lines(value){return Array.isArray(value)?value:String(value??'').split('\n');}
function debugHTML(p,settled){
 const code=lines(p.code||p.source||'// 正在查看校园工具');
 const output=lines(p.output||p.result||'选择一个修改，再运行看看。');
 const numeric=Number.parseFloat(p.output),battery=String(p.code).includes('bars'),seats=String(p.code).includes('seats');
 const visual=seats?'<div class="major-seat-display '+(p.output==='有座'?'available':'')+'">'+esc(p.output||'等待运行')+'</div>':battery?'<div class="major-battery"><i style="width:'+Math.max(0,Math.min(100,numeric||0))+'%"></i><b>'+esc(p.output)+'</b></div>':'<div class="major-queue" aria-label="屏幕排队人数 '+esc(p.output)+'">'+Array.from({length:Math.max(0,Math.min(10,numeric||0))},(_,i)=>'<i style="--line:'+i+'" aria-hidden="true">●</i>').join('')+'<b>'+esc(p.output)+' 位</b></div>';
 return '<div class="major-debug" data-major-preview="debug"><div class="major-window-bar"><i></i><i></i><i></i><span>'+esc(p.filename||'campus-tool.js')+'</span></div><div class="major-code-scroll"><pre><code>'+code.map((s,i)=>'<span><b>'+(i+1)+'</b>'+esc(s)+'</span>').join('')+'</code></pre></div><div class="major-terminal '+(settled?'is-running':'')+'"><span class="major-terminal-label">'+(settled?'运行结果':'输出预览')+'</span>'+output.map((s,i)=>'<div style="--line:'+i+'">'+esc(s)+'</div>').join('')+'<i class="major-cursor" aria-hidden="true"></i></div><div class="major-live-output '+(settled?'is-running':'')+'">'+visual+'<p>'+esc(p.status||'')+'</p></div></div>';
}
function experimentHTML(p){
 const samples=Array.isArray(p.samples)?p.samples:[{label:'样本 A',value:4},{label:'样本 B',value:7}];
 const observation=p.observation||p.result||p.note;
 const sampleBody=samples.slice(0,3).map((s,i)=>{const x=samples.length===3?87+i*133:118+i*205,value=Number(s.value??s.height??s.count??s.growth)||4,water=String(s.unit).includes('观察点'),leaves=String(s.unit).includes('片叶'),height=Math.min(125,value*14),selected=String(p.control).includes(s.id),dots=Array.from({length:Math.min(14,Number(s.dots)||value)},(_,n)=>'<circle cx="'+(-26+(n%4)*17)+'" cy="'+(111+Math.floor(n/4)*17)+'" r="4" fill="#7a9d6c"/>').join('');
 let specimen=water?'<ellipse cx="0" cy="151" rx="49" ry="45" fill="#e4ede0" stroke="#94b39b" stroke-width="2"/>'+dots:'<ellipse cx="0" cy="218" rx="44" ry="8" fill="#d8e3cb"/><path d="M-31 175H31L24 216H-24Z" fill="#c8b18b"/><path d="M0 176V'+(175-height)+'" stroke="#668557" stroke-width="4"/>'+Array.from({length:leaves?Math.min(12,value):2},(_,n)=>'<path d="M0 '+(165-(leaves?n*11:n*height/2+height/3))+'q'+(n%2?-34:34)+' -1 '+(n%2?-29:29)+' -18q'+(n%2?27:-27)+' -1 '+(n%2?29:-29)+' 18Z" fill="'+(n%2?'#719b68':'#a2be87')+'"/>').join('');
 return '<g transform="translate('+x+',0)"><rect x="-59" y="35" width="118" height="193" rx="12" fill="'+(selected?'#e9efdf':'#fbfcf8')+'" stroke="'+(selected?'#abc18e':'#e3e9d9')+'"/><text x="0" y="61" text-anchor="middle" font-size="13" fill="#617457">样本 '+esc(s.id||String.fromCharCode(65+i))+'</text>'+specimen+'<text x="0" y="247" text-anchor="middle" font-size="15" fill="#344d38">'+esc(s.label||s.name)+'</text><text x="0" y="267" text-anchor="middle" font-size="14" fill="#647459">'+esc(s.value+' '+(s.unit||'cm'))+'</text></g>';}).join('');
 return '<div class="major-experiment" data-major-preview="experiment">'+svg('<rect width="440" height="280" rx="15" fill="#f1f5e9"/>'+sampleBody,'样本对比')+'<div class="major-sample-conditions">'+samples.map(s=>'<div><b>'+esc(s.id)+'</b><span>'+esc(s.conditions||s.condition||'')+'</span></div>').join('')+'</div>'+(observation&&observation!=='观察数值，先保留判断。'?'<div class="major-observation"><span>观察记录</span><p>'+esc(observation)+'</p></div>':'')+'</div>';
}
function businessHTML(p,settled){
 const budget=Number(p.budget??p.practiceBudget??60),stock=Number(p.stock??p.quantity??0),price=Number(p.price??0),cost=Number(p.expense??p.totalCost??p.cost??0),sold=Number(p.sold??0),revenue=Number(p.revenue??0);
 const products=Array.from({length:Math.max(1,Math.min(12,stock||6))},(_,i)=>'<g transform="translate('+(88+(i%6)*51)+','+(153-Math.floor(i/6)*36)+')"><rect width="27" height="29" rx="4" fill="'+(settled&&i<sold?'#e7eddf':'#c1d3a9')+'" stroke="#93ad7b"/><path d="M8 0V-6H19V0" stroke="#93ad7b" fill="none"/></g>').join('');
 return '<div class="major-business" data-major-preview="business">'+svg('<rect width="440" height="252" rx="15" fill="#f7f5ec"/><rect x="58" y="74" width="324" height="133" rx="10" fill="#fffefa" stroke="#dcdcca"/><path d="M45 82L65 44H375L395 82Z" fill="#adc69a"/><path d="M45 82H395V100Q370 116 345 100Q320 116 295 100Q270 116 245 100Q220 116 195 100Q170 116 145 100Q120 116 95 100Q70 116 45 100Z" fill="#c3d6b1"/>'+products+'<rect x="45" y="185" width="350" height="20" rx="5" fill="#b29d77"/><rect x="263" y="127" width="91" height="51" rx="5" fill="#fff8e2" stroke="#ddd1ac"/><text x="308" y="149" text-anchor="middle" fill="#7b673f" font-size="12">今日售价</text><text x="308" y="169" text-anchor="middle" fill="#6a7d55" font-size="20">¥ '+esc(price)+'</text><text x="220" y="235" text-anchor="middle" fill="#666f51" font-size="14">'+esc(p.product||p.productName||'校园小摊')+'</text>','校园摊位：进货 '+stock+' 件，售价 '+price+' 元')+'<div class="major-ledger"><span>模拟预算<b>¥'+budget+'</b></span><span>本次进货<b>'+stock+' 件</b></span><span>进货支出<b>¥'+cost+'</b></span><span>'+(settled?'实际售出':'售出数量')+'<b>'+(settled?sold+' 件':'开摊后揭晓')+'</b></span><span>模拟收入<b>'+(settled?'¥'+revenue:'开摊后揭晓')+'</b></span><span>'+(settled?'结余':'进货后余额')+'<b>¥'+(settled?(p.balance??p.remaining??(budget-cost+revenue)):budget-cost)+'</b></span></div></div>';
}
function editingHTML(p,settled,fields,selection){
 const text=p.text||p.revised||p.sentence||p.original||'校刊文字校对';
 let copy=esc(text);
 if(!settled&&Array.isArray(p.tokens))copy=p.tokens.map(f=>'<button class="major-word '+(selection?.token===f.id?'is-selected':'')+'" data-major-token="'+esc(f.id)+'" aria-pressed="'+(selection?.token===f.id)+'">'+esc(f.text)+'</button>').join('');
 return '<div class="major-editing" data-major-preview="editing"><div class="major-paper-heading"><span>校园生活 · 第 '+esc(p.issue||'01')+' 期</span><b>奶蛙校刊</b></div><h2>'+esc(p.headline||p.heading||'把校园写进这一页')+'</h2><div class="major-editor-copy">'+copy+'</div>'+(p.original&&p.original!==text?'<details class="major-original"><summary>原稿</summary><p>'+esc(p.original)+'</p></details>':'')+'</div>';
}
function designHTML(p){
 const palette=typeof p.palette==='object'&&p.palette?p.palette:{bg:'#f6efd9',ink:'#263a38',accent:'#bb6845'},bg=palette.bg,ink=palette.ink,accent=palette.accent;
 const centered=p.layout==='center',grid=p.layout==='grid',large=p.layout==='headline',x=centered?220:66,anchor=centered?'middle':'start',title=p.title||'校园的一天',element=typeof p.element==='object'?p.element.id:p.element;
 const chunks=String(title).match(new RegExp('.{1,'+(grid?5:large?8:11)+'}','gu'))||[],font=grid?24:large?32:27;
 let mark=element==='book'?'<g transform="translate(271,139)"><path d="M0 0Q25-9 51 3V61Q25 48 0 58Z M51 3Q78-9 102 0V58Q78 48 51 61Z" fill="'+accent+'"/><path d="M51 4V59M13 14L37 16M65 16L89 14M13 27L37 29M65 29L89 27" stroke="'+bg+'" stroke-width="2"/></g>':element==='note'?'<g transform="translate(287,135)"><path d="M14 62V7L79-4V52M14 22L79 11" stroke="'+accent+'" stroke-width="7" fill="none"/><ellipse cx="1" cy="65" rx="17" ry="11" fill="'+accent+'"/><ellipse cx="66" cy="55" rx="17" ry="11" fill="'+accent+'"/></g>':'<path d="M273 222C248 162 281 119 355 119C357 183 327 221 273 222Z" fill="'+accent+'"/><path d="M273 222L340 136" stroke="'+ink+'" stroke-width="2"/>';
 if(centered)mark='<g transform="translate(-102,17)" opacity=".72">'+mark+'</g>';
 if(grid)mark='<path d="M245 71V221M63 163H229" stroke="'+ink+'" opacity=".2"/>'+mark;
 return '<div class="major-design" data-major-preview="design">'+svg('<rect x="25" y="7" width="390" height="266" rx="7" fill="'+esc(bg)+'"/>'+mark+'<text x="'+x+'" y="39" text-anchor="'+anchor+'" font-size="12" letter-spacing="1" fill="'+esc(ink)+'">校园创作 · 奶蛙社</text><text x="'+x+'" y="89" text-anchor="'+anchor+'" font-size="'+font+'" font-weight="600" fill="'+esc(ink)+'">'+chunks.map((chunk,i)=>'<tspan x="'+x+'" dy="'+(i?font*1.2:0)+'">'+esc(chunk)+'</tspan>').join('')+'</text><text x="'+x+'" y="'+(grid?192:large?178:145)+'" text-anchor="'+anchor+'" font-size="11" fill="'+esc(ink)+'">'+esc(p.subtitle||'给校园一点新颜色。')+'</text><path d="M63 235H377" stroke="'+esc(ink)+'" opacity=".35"/><text x="63" y="253" font-size="12" fill="'+esc(ink)+'">'+esc(p.footer||'奶蛙同学 · 校园创作')+'</text>','海报预览：'+title)+'</div>';
}
function routeHTML(p){
 const nodes=(p.nodes||[]).map(n=>({...n,x:n.x*1.12+45,y:n.y*1.12+31})),byId=Object.fromEntries(nodes.map(n=>[n.id,n])),selected=new Set((p.pathEdges||[]).map(e=>e.from+'|'+e.to));
 const edgeHTML=(p.edges||[]).map(e=>{const a=byId[e.from],b=byId[e.to];if(!a||!b)return '';const on=selected.has(e.from+'|'+e.to)||selected.has(e.to+'|'+e.from),x=(a.x+b.x)/2,y=(a.y+b.y)/2;return '<g><path d="M'+a.x+' '+a.y+'L'+b.x+' '+b.y+'" stroke="'+(on?'#386e57':e.blocked?'#c58b77':'#c8d5ca')+'" stroke-width="'+(on?7:3)+'" '+(e.blocked?'stroke-dasharray="7 5"':'')+'/>'+'<rect x="'+(x-22)+'" y="'+(y-11)+'" width="44" height="22" rx="7" fill="#f5f8f0"/><text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" font-size="12" fill="#55705b">'+esc(e.length)+(e.blocked?' ×':'')+'</text></g>';}).join('');
 return '<div class="major-route" data-major-preview="route">'+svg('<rect width="440" height="280" rx="12" fill="#f5f8f0"/>'+edgeHTML+nodes.map(n=>'<g><circle cx="'+n.x+'" cy="'+n.y+'" r="17" fill="'+((p.path||[]).includes(n.id)?'#47765c':'#fff')+'" stroke="#8ca48d" stroke-width="2"/><text x="'+n.x+'" y="'+(n.y+4)+'" text-anchor="middle" font-size="12" fill="'+((p.path||[]).includes(n.id)?'#fff':'#4a6350')+'">'+esc(String(n.label||n.id).slice(0,1))+'</text><text x="'+n.x+'" y="'+(n.y+37)+'" text-anchor="middle" font-size="12" fill="#3f5947">'+esc(n.label)+'</text></g>').join(''),'校园路线模型')+'<div class="major-model-result"><strong>'+(p.totalLength==null?'待选路径':esc(p.totalLength)+' '+esc(p.unit||'米'))+'</strong><span>'+esc((p.path||[]).join(' → '))+'</span></div><div class="major-constraint-list">'+(p.constraints||[]).map(c=>'<span class="'+(c.met?'is-met':'')+'">'+(c.met?'✓ ':'○ ')+esc(c.label)+'</span>').join('')+'</div></div>';
}
function contractHTML(p){
 return '<div class="major-contract" data-major-preview="contract"><span class="major-document-tag">虚构校园条款</span><h2>'+esc(p.documentTitle||'校园约定')+'</h2><div class="major-reference"><span>核对依据</span><p>'+esc(p.reference)+'</p></div><ol class="major-clause-list">'+(p.clauses||[]).map(c=>'<li class="'+(c.selected?'is-selected':'')+(c.changed?' is-changed':'')+'"><span>'+esc(c.text)+'</span>'+(c.changed?'<small>已修订</small>':'')+'</li>').join('')+'</ol>'+(p.revisionText?'<div class="major-revision"><span>修订</span><p>'+esc(p.revisionText)+'</p></div>':'')+'<p class="major-art-status">'+esc(p.status)+'</p></div>';
}
function circuitHTML(p){
 const nodes=(p.nodes||[]).map(n=>({...n,x:n.x*1.12+45,y:n.y*1.12+31})),byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
 const wires=(p.wires||[]).map(w=>{const a=byId[w.from],b=byId[w.to];return a&&b?'<path d="M'+a.x+' '+a.y+'L'+b.x+' '+b.y+'" stroke="'+(w.active?'#689764':'#bac7c2')+'" stroke-width="4" fill="none"/>':'';}).join('');
 const parts=nodes.map(n=>{const id=String(n.id),label=n.label||id;let part='';if(/led/i.test(id))part='<g transform="rotate('+(p.polarity==='reverse'?180:0)+')"><circle r="'+(p.ledOn?23:17)+'" fill="'+(p.ledOn?'#f4de76':'#d9dfce')+'" opacity="'+(p.ledOn?'.3':'1')+'"/><path d="M-13-9H13L0 12Z" fill="'+(p.ledOn?'#efce50':'#a6b4a0')+'" stroke="#7a8f6c" stroke-width="2"/><path d="M-13 13H13" stroke="#7a8f6c" stroke-width="2"/></g>';
 else if(/switch/i.test(id))part='<rect x="-28" y="-15" width="56" height="30" rx="6" fill="#f4f8f4"/><path d="M-19 3L19 '+(p.closed?3:-11)+'" stroke="#688771" stroke-width="4"/><circle cx="-19" cy="3" r="3" fill="#688771"/><circle cx="19" cy="3" r="3" fill="#688771"/>';
 else if(/positive|negative/i.test(id))part='<circle r="15" fill="#e0e9e2" stroke="#97ac9b"/><text y="5" text-anchor="middle" fill="#68816c" font-size="19">'+(id==='positive'?'+':'−')+'</text>';
 else if(/battery|power|supply/i.test(id))part='<rect x="-25" y="-19" width="50" height="38" rx="6" fill="#e0e9e2" stroke="#97ac9b"/><path d="M-11-12V12M0-7V7M11-12V12" stroke="#789281" stroke-width="3"/>';
 else if(p.component?.id==='wire')part='<path d="M-29 0H29" stroke="#688771" stroke-width="4"/>';
 else if(!p.component?.id)part='<rect x="-29" y="-12" width="58" height="24" rx="5" fill="#f7faf5" stroke="#b4c3af" stroke-dasharray="4 3"/>';
 else part='<rect x="-29" y="-12" width="58" height="24" rx="3" fill="#e6d6b8" stroke="#a59576" stroke-width="2"/>';
 return '<g transform="translate('+n.x+','+n.y+')">'+part+'<text y="40" text-anchor="middle" font-size="12" fill="#526e5e">'+esc(id==='resistor'?p.component?.label||label:label)+'</text></g>';}).join('');
 return '<div class="major-circuit" data-major-preview="circuit" data-led-on="'+!!p.ledOn+'">'+svg('<rect width="440" height="280" rx="12" fill="#f2f7f3"/>'+wires+parts,'LED 电路：'+(p.ledOn?'已点亮':'未点亮'))+'<div class="major-circuit-meter"><span>电源<b>'+esc(p.supplyVoltage??'—')+' V</b></span><span>电流<b>'+esc(p.current??'—')+' mA</b></span><span>LED<b class="'+(p.ledOn?'is-lit':'')+'">'+(p.ledOn?'点亮':'未亮')+'</b></span></div><p class="major-art-status">'+esc(p.status)+'</p></div>';
}
function reportingHTML(p){
 return '<div class="major-reporting" data-major-preview="reporting"><div class="major-paper-heading"><span>校园现场</span><b>奶蛙新闻</b></div><h2>'+esc(p.headline||p.topic||'等待标题')+'</h2><p class="major-report-copy">'+esc(p.copy||p.brief)+'</p><div class="major-evidence-list">'+(p.evidence||[]).map(e=>'<div class="'+(e.selected?'is-selected':'')+'"><span>'+(e.selected?'✓ ':'')+esc(e.label)+'</span><small>'+esc(e.detail)+'</small></div>').join('')+'</div><p class="major-art-status">'+esc(p.status)+'</p></div>';
}
function melodyHTML(p){
 const notes=p.notes||[];
 const pitchY={60:150,62:144,64:138,67:126};
 const staffLines=[90,102,114,126,138].map(y=>`<path d="M35 ${y}H409" stroke="#d8d9e6"/>`).join('');
 const clef='<path d="M63 174C54 170 48 177 53 182C62 191 74 181 70 168L56 116C52 99 60 81 68 81C79 86 69 103 55 113C41 124 38 135 45 144C54 156 74 153 78 140C81 128 70 121 61 126C54 130 54 138 61 141" fill="none" stroke="#6d7293" stroke-width="3" stroke-linecap="round" transform="translate(0,-5)"/>';
 const score=notes.map((note,i)=>{
  const x=113+(notes.length>1?246*i/(notes.length-1):0);
  if(!note.frequency)return `<g class="is-gap"><rect x="${x-13}" y="94" width="26" height="55" rx="7" fill="#fff9e8" stroke="#c7b57d" stroke-dasharray="4 3"/><text x="${x}" y="128" text-anchor="middle" font-size="20" fill="#b29855">?</text><text x="${x}" y="184" text-anchor="middle" font-size="12" fill="#72758b">待补</text></g>`;
  const y=pitchY[note.midi]??150;
  const stemX=x+7,stemTop=y-36;
  const ledger=note.midi===60?`<path d="M${x-12} ${y}H${x+12}" stroke="#a4a7bc"/>`:'';
  const notehead=Number(note.beats)===2?'#fcfbff':'#6d7293';
  const flag=Number(note.beats)===0.5?`<path d="M${stemX} ${stemTop}C${stemX+2} ${stemTop+9} ${stemX+15} ${stemTop+10} ${stemX+15} ${stemTop+21}Q${stemX+15} ${stemTop+28} ${stemX+10} ${stemTop+32}Q${stemX+17} ${stemTop+20} ${stemX+5} ${stemTop+15}Q${stemX+1} ${stemTop+12} ${stemX} ${stemTop+6}Z" fill="#6d7293"/>`:'';
  return `<g>${ledger}<ellipse cx="${x}" cy="${y}" rx="8" ry="5.5" transform="rotate(-20 ${x} ${y})" fill="${notehead}" stroke="#6d7293" stroke-width="1.7"/><path d="M${stemX} ${y}V${stemTop}" stroke="#6d7293" stroke-width="2"/>${flag}<text x="${x}" y="184" text-anchor="middle" font-size="12" fill="#72758b">${esc(note.name)}</text></g>`;
 }).join('');
 const staff=svg('<rect width="440" height="227" rx="12" fill="#fcfbff"/>'+staffLines+'<path d="M35 90V138M409 90V138" stroke="#a4a7bc" stroke-width="2"/>'+clef+score,'高音谱表：'+(p.scoreText||''),'major-score');
 const beats=(p.beatSequence||notes.map(n=>n.beats)).map((beat,i)=>'<span class="'+(!notes[i]?.frequency?'is-gap':'')+'"><i style="--beats:'+Math.min(4,Number(beat)||1)+'"></i><b>'+esc(beat)+' 拍</b></span>').join('');
 return '<div class="major-melody" data-major-preview="melody"><div class="major-score-title"><strong>'+esc(p.title||'短旋律')+'</strong><span>♩ = '+esc(p.bpm||108)+'</span></div>'+staff+'<div class="major-beat-strip" aria-label="每个音符的拍数">'+beats+'</div><p class="major-art-status">'+esc(p.status)+'</p></div>';
}
function previewHTML(kind,p={},settled=false,fields=[],selection={}){
 if(kind==='debug')return debugHTML(p,settled);
 if(kind==='experiment')return experimentHTML(p);
 if(kind==='business')return businessHTML(p,settled);
 if(kind==='editing')return editingHTML(p,settled,fields,selection);
 if(kind==='route')return routeHTML(p);
 if(kind==='contract')return contractHTML(p);
 if(kind==='circuit')return circuitHTML(p);
 if(kind==='reporting')return reportingHTML(p);
 if(kind==='melody')return melodyHTML(p)+(settled?'<button class="major-listen major-work-listen" data-major-listen-work="'+esc(encodeURIComponent(JSON.stringify({notes:p.notes||[],bpm:p.bpm||108})))+'">♪ 试听</button>':'');
 return designHTML(p);
}
function choicesHTML(p){return '<div class="major-controls">'+(p.fields||[]).map((field,i)=>'<fieldset class="major-field"><legend><span class="major-field-number" aria-hidden="true">0'+(i+1)+'</span>'+esc(field.label)+'</legend><div class="major-options-row">'+(field.options||[]).map(option=>{const selected=p.selection?.[field.id]===option.id;return '<button class="major-option-button '+(selected?'selected':'')+'" data-major-option="'+esc(field.id+'|'+option.id)+'" aria-pressed="'+selected+'">'+(option.color?'<i class="major-color-dot" style="background:'+esc(option.color)+'"></i>':'')+'<strong>'+esc(option.label)+'</strong>'+(option.detail||option.description?'<small>'+esc(option.detail||option.description)+'</small>':'')+'</button>';}).join('')+'</div></fieldset>').join('')+'</div>';}
function interactionHTML(model){
 const p=model?.pending;if(!p)return '';
 return '<section class="major-workbench is-'+esc(p.kind)+'" aria-labelledby="major-title"><header class="major-workbench-heading"><div><p class="school-eyebrow">'+esc(model.name||model.majorLabel)+' · '+esc(kindNames[p.kind])+'</p><h1 id="major-title">'+esc(p.title)+'</h1></div><button class="back" id="major-cancel">返回</button></header>'+steps(model)+'<p class="major-commission">'+esc(p.request||p.brief)+'</p><div class="major-workbench-grid"><div class="major-preview-stage"><div class="major-preview-toolbar"><strong>'+esc(previewNames[p.kind]||'作品预览')+'</strong>'+(p.kind==='melody'?'<span class="major-listen-actions"><button class="major-listen" id="major-listen-reference">听示范</button><button class="major-listen" id="major-listen" aria-label="试听当前旋律">♪ 试听</button></span>':'')+'</div><div class="major-interactive-preview" aria-live="polite">'+previewHTML(p.kind,p.preview,false,p.fields,p.selection)+'</div></div><div class="major-control-panel">'+choicesHTML(p)+'<footer class="major-workbench-actions"><button class="button dark" id="major-submit" '+((p.fields||[]).some(f=>!f.options.some(o=>o.id===p.selection?.[f.id]))?'disabled':'')+'>'+esc(p.kind==='debug'?'运行':p.kind==='business'?'开摊':'提交')+'</button><button class="text-btn" id="major-skip">普通练习</button></footer></div></div></section>';
}
function workHTML(work,showDetails=true){
 if(!work)return '';
 const kind=work.kind||({cs:'debug',bio:'experiment',business:'business',literature:'editing',design:'design',math:'route',law:'contract',electronics:'circuit',journalism:'reporting',music:'melody'}[work.majorId]);
 const feedback=String(work.feedback||work.description||work.brief||'').replace(/^观察记录已保存。/,'').match(/[^。！？]+[。！？]?/g)||[];
 const summary=feedback.slice(0,/^运行结果已留下/.test(feedback[0]||'')?2:1).join('');
 return '<article class="major-saved-work" data-major-work="'+esc(kind)+'">'+previewHTML(kind,work.preview||work.artifact||work,true)+(showDetails||work.skipped?'<div class="major-work-caption">'+(work.skipped?'<span class="school-eyebrow">普通练习记录</span>':'')+(showDetails?'<h3>'+esc(work.title||'校园实践作品')+'</h3>'+(!work.skipped&&summary?'<p>'+esc(summary)+'</p>':''):'')+'</div>':'')+'</article>';
}
function outcomeHTML(work){return work?'<section class="major-outcome-work" aria-label="本次专业作品"><div class="school-section-heading"><h2>作品</h2></div>'+workHTML(work,false)+'</section>':'';}
function collectionHTML(model){
 if(!model?.enabled)return '';
 const works=model.works||[];
 return '<section class="major-collection" aria-label="专业作品收藏"><div class="school-section-heading"><h2>作品</h2><span>'+works.length+' / 3 · '+esc(model.name||model.majorLabel)+'</span></div><div class="major-collection-grid">'+[0,1,2].map(i=>works[i]?workHTML(works[i]):'<article class="major-empty-work"><span>0'+(i+1)+'</span><b>未完成</b></article>').join('')+'</div></section>';
}
root.DormMajorUI={cardHTML,interactionHTML,previewHTML,workHTML,outcomeHTML,collectionHTML,summaries};
})(typeof window!=='undefined'?window:globalThis);
