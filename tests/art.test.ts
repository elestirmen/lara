import {describe,it,expect} from 'vitest';
import {existsSync} from 'node:fs';
import {makeQuestion} from '../lib/questions';
import {lessons} from '../content';
import {icons} from '../components/activities/Picture';
import manifest from '../scripts/question-art.json';
import activityArt from '../scripts/activity-art.json';
const file=(name:string)=>`public/art/${name}.webp`;
describe('soru görselleri',()=>{
 it('soru görselleri kil görsellerdir; sayma resimlerindeki her simgenin görseli vardır',()=>{const art=new Set<string>(),emoji=new Set<string>();
  for(const l of lessons.filter(l=>l.subject!=='english'))for(let seed=0;seed<80;seed++)for(let i=0;i<8;i++){const v=makeQuestion(l,i,((seed%3)+1) as 1|2|3,seed).visual??'',[kind,item]=v.split(':');
   if(kind==='art')art.add(item);else if(['count','groups','share','pile','chart'].includes(kind)){emoji.add(item);if(kind==='chart')emoji.add(v.split(':')[4])}else expect(['','build','compose','symmetry','route'],`${l.id}: ${v}`).toContain(kind)}
  expect(art.size).toBeGreaterThan(100);for(const name of art)expect(existsSync(file(name)),name).toBe(true);
  expect(emoji.size).toBeGreaterThan(20);for(const e of emoji)expect(icons[e],e).toBeDefined();for(const [f] of Object.values(icons))expect(existsSync(file(`i/${f}`)),f).toBe(true)});
 it('İngilizce kelimelerin kil görseli vardır; yalnız insan ve vücut kelimeleri emoji kalır',()=>{const people=new Set(['teacher','student','goodbye','friend','head','eye','hand','ear','nose','foot','mother','father','sister','brother','grandmother','grandfather','baby','family']);for(const v of lessons.filter(l=>l.subject==='english').flatMap(l=>l.vocabulary??[])){if(v.art)expect(existsSync(file(v.art)),v.word).toBe(true);else expect(people.has(v.word),v.word).toBe(true)}});
 it('etkinlik görsellerinin listesindeki her dosya vardır',()=>{const names=activityArt.items.map(i=>i.name);for(const n of names)expect(existsSync(file(n)),n).toBe(true);expect(new Set(names).size).toBe(names.length)});
 it('üretim listesindeki her görsel klasörde vardır',()=>{const names=manifest.items.map(i=>i.name);for(const n of names)expect(existsSync(file(n)),n).toBe(true);expect(new Set(names).size).toBe(names.length)});
});
