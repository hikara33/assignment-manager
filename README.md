# Assignment Manager API

Backend-сервис для управления учебными задачами: авторизация, предметы, задания, группы и приглашения.

## Технологии

- `NestJS` (TypeScript)
- `Prisma` + `PostgreSQL`
- `JWT` + refresh token в cookie
- `class-validator` / `class-transformer`
- `Jest` (unit + e2e)
- `Swagger` (OpenAPI)

## Основной функционал

- Регистрация, логин, refresh/logout, профиль.
- CRUD и аналитика по заданиям (dashboard, приоритизация, конфликты, рескейджул).
- Управление предметами.
- Группы: создание, владение, участники, инвайты.
- Планировщик задач (`@nestjs/schedule`) для автоматических операций.

## Быстрый старт

### 1) Установка

```bash
npm install
```

### 2) Переменные окружения

Скопируйте пример:

```bash
cp .env.example .env
```

Заполните значения в `.env`.

### 3) Подготовка БД

```bash
npx prisma db push
```

### 4) Запуск

```bash
# dev
npm run start:dev

# prod (после сборки)
npm run build
npm run start:prod
```

## Swagger

Документация доступна по адресу:

- `http://localhost:3000/docs`

В Swagger настроен `Bearer` auth (вводите access token без `Bearer ` префикса).

Если у вас нет swagger-зависимостей, установите:

```bash
npm install @nestjs/swagger swagger-ui-express
```

## Scripts

- `npm run lint` — ESLint + autofix
- `npm run build` — сборка
- `npm run test` — unit тесты
- `npm run test:e2e` — e2e тесты
- `npm run test:cov` — покрытие

## Переменные окружения

Ключи (см. `.env.example`):

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_TOKEN_TTL`
- `JWT_REFRESH_TOKEN_TTL`
- `JWT_INVITE_SECRET`
- `JWT_INVITE_TTL`
- `COOKIE_DOMAIN`
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `NODE_ENV`
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`

## Структура API (укрупненно)

- `auth` — авторизация и пользователи.
- `assignment` — задания и аналитика.
- `subject` — предметы.
- `group` — группы и участники.
- `group/invite` — приглашения в группы.

## Проверка качества

Перед релизом рекомендуется:

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```
