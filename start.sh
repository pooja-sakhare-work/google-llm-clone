#!/bin/bash

# Start Django backend
echo "Starting Django backend..."
cd backend
source venv/bin/activate
python manage.py runserver &
DJANGO_PID=$!

# Start React frontend
echo "Starting React frontend..."
cd ../frontend
npm start &
REACT_PID=$!

echo "Both servers are starting..."
echo "Django backend: http://localhost:8000"
echo "React frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
trap "echo 'Stopping servers...'; kill $DJANGO_PID $REACT_PID; exit" INT
wait 