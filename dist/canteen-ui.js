(function(root){
'use strict';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nameOf=c=>String(c?.text||'').replace(/\s*·\s*[¥￥]\s*[\d,.]+(?:[（(]免费[）)])?/g,'').trim();
const priceOf=c=>Math.max(0,-Number(c?.mods?.money||0));
const skipped=c=>!!c?.flags?.missedMeal||/^不吃/.test(c?.text||'');
// The same hand-drawn shapes serve cards, the counter and the served meal.
// Recipes are exact-name entries: a dessert never falls through to a rice plate.
const foodRecipes=Object.create(null);
const shape=(d,fill,stroke='#aa8760',width=1.5)=>'<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round"/>';
const ellipse=(x,y,rx,ry,fill,stroke='none')=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>';
const group=(part,x,y,art,scale=1,turn=0)=>'<g data-food-part="'+part+'" transform="translate('+x+' '+y+') rotate('+turn+') scale('+scale+')">'+art+'</g>';
const line=(d,color,width=2)=>shape(d,'none',color,width);
const marks=(points,color='#f6ddb0',rx=2,ry=1)=>points.map(([x,y])=>ellipse(x,y,rx,ry,color)).join('');
const steam=group('steam',0,0,line('M89 42c-10-10 8-14 0-24m31 20c-10-10 8-14 0-24m31 28c-10-10 8-14 0-24','#d7cbb5',2.4));
const shadow=()=>ellipse(120,145,84,9,'#e7ddc9');
const plate=()=>group('plate',0,0,shadow()+ellipse(120,103,94,48,'#fcfaf1','#d2c5aa')+ellipse(120,101,81,37,'#f3ecdc','#e0d4bb')+line('M48 113q17 20 51 23','#fffdf6',3));
function bowl(fill='#efce88',pot=false){return group(pot?'clay-pot':'bowl',0,0,shadow()+(pot?line('M48 99H34v17h17m139-17h16v17h-17','#9e795a',7):'')+shape('M45 89q7 55 75 55t75-55Z',pot?'#ba8a63':'#dce4cf',pot?'#997253':'#9aa98a',2)+ellipse(120,88,76,32,pot?'#a67b57':'#f9f6e8',pot?'#997253':'#9aa98a')+ellipse(120,88,67,25,fill)+line('M62 116q13 17 36 19',pot?'#d4aa80':'#f3f5e8',3));}
const rice=(x=84,y=106,color='#fff9e6',s=1)=>group('rice',x,y,shape('M-35 8q-4-12 5-18 1-13 15-13 13-14 27-3 19-2 22 12 12 5 7 20-31 16-76 2Z',color,'#dfcda6')+marks([[-23,0],[-10,9],[3,0],[16,9],[26,-3],[-12,-12],[2,-18],[17,-11],[-27,8],[2,13]],color==='#fff9e6'?'#dfd0ac':'#d4a853',3,1.1),s);
const leaf=(x,y,s=1,r=0)=>group('greens',x,y,shape('M-16 7q-12-9-3-18 1-16 15-10 14-10 21 3 14 7 3 19-11 14-36 6Z','#82a45e','#658847')+line('M-10 10L11-13m-12 14l-9-5m13 0l10-1','#c0d08b',2),s,r);
const cabbage=(x,y,s=1,r=0)=>group('cabbage',x,y,shape('M-20 6q-13-12 0-17-1-14 15-10 10-9 18 1 15 0 12 14 0 15-26 25Z','#c2d396','#8fa66c')+line('M-3 17L3-15m-5 20l-11-10m13 0l12-11','#edf0c5',3),s,r);
const broccoli=(x,y,s=1)=>group('broccoli',x,y,shape('M-5 3l-3 19h16L4 1Z','#99af69','#789451')+ellipse(-11,-4,12,10,'#6f9651','#628547')+ellipse(3,-11,13,11,'#80a55b','#628547')+ellipse(14,0,11,10,'#739850','#628547')+marks([[-14,-7],[-4,-13],[8,-10],[16,-2]],'#a2ba75',2,1.5),s);
const egg=(x,y,s=1)=>group('fried-egg',x,y,shape('M-25 7q-8-13 5-18 2-16 17-11 14-6 20 6 17 3 12 17-6 15-21 11-22 7-33-5Z','#fff8de','#dfc999')+ellipse(1,-1,12,10,'#efb641','#d8a03a')+line('M-4-7q5-3 9 0','#ffdb75',2),s);
const boiledEgg=(x,y,s=1,tea=false)=>group(tea?'tea-egg':'boiled-egg',x,y,ellipse(0,0,20,25,tea?'#bd8f60':'#fff3d8',tea?'#9d744d':'#dfc999')+(tea?line('M-11-17l6 9-9 10 11 9-4 9m3-28l12 3 6-9m-18 20l15-6 7 9','#e4c194',1.6):ellipse(1,4,11,13,'#edb644','#d3a047')),s);
const tomato=(x,y,s=1,r=0)=>group('tomato',x,y,shape('M-20 9L1-15Q21-12 22 8 2 24-20 9Z','#d97859','#b75b43')+shape('M-12 8L1-8 14 7Q2 14-12 8Z','#efab77','#efab77')+marks([[-6,7],[2,1],[9,6]],'#fff1bb',1.7,1),s,r);
const scramble=(x,y,s=1)=>group('scrambled-egg',x,y,shape('M-24 6q-7-11 5-14 5-12 15-7 12-8 16 2 16-1 13 11 10 8-2 14-10 4-17-1-20 8-30-5Z','#ecc159','#d3a442')+line('M-15-3l8 3m9-6l8 4m-3 9l10-2','#fff0ac',2.5),s);
const mushroom=(x,y,s=1)=>group('mushroom',x,y,shape('M-5 0l-3 17q8 6 16-1L4 0Z','#ecd6ad','#b99a71')+shape('M-20 1q1-26 23-22Q23-18 22 1q-21 12-42 0Z','#a8815b','#896a4b')+line('M-8-13l15 10m-2-12L-6-3','#ead1a7',2)+ellipse(-12,-8,2,1.5,'#c3a17a'),s);
const tofu=(x,y,s=1,r=0)=>group('tofu',x,y,shape('M-18-12l27-4 10 9-4 23-29 1-8-10Z','#f8e4b8','#d3b783')+shape('M-18-12l10 11 27-6-10-9Z','#fff1cf','#dfc999')+line('M-8-1v17','#dfc999',1.5)+marks([[-3,-9],[4,-5],[6,5],[-3,10]],'#e7c994',1.2,1),s,r);
const chicken=(x,y,s=1,r=0)=>group('chicken',x,y,shape('M-20 3l3-18 18-5 20 14-1 19-23 7Z','#d3a067','#b48350')+shape('M-15-10l15-5 14 10-17 8Z','#edc48b','#edc48b')+line('M-12 8l12-3m4 7l9-4','#a87949',2),s,r);
const beef=(x,y,s=1,r=0,raw=false)=>group(raw?'beef-roll':'beef',x,y,shape('M-24-4q3-12 16-9l25-3q15 5 10 17-5 13-20 10l-26 2q-11-4-5-17Z',raw?'#d28c7c':'#a77653',raw?'#b67467':'#885d42')+line('M-16-4q12-6 26-2m-21 10q15-5 29-2',raw?'#f6d1bc':'#d1a17a',2.5)+(raw?line('M15-12q-12 7 0 21m2-19q-8 6 0 15','#f3c8b4',2):''),s,r);
const pork=(x,y,s=1,r=0)=>group('roast-pork',x,y,shape('M-21-10l36-3 6 25-37 2Z','#cc9773','#a37250')+shape('M-21-10l36-3 2 8-35 4Z','#a97743','#a97743')+line('M-15 5l30-2','#f2cfa2',3)+marks([[-13,-8],[-4,-7],[7,-9]],'#e4b166',1.5,1),s,r);
const drumstick=(x,y,s=1,r=0,pepper=false)=>group('chicken-leg',x,y,shape('M8-7l23-10q2-8 9-5 5 3 0 8 5 5-1 9-7 2-9-4L12 2Z','#f4e5c1','#bca17b')+shape('M15-10q-7-20-28-14-22 5-17 26 4 19 25 17 23-3 20-29Z',pepper?'#a8794c':'#ca9455','#a27145')+line('M-21-11q12-8 21 0','#edbd7b',3)+marks([[-18,2],[-5,-12],[6,-4],[-5,9],[-23,-5]],pepper?'#655440':'#e5b26a',1.6,1.3),s,r);
const cutlet=(x,y,s=1)=>group('chicken-cutlet',x,y,shape('M-32 5q-10-15 5-25 28-12 57 6 18 20-4 32-40 10-58-13Z','#c7954f','#a67b42')+[-17,-3,11].map(a=>line('M'+a+' -13l-8 27','#f8dba0',3)).join('')+marks([[-24,-7],[-20,9],[-6,-17],[5,4],[23,6],[17,-9]],'#eab96b',2,1.4),s);
const shrimp=(x,y,s=1,r=0)=>group('shrimp',x,y,shape('M12 10q-30 8-34-14-3-20 18-22 21 2 18 21L4-1q3-10-7-12-10 0-9 9 2 12 17 6Z','#e5a184','#c17c61')+shape('M9 6l17-9-2 12-14 5Z','#cf8067','#b66b54')+line('M-17-13l8 5m-11 4l9 1m-5 9l8-3m9-24l-2 8','#f8ccb0',2.3)+ellipse(4,-19,1.6,1.6,'#7d6550'),s,r);
const fish=(x,y,s=1,r=0)=>group('fish-slice',x,y,shape('M-25 0q17-22 48-12-1 20-31 27-17 1-17-15Z','#f6e9cf','#d5bfa0')+line('M-14 0l14-6m-5 15l12-13m0 10l10-12','#e3cdb2',2)+line('M-21-1q18-16 39-10','#c5a78c',2),s,r);
const fishball=(x,y,s=1)=>group('fish-ball',x,y,ellipse(0,0,11,10,'#f7ead0','#d6bd96')+line('M-5-4q4-4 8 0','#fff9e6',2),s);
const julienne=(x,y,s=1)=>group('shredded-potato',x,y,[-12,-5,2,9].map((v,i)=>line('M-24 '+v+'q20-12 47-2','#d6ac53',5)+line('M-23 '+(v-1)+'q20-10 45-2','#f4d27a',2)).join('')+line('M-17 5l6-9m24 8l7-10','#73935a',2.6)+line('M-5-12l5 6','#cc7851',2.4),s);
const potato=(x,y,s=1)=>group('potato',x,y,shape('M-13-12l24-2 7 19-17 12-18-13Z','#e8bf67','#c69c4d')+line('M-9-8L7-10l4 10','#f9db8d',2.5),s);
const noodles=(color='#e7bf67',thick=3)=>group('noodles',0,0,Array.from({length:5},(_,i)=>line('M65 '+(78+i*6)+'q12-13 23 0t24 0 24 0 24 0 15-2',color,thick)).join('')+line('M82 76q-5 14 5 28m50-30q-7 16 3 28',color,thick));
const scallions=()=>group('scallions',0,0,marks([[79,81],[143,103],[111,75],[163,90],[104,107],[146,71]],'#73945d',2.5,1.5));
const soupMeal=(toppings,color='#ead09b',pasta=true,pot=false,thick=3)=>steam+bowl(color,pot)+(pasta?noodles('#e4b962',thick):'')+toppings+scallions();
const riceMeal=(toppings,options={})=>(options.pot?steam+bowl(options.sauce||'#d0aa72',true):plate())+rice(options.pot?108:83,options.pot?95:107,options.fried?'#efcd7c':'#fff9e6',options.pot?1.4:1)+toppings;
const bun=(x,y,s=1,plain=false,green=false)=>group(plain?'mantou':'steamed-bun',x,y,shape('M-25 9q-7-29 22-33 29-1 31 28 0 19-27 20-22 0-26-15Z','#fff0cb','#d4ba8f')+(plain?line('M-15-8q10-9 21-5','#fff9e7',3):line('M-17-2L0-17 15-4M0-17L-3 4m3-21l5 18','#d7bb8c',1.7))+(green?shape('M7 5q11-8 18 0l-2 10-13 1Z','#8d9e64','#8d9e64'):'')+line('M-15 15q12 7 26 0','#ead5ad',2),s);
const dumpling=(x,y,s=1,r=0,wonton=false)=>group(wonton?'wonton':'dumpling',x,y,wonton?shape('M-25-3l15-17 11 6 15-3 9 18-14 14-8-4-15 8-14-10Z','#f7e6bd','#d0b78b')+ellipse(0,0,13,9,'#e7cfa0')+line('M-12-11l6 9m17-9L5-1','#fff6db',2):shape('M-27 9q2-35 30-31Q24-19 29 9q-27 17-56 0Z','#fff1cf','#d1b78d')+line('M-19 3l5-10 5 7 6-13 7 13 5-9 9 12','#d9bf94',1.8),s,r);
function basket(contents){return steam+group('bamboo-steamer',0,0,shadow()+shape('M38 88v32q0 28 82 28t82-28V88Z','#d1ac77','#aa895d')+ellipse(120,89,82,36,'#e5c58c','#af8c5b')+ellipse(120,89,71,27,'#efdab0','#c7a976')+line('M45 119q75 36 150 0m-150 11q75 33 150 0','#b59260',1.5)+line('M75 113l85-43m-58 54l73-38m-110 12l65-34','#ddc292',2))+contents;}
const soy=(x,y,s=1,coffee=false,water=false)=>group(coffee?'coffee':water?'water':'soy-milk',x,y,ellipse(0,38,26,5,'#e2d4bb')+line('M23-12q25-2 21 18-3 16-22 11','#b8b99a',4)+shape('M-25-20h50l-3 51q-23 11-44 0Z',coffee?'#e9dfc9':'#f6f0d8','#b8b99a')+ellipse(0,-20,25,9,coffee?'#89664c':water?'#d8e6d8':'#e5d3a7','#b8b99a')+line('M-17-7l2 30','#fffaf0',3)+(coffee?line('M-10-21q7-7 15-1','#b89472',2):''),s);
const toast=(x,y,s=1,r=0)=>group('toast',x,y,shape('M-28 24l-1-44q-10-19 7-27 22-13 46 0 15 11 4 26l1 45Z','#d2a366','#aa7d4a')+shape('M-20 17l-1-36q-7-16 6-21 15-8 31 0 10 6 3 20l2 37Z','#f2d797','#dfb971')+marks([[-10,-20],[8,-8],[-6,3],[13,10]],'#e3bd76',2,1.3),s,r);
const riceball=(x,y,s=1,purple=false)=>group('rice-ball',x,y,shape('M-31 17l24-42q7-11 15 0l25 42q7 14-7 16h-52q-14-3-5-16Z',purple?'#b0a0b2':'#fff4d8',purple?'#8b7a91':'#d5bd93')+shape('M-13 10h26v24h-26Z','#627555','#4f6145')+marks([[-17,3],[0,-15],[17,2],[13,-7],[-12,-6]],purple?'#d7cad8':'#d9c7a4',2.5,1),s);
const corn=(x,y,s=1,r=-20)=>group('corn',x,y,shape('M-50-15q45-22 97 0 16 15 0 31-47 20-97 0-15-16 0-31Z','#e9c05d','#cda54d')+Array.from({length:8},(_,i)=>[-10,0,10].map(v=>ellipse(-39+i*11,v,4.2,4.1,'#f8da7e','#e3bb57')).join('')).join('')+shape('M-48 7q5 33 42 22-27-3-36-22m83-4q24 0 23 25-10-15-27-17','#98ae6d','#80975a'),s,r);
const sweetpotato=(x,y,s=1,r=-18)=>group('sweet-potato',x,y,ellipse(-8,0,45,22,'#b37b6d','#986352')+ellipse(23,3,24,20,'#efb75e','#ba8551')+ellipse(23,3,17,14,'#f5cd78')+line('M-40-4l8-3m8 18l7 2m-5-25l7 2m22 8l13 5','#dfaa8c',2),s,r);
const friedChicken=(x,y,s=1,r=0)=>group('fried-chicken',x,y,shape('M-23 9q-14-13-2-24 3-13 17-9 14-9 23 3 15 1 11 15 9 14-7 22-25 12-42-7Z','#cb9653','#aa7b43')+marks([[-19,-7],[-8,-15],[9,-14],[18,-1],[-9,4],[5,13],[0,-3]],'#edc47c',2.5,1.7)+line('M-17 15l9 2m12-12l9-3','#b58243',2),s,r);
const fries=(x,y,s=1)=>group('fries',x,y,[-15,-6,3,12].map((a,i)=>shape('M'+a+' 7l-3-'+(40+i%2*7)+' 7-1 5 42Z','#efc96f','#d8ab4c')).join('')+shape('M-24-3l48 2-6 35q-21 8-37-1Z','#ca8b69','#ac7156')+line('M-9 10v15m8-14v16m8-16v14','#efc5a0',2),s);
const yogurt=(x,y,s=1,cornTopping=false)=>group('yogurt-cup',x,y,shape('M-24-25h48l-5 61q-20 8-38 0Z','#f4efe2','#bdbda8')+ellipse(0,-25,24,9,'#fffbec','#c7c4af')+(cornTopping?marks([[-13,-27],[-4,-21],[7,-27],[14,-20],[-10,-16],[4,-17]],'#edc461',3.2,2.2):line('M-8-25q8-8 17 0','#c0a1b4',4))+line('M-15-8l2 29','#fffef4',3),s);
const beans=(x,y,s=1)=>group('red-beans',x,y,marks([[-17,-4],[-7,2],[3,-5],[14,1],[-1,7],[20,-6]],'#9f665c',4,2.8)+marks([[-18,-5],[-8,1],[2,-6],[13,0]],'#c58d7c',1.3,.7),s);
const berry=(x,y,s=1)=>group('strawberry',x,y,shape('M-11-7q12-8 23 0 1 14-12 23Q-12 8-11-7Z','#d8806d','#b96c59')+shape('M-12-7l9 1 4-9 4 9 9-1-10 6Z','#7e9b60','#7e9b60')+marks([[-5,0],[5,0],[0,7]],'#f8d9a0',1,1.4),s);
const banana=(x,y,s=1)=>group('banana',x,y,ellipse(0,0,10,6,'#f3d58e','#d8b66e')+ellipse(0,0,4,2,'#e7c274'),s);
const garnish=()=>leaf(171,111,.7,35);
const register=(names,kind,draw)=>names.split('|').forEach(name=>{foodRecipes[name]={kind,draw};});
// Desserts have their own vessels, layers and toppings.
register('红豆双皮奶','sweet',()=>plate()+group('milk-pudding',0,0,shape('M62 86q5 50 58 50t58-50Z','#e7c9bb','#c4a08d')+ellipse(120,85,58,24,'#fff3d7','#d9bd9c')+ellipse(120,84,49,17,'#fff8e8')+line('M72 107q15 18 33 20','#f7ded0',3))+beans(126,83,1.3));
register('芋泥酸奶碗','sweet',()=>bowl('#faf4e6')+group('taro-puree',94,84,shape('M-28 12q-4-13 5-17-3-13 11-15 10-13 18-1 17-1 15 14 16 9 3 20Z','#b5a0bb','#947c9e')+line('M-18 2q15-7 29-1m-23 9q15-6 28-1','#d9c9db',2))+banana(144,76)+banana(155,85)+berry(147,101,.75)+marks([[115,103],[125,107],[126,96]],'#b69263',2.5,1.5));
register('抹茶小蛋糕','sweet',()=>plate()+group('matcha-cake',0,0,shape('M72 74l57-27 43 26-6 52-94-1Z','#9bb37b','#78955c')+shape('M72 90l96 1-1 10-95-1Zm0 24h95l-1 10H72Z','#f7e9cb','#f7e9cb')+shape('M72 74l57-27 43 26-96 3Z','#bfd09b','#92a96f')+shape('M113 68q-2-13 10-13 1-12 12-4 14 7 3 17Z','#fff2d7','#ddcca8')+line('M84 80l68-1','#d1ddb5',2))+leaf(143,59,.38,-30));
register('水果松饼','sweet',()=>plate()+group('pancakes',0,0,ellipse(119,108,50,20,'#c99254','#a97843')+ellipse(119,101,50,20,'#e8bf7a','#bb8d53')+ellipse(119,91,50,20,'#f0cf92','#c69c60')+shape('M82 86q13-15 27-10l25-1q22-1 20 9-6 10-15 10-3 18-10 14-4-2-3-16-26 4-44-6Z','#c18a50','#c18a50')+shape('M106 77l18-2 5 10-19 3Z','#f9e6a8','#dcbf7f'))+berry(98,72,.8)+banana(143,77)+marks([[159,91],[152,98],[162,103]],'#7786a0',4,3));
register('巧克力甜甜圈','sweet',()=>plate()+group('chocolate-donut',0,0,ellipse(120,104,49,31,'#c88f57','#aa7548')+ellipse(120,97,48,30,'#845f4e','#704f41')+shape('M77 96q-7 13 0 17 7 3 8-8m62 1q5 17 11 10 5-7 0-17','#845f4e','#845f4e')+ellipse(120,97,15,10,'#dfb378','#b18050')+ellipse(120,99,11,6,'#f2e9d7')+line('M91 82l5 3m15-11l-1 5m25 0l5 3m17 13l-5 1m-15 18l2-4m-31 4l-4-3m-13-10l-5 2','#e8c49c',3)));
// Noodles: toppings distinguish thin rice noodles, udon, dry noodles and soup.
register('葱油拌面','noodle',()=>soupMeal(group('scallion-oil',0,0,line('M72 87l21-8m41 15l21-7m-45 11l18-5','#97784f',2.5)+line('M81 74l8 14m12-15l8 15m28-13l7 10m12-8l9 10','#74945c',4)),'#efe2b4'));
register('番茄鸡蛋面','noodle',()=>soupMeal(tomato(79,83,.8,-15)+tomato(152,96,.8,20)+scramble(123,74,.9),'#ecc293'));
register('酸汤肥牛米线','noodle',()=>soupMeal(beef(88,79,.8,-15,true)+beef(122,76,.8,15,true)+tomato(155,96,.65)+leaf(163,77,.6,25),'#e6c88d',true,false,2));
register('鲜虾云吞面','noodle',()=>soupMeal(dumpling(81,86,.55,-15,true)+dumpling(119,99,.53,12,true)+shrimp(128,73,.65,20)+leaf(162,81,.65,20),'#edd5a3'));
register('街边牛肉拉面','noodle',()=>soupMeal(beef(85,79,.75,-20)+beef(119,75,.8,10)+beef(148,94,.7,15)+leaf(166,79,.6,30),'#d7b98b'));
register('鸡丝凉面','noodle',()=>plate()+group('cold-noodles',0,11,noodles('#d8b36c',3))+group('shredded-chicken',0,0,line('M85 76l30 19m-25-23l34 18m-22-20l29 17','#eee0b7',4)+line('M144 72l15 27m-24-22l15 27m2-32l16 26','#87a768',4))+tomato(73,99,.7));
register('豆芽炒面','noodle',()=>plate()+group('stir-fried-noodles',0,10,noodles('#bb8e50',3))+group('bean-sprouts',0,0,line('M78 78q0 18 17 20m15-23q-2 15 12 22m17-22q-5 12 7 23m13-17q-2 10 8 16','#f5e5b5',3)+marks([[78,77],[110,75],[139,75],[159,81]],'#e8c16d',3,2))+leaf(166,109,.6,30));
register('香菇青菜面','noodle',()=>soupMeal(leaf(86,84,.8,-35)+leaf(105,80,.6,-5)+mushroom(144,80,.8)+mushroom(163,96,.55),'#e6d3a1'));
register('青菜鸡蛋面','noodle',()=>soupMeal(leaf(84,82,.8,-30)+leaf(163,87,.7,30)+egg(124,80,.9),'#ebd6a0'));
register('清汤牛肉面','noodle',()=>soupMeal(beef(83,83,.7,-15)+beef(118,78,.7)+leaf(163,82,.7,30),'#ebd8aa'));
register('牛肉面加蛋','noodle',()=>soupMeal(beef(83,83,.7,-15)+beef(119,76,.7)+boiledEgg(157,85,.7)+leaf(168,103,.5,30),'#dec392'));
register('紫菜鱼丸汤面','noodle',()=>soupMeal(group('nori',0,0,shape('M69 75l20-6 7 17-12 12-18-7Zm78 18l19-5 11 10-6 9-24 2Z','#657957','#657957'))+fishball(111,76)+fishball(133,82)+fishball(113,99,.85),'#e7d7af'));
register('番茄肥牛乌冬','noodle',()=>soupMeal(tomato(83,82,.8,-10)+beef(120,77,.85,0,true)+beef(155,94,.65,20,true),'#deaa81',true,false,5));
// Rice plates keep the named protein and vegetables; no automatic fried egg.
register('土豆丝盖饭','rice',()=>riceMeal(julienne(143,86,1.15)+leaf(171,114,.6,30)));
register('番茄鸡蛋饭|番茄鸡蛋盖饭','rice',()=>riceMeal(tomato(136,79,.9,-15)+scramble(157,103,.9)+tomato(119,109,.7,20)));
register('黑椒鸡腿饭','rice',()=>riceMeal(drumstick(146,87,.95,-15,true)+broccoli(165,121,.65)));
register('香菇鸡腿饭','rice',()=>riceMeal(drumstick(144,86,.9,-15)+mushroom(163,118,.65)+leaf(120,124,.5,25)));
register('双拼牛肉饭|牛肉双拼饭','rice',()=>riceMeal(beef(142,75,.8,-15)+beef(169,91,.75,5)+beef(132,113,.75,12,true)+broccoli(171,120,.6)));
register('白菜豆腐套餐','rice',()=>riceMeal(cabbage(147,77,.9,15)+tofu(131,112,.75,-10)+tofu(167,109,.75,12)));
register('咖喱土豆饭','rice',()=>riceMeal(group('curry',0,0,ellipse(145,102,40,26,'#b99450'))+potato(133,88,.85)+potato(161,104,.8)+potato(133,119,.65)+marks([[151,79],[168,114]],'#789559',3,2)));
register('黄焖鸡（取餐乌龙）|黄焖鸡饭','rice',()=>riceMeal(chicken(132,77,.8,-15)+chicken(165,103,.9,20)+potato(128,114,.7)+mushroom(167,77,.55)+leaf(174,125,.45,25)));
register('西兰花鸡肉饭','rice',()=>riceMeal(chicken(130,80,.85,-20)+chicken(156,106,.8,20)+broccoli(171,78,.75)+broccoli(128,126,.6)));
register('脆皮烤肉饭','rice',()=>riceMeal(pork(133,80,.85,-15)+pork(155,99,.85,-15)+pork(163,120,.75,-15)+garnish()));
register('现煎牛排饭','rice',()=>riceMeal(group('steak',147,94,shape('M-26-17q13-14 29-7 30 7 20 34-8 22-39 12-25-5-10-39Z','#9e7251','#80583e')+line('M-17-10l30 20m-34-8l25 18m-11-39l-16 35m31-26L-6 20','#72543c',2.5))+broccoli(164,127,.6)));
register('铁板鸡排饭','rice',()=>group('iron-plate',0,0,shadow()+shape('M29 95q0-39 91-39t91 39v29q0 28-91 28t-91-28Z','#807b67','#696653')+ellipse(120,98,83,36,'#b1a78b'))+rice(78,106,'#fff9e6',.9)+cutlet(150,94,.9)+broccoli(169,126,.5));
register('蔬菜炒饭','rice',()=>riceMeal(group('mixed-vegetables',0,0,marks([[90,80],[137,87],[111,101],[147,105],[103,118],[73,103]],'#809c60',3.4,2.4)+marks([[100,86],[122,91],[97,106],[130,114],[74,94]],'#d78c57',3,2.5)),{fried:true})+rice(137,101,'#efcd7c',.8)+group('diced-vegetables',0,0,marks([[132,82],[150,99],[129,109]],'#7e995c',3,2)+marks([[118,90],[139,102],[149,111]],'#d78c57',2.5,2)));
register('大盘鸡拼饭','rice',()=>riceMeal(chicken(135,76,.85,-20)+chicken(164,105,.85,25)+potato(127,113,.8)+potato(167,78,.65)+group('peppers',0,0,line('M145 117l16 6m-40-41l7-11','#879953',5))));
register('菌菇鸡肉煲仔饭','rice',()=>riceMeal(chicken(87,87,.8,-15)+chicken(122,104,.7,20)+mushroom(142,76,.75)+mushroom(163,96,.6)+leaf(169,101,.55,25),{pot:true,sauce:'#c69d66'}));
register('砂锅豆腐饭','rice',()=>riceMeal(tofu(92,83,.8,-15)+tofu(132,88,.85,15)+mushroom(161,78,.55)+leaf(154,108,.6,25),{pot:true,sauce:'#d5af7a'}));
register('砂锅鱼片饭','rice',()=>riceMeal(fish(92,85,.85,-15)+fish(134,90,.9,15)+leaf(159,105,.6,25)+tomato(160,75,.6),{pot:true,sauce:'#e1bf8d'}));
// School support meals use the same care as paid meals and reflect their descriptions.
register('两荤一素','rice',()=>riceMeal(chicken(134,77,.8,-15)+pork(163,102,.75,10)+leaf(148,123,.65,25)));
register('勤工午餐','rice',()=>riceMeal(tofu(141,80,.85,-10)+chicken(158,110,.8,10)+leaf(126,125,.6)));
register('校园餐券套餐','rice',()=>riceMeal(scramble(139,80,.9)+tomato(161,108,.8)+leaf(122,125,.65)));
register('室友共享饭盒','rice',()=>group('lunch-box',0,0,shadow()+shape('M41 64h158l8 72q-80 23-170-1Z','#c1cba7','#96a281')+shape('M48 70h66v59H44Zm75 0h67l6 58h-73Z','#f4ecd6','#abb795'))+rice(79,104,'#fff9e6',.85)+chicken(150,86,.8,-10)+broccoli(164,119,.6));
register('志愿者晚餐','rice',()=>group('meal-box',0,0,shadow()+shape('M39 67h159l9 68q-82 22-171 0Z','#e9d4aa','#c4ac82')+line('M113 69v65m0-36h85','#c4ac82',2))+rice(77,106,'#fff9e6',.85)+pork(156,83,.75,-10)+cabbage(157,119,.65,15));
register('校园热汤饭','rice',()=>soupMeal(rice(104,90,'#fff9e6',1)+cabbage(156,80,.75,20)+tofu(145,106,.6),'#ead9ab',false));
register('韩式石锅拌饭','rice',()=>steam+group('stone-bowl',0,0,shadow()+shape('M43 88q1 58 77 58t77-58Z','#777763','#5e6151')+ellipse(120,87,77,33,'#5e6151')+ellipse(120,87,68,26,'#e8cd98'))+rice(120,89,'#fff9e6',1.45)+group('bibimbap-vegetables',0,0,line('M72 76l20 16m-25-9l20 16m62-24l-15 18m23-11l-13 17','#a8ba78',5)+line('M84 104l22-9m-17 16l22-9','#d38d52',4))+beef(154,99,.65,25)+egg(119,80,.9));
// Buns, wontons and breakfast combinations show every named accompaniment.
register('青菜鲜肉小笼包','dumpling',()=>basket(bun(85,81,.8,false,true)+bun(141,73,.8)+bun(126,111,.8,false,true)));
register('勤工早餐','dumpling',()=>basket(bun(88,87,1)+bun(145,99,1)));
register('白馒头','dumpling',()=>basket(bun(87,85,1,true)+bun(146,103,1,true)));
register('青菜包配热水','dumpling',()=>plate()+soy(176,70,.7,false,true)+bun(91,103,1.3,false,true));
register('白菜猪肉饺子','dumpling',()=>plate()+dumpling(83,78,.8,-10)+dumpling(143,76,.8,10)+dumpling(111,113,.85)+dumpling(169,112,.65,15));
register('鲜肉小馄饨','dumpling',()=>soupMeal(dumpling(86,80,.7,-10,true)+dumpling(139,77,.7,10,true)+dumpling(116,105,.7,-5,true),'#e9d7aa',false));
register('鲜虾云吞','dumpling',()=>soupMeal(dumpling(84,84,.7,-15,true)+dumpling(135,81,.7,15,true)+shrimp(112,102,.65,10)+leaf(166,89,.55,25),'#ead7a9',false));
register('小笼包配鲜肉馄饨','dumpling',()=>group('wonton-soup',-23,18,soupMeal(dumpling(91,87,.8,-10,true)+dumpling(139,89,.8,10,true),'#e9d7aa',false),.72)+group('small-steamer',102,49,basket(bun(92,85,.95)+bun(144,106,.85)),.5));
register('港式早茶拼盘','dumpling',()=>basket(dumpling(82,81,.75,-10)+group('siu-mai',137,78,shape('M-18-10l34-2 3 32-37 0Z','#efd38b','#c5a367')+ellipse(0,-11,18,9,'#b68e73','#9b775e')+marks([[-7,-11],[4,-9],[9,-13]],'#d4925e',2.5,2))+shrimp(111,113,.7,20))+group('congee-side',153,103,shape('M-21-5q2 29 22 29T22-5Z','#e3dbbf','#b3b398')+ellipse(0,-5,22,9,'#f7ecd0','#b3b398')));
register('现蒸肠粉','noodle',()=>plate()+group('rice-noodle-rolls',0,0,[[84,82],[118,92],[150,102]].map(([x,y])=>group('rice-roll',x,y,shape('M-18-16l30 7 11 40-32-5Z','#fbf1d8','#d8c49e')+ellipse(4,23,15,6,'#f6e6c3','#d3bb93')+line('M-8-9L4 12','#fff9e9',4))).join('')+line('M68 92q56 5 104 24','#ac8054',4))+leaf(171,79,.75,35));
register('紫菜双拼饭团','riceball',()=>plate()+riceball(85,90,1)+riceball(151,99,1,true));
register('紫米饭团配豆浆','riceball',()=>plate()+soy(170,73,.75)+riceball(88,94,1.2,true));
register('宿舍燕麦','porridge',()=>steam+bowl('#dec69a')+group('oat-flakes',0,0,marks([[78,80],[93,93],[109,76],[125,95],[146,80],[157,96],[112,104],[134,85]],'#f4dfb7',4,1.7)+marks([[80,93],[118,85],[145,102]],'#c7a373',3,1.2)));
register('寝室共享杂粮粥','porridge',()=>steam+bowl('#c2a79b')+group('mixed-grains',0,0,marks([[78,80],[103,96],[137,78],[151,97],[111,77]],'#e7cba0',3.5,1.5))+beans(121,88,1));
register('小米粥配包子','porridge',()=>group('millet-congee',-4,9,steam+bowl('#edcf80')+marks([[80,80],[98,93],[119,76],[136,95],[155,83]],'#f8e7ad',2,1),.85)+bun(182,110,.9));
register('清粥配小菜','porridge',()=>group('rice-congee',-3,5,steam+bowl('#f3e6c6')+marks([[80,80],[98,93],[119,76],[136,95],[155,83]],'#d8c59c',3,1),.88)+group('pickles',185,117,ellipse(0,0,26,13,'#e2d7bc','#bcae8a')+line('M-12-3l8 9m-3-12l8 9m1-11l9 10','#849b61',4)));
register('紫菜蛋花汤配馒头','dumpling',()=>group('egg-drop-soup',-1,8,soupMeal(group('nori',0,0,shape('M72 80l19-5 8 13-14 8Zm68 11l20-4 7 12-17 8Z','#71815b','#71815b'))+scramble(118,84,.8),'#ebd7a2',false),.82)+bun(183,115,.9,true));
register('室友共享吐司','breakfast',()=>plate()+toast(99,96,.9,-12)+toast(143,105,.9,12));
register('鸡蛋蔬菜三明治','breakfast',()=>plate()+group('sandwich',0,0,shape('M60 117l66-65 48 71Z','#d0a16a','#aa804f')+shape('M66 111l60-51 42 56-56 13Z','#f6dc9d','#debd7e')+line('M71 114l39 11 52-7','#88a263',7)+line('M72 119l38 12 53-8','#d58462',4)+shape('M77 108l47-38 31 40-44 10Z','#f9ebbf','#e5c888')+ellipse(119,99,12,9,'#edbd55')));
register('火腿双蛋煎饼','breakfast',()=>plate()+group('jianbing',0,0,shape('M60 89l90-39 34 76-108 9Z','#e8c27a','#bf9658')+shape('M76 99l74-38 15 31-48 32Z','#f4da98','#d2ae6c')+line('M75 88l80 33','#dcae65',2)+marks([[81,105],[97,119],[116,78],[142,103]],'#b28e54',1.6,1.2))+egg(112,90,.65)+egg(152,100,.65)+group('ham',0,0,shape('M110 110l44-29 6 9-43 29Z','#d8917a','#be7b65')));
register('贝果咖啡套餐','breakfast',()=>plate()+soy(175,68,.75,true)+group('bagel',95,103,ellipse(0,0,43,28,'#cf9f61','#ab7e49')+ellipse(0,-4,41,25,'#e2b97a','#bd955e')+ellipse(0,-4,13,9,'#f1e7d2','#bd955e')+marks([[-24,-11],[-12,-21],[11,-22],[25,-12],[30,1],[-29,5],[-10,12],[13,13]],'#f7e1af',2,1)));
register('周末早午餐拼盘','breakfast',()=>plate()+toast(81,91,.65,-15)+egg(128,104,.95)+group('sausage',162,87,shape('M-9-21q14-9 19 4l6 33q-4 15-17 8Z','#bb8062','#a06c51')+line('M-3-12l12 6m-10 5l13 6m-10 6l13 6','#e1ae84',2))+tomato(163,121,.6)+leaf(123,70,.6));
register('牛油果鸡蛋早午餐','breakfast',()=>plate()+toast(79,95,.65,-15)+group('avocado',123,82,shape('M-21 20q-13-17-1-36 8-18 24-5 24 24 10 41-18 14-33 0Z','#78945c','#607f47')+shape('M-15 17q-12-16-1-29 8-12 17 0 14 17 7 28-12 11-23 1Z','#cbce87','#acb96e')+ellipse(-1,10,11,10,'#b58a59','#987348'))+egg(163,109,.85)+tomato(171,76,.65));
register('豆浆油条','drink',()=>plate()+soy(88,78,1)+group('youtiao',163,92,[-10,4].map(x=>shape('M'+x+'-44q11-10 14 0l-7 80q-11 10-15-2Z','#ddb16b','#bb8c50')).join('')+line('M-8-34l-7 57m22-55L0 28','#f2cd88',3)));
register('鸡蛋豆浆','drink',()=>plate()+soy(90,77,1)+boiledEgg(163,104,1)+boiledEgg(136,116,.7));
register('玉米酸奶杯','porridge',()=>plate()+yogurt(120,90,1.3,true));
register('蒸玉米','corn',()=>steam+plate()+corn(120,97,1.1));
register('小烤红薯','potato',()=>steam+plate()+sweetpotato(122,100,1.2));
register('烤红薯配酸奶','potato',()=>plate()+yogurt(174,80,.75)+sweetpotato(100,108,1));
register('茶叶蛋','egg',()=>plate()+boiledEgg(97,99,1.1,true)+group('tea-egg-half',151,105,ellipse(0,0,23,19,'#c69b67','#aa7f50')+ellipse(0,-2,19,15,'#f8e7bd')+ellipse(1,-2,11,10,'#dca747')));
// Pots vary by broth and main ingredients; grilling and sushi use their own plates.
register('砂锅豆腐煲','pot',()=>soupMeal(tofu(88,80,.85,-15)+tofu(128,99,.9,15)+mushroom(150,75,.7)+leaf(162,103,.65,30),'#d3ab74',false,true));
register('校园小火锅|期末庆功小火锅','pot',()=>soupMeal(cabbage(87,80,.8,-15)+tofu(116,101,.7)+beef(136,75,.8,10,true)+mushroom(163,89,.6)+potato(155,108,.55),'#d9ad76',false,true));
register('鲜切牛肉蔬菜火锅','pot',()=>soupMeal(cabbage(82,83,.8,-15)+beef(119,74,.8,10,true)+beef(155,88,.8,20,true)+tofu(124,103,.7)+mushroom(166,106,.55),'#d8b988',false,true));
register('椰子鸡双人拼单','pot',()=>soupMeal(chicken(94,83,.9,-10)+chicken(134,100,.8,20)+cabbage(159,78,.7,20)+group('coconut',183,109,shape('M-19-10q19-17 36 0-4 28-20 28-18-4-16-28Z','#b2926b','#92754f')+ellipse(-1,-9,17,9,'#fcf1d4','#cdb692')),'#f0dcb0',false,true));
register('寿喜锅套餐','pot',()=>soupMeal(beef(85,79,.8,-15,true)+tofu(119,98,.85)+mushroom(150,75,.75)+cabbage(166,99,.65,35),'#b38d60',false,true)+group('dipping-egg',45,128,ellipse(0,0,21,11,'#ece0bd','#bcab84')+ellipse(0,0,13,7,'#edbd55')));
register('菌汤牛肉火锅','pot',()=>soupMeal(beef(85,81,.8,-15,true)+mushroom(127,74,.85)+mushroom(156,91,.75)+tofu(114,107,.65)+leaf(165,107,.6,30),'#d1b88d',false,true));
register('海鲜蒸锅套餐','pot',()=>steam+bowl('#e6d7b7',true)+fish(88,84,.9,-15)+shrimp(133,74,.75,20)+shrimp(157,96,.7,30)+leaf(98,109,.55,-30)+group('scallop',128,111,shape('M-17-5q14-25 33-1L6 11H-5Z','#e5bca0','#bd957a')+line('M-12-7L0 7m1-22V7m11-14L3 7','#f7dfbf',2)));
register('麻辣香锅小锅','pot',()=>soupMeal(cabbage(85,80,.8,-15)+tofu(118,101,.75)+shrimp(153,78,.75,20)+potato(158,109,.6)+group('dried-chili',0,0,line('M95 75q11-14 23-4m13 30q13-15 25-6','#b66546',4)),'#bf8f59',false,true));
register('酸菜鱼拼单餐','pot',()=>soupMeal(cabbage(86,79,.8,-20)+fish(124,77,1,15)+fish(147,103,.8,-15)+group('pickled-greens',0,0,line('M71 96l23 7m-10-14l17 10m47-28l16 10','#9b9d5d',4)),'#d8c18a',false,true));
register('烤肉自助','snack',()=>group('grill',0,0,shadow()+shape('M39 78q78-39 161 0l5 53q-82 26-169-1Z','#85816d','#696653')+ellipse(120,82,80,30,'#c6bba0','#696653')+[-2,7,16].map(v=>line('M55 '+(75+v)+'q64 19 130 0','#8b846e',2)).join(''))+beef(91,79,.85,-15)+pork(144,83,.85,15)+mushroom(170,103,.65)+leaf(73,115,.65,-30));
register('小份寿司拼盘','riceball',()=>plate()+group('sushi',0,0,[[80,84],[126,76],[159,107],[104,117]].map(([x,y],i)=>group(i%2?'salmon-sushi':'nori-roll',x,y,i%2?shape('M-21 2q18-20 40-3l-1 18-36 1Z','#fff0cb','#d8c099')+shape('M-24 1q21-19 47-1l-4 7-41 2Z','#e2a07e','#bd8064')+line('M-10-6l7 13m8-16l7 13','#f8d5b0',2):shape('M-18-7h36v25q-18 10-36 0Z','#657754','#516246')+ellipse(0,-7,18,13,'#fff2d4','#728163')+ellipse(0,-7,9,7,'#d59b6d')+line('M-3-10l7 6','#89a56a',4))).join('')));
register('烤串小拼盘','snack',()=>plate()+group('kebab',0,0,[0,1,2].map((_,i)=>
 group('skewer',76+i*40,104,line('M-12 37L17-43','#a18458',2)+[-20,0,20].map((v,j)=>
  group(j===1?'pepper':'grilled-meat',0,v,shape('M-12-11l24-1 3 19-25 4Z',j===1?'#8f9e5b':'#bb8755','#9f754a')+line('M-5-6l9 9','#dfb378',2),1,-15)
 ).join(''))
).join('')));
register('炸鸡小食盒','snack',()=>group('snack-box',0,0,shadow()+shape('M45 86l150-5-10 53q-68 22-130 0Z','#e3c49a','#bc9c72')+ellipse(120,87,75,26,'#f5dfb8','#bc9c72'))+friedChicken(89,92,1,-15)+friedChicken(145,88,.95,20)+fries(165,104,.55));
register('炸鸡汉堡套餐','snack',()=>plate()+fries(65,89,.8)+group('burger',129,97,shape('M-39 14h79q-1 22-40 22t-39-22Z','#d6a065','#af814c')+line('M-37 14h75','#876347',10)+line('M-37 4q12-11 23-1t25-1 25 2','#86a05c',7)+shape('M-36-4l72-1-10 18-14-8-37 3Z','#ecc566','#cfa64d')+shape('M-41-9q0-35 40-35 41 0 42 35Z','#e4b77a','#bd9259')+marks([[-24,-24],[-9,-33],[10,-29],[27,-20],[-4,-16]],'#f9e3b4',2,1))+friedChicken(184,116,.55,20));
register('烤肉饭加小食','rice',()=>riceMeal(pork(132,78,.8,-15)+pork(156,101,.8,-15)+friedChicken(169,121,.6,20)+leaf(116,129,.5)));
register('食堂庆祝套餐','rice',()=>riceMeal(drumstick(143,81,.8,-15)+broccoli(166,117,.65))+group('mini-dessert',191,127,shape('M-13-15h25v23h-25Z','#b6bf8b','#96a66c')+line('M-12-5h24','#faeacd',4)+berry(0,-20,.5)));
function foodKind(name){return foodRecipes[name]?.kind||(/蛋糕|甜|奶碗|松饼|布丁/.test(name)?'sweet':/面|米线|肠粉/.test(name)?'noodle':/粥|燕麦/.test(name)?'porridge':/锅/.test(name)?'pot':'rice');}
function foodArt(name){
 const dish=String(name||'米饭'),recipe=foodRecipes[dish],kind=foodKind(dish);
 // An unlisted name gets a safe category drawing, without HTML interpolation.
 const art=recipe?recipe.draw():kind==='sweet'?foodRecipes['红豆双皮奶'].draw():kind==='noodle'?soupMeal(leaf(163,84,.7,30)):kind==='porridge'?foodRecipes['宿舍燕麦'].draw():kind==='pot'?foodRecipes['校园小火锅'].draw():plate()+rice(120,103,'#fff9e6',1.5);
 return'<svg class="canteen-food-svg" viewBox="0 0 240 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" data-food-dish="'+escape(dish)+'" data-food-recipe="'+(recipe?'named':'fallback')+'" data-food-kind="'+kind+'">'+art+'</svg>';
}
function render(state,scene,helpers={}){
 if(scene?.kind!=='三餐')return'';const esc=helpers.esc||escape,narrative=helpers.narrative||(s=>String(s??'').replaceAll('奶娃','奶蛙')),asset=helpers.asset||(name=>'./assets/'+name),meal=scene.id?.includes('breakfast')?'早餐':scene.id?.includes('lunch')?'午饭':'晚饭',outcome=state.phase==='outcome',wallet=Number(state.stats?.money||0);
 const title=outcome?narrative(scene.title):meal+'吃点什么？',heading='<header class="canteen-heading"><div><span class="canteen-kicker">'+(helpers.stall==='outside'?'校外小店':'校园食堂')+' · '+meal+'</span><h1 id="scene-title" tabindex="-1">'+esc(title)+'</h1></div><span class="canteen-wallet">饭卡 <b>¥'+wallet+'</b></span></header>';
 if(!outcome){const all=scene.choices.map((c,index)=>({c,index})),active=helpers.stall||'today',dishes=scene.stalls?all.filter(({c,index})=>c.stall===active||index===0||index===4).sort((a,b)=>active==='today'?a.index-b.index:(a.index===4?99:a.index===0?98:a.index)-(b.index===4?99:b.index===0?98:b.index)):all,hero=dishes.find(({c})=>!skipped(c)&&priceOf(c)>0&&priceOf(c)<=wallet)||dishes.find(({c})=>!skipped(c));
  const counter='<div class="canteen-window"><div class="canteen-window-label"><span>今日开饭</span><span>选好就开吃</span></div><div class="canteen-counter-tray">'+foodArt(hero?nameOf(hero.c):'米饭')+'</div><img class="canteen-frog" src="'+esc(asset('frog.png'))+'" alt="等着开饭的奶蛙"><div class="canteen-counter-edge"></div></div>';
  const cards=dishes.map(({c,index})=>{const price=priceOf(c),skip=skipped(c),disabled=!!c.disabledReason||price>wallet,reason=c.disabledReason||(price>wallet?'饭钱不足':['energy','health','study','mood'].some(k=>Number.isFinite(state.stats[k])&&state.stats[k]+Number(c.mods?.[k]||0)<=0)?'当前状态下有透支风险':''),priceText=price?'¥'+price:'免费';
   return'<button type="button" class="canteen-dish '+(skip?'canteen-skip':scene.stalls&&active!=='today'&&index===0?'canteen-free':'')+'" data-choice="'+index+'" aria-label="'+esc((skip?'不吃这餐':nameOf(c))+'，'+(skip?'不消费':priceText)+(reason?'，'+reason:''))+'" '+(disabled?'disabled':'')+'>'+(skip?'<span class="canteen-skip-icon" aria-hidden="true">↪</span>':'<span class="canteen-dish-art">'+foodArt(nameOf(c))+'</span>')+'<span class="canteen-dish-info"><strong>'+esc(skip?'这餐先不吃':nameOf(c))+'</strong><span class="canteen-dish-footer"><span class="canteen-dish-price">'+(skip?'不消费':priceText)+'</span>'+(reason?'<span class="canteen-dish-notice">'+esc(reason)+'</span>':'')+'</span></span><span class="canteen-pick" aria-hidden="true">'+(skip?'›':'+')+'</span></button>';
  }).join('');
  return'<section class="canteen" data-canteen="choice">'+heading+counter+(scene.stalls?'<nav class="stall-tabs" aria-label="食堂档口">'+[['today','今日推荐'],['sweet','甜点档'],['noodle','面档'],['rice','饭档'],['special','特色档'],['outside','出去吃']].map(([id,label])=>'<button data-stall="'+id+'" aria-pressed="'+(active===id)+'">'+label+'</button>').join('')+'</nav>':'')+'<p class="canteen-caption" data-meal-caption>点一道，坐下来慢慢吃。</p><div class="choices"><div class="canteen-menu">'+cards+'</div></div></section>';
 }
 const entry=state.outcome||{},chosen=scene.choices?.[entry.index],name=nameOf({text:entry.choice}),skip=!!entry.flags?.missedMeal||skipped(chosen),labels=root.DormGame?.labels||{energy:'电量',money:'饭钱',social:'人缘',study:'学业',health:'健康',mood:'心情',charm:'魅力'},keys=root.DormGame?.keys||Object.keys(labels),changes=keys.filter(k=>entry.changes?.[k]).map(k=>'<span class="'+(entry.changes[k]<0?'negative':'')+'">'+esc(labels[k]||k)+' '+(entry.changes[k]>0?'+':'')+entry.changes[k]+'</span>').join(''),extra=(entry.intimacyChange?'<span class="affection-change">亲密度 '+(entry.intimacyChange>0?'+':'')+entry.intimacyChange+'</span>':'')+(entry.project?'<span>课设 +'+entry.project+'</span>':''),failed=state.failed,failText=failed==='fail-energy'?'电量归零，本局结束。':['fail-health','fail-mood'].includes(failed)?'健康或心情归零，奶蛙长眠。':failed==='fail-mouse-family'?'奶鼠全网呼叫奶家人，本局结束。':failed==='fail-course'?'两次缺交课设，本学期转入重修。':'学业归零，触发劝退。',button=failed||state.lottery?.won?'查看结局':state.step===7?'今日结算':skip?'继续':'吃好了';
 return'<section class="canteen" data-canteen="outcome">'+heading+'<div class="canteen-served '+(skip?'canteen-served-skip':'')+'"><div class="canteen-tableware">'+(skip?'<span class="canteen-empty-plate" aria-hidden="true"></span>':foodArt(name))+'</div><img class="canteen-served-frog" src="'+esc(asset('frog.png'))+'" alt="'+(skip?'准备继续出发的奶蛙':'坐下来吃饭的奶蛙')+'"><span class="canteen-served-label">'+esc(skip?'这餐先不吃':name)+'</span></div><div class="outcome canteen-outcome" role="status"><span class="outcome-label">'+(skip?'这次的选择':'这顿吃了')+' · '+esc(skip?'先忙自己的事':name)+'</span><p>'+esc(narrative(entry.result||'')).replace(/\n/g,'<br>')+'</p><div class="changes">'+extra+changes+'</div>'+(failed?'<div class="failure-notice">'+failText+'</div>':'')+'<button class="button dark" id="next-scene">'+button+'</button></div></section>';
}
const api={render,foodArt,foodKind,nameOf};root.DormCanteen=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
