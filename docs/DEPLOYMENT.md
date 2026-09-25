# Production kurulumu

26 Eylül premium görsel dil yayınından hemen önceki imaj `laranin-dersleri:before-art-20260926`, 25 Eylül anında kontrol ve sesli geri bildirim yayınından hemen önceki imaj `laranin-dersleri:before-feedback-20260925`, 25 Eylül etkinlik anlaşılırlık düzeltmelerinden hemen önceki imaj `laranin-dersleri:before-clarity-20260925`, 25 Eylül “Lara’nın Dünyası” (oyun molası) yayınından hemen önceki imaj `laranin-dersleri:before-games-20260925` etiketiyle korunur. 24 Eylül ikinci kontrol yayınının hemen önceki imajı `laranin-dersleri:before-review-20260924` etiketiyle korunur. İlk etkileşim yenilemesinden önceki imaj ayrıca `laranin-dersleri:before-interactions-20260924` etiketiyle tutulur. Geri dönüş gerekirse istenen imaj `laranin-dersleri:1.0.0` olarak etiketlenip `docker compose up -d --no-build` çalıştırılır. Bu işlem tarayıcıdaki ilerlemeyi silmez. Son kontrol raporu: [VALIDATION.md](VALIDATION.md).

Adres: https://lara.perinet.org. İlk yayın adresi `laranindersleri.perinet.org` kalıcı olarak (301) bu adrese yönlenir.

Sunucuda zaten çalışan **Nginx Proxy Manager** kullanılır. Yeni dış reverse proxy kurulmaz. `lara-dersleri` container'ındaki Nginx sadece statik uygulama sunucusudur. Mevcut diğer container'lar veya domain kuralları değiştirilmez.

## Yayınlama

```sh
npm ci
npm run typecheck
npm test
npm run build
node scripts/prepare-production.mjs
docker compose up -d --build
npm run test:e2e
```

`out/` içinde üretilen statik dosyalar image'e alınır. `prepare-production.mjs` atlanmamalıdır: ikon (ana ekran ikonları `deploy/app-icon.png` kaynağından), Service Worker ve CSP script hash'leri derlemeyle birlikte yenilenir. `deploy/nginx.conf` ve `deploy/security-headers.conf` bu script tarafından her çalıştırmada yeniden yazılır; değişiklikleri script'te yapın. `docker compose up` yalnız bu Compose projesinin container'ını yeniler. Loopback bağlantısı: `127.0.0.1:18742:8080`. Proxy upstream: `http://lara-dersleri:8080`, ortak external network: `npm-net`. Restart politikası `unless-stopped`; healthcheck `/`; salt okunur dosya sistemi ve geçici tmpfs alanları.

## DNS

DNS kayıtları Cloudflare'de yönetilir. `lara.perinet.org` ve eski `laranindersleri.perinet.org` aynı sunucuyu gösterir; diğer DNS kayıtları bu uygulamanın parçası değildir. Kimlik bilgileri repoda tutulmaz. Cloudflare proxy ağ düzeyinde bağlantı bilgilerini işleyebilir; uygulama ilerlemesi Cloudflare'e veya uygulama sunucusuna gönderilmez. Uygulama analitik kodu kullanmaz.

## Nginx Proxy Manager ve HTTPS

`deploy/proxy.conf`, sunucudaki `/data/nginx/custom/laranindersleri.conf` dosyasının kopyasıdır. `lara.perinet.org` için HTTP → HTTPS ve HTTPS → container yönlendirmesini, eski adres için de `lara.perinet.org`'a kalıcı yönlendirmeyi içerir. Dosya `/data/nginx/custom/http.conf` içindeki bir include satırıyla yüklenir.

Sunucudaki dosya repodakinden yeni olabilir. Kopyalamadan önce iki dosyayı karşılaştırın:

```sh
docker exec nginx-proxy-manager cat /data/nginx/custom/laranindersleri.conf | diff deploy/proxy.conf -
docker cp deploy/proxy.conf nginx-proxy-manager:/data/nginx/custom/laranindersleri.conf
docker exec nginx-proxy-manager nginx -t
docker exec nginx-proxy-manager nginx -s reload
```

Yalnız yapılandırma kontrolü başarılıysa reload edin. Container DNS'i Docker resolver ile çözülür; container IP'si değişince proxy yeniden kurulmaz. Uygulama ve proxy host için erişim günlükleri kapalıdır. Hata günlükleri operasyonel hata incelemesi içindir.

`lara.perinet.org` sertifikasını (`npm-116`) Nginx Proxy Manager kendisi yeniler. Eski adresin HTTPS yönlendirmesi için `laranindersleri-perinet-org` sertifikası da gereklidir. Bu sertifikanın DNS-01 doğrulaması sunucudaki mevcut Cloudflare kimlik bilgisini kullanır; anahtar uygulama container'ına veya repoya kopyalanmaz. Kullanıcının mevcut crontab'ı korunarak şu işe ek yapılmıştır:

```cron
23 5,17 * * * /opt/lara/scripts/renew-certificate.sh # laranindersleri-cert-renewal
```

Yenileme sadece bu sertifikayı hedefler; başarılı yenilemeden sonra Nginx kontrol edilip reload edilir. Kuru çalışma: `docker exec nginx-proxy-manager certbot renew --cert-name laranindersleri-perinet-org --dry-run`.

## Kontrol ve geri dönüş

```sh
docker compose ps
curl -I http://127.0.0.1:18742/
curl -I https://lara.perinet.org/
curl -I http://lara.perinet.org/
curl -I https://laranindersleri.perinet.org/
npm audit --omit=dev
```

Beklenenler: `lara.perinet.org` için HTTPS 200 ve HTTP 301; eski adres için `https://lara.perinet.org/` hedefli 301; sağlıklı container; CSP/HSTS/X-Frame-Options/X-Content-Type-Options başlıkları. DNS negatif cache nedeniyle yerel çözümleme gecikirse Cloudflare DoH ile kaydı kontrol edin; kalıcı `/etc/hosts` değişikliği yapmayın.

Yeni sürüm öncesi mevcut image'i ayrı etiketle koruyun: `docker tag laranin-dersleri:1.0.0 laranin-dersleri:previous`. Geri dönüşte bu image'i Compose'da seçip yalnız uygulamayı yeniden oluşturun. Eski image ile onun ürettiği CSP/SW birlikte döner. Ebeveyn ilerlemesi sunucu image'inden bağımsızdır.

Sunucuda çocuk verisi bulunmadığından sunucu veri tabanı yedeği gerekmez. Ebeveyn arayüzündeki JSON dışa aktarma ve geri yükleme ilerlemenin yedeğidir. Kaynak kod, package-lock ve belgeler GitHub'daki `elestirmen/lara` deposunda tutulur.
