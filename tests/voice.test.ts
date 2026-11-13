import {describe,it,expect} from 'vitest';
import {bestVoice,serverParts,speechParts,voiceUrl} from '../lib/audio';
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
 it('sunucu sesi için metin 400 karakteri aşmayan parçalara ayrılır ve adres güvenle kodlanır',()=>{
  const long='Sepette elma, armut, muz, '.repeat(30)+'çilek var.',parts=serverParts(`Kısa cümle. ${long} Son cümle?`);
  expect(parts[0]).toBe('Kısa cümle.');expect(parts.at(-1)).toBe('Son cümle?');expect(parts.every(p=>p.length<=380)).toBe(true);expect(parts.join(' ')).toBe(`Kısa cümle. ${long} Son cümle?`);
  expect(voiceUrl('Lara’nın 5 + 3 = ? sorusu')).toMatch(/^\/ses\?v=\d+&t=Lara%E2%80%99n%C4%B1n%205%20%2B%203%20%3D%20%3F%20sorusu$/);
 });
});
