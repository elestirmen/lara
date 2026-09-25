export type GameId='memory'|'balloons'|'code'|'spell';
export interface GameInfo {id:GameId;title:string;icon:string;color:string;skill:string;description:string;how:string;better:'low'|'high';result:(best:number)=>string}
export const games:GameInfo[]=[
 {id:'memory',title:'Eşini bul',icon:'🃏',color:'purple',skill:'Hafıza · İngilizce · Sayılar',description:'Kartları çevir, eşlerini bul.',how:'İki kart çevir. Aynı anlamı taşıyan kartlar eştir. Bütün eşleri bulunca oyun biter.',better:'low',result:best=>`En iyi: ${best} hamle`},
 {id:'balloons',title:'Balon patlat',icon:'🎈',color:'peach',skill:'Matematik · Toplama ve sayılar',description:'Doğru sayıyı taşıyan balonu patlat.',how:'Soruyu oku, doğru cevabı taşıyan balona dokun. Yanlış balon ipucu verir.',better:'high',result:best=>`En iyi: ${best} / 8 ilk denemede`},
 {id:'code',title:'Piko’yu eve götür',icon:'🧭',color:'green',skill:'Kodlama · Yön bulma',description:'Ok kartlarıyla yol tarifi yaz.',how:'Ok kartlarıyla Piko’ya bir yol tarifi yaz, sonra Başlat’a dokun. Taşlara çarpmadan evine ulaşsın.',better:'high',result:best=>`${best} / 6 bölüm tamam`},
 {id:'spell',title:'Harf treni',icon:'🚂',color:'blue',skill:'Türkçe · Harfler ve kelimeler',description:'Harf vagonlarını sıraya diz.',how:'Resme bak, harf vagonlarını doğru sıraya diz ve kelimeyi kur.',better:'high',result:best=>`En iyi: ${best} / 6 ilk denemede`}
];
