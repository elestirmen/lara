/**
 * Piko sohbeti (tarayıcı tarafı). Sohbet yalnızca Ebeveyn Alanı'nda aile kodu girilmiş cihazlarda açılır;
 * kod bu cihazda saklanır ve her istekte /piko servisine (piko/server.ts) gönderilir. Sohbet kaydedilmez.
 */
export const PIKO_CODE_KEY='lara-piko-kod-v1';
export const MAX_CHILD_TEXT=200;
/** local: yalnızca ekranda gösterilen hazır Piko cümlesi (selam, hata); modele gönderilmez. */
export type PikoLine={role:'user'|'assistant';text:string;local?:boolean};
export type PikoError='kod'|'hiz'|'ag';

export const normalizeCode=(code:string)=>code.trim().toLowerCase().replace(/\s+/g,'');
export function readPikoCode(){try{return localStorage.getItem(PIKO_CODE_KEY)??''}catch{return ''}}

/** Sohbet kapalı cihazlarda Piko'ya dokununca söylenen hazır cümleler (sırayla). */
export const buddyLines=[
 'Merhaba! Ben Piko. Bugün hangi adayı keşfedelim?',
 'Gıdıklanıyorum! Hi hi hi!',
 'Biliyor musun? Ahtapotların üç kalbi var!',
 'Yanlış yapmak sorun değil. Denemek çok güzel!',
 'Biliyor musun? Arılar dans ederek birbirine çiçeklerin yerini anlatır.',
 'Bahçende kaç çiçek açtı, baktın mı?',
 'Ben her gün biraz su içip büyürüm. Sen de her gün biraz öğrenerek büyürsün!',
 'Biraz mola mı? Oyun molasında seni eğlenceli oyunlar bekliyor.'
];

/** Sohbetin ilk ekranındaki hazır sorular: yazmakta zorlanan çocuk tek dokunuşla başlar. */
export const starters=['Bana bir bilmece sor','Bana kısa bir masal anlat','Hayvanlar hakkında ilginç bir şey söyle','Benimle sayı oyunu oyna'];

export const errorText:Record<PikoError,string>={
 kod:'Piko bu cihazda kapalı. Bir büyüğün Ebeveyn Alanı’ndan yeniden açabilir.',
 hiz:'Çok hızlı konuştuk! Biraz bekleyip yeniden dener misin?',
 ag:'İnternete ulaşamadım. Bağlantıyı kontrol edip yeniden dener misin?'
};

async function post(body:object,signal?:AbortSignal):Promise<{status:number;data:Record<string,unknown>}|PikoError>{
 try{
  const res=await fetch('/piko',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal});
  if(res.status===429)return 'hiz';
  if(res.status===403)return 'kod';
  const data=await res.json().catch(()=>({}));
  return {status:res.status,data};
 }catch{return 'ag'}
}

/** Kodu sunucuya sorar: Ebeveyn Alanı yalnızca doğru kodu kaydeder. */
export async function checkPikoCode(code:string):Promise<'ok'|PikoError>{
 const result=await post({code,check:true});
 if(typeof result==='string')return result;
 return result.status===200&&result.data.ok===true?'ok':'ag';
}

/** Son mesajlar gönderilir (sunucu en fazla 12'sini kullanır); hazır yerel cümleler atlanır. */
export async function askPiko(code:string,lines:PikoLine[],signal?:AbortSignal):Promise<{reply:string;local:boolean}|{error:PikoError}>{
 const messages=lines.filter(l=>!l.local).slice(-14).map(({role,text})=>({role,text}));
 const result=await post({code,messages},signal);
 if(typeof result==='string')return {error:result};
 const reply=result.data.reply;
 // Servis çalışmadığında ya da günlük sınır dolunca gelen hazır cümle sohbet geçmişine girmez.
 return typeof reply==='string'&&reply?{reply,local:result.status!==200||result.data.limit===true}:{error:'ag'};
}
