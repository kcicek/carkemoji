p# ÇarkEmoji

Türkçe atasözleri ve deyimlerini emojilerle çözmeye dayalı, dönen halkalı zaman bazlı puanlama içeren mini bir oyun.

### Ses Efektleri
Harici dosya kullanmadan Web Audio API ile anlık oluşturulan bazı efektler eklendi:

- Tık sesi: Çark halkası dönerken (playTick)
- TaDa: Bulmaca doğru çözüldüğünde (playTada)
- Konfeti Patlama: Sonuç ekranı açıldığında (playConfettiBurst iki kez)
- Alkış: Konfeti sonrası (playApplause)

Bu fonksiyonlar `src/utils/sound.ts` dosyasında. İsterseniz kendi mp3/wav dosyalarınızı kullanmak için:
1. `public/sounds/` klasörü oluşturup dosyaları koyun (ör: tada.mp3, applause.mp3).
2. `sound.ts` içinde ilgili playX fonksiyonlarını yerine basit bir `new Audio('/sounds/tada.mp3').play();` çağrısı ekleyin.
3. Tarayıcı otomatik oynatma kısıtlamaları için ilk kullanıcı etkileşiminde `resumeAudio()` çalıştırmayı unutmayın.

Performans / Gürültü Notu: Sentezlenen efektler kısa ve düşük CPU tüketimli olacak biçimde envelope ile hızla sönümlenir.

## Özellikler
- 1–4 yerel (aynı cihaz) oyuncu
- Her tur ipucu gösterilir, döner halkaları çevirerek doğru emoji dizisini hizala
- Zaman bazlı puanlama: Süre dolmadan çözdükçe kalan saniye kadar puan
- 1000 puana ilk ulaşan anında şampiyon olur
- TailwindCSS ile responsive arayüz, Framer Motion animasyonlar
- PWA (Progressive Web App): Çevrimdışı çalışır, ana ekrana eklenebilir

## Geliştirme

Önce bağımlılıkları yükleyin:

```bash
npm install
```

Geliştirme sunucusu:
```bash
npm run dev
```

Derleme:
```bash
npm run build
```

### PWA İkonlarını Güncelleme
Özel logonuzu eklemek için `scripts/generate-icons.mjs` içindeki SVG kısmını kendi `logo.svg` içeriğinizle değiştirin veya dosyadan okuyacak şekilde uyarlayın. Ardından:
```bash
npm run generate:icons
```
Bu komut `public/icons/` altındaki 192 & 512 px normal ve maskable ikonları yeniden üretir. Manifest bunları otomatik kullanır.

Önizleme:
```bash
npm run preview
```

## GitHub Pages'e Yayınlama
Bu depo `main` dalına push yaptığınızda otomatik olarak GitHub Pages'e (https://kcicek.github.io/carkemoji) dağıtılır.

### Nasıl Çalışır?
`.github/workflows/deploy.yml` workflow'u:
1. Kodu çeker
2. Node 20 kurar ve bağımlılıkları `npm ci` ile yükler
3. `GITHUB_PAGES=true` ortam değişkeni ile `npm run build` çalıştırır (Vite `base` değeri `/carkemoji/` olur)
4. `dist` çıktısını GitHub Pages'e yükler

### Manuel Test
Lokal makinede aynı davranışı görmek için:
```bash
set GITHUB_PAGES=true && npm run build   # Windows PowerShell için: $env:GITHUB_PAGES='true'; npm run build
npx serve dist                            # veya npm run preview (base etkisini görmezseniz 'serve' tercih edin)
```

### Sık Karşılaşılan Sorunlar
- Boş sayfa / kırık stiller: Büyük ihtimalle `base` ayarı yoktu veya eski cache. Hard refresh (Ctrl+F5).
- 404 hata: Pages ayarlarında Source = GitHub Actions olmalı (Settings > Pages).
- Yanlış asset yolları: `index.html` içindeki `<script src="/src/main.tsx">` ifadesi Vite tarafından build sırasında relative path'e dönüştürülür; ek manuel değişiklik gerekmez.

### Fork Ederseniz
`vite.config.ts` içindeki `base: '/carkemoji/'` kısmını kendi depo adınıza göre güncelleyin (ör: `/my-fork-name/`). Workflow otomatik uyum sağlar.

## PWA (Progressive Web App)
Uygulama artık PWA olarak kurulabilir ve çevrimdışı (önceden ziyaret edilen sayfalar / asset'ler) çalışır.

### Kurulum (Add to Home Screen)
- Mobil Chrome/Edge: Siteyi açın, menüden "Ana ekrana ekle" seçin.
- iOS Safari: Paylaş (Share) > Add to Home Screen.

### Geliştirme Modunda Test
`vite-plugin-pwa` geliştirme modunda tam SW davranışını simüle etmez. Üretim benzeri test için:
```bash
npm run build
npm run preview
```
Ardından DevTools > Application > Service Workers sekmesinden SW kaydını görebilirsiniz.

### SW Güncellemeleri
Plugin `registerType: autoUpdate` ile derlenmiş yeni içerik kullanıcı sekmesi odaklandığında otomatik alınır. İsteğe bağlı olarak kullanıcıya "Yeni sürüm hazır" bildirimi göstermek için `virtual:pwa-register` API'si entegre edilebilir.

### İkonlar
`public/icons/` içindeki placeholder ikonları kendi 192x192 ve 512x512 PNG dosyalarınızla değiştirin. Maskable versiyonlar (purpose: maskable) köşeleri kesilebilecek uyarlanabilir şekil sağlar.

### Önbellekleme
Workbox stratejisi: Üretim build'i sırasında derlenen dosyalar precache listesine eklenir. Dinamik istekler (navigasyon) `navigateFallback` ile `index.html`'a yönlenir (SPA). Uzun süreli stale asset sorunu yaşarsanız kullanıcıya manuel refresh önerin.

### Sorun Giderme
- İkon görünmüyor: Manifest içindeki yolun `/icons/...` olduğundan emin olun ve PNG gerçekten o boyutta olsun.
- Güncelleme gelmiyor: SW'yi Application panelden unregister edip sayfayı hard refresh (Ctrl+F5) yapın.
- 404 (GitHub Pages): `base` doğru değilse SW asset yolu bozulur; `GITHUB_PAGES=true` ile build edin.

## Veri Eklemek
`src/assets/atasozleri.json` veya `src/assets/deyimler.json` dosyalarına aynı şemada yeni kayıt ekleyin:
```json
{
  "emoji": "💧💧➡️🌊",
  "text": "Damlaya damlaya göl olur",
  "hint": "Küçük birikimler büyür",
  "type": "Atasözü"
}
```

## Yapılacak Geliştirmeler
- Dokunma jestleri ile halka sürükleyerek döndürme (şu an tıklama)
- Ses efektleri
- Zorluk seviyesi seçenekleri

## Lisans
Bu proje eğitim amaçlıdır.
