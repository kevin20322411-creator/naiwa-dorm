const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{publish}=require('../.github/scripts/publish-release.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'naiwa-release-')),sha='a'.repeat(40),repository='kevin20322411-creator/naiwa-dorm',calls=[];
 try{
  fs.mkdirSync(path.join(root,'dist'));fs.writeFileSync(path.join(root,'dist/app.js'),"const RELEASE={version:'9.6'};");fs.writeFileSync(path.join(root,'RELEASE_NOTES.md'),'Release notes');
  fs.writeFileSync(path.join(root,'export.cjs'),"require('node:fs').writeFileSync(process.argv[2],'<html>offline game</html>');");
  const response=(status,value)=>({status,ok:status>=200&&status<300,json:async()=>value});
  const request=async(url,options)=>{calls.push({url,options});if(calls.length===1)return response(404,{});if(calls.length===2)return response(201,{id:7,html_url:'https://github.com/'+repository+'/releases/tag/v9.6',assets:[]});return response(201,{id:8});};
  await publish({root,sha,repository,token:'test-only',request});assert.equal(calls.length,3);const payload=JSON.parse(calls[1].options.body);assert.equal(payload.target_commitish,sha);assert.equal(payload.tag_name,'v9.6');assert.equal(payload.body,'Release notes');assert.equal(payload.prerelease,false);assert.equal(calls[2].options.body.toString(),'<html>offline game</html>');assert(calls[2].url.startsWith('https://uploads.github.com/repos/'+repository+'/releases/7/assets?'));
  let reads=0;await publish({root,sha,repository,token:'test-only',request:async()=>{reads++;return response(200,{id:7,html_url:'existing release',assets:[{name:'naiwa-dorm-v9.6.html'}]});}});assert.equal(reads,1,'reruns do not overwrite existing release assets');
  await assert.rejects(publish({root,sha:'not-a-commit',repository,token:'test-only',request}));assert.equal(calls.length,3,'invalid context sends no requests');
 }finally{if(!root.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(root).startsWith('naiwa-release-'))throw Error('Unexpected temporary path');fs.rmSync(root,{recursive:true,force:true});}
 console.log('Release publishing passed: numbered formal versions, fixed repository, exact target commit, offline attachment and safe reruns.');
})().catch(error=>{console.error(error);process.exitCode=1;});
