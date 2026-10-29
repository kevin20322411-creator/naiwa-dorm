const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),A=require('../dist/mini/arcade-logic');
assert.equal(A.badmintonGrade(0),'perfect');assert.equal(A.badmintonGrade(-.2),'good');assert.equal(A.badmintonGrade(.3),'miss');
assert.ok(A.clawGrip(8,true)>.8);assert.ok(A.clawGrip(40,true)<.5);assert.equal(A.clawGrip(60,true),0);assert.equal(A.clawGrip(0,false),0);
assert.equal(A.runnerHit(1,{lane:1,kind:'barrier'},false),true);assert.equal(A.runnerHit(1,{lane:1,kind:'barrier'},true),true);assert.equal(A.runnerHit(1,{lane:1,kind:'cone'},true),false);assert.equal(A.runnerHit(2,{lane:1,kind:'cone'},false),false);
const b={x:0,y:-15,r:8,vx:0,vy:200},p={x:0,y:0,r:10};assert.ok(A.bounce(b,p));assert.ok(b.vy<0);assert.ok(Math.hypot(b.x,b.y)>=18);assert.ok(Number.isFinite(b.vx+b.vy));
for(const ball of [{x:0,y:0,r:8,vx:0,vy:0},{x:100,y:100,r:8,vx:1,vy:1}]){A.bounce(ball,p);assert.ok(Object.values(ball).every(Number.isFinite));}
const pegs=A.pinLayout();assert.equal(pegs.length,49);assert.ok(pegs.some(p=>p.star));assert.equal(new Set(pegs.map(p=>p.x+','+p.y)).size,pegs.length);
const target=A.racketContact(),origin=A.racketContact(699,326,-.4),landing=A.shuttleFlight(origin,target,1.65,1.65);assert.ok(Math.hypot(landing.x-target.x,landing.y-target.y)<.001);assert.equal(A.shuttleGrade(landing),'perfect');assert.equal(A.shuttleGrade({x:target.x+45,y:target.y}),'good');assert.equal(A.shuttleGrade({x:target.x+60,y:target.y}),'miss');
const plush={x:300,y:250,rotation:0,r:34};A.plushStep([plush],.01,null,null);assert.ok(plush.y>250&&plush.vy>0);for(let i=0;i<600;i++)A.plushStep([plush],1/120,null,null);assert.ok(Math.abs(plush.y-514)<2);
for(let i=0;i<360;i++)A.plushStep([plush],1/120,plush,{x:360,y:200},1);assert.ok(Math.abs(plush.x-360)<3&&plush.y<220);const heldY=plush.y;for(let i=0;i<60;i++)A.plushStep([plush],1/120,null,null);assert.ok(plush.y>heldY+50);
const pair=[{x:300,y:500,rotation:0},{x:320,y:500,rotation:0}];A.plushStep(pair,1/120,null,null);assert.ok(Math.hypot(pair[0].x-pair[1].x,pair[0].y-pair[1].y)>60);
for(const name of ['app.js','arcade.js','logic.js','arcade-logic.js'])new vm.Script(fs.readFileSync(path.join(__dirname,'../dist/mini',name),'utf8'));
const html=fs.readFileSync(path.join(__dirname,'../dist/mini/index.html'),'utf8');for(const file of [...html.matchAll(/(?:src|href)="\.\/([^"?]+)"/g)].map(m=>m[1]))assert.ok(fs.existsSync(path.join(__dirname,'../dist/mini',file)),file);
console.log('Arcade checks passed: timing, grip, collision, physics, assets, script syntax.');
