/**
 * Piko sohbeti (tarayıcı tarafı). Köşedeki Piko'ya dokunan herkes konuşabilir; mesajlar /piko servisine
 * (piko/server.ts) gider. Sohbet kaydedilmez.
 */
export const MAX_CHILD_TEXT=200;
/** local: yalnızca ekranda gösterilen hazır Piko cümlesi (selam, hata); modele gönderilmez. */
export type PikoLine={role:'user'|'assistant';text:string;local?:boolean};
export type PikoError='hiz'|'ag';

/** Sohbetin ilk ekranındaki hazır sorular: yazmakta zorlanan çocuk tek dokunuşla başlar. */
export const starters=['Bana bir bilmece sor','Bana kısa bir masal anlat','Hayvanlar hakkında ilginç bir şey söyle','Benimle sayı oyunu oyna'];

export const errorText:Record<PikoError,string>={
 hiz:'Çok hızlı konuştuk! Biraz bekleyip yeniden dener misin?',
 ag:'İnternete ulaşamadım. Bağlantıyı kontrol edip yeniden dener misin?'
};

async function post(body:object,signal?:AbortSignal):Promise<{status:number;data:Record<string,unknown>}|PikoError>{
 try{
  const res=await fetch('/piko',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal});
  if(res.status===429)return 'hiz';
  const data=await res.json().catch(()=>({}));
  return {status:res.status,data};
 }catch{return 'ag'}
}

/** Son mesajlar gönderilir (sunucu en fazla 12'sini kullanır); hazır yerel cümleler atlanır. */
export async function askPiko(lines:PikoLine[],signal?:AbortSignal):Promise<{reply:string;local:boolean}|{error:PikoError}>{
 const messages=lines.filter(l=>!l.local).slice(-14).map(({role,text})=>({role,text}));
 const result=await post({messages},signal);
 if(typeof result==='string')return {error:result};
 const reply=result.data.reply;
 // Servis çalışmadığında ya da günlük sınır dolunca gelen hazır cümle sohbet geçmişine girmez.
 return typeof reply==='string'&&reply?{reply,local:result.status!==200||result.data.limit===true}:{error:'ag'};
}
