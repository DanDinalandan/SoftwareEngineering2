# unvapeify — Backend Developer Guide

This document covers every API endpoint, data model, and business rule the
React Native frontend expects. All in-memory logic lives in
`src/context/AuthContext.js` — replace each function with the matching API call.

---

## Tech Stack Recommendation

| Layer       | Suggestion              |
|-------------|-------------------------|
| Runtime     | Node.js 20+             |
| Framework   | Express.js or Fastify   |
| Database    | PostgreSQL              |
| Auth        | JWT (access + refresh)  |
| Real-time   | Socket.io (messaging + notifications) |
| Hosting     | Railway / Render / AWS  |

---

## Base URL

```
https://api.unvapeify.app/v1
```

All endpoints require `Content-Type: application/json`.  
Protected endpoints require `Authorization: Bearer <jwt_token>`.

---

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "string (unique, lowercase)",
  "username": "string (unique, lowercase, min 3 chars)",
  "passwordHash": "string (bcrypt)",
  "role": "Vape User | Peer",
  "firstName": "string",
  "lastName": "string",
  "middleName": "string",
  "suffix": "string",
  "birthday": "string (MM/DD/YYYY)",
  "age": "integer",
  "gender": "Male | Female | Prefer not to say",
  "streak": "integer (days)",
  "totalPoints": "integer",
  "lastRelapseRisk": "integer (0–100)",
  "profileComplete": "boolean",
  "connectedPeerUserId": "uuid | null",
  "connectedVapeUserId": "uuid | null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### MoodLog
```json
{
  "id": "uuid",
  "userId": "uuid (FK → users)",
  "date": "string (YYYY-MM-DD, unique per user)",
  "mood": "Awful | Bad | Okay | Good | Great",
  "triggers": ["Stress", "Boredom", "Social", "Sadness", "After meals", "Other"],
  "craving": "integer (0–10)",
  "vaped": "boolean",
  "relapseRisk": "integer (0–100)",
  "points": "integer",
  "timestamp": "string (display time)",
  "createdAt": "timestamp"
}
```

### ConnectionRequest
```json
{
  "id": "uuid",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "status": "pending | accepted | rejected",
  "createdAt": "timestamp"
}
```

### Message
```json
{
  "id": "uuid",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "text": "string",
  "timestamp": "string",
  "createdAt": "timestamp"
}
```

### Notification
```json
{
  "id": "uuid",
  "toUserId": "uuid",
  "type": "high_risk | vaped | connection_request | connection_accepted",
  "message": "string",
  "requestId": "uuid | null",
  "read": "boolean",
  "timestamp": "string",
  "createdAt": "timestamp"
}
```

---

## Endpoints

### Auth

#### POST /auth/register
Create account and return JWT.

**Body:**
```json
{
  "email": "user@email.com",
  "username": "juandc",
  "password": "password123",
  "role": "Vape User"
}
```
**Response 201:**
```json
{ "token": "jwt", "user": { ...User } }
```
**Errors:** 409 if email/username taken.

---

#### POST /auth/login
**Body:**
```json
{
  "identifier": "email or username",
  "password": "password123",
  "role": "Vape User"
}
```
**Response 200:**
```json
{ "token": "jwt", "user": { ...User } }
```
**Errors:** 401 wrong credentials, 403 role mismatch.

---

#### GET /auth/me *(protected)*
Returns current user object.

---

### User Profile

#### PATCH /user/profile *(protected)*
Save details after sign-up.

**Body:**
```json
{
  "firstName": "Juan",
  "lastName": "dela Cruz",
  "middleName": "Santos",
  "suffix": "",
  "birthday": "01/15/2000",
  "age": 25,
  "gender": "Male"
}
```
**Response 200:** Updated user object.

---

### Mood Logs

#### POST /mood *(protected)*
Log today's mood entry. Returns 409 if already logged today.

**Body:**
```json
{
  "mood": "Good",
  "triggers": ["Stress", "Boredom"],
  "craving": 4,
  "vaped": false
}
```
**Response 201:**
```json
{
  "entry": { ...MoodLog },
  "pointsEarned": 25,
  "newStreak": 3,
  "relapseRisk": 28
}
```

