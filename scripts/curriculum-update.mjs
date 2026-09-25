// Read-only against MEB. Never changes the reviewed curriculum. Reports are local.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
const sources=[['math','ilkokul-matematik-dersi'],['tr','ilkokul-turkce-dersi'],['life','hayat-bilgisi-dersi'],['english','ingilizce-dersi-temel-egitim'],['art','gorsel-sanatlar-dersi-temel-egitim'],['music','muzik-dersi-temel-egitim'],['move','beden-egitimi-ve-oyun-dersi']];
const stamp=new Date().toISOString(),dir=`curriculum/reviews/${stamp.replace(/[:.]/g,'-')}`;
await mkdir(dir,{recursive:true});
const report={checkedAt:stamp,academicYear:'2026-2027',grade:2,pages:[],errors:[],changes:[]};
let baseline={pages:[]};try{baseline=JSON.parse(await readFile('curriculum/source-baseline.json','utf8'))}catch{}
async function fetchPage(path){const url=`https://tymm.meb.gov.tr${path}`;const res=await fetch(`${url}${url.includes('?')?'&':'?'}verification=${stamp.slice(0,10)}`,{signal:AbortSignal.timeout(20000)});if(!res.ok)throw new Error(`HTTP ${res.status}: ${url}`);const html=await res.text();if(html.length<1000)throw new Error(`Eksik yanıt: ${url}`);return {url,$:load(html)}}
for(const [subject,slug] of sources){try{const {$}=await fetchPage(`/ogretim-programlari/${slug}/3`);const links=[...new Set($('a[href*="/unite/"]').map((_,a)=>$(a).attr('href')).get())];if(!links.length)throw new Error(`${subject}: tema bağlantısı bulunamadı`);
 for(const path of links){try{const {url,$}=await fetchPage(path);const heading=$('h1').text().trim();const section=$('.content').filter((_,el)=>$(el).prev().text().includes('Öğrenme Çıktıları')).first();if(!section.length)throw new Error(`${url}: öğrenme çıktısı bölümü bulunamadı`);const text=section.text().replace(/\s+/g,' ').trim();const pattern=/(?:MAT|HB|GS|BEO|MÜZ)\.2\.\d+\.\d+\.?|T\.[DKOY]\.2\.\d+\.?|ENG\.2\.\d+\.[A-Z]\d+\.?/g;const matches=[...text.matchAll(pattern)];const outcomes=matches.map((m,i)=>({code:m[0].replace(/\.$/,''),text:text.slice(m.index+m[0].length,matches[i+1]?.index??text.length).split(/\s+[a-zçğıöşü]\)/)[0].trim()}));if(!outcomes.length)throw new Error(`${url}: 2. sınıf kodu bulunamadı`);const hash=createHash('sha256').update(text).digest('hex');report.pages.push({subject,theme:heading,url,hash,outcomes});const old=baseline.pages.find(p=>p.url===url);if(!old||old.hash!==hash)report.changes.push({url,type:old?'changed':'new',previousHash:old?.hash,currentHash:hash});console.log(`${subject}: ${heading} — ${outcomes.length} çıktı`)}catch(e){report.errors.push(String(e));console.error(String(e))}}
 }catch(e){report.errors.push(String(e));console.error(String(e))}}
// Never mistake a failed fetch for a removed theme. Only complete runs can
// report removals; accepted curriculum and source snapshots remain untouched.
if(!report.errors.length){
 for(const old of baseline.pages){if(!report.pages.some(page=>page.url===old.url))report.changes.push({url:old.url,type:'removed',previousHash:old.hash});}
}
for(const change of report.changes){
 const old=baseline.pages.find(page=>page.url===change.url),current=report.pages.find(page=>page.url===change.url);
 const before=new Set(old?.outcomes.map(outcome=>outcome.code)??[]),after=new Set(current?.outcomes.map(outcome=>outcome.code)??[]);
 change.addedCodes=[...after].filter(code=>!before.has(code));
 change.removedCodes=[...before].filter(code=>!after.has(code));
}
await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));
console.log(`Rapor: ${dir}/report.json. ${report.changes.length} değişiklik, ${report.errors.length} hata. Onaylı veri korundu.`);
if(report.errors.length)process.exitCode=1;
