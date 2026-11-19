import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
/** Piko sohbeti. /piko servisi taklit edilir: testler gerçek yapay zekâ hizmetine istek göndermez. */
type Body={code:string;check?:boolean;messages?:{role:string;text:string}[]};
const CODE_KEY='lara-piko-kod-v1';
async function openParents(page:Page){await page.goto('/#parents');await page.getByLabel('Yeni PIN',{exact:true}).fill('4826');await page.getByLabel('PIN’i tekrar girin').fill('4826');await page.getByRole('button',{name:'PIN oluştur ve aç'}).click()}

test('köşedeki Piko kod yokken hazır cümle söyler, ders ekranında gizlenir',async({page})=>{
 await page.goto('/');
 const piko=page.getByRole('button',{name:'Piko ile konuş'});
 await expect(piko).toBeVisible();
 await piko.click();
 await expect(page.locator('.piko-bubble')).toHaveText('Merhaba! Ben Piko. Bugün hangi adayı keşfedelim?');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await piko.click();
 await expect(page.locator('.piko-bubble')).toHaveText('Gıdıklanıyorum! Hi hi hi!');
 await page.goto('/#lesson/math-blocks');await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await expect(piko).toHaveCount(0);
 await page.goto('/#subjects');await expect(piko).toBeVisible();
});

test('aile kodu Ebeveyn Alanı’nda doğrulanır, sohbet açılır ve cevap verir',async({page})=>{
 const bodies:Body[]=[];
 await page.route('**/piko',async route=>{const body=route.request().postDataJSON() as Body;bodies.push(body);
  if(body.check)return route.fulfill({status:body.code==='test-kodu'?200:403,json:body.code==='test-kodu'?{ok:true}:{error:'kod'}});
  await route.fulfill({json:{reply:`Cevabım: ${body.messages!.at(-1)!.text}`}})});
 await openParents(page);
 await page.getByRole('button',{name:'Piko sohbeti',exact:true}).click();
 await expect(page.locator('.piko-state')).toContainText('Kapalı');
 await page.getByLabel('Aile kodu').fill('yanlis-kod');await page.getByRole('button',{name:'Bu cihazda aç'}).click();
 await expect(page.getByText('Bu aile kodu eşleşmedi')).toBeVisible();
 await page.getByLabel('Aile kodu').fill(' Test-Kodu ');await page.getByRole('button',{name:'Bu cihazda aç'}).click();
 await expect(page.getByText('Piko sohbeti bu cihazda açıldı')).toBeVisible();
 await expect(page.locator('.piko-state')).toContainText('Açık');
 expect(await page.evaluate(k=>localStorage.getItem(k),CODE_KEY)).toBe('test-kodu');

 await page.goto('/#home');
 const piko=page.getByRole('button',{name:'Piko ile konuş'});
 await piko.click();
 const chat=page.getByRole('dialog',{name:'Piko ile sohbet'});
 await expect(chat).toContainText('Merhaba Lara! Ben Piko.');
 await chat.getByRole('button',{name:'Bana bir bilmece sor'}).click();
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Cevabım: Bana bir bilmece sor');
 await expect(chat.getByRole('button',{name:'Bana bir bilmece sor'})).toHaveCount(0);
 const input=chat.getByLabel('Piko’ya mesajın');
 await input.fill('Kaç bacağın var?');await input.press('Enter');
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Cevabım: Kaç bacağın var?');
 // Selam yalnızca ekranda kalır; sunucuya çocuk ve Piko sırayla gider.
 const last=bodies.at(-1)!;
 expect(last.code).toBe('test-kodu');
 expect(last.messages!.map(m=>m.role)).toEqual(['user','assistant','user']);
 const result=await new AxeBuilder({page}).include('.piko-chat').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 await page.screenshot({path:'artifacts/piko-chat.png'});
 await input.press('Escape');
 await expect(chat).toHaveCount(0);
 await expect(piko).toBeFocused();
});

test('mikrofonla sorulan soru yazıya dönüşüp gönderilir',async({page})=>{
 await page.addInitScript(key=>{
  localStorage.setItem(key,'test-kodu');
  type Handler=((e:unknown)=>void)|null;
  class FakeRecognition{lang='';interimResults=false;continuous=false;maxAlternatives=1;onresult:Handler=null;onerror:Handler=null;onend:(()=>void)|null=null;
   start(){(window as unknown as {heardLang:string}).heardLang=this.lang;
    setTimeout(()=>{this.onresult?.({resultIndex:0,results:[Object.assign([{transcript:'Merhaba'}],{isFinal:false})]});
     setTimeout(()=>{this.onresult?.({resultIndex:0,results:[Object.assign([{transcript:'Merhaba Piko nasılsın'}],{isFinal:true})]});this.onend?.()},150)},150)}
   stop(){}abort(){}
  }
  const w=window as unknown as Record<string,unknown>;w.SpeechRecognition=w.webkitSpeechRecognition=FakeRecognition;
 },CODE_KEY);
 const bodies:Body[]=[];
 await page.route('**/piko',async route=>{bodies.push(route.request().postDataJSON() as Body);await route.fulfill({json:{reply:'Çok iyiyim, teşekkürler!'}})});
 await page.goto('/');
 await page.getByRole('button',{name:'Piko ile konuş'}).click();
 const chat=page.getByRole('dialog',{name:'Piko ile sohbet'});
 await chat.getByRole('button',{name:'Konuşarak sor'}).click();
 await expect(chat.locator('.piko-msg.child')).toHaveText('Sen: Merhaba Piko nasılsın');
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Çok iyiyim, teşekkürler!');
 expect(await page.evaluate(()=>(window as unknown as {heardLang:string}).heardLang)).toBe('tr-TR');
 expect(bodies[0].messages).toEqual([{role:'user',text:'Merhaba Piko nasılsın'}]);
});

test('servis hatalarında çocuğa anlaşılır bir not gösterir',async({page})=>{
 await page.addInitScript(key=>localStorage.setItem(key,'eski-kod'),CODE_KEY);
 let status=429;
 await page.route('**/piko',route=>route.fulfill({status,json:{error:'x'}}));
 await page.goto('/');
 await page.getByRole('button',{name:'Piko ile konuş'}).click();
 const chat=page.getByRole('dialog',{name:'Piko ile sohbet'}),input=chat.getByLabel('Piko’ya mesajın');
 await input.fill('merhaba');await input.press('Enter');
 await expect(chat.getByRole('alert')).toContainText('Çok hızlı konuştuk');
 status=403;await input.fill('merhaba');await input.press('Enter');
 await expect(chat.getByRole('alert')).toContainText('Piko bu cihazda kapalı');
});

test('telefonda Piko alt menünün üstünde durur, sohbet tüm ekranı kaplar',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(key=>localStorage.setItem(key,'test-kodu'),CODE_KEY);
 await page.goto('/');
 const piko=page.getByRole('button',{name:'Piko ile konuş'}),nav=page.getByRole('navigation',{name:'Mobil gezinti'});
 const [p,n]=[await piko.boundingBox(),await nav.boundingBox()];
 expect(p!.y+p!.height).toBeLessThanOrEqual(n!.y);
 await piko.click();
 const dialog=page.getByRole('dialog',{name:'Piko ile sohbet'});
 await expect.poll(async()=>(await dialog.boundingBox())!.width).toBe(390);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/piko-chat-390.png'});
});
