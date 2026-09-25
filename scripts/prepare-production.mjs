import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${e.name}`;if(e.isDirectory())await walk(path);else if(e.name!=='sw.js'&&/\.(js|css|woff2|png|svg|webmanifest)$/.test(e.name))files.push(path.slice(3))}}
await mkdir('out',{recursive:true});
for(const size of [192,512])await sharp('public/icon.svg').resize(size,size).png().toFile(`out/icon-${size}.png`);
await walk('out');
let html=await readFile('out/index.html','utf8');
// The two headline subsets (Turkish + Latin) start loading alongside CSS.
// This avoids a late font replacement shifting the child's reading target.
const headlineFonts=files.filter(path=>/nunito-latin(?:-ext)?-800-normal.*\.woff2$/.test(path)&&!html.includes(`href="${path}" as="font"`));
html=html.replace('</head>',`${headlineFonts.map(path=>`<link rel="preload" href="${path}" as="font" type="font/woff2" crossorigin="anonymous">`).join('')}</head>`);
await writeFile('out/index.html',html);
const version=createHash('sha256').update(html+JSON.stringify(files)).digest('hex').slice(0,14);
const urls=['/','/index.html',...files];
const sw=`const CACHE='lara-${version}';const ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS)})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith('lara-')&&key!==CACHE)await caches.delete(key)}await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting()});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')));return}if(url.pathname==='/sw.js')return;event.respondWith((async()=>{const cached=await caches.match(event.request);if(cached)return cached;return fetch(event.request)})())});`;
await writeFile('out/sw.js',sw);
const hashes=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].filter(m=>m[1]).map(m=>`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
const csp=`default-src 'self'; script-src 'self' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`;
const headers=`add_header Content-Security-Policy "${csp}" always;
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Referrer-Policy no-referrer always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
add_header Strict-Transport-Security "max-age=31536000" always;`;
await writeFile('deploy/security-headers.conf',headers);
await writeFile('deploy/nginx.conf',`server {
 listen 8080;
 server_name _;
 root /usr/share/nginx/html;
 index index.html;
 server_tokens off;
 access_log off;
 error_log /dev/stderr warn;
 include /etc/nginx/security-headers.conf;
 gzip on;
 gzip_types text/css application/javascript application/json image/svg+xml;
 gzip_min_length 512;
 location / { try_files $uri $uri/ =404; add_header Cache-Control "no-cache"; include /etc/nginx/security-headers.conf; }
 location /_next/static/ { expires 1y; add_header Cache-Control "public, immutable"; include /etc/nginx/security-headers.conf; }
 location = /sw.js { add_header Cache-Control "no-store"; include /etc/nginx/security-headers.conf; }
 location ~ /\\. { deny all; }
}`);
console.log(`Production paketi: ${version}, ${urls.length} çevrim dışı dosya, ${hashes.length} CSP özeti.`);
