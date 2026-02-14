@echo off
echo Starting both servers...

cd /d D:\HellScape_Gdrive\Projects\crimevision-backend
start /b npm run dev

cd /d D:\HellScape_Gdrive\Projects\crimevision-frontend
npm run dev
