/**
 * Lara’nın herkese açık tanıtımı. Site herkese açıktır: soyadı, okul, adres,
 * telefon veya konum bilgisi eklemeyin. Fotoğrafların konum (EXIF) bilgisini silin.
 * favorites: [{icon:'🎨',label:'En sevdiğim renk',value:'Mor'}]
 * drawings: public/galeri/ altındaki dosyalar, ör. [{src:'/galeri/gokkusagi.svg',title:'Gökkuşağı'}]
 */
export const profile={
 name:'Lara',
 possessive:'Lara’nın',
 avatar:'L',
 about:'8 yaşındayım, 2. sınıftayım.',
 intro:'Burası benim öğrenme dünyam. Derslerimi keşfet, arada bir de oyun molası ver!',
 favorites:[] as {icon:string;label:string;value:string}[],
 drawings:[] as {src:string;title:string}[]
};
