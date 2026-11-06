(function(root){'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ink='#294c3b',muted='#728575',green='#b5cba2',gold='#dec289',paper='#fffef8';
const rect=(x,y,w,h,fill=paper,rx=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#d5dfcf"/>`;
const text=(x,y,s,size=13,fill=ink,anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-family="system-ui,sans-serif">${esc(s)}</text>`;
const line=(x,y,a,b,color=muted,width=2)=>`<path d="M${x} ${y}L${a} ${b}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const circle=(x,y,r,fill=green,stroke='none')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
const arrow=(x,y,a,b)=>{
 const angle=Math.atan2(b-y,a-x)*180/Math.PI;
 return line(x,y,a,b)+`<path d="M-6 -5L0 0L-6 5" transform="translate(${a} ${b}) rotate(${angle})" fill="none" stroke="${muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
};
const box=(x,y,w,h,label,fill=paper)=>rect(x,y,w,h,fill)+text(x+w/2,y+h/2+5,label,13,ink,'middle');
const rows=(x,y,width,n=4)=>Array.from({length:n},(_,i)=>line(x,y+i*17,x+width-(i%3)*14,y+i*17,'#d8e0d0',3)).join('');
const page=(x=72,y=24,w=216,h=170)=>rect(x,y,w,h,paper,6)+rows(x+20,y+34,w-40,6);
const diagrams={
 englishNotes:()=>
  rect(36,25,288,170)+text(58,53,'问路练习',15)+line(56,63,304,63,'#d5dfcf',1)+
  rect(57,75,207,36,'#e6efde')+text(69,98,'Where is the library?',15)+
  rect(82,121,221,36,'#f4e7c8')+
  `<text x="93" y="144" font-size="15" fill="${ink}" font-family="system-ui,sans-serif">It is <tspan fill="#8d5e28" font-weight="700">by</tspan> the clock tower.</text>`+
  text(58,179,'表达位置 · by',13,muted),
 campusTravelChart:()=>
  text(53,30,'到校方式（人数）',14)+line(61,51,61,174)+line(61,174,320,174)+
  [0,6,12].map(value=>{
   const y=174-value*9;
   return line(61,y,320,y,'#cedacf',1)+text(52,y+4,value,12,muted,'end');
  }).join('')+
  [['步行',12,'#9ab982'],['骑车',6,'#b9c9a3'],['公交',3,'#dfbf82']].map(([label,value,fill],index)=>{
   const x=91+79*index,y=174-value*9;
   return rect(x,y,45,174-y,fill,3)+text(x+22.5,y-6,value,13,ink,'middle')+text(x+22.5,194,label,13,ink,'middle');
  }).join(''),
 campusLightPhoto:()=>
  rect(48,15,264,190,paper,3)+rect(61,28,238,151,'#d7e4db',2)+
  `<path d="M62 115Q103 82 149 111T223 101Q260 80 298 109V178H62Z" fill="#9fb99c"/>
   <path d="M62 140Q128 112 196 140T298 136V178H62Z" fill="#809f82"/>
   <path d="M105 160L159 121H195L142 160Z" fill="#667b67" opacity=".55"/>
   <path d="M157 83L176 52L195 83V149H157Z" fill="#eee4be" stroke="#718670" stroke-width="2"/>
   <path d="M174 59V150H195V83Z" fill="#efcc81"/>
   <path d="M152 84L176 52L199 84Z" fill="#58775f"/>`+
  circle(176,101,10,paper,ink)+line(176,101,176,95,ink,1.4)+line(176,101,181,103,ink,1.4)+
  circle(256,58,17,'#f3dfa4')+text(180,196,'钟楼的斜阳与影子',13,ink,'middle'),
 shotSequence:()=>{
  const shots=[
   {label:'远景',note:'交代地点',draw:'<path d="M35 130L63 102L83 123L101 110L117 132V149H35Z" fill="#729584"/><path d="M72 113V86L81 71L91 86V113Z" fill="#e7d6a9"/>'},
   {label:'中景',note:'走近门口',draw:'<path d="M146 149V80H200V149Z" fill="#b1bb9e"/><path d="M155 149V91H191V149Z" fill="#e7d6a9"/><circle cx="184" cy="121" r="3" fill="#314b3e"/>'},
   {label:'特写',note:'注意细节',draw:'<rect x="240" y="72" width="73" height="76" rx="4" fill="#dbbd84"/><circle cx="277" cy="104" r="15" fill="#efe4bd"/><path d="M273 109L270 124H284L281 109Z" fill="#314b3e"/><circle cx="277" cy="107" r="5" fill="#314b3e"/>'}
  ];
  return shots.map(({label,note,draw},i)=>{
   const x=28+100*i;
   return rect(x,37,96,126,'#294439',6)+rect(x+5,61,86,90,'#a5b9aa',3)+draw+
    text(x+48,54,label,12,'#f3edda','middle')+text(x+48,189,note,13,ink,'middle');
  }).join('');
 },
 regionalFoodNotes:()=>
  rect(24,27,148,166)+rect(188,27,148,166)+
  `<ellipse cx="98" cy="110" rx="53" ry="30" fill="#c4d7cc"/>
   <ellipse cx="98" cy="109" rx="46" ry="22" fill="#e4eee5"/>
   <path d="M58 103Q75 89 91 101L119 113Q121 124 105 126L62 113Q56 110 58 103Z M92 93Q105 84 119 92L143 105Q145 112 134 116L100 103Z" fill="#fff4d3" stroke="#c9b077" stroke-width="2"/>
   <path d="M219 105Q219 144 262 146Q305 144 305 105Z" fill="#8fb2a7"/>
   <ellipse cx="262" cy="104" rx="43" ry="17" fill="#cc9b60"/>
   <path d="M231 104Q241 91 250 103T270 102T293 100M230 111Q239 101 251 111T273 110T293 107" fill="none" stroke="#f4db9a" stroke-width="3" stroke-linecap="round"/>`+
  circle(71,101,3,'#809f68')+circle(95,111,3,'#809f68')+circle(115,95,3,'#809f68')+
  text(98,55,'岭南肠粉',16,ink,'middle')+text(262,55,'西北拉面',16,ink,'middle')+
  text(98,172,'米浆蒸制',13,muted,'middle')+text(262,172,'面团拉制',13,muted,'middle'),
 listeningScore:()=>
  rect(30,25,300,170)+text(49,53,'四拍旋律',15)+
  Array.from({length:5},(_,i)=>line(55,72+i*11,304,72+i*11,'#a1b4a1',1)).join('')+
  [99.5,94,83,88.5].map((y,i)=>{
   const x=82+i*63;
   return `<ellipse cx="${x}" cy="${y}" rx="7" ry="4.8" transform="rotate(-17 ${x} ${y})" fill="${ink}"/>`+
    line(x+6,y,x+6,y-30,ink,2)+circle(x,152,10,i===0?'#e2c483':'#dce8d4')+text(x,156,i+1,11,ink,'middle');
  }).join('')+line(303,72,303,116,ink,2)+text(180,180,'旋律先上行，再回落',13,muted,'middle'),
 observationVsInference:()=>{
  const notes=[['观察','排队时','反复看表','#e3efdf'],['解释','在赶时间？','也可能等人','#f5e8c9'],['核对','询问本人','结合当时情境','#deebe5']];
  return notes.map(([label,first,second,fill],i)=>{
   const x=22+i*108;
   return rect(x,43,98,130,fill)+text(x+49,73,label,15,ink,'middle')+
    line(x+12,87,x+86,87,'#a9b9a9',1)+text(x+49,116,first,13,ink,'middle')+
    text(x+49,138,second,13,ink,'middle');
  }).join('')+text(180,197,'同一个观察可以有多种解释',13,muted,'middle');
 },
 calligraphyGrid:()=>[59,191].map((x,i)=>{
  const grid=rect(x,29,111,111,'#fcf5e6',2)+
   `<path d="M${x+55.5} 29V140 M${x} 84.5H${x+111} M${x} 29L${x+111} 140 M${x+111} 29L${x} 140" fill="none" stroke="#c99a82" stroke-width="1" stroke-dasharray="4 3"/>`;
  const strokes=`<path d="M23 57Q53 56 88 54 M56 23Q56 59 53 93 M53 56Q43 74 19 86 M58 57Q73 77 94 85" transform="translate(${x} 29)" fill="none" stroke="${i?'#395247':'#84998a'}" stroke-width="${i?5:6}" stroke-linecap="round"/>`;
  return grid+strokes+text(x+55.5,170,i?'临摹':'范字',14,ink,'middle');
 }).join('')+text(180,197,'横画和竖画在格心相交',13,muted,'middle'),
 hoopPractice:()=>
  `<path d="M83 140Q150 8 268 73" fill="none" stroke="#789987" stroke-width="2" stroke-dasharray="5 5"/>
   <path d="M248 81L257 121H280L290 81M254 101H284M258 114L284 88M280 114L253 88" fill="none" stroke="#8fa699" stroke-width="2"/>
   <path d="M293 37V86M285 37H299M285 86H299" fill="none" stroke="#577665" stroke-width="4" stroke-linecap="round"/>
   <ellipse cx="269" cy="83" rx="22" ry="6" fill="none" stroke="#a66e3e" stroke-width="4"/>`+
  circle(85,136,19,'#dd9d58','#815537')+
  `<path d="M67 134Q84 126 102 141M80 118Q91 138 85 154M73 124Q80 141 96 147" fill="none" stroke="#815537" stroke-width="1.5"/>`+
  ['热身','运球','投篮'].map((label,i)=>box(48+i*93,169,78,31,label,i===2?'#e6efdd':paper)).join(''),
 shuttleFootwork:()=>
  rect(38,31,284,134,'#bbd0b2',5)+
  `<path d="M51 44H309V152H51Z M51 98H309 M95 44V152 M265 44V152" fill="none" stroke="#fcf8e7" stroke-width="2"/>
   <path d="M180 34V163" fill="none" stroke="#577968" stroke-width="3" stroke-dasharray="4 3"/>
   <path d="M113 115L147 68 M148 68L147 83 M148 68L133 71" fill="none" stroke="#426753" stroke-width="3" stroke-linecap="round"/>
   <path d="M255 68Q206 42 153 67" fill="none" stroke="#587d69" stroke-width="2" stroke-dasharray="4 4"/>
   <path d="M258 64L275 56L282 70L265 72Z" fill="#fffbe8" stroke="#6c8d74" stroke-width="1.4"/>`+
  circle(260,69,4,gold)+circle(112,116,6,'#f2d38b')+circle(147,69,6,'#f2d38b')+
  text(180,196,'向前接球，再回到准备位置',13,ink,'middle'),
 trackIntervals:()=>
  rect(44,28,272,135,'#d8a78a',67)+rect(54,38,252,115,'#dcaf91',58)+
  rect(64,48,232,95,'#e0b899',48)+rect(74,58,212,75,'#d8e7ce',38)+
  `<path d="M127 48H232Q257 48 277 65" fill="none" stroke="#596f56" stroke-width="3" stroke-linecap="round"/>
   <path d="M271 53L278 66L264 63" fill="none" stroke="#596f56" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`+
  text(180,103,'按自己的节奏跑',16,ink,'middle')+
  ['热身','稳速','放松'].map((label,i)=>circle(62+i*94,190,4,i===1?'#a96e54':green)+text(72+i*94,195,label,13,ink)).join(''),
 stretchAndBreathe:()=>
  rect(33,152,139,9,'#a8c3a6',4)+circle(99,63,14,'#d7ad80')+
  `<path d="M99 82Q108 103 103 124 M101 89Q75 99 63 119 M103 89Q122 59 142 61 M103 124Q79 118 60 143Q76 151 108 143 M103 124Q133 119 150 141Q125 151 96 141" fill="none" stroke="#617d65" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
   <path d="M187 125Q210 125 226 95T260 75Q277 75 291 99T323 125" fill="none" stroke="#83a994" stroke-width="3" stroke-linecap="round"/>`+
  line(186,126,324,126,'#c6d4c7',1)+text(211,145,'吸气',13,ink,'middle')+text(298,145,'呼气',13,ink,'middle')+
  text(180,191,'把呼吸和伸展动作配合起来',13,ink,'middle'),
 pingPongServe:()=>
  `<path d="M97 57H263L314 157H46Z" fill="#91b5a8" stroke="#587e71" stroke-width="3"/>
   <path d="M99 63H261L304 150H56Z M180 64V150" fill="none" stroke="#f5faec" stroke-width="2"/>
   <path d="M71 98H289V117H71Z" fill="#d9e8df" fill-opacity=".65" stroke="#5c7f74" stroke-width="1.8"/>
   <path d="M99 146Q113 118 138 132Q184 55 240 77" fill="none" stroke="#8d6e40" stroke-width="2.2" stroke-dasharray="5 4"/>
   <path d="M54 144L40 157" fill="none" stroke="#776046" stroke-width="7" stroke-linecap="round"/>
   <ellipse cx="66" cy="135" rx="17" ry="12" transform="rotate(-30 66 135)" fill="#af745c"/>`+
  circle(184,83,6,'#f6db95','#917743')+circle(240,77,5,'#f6db95','#917743')+
  text(83,191,'发球',13,ink,'middle')+text(180,191,'过网',13,ink,'middle')+text(263,191,'落点',13,ink,'middle'),
 bodyweightRoutine:()=>{
  const poses=[
   ['准备','M42 73V110 M42 79L23 94 M42 79L62 94 M42 110L28 143 M42 110L57 143',42,58],
   ['自重练习','M39 76L47 106 M40 80L70 89 M47 106L71 115L65 142 M47 107L24 119L20 142',36,61],
   ['恢复','M41 90L34 116 M41 94L57 106 M34 115L58 124L67 141 M34 116L20 138L39 141',45,75]
  ];
  return poses.map(([label,pose,cx,cy],i)=>{
   const x=28+i*105;
   return rect(x,31,94,139,i===1?'#e3edd7':'#f8f4e6')+circle(x+cx,cy,9,'#ddb78b')+
    `<path d="${pose}" transform="translate(${x} 0)" fill="none" stroke="#5a7f6a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`+
    line(x+11,147,x+83,147,'#bdcabc',1)+text(x+47,193,label,13,ink,'middle');
  }).join('');
 },
 code:()=>rect(28,22,304,178,'#233b30')+circle(46,41,3,gold)+circle(59,41,3,green)+text(73,46,'数一数大于 2 的数',12,'#c6e3b5')+
  text(47,66,'let count = 0;',15,'#f2edc9')+text(47,86,'for (const n of [1, 2, 3, 4]) {',15,'#d1e8c5')+
  text(63,106,'if (n > 2) count++;',15,'#f2edc9')+text(47,126,'}',15,'#d1e8c5')+text(47,146,'console.log(count);',15,'#d1e8c5')+
  line(47,157,313,157,'#718773',1)+text(47,181,'› 2',15,'#c6e3b5'),
 sorting:()=>text(29,81,'出队前',12,muted)+text(118,47,'队首',12,muted,'middle')+text(274,47,'队尾',12,muted,'middle')+
  [3,1,2].map((value,i)=>box(91+i*78,54,54,43,value,i===0?'#efe1bd':paper)).join('')+arrow(118,105,118,132)+
  text(29,163,'出队后',12,muted)+text(118,164,'3 已出队',12,muted,'middle')+[1,2].map((value,i)=>box(169+i*78,137,54,43,value,'#e4efdc')).join('')+
  text(180,205,'队列：先入队的先离开',12,muted,'middle'),
 hardware:()=>box(135,83,90,60,'CPU','#dbe8cf')+box(17,36,84,43,'程序指令')+box(17,148,84,43,'内存')+box(257,89,86,48,'输出')+
  arrow(101,58,135,103)+arrow(101,164,135,123)+arrow(135,137,101,177)+arrow(225,113,257,113)+text(180,210,'CPU 执行指令，也读写内存',12,muted,'middle'),
 sets:()=>`<circle cx="145" cy="107" r="65" fill="#d4e5bc" opacity=".78"/><circle cx="219" cy="107" r="65" fill="#e6ce99" opacity=".7"/>`+text(112,111,'A',22)+text(246,111,'B',22)+text(182,111,'A ∩ B',14,ink,'middle')+text(180,201,'集合与逻辑',13,muted,'middle'),
 network:()=>[[71,56],[288,56],[70,170],[291,169]].map(([x,y])=>line(x,y,180,110)).join('')+box(142,85,76,50,'路由器','#d8e5d0')+[[71,56],[288,56],[70,170],[291,169]].map(([x,y],i)=>rect(x-28,y-20,56,38)+text(x,y+4,'终端 '+(i+1),11,ink,'middle')).join(''),
 database:()=>rect(20,39,135,139)+rect(203,39,137,139)+text(34,64,'社团表',15)+text(217,64,'报名表',15)+line(21,75,154,75)+line(204,75,339,75)+
  text(34,99,'社团编号　名称',12,muted)+text(34,126,'01　读书社',13)+text(34,152,'02　合唱团',13)+
  text(217,99,'社团编号　成员',12,muted)+text(217,126,'01　奶蛙',13)+text(217,152,'02　小夏',13)+arrow(155,120,203,120)+text(180,202,'用相同的社团编号关联两张表',12,muted,'middle'),
 workflow:()=>text(180,48,'校园空座工具 · 四步开发',15,ink,'middle')+
  [['需求 ✓','社团确认'],['设计','一起画图'],['开发','编写代码'],['测试 ✓','同学试用']].map(([step,role],i)=>{
   const x=21+i*85;
   return box(x,77,63,51,step,i===3?'#dcebcf':paper)+text(x+31.5,151,role,11,muted,'middle')+(i<3?arrow(x+65,103,x+82,103):'');
  }).join('')+text(180,183,'每一步留一份记录，再交给下一位',12,muted,'middle'),
 prototype:()=>rect(108,18,145,187,'#e6eede',16)+rect(120,32,121,158)+text(180,61,'空座查询',17,ink,'middle')+rect(133,77,94,37,'#d8e8ce')+text(180,102,'剩余 3 席',14,ink,'middle')+rows(135,135,86,3),
 cell:()=>`<ellipse cx="180" cy="111" rx="108" ry="75" fill="#d8e8cf" stroke="#8daa7c" stroke-width="3"/>`+circle(180,109,32,'#b3b5d3')+circle(188,107,10,'#777f9e')+[[117,82],[224,72],[236,141],[125,151]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="17" ry="8" fill="#b9ce9f" transform="rotate(-25 ${x} ${y})"/>`).join('')+line(98,62,37,35)+text(25,28,'细胞膜',12)+line(206,92,281,35)+text(278,28,'细胞核',12),
 microscope:()=>`<g transform="translate(-61 -4)"><path d="M142 67L168 36L192 57L166 88Z" fill="#95aaa1"/><path d="M159 77Q228 97 219 153H164" fill="none" stroke="#718f80" stroke-width="15"/><path d="M118 136H205M148 137L132 184H235" fill="none" stroke="#8ba192" stroke-width="10" stroke-linejoin="round"/><circle cx="201" cy="113" r="10" fill="${gold}"/>${rect(95,123,84,9,'#d4e2ca',2)}</g>`+
  rect(190,39,148,150)+text(206,66,'同一视野计数',14)+line(205,77,323,77)+text(206,102,'9 · 10 · 11 个',17)+
  text(206,128,'均值 10 个',14)+text(206,157,'边缘小点容易漏数',12,muted),
 ecosystem:()=>{
  const grid=rect(29,38,150,150,'#eef3e5',2)+[1,2].map(i=>line(29+i*50,38,29+i*50,188,'#c1cdb5',1)+line(29,38+i*50,179,38+i*50,'#c1cdb5',1)).join('');
  const clover=[[53,64],[109,75],[129,119],[53,158]].map(([x,y])=>circle(x,y,6,'#769b65')).join('');
  const dandelion=[[151,60],[85,106],[149,167]].map(([x,y])=>rect(x-5,y-5,10,10,gold,2)).join('');
  return grid+clover+dandelion+text(197,62,'花坛样方 · 1 m²',14)+circle(203,95,5,'#769b65')+text(217,100,'三叶草 4 株',13)+
   rect(198,116,10,10,gold,2)+text(217,126,'蒲公英 3 株',13)+text(197,166,'只记录框内植株',12,muted);
 },
 molecules:()=>rect(28,26,304,75,'#eef4e7')+text(43,49,'酸碱中和',13,muted)+text(180,80,'HCl + NaOH → NaCl + H₂O',17,ink,'middle')+
  rect(28,112,304,83)+text(43,136,'把 0.10 mol 的 HCl 配成 0.50 L 溶液',13)+text(43,160,'浓度 = 溶质的量 ÷ 溶液体积',12,muted)+
  text(180,184,'0.10 mol ÷ 0.50 L = 0.20 mol/L',15,ink,'middle'),
 biochemistry:()=>text(180,48,'糖酵解路径',15,muted,'middle')+box(23,80,82,55,'葡萄糖','#e5d5a6')+box(134,72,92,71,'酶促步骤','#c5d8bd')+box(255,80,82,55,'丙酮酸','#d2e1e2')+
  arrow(105,107,134,107)+arrow(226,107,255,107)+arrow(180,143,180,159)+box(111,161,138,30,'净生成 2 个 ATP','#f2e7ca'),
 genetics:()=>rect(94,42,185,141)+line(94,89,279,89)+line(94,136,279,136)+line(156,42,156,183)+line(217,42,217,183)+text(187,28,'Aa × Aa 配子组合',13,muted,'middle')+
  [['','A','a'],['A','AA','Aa'],['a','Aa','aa']].map((r,i)=>r.map((value,j)=>text(125+j*61,72+i*47,value,17,ink,'middle')).join('')).join('')+
  text(180,207,'AA 25% · Aa 50% · aa 25%',13,muted,'middle'),
 statistics:()=>line(60,177,319,177)+line(60,177,60,43)+text(45,33,'厘米',12,muted)+text(194,33,'均值 ± 标准差',13,muted,'middle')+
  [0,4,8,12].map(value=>{const y=177-value*10;return line(55,y,60,y,muted,1)+text(50,y+4,value,11,muted,'end');}).join('')+
  [6,9,7].map((mean,i)=>{
   const x=96+i*78,y=177-mean*10,center=x+20;
   return rect(x,y,40,mean*10,['#bad0a8','#d9c58e','#abc8c5'][i],3)+line(center,y-10,center,y+10)+
    line(center-8,y-10,center+8,y-10)+line(center-8,y+10,center+8,y+10)+text(center,200,['A','B','C'][i],12,muted,'middle');
  }).join(''),
 quadrat:()=>rect(31,25,298,170)+text(50,54,'物种观察记录',17)+text(50,77,'10月22日 16:10 · 生态园西侧小径',12,muted)+line(49,88,310,88)+
  text(50,112,'物种',12,muted)+text(159,112,'数量',12,muted)+text(225,112,'位置',12,muted)+
  text(50,138,'麻雀',14)+text(159,138,'3 只',14)+text(225,138,'地面与树枝',13)+
  text(50,162,'白头鹎',14)+text(159,162,'2 只',14)+text(225,162,'低枝',13)+text(50,183,'在同一地点停留并计数 5 分钟',11,muted),
 supply:()=>line(60,181,315,181)+line(60,181,60,35)+line(80,58,296,166,'#88a37b',3)+line(80,166,296,58,'#be9f6e',3)+
  `<path d="M120 58L316 156" fill="none" stroke="#466d59" stroke-width="2" stroke-dasharray="6 5"/>`+
  circle(188,112,5,paper,ink)+circle(208,102,5,ink)+text(44,39,'P',12)+text(320,185,'Q',12)+text(70,49,'原需求',12,muted)+
  text(121,49,'新需求',12,ink)+text(273,49,'供给',12,muted)+text(180,207,'需求增加，均衡价格和数量都上升',13,muted,'middle'),
 ledger:()=>rect(61,25,238,172)+text(83,58,'收支核对',16)+line(81,72,278,72)+text(84,102,'收入')+text(276,102,'30',15,ink,'end')+text(84,136,'支出')+text(276,136,'18',15,ink,'end')+line(81,149,278,149)+text(84,178,'结余')+text(276,178,'12',17,ink,'end'),
 survey:()=>rect(23,33,152,150)+text(39,62,'小店新品问卷',15)+text(39,90,'你最想买哪一种？',12,muted)+
  ['面包','果汁','水果'].map((label,i)=>rect(40,105+i*23,11,11,'#e2ecd7',2)+text(58,115+i*23,label,12)).join('')+
  text(201,57,'12 份有效回答',13,muted)+[['面包',5],['果汁',4],['水果',3]].map(([label,count],i)=>{
   const y=74+i*34;
   return text(201,y+13,label,12)+rect(233,y,count*14,17,['#b7cda4','#d9c18f','#9fbdb4'][i],3)+text(314,y+13,count+' 人',12,muted);
  }).join(''),
 organization:()=>box(124,25,112,42,'负责人','#dce8d1')+line(180,68,180,100)+line(68,100,290,100)+[68,180,290].map((x,i)=>line(x,100,x,127)+box(x-46,128,92,48,['策划组','执行组','记录组'][i])).join(''),
 budget:()=>{
  const cashY=value=>173-value*2;
  const bars=[['期初',0,20,'20','#b9cba9'],['预计流入',20,50,'+30','#9cba8b'],['预计流出',15,50,'−35','#dec28d'],['期末',0,15,'15','#8caca0']];
  const connectors=[20,50,15].map((balance,i)=>line(86+i*72,cashY(balance),118+i*72,cashY(balance),'#9aab9d',1)).join('');
  const chart=bars.map(([label,bottom,top,value,fill],i)=>{
   const x=46+i*72,y=cashY(top);
   return rect(x,y,40,cashY(bottom)-y,fill,3)+text(x+20,y-7,value,14,ink,'middle')+text(x+20,193,label,12,muted,'middle');
  }).join('');
  return text(180,30,'本周现金流预算 · 元',16,ink,'middle')+line(32,173,329,173)+connectors+chart+text(180,214,'20 + 30 − 35 = 15 元',12,muted,'middle');
 },
 operations:()=>['接单','分拣','配送'].map((s,i)=>box(24+i*117,79,88,56,s,i===1?'#eee1bc':paper)+(i<2?arrow(112+i*117,107,141+i*117,107):'')).join('')+text(180,176,'流程与交接',13,muted,'middle'),
 teamwork:()=>[[94,69],[266,69],[180,167]].map(([x,y],i)=>circle(x,y,29,['#c1d6ad','#dfc48d','#b5ccc6'][i])+text(x,y+5,['A','B','C'][i],17,ink,'middle')).join('')+line(123,69,237,69)+line(107,94,163,142)+line(250,94,197,142)+text(180,112,'沟通',12,muted,'middle'),
 shop:()=>{
  const stock=10,sold=8,remaining=stock-sold,barStart=49,unitWidth=26,split=barStart+sold*unitWidth;
  return rect(29,25,302,172)+text(47,54,'校园小店 · 今日复盘',17)+
   rect(barStart,71,sold*unitWidth,22,green,3)+rect(split,71,remaining*unitWidth,22,gold,3)+
   text(barStart+5,86,'售出 '+sold+' 件',11)+text(split+5,86,'余货 '+remaining+' 件',11)+
   text(49,119,'收入 32 元',13)+text(148,119,'成本 20 元',13)+text(242,119,'结余 12 元',13)+line(49,133,310,133)+
   text(49,160,'备货 10 件，还剩 2 件。',13,muted)+text(49,181,'下一摊先备 8 件试试。',13);
 },
 closeReading:()=>rect(29,29,302,160)+text(48,57,'细读札记',15,muted)+rect(45,71,136,23,'#e5ebca',2)+rect(182,71,127,23,'#eee0b6',2)+
  text(49,89,'雨打在窗上，',18)+text(188,89,'灯还亮着。',18)+line(112,95,112,108)+line(236,95,236,108)+
  text(49,129,'① 听觉写景',14)+text(49,154,'先听见雨声。',12,muted)+text(188,129,'② 留下悬念',14)+text(188,154,'灯下是否有人等候？',12,muted),
 grammar:()=>box(120,18,120,42,'句子','#e3ead8')+line(180,60,180,85)+line(80,85,280,85)+[80,180,280].map((x,i)=>line(x,85,x,110)+box(x-39,111,78,42,['主语','谓语','宾语'][i])+text(x,189,['我','读','书'][i],18,ink,'middle')).join(''),
 drafting:()=>rect(48,24,241,172)+`<path d="M260 169L299 63L316 70L276 175L260 189Z" fill="#9baf8b"/><path d="M260 189L260 169L276 175Z" fill="#d8bc8a"/>`+
  text(67,52,'校园随笔 · 初稿',12,muted)+text(67,84,'雨后的钟楼',20)+text(67,112,'雨刚停，石阶还亮着。',14)+
  text(67,137,'钟声从屋檐上滚下来。',14)+line(66,145,222,145,'#ba8b6d',1)+text(67,171,'再写一句操场的声音。',12,muted),
 classical:()=>rect(28,26,304,168,'#f8f0dc',5)+text(46,56,'《论语·学而》',13,muted)+text(46,90,'学而时习之，不亦说乎？',19)+
  line(46,105,313,105,'#d9caad',1)+text(46,135,'说（yuè）：喜悦。',14)+text(46,163,'学了以后时常练习，不也很高兴吗？',14),
 timeline:()=>line(47,118,313,118,'#a8b99b',3)+[
  ['先秦','《诗经》','诗歌总集'],['唐代','《静夜思》','五言诗'],['清代','《红楼梦》','长篇小说']
 ].map(([era,work,form],i)=>{
  const x=67+i*113;
  return box(x-49,43,98,51,work)+line(x,94,x,110)+circle(x,118,8,[green,gold,'#aac3ba'][i])+text(x,152,era,15,ink,'middle')+text(x,176,form,12,muted,'middle');
 }).join(''),
 narration:()=>text(180,43,'同一声钟响，两种讲法',16,ink,'middle')+[
  ['第一人称','我听见钟响。','用“我”讲自己的经历。','#e5eddb'],['第三人称','奶蛙听见钟响。','称角色为“奶蛙”。','#f2e9d1']
 ].map(([label,quote,note,fill],i)=>{
  const x=21+i*166;
  return rect(x,67,152,112,fill)+text(x+13,93,label,13,muted)+text(x+13,128,quote,16)+text(x+13,155,note,11,muted);
 }).join(''),
 comparison:()=>text(180,40,'主题比较 · 旅行中的选择',16,ink,'middle')+[
  ['《海底两万里》','乘潜艇探索海底','面对未知的海域'],['《八十天环游地球》','赶在期限内绕地球','面对紧迫的时间']
 ].map(([title,event,pressure],i)=>{
  const x=20+i*164;
  return rect(x,61,156,103,i?'#f3ead2':'#e9f0e1')+text(x+78,89,title,14,ink,'middle')+text(x+78,120,event,13,ink,'middle')+text(x+78,144,pressure,12,muted,'middle');
 }).join('')+text(180,196,'同是旅行，考验判断的条件各不相同。',12,muted,'middle'),
 proofreading:()=>page(55,25,249,170)+text(80,83,'再接再励',22,'#a36b55')+line(77,76,177,76,'#b97664',2)+text(82,137,'再接再厉',22,ink)+`<path d="M225 115L238 128L265 93" fill="none" stroke="#7f9e6d" stroke-width="5" stroke-linecap="round"/>`,
 composition:()=>rect(58,35,245,150,'#f9f7ed',2)+circle(133,94,36,'#b6ca9d')+rect(160,101,93,59,'#d4b585',0)+
  `<path d="M202 50L259 116H145Z" fill="#8faa8c" opacity=".85"/>`+line(84,156,239,56,ink,2)+circle(99,78,5,ink)+circle(116,68,4,ink)+circle(137,62,3,ink),
 colors:()=>text(101,37,'树荫',14,ink,'middle')+text(243,37,'旧砖墙',14,ink,'middle')+
  ['#c8d7ac','#78996a','#284d3a','#e2ca9a','#bc8c63','#835d48'].map((fill,i)=>rect(43+i*47,51,41,96,fill,4)).join('')+text(180,178,'同一个地点，亮处与暗处的颜色不同。',12,muted,'middle'),
 poster:()=>rect(94,15,173,190,'#eee6d0',3)+circle(180,88,47,'#b7cba6')+text(180,79,'社团',26,ink,'middle')+text(180,112,'招新',26,ink,'middle')+line(115,153,246,153,'#9ead91',1)+rows(116,171,121,2),
 drawing:()=>`<path d="M104 77L180 37L259 78L181 121Z M104 77V153L181 195L259 153V78M181 121V195M104 153L180 111L259 153M180 37V111" fill="none" stroke="#80967b" stroke-width="2.5"/><path d="M181 121L259 78V153L181 195Z" fill="#c4d3b5" opacity=".55"/>`,
 typography:()=>rect(65,22,231,178)+text(85,64,'校园展',30)+text(86,98,'字体与版式',15,muted)+rows(87,125,170,3)+line(80,39,80,183,'#d7c69c',1)+line(281,39,281,183,'#d7c69c',1),
 symbols:()=>text(180,39,'校园导览图形',16,ink,'middle')+[82,180,278].map((x,i)=>{
  const marks=[
   `<path d="M57 84Q69 79 82 90Q95 79 107 84V120Q95 115 82 126Q69 115 57 120Z" fill="#7d9c6d"/><path d="M82 91V125" stroke="#edf3e7" stroke-width="2"/>`,
   `<path d="M158 120L162 112V99Q162 83 180 83Q198 83 198 99V112L202 120Z" fill="#bc9a60"/><circle cx="180" cy="125" r="5" fill="#bc9a60"/>`,
   `<path d="M252 120Q250 85 301 83Q298 129 265 128Z" fill="#7d9d86"/><path d="M256 128L287 96" stroke="#e9f0e5" stroke-width="2"/>`
  ];
  return rect(x-38,63,76,89,['#e6edda','#f1e5c9','#dbe7df'][i])+marks[i]+text(x,178,['图书馆','钟楼','生态园'][i],13,muted,'middle');
 }).join(''),
 screens:()=>rect(27,40,238,141,'#d5e2cf',9)+rect(38,51,216,112)+rect(50,63,62,87,'#e8eddb',3)+rows(129,76,106,4)+rect(268,75,65,125,'#b5cbb5',9)+rect(275,86,51,102)+rows(284,108,32,4),
 branding:()=>circle(112,103,66,'#dce8ce')+text(112,118,'社',47,ink,'middle')+rect(207,47,82,42,ink,3)+rect(207,101,38,53,green,3)+rect(252,101,37,53,gold,3)+text(250,188,'视觉识别',13,muted,'middle')
};
const courses={
 'common-english':'englishNotes','common-statistics':'campusTravelChart',
 'elective-photo':'campusLightPhoto','elective-film':'shotSequence','elective-food':'regionalFoodNotes','elective-music':'listeningScore','elective-psych':'observationVsInference','elective-calligraphy':'calligraphyGrid',
 'pe-basketball':'hoopPractice','pe-badminton':'shuttleFootwork','pe-running':'trackIntervals','pe-yoga':'stretchAndBreathe','pe-tabletennis':'pingPongServe','pe-fitness':'bodyweightRoutine',
 'cs-programming':'code','cs-algorithms':'sorting','cs-systems':'hardware','cs-discrete':'sets','cs-networks':'network','cs-database':'database','cs-software':'workflow','cs-project':'prototype',
 'bio-cell':'cell','bio-biolab':'microscope','bio-ecology':'ecosystem','bio-chemistry':'molecules','bio-biochemistry':'biochemistry','bio-genetics':'genetics','bio-statistics':'statistics','bio-fieldwork':'quadrat',
 'business-economics':'supply','business-accounting':'ledger','business-marketing':'survey','business-management':'organization','business-finance':'budget','business-operations':'operations','business-organization':'teamwork','business-simulation':'shop',
 'literature-reading':'closeReading','literature-language':'grammar','literature-writing':'drafting','literature-ancient':'classical','literature-history':'timeline','literature-theory':'narration','literature-world':'comparison','literature-editing':'proofreading',
 'design-composition':'composition','design-color':'colors','design-studio':'poster','design-drawing':'drawing','design-typography':'typography','design-visual':'symbols','design-media':'screens','design-branding':'branding'
};
function render(work){const id=work?.courseId,type=courses[id];if(!type)return '';return `<div class="school-course-preview" data-course-art="${esc(id)}" data-art-kind="${type}"><svg viewBox="0 0 360 220" role="img" aria-label="${esc(work.title||work.course||id)}" xmlns="http://www.w3.org/2000/svg">${diagrams[type]()}</svg></div>`;}
root.DormCourseArt={render,coveredCourseIds:Object.keys(courses),kinds:{...courses}};if(typeof module!=='undefined'&&module.exports)module.exports=root.DormCourseArt;
})(typeof globalThis!=='undefined'?globalThis:this);
