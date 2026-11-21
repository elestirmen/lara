/**
 * Piko sohbeti (tarayıcı tarafı). Köşedeki Piko'ya dokunan herkes konuşabilir; mesajlar /piko servisine
 * (piko/server.ts) gider. Sohbet kaydedilmez.
 */
export const MAX_CHILD_TEXT=200;
/** Ekrandaki sayfanın metninden Piko’ya en fazla bu kadar karakter gider (servis de aynı sınırı uygular). */
export const MAX_PAGE_TEXT=1500;
/** local: ekranda yalnızca hazır cümle (örn. selam, hata) olarak görünür, modele gitmez. hidden: modele gider ama ekranda görünmez (sayfa tanıtımını başlatan soru). */
export type PikoLine={role:'user'|'assistant';text:string;local?:boolean;hidden?:boolean};
export type PikoError='hiz'|'ag';

/**
 * Derste ya da oyunda açık olan sorunun öğretmen notları: sitenin kendi ipuçları ve çözümü. Piko ipucunu bunlardan seçer,
 * hesabı kendisi yapmaz. question: sorunun cümlesi (servis, cevap soruda yazmıyorsa Piko'nun onu söylemesini engeller). onUse: Piko bu soruda yardım edince çağrılır (ders, sorunun yardımla çözüldüğünü kaydeder).
 */
export type PikoHelp={hints:string[];solution?:string;question?:string;onUse?:()=>void};
let currentHelp:PikoHelp|null=null;
/** Ders ve oyun ekranları açık sorunun notlarını burada bildirir; ekran kapanınca null verir. */
export function setPikoHelp(help:PikoHelp|null){currentHelp=help}

/** Sayfanın türü: Piko’ya dokununca ilk soru (introAsks) ve sonraki hazır sorular buna göre seçilir. */
export type PageKind='parents'|'question'|'lesson'|'game'|'page';
export function pageKind():PageKind{
 if(typeof document==='undefined'||location.hash.startsWith('#parents'))return 'parents';
 if(document.querySelector('#main .question-instruction'))return 'question';
 if(document.querySelector('#main .lesson-page'))return 'lesson';
 return document.querySelector('#main .game-page')?'game':'page';
}
/** Piko’ya dokununca sohbet bu soruyla kendiliğinden başlar (ekranda görünmez). piko/kurallar.ts INTRO_ASKS ile aynı. */
export const introAsks:Record<Exclude<PageKind,'parents'>,string>={page:'Bu sayfada neler var?',lesson:'Bu sayfada ne öğreniyorum?',question:'Bu soruda ne yapmam gerekiyor?',game:'Bu oyun nasıl oynanır?'};
/** Hazır sorular: yazmakta zorlanan çocuk tek dokunuşla başlar (Ebeveyn Alanı’nda ilk ekranda bunlar görünür). */
export const starters=['Bana bir bilmece sor','Bana kısa bir masal anlat','Hayvanlar hakkında ilginç bir şey söyle','Benimle sayı oyunu oyna'];
/** Tanıtımdan sonra gösterilen hazır sorular: önce sayfaya göre devam soruları, sonra eğlenceli olanlar. */
export function followUps(kind:PageKind){
 const more=kind==='question'?['Bana bir ipucu daha ver','Bunu başka türlü anlatır mısın?']:kind==='lesson'?['Bana bir örnek verir misin?','Bunu başka türlü anlatır mısın?']:kind==='game'?['Bana bir ipucu ver']:[];
 return [...more,...starters].slice(0,4);
}

/** Ekranda görünmeyen ama sayfada duran metin (örn. kapalı hafıza kartlarının yüzü) data-piko-gizli ile işaretlenir. */
function visibleText(el:Element):string{
 if(el.tagName==='FOOTER'||el.hasAttribute('data-piko-gizli'))return '';
 if(!el.querySelector('[data-piko-gizli]'))return (el as HTMLElement).innerText??'';
 return [...el.childNodes].map(n=>n.nodeType===Node.TEXT_NODE?n.textContent??'':n instanceof Element?visibleText(n):'').join(' ');
}
/**
 * Ekrandaki sayfanın görünen metni (#main, alt bilgi hariç). Piko sayfayı buna bakarak tanıtır ve soruları cevaplar.
 * Ebeveyn Alanı gönderilmez: orada çocuğun ilerleme bilgileri yazar.
 */
export function pageContext(){
 if(pageKind()==='parents')return '';
 const main=document.getElementById('main');if(!main)return '';
 return [...main.children].map(visibleText).join(' ').replace(/\s+/g,' ').trim().slice(0,MAX_PAGE_TEXT);
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

/**
 * Son mesajlar, ekrandaki sayfanın metni ve açık sorunun öğretmen notları gönderilir (sunucu en fazla 12 mesaj kullanır);
 * hazır yerel cümleler atlanır. Sayfa ve notlar her mesajda yeniden okunur: geniş ekranda sohbet açıkken soru değişebilir.
 */
export async function askPiko(lines:PikoLine[],signal?:AbortSignal):Promise<{reply:string;local:boolean}|{error:PikoError}>{
 const messages=lines.filter(l=>!l.local).slice(-12).map(({role,text})=>({role,text}));
 const page=pageContext(),help=page?currentHelp:null;
 const body={messages,...page&&{page},...help&&{help:{hints:help.hints.slice(0,4).map(h=>h.slice(0,300)),...help.solution&&{solution:help.solution.slice(0,600)},...help.question&&{question:help.question.slice(0,300)}}}};
 help?.onUse?.();
 const result=await post(body,signal);
 if(typeof result==='string')return {error:result};
 const reply=result.data.reply;
 // Servis çalışmadığında ya da günlük sınır dolunca gelen hazır cümle sohbet geçmişine girmez.
 return typeof reply==='string'&&reply?{reply,local:result.status!==200||result.data.limit===true}:{error:'ag'};
}
