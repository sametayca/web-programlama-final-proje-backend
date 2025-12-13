#!/bin/sh
set -e

echo "🚀 Starting backend service..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until npx sequelize-cli db:migrate:status > /dev/null 2>&1; do
  echo "   Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Run migrations
echo "🔄 Running database migrations..."
npx sequelize-cli db:migrate || {
  echo "⚠️ Migration failed, but continuing..."
}

# Run seeds (always run, but skip if already seeded)
echo "🌱 Running database seeds..."
npx sequelize-cli db:seed:all || {
  echo "⚠️ Seed failed or already seeded, but continuing..."
}

# Start the application
echo "🚀 Starting application..."
exec "$@"

