# API Documentation (Complete & Consolidated)

## 1. Authentication

### Login
**URL:** `POST /api/v1/auth/login`
**Authentication:** None
**Description:** Authenticates a user and returns a JWT token.
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | String | Yes | User's email |
| password | String | Yes | User's password |
**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { "id": "uuid", "role": "admin" }
}
```

### Register
**URL:** `POST /api/v1/auth/register`
**Description:** Registers a new user.
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | String | Yes | First name |
| lastName | String | Yes | Last name |
| email | String | Yes | .edu.tr email |

## 2. Academic Module

### Get Courses
**URL:** `GET /api/v1/courses`
**Authentication:** Required (Bearer Token)
**Authorization:** All
**Description:** Returns a list of all courses.

### Create Attendance Session
**URL:** `POST /api/v1/attendance/sessions`
**Authorization:** Faculty
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| courseId | UUID | Yes | Course ID |
| latitude | Float | Yes | Center Latitude |
| longitude | Float | Yes | Center Longitude |
| radius | Int | Yes | Geofence radius (m) |

### Check-in
**URL:** `POST /api/v1/attendance/check-in`
**Authorization:** Student
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sessionId | UUID | Yes | Active session ID |
| latitude | Float | Yes | Current Latitude |
| longitude | Float | Yes | Current Longitude |

## 3. Campus Life

### Get Menu
**URL:** `GET /api/v1/meals/menu`
**Params:** `date` (YYYY-MM-DD)
**Description:** Returns the meal menu for the specific date.

### Reserve Meal
**URL:** `POST /api/v1/meals/reservations`
**Description:** Reserves a meal and deducts balance.
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| mealId | UUID | Yes | ID of the meal |

## 4. Analytics (Admin)

### Dashboard Stats
**URL:** `GET /api/v1/analytics/dashboard`
**Authorization:** Admin
**Success Response:**
```json
{
  "totalUsers": 1250,
  "activeUsersToday": 456,
  "totalCourses": 120,
  "attendanceRate": 87.5,
  "systemHealth": "healthy"
}
```

### Academic Performance
**URL:** `GET /api/v1/analytics/academic-performance`
**Description:** Returns average GPA by department and pass/fail rates.

## 5. IoT Sensors

### Get Sensors
**URL:** `GET /api/v1/sensors`
**Description:** Lists all active IoT sensors.

### Get Sensor Data
**URL:** `GET /api/v1/sensors/:id/data`
**Params:** `range` (1h, 24h, 7d)
**Success Response:**
```json
{
  "sensorId": "uuid",
  "data": [
    { "value": 24.5, "timestamp": "2025-12-26T10:00:00Z" }
  ]
}
```

## 6. Notifications

### Get Notifications
**URL:** `GET /api/v1/notifications`
**Description:** Returns paginated list of user notifications.

### Mark All Read
**URL:** `PUT /api/v1/notifications/mark-all-read`
**Description:** Marks all pending notifications as read.
