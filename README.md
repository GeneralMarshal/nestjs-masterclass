# nestjs-masterclass

A task management REST API that I built while following the NestJS Zero to Hero course.

## Features

- Sign up / sign in with bcrypt-hashed passwords and JWT auth (Passport)
- Tasks CRUD: create, list with search and status filters, get, delete, update status
- Each user only sees their own tasks
- TypeORM with PostgreSQL
- Stage-based config (`.env.stage.<stage>`) validated with Joi

## Tech stack

NestJS · TypeScript · TypeORM · PostgreSQL · Passport JWT · Joi

## API overview

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/signup` | Create an account |
| `POST` | `/auth/signin` | Get an access token |
| `GET` | `/tasks` | List tasks (filter by `status`, `search`) |
| `POST` | `/tasks` | Create a task |
| `GET` | `/tasks/:id` | Get a task |
| `DELETE` | `/tasks/:id` | Delete a task |
| `PATCH` | `/tasks/:id/status` | Update a task's status |

## Getting started

```bash
npm install
STAGE=dev npm run start:dev
```

Required config: `STAGE`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`.

There are also notes on [database auth](./TUTORIAL_DATABASE_AUTH.md) and [deploying to Render](./RENDER_DEPLOYMENT_TUTORIAL.md).