**Business rules (match frontend):**
- `relapseRisk = (craving/10 * 100 * 0.5) + (moodRisk * 0.3) + (min(triggers.length * 15, 60) * 0.2)`
- moodRisk scores: `{ Great:0, Good:10, Okay:30, Bad:60, Awful:80 }`
- Points: `10 base + 15 if !vaped`
- Streak: `streak++ if !vaped`, else `streak = 0`
- Trigger notifications to peer if: `relapseRisk > 60` OR `mood in ['Awful','Bad']` OR `vaped === true`

---

#### GET /mood *(protected)*
Returns all mood logs for current user.

---

#### DELETE /mood/:id *(protected)*
Delete a log entry. Also reverses points and streak.

**Response 200:**
```json
{ "message": "Log deleted", "pointsReversed": 25, "newStreak": 2 }
```

---

### Connections

#### POST /connections/request *(protected)*
Send a connection request from Peer → Vape User or vice versa.

**Body:**
```json
{ "toUsername": "juandc" }
```
**Errors:** 404 user not found, 409 already connected/request pending, 400 role mismatch.

---

#### PATCH /connections/:requestId *(protected)*
Accept or reject a request.

**Body:** `{ "accept": true }`

On accept: links `connectedPeerUserId` ↔ `connectedVapeUserId` on both users.

---

#### DELETE /connections *(protected)*
Disconnect from current peer/vape-user. Clears both sides.

---

#### GET /connections/peer-user *(protected — Peer only)*
Returns the connected Vape User's full profile + mood logs + relapse risk.

```json
{
  "user": { ...User },
  "moodLogs": [ ...MoodLog ],
  "lastRelapseRisk": 45
}
```

---

### Messages

#### GET /messages/:withUserId *(protected)*
Returns conversation history between current user and `withUserId`.

#### POST /messages *(protected)*
Send a message.

**Body:** `{ "toUserId": "uuid", "text": "Hey, how are you?" }`

**Real-time:** emit `new_message` via Socket.io to recipient's room.

---

### Notifications

#### GET /notifications *(protected)*
Returns all notifications for current user, newest first.

#### PATCH /notifications/read-all *(protected)*
Marks all notifications as read.

---

## Relapse Risk Algorithm

```
moodRisk = { Great:0, Good:10, Okay:30, Bad:60, Awful:80 }[mood]
cravingRisk = (craving / 10) * 100
triggerRisk = min(triggers.length * 15, 60)

relapseRisk = round(
  cravingRisk * 0.50 +
  moodRisk    * 0.30 +
  triggerRisk * 0.20
)
// Clamped 0–100
```

---

## Real-time Events (Socket.io)

| Event               | Emitted by | Received by | Payload                          |
|---------------------|-----------|------------|----------------------------------|
| `new_message`       | sender    | recipient  | `{ message: Message }`           |
| `new_notification`  | server    | peer       | `{ notification: Notification }` |
| `mood_logged`       | server    | peer       | `{ log: MoodLog, risk: int }`    |

Rooms: each user joins room `user:<userId>` on socket connection.

---

## Notification Triggers

| Event                            | Notifies  | Type                |
|----------------------------------|-----------|---------------------|
| User logs mood Bad/Awful         | Peer      | `high_risk`         |
| User's relapseRisk > 60          | Peer      | `high_risk`         |
| User logs vaped = true           | Peer      | `vaped`             |
| Peer sends connection request    | VapeUser  | `connection_request`|
| VapeUser accepts request         | Peer      | `connection_accepted`|

---

## Environment Variables

```env
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/vapeoff
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CLIENT_URL=http://localhost:8081
```

---

## Frontend ↔ Backend Function Map

