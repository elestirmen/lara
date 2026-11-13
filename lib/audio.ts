let context:AudioContext|undefined;const organs=new WeakMap<BaseAudioContext,PeriodicWave>(),noises=new WeakMap<BaseAudioContext,AudioBuffer>();
/** Geri bildirim sesleri cihazda sentezlenir, dosya indirilmez. Nota: [Hz, başlangıç sn, süre sn, kayarak varılan Hz]. Yanlış sesi yumuşaktır; çocuğu korkutmaz. */
type Note=[number,number,number,number?];
const effects={
 correct:{wave:'triangle',gain:.28,notes:[[784,0,.16],[1047,.08,.16],[1319,.16,.45]]},
 wrong:{wave:'triangle',gain:.2,notes:[[392,0,.16],[330,.15,.32]]},
 reveal:{wave:'sine',gain:.24,notes:[[659,0,.3],[523,.2,.5]]},
 finish:{wave:'triangle',gain:.14,notes:[[523,0,.16],[659,.12,.16],[784,.24,.16],[1047,.36,.8],[784,.36,.8],[659,.36,.8]]},
 place:{wave:'sine',gain:.12,notes:[[520,0,.08,860]]},
 remove:{wave:'sine',gain:.1,notes:[[680,0,.09,400]]},
 hop:{wave:'sine',gain:.12,notes:[[320,0,.17,760]]},
 coin:{wave:'triangle',gain:.09,notes:[[1568,0,.07],[2093,.06,.32]]},
 tick:{wave:'triangle',gain:.1,notes:[[1480,0,.035]]}
} satisfies Record<string,{wave:OscillatorType;gain:number;notes:Note[]}>;
/** Gürültü patlamaları: [bant merkezi Hz, Q, kazanç, süre sn]. */
const bursts={clap:[1100,.9,.8,.13],burst:[900,.5,.6,.1]} satisfies Record<string,[number,number,number,number]>;
export type Sound=keyof typeof effects|keyof typeof bursts;
function live(){context??=new AudioContext();if(context.state!=='running')context.resume().catch(()=>{});return context}
function organ(c:BaseAudioContext){let wave=organs.get(c);if(!wave){wave=c.createPeriodicWave(new Float32Array(6),new Float32Array([0,1,.45,.22,.1,.05]));organs.set(c,wave)}return wave}
function voice(c:BaseAudioContext,wave:OscillatorType|'organ',hz:number,start:number,duration:number,peak:number,to?:number,hold=0){const o=c.createOscillator(),g=c.createGain();if(wave==='organ')o.setPeriodicWave(organ(c));else o.type=wave;o.frequency.setValueAtTime(hz,start);if(to)o.frequency.exponentialRampToValueAtTime(to,start+duration);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(peak,start+.008);if(hold)g.gain.setValueAtTime(peak,start+hold);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(c.destination);o.start(start);o.stop(start+duration+.02)}
/** Sesi verilen ses bağlamına planlar; testler aynı sesi OfflineAudioContext ile ölçer. */
export function render(c:BaseAudioContext,name:Sound,t=c.currentTime+.01){
 if(name in bursts){const [hz,q,gain,duration]=bursts[name as keyof typeof bursts],source=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();let noise=noises.get(c);if(!noise){noise=c.createBuffer(1,Math.round(c.sampleRate*.3),c.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;noises.set(c,noise)}source.buffer=noise;filter.type='bandpass';filter.frequency.value=hz;filter.Q.value=q;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);source.connect(filter);filter.connect(g);g.connect(c.destination);source.start(t);source.stop(t+duration+.02);return}
 const {wave,gain,notes}=effects[name as keyof typeof effects];for(const [hz,at,duration,to] of notes as Note[])voice(c,wave,hz,t+at,duration,gain,to);
}
export function sfx(enabled:boolean,name:Sound){if(!enabled)return;try{render(live(),name)}catch{}}
/** Etkinlik içeriğindeki sesler (ince/kalın, tempo). Harmonikli dalga küçük telefon hoparlöründe kalın sesi de duyulur kılar; iki ses aynı güçtedir. */
export function tone(enabled:boolean,hz=660,duration=.13){if(!enabled)return;try{const c=live();voice(c,'organ',hz,c.currentTime+.01,duration,.12,undefined,duration*.55)}catch{}}
/** Seslendirme cihazın konuşma motoruyla yapılır. Aynı dilde birden çok ses varsa en doğal olanı seçilir: sinirsel/“Natural” sesler (Edge), Google sesleri, Apple’ın geliştirilmiş sesleri; en sona eski robotik sesler kalır. İnternet yokken yalnız cihazdaki sesler kullanılır. */
type VoiceLike={name:string;lang:string;localService:boolean};
const voiceScore=(v:VoiceLike)=>(/natural|neural/i.test(v.name)?100:0)+(/google/i.test(v.name)?60:0)+(/premium|enhanced|geliştirilmiş|siri/i.test(v.name)?50:0)+(/emel|yelda|seda/i.test(v.name)?10:0)+(v.localService?5:0)-(/tolga|espeak|pico/i.test(v.name)?30:0);
export function bestVoice<T extends VoiceLike>(voices:readonly T[],lang:string,online=true):T|undefined{return voices.filter(v=>v.lang.replace('_','-').toLowerCase().startsWith(lang.slice(0,2).toLowerCase())&&(online||v.localService)).sort((a,b)=>voiceScore(b)-voiceScore(a))[0]}
/** Uzun metin cümle cümle okunur: araya doğal duraklar girer ve bazı tarayıcıların uzun okumayı yarıda kesmesi önlenir. */
export const speechParts=(text:string)=>text.split(/(?<=[.!?…”])\s+(?=[\p{Lu}“\d])/u).map(x=>x.trim()).filter(Boolean);
let retried=false;
/** Cihazın kendi konuşma motoruyla okur (sunucu sesi yokken ya da İngilizce kelimelerde). */
function speakDevice(text:string,lang:string):boolean{if(!('speechSynthesis'in window))return false;const voices=speechSynthesis.getVoices();
 /** Chrome sesleri sonradan yükler: liste boşsa bir kez “sesler hazır” olayı beklenir. */
 if(!voices.length&&!retried){retried=true;speechSynthesis.addEventListener('voiceschanged',()=>{speakDevice(text,lang)},{once:true});return true}
 const voice=bestVoice(voices,lang,navigator.onLine);if(!voice)return false;speechSynthesis.cancel();const natural=voiceScore(voice)>=50;
 for(const part of speechParts(text)){const u=new SpeechSynthesisUtterance(part);u.voice=voice;u.lang=voice.lang;u.rate=natural?.95:.9;u.pitch=natural?1:1.05;speechSynthesis.speak(u)}return true}
