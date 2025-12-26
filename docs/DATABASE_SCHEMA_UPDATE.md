# Database Schema Update - Part 2

## New Tables

### Courses
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| code | VARCHAR | e.g. CS101 |
| name | VARCHAR | Course name |
| facultyId | UUID | FK to Users |

### AttendanceSessions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| courseId | UUID | FK |
| latitude | DOUBLE | Geofence center |
| longitude | DOUBLE | Geofence center |
| radius | INTEGER | in meters |
| isActive | BOOLEAN | Session status |

### AttendanceRecords
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| sessionId | UUID | FK |
| studentId | UUID | FK |
| checkInTime | TIMESTAMP | Time of check-in |
| status | ENUM | present, late, absent |
