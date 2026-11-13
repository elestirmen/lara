import {describe,it,expect} from 'vitest';
import {bestVoice,speechParts} from '../lib/audio';
const v=(name:string,lang='tr-TR',localService=true)=>({name,lang,localService});
describe('seslendirme',()=>{
 it('aynı dildeki seslerden en doğal olanı seçer; robotik ses yalnız başka ses yoksa kullanılır',()=>{
  const windows=[v('Microsoft Tolga - Turkish (Turkey)'),v('Microsoft Emel Online (Natural) - Turkish (Türkiye)','tr-TR',false),v('Microsoft Ahmet Online (Natural) - Turkish (Türkiye)','tr-TR',false),v('Microsoft Zira - English (United States)','en-US')];
  expect(bestVoice(windows,'tr-TR')!.name).toContain('Emel');
  expect(bestVoice(windows,'tr-TR',false)!.name).toContain('Tolga');
  expect(bestVoice([v('Microsoft Tolga - Turkish (Turkey)')],'tr-TR')!.name).toContain('Tolga');
  expect(bestVoice([v('Yelda'),v('Yelda (Geliştirilmiş)')],'tr-TR')!.name).toBe('Yelda (Geliştirilmiş)');
  expect(bestVoice([v('Google Türkçe','tr_TR',false),v('Microsoft Tolga - Turkish (Turkey)')],'tr-TR')!.name).toBe('Google Türkçe');
  expect(bestVoice(windows,'en-GB')!.name).toContain('Zira');
  expect(bestVoice([v('Microsoft Zira - English (United States)','en-US')],'tr-TR')).toBeUndefined();
 });
 it('uzun metni cümlelerine ayırır; konuşma tırnağı cümlesinden kopmaz',()=>{
  expect(speechParts('Lara okuldan çıkınca yağmur başladı. Çantasından şemsiyesini çıkardı!')).toEqual(['Lara okuldan çıkınca yağmur başladı.','Çantasından şemsiyesini çıkardı!']);
  expect(speechParts('Lara, “Birlikte yürüyelim mi?” diye sordu. Ece güldü.')).toEqual(['Lara, “Birlikte yürüyelim mi?” diye sordu.','Ece güldü.']);
  expect(speechParts('Saat kaç')).toEqual(['Saat kaç']);
 });
});
