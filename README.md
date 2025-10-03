# 100 Challenges by BeSuccess 🏆

Application de défis communautaires avec système de gamification, modération et partage social.

## 🎨 Branding
- Couleurs principales : Or (#D4AF37), Blanc (#FFFFFF), Noir (#000000)
- Logo BeSuccess fourni
- Design responsive mobile-first

## ✨ Fonctionnalités

### Front Office (Port 3000)
- ✅ Authentification sécurisée (JWT + bcrypt)
- ✅ 25 défis en 5 thématiques
- ✅ Upload photos (5MB max, redimensionnement auto)
- ✅ Galerie communautaire publique
- ✅ Système de points et progression
- ✅ Partage social (WhatsApp, Instagram, Facebook, Twitter)
- ✅ Interface FR par défaut (EN disponible)

### Back Office Admin (Port 3001)
- ✅ Dashboard statistiques temps réel
- ✅ Gestion utilisateurs (ban, reset, delete)
- ✅ Modération photos (flag, hide, approve, delete)
- ✅ Création thématiques et défis
- ✅ Audit des actions admin

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Copier et configurer .env
cp .env.example .env
# Éditer .env avec vos valeurs

# Initialiser la base de données
npm run init-db

# Démarrer en développement (les 2 serveurs)
npm run dev

# OU démarrer en production
npm start              # Serveur utilisateur (port 3000)
npm run start:admin    # Serveur admin (port 3001)
```

## 📁 Structure

```
├── server/
│   ├── index.js              # Serveur utilisateur (3000)
│   ├── admin.js              # Serveur admin (3001)
│   ├── database/
│   │   ├── init.js           # Initialisation DB
│   │   └── schema.sql        # Schéma SQLite
│   ├── middleware/
│   │   ├── auth.js           # JWT validation
│   │   ├── admin.js          # Admin authorization
│   │   └── upload.js         # Multer config
│   ├── routes/
│   │   ├── auth.js           # Auth endpoints
│   │   ├── challenges.js     # Défis
│   │   ├── photos.js         # Photos + modération
│   │   ├── users.js          # Profils
│   │   └── admin/            # Routes admin
│   └── utils/
│       ├── validation.js     # Schémas validation
│       └── i18n.js           # Traductions FR/EN
├── public/
│   ├── index.html            # Front utilisateur
│   ├── admin.html            # Front admin
│   ├── css/
│   │   ├── style.css         # Styles utilisateur
│   │   └── admin.css         # Styles admin
│   └── js/
│       ├── app.js            # Logic utilisateur
│       └── admin.js          # Logic admin
└── uploads/                  # Photos uploadées
```

## 🔒 Sécurité

- JWT avec expiration 7 jours
- Bcrypt pour mots de passe (10 rounds)
- Helmet pour headers sécurisés
- CORS configuré
- Rate limiting (100 req/15min)
- Validation stricte uploads (5MB, images uniquement)
- Protection CSRF
- Admin principal non supprimable

## 🌍 Internationalisation

- Langue par défaut : Français
- Langue secondaire : Anglais
- Détection automatique navigateur
- Sélecteur manuel disponible

## 📊 Base de Données (SQLite)

- `users` : utilisateurs et admins
- `themes` : thématiques avec couleurs/icônes
- `challenges` : défis avec métadonnées
- `challenge_photos` : photos avec modération
- `user_progress` : suivi progression
- `admin_audit` : logs actions admin

## 🎯 Défis par Thématique

1. **🐾 Animaux** (5 défis, vert)
2. **🎤 Prise de parole** (5 défis, orange)
3. **🎭 Dingueries en public** (5 défis, rouge)
4. **⛰️ Sport & Aventure** (5 défis, violet)
5. **🎨 Créativité** (5 défis, cyan)

## 📱 Partage Social

- Boutons natifs avec `navigator.share` (mobile)
- Fallback copie lien (desktop)
- OG tags pour previews riches
- Deep links vers lightbox photos

## 👨‍💼 Compte Admin par Défaut

- Email : `admin@besuccess.com`
- Mot de passe : `Admin123!`
- ⚠️ À changer en production !

## 📝 License

MIT © BeSuccess
