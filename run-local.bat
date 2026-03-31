@echo off
echo Starting Disaster Intel Local Environment...

cd backend
start cmd /k "npm run dev"
echo Backend starting...

cd ../frontend
start cmd /k "npm run dev"
echo Frontend starting...

echo Local development environment is launching.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
