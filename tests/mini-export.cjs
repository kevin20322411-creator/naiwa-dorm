const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,53);assert(!/<script src=|<link rel="stylesheet"/.test(html));
for(const s of scripts)new vm.Script(s[1]);const context={window:{}};vm.runInNewContext(scripts[0][1],context);
const mini=context.window.DormMiniDocument,child=[...mini.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(child.length,8);assert(!/<script src=|<link rel="stylesheet"/.test(mini));for(const s of child)new vm.Script(s[1]);assert(mini.includes('naiwa-mini-ready'));assert(mini.includes('window.PreviewAssets='));console.log('Standalone passed: 53 outer scripts, 8 embedded scripts, assets and iframe bridge.');
assert(context.window.DormAssets['simplicity.mp3'].startsWith('data:audio/mpeg;base64,'));
assert(!context.window.DormAssets['bgm-campus.wav'],'The synthesized draft should not be bundled');
assert(!mini.includes('simplicity.mp3'),'Background music should only be embedded once');
