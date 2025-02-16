#!/bin/bash

# Exit on any error
set -e

echo "Starting build process..."

# Step 1: Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Step 2: Apply database migrations
echo "Applying database migrations..."
python manage.py makemigrations && python manage.py migrate

# Step 3: Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Attempting to create admin user"
python manage.py create_admin

echo "Loading food"
python manage.py load_data --json food.json

echo "Build process completed successfully!"