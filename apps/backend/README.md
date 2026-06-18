# Unvapeify Backend

READ ME B4 U TOUCH OR YOU PC GO BOOM BOOM NO FR FR NGL NGL

Express API backed by Supabase Postgres. It implements the mobile app contract from `apps/mobile/BACKEND_README.md`.

## 1. Create the Supabase database tables

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Paste and run `apps/backend/supabase/schema.sql`.

The schema uses `public.app_users` instead of Supabase Auth users because this app already has a custom username/email/password API contract. The backend connects with the Supabase service role key, while Row Level Security is enabled so browser/mobile clients cannot query these tables directly with the anon key.

## 2. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in:

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key, keep this server-only
- `JWT_SECRET`: a long random string
- `CLIENT_URL`: Expo dev URL or `*` during local testing
- `OPENAI_API_KEY`: optional; when omitted, analytics recommendations use the local clinical rules fallback
- `OPENAI_MODEL`: optional; defaults to `gpt-4o-mini`

## 3. Run locally

```bash
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

## 4. Point both apps to this backend

Web:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Mobile:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

If you test on a physical phone, replace `localhost` with your computer's LAN IP address, for example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:3000
```

## Main routes

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /provider/register`
- `POST /provider/login`
- `GET /provider/me`
- `GET /provider/patients`
- `GET /provider/patients/:patientId/dashboard`
- `GET /provider/patients/:patientId/profile`
- `GET /provider/messages`
- `PUT /user/role`
- `PATCH /user/profile`
- `POST /mood`
- `GET /mood`
- `DELETE /mood/:id`
- `GET /analytics/dashboard`
- `GET /analytics/weekly-report`
- `POST /analytics/quote`

## Analytics model behavior

Dashboard and weekly-report recommendations use a hybrid prediction flow:

- `naive_bayes` is used for cold start predictions from the seeded clinical cessation dataset.
- `arm` association-rule mining is used after the user has at least 20 mood logs and the strongest personal rule meets the confidence threshold.
- If ARM does not have enough support/confidence yet, the API keeps using Naive Bayes and returns the ARM attempt as fallback metadata.
- `POST /connections/request`
- `PATCH /connections/:requestId`
- `DELETE /connections`
- `GET /connections/peer-user`
- `GET /connections/pending`
- `GET /messages/:withUserId`
- `POST /messages`
- `GET /notifications`
- `PATCH /notifications/read-all`
- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `DELETE /auth/2fa`

## Production notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to React, React Native, or Vite.
- `POST /auth/send-otp` currently returns `devOtp` outside production. Wire it to Semaphore, Twilio, Vonage, or another SMS provider before launch.
- Realtime messaging is stored in the database, but Socket.io/Supabase Realtime has not been added yet.
