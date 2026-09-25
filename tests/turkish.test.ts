import {describe,it,expect} from 'vitest';
import {withSuffix} from '../lib/turkish';
import {makeQuestion} from '../lib/questions';
import {lessons} from '../content';
describe('sayılara Türkçe ek',()=>{
 it('okunuşa göre ünlü uyumu ve sertleşme uygulanır',()=>{
  expect([0,5,6,7,8,9,10,11,12,13,14,15,40,60,100].map(n=>withSuffix(n,'den'))).toEqual(['0’dan','5’ten','6’dan','7’den','8’den','9’dan','10’dan','11’den','12’den','13’ten','14’ten','15’ten','40’tan','60’tan','100’den']);
  expect([1,2,3,4,5,6,7,8,9,10].map(n=>withSuffix(n,'i'))).toEqual(['1’i','2’yi','3’ü','4’ü','5’i','6’yı','7’yi','8’i','9’u','10’u']);
  expect([1,2,3,6,7,9,20,40,50].map(n=>withSuffix(n,'e'))).toEqual(['1’e','2’ye','3’e','6’ya','7’ye','9’a','20’ye','40’a','50’ye']);
  expect([1,2,3,4,5,6,10].map(n=>withSuffix(n,'er'))).toEqual(['1’er','2’şer','3’er','4’er','5’er','6’şar','10’ar']);
  expect([3,6,8].map(n=>withSuffix(n,'de'))).toEqual(['3’te','6’da','8’de']);
 });
 it('matematik sorularında eski hatalı ekler kalmaz',()=>{for(const id of ['math-subtract','math-mental','math-skip','math-inverse','math-balance']){const l=lessons.find(l=>l.id===id)!;for(let seed=0;seed<200;seed++){const q=makeQuestion(l,seed%8,2,seed),text=`${q.instruction} ${q.explanation}`;expect(text,id).not.toMatch(/\b(5|7|8|11|12|13|14|15)’dan|\b2’er|\b[134568]’yi|\b[267]’e\b/)}}});
});
