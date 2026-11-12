/** Rakamla yazılan sayıya, okunuşuna uygun Türkçe eki getirir: 5’ten, 6’dan, 2’şer, 3’ü, 6’ya. */
const ones=['','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz'],tens=['','on','yirmi','otuz','kırk','elli','altmış','yetmiş','seksen','doksan'];
function lastWord(n:number){n=Math.abs(Math.trunc(n));if(n===0)return 'sıfır';if(n%10)return ones[n%10];if(n%100)return tens[Math.floor(n/10)%10];if(n%1000)return 'yüz';return n%1000000?'bin':'milyon'}
export type NumberSuffix='e'|'i'|'de'|'den'|'er';
export function withSuffix(n:number,suffix:NumberSuffix){
 const word=lastWord(n),vowel=[...word].reverse().find(c=>'aeıioöuü'.includes(c))!,back='aıou'.includes(vowel),end=word.at(-1)!,endsVowel='aeıioöuü'.includes(end);
 const text=suffix==='e'?(endsVowel?'y':'')+(back?'a':'e'):suffix==='i'?(endsVowel?'y':'')+({a:'ı',ı:'ı',o:'u',u:'u',e:'i',i:'i',ö:'ü',ü:'ü'} as Record<string,string>)[vowel]:suffix==='er'?(endsVowel?'ş':'')+(back?'ar':'er'):('fstkçşhp'.includes(end)?'t':'d')+(back?'a':'e')+(suffix==='den'?'n':'');
 return `${n}’${text}`;
}
/** 0–100 arası sayının okunuşu: 47 → kırk yedi. */
export function numberWord(n:number){return n===0?'sıfır':n===100?'yüz':[tens[Math.floor(n/10)],ones[n%10]].filter(Boolean).join(' ')}
/** Türk alfabesi (29 harf) ve sözlük sırası. */
export const alphabet=[...'abcçdefgğhıijklmnoöprsştuüvyz'],vowels='aeıioöuü';
export const upper=(s:string)=>s.toLocaleUpperCase('tr-TR'),lower=(s:string)=>s.toLocaleLowerCase('tr-TR');
export const letterCount=(word:string)=>[...lower(word)].filter(c=>alphabet.includes(c)).length;
export const vowelCount=(word:string)=>[...lower(word)].filter(c=>vowels.includes(c)).length;
/** Sözlük sırası karşılaştırması: harfler alfabedeki yerine göre, kısa olan önce. */
export function compareWords(a:string,b:string){const x=[...lower(a)],y=[...lower(b)];for(let i=0;i<Math.min(x.length,y.length);i++){const d=alphabet.indexOf(x[i])-alphabet.indexOf(y[i]);if(d)return d}return x.length-y.length}
/** Heceleme: her hecede bir ünlü vardır; iki ünlü arasındaki tek ünsüz sonraki heceye, birden çok ünsüzün yalnız sonuncusu sonraki heceye geçer (ke-le-bek, kar-puz, sa-at, Türk-çe). */
export function syllables(word:string){const chars=[...word],isVowel=(c:string)=>vowels.includes(lower(c)),nuclei=chars.map((c,i)=>isVowel(c)?i:-1).filter(i=>i>=0);if(nuclei.length<2)return [word];const cuts=nuclei.slice(1).map((v,k)=>v-nuclei[k]===1?v:v-1),parts:string[]=[];let from=0;for(const cut of cuts){parts.push(chars.slice(from,cut).join(''));from=cut}parts.push(chars.slice(from).join(''));return parts}
/** Cümledeki kelimeler; noktalama kelimeye sayılmaz. */
export const wordsOf=(sentence:string)=>sentence.trim().split(/\s+/).filter(w=>/[\p{L}\d]/u.test(w));
/** Ritmik sayma sözü, çocuğun okuduğu gibi yazıyla: 3 → “üçer üçer”, 10 → “onar onar”. Cümle başında büyük harfle (cap). */
const each=['','birer','ikişer','üçer','dörder','beşer','altışar','yedişer','sekizer','dokuzar','onar'];
export function byEach(n:number,cap=false){const w=`${each[n]} ${each[n]}`;return cap?w[0].toLocaleUpperCase('tr-TR')+w.slice(1):w}
