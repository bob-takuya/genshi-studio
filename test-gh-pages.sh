#!/bin/bash

# Test GitHub Pages deployment locally
echo "Building for production..."
npm run build

echo -e "\nStarting local server to test GitHub Pages deployment..."
echo "The app will be served at http://localhost:8080/genshi-studio/"
echo "Press Ctrl+C to stop the server"

cd dist
python3 -m http.server 8080