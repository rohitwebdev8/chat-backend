# Chat Notification Backend

Express + TypeScript backend service for managing Expo Push Tokens and dispatching cross-device push notifications via the Expo Push Service for the PulseChat mobile application.

---

## Version & Runtime

| Component | Version / Specification |
| :--- | :--- |
| **Application Version** | `1.0.0` |
| **Node.js** | `>=18.0.0` |
| **TypeScript** | `^5.4.5` |
| **Express** | `^4.19.2` |
| **Push Delivery SDK** | `expo-server-sdk ^3.10.0` |
| **Package Manager** | `npm` |

---

## Backend Responsibilities

### What This Backend Does

- **Health Monitoring**: Exposes `/` and `/health` endpoints for status checks and hosting uptime pinging.
- **Push Token Registration**: Accepts and validates Expo Push Tokens (`ExponentPushToken[...]`).
- **Push Token Unregistration**: Removes Expo push tokens when devices unregister or log out.
- **Sender Exclusion**: Excludes the sending device's push token from notification target lists so users never receive push notifications for their own sent messages.
- **Notification Formatting**: Formats text and voice notification titles, bodies, and deep-link payload data (`roomId`, `roomName`, `messageType`).
- **Expo Push API Relay**: Chunks and dispatches push notifications through Expo's Push API (`https://exp.host/--/api/v2/push/send`).
- **Token Self-Healing**: Automatically cleans up stale tokens when Expo Push API returns `DeviceNotRegistered`.

### What This Backend Does NOT Do

- ❌ **Does NOT store chat messages**: Firebase Firestore is the single source of truth for message history and room metadata.
- ❌ **Does NOT store voice files**: Firebase Storage hosts audio recordings.
- ❌ **Does NOT use Firebase Admin SDK**: Firebase client operations run directly from the React Native app.
- ❌ **Does NOT block messaging**: Push notification failures are isolated and will never affect Firestore real-time message delivery.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | Node.js |
| **Framework** | Express (`^4.19.2`) |
| **Language** | TypeScript (`^5.4.5`, `ES2022`, `NodeNext`) |
| **Development Runner** | `tsx` (`^4.7.2`) |
| **Push Delivery** | `expo-server-sdk` (`^3.10.0`) |
| **Configuration** | `dotenv` (`^16.4.5`) |
| **CORS Middleware** | `cors` (`^2.8.5`) |
| **Deployment** | Render Web Service |

---

## System Architecture

```text
React Native App (PulseChat)
│
├── Firestore DB (Source of Truth)
│     └── Chat messages & rooms (/rooms/{roomId}/messages)
│
├── Firebase Storage
│     └── Audio recording files (.m4a)
│
└── Node.js / Express Backend (chatBackend)
      │
      └── Expo Push API (https://exp.host/--/api/v2/push/send)
            │
            └── Recipient Mobile Devices (APNs / FCM)
```

---

## Backend Architecture

Incoming HTTP requests follow a clean 4-tier layer pattern:

```text
HTTP Request
   ↓
Routes (src/routes/notification.routes.ts)
   ↓
Controllers (src/controllers/notification.controller.ts)
   ↓
Services (src/services/notification.service.ts)
   ↓
Token Store (src/stores/token.store.ts) & Expo Push API
```

- **Routes**: Defines URL patterns (`/register`, `/unregister`, `/send`).
- **Controllers**: Handles request validation (ensuring string presence of `roomId`, `senderToken`, `messageType`) and error delegation.
- **Services**: Manages Expo SDK instance (`new Expo()`), token validation (`Expo.isExpoPushToken`), payload construction, chunking, and ticket inspection.
- **Token Store**: Encapsulates `InMemoryTokenStore` using a thread-safe `Set<string>` with automated token masking (`ExponentPushToken[...abcd]`).
- **Middleware**: Centralized error middleware handling unexpected runtime failures.

---

## Project Structure

```text
chatBackend/
├── src/
│   ├── config/
│   │   └── env.ts                     # Environment configuration loader
│   ├── controllers/
│   │   └── notification.controller.ts  # HTTP request validation & handlers
│   ├── middleware/
│   │   └── error.middleware.ts        # Centralized 500 error handler
│   ├── routes/
│   │   └── notification.routes.ts      # Express router definitions
│   ├── services/
│   │   └── notification.service.ts    # Expo push delivery & chunking logic
│   ├── stores/
│   │   └── token.store.ts             # In-memory push token storage & masking
│   ├── types/
│   │   └── notification.types.ts      # TypeScript interfaces & DTO contracts
│   ├── app.ts                         # Express application & middleware setup
│   └── server.ts                      # Server entrypoint & port binding
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repository-url>
cd chatBackend
npm install
```

### 2. Environment Setup

Copy `.env.example` to create `.env`:

```bash
cp .env.example .env
```

Configured environment variables in `.env`:

```env
PORT=3000
NODE_ENV=development
```

- `PORT`: Local HTTP port (defaults to `3000` if omitted; overridden by `process.env.PORT` on Render).
- `NODE_ENV`: Application mode (`development` or `production`).

---

## Build & Run Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts TypeScript server in watch mode using `tsx`. |
| `npm run build` | Compiles TypeScript source (`src/`) into JavaScript (`dist/`). |
| `npm start` | Runs compiled server (`node dist/server.js`). |
| `npm run typecheck` | Validates TypeScript types without emitting build files. |

---

