// Isolated QA origin; never included in the production entry point.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),G=require('../dist/evolution.js'),T=require('./evolution.cjs');
const root=path.resolve(__dirname,'../dist'),fixtures={};
for(let seed=0;seed<12;seed++){const r=T.run(seed);for(const[k,v]of Object.entries(r.samples))fixtures[k]??=v;fixtures.scholarship??=r.points.find(s=>s.evolution.rewarded);}
if(fixtures.bitten){const s=G.startActivity(fixtures.bitten,'vaccine');fixtures.vaccine=s;fixtures.vaccinated=G.choose(s,s.stats.money>=18?0:1);}
for(const[k,s]of Object.entries(fixtures))if(!G.valid(s))throw Error('Invalid QA fixture '+k);
http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),rel=url.pathname,file=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}if(rel==='/')data=Buffer.from(data.toString().replace('<script src="./engine.js">','<script>localStorage.clear();localStorage.setItem("naiwa-dorm-sound","false");localStorage.setItem("naiwa-dorm-run-v2",'+JSON.stringify(JSON.stringify(fixtures[url.searchParams.get('scene')]||fixtures.mouse))+');</script><script src="./engine.js">'));
res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});}).listen(4188,'127.0.0.1',()=>console.log('QA http://127.0.0.1:4188 '+Object.keys(fixtures).join(',')));
