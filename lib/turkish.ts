/** Rakamla yazılan sayıya, okunuşuna uygun Türkçe eki getirir: 5’ten, 6’dan, 2’şer, 3’ü, 6’ya. */
const ones=['','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz'],tens=['','on','yirmi','otuz','kırk','elli','altmış','yetmiş','seksen','doksan'];
function lastWord(n:number){n=Math.abs(Math.trunc(n));if(n===0)return 'sıfır';if(n%10)return ones[n%10];if(n%100)return tens[Math.floor(n/10)%10];if(n%1000)return 'yüz';return n%1000000?'bin':'milyon'}
export type NumberSuffix='e'|'i'|'de'|'den'|'er';
export function withSuffix(n:number,suffix:NumberSuffix){
 const word=lastWord(n),vowel=[...word].reverse().find(c=>'aeıioöuü'.includes(c))!,back='aıou'.includes(vowel),end=word.at(-1)!,endsVowel='aeıioöuü'.includes(end);
 const text=suffix==='e'?(endsVowel?'y':'')+(back?'a':'e'):suffix==='i'?(endsVowel?'y':'')+({a:'ı',ı:'ı',o:'u',u:'u',e:'i',i:'i',ö:'ü',ü:'ü'} as Record<string,string>)[vowel]:suffix==='er'?(endsVowel?'ş':'')+(back?'ar':'er'):('fstkçşhp'.includes(end)?'t':'d')+(back?'a':'e')+(suffix==='den'?'n':'');
 return `${n}’${text}`;
}
