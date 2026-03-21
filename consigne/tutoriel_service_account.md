# 🔧 Tutoriel — Configurer le Service Account Google Calendar

Ce tutoriel vous permet de connecter le robot GitHub Actions à votre calendrier Google **sans OAuth interactif**, de façon sécurisée et pérenne.

**Durée estimée : 15 minutes**

---

## Étape 1 — Créer un projet Google Cloud

1. Allez sur **[console.cloud.google.com](https://console.cloud.google.com)**
2. En haut à gauche, cliquez sur le sélecteur de projet → **"Nouveau projet"**
3. Nom du projet : `barbertour-sync` (ou ce que vous voulez)
4. Cliquez **"Créer"**

---

## Étape 2 — Activer l'API Google Calendar

1. Dans le menu de gauche : **"API et services"** → **"Bibliothèque"**
2. Recherchez **"Google Calendar API"**
3. Cliquez dessus → **"Activer"**

---

## Étape 3 — Créer un Service Account

1. Allez dans **"API et services"** → **"Identifiants"**
2. Cliquez **"+ Créer des identifiants"** → **"Compte de service"**
3. Nom : `robot-barbertour`
4. Cliquez **"Créer et continuer"** → **"Continuer"** → **"OK"**
5. Vous voyez votre Service Account dans la liste. Notez son **adresse email** (ex: `robot-barbertour@barbertour-sync.iam.gserviceaccount.com`)

---

## Étape 4 — Télécharger la clé JSON

1. Cliquez sur le Service Account que vous venez de créer
2. Onglet **"Clés"** → **"Ajouter une clé"** → **"Créer une clé"**
3. Format : **JSON** → **"Créer"**
4. Un fichier `.json` se télécharge automatiquement → **gardez-le précieusement**

> [!CAUTION]
> Ne partagez jamais ce fichier JSON. Ne le commitez pas sur GitHub. Il sera stocké comme Secret chiffré.

---

## Étape 5 — Partager votre calendrier avec le Service Account

1. Ouvrez **[Google Calendar](https://calendar.google.com)**
2. Dans la colonne gauche, trouvez le calendrier qui reçoit les dates de la Compagnie
3. Cliquez les **3 points** à côté → **"Paramètres et partage"**
4. Descendez jusqu'à **"Partager avec des personnes spécifiques"**
5. Cliquez **"+ Ajouter des personnes"**
6. Collez l'**adresse email du Service Account** (étape 3)
7. Permission : **"Voir tous les détails de l'événement"**
8. Cliquez **"Envoyer"**

Récupérez aussi l'**ID du calendrier** : dans la même page, descendez jusqu'à "Intégrer le calendrier" → copiez l'**ID du calendrier** (ressemble à `votrenom@gmail.com`).

---

## Étape 6 — Ajouter les Secrets dans GitHub

1. Allez sur **[github.com/leleuyann33/Barbertour/settings/secrets/actions](https://github.com/leleuyann33/Barbertour/settings/secrets/actions)**
2. Cliquez **"New repository secret"**

**Secret 1 — La clé JSON :**
- Nom : `GOOGLE_SERVICE_ACCOUNT_KEY`
- Valeur : ouvrez le fichier `.json` téléchargé, **copiez tout le contenu** et collez-le ici
- Cliquez **"Add secret"**

**Secret 2 — L'ID du calendrier :**
- Nom : `CALENDAR_ID`
- Valeur : l'ID du calendrier copié à l'étape 5 (ex: `leleuyanntv@gmail.com`)
- Cliquez **"Add secret"**

---

## Étape 7 — Tester le robot

Une fois les secrets ajoutés, déclencher manuellement le workflow :

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" workflow run sync.yml --repo leleuyann33/Barbertour
```

Ou depuis le navigateur : [github.com/leleuyann33/Barbertour/actions](https://github.com/leleuyann33/Barbertour/actions) → "Sync Tour Dates" → "Run workflow".

Vérifier que la date DUNKERQUE est arrivée :

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" run watch --repo leleuyann33/Barbertour
git pull
Select-String "DUNKERQUE" dates.json
```

---

## ✅ Récapitulatif de ce qui a été mis en place

Le code a déjà été mis à jour :
- `sync_calendar.py` → utilise maintenant le Service Account
- `.github/workflows/sync.yml` → passe les secrets en variables d'environnement

**Il ne reste plus qu'à faire les étapes 1 à 6 ci-dessus !**
