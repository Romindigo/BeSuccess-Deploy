# 🎯 Guide de Test Simple - Groupes de Discussion

## 🚀 Étape 1 : Démarrer les serveurs

### Terminal 1 - Serveur Admin
```bash
cd /Users/romainlimare/CascadeProjects/windsurf-project
node server/admin.js
```
**Résultat** : Serveur sur http://localhost:3001

### Terminal 2 - Serveur Utilisateur
```bash
cd /Users/romainlimare/CascadeProjects/windsurf-project
node server/index.js
```
**Résultat** : Serveur sur http://localhost:3000

---

## 👨‍💼 Partie 1 : TEST ADMIN

### 1. Se connecter en tant qu'admin

**URL** : http://localhost:3001/admin.html

**Identifiants** :
- Email: `admin@besuccess.com`
- Mot de passe: `Admin123!`

### 2. Créer un groupe de test

1. Cliquer sur **"💬 Groupes"** dans le menu gauche
2. Cliquer sur **"+ Nouveau groupe"**
3. Remplir :
   - Nom: `Motivation quotidienne`
   - Description: `Un groupe pour s'encourager chaque jour`
   - Icône: `🚀` (ou tout emoji)
   - Groupe public: ✓ coché
   - Max membres: `0` (illimité)
4. Cliquer **"✨ Créer le groupe"**
5. ✅ Le groupe apparaît dans la liste

### 3. Créer un 2ème groupe pour tester

1. Cliquer **"+ Nouveau groupe"**
2. Remplir :
   - Nom: `Discussions tech`
   - Description: `Pour parler de technologie`
   - Icône: `💻`
   - Groupe public: ✓ coché
3. Créer
4. ✅ 2 groupes dans la liste

---

## 👤 Partie 2 : TEST UTILISATEUR

### 1. Se connecter en tant qu'utilisateur

**URL** : http://localhost:3000

**Identifiants** :
- Email: `user@test.com`
- Mot de passe: `User123!`

### 2. Voir les groupes disponibles

**URL directe** : http://localhost:3000/groups-test.html

Vous voyez :
- ✅ Vos infos en haut (Utilisateur Test - 100 pts)
- ✅ Section "Tous les groupes publics"
- ✅ Section "Mes groupes" (vide pour l'instant)

### 3. Rejoindre un groupe

1. Dans "Tous les groupes publics", voir les 2 groupes créés
2. Cliquer sur **"➕ Rejoindre"** sur "Motivation quotidienne"
3. ✅ Message de succès
4. Le groupe apparaît maintenant dans "Mes groupes"

### 4. Ouvrir le groupe et discuter

1. Cliquer sur **"💬 Ouvrir"** sur le groupe rejoint
2. Une fenêtre modale s'ouvre avec :
   - Nom et description du groupe
   - Liste des membres (Admin + vous)
   - Zone de chat
3. **Envoyer un message** :
   - Taper: `Bonjour à tous ! 🎉`
   - Appuyer sur Entrée ou cliquer "Envoyer"
   - ✅ Message affiché
4. **Réagir à un message** :
   - Cliquer sur un emoji sous le message
   - ✅ Réaction ajoutée

### 5. Rejoindre le 2ème groupe

1. Fermer la fenêtre modale
2. Rejoindre "Discussions tech"
3. Ouvrir et envoyer un message: `Salut ! Parlons de code 💻`

### 6. Quitter un groupe

1. Ouvrir un groupe
2. Scroller en bas
3. Cliquer **"❌ Quitter le groupe"**
4. Confirmer
5. ✅ Le groupe disparaît de "Mes groupes"

---

## 🔄 Partie 3 : VÉRIFICATION ADMIN

Retourner sur l'interface admin (http://localhost:3001/admin.html)

### Dans la section Groupes :

1. **Voir les statistiques** :
   - Groupes totaux: 2
   - Membres: 3 (admin dans les 2 + user dans 1 ou 2)
   - Messages: 2 (ou plus)

2. **Voir les détails** :
   - Cliquer "👁️ Voir" sur "Motivation quotidienne"
   - Voir la liste des membres
   - Voir le nombre de messages

3. **Modifier un groupe** :
   - Cliquer "✏️ Éditer"
   - Changer la description
   - Sauvegarder
   - ✅ Modifications visibles

4. **Retirer un membre** (optionnel) :
   - Dans les détails du groupe
   - Cliquer "Retirer" sur l'utilisateur
   - ✅ Membre retiré

---

## ✅ Checklist de validation

### Admin
- [x] Connexion admin réussie
- [ ] Création de groupes ✓
- [ ] Modification de groupes ✓
- [ ] Statistiques affichées ✓
- [ ] Vue détails avec membres ✓
- [ ] Gestion des membres ✓

### Utilisateur
- [x] Connexion utilisateur réussie
- [ ] Voir les groupes publics ✓
- [ ] Rejoindre un groupe ✓
- [ ] Envoyer des messages ✓
- [ ] Réagir aux messages ✓
- [ ] Quitter un groupe ✓
- [ ] Voir les membres ✓

---

## 🐛 En cas de problème

### Impossible de se connecter ?
```bash
# Recréer les comptes
node server/scripts/create-test-users.js
```

### Les serveurs ne démarrent pas ?
```bash
# Vérifier les ports
lsof -i :3000
lsof -i :3001

# Tuer les processus si nécessaire
pkill -f "node server"
```

### Les groupes n'apparaissent pas ?
```bash
# Vérifier la base de données
sqlite3 server/database/challenges.db "SELECT * FROM discussion_groups;"
```

### Page groups-test.html ne charge pas ?
- Vérifier que le serveur utilisateur tourne
- Aller sur : http://localhost:3000/groups-test.html
- Vider le cache (Cmd+Shift+R sur Mac)

---

## 📊 Résumé des URLs

| Type | URL | Identifiants |
|------|-----|--------------|
| **Admin** | http://localhost:3001/admin.html | admin@besuccess.com / Admin123! |
| **User Login** | http://localhost:3000 | user@test.com / User123! |
| **User Groups** | http://localhost:3000/groups-test.html | (après connexion) |

---

## 🎉 C'est tout !

Vous pouvez maintenant :
- ✅ Créer des groupes en tant qu'admin
- ✅ Les rejoindre en tant qu'utilisateur
- ✅ Discuter avec d'autres membres
- ✅ Réagir aux messages
- ✅ Gérer les membres

**Amusez-vous bien ! 🚀**
