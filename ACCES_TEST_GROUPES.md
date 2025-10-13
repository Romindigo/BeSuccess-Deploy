# 🔐 Accès pour tester les Groupes de Discussion

## 📅 Date : 13 octobre 2025

## 🚀 Démarrage

### 1. Lancer le serveur admin
```bash
cd /Users/romainlimare/CascadeProjects/windsurf-project
node server/admin.js
```

Le serveur démarre sur : **http://localhost:3001**

### 2. Lancer le serveur utilisateur (optionnel)
```bash
node server/index.js
```

Le serveur démarre sur : **http://localhost:3000**

## 🔑 Identifiants Admin

**URL** : http://localhost:3001/admin.html

**Email** : `admin@besuccess.com`  
**Mot de passe** : `Admin123!`

⚠️ Le mot de passe contient :
- Une majuscule (A)
- Des chiffres (123)
- Un caractère spécial (!)

## 📋 Comment tester les groupes

### Étape 1 : Connexion
1. Ouvrir http://localhost:3001/admin.html
2. Se connecter avec les identifiants ci-dessus
3. Vous arrivez sur le dashboard admin

### Étape 2 : Accéder aux groupes
1. Dans le menu latéral, cliquer sur **"💬 Groupes"**
2. Vous verrez le dashboard des groupes avec :
   - Statistiques (groupes, membres, messages)
   - Liste des groupes existants (vide au départ)

### Étape 3 : Créer votre premier groupe
1. Cliquer sur **"+ Nouveau groupe"**
2. Remplir le formulaire :
   - **Nom** : "Motivation quotidienne" (ou autre)
   - **Description** : "Un groupe pour s'encourager chaque jour"
   - **Icône** : 🚀 (ou tout autre emoji)
   - **Couleur** : Choisir une couleur (par défaut : or #D4AF37)
   - **Groupe public** : ✓ coché
   - **Max membres** : 0 (illimité)
3. Cliquer sur **"✨ Créer le groupe"**
4. ✅ Message de succès affiché

### Étape 4 : Voir les détails du groupe
1. Dans la liste, cliquer sur **"👁️ Voir"** sur votre groupe
2. Une fenêtre modale s'ouvre avec :
   - Informations du groupe
   - Liste des membres (vous êtes admin automatiquement)
   - Statistiques du groupe

### Étape 5 : Modifier un groupe
1. Cliquer sur **"✏️ Éditer"**
2. Modifier n'importe quel champ
3. Cliquer sur **"💾 Sauvegarder"**
4. ✅ Modifications sauvegardées

### Étape 6 : Créer un groupe privé
1. Cliquer sur **"+ Nouveau groupe"**
2. Remplir avec :
   - **Nom** : "Groupe VIP"
   - **Groupe public** : ✗ décoché (privé)
   - **Max membres** : 10
3. Créer
4. Vérifier le badge **"🔒 Privé"** dans la liste

## 🧪 Tests API (optionnel)

### Récupérer votre token admin
1. Ouvrir la console du navigateur (F12)
2. Taper : `localStorage.getItem('adminToken')`
3. Copier le token

### Tester les API avec curl

```bash
# Remplacer YOUR_TOKEN par votre token
TOKEN="YOUR_TOKEN"

# Liste des groupes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/admin/groups

# Statistiques
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/admin/groups/stats/overview

# Créer un groupe
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API",
    "description": "Créé via API",
    "icon": "🧪",
    "color": "#FF5722",
    "is_public": true,
    "max_members": 0
  }' \
  http://localhost:3001/api/admin/groups
```

## 📊 Vérifier la base de données

```bash
sqlite3 server/database/challenges.db "SELECT * FROM discussion_groups;"
```

Ou avec un client SQLite graphique :
- Fichier : `/Users/romainlimare/CascadeProjects/windsurf-project/server/database/challenges.db`
- Tables à vérifier :
  - `discussion_groups`
  - `group_members`
  - `group_messages`
  - `message_reactions`

## ✅ Checklist de test

### Interface Admin
- [ ] Connexion admin réussie
- [ ] Accès à la section Groupes
- [ ] Statistiques affichées (0, 0, 0...)
- [ ] Création d'un groupe public
- [ ] Création d'un groupe privé
- [ ] Modification d'un groupe
- [ ] Vue détails avec membres
- [ ] Suppression d'un groupe

### Fonctionnalités
- [ ] Groupes apparaissent dans la liste
- [ ] Icônes emoji affichées
- [ ] Couleurs personnalisées appliquées
- [ ] Badges Public/Privé corrects
- [ ] Compteur membres correct
- [ ] Toast notifications fonctionnent

## 🔧 En cas de problème

### Serveur ne démarre pas
```bash
# Vérifier les processus
lsof -i :3001
lsof -i :3000

# Tuer si nécessaire
pkill -f "node server"
```

### Erreur de connexion
- Vérifier que le serveur tourne
- Vérifier les identifiants (copier-coller)
- Vider le cache du navigateur (Cmd+Shift+R)

### Tables n'existent pas
```bash
# Relancer la migration
node server/database/migrate-groups.js
```

### Erreur "Cannot find module"
```bash
# Réinstaller les dépendances
npm install
```

## 📚 Documentation complète

- **GROUPES_DISCUSSION.md** - Documentation détaillée
- **TEST_GROUPES.md** - Guide de test complet
- **IMPLEMENTATION_GROUPES.md** - Détails techniques

## 🎯 Ce que vous pouvez tester

### Maintenant disponible ✅
- Créer, modifier, supprimer des groupes
- Gérer les membres
- Voir les statistiques
- Groupes publics et privés
- Limite de membres
- Personnalisation (icône, couleur)

### À venir (API prête, UI à faire)
- Interface utilisateur pour les groupes
- Poster des messages
- Réagir aux messages
- Chat en temps réel
- Notifications

---

**Repository GitHub** : https://github.com/Romindigo/BeSuccess-Deploy  
**Commit** : ✨ Ajout fonctionnalité Groupes de Discussion (e2c367c)  
**Status** : ✅ Sauvegardé et déployé

**Bon test ! 🚀**
