const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
function releaseBody(notes,tag){
 const lines=notes.replace(/^\uFEFF/,'').split(/\r?\n/);
 const versionHeading=/^ {0,3}#[ \t]+(v\d+\.\d+(?:\.\d+)?)(?:[ \t]+·[ \t]+\d{4}\.\d{2}\.\d{2})?(?:[ \t]+#+)?[ \t]*$/;
 const start=lines.findIndex(line=>versionHeading.exec(line)?.[1]===tag);
 if(start<0)throw Error('Missing RELEASE_NOTES.md section for '+tag);
 const next=lines.findIndex((line,index)=>index>start&&/^ {0,3}#(?:[ \t]|$)/.test(line));
 return lines.slice(start+1,next<0?undefined:next).join('\n').trim();
}
async function publish({repository,sha,token,request=fetch,root=path.resolve(__dirname,'../..')}){
 if(repository!=='kevin20322411-creator/naiwa-dorm'||!/^[0-9a-f]{40}$/.test(sha||'')||!token)throw Error('Invalid release context');
 const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8'),version=app.match(/const RELEASE=\{version:'(\d+\.\d+(?:\.\d+)?)'/)?.[1];
 if(!version)throw Error('Only a numbered formal version can be released');
 const tag='v'+version,api='https://api.github.com/repos/'+repository,headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2026-03-10'};
 let response=await request(api+'/releases/tags/'+tag,{headers}),release;
 if(response.status===404){
  const body=releaseBody(fs.readFileSync(path.join(root,'RELEASE_NOTES.md'),'utf8'),tag);
  response=await request(api+'/releases',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({tag_name:tag,target_commitish:sha,name:tag,body,draft:false,prerelease:false})});
 }
 if(!response.ok)throw Error('GitHub release request failed: '+response.status);
 release=await response.json();if(!Number.isSafeInteger(release.id))throw Error('Missing release id');
 const name='naiwa-dorm-'+tag+'.html';
 if(!(release.assets||[]).some(a=>a.name===name)){
  const file=path.join(root,name),build=spawnSync(process.execPath,[path.join(root,'export.cjs'),file],{cwd:root,stdio:'inherit'});
  if(build.status!==0)throw Error('Offline export failed');
  const upload=await request('https://uploads.github.com/repos/'+repository+'/releases/'+release.id+'/assets?name='+encodeURIComponent(name),{method:'POST',headers:{...headers,'Content-Type':'text/html'},body:fs.readFileSync(file)});
  if(!upload.ok)throw Error('Offline attachment upload failed: '+upload.status);
 }
 console.log('Release ready: '+release.html_url);return release.html_url;
}
if(require.main===module)publish({repository:process.env.GITHUB_REPOSITORY,sha:process.env.GITHUB_SHA,token:process.env.GITHUB_TOKEN}).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={publish};
