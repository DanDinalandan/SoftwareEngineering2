# Unvapeify Development Guide

Unvapeify is split into three apps:

- `apps/backend`: Express API backed by Supabase.
- `apps/web`: provider portal built with Vite/React.
- `apps/mobile`: Expo mobile app for vape users and peer supporters.

## Backend Structure

The backend entry point is intentionally small:

- `src/server.js`: starts the HTTP server.
- `src/app.js`: configures Express middleware and mounts route modules.
- `src/routes`: API route groups.
- `src/middleware`: authentication middleware.
- `src/services`: reusable integrations such as JWT and notification creation.
- `src/utils`: data mappers, calculations, and shared helpers.
- `supabase/schema.sql`: database schema.
- `supabase/seed.sql`: development demo data.

When adding a backend feature:

1. Add or update tables in `apps/backend/supabase/schema.sql`.
2. Add demo rows in `apps/backend/supabase/seed.sql` when the UI needs sample data.
3. Put route handlers in the matching file under `apps/backend/src/routes`.
4. Put reusable database or integration logic in `apps/backend/src/services`.
5. Map database rows to frontend-safe response shapes in `apps/backend/src/utils/mappers.js`.
6. Mount a new route module in `apps/backend/src/app.js` if you create one.

Keep route files focused on HTTP behavior: validate input, call Supabase/services, return JSON. Avoid putting all business logic back into `server.js`.

## Frontend Data Flow

The web portal no longer uses hard-coded patient or provider mock data. It calls the backend through:

```text
apps/web/src/services/api.js
```

Display-only constants, such as mood labels and notification filters, live in:

```text
apps/web/src/data/displayOptions.js
```

When adding a web feature:

1. Add the backend endpoint first.
2. Add a method to `apps/web/src/services/api.js`.
3. Use that method from the page/component.
4. Keep patient, message, notification, and provider data in the database, not in React files.

The mobile app uses:

```text
apps/mobile/src/services/api.js
```

Set `EXPO_PUBLIC_API_BASE_URL` to the backend URL reachable from the device.

## Common Commands

Backend:

```bash
cd apps/backend
npm run dev
```

Web:

```bash
cd apps/web
npm run dev
```

Mobile:

```bash
cd apps/mobile
npm start
```

Docker:

```bash
docker compose --env-file .env.docker up --build
```

See `DOCKER_README.md` for Expo Go LAN setup.

## Database Workflow

Run `apps/backend/supabase/schema.sql` in Supabase SQL Editor after schema changes.

Run `apps/backend/supabase/seed.sql` only for development/demo data. Do not run seed data against production unless the rows are intentionally safe.

