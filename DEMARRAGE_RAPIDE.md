# 🚀 Démarrage Rapide - Nouvelles Fonctionnalités

## ⚡ En 3 Commandes

### 1️⃣ Migrer la base de données
```bash
npm run migrate
```

### 2️⃣ Démarrer l'application
```bash
npm run dev
```

### 3️⃣ Accéder aux interfaces
- **Utilisateur** : http://localhost:3000
- **Admin** : http://localhost:3001/admin.html

---

## 🎯 Tester les Fonctionnalités

### 📹 Support Vidéo

1. Aller sur http://localhost:3000
2. Se connecter
3. Cliquer sur un défi
4. Uploader une vidéo (MP4, WebM, OGG) jusqu'à 50MB
5. La vidéo s'affiche avec un lecteur intégré

### 💬 Commentaires

1. Aller sur une photo ou vidéo
2. Scroll vers le bas
3. Écrire un commentaire (max 500 caractères)
4. Cliquer "Envoyer"
5. Répondre à un commentaire avec le bouton "Répondre"
6. Modifier votre commentaire avec ✏️
7. Supprimer votre commentaire avec 🗑️

### ❤️ Likes

1. Sur n'importe quelle photo/vidéo
2. Cliquer sur le bouton ❤️
3. Le compteur s'incrémente
4. Re-cliquer pour unlike

### 👥 Recherche Utilisateurs

1. Dans la barre de recherche
2. Taper le nom d'un utilisateur (min 2 caractères)
3. Les résultats s'affichent instantanément
4. Cliquer "Voir profil" pour voir les détails

### 📊 Profil Utilisateur

Le profil affiche :
- Avatar, bio, localisation, site web
- Statistiques : points, défis réussis, abonnés, abonnements
- Badges gagnés
- Progression détaillée par thème avec photos/vidéos

### 🔄 Suivre un Utilisateur

1. Aller sur le profil d'un utilisateur
2. Cliquer "Suivre"
3. Vous recevez ses notifications
4. Re-cliquer pour ne plus suivre

### 🏆 Classement Global

1. Accéder à l'onglet "Classement"
2. Voir le top 50 des utilisateurs
3. Le top 3 a un design spécial (Or, Argent, Bronze)

### 🎨 Personnalisation Couleurs (Admin)

1. Se connecter en admin : http://localhost:3001/admin.html
   - Email: `admin@besuccess.com`
   - Mot de passe: `Admin123!`

2. Aller dans "Paramètres" → "Personnalisation"

