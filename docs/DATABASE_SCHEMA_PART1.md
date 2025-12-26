# Database Schema (Initial) - Part 1

## Entities

### Users
Stores fundamental user information for authentication and role management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| firstName | VARCHAR | NOT NULL | User's first name |
| lastName | VARCHAR | NOT NULL | User's last name |
| email | VARCHAR | UNIQUE, NOT NULL | Institutional email |
| password | VARCHAR | NOT NULL | Hashed password |
| role | ENUM | 'student', 'faculty', 'admin' | User role |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |

## Relationships
- None in Part 1 (Single table structure for initial setup).
