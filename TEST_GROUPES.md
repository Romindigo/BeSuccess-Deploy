# Guide de test - Groupes de Discussion

## 🚀 Démarrage rapide

### 1. Migration de la base de données (déjà effectuée ✅)

```bash
node server/database/migrate-groups.js
```

**Résultat attendu** :
```
✓ Migration des groupes terminée avec succès!
Tables créées:
  - discussion_groups
  - group_members
  - group_messages
  - message_reactions
```

### 2. Démarrer les serveurs

**Terminal 1 - Serveur Admin** :
```bash
node server/admin.js
```

**Terminal 2 - Serveur Utilisateur** :
```bash
node server/index.js
```

## ✅ Tests à effectuer

### A. Tests Admin (http://localhost:3001)

#### 1. Connexion Admin
- [ ] Se connecter avec un compte admin
- [ ] Vérifier l'accès au dashboard

#### 2. Création d'un groupe
- [ ] Cliquer sur l'onglet "💬 Groupes"
- [ ] Cliquer sur "+ Nouveau groupe"
- [ ] Remplir le formulaire :
  - Nom: "Motivation quotidienne"
  - Description: "Un groupe pour s'encourager chaque jour"
  - Icône: 🚀
  - Couleur: #D4AF37 (gold)
  - Type: Public ✓
  - Max membres: 0 (illimité)
- [ ] Cliquer sur "✨ Créer le groupe"
- [ ] Vérifier le message de succès
- [ ] Vérifier que le groupe apparaît dans la liste

#### 3. Statistiques
- [ ] Vérifier les cartes de statistiques :
  - Groupes totaux: 1
  - Membres: 1 (le créateur)
  - Messages: 0
  - Publics: 1
  - Privés: 0

#### 4. Voir les détails d'un groupe
- [ ] Cliquer sur "👁️ Voir" sur le groupe créé
- [ ] Vérifier les informations affichées
- [ ] Vérifier la liste des membres (1 admin)

#### 5. Modifier un groupe
- [ ] Cliquer sur "✏️ Éditer"
- [ ] Modifier la description
- [ ] Changer l'icône
- [ ] Cliquer sur "💾 Sauvegarder"
- [ ] Vérifier que les modifications sont prises en compte

#### 6. Créer un groupe privé
- [ ] Créer un nouveau groupe avec :
  - Nom: "Groupe VIP"
  - Type: Privé (décocher "Groupe public")
  - Max membres: 10
- [ ] Vérifier que le badge "🔒 Privé" s'affiche

### B. Tests API avec curl/Postman

#### 1. Récupérer la liste des groupes (Admin)
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3001/api/admin/groups
```

**Attendu**: Liste JSON des groupes créés

#### 2. Créer un groupe via API
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API",
    "description": "Groupe créé via API",
    "icon": "🧪",
    "color": "#FF5722",
    "is_public": true,
    "max_members": 50
  }' \
  http://localhost:3001/api/admin/groups
```

**Attendu**: `{"message": "Groupe créé avec succès", "group": {...}}`

#### 3. Statistiques des groupes
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3001/api/admin/groups/stats/overview
```

**Attendu**: 
```json
{
  "total_groups": 2,
  "total_members": 2,
  "total_messages": 0,
  "public_groups": 1,
  "private_groups": 1
}
```

### C. Tests Utilisateur (http://localhost:3000)

#### 1. Voir les groupes publics
```bash
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/api/groups
```

**Attendu**: Liste des groupes publics uniquement

#### 2. Rejoindre un groupe
```bash
curl -X POST \
  -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/api/groups/1/join
```

**Attendu**: `{"message": "Vous avez rejoint le groupe avec succès"}`

#### 3. Voir mes groupes
```bash
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/api/groups/my-groups
```

**Attendu**: Liste des groupes dont l'utilisateur est membre

#### 4. Poster un message
```bash
curl -X POST \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Bonjour à tous ! Premier message 🎉"
  }' \
  http://localhost:3000/api/groups/1/messages
```

**Attendu**: `{"message": "Message posté avec succès", "data": {...}}`

#### 5. Récupérer les messages
```bash
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/api/groups/1/messages
```

**Attendu**: Liste des messages du groupe

#### 6. Réagir à un message
```bash
curl -X POST \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emoji": "👍"}' \
  http://localhost:3000/api/groups/messages/1/react
```

**Attendu**: `{"message": "Réaction ajoutée", "action": "added"}`

#### 7. Quitter un groupe
```bash
curl -X POST \
  -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/api/groups/1/leave
```

**Attendu**: `{"message": "Vous avez quitté le groupe"}`

## 🔍 Tests de sécurité

### 1. Sans authentification
```bash
curl http://localhost:3000/api/groups
```
**Attendu**: Erreur 401 Unauthorized

### 2. Utilisateur non-admin tente d'accéder aux routes admin
```bash
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3001/api/admin/groups
```
**Attendu**: Erreur 403 Forbidden

### 3. Rejoindre un groupe privé sans invitation
```bash
curl -X POST \
  -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/api/groups/PRIVATE_GROUP_ID/join
```
**Attendu**: Erreur 403 "Ce groupe est privé"

### 4. Poster dans un groupe dont on n'est pas membre
```bash
curl -X POST \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test"}' \
  http://localhost:3000/api/groups/OTHER_GROUP_ID/messages
```
**Attendu**: Erreur 403 "Vous devez être membre du groupe"

## 📊 Vérification de la base de données

```bash
sqlite3 server/database/challenges.db
```

### Commandes SQL utiles :

```sql
-- Voir tous les groupes
SELECT * FROM discussion_groups;

-- Voir tous les membres
SELECT dg.name, u.username, gm.role, gm.joined_at
FROM group_members gm
JOIN discussion_groups dg ON gm.group_id = dg.id
JOIN users u ON gm.user_id = u.id;

-- Voir tous les messages
SELECT dg.name, u.username, gme.content, gme.created_at
FROM group_messages gme
JOIN discussion_groups dg ON gme.group_id = dg.id
JOIN users u ON gme.user_id = u.id
ORDER BY gme.created_at DESC;

-- Statistiques
SELECT 
  (SELECT COUNT(*) FROM discussion_groups) as total_groups,
  (SELECT COUNT(*) FROM group_members) as total_members,
  (SELECT COUNT(*) FROM group_messages WHERE status='visible') as total_messages;
```

## ✅ Checklist finale

- [x] Migration base de données exécutée
- [x] Tables créées correctement
- [x] Routes admin fonctionnelles
- [x] Routes utilisateur fonctionnelles
- [x] Interface admin créée
- [x] Validation des données
- [x] Sécurité (auth + permissions)
- [x] Audit logging pour actions admin
- [ ] Tests manuels effectués
- [ ] Documentation complétée

## 🐛 Problèmes connus / À surveiller

1. **Performance**: Pour des groupes avec beaucoup de messages, implémenter la pagination
2. **Temps réel**: Les messages ne se rafraîchissent pas automatiquement (WebSocket à ajouter)
3. **Notifications**: Pas de notification quand un nouveau message est posté
4. **Modération**: Fonction de modération des messages à améliorer

## 🎯 Prochaines étapes

1. Créer l'interface utilisateur pour les groupes
2. Ajouter le support WebSocket pour le temps réel
3. Implémenter les notifications push
4. Ajouter l'upload de médias dans les messages
5. Créer un système d'invitation pour les groupes privés

---

**Status**: ✅ Backend fonctionnel - Frontend admin prêt
**Date**: 13 octobre 2025
