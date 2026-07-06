@echo off
echo Lancement du serveur ET du tunnel Barber...
echo.

echo 1. Lancement du serveur sur le port 8002...
start "Serveur Barber" cmd /k npx -y serve -p 8002

echo 2. Lancement du tunnel (ready-geckos-know)...
start "Tunnel Barber" cmd /c npx -y localtunnel --port 8002 --subdomain ready-geckos-know

echo.
echo ========================================================
echo ✅ Les deux fenetres sont ouvertes. NE LES FERMEZ PAS !
echo 🌍 Public : https://ready-geckos-know.loca.lt
echo 🏠 Local  : http://localhost:8002
echo ========================================================
echo.
pause
