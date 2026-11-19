'use client';
import {useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import {Art} from './Illustration';
import {buddyLines,readPikoCode} from '@/lib/piko';
import {speak,stopSpeech} from '@/lib/audio';
const PikoChat=dynamic(()=>import('./PikoChat'),{ssr:false,loading:()=>null});
/**
 * Sayfanın köşesindeki Piko. Dokununca zıplar; aile kodu girilmiş cihazda sohbet penceresini açar,
 * diğer cihazlarda sırayla kısa, hazır bir cümle söyler. Ders ve oyun ekranlarında etkinliğin üstüne binmesin diye gizlenir.
 */
export default function PikoBuddy({sound,hidden,route}:{sound:boolean;hidden:boolean;route:string}){
 const [bubble,setBubble]=useState(''),[open,setOpen]=useState(false),[hop,setHop]=useState(false),button=useRef<HTMLButtonElement>(null),next=useRef(0),timer=useRef(0);
 useEffect(()=>{if(hidden)setOpen(false)},[hidden]);
 useEffect(()=>{setBubble('');window.clearTimeout(timer.current)},[route,hidden]);
 useEffect(()=>()=>window.clearTimeout(timer.current),[]);
 function tap(){
  setHop(true);window.clearTimeout(timer.current);
  if(readPikoCode()){setBubble('');stopSpeech();setOpen(true);return}
  const line=buddyLines[next.current++%buddyLines.length];setBubble(line);if(sound)speak(line);
  timer.current=window.setTimeout(()=>setBubble(''),7000);
 }
 function close(){setOpen(false);stopSpeech();requestAnimationFrame(()=>button.current?.focus())}
 if(hidden)return null;
 return <>
  {!open&&<div className="piko-buddy">
   <p className="piko-bubble" role="status">{bubble}</p>
   <button ref={button} type="button" className={`piko-buddy-button${hop?' hop':''}${bubble?' talking':''}`} aria-label="Piko ile konuş" onClick={tap} onAnimationEnd={e=>{if(e.animationName==='piko-hop')setHop(false)}}>
    <Art name="piko-wave" size={92} className="pose-wave" eager/><Art name="piko-talk" size={92} className="pose-talk" eager/>
   </button>
  </div>}
  {open&&<PikoChat sound={sound} onClose={close}/>}
 </>;
}
