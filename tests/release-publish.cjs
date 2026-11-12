const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{publish}=require('../.github/scripts/publish-release.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'naiwa-release-')),sha='a'.repeat(40),repository='kevin20322411-creator/naiwa-dorm',calls=[];
 try{
  fs.mkdirSync(path.join(root,'dist'));
  const app=path.join(root,'dist/app.js'),notes=path.join(root,'RELEASE_NOTES.md');
  fs.writeFileSync(app,"const RELEASE={version:'9.10'};");
  fs.writeFileSync(notes,[
   '# v9.10.1','- Patch notes','# v9.1','- Older notes','# v9.10 · 2026.11.12','',
   '- Current notes','## Details','- Also current','','# History','- Archived notes','# v9.9','- Last release'
  ].join('\r\n'));
  fs.writeFileSync(path.join(root,'export.cjs'),"require('node:fs').writeFileSync(process.argv[2],'<html>offline game</html>');");
  const response=(status,value)=>({status,ok:status>=200&&status<300,json:async()=>value});
  const request=async(url,options)=>{calls.push({url,options});if(calls.length===1)return response(404,{});if(calls.length===2)return response(201,{id:7,html_url:'https://github.com/'+repository+'/releases/tag/v9.10',assets:[]});return response(201,{id:8});};
  await publish({root,sha,repository,token:'test-only',request});assert.equal(calls.length,3);const payload=JSON.parse(calls[1].options.body);assert.equal(payload.target_commitish,sha);assert.equal(payload.tag_name,'v9.10');assert.equal(payload.body,'- Current notes\n## Details\n- Also current');assert.equal(payload.prerelease,false);assert.equal(calls[2].options.body.toString(),'<html>offline game</html>');assert(calls[2].url.startsWith('https://uploads.github.com/repos/'+repository+'/releases/7/assets?name=naiwa-dorm-v9.10.html'));
  fs.writeFileSync(app,"const RELEASE={version:'9.1'};");
  const olderCalls=[];
  await publish({root,sha,repository,token:'test-only',request:async(url,options)=>{olderCalls.push({url,options});return options.method==='POST'?response(201,{id:9,html_url:'https://github.com/'+repository+'/releases/tag/v9.1',assets:[{name:'naiwa-dorm-v9.1.html'}]}):response(404,{});}});
  assert.equal(JSON.parse(olderCalls[1].options.body).body,'- Older notes');
  fs.writeFileSync(notes,'# v9.10\n- Similar version\n\n## v9.1\n- Wrong heading level');
  const missingCalls=[];
  await assert.rejects(publish({root,sha,repository,token:'test-only',request:async(url,options)=>{missingCalls.push({url,options});return response(404,{});}}),/Missing RELEASE_NOTES\.md section for v9\.1$/);
  assert.equal(missingCalls.length,1,'a missing section never creates a release');
  assert.equal(missingCalls[0].options.method,undefined);
  fs.unlinkSync(notes);
  let reads=0;await publish({root,sha,repository,token:'test-only',request:async(url,options)=>{reads++;assert.equal(options.method,undefined);return response(200,{id:7,html_url:'existing release',assets:[{name:'naiwa-dorm-v9.1.html'}]});}});assert.equal(reads,1,'reruns do not overwrite an existing release or its assets');
  await assert.rejects(publish({root,sha:'not-a-commit',repository,token:'test-only',request}));assert.equal(calls.length,3,'invalid context sends no requests');
 }finally{if(!root.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(root).startsWith('naiwa-release-'))throw Error('Unexpected temporary path');fs.rmSync(root,{recursive:true,force:true});}
 console.log('Release publishing passed: exact version notes, missing section handling, target commit, offline attachment and safe reruns.');
})().catch(error=>{console.error(error);process.exitCode=1;});