3. **Modifier une couleur**
   - Cliquer sur le color picker
   - Choisir une couleur
   - Ou taper le code hex (#RRGGBB)

4. **Aperçu en temps réel**
   - Cliquer "👁️ Aperçu en temps réel"
   - Les couleurs changent instantanément

5. **Appliquer**
   - Cliquer "✅ Appliquer les modifications"
   - Les couleurs sont sauvegardées pour tous les utilisateurs

6. **Thèmes prédéfinis**
   - 🏆 Or (défaut)
   - 💙 Bleu
   - 💜 Violet
   - 💚 Vert
   - 🖤 Sombre

7. **Réinitialiser**
   - Cliquer "🔄 Réinitialiser par défaut"

---

## 📋 Checklist de Test

### Vidéos
- [ ] Upload vidéo MP4
- [ ] Lecture vidéo
- [ ] Contrôles (play/pause)
- [ ] Affichage dans la galerie

### Commentaires
- [ ] Ajouter un commentaire
- [ ] Répondre à un commentaire
- [ ] Modifier un commentaire
- [ ] Supprimer un commentaire
- [ ] Affichage des threads

### Likes
- [ ] Liker une photo
- [ ] Unliker une photo
- [ ] Compteur de likes
- [ ] Icône cœur rouge quand liké

### Social
- [ ] Rechercher un utilisateur
- [ ] Voir un profil
- [ ] Suivre un utilisateur
- [ ] Ne plus suivre
- [ ] Voir les abonnés
- [ ] Voir les abonnements
- [ ] Voir le classement

### Couleurs (Admin)
- [ ] Modifier la couleur principale
- [ ] Appliquer un thème prédéfini
- [ ] Aperçu en temps réel
- [ ] Sauvegarder les modifications
- [ ] Réinitialiser
- [ ] Vérifier que les utilisateurs voient les nouvelles couleurs

---

## 🐛 Dépannage

### La migration échoue

**Erreur : "duplicate column name"**
```
✅ C'est normal ! La migration a déjà été appliquée
```

**Autre erreur**
```bash
# Sauvegarder la base actuelle
cp server/database/challenges.db server/database/challenges.db.backup

# Réinitialiser
npm run init-db

# Re-migrer
npm run migrate
```

### Les couleurs ne changent pas

1. Vider le cache du navigateur (Ctrl+F5)
2. Vérifier que `color-settings.js` est chargé
3. Ouvrir la console (F12) et vérifier les erreurs

### Les vidéos ne se lisent pas

1. Vérifier le format (MP4 recommandé)
2. Vérifier la taille (max 50MB)
3. Vérifier que `media_type` est bien "video" dans la base

### La recherche ne fonctionne pas

1. Vérifier que vous êtes connecté
2. Taper au moins 2 caractères
3. Vérifier le token dans localStorage

---

## 🔑 Identifiants de Test

### Admin
- Email: `admin@besuccess.com`
- Mot de passe: `Admin123!`

### Créer un utilisateur test
1. Aller sur http://localhost:3000
2. Cliquer "S'inscrire"
3. Remplir le formulaire

---

## 📁 Fichiers Créés

### Backend
```
server/database/migrations.sql         # Schema de migration
server/database/migrate.js             # Script de migration
server/routes/comments.js              # API commentaires et likes
server/routes/social.js                # API recherche et profils
server/routes/settings.js              # API personnalisation
```

### Frontend
```
public/js/comments.js                  # Module commentaires
public/js/social.js                    # Module social
public/js/color-settings.js            # Module personnalisation
public/css/features.css                # Styles nouvelles features
```

### Documentation
```
NOUVELLES_FONCTIONNALITES.md          # Guide complet
DEMARRAGE_RAPIDE.md                   # Ce fichier
```

---

## 📊 Structure de la Base de Données

### Nouvelles tables

**comments**
- Commentaires sur photos/vidéos
- Support des threads (réponses)
- Statut visible/hidden

**photo_likes**
- Likes des utilisateurs
- Constraint unique (1 like par user par photo)

**user_follows**
- Système de suivi
- Compteurs followers/following

**app_settings**
- Paramètres personnalisables
- Historique des modifications

**user_badges**
- Badges et achievements
- Différents types de badges

### Tables modifiées

**challenge_photos**
- `media_type` : 'image' ou 'video'
- `video_duration` : durée en secondes
- `thumbnail_filename` : miniature vidéo

**users**
- `avatar_url` : URL avatar
- `bio` : biographie
- `location` : localisation
- `website` : site web
- `followers_count` : nombre d'abonnés
- `following_count` : nombre d'abonnements

---

## 🎨 Variables CSS Personnalisables

```css
--primary-color       /* Couleur principale (or) */
--secondary-color     /* Couleur secondaire (noir) */
--accent-color        /* Couleur accent (blanc) */
--background-color    /* Fond principal */
--card-background     /* Fond des cartes */
--text-primary        /* Texte principal */
--text-secondary      /* Texte secondaire */
--success-color       /* Vert succès */
--warning-color       /* Orange attention */
--danger-color        /* Rouge danger */
```

---

## 🚀 Commandes Disponibles

```bash
npm start              # Démarrer serveur utilisateur
npm run start:admin    # Démarrer serveur admin
npm run dev            # Démarrer les deux en mode dev
npm run init-db        # Initialiser la base de données
npm run migrate        # Appliquer les migrations
npm run import-defis   # Importer les défis depuis Excel
```

---

## ✅ Prêt à Tester !

1. ✅ Migration exécutée
2. ✅ Serveurs démarrés
3. ✅ Documentation lue
4. 🎯 **Commencez à tester !**

---

## 📞 Besoin d'Aide ?

1. Lire `NOUVELLES_FONCTIONNALITES.md` pour les détails complets
2. Vérifier les logs du serveur
3. Ouvrir la console navigateur (F12)
4. Vérifier que toutes les dépendances sont installées (`npm install`)

**Amusez-vous bien ! 🎉**