## API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root server status endpoint. |
| `GET` | `/health` | Health check endpoint. |
| `POST` | `/api/notifications/register` | Registers an Expo Push Token. |
| `DELETE` | `/api/notifications/unregister` | Unregisters an Expo Push Token. |
| `POST` | `/api/notifications/send` | Dispatches a text or voice push notification. |

---

## API Documentation

### 1. Health Check

`GET /health`

**Example Request**:
```bash
curl -X GET http://localhost:3000/health
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Chat notification server is running"
}
```

---

### 2. Register Push Token

`POST /api/notifications/register`

**Request Body**:
```json
{
  "token": "ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]"
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Push token registered successfully"
}
```

**Validation Error (`400 Bad Request`)**:
```json
{
  "success": false,
  "message": "Invalid Expo push token format"
}
```

---

### 3. Unregister Push Token

`DELETE /api/notifications/unregister`

**Request Body**:
```json
{
  "token": "ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]"
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Push token unregistered successfully"
}
```

---

### 4. Send Text Notification

`POST /api/notifications/send`

**Request Body**:
```json
{
  "roomId": "General",
  "roomName": "General Chat",
  "senderName": "Rahul S.",
  "senderToken": "ExponentPushToken[SENDER_TOKEN_HERE]",
  "messageType": "text",
  "text": "Hello team!"
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Notification processing completed",
  "data": {
    "sent": 1,
    "recipientCount": 1
  }
}
```

---

### 5. Send Voice Notification

`POST /api/notifications/send`

**Request Body**:
```json
{
  "roomId": "General",
  "roomName": "General Chat",
  "senderName": "Rahul S.",
  "senderToken": "ExponentPushToken[SENDER_TOKEN_HERE]",
  "messageType": "voice"
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Notification processing completed",
  "data": {
    "sent": 1,
    "recipientCount": 1
  }
}
```

---

## Notification Deep-Link Payload Contract

Notifications dispatched to Expo contain the following payload in `notification.request.content.data`:

```json
{
  "roomId": "General",
  "roomName": "General Chat",
  "messageType": "text"
}
```

> ⚠️ **Frontend Contract Notice**: The React Native application reads `data.roomId` upon notification tap to execute deep-link navigation to `router.push('/chat/' + roomId)`.

---

## End-to-End Execution Flow

### Text Message Flow

1. Phone A sends a text message in `General`.
2. Phone A writes message document to Firestore (`/rooms/General/messages`).
3. After Firestore write succeeds, Phone A sends request to `POST /api/notifications/send`.
4. Backend retrieves active tokens, excludes Phone A's token, and forwards notification to Expo Push API.
5. Phone B receives push notification: **"Rahul S.: Hello team!"**.
6. Phone B taps notification $\rightarrow$ App opens directly to room `General`.

### Voice Message Flow

1. Phone A records voice note (`.m4a`).
2. Phone A uploads file to Firebase Storage $\rightarrow$ receives public HTTPS download URL.
3. Phone A creates voice message document in Firestore.
4. Phone A sends request to `POST /api/notifications/send` with `"messageType": "voice"`.
5. Phone B receives push notification: **"Rahul S.: Voice message"**.

---

## Token Storage Architecture & Limitations

The backend utilizes an **in-memory token store** (`InMemoryTokenStore`).

- **Advantage**: Zero database overhead, instant lookups, zero cost.
- **Operational Limitation**: Stored tokens reside in Node server process memory. If the backend process restarts (e.g. Render server sleep/redeploy), stored tokens reset.
- **Client Handling**: The React Native app automatically re-registers its push token upon every launch (`initNotifications()`), ensuring tokens are re-registered smoothly.

---

## Deployment (Render Web Service)

The service is deployed as a Node Web Service on Render:

- **Deployed URL**: `https://chat-backend-r2cp.onrender.com`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: Render automatically injects `process.env.PORT`, which `src/config/env.ts` binds dynamically.

---

## Security Notes

- **Token Masking**: Push tokens logged in server stdout are automatically masked (`ExponentPushToken[...abcd]`) to protect device identifiers.
- **No Committed Secrets**: `.env` is listed in `.gitignore`.
- **Public API Scope**: `POST /api/notifications/send` is an unauthenticated service endpoint intended for assignment scope. Rate-limiting middleware or API key headers can be added for enterprise production use.

---

## Local Testing Sequence

1. `npm install`
2. `npm run dev`
3. `curl http://localhost:3000/health`
4. Register test device token:
   ```bash
   curl -X POST http://localhost:3000/api/notifications/register \
     -H "Content-Type: application/json" \
     -d '{"token": "ExponentPushToken[TEST_RECIPIENT_TOKEN]"}'
   ```
5. Trigger notification from test sender:
   ```bash
   curl -X POST http://localhost:3000/api/notifications/send \
     -H "Content-Type: application/json" \
     -d '{
       "roomId": "General",
       "roomName": "General Chat",
       "senderName": "Tester",
       "senderToken": "ExponentPushToken[TEST_SENDER_TOKEN]",
       "messageType": "text",
       "text": "Testing backend push relay"
     }'
   ```

---

## Troubleshooting

### `GET /` returns Not Found
Use `GET /health` or `GET /` (both routes are explicitly defined in `src/app.ts`).

### Push Notification Not Received
1. Verify device is a physical iOS/Android device (simulators cannot receive Expo Push Notifications).
2. Check backend terminal logs for `Sent X notifications to Y recipients`.
3. Ensure sender token matches `senderToken` in the payload so the backend knows to exclude the sender.
