# 💻 Assignment Manager API

A full-featured backend service for managing academic or work tasks - with user authentication, assignment and subject management, group collaboration, invitations, analytics, background jobs, and email notifications.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-0C344B?style=for-the-badge&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-FF6B6B?style=for-the-badge&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Running with Docker](#running-with-docker)
  - [Running Locally (without Docker)](#running-locally)
- [API Documentation](#api-documentation)
- [Testing](#testing)

---

## About

Assignment Manager is a backend service built to help students and teams organize their workload. It provides a robust API for managing assignments, subjects, and collaborative groups. Key features include a JWT-based authentication system with refresh tokens, email notifications, automated deadline enforcement, and background job processing via BullMQ and Redis.

---

## Features

### 👤 User & Authentication
- Register, login, and logout with **refresh token rotation**
- **Brute-force protection** on login attempts
- Role-based access control (`STUDENT`, `ADMIN`)
- Email notifications (invites, reminders) via **Nodemailer**

### 📋 Assignment Management
- Full CRUD operations for assignments
- **Dashboard analytics** with task prioritization
- Smart **rescheduling engine** to prevent deadline conflicts
- **Automated deadline enforcement** via scheduled jobs (`@nestjs/schedule`)

### 📚 Subject Management
- Create, read, update, and delete subjects
- All assignments are linked to a subject

### 👥 Groups & Collaboration
- Create and manage groups (ownership model)
- Invite users via email (token-based invitations)
- Role-based permissions within groups (`MEMBER`, `ADMIN`)
- Group members can view and manage shared assignments

### ⚙️ Background Jobs
- **BullMQ + Redis** for reliable asynchronous task processing
- Email sending, analytics recalculation, and overdue task handling
- Job retries and failure queues

### 🛡️ Security
- **JWT authentication** with access & refresh tokens (stored in HTTP-only cookies)
- **Argon2** password hashing
- Input validation, rate limiting, and CORS protection

---

## Tech Stack

### Backend
- **NestJS** — modular Node.js framework
- **TypeScript** — type-safe development
- **PostgreSQL** + **Prisma ORM** — data persistence
- **Redis** — caching and BullMQ queue backend
- **BullMQ** — background job processing
- **Passport.js** — authentication strategies (JWT, local)
- **Nodemailer** — email service
- **Jest** — unit and e2e testing

### DevOps
- **Docker** + **Docker Compose** — containerization
- **GitHub Actions** — CI/CD (lint, test, build)

---

## Architecture

The backend follows a clear modular architecture: Module → Controller → Service → Repository → Database

| Layer | Responsibility |
|---|---|
| Controller | REST endpoints, request validation |
| Service | Business logic, external integrations |
| Repository | Database operations via Prisma |
| Module | NestJS module bundling (controllers, providers) |
| Guard / Interceptor | Authentication, logging, transformation |

Each feature (auth, assignments, groups) is encapsulated in its own NestJS module.

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js 18+](https://nodejs.org/) (for local development)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Environment Setup

```bash
git clone https://github.com/hikara33/assignment-manager.git
cd assignment-manager
cp .env.example .env
```

### Running with Docker

The easiest way to run the full stack:
```bash
docker compose up -d
```

This starts:
- API on port `3000`
- PostgreSQL on port `5432`
- Redis on port `6379`

### Running Locally (without Docker)

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma db push

# Start development server
npm run start:dev
```

## API Documentation

Once the server is running, interactive Swagger documentation is available at:
```bash
http://localhost:3000/docs
```

The Swagger UI includes support for **Bearer token authentication** (use the access token without the `Bearer` prefix).
Main API modules:
- `auth` — authentication and user profile
- `assignment` — assignments and analytics dashboard
- `subject` — subject management
- `group` — groups and membership
- `group/invite` — invitation handling

## Testing

Run unit tests:
```bash
npm run test
```

Run end-to-end tests:
```bash
npm run test:e2e
```