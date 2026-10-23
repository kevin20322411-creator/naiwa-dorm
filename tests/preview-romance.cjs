// Isolated visual QA origin: a real, replay-validated day-15 save from normal choices.
// Never served by the production entry or the regular preview server.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const G=require('../dist/story.js'),sample=require('./romance.cjs').simulate(Number(process.argv[2]||0),18,G),root=path.resolve(__dirname,'../dist');
if(!G.valid(sample.confession))throw Error('Invalid preview fixture');
const E=require('../dist/expressions.js'),fixtures={contact:sample.contact,encounter:sample.encounter,confession:sample.confession,dayEnd:sample.last,breakfast:G.create(0,['brain','toolkit'],'布局检查')};
for(let seed=0;seed<8&&(!fixtures.original||!fixtures.originalWave);seed++){
 const full=require('./romance.cjs').simulate(seed,18,G).last;let state=G.create(full.seed,full.traits,full.name,full.recent);
 for(const a of full.actions.slice(state.actions.length)){
  if(state.phase==='choice'){const scene=G.getScene(state),e=E.scene(state,scene);if(scene.romanceScene&&e.id==='original')fixtures.original??=state;if(scene.romanceScene&&e.id==='original-wave')fixtures.originalWave??=state;}
  if(/^c[0-4]$/.test(a))state=G.choose(state,+a[1]);else if(a==='n')state=G.next(state);else if(a==='d')state=G.continueDay(state);else if(a==='r')state=G.retire(state);else throw Error('Unexpected fixture action '+a);
 }
}
for(const [key,state]of Object.entries(fixtures))if(!G.valid(state))throw Error('Invalid '+key);
if(!fixtures.original||!fixtures.originalWave)throw Error('Missing original expression fixtures');

http.createServer((req,res)=>{
 const rel=new URL(req.url,'http://localhost').pathname,p=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));
 if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);return res.end();}const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.mp3':'audio/mpeg'};
 if(rel==='/')data=Buffer.from(data.toString().replace('<script src="./engine.js">','<script>localStorage.clear();localStorage.setItem("naiwa-dorm-sound","false");localStorage.setItem("naiwa-dorm-run-v2",'+JSON.stringify(JSON.stringify(fixtures[new URL(req.url,'http://localhost').searchParams.get('scene')]||sample.confession))+');</script><script src="./engine.js">'));
 res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
}).listen(4188,'127.0.0.1',()=>console.log('QA fixture: http://127.0.0.1:4188'));
