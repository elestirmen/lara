import {it} from 'vitest';
import {writeFileSync} from 'node:fs';
import {lessons} from '../content';
import {makeQuestion} from '../lib/questions';
import {serverParts} from '../lib/audio';
/** Önceden üretilecek ses listesini çıkarır (yalnız VOICE_LIST verilince çalışır): VOICE_LIST=/yol/liste.json npx vitest run tests/voice-list.test.ts
 * Sabit metinler (anlatımlar, hikâyeler, kartlar, hazır sorular) ile üreticilerden örneklenen yönergeler, sitenin gönderdiği gibi cümlelere ayrılır.
 * Çıktı: {sabit:[cümle…], degisken:[[cümle, kaç kez çıktı]…]} — değişkenler sık çıkandan seyreğe sıralıdır. */
it.runIf(process.env.VOICE_LIST)('ses listesi',()=>{const fixed=new Set<string>(),counts=new Map<string,number>(),add=(text:string|undefined)=>{if(text)for(const part of serverParts(text))fixed.add(part)};
 for(const l of lessons){if(l.subject==='english')continue;l.learn.forEach(add);add(l.story);for(const c of l.cards??[])add(`${c.title}. ${c.text}`);for(const q of l.questions??[])add(q.instruction)}
 const seeds=Number(process.env.VOICE_SEEDS??300);
 for(const l of lessons){if(l.subject==='english')continue;for(let seed=0;seed<seeds;seed++)for(let i=0;i<8;i++){const q=makeQuestion(l,i,((seed%3)+1) as 1|2|3,seed*7919+13);for(const part of serverParts(q.instruction))if(!fixed.has(part))counts.set(part,(counts.get(part)??0)+1)}}
 const dynamic=[...counts].sort((a,b)=>b[1]-a[1]),chars=(list:string[])=>list.reduce((n,x)=>n+x.length,0),total=dynamic.reduce((n,[,c])=>n+c,0);let covered=0;const marks=[1000,2000,4000,8000,16000,32000].map(n=>{covered=dynamic.slice(0,n).reduce((k,[,c])=>k+c,0);return `${n}: %${Math.round(covered/total*100)} (${Math.round(chars(dynamic.slice(0,n).map(x=>x[0]))/11.5/60)} dk ses)`});
 writeFileSync(process.env.VOICE_LIST!,JSON.stringify({sabit:[...fixed],degisken:dynamic}));
 console.log(`SABIT ${fixed.size} cümle, ${Math.round(chars([...fixed])/11.5/60)} dk ses | DEGISKEN ${dynamic.length} farklı cümle, ${Math.round(chars(dynamic.map(x=>x[0]))/11.5/60)} dk ses | kapsama ${marks.join('; ')}`)},600000);
