const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../dist/canteen-ui.js'),base=path.resolve(__dirname,'..');
// Read released and current menu sources, so a new menu dish must have a recipe.
const names=new Set(['黄焖鸡饭']);
for(const file of ['life','food','dining'])for(const m of fs.readFileSync(path.join(base,'dist',file+'.js'),'utf8').matchAll(/(?:food|dish)\('([^']+)'/g))names.add(m[1]);
for(const m of fs.readFileSync(path.join(base,'dist/campus-dining.js'),'utf8').matchAll(/\['(?:sweet|noodle|rice|special|outside)','([^']+)'/g))names.add(m[1]);
const arts=new Map([...names].map(n=>[n,C.foodArt(n)]));
for(const [name,art] of arts){
 assert(art.startsWith('<svg '),name+' uses a native SVG');
 assert(art.includes('data-food-recipe="named"'),name+' needs a named recipe');
 assert(!/food-atlas|<image|background-image|undefined|NaN|https?:/.test(art.replace('http://www.w3.org/2000/svg','')),name+' has no external food image or invalid values');
 assert.equal((art.match(/<g\b/g)||[]).length,(art.match(/<\/g>/g)||[]).length,name+' has balanced ingredient groups');
}
const requires={
 '红豆双皮奶':['milk-pudding','red-beans'], '芋泥酸奶碗':['taro-puree','banana','strawberry'],
 '抹茶小蛋糕':['matcha-cake'], '水果松饼':['pancakes','banana','strawberry'],
 '宿舍燕麦':['oat-flakes'], '室友共享吐司':['toast'], '勤工早餐':['steamed-bun'],
 '勤工午餐':['rice','chicken','tofu'], '室友共享饭盒':['lunch-box','rice','broccoli'],
 '校园餐券套餐':['rice','tomato','scrambled-egg'], '寝室共享杂粮粥':['mixed-grains','red-beans'],
 '志愿者晚餐':['meal-box','roast-pork','cabbage'], '校园热汤饭':['bowl','rice','tofu'],
 '土豆丝盖饭':['rice','shredded-potato'], '番茄鸡蛋饭':['rice','tomato','scrambled-egg'],
 '黑椒鸡腿饭':['rice','chicken-leg'], '双拼牛肉饭':['beef','beef-roll'],
 '葱油拌面':['noodles','scallion-oil'], '酸汤肥牛米线':['noodles','beef-roll'],
 '番茄肥牛乌冬':['noodles','tomato','beef-roll'], '现蒸肠粉':['rice-roll'],
 '鲜虾云吞面':['noodles','shrimp','wonton'], '紫菜鱼丸汤面':['nori','fish-ball'],
 '青菜鲜肉小笼包':['bamboo-steamer','steamed-bun'], '鲜肉小馄饨':['wonton'],
 '白菜猪肉饺子':['dumpling'], '紫米饭团配豆浆':['rice-ball','soy-milk'],
 '小笼包配鲜肉馄饨':['steamed-bun','wonton'], '港式早茶拼盘':['siu-mai','dumpling','congee-side'],
 '牛油果鸡蛋早午餐':['avocado','fried-egg','toast'], '豆浆油条':['soy-milk','youtiao'],
 '砂锅豆腐煲':['clay-pot','tofu'], '鲜切牛肉蔬菜火锅':['beef-roll','cabbage'],
 '椰子鸡双人拼单':['chicken','coconut'], '海鲜蒸锅套餐':['fish-slice','shrimp','scallop'],
 '烤肉自助':['grill','beef','roast-pork'], '烤串小拼盘':['skewer','grilled-meat'],
 '小份寿司拼盘':['salmon-sushi','nori-roll'], '炸鸡汉堡套餐':['burger','fries','fried-chicken'],
 '黄焖鸡饭':['chicken','potato','rice']
};
for(const [name,parts] of Object.entries(requires))for(const part of parts)assert(arts.get(name)?.includes('data-food-part="'+part+'"'),name+' must contain '+part);
const desserts=['红豆双皮奶','芋泥酸奶碗','抹茶小蛋糕','水果松饼','巧克力甜甜圈'];
assert.equal(new Set(desserts.map(n=>arts.get(n).slice(arts.get(n).indexOf('>')+1))).size,5,'each dessert has a distinct composition');
for(const name of desserts)assert(!arts.get(name).includes('data-food-part="rice"'),name+' is not illustrated as rice');
assert(!C.foodArt('土豆丝盖饭').includes('data-food-part="fried-egg"'),'no unlisted egg on potato rice');
assert(!C.foodArt('现蒸肠粉').includes('data-food-part="noodles"'),'rice rolls are not spaghetti');
assert(!C.foodArt('<script>alert(1)</script>').includes('<script>'),'untrusted dish names are escaped');
assert(C.foodArt('米饭').includes('data-food-recipe="fallback"'),'unknown names keep a safe drawing');
if(process.argv.includes('--gallery')){
 const out=path.join(base,'.openai/food-art-gallery.html');
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,'<!doctype html><meta charset="utf-8"><title>食物插画校样</title><style>body{margin:0;padding:24px;background:#f7f3e8;color:#665844;font:14px system-ui}main{display:grid;grid-template-columns:repeat(5,240px);gap:12px}article{background:#fcfaf5;border:1px solid #e5ddcc;border-radius:16px;text-align:center;padding-bottom:12px}svg{display:block;width:240px;height:170px}p{margin:0}</style><main>'+[...arts].map(([n,a])=>'<article>'+a+'<p>'+n+'</p></article>').join('')+'</main>');
 console.log('Gallery: '+out);
}
console.log(JSON.stringify({passed:true,namedMenuDishes:names.size,ingredientChecks:Object.values(requires).flat().length,desserts:desserts.length}));
