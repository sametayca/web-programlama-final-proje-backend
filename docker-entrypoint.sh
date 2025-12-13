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

# Run seeds if RUN_SEEDS is set to true
if [ "$RUN_SEEDS" = "true" ]; then
  echo "🌱 Running database seeds..."
  npx sequelize-cli db:seed:all || {
    echo "⚠️ Seed failed, but continuing..."
  }
fi

# Start the application
echo "🚀 Starting application..."
exec "$@"

