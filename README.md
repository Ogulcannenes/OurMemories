# ADELYA

> *Our little universe of memories.*

**[Русский](#русский) · [English](#english) · [Türkçe](#türkçe)**

---

## Русский

ADELYA — это **личная книга воспоминаний**, которую пишут двое. Пара сохраняет самые смешные моменты, свои шутки, незабываемые фразы и разговоры, а приложение собирает их в настоящую книгу в переплёте, которую читают, перелистывая страницы.

Книга открыта только двум её авторам: каждый входит под своим аккаунтом, один создаёт книгу, второй присоединяется по коду приглашения. Больше никто не видит содержимое.

### Возможности

- **Открывающаяся книга** — обложка из бордовой ткани, анимация перелистывания, разворот из двух страниц на компьютере, одна страница и перелистывание свайпом на телефоне.
- **Страницы воспоминаний** — цитата, заголовок, дата, категория, история, теги и до 10 фотографий на страницу.
- **Избранное** — у каждого автора своя закладка-ленточка.
- **Оглавление и поиск** — фильтры по тексту, категории, тегу, периоду и избранному.
- **«Помнишь это?»** — случайное старое воспоминание на главной.
- **Светлая и тёмная тема**, интерфейс на **русском · английском · турецком**.
- **PWA** — можно добавить на телефон как приложение; без сети показывается офлайн-страница.
- **Аккаунт** — регистрация с подтверждением по email и сброс пароля по email.

### Технологии

| Слой | Что используется |
|---|---|
| Приложение | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Интерфейс | Tailwind CSS 4, Base UI, Motion, иконки Lucide |
| Данные и авторизация | Supabase — Auth, Postgres, Storage |
| Тесты | Vitest, GitHub Actions (lint · typecheck · test) |
| Хостинг | Vercel |

### Безопасность и приватность

- Каждая таблица защищена **Row Level Security**: пользователь видит и изменяет только строки своей книги.
- Фотографии хранятся в **приватном** хранилище и показываются только по подписанным ссылкам, действующим 1 час; на открытой странице ссылки обновляются сами.
- Приложение использует только публичный (publishable) ключ Supabase; service-role ключ нигде не читается.
- Сервер отправляет заголовки CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy` и `Permissions-Policy`.

### Установка

Нужно: Node.js 22+ и проект в Supabase.

```bash
npm install
cp .env.example .env.local   # заполните значения
npm run db:push              # применяет миграции к Supabase
npm run dev                  # http://localhost:3000
```

Переменные в `.env.local` (с пояснениями в `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — публичные значения, которые использует приложение.
- `SUPABASE_DB_URL` — только для `db:push` / `db:types`; приложение его не читает.

В Supabase → Authentication → URL Configuration добавьте адрес сайта и перенаправление `…/auth/confirm**`: сюда возвращаются ссылки подтверждения регистрации и сброса пароля.

### Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | Сервер разработки |
| `npm run build` / `npm start` | Production-сборка и сервер |
| `npm run lint` | ESLint |
| `npm run typecheck` | Проверка TypeScript |
| `npm test` | Юнит-тесты Vitest |
| `npm run db:push` | Применяет новые миграции к базе |
| `npm run db:types` | Заново генерирует `database.types.ts` по схеме |

### Публикация

Ветка `main` подключена к Vercel. В переменные окружения Vercel нужно добавить `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Изменения базы данных при деплое не применяются автоматически: новую миграцию нужно применить отдельно через `npm run db:push`.

---

## English

ADELYA is a **private memory book written by two people**. A couple records their funniest moments, inside jokes, unforgettable lines and conversations, and the app gathers them into a real bound book that you read by turning its pages.

The book is open only to its two authors: each signs in with their own account, one starts the book and the other joins with an invitation code. No one else can see what is inside.

### Features

- **A book that opens** — burgundy cloth cover, page-turn animation, a two-page spread on desktop, a single page with swipe-to-turn on mobile.
- **Memory pages** — quote, title, date, category, story, tags and up to 10 photos per page.
- **Favourites** — each author has their own bookmark ribbon.
- **Contents and search** — filter by text, category, tag, date range and favourites.
- **"Remember this?"** — a random older memory on the home page.
- **Light and dark themes**, interface in **Russian · English · Turkish**.
- **PWA** — can be added to a phone like an app; shows an offline page without a connection.
- **Account** — sign-up with email confirmation and password reset by email.

### Tech stack

| Layer | Used |
|---|---|
| App | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS 4, Base UI, Motion, Lucide icons |
| Data and auth | Supabase — Auth, Postgres, Storage |
| Testing | Vitest, GitHub Actions (lint · typecheck · test) |
| Hosting | Vercel |

### Security and privacy

- Every table is protected by **Row Level Security**: a user can only read and write the rows of their own book.
- Photos live in a **private** bucket and are shown only through signed links valid for 1 hour; links on a page left open refresh themselves.
- The app uses only Supabase's public (publishable) key; the service-role key is never read anywhere.
- The server sends CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy` and `Permissions-Policy` headers.

### Setup

Requirements: Node.js 22+ and a Supabase project.

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run db:push              # applies the migrations to Supabase
npm run dev                  # http://localhost:3000
```

Variables in `.env.local` (documented in `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public values used by the app.
- `SUPABASE_DB_URL` — only for `db:push` / `db:types`; the app never reads it.

In Supabase → Authentication → URL Configuration, add the site URL and the `…/auth/confirm**` redirect: sign-up confirmation and password-reset links return there.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest unit tests |
| `npm run db:push` | Applies new migrations to the database |
| `npm run db:types` | Regenerates `database.types.ts` from the schema |

### Deployment

The `main` branch is connected to Vercel. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Vercel environment variables. Database changes are not applied by a deploy: run `npm run db:push` separately when there is a new migration.

---

## Türkçe

ADELYA, iki kişinin birlikte yazdığı **özel bir anı kitabıdır**. Çiftler en komik anlarını, kendi aralarındaki şakaları, unutulmaz sözleri ve konuşmaları kaydeder; uygulama bunları gerçek bir kitap gibi, sayfa çevirerek okunan ciltli bir defterde toplar.

Kitap yalnızca iki yazarına açıktır: herkes kendi hesabıyla girer, biri kitabı başlatır, diğeri davet koduyla katılır. Başka hiç kimse içeriği göremez.

### Neler var

- **Açılan bir kitap** — bordo bez kapak, sayfa çevirme animasyonu, masaüstünde iki sayfalık açılım, mobilde tek sayfa ve kaydırarak çevirme.
- **Anı sayfaları** — alıntı, başlık, tarih, kategori, hikâye, etiketler ve sayfa başına en fazla 10 fotoğraf.
- **Favoriler** — her yazarın kendi kurdelesi.
- **İçindekiler ve arama** — metin, kategori, etiket, tarih aralığı ve favori filtreleri.
- **"Bunu hatırlıyor musun?"** — ana sayfada rastgele eski bir anı.
- **Açık ve koyu tema**, **Rusça · İngilizce · Türkçe** arayüz.
- **PWA** — telefona uygulama gibi eklenebilir; bağlantı yokken bir çevrimdışı sayfası gösterir.
- **Hesap** — e-posta onaylı kayıt ve e-postayla şifre sıfırlama.

### Teknoloji

| Katman | Kullanılan |
|---|---|
| Uygulama | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Arayüz | Tailwind CSS 4, Base UI, Motion, Lucide ikonları |
| Veri ve kimlik | Supabase — Auth, Postgres, Storage |
| Test | Vitest, GitHub Actions (lint · typecheck · test) |
| Yayın | Vercel |

### Güvenlik ve gizlilik

- Her tablo **Row Level Security** ile korunur: bir kullanıcı yalnızca kendi kitabının satırlarını görebilir ve yazabilir.
- Fotoğraflar **özel** bir depoda tutulur ve yalnızca 1 saat geçerli imzalı linklerle gösterilir; açık kalan sayfada linkler kendiliğinden yenilenir.
- Uygulama Supabase'in yalnızca herkese açık (publishable) anahtarını kullanır; service-role anahtarı hiçbir yerde okunmaz.
- Sunucu CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy` ve `Permissions-Policy` başlıklarını gönderir.

### Kurulum

Gerekenler: Node.js 22+ ve bir Supabase projesi.

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

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Production build ve sunucu |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript kontrolü |
| `npm test` | Vitest birim testleri |
| `npm run db:push` | Yeni migration'ları veritabanına uygular |
| `npm run db:types` | `database.types.ts` dosyasını şemadan yeniden üretir |

### Yayın

`main` dalı Vercel'e bağlıdır. Vercel ortam değişkenlerine `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` eklenmelidir. Veritabanı değişiklikleri deploy ile otomatik uygulanmaz; yeni bir migration varsa `npm run db:push` ayrıca çalıştırılır.
