// Isolated visual QA origin: a real, replay-validated day-15 save from normal choices.
// Never served by the production entry or the regular preview server.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const sample=require('./romance.cjs').simulate(0),G=require('../dist/romance.js'),root=path.resolve(__dirname,'../dist');
if(!G.valid(sample.confession))throw Error('Invalid preview fixture');
http.createServer((req,res)=>{
 const rel=new URL(req.url,'http://localhost').pathname,p=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));
 if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);return res.end();}const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.mp3':'audio/mpeg'};
 if(rel==='/')data=Buffer.from(data.toString().replace('<script src="./engine.js">','<script>localStorage.clear();localStorage.setItem("naiwa-dorm-sound","false");localStorage.setItem("naiwa-dorm-run-v2",'+JSON.stringify(JSON.stringify(sample.confession))+');</script><script src="./engine.js">'));
 res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
}).listen(4188,'127.0.0.1',()=>console.log('QA fixture: http://127.0.0.1:4188'));
