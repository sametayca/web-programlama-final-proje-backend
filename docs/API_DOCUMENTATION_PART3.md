# API Documentation - Part 3 (Campus Life)

## Cafeteria Endpoints

### Get Daily Menu
**URL:** `GET /api/v1/meals/menu`
**Description:** Get menu for specific date.
**Params:** `date=YYYY-MM-DD`

### Reserve Meal
**URL:** `POST /api/v1/meals/reservations`
**Authorization:** Student/Faculty
**Request Body:**
| Field | Type | Description |
|-------|------|-------------|
| mealId | UUID | ID of the meal |
| date | Date | Reservation date |

**Success Response:**
```json
{ "success": true, "balance": 45.50 }
```

## Event Endpoints

### Register for Event
**URL:** `POST /api/v1/events/:id/register`
**Authorization:** Student
**Description:** Registers for an event if capacity allows.
