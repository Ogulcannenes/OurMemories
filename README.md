# ADELYA

> *Our little universe of memories.*

ADELYA, iki kişinin birlikte yazdığı **özel bir anı kitabıdır**. Çiftler en komik anlarını, kendi aralarındaki şakaları, unutulmaz sözleri ve konuşmaları kaydeder; uygulama bunları gerçek bir kitap gibi, sayfa çevirerek okunan ciltli bir defterde toplar.

Kitap yalnızca iki yazarına açıktır: herkes kendi hesabıyla girer, biri kitabı başlatır, diğeri davet koduyla katılır. Başka hiç kimse içeriği göremez.

## Neler var

- **Açılan bir kitap** — bordo bez kapak, sayfa çevirme animasyonu, masaüstünde iki sayfalık açılım, mobilde tek sayfa ve kaydırarak çevirme.
- **Anı sayfaları** — alıntı, başlık, tarih, kategori, hikâye, etiketler ve sayfa başına en fazla 10 fotoğraf.
- **Favoriler** — her yazarın kendi kurdelesi.
- **İçindekiler ve arama** — metin, kategori, etiket, tarih aralığı ve favori filtreleri.
- **"Bunu hatırlıyor musun?"** — ana sayfada rastgele eski bir anı.
- **Açık / koyu tema**, **Türkçe · English · Русский** arayüz.
- **PWA** — telefona uygulama gibi eklenebilir; bağlantı yokken bir çevrimdışı sayfası gösterir.
- **Hesap** — e-posta onaylı kayıt ve e-postayla şifre sıfırlama.

## Teknoloji

| Katman | Kullanılan |
|---|---|
| Uygulama | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Arayüz | Tailwind CSS 4, Base UI, Motion, Lucide ikonları |
| Veri ve kimlik | Supabase — Auth, Postgres, Storage |
| Test | Vitest, GitHub Actions (lint · typecheck · test) |
| Yayın | Vercel |

### Güvenlik ve gizlilik

- Her tablo **Row Level Security** ile korunur: bir kullanıcı yalnızca kendi kitabının satırlarını görebilir ve yazabilir.
- Fotoğraflar **özel** bir depoda tutulur ve yalnızca 1 saat geçerli imzalı linklerle gösterilir; açık kalan sayfa linkleri kendiliğinden yeniler.
- Uygulama Supabase'in yalnızca herkese açık (publishable) anahtarını kullanır; service-role anahtarı hiçbir yerde okunmaz.
- Sunucu CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy` ve `Permissions-Policy` başlıklarını gönderir.

## Proje yapısı

```
src/
  app/                 sayfalar ve route'lar
    (app)/             giriş gerektiren alan: ana sayfa, kitap, anı, ayarlar
    login/, onboarding/, auth/   giriş, kitap kurma/katılma, e-posta linkleri
  components/          kitap okuyucu, formlar, düzen ve UI bileşenleri
  lib/
    actions/           Server Actions (anı kaydetme, auth, kitap ayarları)
    data/              Supabase sorguları
    i18n/              tr / en / ru sözlükleri
supabase/migrations/   veritabanı şeması, RLS politikaları ve fonksiyonlar
public/                service worker ve çevrimdışı sayfa
```

## Kurulum

Gerekenler: Node.js 22+, bir Supabase projesi.

```bash
npm install
cp .env.example .env.local   # değerleri doldur
npm run db:push              # migration'ları Supabase'e uygular
npm run dev                  # http://localhost:3000
```

`.env.local` içinde gerekenler (`.env.example`'da açıklamalı):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — uygulamanın kullandığı herkese açık değerler.
- `SUPABASE_DB_URL` — yalnızca `db:push` / `db:types` için; uygulama bunu okumaz.

Supabase → Authentication → URL Configuration altında site adresini ve `…/auth/confirm**` yönlendirmesini ekle; kayıt onayı ve şifre sıfırlama linkleri buraya döner.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Production build ve sunucu |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript kontrolü |
| `npm test` | Vitest birim testleri |
| `npm run db:push` | Yeni migration'ları veritabanına uygular |
| `npm run db:types` | `database.types.ts` dosyasını şemadan yeniden üretir |

## Yayın

`main` dalı Vercel'e bağlıdır. Vercel ortam değişkenlerine `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` eklenmelidir. Veritabanı değişiklikleri deploy ile otomatik uygulanmaz; yeni bir migration varsa `npm run db:push` ayrıca çalıştırılır.