| Frontend (`AuthContext.js`) | Backend Endpoint              |
|-----------------------------|-------------------------------|
| `register()`                | `POST /auth/register`         |
| `login()`                   | `POST /auth/login`            |
| `saveDetails()`             | `PATCH /user/profile`         |
| `logMoodEntry()`            | `POST /mood`                  |
| `deleteLogEntry(id)`        | `DELETE /mood/:id`            |
| `sendConnectionRequest()`   | `POST /connections/request`   |
| `respondToRequest(id, bool)`| `PATCH /connections/:id`      |
| `disconnect()`              | `DELETE /connections`         |
| `sendMessage(to, text)`     | `POST /messages`              |
| `getMessages(with)`         | `GET /messages/:withUserId`   |
| `getNotifications()`        | `GET /notifications`          |
| `markAllRead()`             | `PATCH /notifications/read-all`|
| `getConnectedVapeUser()`    | `GET /connections/peer-user`  |

---

## AsyncStorage Keys (Frontend — for JWT persistence)

```
@vapeoff/token    ← JWT string
@vapeoff/user     ← JSON stringified user object (for offline cache)
```

After logging in, store the token:
```js
await AsyncStorage.setItem('@vapeoff/token', token);
```
Include on every request:
```js
headers: { Authorization: `Bearer ${token}` }
```

---

## New Endpoints (Phase 2)

### Goals

#### PUT /user/goal *(protected)*
Set or update user's quit goal.

**Body:**
```json
{
  "presetId": "hard",
  "label": "Hard",
  "dailyPuffLimit": 5,
  "weeklyGoal": "Reduce by 50%",
  "tips": ["Keep your vape out of reach"],
  "color": "#E07070",
  "setAt": "01/01/2026"
}
```
**Response 200:** Updated user object.

---

### 2FA & Security

#### POST /auth/send-otp *(protected)*
Send a 6-digit OTP to the user's phone number.

**Body:** `{ "phone": "+639171234567" }`
**Response 200:** `{ "message": "OTP sent" }`

Note: Integrate with SMS provider (Twilio, Vonage, or local PH providers like Semaphore, Itexmo).

---

#### POST /auth/verify-otp *(protected)*
Verify the OTP and enable 2FA.

**Body:** `{ "otp": "123456" }`
**Response 200:** `{ "message": "2FA enabled", "twoFAEnabled": true }`
**Error 400:** `{ "error": "Invalid or expired OTP" }`

OTP should expire after 10 minutes. Store in Redis or a temp DB table.

---

#### DELETE /auth/2fa *(protected)*
Disable 2FA.

**Response 200:** `{ "twoFAEnabled": false }`

---

#### PATCH /user/phone *(protected)*
Update phone number.

**Body:** `{ "phone": "+639171234567" }`
**Response 200:** Updated user object.

---

### Age Validation

Enforce 18–99 age limit server-side in `POST /auth/register` and `PATCH /user/profile`:

```javascript
const age = calculateAge(birthday); // from birthday field
if (age < 18) return res.status(400).json({ error: 'Must be at least 18 years old.' });
if (age > 99) return res.status(400).json({ error: 'Age must be 99 or below.' });
```

---

### Updated User Model (additions)

```json
{
  "phone": "string | null",
  "twoFAEnabled": "boolean (default false)",
  "goal": {
    "presetId": "string",
    "label": "string",
    "dailyPuffLimit": "integer",
    "weeklyGoal": "string",
    "tips": ["string"],
    "color": "string (hex)",
    "setAt": "string (date)"
  } | null
}
```

---

### SMS Provider Integration (Philippines)

Recommended local providers:
- **Semaphore** — semaphore.co (popular in PH, PHP-friendly)
- **Itexmo** — itexmo.com
- **Vonage** (global, supports PH numbers)

Semaphore example:
```javascript
const axios = require('axios');
await axios.post('https://api.semaphore.co/api/v4/messages', {
  apikey: process.env.SEMAPHORE_API_KEY,
  number: phone,
  message: `Your VapeOff verification code is: ${otp}`,
  sendername: 'VapeOff',
});
```

---

### Updated Frontend ↔ Backend Map (additions)

| Frontend (`AuthContext.js`) | Backend Endpoint            |
|-----------------------------|-----------------------------|
| `setGoal(goal)`             | `PUT /user/goal`            |
| `update2FA(enabled, phone)` | `POST /auth/verify-otp` or `DELETE /auth/2fa` |
| Phone save in SecurityScreen| `PATCH /user/phone` + `POST /auth/send-otp` |
