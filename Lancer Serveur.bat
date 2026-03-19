@echo off
echo Lancement du serveur local pour la Carte Barber...
echo Une fois lance, gardez cette fenetre ouverte.
echo.
echo Accedez a la carte ici : http://localhost:8000
echo.
python -m http.server 8000
pause
