# CineList — Персональный трекер фильмов и сериалов

Веб-приложение для ведения кинодневника с социальными функциями. Добавляйте фильмы и сериалы в списки, ставьте оценки, пишите рецензии и следите за вкусами друзей.

## Стек технологий

| Технология | Назначение |
|---|---|
| **Next.js 16** (App Router, TypeScript) | Фреймворк |
| **Supabase** | База данных (Postgres), авторизация, хранилище |
| **Tailwind CSS** | Стилизация |
| **shadcn/ui** (кастомные компоненты) | UI-компоненты |
| **Recharts** | Графики статистики на странице профиля |
| **TMDB API** | Данные о фильмах и сериалах |

## Функционал

- **Авторизация** — регистрация/вход через Email+пароль и Google OAuth, восстановление пароля
- **Поиск** — поиск по TMDB с пагинацией и фильтрами по типу (фильм/сериал)
- **Страница фильма/сериала** — постер, описание, жанры, актёрский состав, рейтинг TMDB + средний рейтинг в CineList, рецензии пользователей, кнопка добавления в список
- **Дневник** — список всех записей с фильтрами по статусу, поиском по названию, сортировкой; редактирование оценки и рецензии, удаление
- **Профиль** — аватар, биография, статистика (графики Recharts), списки по статусам, подписчики/подписки
- **Лента** — активность подписок + тренды недели с TMDB
- **Настройки** — загрузка аватара через Supabase Storage, смена username и bio

## Быстрый старт

### 1. Клонировать и установить зависимости

```bash
git clone <repo-url>
cd cinelist
npm install
```

### 2. Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните значения:

```bash
cp .env.example .env.local
```

| Переменная | Описание |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL вашего Supabase проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key из настроек Supabase |
| `NEXT_PUBLIC_TMDB_API_KEY` | Бесплатный API ключ с [themoviedb.org](https://www.themoviedb.org/settings/api) |
| `TMDB_READ_ACCESS_TOKEN` | Read Access Token из настроек TMDB (рекомендуется) |
| `NEXT_PUBLIC_APP_URL` | URL приложения (для OAuth редиректов) |

### 3. Настроить Supabase

1. Создайте новый проект на [supabase.com](https://supabase.com)
2. В SQL Editor выполните содержимое файла [`supabase/schema.sql`](./supabase/schema.sql)
3. В Authentication → Settings → Redirect URLs добавьте: `http://localhost:3000/auth/callback`
4. Для Google OAuth: Authentication → Providers → Google — добавьте Client ID и Secret

### 4. Запуск

```bash
# Разработка
npm run dev

# Сборка для продакшена
npm run build
npm start
```

Откройте [http://localhost:3000](http://localhost:3000)

## Структура проекта

```
src/
├── app/                    # App Router страницы
│   ├── page.tsx            # Главная (лента + тренды)
│   ├── search/             # Поиск по TMDB
│   ├── media/
│   │   ├── movie/[id]/     # Страница фильма
│   │   └── tv/[id]/        # Страница сериала
│   ├── diary/              # Личный дневник
│   ├── profile/[username]/ # Профиль пользователя
│   ├── settings/           # Настройки профиля
│   ├── auth/               # Авторизация
│   └── api/                # API роуты
│       ├── search/         # Проксирование TMDB поиска
│       └── entries/        # Создание/обновление записей
├── components/
│   ├── ui/                 # Базовые UI компоненты
│   ├── layout/             # Навигация, лента
│   └── media/              # Карточки, кнопка добавления
├── lib/
│   ├── supabase/           # Клиенты (browser, server, proxy)
│   ├── tmdb.ts             # TMDB API функции
│   └── utils.ts            # Утилиты
└── types/
    ├── database.ts         # Типы Supabase таблиц
    └── tmdb.ts             # Типы TMDB API
```

## База данных (Supabase Postgres)

| Таблица | Назначение |
|---|---|
| `profiles` | Профили пользователей (расширяет auth.users) |
| `media` | Фильмы и сериалы (кэш данных TMDB) |
| `entries` | Записи дневника (статус, оценка, рецензия) |
| `comments` | Комментарии к записям |
| `follows` | Подписки (follower_id → following_id) |
| `tags` | Теги для организации записей |
| `entry_tags` | Связь записей с тегами (many-to-many) |

Все таблицы защищены политиками Row Level Security (RLS).

## Деплой

Приложение готово к деплою на [Vercel](https://vercel.com):

1. Создайте проект в Vercel, подключите репозиторий
2. Добавьте переменные окружения из `.env.example`
3. Установите `NEXT_PUBLIC_APP_URL` = URL вашего деплоя
4. В Supabase → Auth → Redirect URLs добавьте URL деплоя + `/auth/callback`
