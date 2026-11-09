const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,55);assert(!/<script src=|<link rel="stylesheet"/.test(html));
for(const s of scripts)new vm.Script(s[1]);const context={window:{}};vm.runInNewContext(scripts[0][1],context);
const mini=context.window.DormMiniDocument,child=[...mini.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(child.length,8);assert(!/<script src=|<link rel="stylesheet"/.test(mini));for(const s of child)new vm.Script(s[1]);assert(mini.includes('naiwa-mini-ready'));assert(!/data:image\/[^;]+;base64,[A-Za-z0-9+/]{100}/.test(mini),'The mini template must not duplicate media');
assert(context.window.DormAssets['simplicity.mp3'].startsWith('data:audio/mpeg;base64,'));
assert(!context.window.DormAssets['bgm-campus.wav'],'The synthesized draft should not be bundled');
assert(!mini.includes('simplicity.mp3'),'Background music should only be embedded once');

for(const [name,value]of Object.entries(context.window.DormAssets))assert.equal(html.split(value).length-1,1,name+' is embedded exactly once');

console.log('Standalone passed: 55 outer scripts, 8 child scripts, shared sprites, unique media payloads, and iframe bridge.');
