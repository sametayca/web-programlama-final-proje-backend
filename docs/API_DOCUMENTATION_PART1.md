# API Documentation - Part 1 (Authentication & Users)

## Authentication Endpoints

### Login
**URL:** `POST /api/v1/auth/login`
**Authentication:** None
**Description:** Authenticates a user and returns a JWT token.
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | String | Yes | User's email |
| password | String | Yes | User's password |

**Example Request:**
```json
{
  "email": "admin@kampus.edu.tr",
  "password": "Password123"
}
```
**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "role": "admin" }
}
```

### Register
**URL:** `POST /api/v1/auth/register`
**Authentication:** None
**Description:** Registers a new student or faculty member.
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | String | Yes | First name |
| lastName | String | Yes | Last name |
| email | String | Yes | .edu.tr email |
| password | String | Yes | Strong password |

## User Endpoints

### Get Profile
**URL:** `GET /api/v1/users/profile`
**Authentication:** Required (Bearer Token)
**Description:** Returns the logged-in user's profile information.
**Request Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | String | Yes | Bearer {token} |
