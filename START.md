# 🚀 Démarrage de l'application 100 Challenges

## ✅ Installation terminée !

L'application complète est prête avec :
- ✨ **Branding or/blanc/noir** (#D4AF37, #FFFFFF, #000000)
- 🇫🇷 **Français par défaut** (avec support anglais)
- 🛡️ **Modération complète** (flag, hide, approve, delete photos)
- 🔗 **Partage social** (WhatsApp, Instagram, Facebook, Twitter + OG tags)
- 🔒 **Sécurité renforcée** (JWT, bcrypt, rate limiting, validation)

## 📋 Étapes de démarrage

### 1. Initialiser la base de données

```bash
npm run init-db
```

Cela va créer :
- La base SQLite avec toutes les tables
- 5 thématiques avec 25 défis
- Le compte admin par défaut

### 2. Démarrer les serveurs

**Option A : Mode développement (recommandé)**
```bash
npm run dev
```
Lance les 2 serveurs simultanément avec auto-reload.

**Option B : Mode production**
```bash
# Terminal 1 - Serveur utilisateur
npm start

# Terminal 2 - Serveur admin
npm run start:admin
```

### 3. Accéder à l'application

- **Front utilisateur** : http://localhost:3000
- **Back office admin** : http://localhost:3001

## 🔐 Compte Admin par défaut

- **Email** : `admin@besuccess.com`
- **Mot de passe** : `Admin123!`

⚠️ **IMPORTANT** : Changez ces identifiants en production !

## 🎯 Fonctionnalités implémentées

### Front Office (Port 3000)
- ✅ Authentification JWT sécurisée
- ✅ 25 défis en 5 thématiques colorées
- ✅ Upload photos (5MB max, auto-resize 800x600)
- ✅ Galerie publique par défi
- ✅ Lightbox avec navigation clavier
- ✅ Système de points et progression
- ✅ Profil utilisateur avec stats
- ✅ **Partage social natif** (navigator.share + fallback)
- ✅ **Pages OG tags** pour previews riches (/p/:photoId)
- ✅ **Signalement de photos** (auto-hide après 3 flags)
- ✅ Interface responsive mobile-first
- ✅ i18n FR/EN avec toggle

### Back Office Admin (Port 3001)
- ✅ Dashboard avec statistiques temps réel
- ✅ Gestion utilisateurs (ban, reset, delete)
- ✅ **Modération photos complète** :
  - Filtres : Toutes / Signalées / Masquées
  - Actions : Approuver / Masquer / Supprimer
  - Reset des signalements
  - Affichage des raisons de signalement
- ✅ Création thématiques et défis
- ✅ Journal d'audit complet
- ✅ Protection admin principal

### Sécurité
- ✅ JWT avec expiration 7 jours
- ✅ Bcrypt (10 rounds)
- ✅ Helmet headers
- ✅ CORS configuré
- ✅ Rate limiting (100 req/15min user, 50 req/15min admin)
- ✅ Validation stricte uploads
- ✅ Sanitization des inputs

## 🗄️ Base de données

**Tables créées** :
- `users` - Utilisateurs et admins
- `themes` - 5 thématiques
- `challenges` - 25 défis
- `challenge_photos` - Photos avec modération
- `user_progress` - Suivi progression
- `admin_audit` - Logs actions admin

## 🎨 Thématiques par défaut

1. **🐾 Animaux** (vert #10B981) - 5 défis
2. **🎤 Prise de parole** (orange #F59E0B) - 5 défis
3. **🎭 Dingueries en public** (rouge #EF4444) - 5 défis
4. **⛰️ Sport & Aventure** (violet #8B5CF6) - 5 défis
5. **🎨 Créativité** (cyan #06B6D4) - 5 défis

## 📱 Partage Social

### Fonctionnement
1. **Mobile** : Utilise `navigator.share` (natif iOS/Android)
2. **Desktop** : Copie automatique du lien dans le presse-papier
3. **URL de partage** : `https://votredomaine.com/p/:photoId`

### OG Tags implémentés
- `og:title` - Titre avec nom utilisateur et défi
- `og:description` - Légende de la photo
- `og:image` - Image de la photo
- `twitter:card` - Preview Twitter
- Auto-redirect vers l'app après 3 secondes

## 🔧 Configuration (.env)

Les variables importantes :
```env
JWT_SECRET=votre_secret_jwt
USER_PORT=3000
ADMIN_PORT=3001
MAX_FILE_SIZE=5242880
ADMIN_EMAIL=admin@besuccess.com
ADMIN_PASSWORD=Admin123!
```

## 📝 Commandes utiles

```bash
# Installer les dépendances
npm install

# Initialiser la DB
npm run init-db

# Dev (2 serveurs)
npm run dev

# Production
npm start              # User server
npm run start:admin    # Admin server
```

## 🐛 Dépannage

### Erreur "Database locked"
```bash
rm server/database/challenges.db
npm run init-db
```

### Port déjà utilisé
Changez les ports dans `.env` :
```env
USER_PORT=3001
ADMIN_PORT=3002
```

### Photos non affichées
Vérifiez que le dossier `uploads/` existe et a les bonnes permissions.

## 🚀 Déploiement production

1. Générer un JWT secret sécurisé :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. Mettre à jour `.env` avec les vraies valeurs

3. Changer le mot de passe admin

4. Configurer un reverse proxy (nginx/Apache)

5. Utiliser PM2 pour la gestion des process :
```bash
npm install -g pm2
pm2 start server/index.js --name "challenges-user"
pm2 start server/admin.js --name "challenges-admin"
pm2 save
pm2 startup
```

## 📚 Structure des fichiers

```
├── server/
│   ├── index.js              # Serveur user (3000)
│   ├── admin.js              # Serveur admin (3001)
│   ├── database/
│   │   ├── init.js           # Init DB
│   │   └── schema.sql        # Schéma SQLite
│   ├── middleware/
│   │   ├── auth.js           # JWT
│   │   ├── admin.js          # Admin + audit
│   │   └── upload.js         # Multer
│   ├── routes/
│   │   ├── auth.js
│   │   ├── challenges.js
│   │   ├── photos.js         # + modération
│   │   ├── users.js
│   │   └── admin/
│   │       ├── users.js
│   │       ├── photos.js     # Modération complète
│   │       ├── dashboard.js
│   │       └── content.js
│   └── utils/
│       ├── i18n.js           # FR/EN
│       └── validation.js
├── public/
│   ├── index.html            # Front user
│   ├── admin.html            # Front admin
│   ├── css/
│   │   ├── style.css         # Branding or/blanc/noir
│   │   └── admin.css
│   └── js/
│       ├── app.js            # Logic user + partage
│       └── admin.js          # Logic admin + modération
└── uploads/                  # Photos (auto-créé)
```

## ✨ Bon appétit et bon développement ! 🍽️

L'application est 100% fonctionnelle et prête pour la production.
Tous les endpoints de modération et de partage social sont opérationnels.

Pour toute question, consultez le README.md principal.
