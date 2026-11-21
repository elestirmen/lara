import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
/** Piko sohbeti. /piko servisi taklit edilir: testler gerçek yapay zekâ hizmetine istek göndermez. */
async function openParents(page:Page){await page.goto('/#parents');await page.getByLabel('Yeni PIN',{exact:true}).fill('4826');await page.getByLabel('PIN’i tekrar girin').fill('4826');await page.getByRole('button',{name:'PIN oluştur ve aç'}).click()}

type Help={hints:string[];solution?:string;question?:string};
type Body={messages?:{role:string;text:string}[];page?:string;help?:Help};

test('köşedeki Piko’ya dokununca Piko sayfayı kendiliğinden tanıtır, sonra sohbet sürer',async({page})=>{
 const bodies:Body[]=[];
 await page.route('**/piko',async route=>{const body=route.request().postDataJSON() as Body;bodies.push(body);
  await route.fulfill({json:{reply:`Cevabım: ${body.messages!.at(-1)!.text}`}})});
 await page.goto('/');
 const piko=page.getByRole('button',{name:'Piko ile konuş'});
 await piko.click();
 const chat=page.getByRole('dialog',{name:'Piko ile sohbet'});
 // Tanıtım sorusu ekranda görünmez; Piko’nun cevabı selamın ardından gelir.
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Cevabım: Bu sayfada neler var?');
 await expect(chat.locator('.piko-msg.piko').first()).toHaveText('Piko: Merhaba Lara!');
 await expect(chat.locator('.piko-msg.child')).toHaveCount(0);
 expect(bodies).toHaveLength(1);
 expect(bodies[0].messages).toEqual([{role:'user',text:'Bu sayfada neler var?'}]);
 expect(bodies[0].page).toContain('Merhaba, ben Lara!');
 expect(bodies[0].page).not.toContain('Merakla öğren');
 expect(bodies[0].page!.length).toBeLessThanOrEqual(1500);
 expect(bodies[0].help).toBeUndefined();
 await expect(chat.locator('.piko-starters button').first()).toHaveText('Bana bir bilmece sor');
 await chat.getByRole('button',{name:'Bana bir bilmece sor'}).click();
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Cevabım: Bana bir bilmece sor');
 await expect(chat.locator('.piko-starters')).toHaveCount(0);
 const input=chat.getByLabel('Piko’ya mesajın');
 await input.fill('Kaç bacağın var?');await input.press('Enter');
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Cevabım: Kaç bacağın var?');
 // Selam yalnızca ekranda kalır; tanıtım sorusu ve cevabı geçmişte kalır, ekrandaki sayfanın metni her mesajla gider.
 const last=bodies.at(-1)!;
 expect(Object.keys(last).sort()).toEqual(['messages','page']);
 expect(last.messages!.map(m=>m.role)).toEqual(['user','assistant','user','assistant','user']);
 expect(last.messages![0].text).toBe('Bu sayfada neler var?');
 const result=await new AxeBuilder({page}).include('.piko-chat').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 await page.screenshot({path:'artifacts/piko-chat.png'});
 await input.press('Escape');
 await expect(chat).toHaveCount(0);
 await expect(piko).toBeFocused();
});

test('derste Piko küçülür; dokununca soruyu, ipuçlarını ve çözümü bilerek ne istendiğini anlatır',async({page})=>{
 const bodies:Body[]=[];
 await page.route('**/piko',async route=>{bodies.push(route.request().postDataJSON() as Body);await route.fulfill({json:{reply:'Hadi bakalım! Blokları say.'}})});
 await page.goto('/#lesson/math-blocks');await expect(page.getByRole('heading',{level:1})).toBeVisible();
 const piko=page.getByRole('button',{name:'Piko ile konuş'});
 await expect(piko).toBeVisible();
 expect((await piko.boundingBox())!.width).toBeLessThan(80);
 await expect(page.getByRole('button',{name:'Piko’ya sor'})).toHaveCount(0);
 // Öğren ekranında Piko konuyu anlatır; soru yoktur, not gitmez.
 await piko.click();
 const chat=page.getByRole('dialog',{name:'Piko ile sohbet'});
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Hadi bakalım! Blokları say.');
 expect(bodies[0].messages).toEqual([{role:'user',text:'Bu sayfada ne öğreniyorum?'}]);
 expect(bodies[0].help).toBeUndefined();
 await expect(chat.locator('.piko-starters button').first()).toHaveText('Bana bir örnek verir misin?');
 await page.keyboard.press('Escape');await expect(chat).toHaveCount(0);
 for(let i=0;i<8&&!(await page.locator('.question-instruction').count());i++)await page.getByRole('button',{name:/^(Devam|Birlikte yapalım)$/}).click();
 const question=(await page.locator('.question-instruction').innerText()).trim();
 await piko.click();
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Hadi bakalım! Blokları say.');
 const asked=bodies.at(-1)!;
 expect(asked.messages).toEqual([{role:'user',text:'Bu soruda ne yapmam gerekiyor?'}]);
 expect(asked.page).toContain(question);
 expect(asked.help!.hints.length).toBeGreaterThan(0);
 expect(asked.help!.solution).toContain('Doğru cevap:');
 expect(asked.help!.question).toBeTruthy();
 await expect(chat.locator('.piko-starters button').first()).toHaveText('Bana bir ipucu daha ver');
 await page.screenshot({path:'artifacts/piko-lesson.png'});
 await page.keyboard.press('Escape');
 await expect(chat).toHaveCount(0);
 await expect(piko).toBeFocused();
});