/** Sunucu sesi: Türkçe metin cümle cümle /ses adresinden (tts/server.py, sinirsel ses) çalınır; her cihazda aynı doğal ses duyulur.
 * Tek bir ses öğesi kullanılır (iOS, kullanıcı dokunuşuyla başlayan öğenin sıradaki cümleyi çalmasına izin verir); sıradaki cümle önceden istenir.
 * İnternet yoksa ya da servis yanıt vermezse kalan metin cihazın sesiyle okunur ve bir dakika boyunca sunucu yeniden denenmez. */
const SERVER_VOICE_VERSION=2;
let player:HTMLAudioElement|undefined,turn=0,serverDownUntil=0;
/** Seslendirme durumu: ses istenip henüz çalmaya başlamadıysa “loading”. Düğmeler bekleme göstergesi için dinler. */
export type SpeechState='idle'|'loading'|'playing';
const listeners=new Set<(state:SpeechState)=>void>();let speechState:SpeechState='idle';
const emit=(state:SpeechState)=>{if(state===speechState)return;speechState=state;listeners.forEach(l=>l(state))};
export function onSpeechState(listener:(state:SpeechState)=>void){listeners.add(listener);return ()=>{listeners.delete(listener)}}
/** Ön hazırlık: metin ekrana gelince sesi sunucuda arka planda üretilir; çocuk hoparlöre bastığında ses hazır olur. Ses indirilmez. Otomatik testler (navigator.webdriver) ses ürettirmez. */
export function prepareSpeech(text:string,lang='tr-TR'){if(typeof window==='undefined'||lang!=='tr-TR'||!navigator.onLine||Date.now()<serverDownUntil||process.env.NODE_ENV!=='production'||navigator.webdriver)return;for(const part of serverParts(text))fetch(`${voiceUrl(part)}&p=1`).catch(()=>{})}
export const voiceUrl=(part:string)=>`/ses?v=${SERVER_VOICE_VERSION}&t=${encodeURIComponent(part)}`;
/** Sunucunun bir istekte kabul ettiği en uzun metin 400 karakterdir; daha uzun cümle virgüllerden bölünür. */
export function serverParts(text:string){return speechParts(text).filter(part=>/[\p{L}\d]/u.test(part)).flatMap(part=>{if(part.length<=380)return [part];const pieces:string[]=[];let current='';for(const piece of part.split(/(?<=[,;:])\s+/)){if(current&&(current+' '+piece).length>380){pieces.push(current);current=piece}else current=current?`${current} ${piece}`:piece}if(current)pieces.push(current);return pieces.flatMap(x=>x.length<=380?[x]:x.match(/.{1,380}(\s|$)/g)!.map(y=>y.trim()))})}
function speakServer(text:string,lang:string){const mine=++turn,parts=serverParts(text);if(!parts.length)return;player??=new Audio();const audio=player;if('speechSynthesis'in window)speechSynthesis.cancel();
 const fallback=(from:number)=>{if(mine!==turn)return;serverDownUntil=Date.now()+60000;audio.onended=audio.onerror=audio.onplaying=null;emit('idle');speakDevice(parts.slice(from).join(' '),lang)};
 const play=(i:number)=>{if(mine!==turn)return;if(i>=parts.length){audio.onended=audio.onerror=audio.onplaying=null;emit('idle');return}audio.onended=()=>play(i+1);audio.onerror=()=>fallback(i);audio.onplaying=()=>{if(mine===turn)emit('playing')};emit('loading');audio.src=voiceUrl(parts[i]);audio.play().catch(()=>fallback(i));if(parts[i+1])fetch(voiceUrl(parts[i+1])).catch(()=>{})};
 play(0)}
export function speak(text:string,lang='tr-TR'):boolean{if(typeof window==='undefined')return false;if(lang==='tr-TR'&&navigator.onLine&&Date.now()>=serverDownUntil&&typeof Audio!=='undefined'){speakServer(text,lang);return true}turn++;player?.pause();emit('idle');return speakDevice(text,lang)}
export function stopSpeech(){turn++;emit('idle');if(player){player.onended=player.onerror=player.onplaying=null;player.pause()}if(typeof window!=='undefined'&&'speechSynthesis'in window)speechSynthesis.cancel()}
