# Docker Setup

This runs the backend, web app, and Expo mobile app from one command.

## 1. Create environment file

Copy:

```bash
cp .env.docker.example .env.docker
```

Fill in your Supabase values:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
```

## 2. Run everything

```bash
docker compose --env-file .env.docker up --build
```

Services:

- Backend API: `http://localhost:3000`
- Web portal: `http://localhost:5173`
- Expo mobile dev server: `http://localhost:8081`

## Mobile note

If you use Expo Go on a physical phone, `localhost` points to the phone, not your computer.

Set this in `.env.docker`:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:3000
```

Example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:3000
```

Then restart Docker Compose.

## Database

This Docker setup uses your hosted Supabase project. Run this SQL once in Supabase SQL Editor:

```text
apps/backend/supabase/schema.sql
```

## Useful commands

Run in background:

```bash
docker compose --env-file .env.docker up --build -d
```

Stop:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f backend
docker compose logs -f web
docker compose logs -f mobile
```
