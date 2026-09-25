import lighthouse from 'lighthouse';
import {launch} from 'chrome-launcher';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
const chrome=await launch({chromePath:chromium.executablePath(),chromeFlags:['--headless','--no-sandbox','--disable-dev-shm-usage']});
try{const url=process.env.TEST_URL??'http://127.0.0.1:18742';const result=await lighthouse(url,{port:chrome.port,output:['html','json'],logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo']});await writeFile('artifacts/lighthouse.html',result.report[0]);await writeFile('artifacts/lighthouse.json',result.report[1]);console.log(JSON.stringify(Object.fromEntries(Object.entries(result.lhr.categories).map(([k,v])=>[k,Math.round(v.score*100)]))));for(const [id,a] of Object.entries(result.lhr.audits))if(a.score!==null&&a.score<1&&a.scoreDisplayMode!=='informative')console.log(id,a.title,a.displayValue??'');}finally{await chrome.kill()}
