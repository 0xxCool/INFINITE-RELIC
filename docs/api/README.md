# INFINITE RELIC API Documentation

Comprehensive REST API documentation for the INFINITE RELIC Telegram Mini-App backend.

## 📚 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
- [Interactive Documentation](#interactive-documentation)
- [Error Handling](#error-handling)
- [Examples](#examples)

## 🌟 Overview

The INFINITE RELIC API provides backend services for the Telegram Mini-App, including:

- **User Management**: Profile statistics and referral tracking
- **Quest System**: Daily quests and reward claiming
- **Claims Tracking**: Yield claim history and recording

**Base URLs:**
- Production: `https://api.relic-chain.io/v1`
- Development: `http://localhost:3000`

**Format:** JSON
**Protocol:** HTTPS (Production), HTTP (Development)

## 🔐 Authentication

All API endpoints require **Telegram WebApp Authentication** via the `x-telegram-init-data` header.

### How It Works

The server validates Telegram WebApp init data using HMAC-SHA256 signature verification:

1. **Client Side**: Obtain init data from Telegram WebApp
   ```javascript
   const initData = window.Telegram.WebApp.initData;
   ```

2. **Include in Request Header**:
   ```
   x-telegram-init-data: query_id=AAH...&user={"id":123456789,...}&auth_date=1234567890&hash=abc123...
   ```

3. **Server Side Validation**:
   - Parse init data as URL parameters
   - Extract `hash` parameter
   - Create data-check-string from remaining parameters (sorted alphabetically)
   - Calculate secret key: `HMAC-SHA256("WebAppData", BOT_TOKEN)`
   - Calculate hash: `HMAC-SHA256(data-check-string, secret_key)`
   - Compare calculated hash with provided hash

### Example Request

```bash
curl -X GET https://api.relic-chain.io/v1/user/123456789/stats \
  -H "x-telegram-init-data: query_id=AAH...&user={...}&auth_date=1234567890&hash=abc123..." \
  -H "Content-Type: application/json"
```

### Authentication Errors

**401 Unauthorized**:
```json
{
  "statusCode": 401,
  "message": "Invalid Telegram authentication",
  "error": "Unauthorized"
}
```

## ⏱️ Rate Limiting

Protection against abuse and ensure fair usage.

**Limits:**
- **100 requests per 15 minutes** per IP address
- Limits apply across all endpoints

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705329600
```

**Rate Limit Exceeded (429)**:
```json
{
  "statusCode": 429,
  "message": "Too many requests from this IP",
  "error": "Too Many Requests",
  "retryAfter": 420
}
```

**Retry After**: Wait for the number of seconds specified in `retryAfter` or `Retry-After` header.

## 📡 API Endpoints

### User Endpoints

#### Get User Statistics
```
GET /user/{userId}/stats
```

Retrieve comprehensive statistics for a user.

**Parameters:**
- `userId` (path, required): Telegram user ID

**Response (200)**:
```json
{
  "userId": "123456789",
  "username": "johndoe",
  "firstName": "John",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "stats": {
    "totalQuests": 50,
    "completedQuests": 35,
    "totalEarned": 125.5,
    "referralCount": 7,
    "referralCode": "REL-ABC123"
  }
}
```

#### Get Referral Link
```
GET /user/{userId}/referral-link
```

Generate user's unique referral link.

**Parameters:**
- `userId` (path, required): Telegram user ID

**Response (200)**:
```json
{
  "referralCode": "REL-ABC123",
  "referralLink": "https://t.me/infiniterelic_bot?start=REL-ABC123"
}
```

### Quest Endpoints

#### Get Available Quests
```
GET /quests
```

Retrieve all available quests for a user.

**Request Body**:
```json
{
  "userId": "123456789"
}
```

**Response (200)**:
```json
[
  {
    "id": 42,
    "userId": "123456789",
    "type": "DAILY_CHECKIN",
    "reward": 0.5,
    "status": "AVAILABLE",
    "cooldownEnd": "2024-01-16T09:00:00.000Z",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "claimedAt": null
  }
]
```

#### Claim Quest Reward
```
POST /quests/{id}/claim
```

Claim reward for a completed quest.

**Parameters:**
- `id` (path, required): Quest ID

**Request Body**:
```json
{
  "userId": "123456789"
}
```

**Response (200)**:
```json
{
  "success": true,
  "reward": 0.5,
  "message": "Successfully claimed 0.5 $YIELD"
}
```

**Errors**:
- `400`: Quest not found, already claimed, or expired
- `404`: Quest does not exist

### Claims Endpoints

#### Get Claim History
```
GET /claims?userId=123456789
```

Retrieve claim history (max 100 most recent).

**Query Parameters:**
- `userId` (optional): Filter by user ID

**Response (200)**:
```json
{
  "claims": [
    {
      "id": 123,
      "userId": "123456789",
      "amount": 25.5,
      "txHash": "0x1234567890abcdef...",
      "createdAt": "2024-01-15T14:30:00.000Z",
      "user": {
        "id": "123456789",
        "username": "johndoe",
        "firstName": "John"
      }
    }
  ],
  "total": 25,
  "totalAmount": 567.5
}
```

#### Create Claim Record
```
POST /claims
```

Record a new yield claim from blockchain.

**Request Body**:
```json
{
  "userId": "123456789",
  "amount": 25.5,
  "txHash": "0x1234567890abcdef..."
}
```

**Response (200)**:
```json
{
  "success": true,
  "claim": {
    "id": 123,
    "userId": "123456789",
    "amount": 25.5,
    "txHash": "0x1234567890abcdef...",
    "createdAt": "2024-01-15T14:30:00.000Z"
  }
}
```

## 🌐 Interactive Documentation

View and test the API interactively using Swagger UI:

### Option 1: Swagger Editor (Online)

1. Visit [editor.swagger.io](https://editor.swagger.io/)
2. File → Import File
3. Select `docs/api/openapi.yaml`
4. Explore and test endpoints

### Option 2: Local Swagger UI (Docker)

```bash
# From project root
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/api/openapi.yaml \
  -v $(pwd)/docs/api/openapi.yaml:/api/openapi.yaml \
  swaggerapi/swagger-ui

# Open browser
open http://localhost:8080
```

### Option 3: Redoc (Alternative)

```bash
npx @redocly/cli preview-docs docs/api/openapi.yaml
```

## ❌ Error Handling

The API uses standard HTTP status codes:

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid input or request |
| 401 | Unauthorized | Authentication failed |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

**Error Response Format**:
```json
{
  "statusCode": 400,
  "message": "Detailed error message",
  "error": "Error Type"
}
```

## 📝 Examples

### JavaScript/TypeScript (Telegram Mini-App)

```typescript
// Get user stats
async function getUserStats(userId: string) {
  const initData = window.Telegram.WebApp.initData;

  const response = await fetch(`https://api.relic-chain.io/v1/user/${userId}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Claim quest
async function claimQuest(questId: number, userId: string) {
  const initData = window.Telegram.WebApp.initData;

  const response = await fetch(`https://api.relic-chain.io/v1/quests/${questId}/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}
```

### Python

```python
import requests

def get_user_stats(user_id: str, init_data: str):
    """Get user statistics."""
    response = requests.get(
        f"https://api.relic-chain.io/v1/user/{user_id}/stats",
        headers={
            "Content-Type": "application/json",
            "x-telegram-init-data": init_data,
        }
    )
    response.raise_for_status()
    return response.json()

def claim_quest(quest_id: int, user_id: str, init_data: str):
    """Claim a quest reward."""
    response = requests.post(
        f"https://api.relic-chain.io/v1/quests/{quest_id}/claim",
        headers={
            "Content-Type": "application/json",
            "x-telegram-init-data": init_data,
        },
        json={"userId": user_id}
    )
    response.raise_for_status()
    return response.json()
```

### cURL

```bash
# Get user stats
curl -X GET https://api.relic-chain.io/v1/user/123456789/stats \
  -H "x-telegram-init-data: query_id=AAH...&user={...}&hash=abc..." \
  -H "Content-Type: application/json"

# Claim quest
curl -X POST https://api.relic-chain.io/v1/quests/42/claim \
  -H "x-telegram-init-data: query_id=AAH...&user={...}&hash=abc..." \
  -H "Content-Type: application/json" \
  -d '{"userId": "123456789"}'

# Get claims
curl -X GET "https://api.relic-chain.io/v1/claims?userId=123456789" \
  -H "x-telegram-init-data: query_id=AAH...&user={...}&hash=abc..." \
  -H "Content-Type: application/json"
```

## 🔧 Development

### Testing Locally

1. **Start Backend**:
   ```bash
   cd telegram-bot/apps/bot
   npm run start:dev
   ```

2. **Test Endpoints**:
   ```bash
   # Use localhost URL
   curl -X GET http://localhost:3000/user/123456789/stats \
     -H "x-telegram-init-data: ..." \
     -H "Content-Type: application/json"
   ```

### Environment Variables

Required for backend:
```bash
# Bot Configuration
TG_BOT_TOKEN=your_bot_token
TG_BOT_USERNAME=infiniterelic_bot

# Database
DATABASE_URL=postgresql://...

# API
MINI_APP_URL=https://relic-chain.io
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

## 📄 License

MIT License - See [LICENSE](../../LICENSE) for details.

## 🆘 Support

- **Documentation Issues**: [GitHub Issues](https://github.com/0xxCool/INFINITE-RELIC/issues)
- **API Support**: contact@relic-chain.io
- **Community**: [Telegram Community](https://t.me/infiniterelic)

---

**Last Updated**: 2024-01-15
**API Version**: 1.0.0
**OpenAPI Specification**: 3.0.3
