const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function run(file,...args){const result=spawnSync(process.execPath,[path.join(root,file),...args],{cwd:root,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw Error(file+' exited '+result.status);}
for(const folder of ['dist','dist/mini']){const html=fs.readFileSync(path.join(root,folder,'index.html'),'utf8');for(const [,name]of html.matchAll(/<script src="\.\/([^"?]+\.js)(?:\?[^\"]*)?"><\/script>/g))new vm.Script(fs.readFileSync(path.join(root,folder,name),'utf8'),{filename:name});}
const tests=['admission','positive-endings','achievement-book','ending-book','ui-state','wallet','school-care','campus-jobs','dining84','food-art','meal-rewards','release-publish','mini-ui','mini-games','background-music','touch-particles'];
for(const name of tests)run('tests/'+name+'.cjs');
const output=path.join(os.tmpdir(),'naiwa-dorm-check-'+process.pid+'.html');
try{run('export.cjs',output);run('tests/mini-export.cjs',output);}finally{if(fs.existsSync(output))fs.unlinkSync(output);}
console.log('Regression passed: '+tests.length+' suites, browser-script syntax, and a deduplicated offline build.');
