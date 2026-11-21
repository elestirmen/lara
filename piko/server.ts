/**
 * Piko sohbet servisi (lara-piko). lara-dersleri nginx'i POST /piko isteklerini buraya yönlendirir.
 * API anahtarı yalnızca bu konteynerde durur (ANTHROPIC_API_KEY); tarayıcıya hiç gitmez. Sohbet herkese açıktır;
 * harcamayı nginx'in dakika sınırı ve buradaki günlük cevap sınırı tutar.
 * Sohbetler kaydedilmez: günlüğe yalnızca durum kodu ve token sayıları yazılır.
 */
import {createServer,type IncomingMessage,type ServerResponse} from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import {LINES,MODEL,REVEAL_WARNING,WARM,cleanReply,introKey,parseRequest,revealsAnswer,startsWithOpener,systemBlocks,type Help} from './kurallar.ts';

const PORT=Number(process.env.PORT??8091);
/** Günlük cevap sınırı (Türkiye saatiyle gece yarısı sıfırlanır). */
const DAILY=Number(process.env.PIKO_GUNLUK??300);
/**
 * Düşünme düzeyi. low varsayılan: cevap 1–2 saniyede gelir. Hesap ve doğru cevap öğretmen ve hesap notlarından geldiği
 * için yeterlidir (notlar yokken low, çocuğun doğru cevabını tanıyamamıştı). medium tanıtımda 4–6 saniye sürdü.
 * Cevabı ele veren taslak bir kez, uyarıyla yeniden yazdırılır.
 */
const EFFORT=(['low','medium','high'] as const).find(x=>x===process.env.PIKO_EFOR)??'low';
/** Ses servisi (lara-ses); açılış cümleleri buradan önceden seslendirilir. */
const SES=process.env.PIKO_SES??'http://lara-ses:8090';
const client=process.env.ANTHROPIC_API_KEY?new Anthropic({maxRetries:1,timeout:25_000}):undefined;
let day='',used=0;
/** Piko'ya dokununca gelen sayfa tanıtımları (introKey): aynı sayfa için model yeniden çağrılmaz. Gün değişince boşalır. */
const intros=new Map<string,string>(),MAX_INTROS=300;

const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Istanbul'});
const log=(text:string)=>console.log(`${new Date().toISOString()} ${text}`);
function send(res:ServerResponse,status:number,body:object){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
 res.end(JSON.stringify(body));
}
function readBody(req:IncomingMessage,limit=32_768):Promise<string|undefined>{
 return new Promise((resolve,reject)=>{
  let size=0;const chunks:Buffer[]=[];
  req.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>limit){resolve(undefined);req.destroy();return}chunks.push(chunk)});
  req.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error',reject);
 });
}

async function chat(res:ServerResponse,messages:Anthropic.MessageParam[],page?:string,help?:Help,key?:string){
 if(day!==today()){day=today();used=0;intros.clear()}
 const cached=key&&intros.get(key);
 if(cached){log(`200 tanıtım önbellekten sayfa=${page?.length??0}`);return send(res,200,{reply:cached})}
 if(!client){log('503 anahtar yok');return send(res,503,{reply:LINES.tired})}
 if(used>=DAILY){log('200 günlük sınır doldu');return send(res,200,{reply:LINES.limit,limit:true})}
 used++;
 const child=messages.flatMap(m=>m.role==='user'&&typeof m.content==='string'?[m.content]:[]);
 const ask=(effort:typeof EFFORT,warning='')=>client.messages.create({model:MODEL,max_tokens:2000,output_config:{effort},system:systemBlocks(page,help,child.at(-1)??'',warning),messages});
 const text=(response:Anthropic.Message)=>cleanReply(response.content.flatMap(block=>block.type==='text'?[block.text]:[]).join(' '));
 try{
  let response=await ask(EFFORT),reply=text(response),retry='';
  // Cevabı ele veren taslak bir kez, uyarıyla yeniden yazdırılır (yine ele verirse olduğu gibi gider; günlükte görünür).
  if(response.stop_reason!=='refusal'&&revealsAnswer(reply,help,child)){
   response=await ask(EFFORT,REVEAL_WARNING);reply=text(response);retry=revealsAnswer(reply,help,child)?' tekrar=cevap-yine':' tekrar=cevap';
  }
  const usage=`giriş=${response.usage.input_tokens} çıkış=${response.usage.output_tokens} bugün=${used}/${DAILY}`;
  if(response.stop_reason==='refusal'){log(`200 reddedildi (${response.stop_details?.category??'kategori yok'}) ${usage}`);return send(res,200,{reply:LINES.refusal})}
  log(`200 ${response.stop_reason} ${usage} sayfa=${page?page.length:0} not=${help?'var':'yok'}${key?' tanıtım':''}${retry} açılış=${startsWithOpener(reply)?'hazır':'yeni'}`);
  if(key&&response.stop_reason==='end_turn'){if(intros.size>=MAX_INTROS)intros.delete(intros.keys().next().value!);intros.set(key,reply)}
  return send(res,200,{reply});
 }catch(error){
  // Hata iletileri sohbet içeriği taşımaz; kullanım sınırı ve anahtar sorunları buradan anlaşılır.
  if(error instanceof Anthropic.AuthenticationError)log('503 API anahtarı geçersiz');
  else if(error instanceof Anthropic.RateLimitError)log('503 API hız sınırı');
  else if(error instanceof Anthropic.BadRequestError)log(`503 API isteği reddetti: ${error.message.slice(0,200)}`);
  else if(error instanceof Anthropic.APIError)log(`503 API hatası ${error.status??''}`);
  else log(`503 bağlantı hatası: ${error instanceof Error?error.name:'bilinmiyor'}`);
  return send(res,503,{reply:LINES.tired});
 }
}

const server=createServer(async(req,res)=>{
 try{
  if(req.method==='GET'&&req.url==='/saglik')return send(res,200,{ok:true,anahtar:!!client});
  if(req.url!=='/piko')return send(res,404,{error:'yok'});
  if(req.method!=='POST')return send(res,405,{error:'yontem'});
  const raw=await readBody(req);
  if(raw===undefined)return send(res,413,{error:'buyuk'});
  let parsed;
  try{parsed=parseRequest(JSON.parse(raw))}catch{return send(res,400,{error:'bicim'})}
  if('error' in parsed)return send(res,400,{error:parsed.error});
  return await chat(res,parsed.messages,parsed.page,parsed.help,introKey(parsed));
 }catch{
  if(!res.headersSent)send(res,500,{reply:LINES.tired});
 }
});
server.listen(PORT,()=>log(`Piko ${PORT} portunda; model ${MODEL} (${EFFORT}); anahtar ${client?'var':'YOK'}; günlük sınır ${DAILY}`));
/**
 * Açılış cümlelerini ve hazır cevapları ses servisine sırayla seslendirtir (önbellekte olanlar anında döner).
 * Ses servisi o sırada kapalıysa ya da meşgulse bir dakika sonra yeniden dener.
 */
async function warm(attempt=1){
 let ready=0;
 for(const text of WARM){
  try{const r=await fetch(`${SES}/ses?t=${encodeURIComponent(text)}`,{signal:AbortSignal.timeout(60_000)});await r.arrayBuffer();if(r.ok)ready++}catch{/* aşağıda sayılır */}
 }
 log(`ses hazırlığı ${ready}/${WARM.length}`);
 if(ready<WARM.length&&attempt<5)setTimeout(()=>void warm(attempt+1),60_000).unref();
}
void warm();
for(const signal of ['SIGTERM','SIGINT'] as const)process.on(signal,()=>server.close(()=>process.exit(0)));