test('oyunlarda da Piko var: oyunu anlatır, kapalı kartları görmez, turun ipucunu bilir',async({page})=>{
 const bodies:Body[]=[];
 await page.route('**/piko',async route=>{bodies.push(route.request().postDataJSON() as Body);await route.fulfill({json:{reply:'Hadi bakalım! İki kart çevir.'}})});
 await page.goto('/#game/memory');
 const piko=page.getByRole('button',{name:'Piko ile konuş'}),chat=page.getByRole('dialog',{name:'Piko ile sohbet'});
 await expect(piko).toBeVisible();
 await expect(page.locator('.memory-card').first()).toBeVisible();
 // Kapalı kartların yüzündeki ve sayfanın başka yerinde geçmeyen yazılar.
 const faces=await page.evaluate(()=>{
  const all=[...document.querySelectorAll<HTMLElement>('.memory-face')].map(e=>e.innerText.trim()).filter(t=>t.length>2);
  const rest=[...document.querySelectorAll('#main > *:not(footer)')].map(e=>{const c=e.cloneNode(true) as Element;c.querySelectorAll('.memory-face').forEach(f=>f.remove());return c.textContent??''}).join(' ');
  return all.filter(f=>!rest.includes(f));
 });
 expect(faces.length).toBeGreaterThan(0);
 await piko.click();
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Hadi bakalım! İki kart çevir.');
 expect(bodies[0].messages).toEqual([{role:'user',text:'Bu oyun nasıl oynanır?'}]);
 expect(bodies[0].page).toContain('Eşini bul');
 for(const face of faces)expect(bodies[0].page).not.toContain(face);
 await page.keyboard.press('Escape');
 await page.goto('/#game/balloons');
 const prompt=(await page.locator('.balloon-prompt').innerText()).trim();
 await piko.click();
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Hadi bakalım! İki kart çevir.');
 expect(bodies.at(-1)!.page).toContain(prompt);
 expect(bodies.at(-1)!.help!.solution).toContain('Doğru balon:');
});

test('Ebeveyn Alanı Piko’yu anlatır, kod istemez; orada Piko sayfayı tanıtmaz, sayfa metni gitmez',async({page})=>{
 const bodies:Body[]=[];
 await page.route('**/piko',async route=>{bodies.push(route.request().postDataJSON() as Body);await route.fulfill({json:{reply:'Merhaba!'}})});
 await openParents(page);
 await page.getByRole('button',{name:'Piko sohbeti',exact:true}).click();
 await expect(page.getByText('ayar ya da kod gerekmez')).toBeVisible();
 await expect(page.getByText('Piko bir yapay zekâdır')).toBeVisible();
 await expect(page.getByLabel('Aile kodu')).toHaveCount(0);
 await page.getByRole('button',{name:'Piko ile konuş'}).click();
 const chat=page.getByRole('dialog',{name:'Piko ile sohbet'});
 await expect(chat).toContainText('Merhaba Lara! Ben Piko.');
 await expect(chat.locator('.piko-starters button').first()).toHaveText('Bana bir bilmece sor');
 expect(bodies).toHaveLength(0);
 await chat.getByRole('button',{name:'Bana bir bilmece sor'}).click();
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Merhaba!');
 expect(Object.keys(bodies[0])).toEqual(['messages']);
});

