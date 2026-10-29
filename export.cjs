const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'dist');
const target=path.resolve(process.argv[2]||'naiwa-dorm.html');
const files={'frog.png':'image/png','frog-wave.png':'image/png','naishu.png':'image/png','naishu-cutout.png':'image/png','laugh.mp3':'audio/mpeg','eat-ganbadie.mp3':'audio/mpeg'};
for(const name of fs.readdirSync(path.join(root,'assets')))if(/^meme-[a-z]+\.png$/.test(name))files[name]='image/png';
const assets=Object.fromEntries(Object.entries(files).map(([name,type])=>[name,'data:'+type+';base64,'+fs.readFileSync(path.join(root,'assets',name)).toString('base64')]));
function script(code){new vm.Script(code);return '<script>'+code.replaceAll('</script','<\\/script')+'</script>';}
function data(value){return JSON.stringify(value).replaceAll('<','\\u003c');}
function inline(html,dir){return html.replace(/<link rel="stylesheet" href="\.\/([^"?]+\.css)(?:\?[^" ]*)?">/g,(_,name)=>'<style>'+fs.readFileSync(path.join(dir,name),'utf8')+'</style>').replace(/<script src="\.\/([^"?]+\.js)(?:\?[^" ]*)?"><\/script>/g,(_,name)=>script(fs.readFileSync(path.join(dir,name),'utf8')));}
let mini=inline(fs.readFileSync(path.join(root,'mini/index.html'),'utf8'),path.join(root,'mini'));
mini=mini.replace('<head>','<head>'+script('window.PreviewAssets='+data(assets)+';'));
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('href="./assets/frog-wave.png"','href="'+assets['frog-wave.png']+'"');
html=html.replace('<script src="./engine.js"></script>',script('window.DormAssets='+data(assets)+';window.DormMiniDocument='+data(mini)+';')+'<script src="./engine.js"></script>');
html=inline(html,root);fs.writeFileSync(target,html,'utf8');console.log('Exported '+target+' ('+Buffer.byteLength(html)+' bytes)');
