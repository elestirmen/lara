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
export function speak(text:string,lang='tr-TR'):boolean{if(!('speechSynthesis'in window))return false;const voices=speechSynthesis.getVoices();const voice=voices.find(v=>v.lang.startsWith(lang.slice(0,2))&&v.localService);if(!voice)return false;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=lang;u.rate=.85;speechSynthesis.speak(u);return true}
export function stopSpeech(){if(typeof window!=='undefined'&&'speechSynthesis'in window)speechSynthesis.cancel()}
