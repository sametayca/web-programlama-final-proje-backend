# API Documentation - Part 2 (Academic & Attendance)

## Academic Endpoints

### Get Courses
**URL:** `GET /api/v1/courses`
**Authentication:** Required
**Description:** Lists available courses.

### Create Attendance Session
**URL:** `POST /api/v1/attendance/sessions`
**Authorization:** Faculty
**Request Body:**
| Field | Type | Description |
|-------|------|-------------|
| courseId | UUID | Course ID |
| latitude | Float | Center latitude |
| longitude | Float | Center longitude |
| radius | Int | Allowed radius (meters) |

## Attendance Endpoints

### Check-in (GPS)
**URL:** `POST /api/v1/attendance/check-in`
**Authorization:** Student
**Request Body:**
| Field | Type | Description |
|-------|------|-------------|
| sessionId | UUID | Active session ID |
| latitude | Float | Student's current lat |
| longitude | Float | Student's current long |

**Success Response:**
```json
{ "success": true, "message": "Attendance recorded successfully" }
```

**Error Response (GPS Fail):**
```json
{ "success": false, "error": "Location verification failed (Distance: 156m)" }
```
