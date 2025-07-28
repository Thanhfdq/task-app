#!/usr/bin/env bash
# This script is used to start the development environment for the project.
cd ~/project/task-app/backend
if [ -d "node_modules" ]; then
  echo "Node modules already installed."
else
  echo "Installing node modules..."
  npm install
fi
echo "Starting the development server..."
npm run dev &
echo "Development server started. You can access it at http://localhost:3000"
echo "To stop the server, use Ctrl+C."

# Run the frontend server
cd ~/project/task-app/frontend
if [ -d "node_modules" ]; then
  echo "Node modules already installed for frontend."
else
  echo "Installing node modules for frontend..."
  npm install
fi
echo "Starting the frontend server..."
npm run dev &
echo "Frontend server started. You can access it at http://localhost:5173"
echo "To stop the frontend server, use Ctrl+C."
echo "Development environment setup complete."
echo "You can now start developing your application."
echo "Remember to check the logs for any errors during startup."
echo "Happy coding!"