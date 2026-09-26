import {describe,it,expect} from 'vitest';
import {makeQuestion,nextQuestion,previewQuestion,questionKeys} from '../lib/questions';
import {lessons} from '../content';
import type {Lesson,Question} from '../lib/types';
/** LessonPlayer turu: öğren ekranındaki keşif + 8 soru; ilk soru hep 1. seviye, sonrakiler ilerlemeye göre değişebilir. */
const levels:(1|2|3)[][]=[[1,1,1,1,1,1,1,1],[1,2,2,2,2,2,2,2],[1,3,3,3,3,3,3,3],[1,1,2,2,3,3,3,3],[1,3,2,1,3,2,1,3]];
function run(l:Lesson,seed:number,level=levels[0]){const preview=previewQuestion(l),seen=preview?questionKeys(preview):[],questions:Question[]=[];for(let i=0;i<8;i++){const q=nextQuestion(l,i,level[i],seed,seen);expect(questionKeys(q).some(k=>seen.includes(k)),`${l.id} tohum ${seed}, ${i}. soru tekrar: ${q.instruction}`).toBe(false);seen.push(...questionKeys(q));questions.push(q)}return questions}
describe('soru çeşitliliği',()=>{
 it('bir ders turunda hiçbir soru, hiçbir yönerge tekrar etmez',()=>{for(const l of lessons)for(const level of levels)for(let seed=0;seed<60;seed++){const texts=run(l,seed*7919+11,level).map(q=>q.instruction);expect(new Set(texts).size,`${l.id} tohum ${seed}: ${texts.join(' / ')}`).toBe(texts.length)}},60000);
 it('yeniden keşfette sorular değişir; ilk sorular bile tek bir kalıba bağlı kalmaz',()=>{const content=(q:Question)=>[q.type,q.instruction,q.visual,q.items?.join('|'),q.value,q.start].join('¦');for(const l of lessons){const all=new Set<string>(),firsts=new Set<string>();for(let seed=0;seed<40;seed++)run(l,seed*104729+3).forEach((q,i)=>{all.add(content(q));if(i===0)firsts.add(content(q))});if(!l.generator?.startsWith('story'))expect(all.size,l.id).toBeGreaterThan(8);if(l.subject==='math'||l.subject==='life'||l.subject==='english'||l.kind==='rhythm')expect(firsts.size,l.id).toBeGreaterThan(2)}});
 it('Hayat Bilgisi ve İngilizce havuzları bir turdan geniştir',()=>{for(const l of lessons.filter(l=>l.subject==='life'))expect(l.questions!.length,l.id).toBeGreaterThanOrEqual(12);for(const l of lessons.filter(l=>l.subject==='english'))expect(l.vocabulary!.length,l.id).toBeGreaterThanOrEqual(8)});
 it('geometri derslerinde keşif ve ilk soru yerleştirme aracıdır, tur keşfi tekrar etmez',()=>{for(const l of lessons.filter(l=>l.kind==='geometry')){expect(previewQuestion(l)!.type,l.id).toBe('geometry');for(let seed=0;seed<30;seed++)expect(makeQuestion(l,0,1,seed).type,l.id).toBe('geometry')}});
 it('aynı tohum aynı turu verir',()=>{for(const l of lessons)expect(run(l,777).map(q=>q.instruction)).toEqual(run(l,777).map(q=>q.instruction))});
});
