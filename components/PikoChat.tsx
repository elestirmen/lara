'use client';
import {useEffect,useRef,useState} from 'react';
import {Mic,Send,Square,X} from 'lucide-react';
import {Art} from './Illustration';
import {askPiko,errorText,followUps,introAsks,MAX_CHILD_TEXT,pageContext,pageKind,starters,type PikoLine} from '@/lib/piko';
import {speak,stopSpeech} from '@/lib/audio';
import {profile} from '@/content/profile';

/** Tarayıcının konuşma tanıma arayüzü (Chrome/Edge'de webkit önekli, Safari'de her ikisi). Firefox'ta yoktur; o zaman yalnızca yazılır. */
type RecognitionResult={isFinal:boolean;0:{transcript:string}};
type Recognition={lang:string;interimResults:boolean;continuous:boolean;maxAlternatives:number;start():void;stop():void;abort():void;
 onresult:((e:{resultIndex:number;results:ArrayLike<RecognitionResult>})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null};
const recognitionClass=()=>{if(typeof window==='undefined')return undefined;const w=window as unknown as Record<string,unknown>;return (w.SpeechRecognition??w.webkitSpeechRecognition) as (new()=>Recognition)|undefined};
const micError=(code:string)=>code==='not-allowed'||code==='service-not-allowed'?'Mikrofon izni yok. Bir büyüğün tarayıcı ayarlarından izin verebilir; yazarak da sorabilirsin.':code==='no-speech'?'Seni duyamadım. Mikrofona biraz daha yakın konuşur musun?':'Sesini anlayamadım. Bir daha dener misin? Yazarak da sorabilirsin.';

/**
 * Sohbet penceresi. Ebeveyn Alanı dışında Piko açılır açılmaz ekrandaki sayfayı kendiliğinden tanıtır: sayfaya göre seçilen
 * soru (introAsks) gizli bir çocuk mesajı olarak gönderilir, selam o sırada önceden seslendirilmiş olduğu için hemen duyulur.
 */
export default function PikoChat({sound,onClose}:{sound:boolean;onClose:()=>void}){
 const [kind]=useState(pageKind),[intro]=useState(()=>kind!=='parents'&&!!pageContext());
 const greeting=intro?`Merhaba ${profile.name}!`:`Merhaba ${profile.name}! Ben Piko. Bana ne sormak istersin?`;
 const [lines,setLines]=useState<PikoLine[]>([{role:'assistant',text:greeting,local:true}]),[text,setText]=useState(''),[busy,setBusy]=useState(false),[listening,setListening]=useState(false),[note,setNote]=useState('');
 const linesRef=useRef(lines),busyRef=useRef(false),log=useRef<HTMLDivElement>(null),panel=useRef<HTMLDivElement>(null),recognition=useRef<Recognition|null>(null),request=useRef<AbortController|null>(null);
 const canListen=!!recognitionClass();
 /** Tanıtımdan sonra sayfaya göre devam soruları, Ebeveyn Alanı’nda eğlenceli hazır sorular gösterilir. */
 const [ideas]=useState(()=>intro?followUps(kind):starters);
 useEffect(()=>{linesRef.current=lines;log.current?.scrollTo({top:log.current.scrollHeight,behavior:'smooth'})},[lines,busy]);
 useEffect(()=>{panel.current?.focus();if(sound)speak(greeting);
  if(intro&&kind!=='parents')void send(introAsks[kind],true);
  return()=>{recognition.current?.abort();request.current?.abort();busyRef.current=false}
 },[]);
 /** Escape her zaman kapatır: hazır soruya dokununca o düğme kaybolur ve odak pencerenin dışına düşebilir. */
 const closeRef=useRef(onClose);closeRef.current=onClose;
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')closeRef.current()};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[]);

 /** hidden: sayfa tanıtımını başlatan soru; ekranda görünmez, selamın sesi kesilmez. Sohbet selamla yeniden kurulur (React geliştirme modunda açılış iki kez çalışır). */
 async function send(raw:string,hidden=false){
  const message=raw.replace(/\s+/g,' ').trim().slice(0,MAX_CHILD_TEXT);
  if(!message||busyRef.current)return;
  if(!hidden){stopSpeech();setText('')}
  setNote('');
  const next:PikoLine[]=[...hidden?linesRef.current.slice(0,1):linesRef.current,{role:'user',text:message,hidden}];
  linesRef.current=next;setLines(next);busyRef.current=true;setBusy(true);
  const controller=new AbortController();request.current=controller;
  const result=await askPiko(next,controller.signal);
  if(controller.signal.aborted)return;
  busyRef.current=false;setBusy(false);
  if('error' in result){setNote(errorText[result.error]);return}
  setLines(l=>[...l,{role:'assistant',text:result.reply,local:result.local}]);
  if(sound)speak(result.reply);
 }

 /** Mikrofon: bir dokunuşla dinlemeye başlar, çocuk susunca söylenen cümle kendiliğinden gönderilir. Piko konuşuyorsa susturulur ki kendi sesini duymasın. */
 function listen(){
  if(listening){recognition.current?.stop();return}
  const Recognition=recognitionClass();if(!Recognition||busyRef.current)return;
  stopSpeech();setNote('');
  const r=new Recognition();r.lang='tr-TR';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
  let heard='';
  r.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const part=e.results[i][0].transcript;if(e.results[i].isFinal)heard+=part;else interim+=part}setText(`${heard}${interim}`.trim())};
  r.onerror=e=>{if(e.error!=='aborted')setNote(micError(e.error))};
  r.onend=()=>{recognition.current=null;setListening(false);if(heard.trim())void send(heard)};
  recognition.current=r;setListening(true);
  try{r.start()}catch{recognition.current=null;setListening(false);setNote(micError(''))}
 }

 const asked=lines.some(l=>l.role==='user'&&!l.hidden),looking=busy&&!asked;
 return <div ref={panel} className="piko-chat" role="dialog" aria-labelledby="piko-chat-title" tabIndex={-1}>
  <header>
   <span className={`piko-chat-face${busy?' thinking':''}`}><Art name="piko-talk" size={52} className="pose-talk" eager/><Art name="piko-think" size={52} className="pose-think" eager/></span>
   <div><h2 id="piko-chat-title">Piko ile sohbet</h2><small>{looking&&intro?'Piko sayfaya bakıyor…':busy?'Piko düşünüyor…':listening?'Piko seni dinliyor…':'Sor, konuş, birlikte keşfedelim!'}</small></div>
   <button type="button" className="icon-button" aria-label="Sohbeti kapat" onClick={onClose}><X size={22}/></button>
  </header>
  <div className="piko-log" ref={log} aria-live="polite">
   {lines.map((l,i)=>!l.hidden&&<p key={i} className={`piko-msg ${l.role==='user'?'child':'piko'}`}><span className="sr-only">{l.role==='user'?'Sen: ':'Piko: '}</span>{l.text}</p>)}
   {busy&&<p className="piko-msg piko typing"><span className="sr-only">Piko düşünüyor</span><i/><i/><i/></p>}
   {!asked&&!busy&&<div className="piko-starters">{ideas.map(s=><button type="button" key={s} onClick={()=>{panel.current?.focus();void send(s)}}>{s}</button>)}</div>}
  </div>
  {note&&<p className="piko-note" role="alert">{note}</p>}
  <form className="piko-input" onSubmit={e=>{e.preventDefault();void send(text)}}>
   {canListen&&<button type="button" className={`piko-mic${listening?' listening':''}`} aria-label={listening?'Dinlemeyi bitir':'Konuşarak sor'} aria-pressed={listening} onClick={listen} disabled={busy}>{listening?<Square size={20} fill="currentColor"/>:<Mic size={24}/>}</button>}
   <input aria-label="Piko’ya mesajın" placeholder={canListen?'Yaz ya da mikrofona dokun':'Piko’ya bir şey yaz'} value={text} maxLength={MAX_CHILD_TEXT} onChange={e=>setText(e.target.value)} autoComplete="off" enterKeyHint="send"/>
   <button type="submit" className="piko-send" aria-label="Gönder" disabled={busy||!text.trim()}><Send size={20}/></button>
  </form>
  <p className="piko-fine">Piko bir yapay zekâdır, bazen yanılabilir.</p>
 </div>;
}
