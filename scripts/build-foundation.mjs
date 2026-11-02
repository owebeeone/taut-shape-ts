// Build the recorded canonical foundation once. No dependency installation/publication.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve,relative} from 'node:path';
import {mkdirSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const arguments_=process.argv.slice(2);
const option=name=>{const i=arguments_.indexOf(name);return i<0?undefined:arguments_[i+1];};
if(arguments_.some((arg,i)=>i%2===0 && !['--output','--owner'].includes(arg)) || arguments_.length%2) throw Error('usage: build-foundation.mjs [--output DIR] [--owner COMPILED_SOURCE_OWNER]');
const source=join(root,'foundation-src'),out=resolve(option('--output')||join(root,'foundation'));
const selectedOwner=option('--owner')&&resolve(option('--owner'));
if(selectedOwner===resolve(out,'cjs')) throw Error('source-owner binding must not replace itself with a facade');
const provenance=JSON.parse(readFileSync(join(source,'provenance.json'),'utf8'));
for(const [name,hash] of Object.entries(provenance.sources)) {
  if(createHash('sha256').update(readFileSync(join(source,name))).digest('hex')!==hash) throw Error('modified canonical foundation: '+name+'; re-vendor from base Taut');
}
mkdirSync(join(out,'esm'),{recursive:true});
writeFileSync(join(out,'package.json'),'{"type":"module"}\n');
const config={compilerOptions:{target:'ES2022',module:'commonjs',strict:true,skipLibCheck:true,declaration:true,
  rewriteRelativeImportExtensions:true,outDir:join(out,'cjs'),rootDir:source,lib:['ES2022','DOM']},
  files:Object.keys(provenance.sources).map(name=>join(source,name))};
writeFileSync(join(out,'tsconfig.json'),JSON.stringify(config,null,2)+'\n');
if(selectedOwner) {
  const owner=require(join(selectedOwner,'foundation.js'));
  if(typeof owner.requireFoundation!=='function') throw Error('selected source foundation lacks mandatory contracts; regenerate/rebind');
  if(!owner.Foundation || typeof owner.Foundation!=='object' || owner.Foundation.owner!=='taut.typescript.foundation' || owner.Foundation.descriptorContract!==1 || owner.Foundation.codecContract!==1 || owner.requireFoundation(owner)!==owner.Foundation)
    throw Error('selected source foundation lacks a valid owner token or namespace-checked guard support; regenerate/rebind');
  mkdirSync(join(out,'cjs'),{recursive:true});
  for(const name of Object.keys(provenance.sources).map(n=>n.slice(0,-3))) {
    // Build-time binding to one actual owner, never two evaluations of the sources.
    const target=join(selectedOwner,name+'.js');
    require(target);
    let module=relative(join(out,'cjs'),target).replaceAll('\\','/');if(!module.startsWith('.'))module='./'+module;
    writeFileSync(join(out,'cjs',name+'.js'),'module.exports = require('+JSON.stringify(module)+');\n');
    writeFileSync(join(out,'cjs',name+'.d.ts'),'export * from '+JSON.stringify(module)+';\n');
  }
} else {
  const tsc=process.env.TAUT_TSC_JS || require.resolve('typescript/lib/tsc.js');
  execFileSync(process.execPath,[tsc,'--project',join(out,'tsconfig.json')],{stdio:'inherit'});
}
unlinkSync(join(out,'tsconfig.json'));
writeFileSync(join(out,'cjs/package.json'),'{"type":"commonjs"}\n');
for(const name of Object.keys(provenance.sources).map(n=>n.slice(0,-3))) {
  const owner=require(join(out,'cjs',name+'.js'));
  const code='import owner from "../cjs/'+name+'.js";\n'+Object.keys(owner).map(k=>'export const '+k+' = owner.'+k+';\n').join('');
  writeFileSync(join(out,'esm',name+'.js'),code);
  writeFileSync(join(out,'esm',name+'.d.ts'),'export * from "../cjs/'+name+'.js";\n');
}
writeFileSync(join(out,'provenance.json'),JSON.stringify({...provenance,binding:selectedOwner?{kind:'compiled-source-owner',module:relative(out,selectedOwner).replaceAll('\\','/')}: {kind:'canonical-package-owner'}},null,2)+'\n');
console.log('canonical foundation CJS owner + ESM facades built');