test('mikrofonla sorulan soru yazıya dönüşüp gönderilir',async({page})=>{
 await page.addInitScript(()=>{
  type Handler=((e:unknown)=>void)|null;
  class FakeRecognition{lang='';interimResults=false;continuous=false;maxAlternatives=1;onresult:Handler=null;onerror:Handler=null;onend:(()=>void)|null=null;
   start(){(window as unknown as {heardLang:string}).heardLang=this.lang;
    setTimeout(()=>{this.onresult?.({resultIndex:0,results:[Object.assign([{transcript:'Merhaba'}],{isFinal:false})]});
     setTimeout(()=>{this.onresult?.({resultIndex:0,results:[Object.assign([{transcript:'Merhaba Piko nasılsın'}],{isFinal:true})]});this.onend?.()},150)},150)}
   stop(){}abort(){}
  }
  const w=window as unknown as Record<string,unknown>;w.SpeechRecognition=w.webkitSpeechRecognition=FakeRecognition;
 });
 const bodies:Body[]=[];
 await page.route('**/piko',async route=>{bodies.push(route.request().postDataJSON() as Body);await route.fulfill({json:{reply:'Çok iyiyim, teşekkürler!'}})});
 await page.goto('/');
 await page.getByRole('button',{name:'Piko ile konuş'}).click();
 const chat=page.getByRole('dialog',{name:'Piko ile sohbet'});
 await expect(chat.locator('.piko-msg.piko')).toHaveCount(2);
 await chat.getByRole('button',{name:'Konuşarak sor'}).click();
 await expect(chat.locator('.piko-msg.child')).toHaveText('Sen: Merhaba Piko nasılsın');
 await expect(chat.locator('.piko-msg.piko')).toHaveCount(3);
 expect(await page.evaluate(()=>(window as unknown as {heardLang:string}).heardLang)).toBe('tr-TR');
 expect(bodies[1].messages!.at(-1)).toEqual({role:'user',text:'Merhaba Piko nasılsın'});
});

test('servis hatalarında çocuğa anlaşılır bir not gösterir',async({page})=>{
 let mode:'hiz'|'yorgun'|'ag'='hiz';
 await page.route('**/piko',route=>mode==='ag'?route.abort():route.fulfill(mode==='hiz'?{status:429,json:{error:'x'}}:{status:503,json:{reply:'Ah, şu an biraz yorgunum. Birazdan yeniden dener misin?'}}));
 await page.goto('/');
 await page.getByRole('button',{name:'Piko ile konuş'}).click();
 const chat=page.getByRole('dialog',{name:'Piko ile sohbet'}),input=chat.getByLabel('Piko’ya mesajın');
 // Tanıtım isteği bile düşerse not gösterilir, hazır sorular yine çıkar.
 await expect(chat.getByRole('alert')).toContainText('Çok hızlı konuştuk');
 await expect(chat.locator('.piko-starters button').first()).toBeVisible();
 await input.fill('merhaba');await input.press('Enter');
 await expect(chat.getByRole('alert')).toContainText('Çok hızlı konuştuk');
 mode='yorgun';await input.fill('merhaba');await input.press('Enter');
 await expect(chat.locator('.piko-msg.piko').last()).toHaveText('Piko: Ah, şu an biraz yorgunum. Birazdan yeniden dener misin?');
 mode='ag';await input.fill('merhaba');await input.press('Enter');
 await expect(chat.getByRole('alert')).toContainText('İnternete ulaşamadım');
});

test('telefonda Piko alt menünün üstünde durur, sohbet tüm ekranı kaplar',async({page})=>{
 await page.route('**/piko',route=>route.fulfill({json:{reply:'Merhaba!'}}));
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const piko=page.getByRole('button',{name:'Piko ile konuş'}),nav=page.getByRole('navigation',{name:'Mobil gezinti'});
 const [p,n]=[await piko.boundingBox(),await nav.boundingBox()];
 expect(p!.y+p!.height).toBeLessThanOrEqual(n!.y);
 await piko.click();
 const dialog=page.getByRole('dialog',{name:'Piko ile sohbet'});
 await expect.poll(async()=>(await dialog.boundingBox())!.width).toBe(390);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/piko-chat-390.png'});
 await page.keyboard.press('Escape');
 // Derste de Piko alt menünün üstünde, ekranın içinde ve daha küçük durur.
 await page.goto('/#lesson/math-blocks');await expect(page.getByRole('heading',{level:1})).toBeVisible();
 const [c,m]=[await piko.boundingBox(),await nav.boundingBox()];
 expect(c!.y+c!.height).toBeLessThanOrEqual(m!.y);
 expect(c!.x+c!.width).toBeLessThanOrEqual(390);
 expect(c!.width).toBeLessThan(p!.width);
});
