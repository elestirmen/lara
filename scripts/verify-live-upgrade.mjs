// Run before deploying: an isolated browser profile observes the real SW update.
// No child/parent data is read; this context has its own temporary localStorage.
import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({headless:true});
const origin=process.env.TEST_URL??(process.argv.includes('--qa')?'http://127.0.0.1:18743':'https://lara.perinet.org');
try{
 const context=await browser.newContext(),page=await context.newPage();
 page.on('pageerror',error=>console.error('PAGE_ERROR',error.message));
 await page.goto(origin);
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 const old=await page.evaluate(async()=>{localStorage.setItem('lara-progress-v1',JSON.stringify({version:1,skills:{},completed:{'math-blocks':{at:new Date().toISOString(),correct:4,total:5}},attempts:[],stars:0,sound:false}));return (await caches.keys()).filter(x=>x.startsWith('lara-'))});
 console.log('OLD_CACHE_READY',JSON.stringify(old));
 // Poll the resolved primitive from Node. A Promise object must never itself
 // satisfy the in-page truthiness check before the worker reaches 'waiting'.
 await expect.poll(()=>page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg?.update();return reg?.waiting?.state==='installed'}),{intervals:[1000,3000],timeout:240000}).toBe(true);
 console.log('WAITING_WORKER',await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {active:r?.active?.state,waiting:r?.waiting?.state,controller:!!navigator.serviceWorker.controller}}));
 const refreshed=page.waitForEvent('load',{timeout:30000});
 try{await page.getByRole('button',{name:'Uygulamayı güncelle'}).click({timeout:15000});await refreshed}catch(error){await page.screenshot({path:'artifacts/upgrade-failure.png',fullPage:true});console.error('UPDATE_SCREEN',await page.locator('body').innerText());throw error}
 await expect.poll(()=>page.evaluate(async()=>(await caches.keys()).filter(x=>x.startsWith('lara-')).join(','))).not.toBe(old.join(','));
 if(await page.evaluate(()=>JSON.parse(localStorage.getItem('lara-progress-v1')).completed['math-blocks'].correct)!==4)throw Error('Progress was not preserved');
 await page.goto(`${origin}/#lesson/math-clock`);
 await expect(page.locator('.interactive-clock')).toBeVisible();
 await context.setOffline(true);await page.reload();
 await expect(page.locator('.interactive-clock')).toBeVisible();
 await page.screenshot({path:'artifacts/live-upgrade-clock.png',fullPage:true});
 console.log('PASS: live update, new clock, preserved storage, offline reload');
}finally{await browser.close()}
