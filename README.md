# Assignment Manager API

Backend-сервис для управления рабоичи / учебными задачами: авторизация, предметы, задания, группы, приглашения и аналитика.

## Технологии
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-0C344B?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

## Основной функционал

- Регистрация, логин, refresh/logout с реролом токена, профиль.
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
