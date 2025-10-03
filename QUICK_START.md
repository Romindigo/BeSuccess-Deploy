# 🚀 Quick Start - 100 Challenges BeSuccess

## ✅ Application prête à l'emploi !

Les serveurs sont **déjà démarrés** et fonctionnels.

---

## 🌐 Accès immédiat

### 👥 Front Office Utilisateur
**http://localhost:3000**

**Première utilisation** :
1. Cliquez sur "S'inscrire"
2. Remplissez : nom, email, mot de passe
3. Explorez les 25 défis
4. Uploadez vos premières photos !

### 🔐 Back Office Admin
**http://localhost:3001**

**Connexion admin** :
- Email : `admin@besuccess.com`
- Mot de passe : `Admin123!`

---

## 🎯 Fonctionnalités clés

### Utilisateur
- ✅ **25 défis** en 5 thématiques
- ✅ **Upload photos** (5MB max, drag & drop)
- ✅ **Galerie publique** par défi
- ✅ **Partage social** (WhatsApp, Instagram, Facebook, Twitter)
- ✅ **Signalement** de photos inappropriées
- ✅ **Système de points** et progression
- ✅ **Interface FR/EN** (toggle dans le header)

### Admin
- ✅ **Dashboard** avec stats temps réel
- ✅ **Modération photos** (approuver/masquer/supprimer)
- ✅ **Gestion utilisateurs** (ban/reset/delete)
- ✅ **Photos signalées** (filtre dédié)
- ✅ **Journal d'audit** complet

---

## 🎨 Branding

**Couleurs BeSuccess** :
- Or : `#D4AF37` ✨
- Blanc : `#FFFFFF` ⚪
- Noir : `#000000` ⚫

**Design** : Moderne, épuré, responsive mobile-first

---

## 🔗 Partage social

### Comment ça marche ?
1. Ouvrez une photo dans la galerie (lightbox)
2. Cliquez sur "🔗 Partager"
3. **Mobile** : Menu natif s'ouvre (WhatsApp, Instagram, etc.)
4. **Desktop** : Lien copié automatiquement

### URL de partage
`http://localhost:3000/p/:photoId`

**Inclut** :
- Image de la photo
- Titre avec nom utilisateur et défi
- Légende
- Preview riche sur tous les réseaux sociaux

---

## 🛡️ Modération

### Signalement utilisateur
1. Dans la lightbox, clic "🚩 Signaler"
2. Raison optionnelle
3. **Auto-masquage** après 3 signalements

### Modération admin
1. Connexion admin → Section "Modération"
2. **Filtres** : Toutes / Signalées / Masquées
3. **Actions** :
   - ✅ Approuver
   - 🚫 Masquer
   - 🗑️ Supprimer
   - 🔄 Reset signalements

---

## 📱 Test rapide

### Scénario complet (5 min)

**1. Créer un compte utilisateur** (http://localhost:3000)
```
Nom : Test User
Email : test@example.com
Mot de passe : Test1234
```

**2. Relever un défi**
- Choisir "Caresser un animal inconnu" (1ère carte)
- Cliquer "📸 Uploader une photo"
- Glisser une image ou cliquer pour sélectionner
- Ajouter une légende : "Mon chat adoré !"
- Uploader

**3. Partager la photo**
- Cliquer "🖼️ Voir la galerie"
- Cliquer sur votre photo
- Cliquer "🔗 Partager"
- Tester le lien copié dans un nouvel onglet

**4. Signaler la photo**
- Dans la lightbox, cliquer "🚩 Signaler"
- Raison : "Test de modération"

**5. Modérer en tant qu'admin** (http://localhost:3001)
- Se connecter avec `admin@besuccess.com` / `Admin123!`
- Aller dans "Modération"
- Cliquer sur "Signalées"
- Voir votre photo avec le signalement
- Tester "Approuver" ou "Masquer"

---

## 🔧 Commandes utiles

```bash
# Arrêter les serveurs
# Ctrl+C dans le terminal

# Redémarrer
npm run dev

# Réinitialiser la DB (efface tout)
npm run init-db

# Production (2 terminaux)
npm start              # Terminal 1
npm run start:admin    # Terminal 2
```

---

## 📊 Données de test

### Thématiques disponibles
1. 🐾 **Animaux** (5 défis, vert)
2. 🎤 **Prise de parole** (5 défis, orange)
3. 🎭 **Dingueries en public** (5 défis, rouge)
4. ⛰️ **Sport & Aventure** (5 défis, violet)
5. 🎨 **Créativité** (5 défis, cyan)

### Exemples de défis
- Difficulté 1★ : Caresser un animal inconnu (10 pts)
- Difficulté 2★ : Nourrir des oiseaux sauvages (15 pts)
- Difficulté 3★ : Monter à cheval (20 pts)
- Difficulté 4★ : Présentation devant 10 personnes (25 pts)
- Difficulté 5★ : Nager avec des dauphins (30 pts)

---

## 🐛 Dépannage express

### Les serveurs ne démarrent pas
```bash
# Tuer les process sur les ports
lsof -ti:3000,3001 | xargs kill -9

# Redémarrer
npm run dev
```

### Photos non affichées
```bash
# Vérifier le dossier uploads
ls -la uploads/

# Le créer si nécessaire
mkdir -p uploads
```

### Erreur base de données
```bash
# Réinitialiser
rm server/database/challenges.db
npm run init-db
```

---

## 🎯 Points d'attention

### ⚠️ Avant production
1. **Changer le mot de passe admin** (actuellement `Admin123!`)
2. **Générer un nouveau JWT_SECRET** dans `.env`
3. **Configurer un domaine** et SSL
4. **Activer les backups** de la base de données

### 🔒 Sécurité implémentée
- ✅ JWT avec expiration 7 jours
- ✅ Bcrypt pour les mots de passe
- ✅ Rate limiting (100 req/15min)
- ✅ Validation stricte des uploads
- ✅ Sanitization des inputs
- ✅ Headers sécurisés (Helmet)

---

## 📚 Documentation complète

- **README.md** - Vue d'ensemble du projet
- **START.md** - Guide de démarrage détaillé
- **IMPLEMENTATION_COMPLETE.md** - Spécifications techniques complètes

---

## ✨ Bon test et bon appétit ! 🍽️

L'application est **100% fonctionnelle** et prête à l'emploi.

**Serveurs actifs** :
- 👥 Utilisateurs : http://localhost:3000
- 🔐 Admin : http://localhost:3001

**Compte admin** :
- Email : `admin@besuccess.com`
- Mot de passe : `Admin123!`

---

*Application créée avec ❤️ pour BeSuccess*  
*Tous les systèmes sont opérationnels ✅*
