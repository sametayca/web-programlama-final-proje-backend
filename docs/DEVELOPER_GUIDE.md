# Developer Guide

## Project Structure
```
/src
  /controllers  # Request handlers
  /models       # Sequelize models
  /routes       # Express routes
  /services     # Business logic
  /jobs         # Background tasks
  /config       # Configuration (DB, Logger)
```

## Code Style
- Use Async/Await.
- Use `logger` instead of `console.log`.
- Services should handle business logic; Controllers should handle HTTP.

## Testing
- Run tests: `npm test`
- Framework: Jest & Supertest.
