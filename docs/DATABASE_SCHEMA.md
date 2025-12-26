# Database Schema (Complete & Consolidated)

## Core Tables

### Users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| firstName | VARCHAR | |
| lastName | VARCHAR | |
| email | VARCHAR | Unique, .edu.tr |
| password | VARCHAR | Hashed |
| role | ENUM | student, faculty, admin |
| profilePicture | VARCHAR | Path to file |
| balance | DECIMAL | Wallet balance |

## Academic Module

### Departments
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR | e.g. Computer Engineering |
| code | VARCHAR | e.g. CENG |

### Courses
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| code | VARCHAR | e.g. CS101 |
| name | VARCHAR | |
| credits | INT | |

### Enrollments
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| studentId | UUID | FK -> Users |
| courseId | UUID | FK -> Courses |
| grade | VARCHAR | A, B, C... |

### AttendanceSessions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| instructorId | UUID | FK -> Users |
| latitude | FLOAT | |
| longitude | FLOAT | |
| radius | INT | |
| isActive | BOOLEAN | |

### AttendanceRecords
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| sessionId | UUID | FK |
| studentId | UUID | FK |
| status | ENUM | present, late, absent |

## Campus Module

### MealMenus
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| date | DATE | |
| mainDish | VARCHAR | |
| sideDish | VARCHAR | |
| soup | VARCHAR | |

### MealReservations
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK |
| mealId | UUID | FK |
| eaten | BOOLEAN | |

### Events
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| title | VARCHAR | |
| startDate | DATETIME | |
| quota | INT | |

## IoT Module

### Sensors
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| type | ENUM | temperature, occupancy, energy |
| location | VARCHAR | |
| status | ENUM | active, inactive |

### SensorData
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| sensorId | UUID | FK |
| value | FLOAT | |
| timestamp | DATETIME | |

## Notifications Module

### Notifications
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK |
| title | VARCHAR | |
| message | TEXT | |
| type | ENUM | info, warning, success |
| isRead | BOOLEAN | |

### NotificationPreferences
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK |
| email_academic | BOOLEAN | |
| push_academic | BOOLEAN | |
| ... | ... | Other flags |
