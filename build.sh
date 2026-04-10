#!/bin/bash
set -e

echo ">>> Starting Build Process <<<"

echo "1. Cleaning dist directory..."
rm -rf dist

echo "2. Running TypeScript check..."
./node_modules/.bin/tsc --noEmit

echo "3. Building Frontend (Vite)..."
./node_modules/.bin/vite build

echo "4. Building Backend (esbuild)..."
./node_modules/.bin/esbuild server.ts --bundle --platform=node --target=node22 --outfile=dist/server.js --format=esm --packages=external

echo ">>> Build Completed Successfully <<<"
