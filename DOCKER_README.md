# Docker Setup

This runs the backend, web app, and Expo mobile app from one command.

## 1. Create environment file

```bash
cp .env.docker.example .env.docker
```

Fill in your Supabase values and LAN IP:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
LAN_IP=192.168.1.20
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:3000
```

Use your computer's Wi-Fi/LAN IPv4 address for `LAN_IP`. Do not use `localhost` for Expo Go on a physical phone.

## 2. Run everything

```bash
docker compose --env-file .env.docker up --build
```

Services:

- Backend API: `http://localhost:3000`
- Web portal: `http://localhost:5173`
- Expo mobile dev server: `http://localhost:8081`

## Expo Go LAN Mode

The mobile container starts Expo with:

```bash
npx expo start --lan --clear
```

Your phone and computer must be on the same network. If Windows Firewall prompts, allow inbound access to ports `3000`, `8081`, `19000`, `19001`, and `19002`.

## Database

Run the schema once in the Supabase SQL Editor:

```text
apps/backend/supabase/schema.sql
```

To load development demo data, run:

```text
apps/backend/supabase/seed.sql
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
