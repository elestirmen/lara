'use client';
import {useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import {Art} from './Illustration';
import {stopSpeech} from '@/lib/audio';
import {PIKO_OPEN} from '@/lib/piko';
const PikoChat=dynamic(()=>import('./PikoChat'),{ssr:false,loading:()=>null});
/**
 * Piko sohbeti. page: köşede Piko durur, dokununca sohbet açılır. lesson: köşedeki Piko etkinliğin üstüne binmesin diye
 * gizlenir; sohbeti ders ekranındaki “Piko’ya sor” düğmesi açar (PIKO_OPEN olayı). off: oyunlarda Piko yoktur.
 */
export default function PikoBuddy({sound,mode}:{sound:boolean;mode:'page'|'lesson'|'off'}){
 const [open,setOpen]=useState(false),button=useRef<HTMLButtonElement>(null),opener=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(mode==='off')setOpen(false)},[mode]);
 useEffect(()=>{
  if(mode==='off')return;
  const show=()=>{opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;stopSpeech();setOpen(true)};
  window.addEventListener(PIKO_OPEN,show);return()=>window.removeEventListener(PIKO_OPEN,show);
 },[mode]);
 function tap(){opener.current=null;stopSpeech();setOpen(true)}
 /** Kapanınca odak sohbeti açan düğmeye döner (köşedeki Piko kapanışta yeniden çizildiği için ona ref üzerinden ulaşılır). */
 function close(){setOpen(false);stopSpeech();const back=opener.current;requestAnimationFrame(()=>(back?.isConnected?back:button.current)?.focus())}
 if(mode==='off')return null;
 return <>
  {!open&&mode==='page'&&<div className="piko-buddy">
   <button ref={button} type="button" className="piko-buddy-button" aria-label="Piko ile konuş" onClick={tap}>
    <Art name="piko-wave" size={92} className="pose-wave" eager/>
   </button>
  </div>}
  {open&&<PikoChat sound={sound} onClose={close}/>}
 </>;
}
