/**
 * Piko sohbeti (tarayıcı tarafı). Köşedeki Piko'ya dokunan herkes konuşabilir; mesajlar /piko servisine
 * (piko/server.ts) gider. Sohbet kaydedilmez.
 */
export const MAX_CHILD_TEXT=200;
/** Ekrandaki sayfanın metninden Piko'ya en fazla bu kadar karakter gider (servis de aynı sınırı uygular). */
export const MAX_PAGE_TEXT=1500;
/** Ders ekranındaki “Piko’ya sor” düğmesi sohbeti bu olayla açar (köşedeki Piko derslerde gizlidir). */
export const PIKO_OPEN='piko-ac';
export const openPiko=()=>window.dispatchEvent(new Event(PIKO_OPEN));
/** local: yalnızca ekranda gösterilen hazır Piko cümlesi (selam, hata); modele gönderilmez. */
export type PikoLine={role:'user'|'assistant';text:string;local?:boolean};
export type PikoError='hiz'|'ag';

/** Sohbetin ilk ekranındaki hazır sorular: yazmakta zorlanan çocuk tek dokunuşla başlar. */
export const starters=['Bana bir bilmece sor','Bana kısa bir masal anlat','Hayvanlar hakkında ilginç bir şey söyle','Benimle sayı oyunu oyna'];

/**
 * Ekrandaki sayfanın görünen metni (#main, alt bilgi hariç). Piko “bu sayfada ne var”, “burada ne yapacağım” sorularını
 * buna bakarak cevaplar. Ebeveyn Alanı gönderilmez: orada çocuğun ilerleme bilgileri yazar.
 */
export function pageContext(){
 if(typeof document==='undefined'||location.hash.startsWith('#parents'))return '';
 const main=document.getElementById('main');if(!main)return '';
 const text=[...main.children].filter(el=>el.tagName!=='FOOTER').map(el=>(el as HTMLElement).innerText??'').join(' ');
 return text.replace(/\s+/g,' ').trim().slice(0,MAX_PAGE_TEXT);
}
/** Sayfaya göre ilk hazır soru: derste soruyu, diğer sayfalarda sayfanın kendisini sorar. */
export function pageStarter(){
 if(typeof document==='undefined'||location.hash.startsWith('#parents'))return '';
 if(document.querySelector('#main .question-instruction'))return 'Bu soruda ne yapmam gerekiyor?';
 return document.querySelector('#main .lesson-page')?'Bu sayfada ne öğreniyorum?':'Bu sayfada neler var?';
}

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

/** Son mesajlar ve ekrandaki sayfanın metni gönderilir (sunucu en fazla 12 mesaj kullanır); hazır yerel cümleler atlanır. */
export async function askPiko(lines:PikoLine[],page:string,signal?:AbortSignal):Promise<{reply:string;local:boolean}|{error:PikoError}>{
 const messages=lines.filter(l=>!l.local).slice(-12).map(({role,text})=>({role,text}));
 const result=await post(page?{messages,page}:{messages},signal);
 if(typeof result==='string')return {error:result};
 const reply=result.data.reply;
 // Servis çalışmadığında ya da günlük sınır dolunca gelen hazır cümle sohbet geçmişine girmez.
 return typeof reply==='string'&&reply?{reply,local:result.status!==200||result.data.limit===true}:{error:'ag'};
}
