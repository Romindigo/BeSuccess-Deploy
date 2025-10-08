# 🚀 Déploiement sur Render - BeSuccess

## ✅ Code déjà sur GitHub
- **Repository**: https://github.com/Romindigo/BeSuccess-Deploy
- **Branch**: main
- ✅ Dernières modifications sauvegardées (charte graphique)

---

## 📋 Étapes pour déployer sur Render

### **ÉTAPE 1 : Créer le Web Service**

1. **Allez sur** : https://dashboard.render.com/
2. **Connectez-vous** avec votre compte GitHub
3. **Cliquez** : **"New +"** → **"Web Service"**

---

### **ÉTAPE 2 : Connecter le Repository**

1. **Autorisez Render** à accéder à vos repositories GitHub
2. **Sélectionnez** : `Romindigo/BeSuccess-Deploy`
3. **Cliquez** : **"Connect"**

---

### **ÉTAPE 3 : Configuration du Service**

Remplissez les informations suivantes :

#### **Informations de base**
- **Name** : `besuccess-deploy` (ou votre choix)
- **Region** : `Frankfurt (EU Central)` ou `Oregon (US West)`
- **Branch** : `main`
- **Root Directory** : *(laissez vide)*
- **Runtime** : `Node`

#### **Build & Deploy**
- **Build Command** : `npm install`
- **Start Command** : `npm start`

#### **Plan**
- **Instance Type** : `Free` (gratuit, mais se met en veille après 15 min d'inactivité)
- OU **Starter** : $7/mois (toujours actif)

---

### **ÉTAPE 4 : Variables d'environnement**

Cliquez sur **"Advanced"** et ajoutez ces variables :

```
NODE_ENV=production
PORT=10000
JWT_SECRET=votre_secret_jwt_super_securise_123456
ADMIN_EMAIL=admin@besuccess.com
ADMIN_PASSWORD=BeSuccess2024!
```

**Important** : Changez le `JWT_SECRET` par une valeur aléatoire sécurisée !

---

### **ÉTAPE 5 : Créer le Disk pour la base de données**

⚠️ **IMPORTANT** : Render ne garde pas les fichiers entre les redémarrages. Vous devez créer un **Persistent Disk** :

1. Faites défiler jusqu'à **"Disks"**
2. **Cliquez** : **"Add Disk"**
3. **Configuration** :
   - **Name** : `besuccess-data`
   - **Mount Path** : `/data`
   - **Size** : `1 GB` (gratuit)
4. **Cliquez** : **"Create Disk"**

---

### **ÉTAPE 6 : Modifier le code pour utiliser le Disk**

Avant de déployer, vous devez modifier `server/database/init.js` pour utiliser le disk :

```javascript
// Ligne 3 - Changer le chemin de la base de données
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/data/besuccess.db'  // Chemin sur le disk persistant
    : path.join(__dirname, '../../besuccess.db');
```

Puis commiter et pousser :
```bash
git add server/database/init.js
git commit -m "📦 Config base de données pour Render"
git push origin main
```

---

### **ÉTAPE 7 : Déployer**

1. **Cliquez** : **"Create Web Service"**
2. Render va automatiquement :
   - Cloner votre repository
   - Installer les dépendances (`npm install`)
   - Lancer l'application (`npm start`)

**Temps estimé** : 3-5 minutes

---

## 🌐 Accéder à votre application

Une fois déployée, votre URL sera :
- **Application** : `https://besuccess-deploy.onrender.com`
- **Admin** : `https://besuccess-deploy.onrender.com/admin.html`

### **🔐 Identifiants Admin**
- **Email** : `admin@besuccess.com`
- **Mot de passe** : `BeSuccess2024!`

---

## 🔄 Déploiement automatique

✅ **Auto-Deploy activé** par défaut !

Chaque fois que vous poussez sur GitHub :
```bash
git add .
git commit -m "Votre message"
git push origin main
```

→ Render redéploie automatiquement l'application en 2-3 minutes

---

## 📊 Surveillance et Logs

### **Voir les logs en temps réel**
1. Allez sur : https://dashboard.render.com/
2. Cliquez sur votre service `besuccess-deploy`
3. Onglet **"Logs"**

### **Surveiller l'utilisation**
- Onglet **"Metrics"** : CPU, RAM, requêtes/minute
- Onglet **"Events"** : Historique des déploiements

---

## ⚙️ Initialiser la base de données

Lors du premier déploiement, la base de données sera créée automatiquement avec :
- ✅ Table users
- ✅ Table themes
- ✅ Table challenges
- ✅ Table photos
- ✅ Table audit_logs
- ✅ Compte admin par défaut
- ✅ 100 défis importés

---

## 🆓 Plan Gratuit - Limites

Le plan gratuit de Render inclut :
- ✅ 750 heures/mois (suffisant pour un projet)
- ✅ 1 GB de disk persistant gratuit
- ⚠️ **Se met en veille** après 15 min d'inactivité
- ⏱️ **Réveil** : 30-50 secondes au premier accès

### Pour éviter la mise en veille :
1. **Passez au plan Starter** ($7/mois)
2. **Ou utilisez** : un service de ping (UptimeRobot, Cron-Job.org)

---

## 🔧 Commandes utiles

### **Redémarrer le service**
Dashboard Render → Onglet **"Manual Deploy"** → **"Clear build cache & deploy"**

### **Voir les variables d'environnement**
Dashboard Render → Onglet **"Environment"**

### **Télécharger les logs**
Dashboard Render → Onglet **"Logs"** → Bouton **"Download"**

---

## 🐛 Résolution de problèmes

### **Erreur "Cannot find module"**
```bash
# Dans votre terminal local
npm install
git add package-lock.json
git commit -m "Fix dependencies"
git push origin main
```

### **Base de données vide après redémarrage**
→ Vérifiez que le **Persistent Disk** est bien monté sur `/data`

### **Erreur d'authentification admin**
→ Vérifiez les variables d'environnement `ADMIN_EMAIL` et `ADMIN_PASSWORD`

---

## 🎉 Prochaines étapes

Une fois déployé, vous pouvez :

1. ✅ **Tester l'application** : https://besuccess-deploy.onrender.com
2. ✅ **Se connecter en admin** : /admin.html
3. ✅ **Importer les défis** via le panel admin
4. ✅ **Inviter des utilisateurs** pour tester

---

## 📞 Support Render

- **Documentation** : https://render.com/docs
- **Status** : https://status.render.com/
- **Community** : https://community.render.com/

---

## ✨ Récapitulatif

✅ Code sur GitHub : https://github.com/Romindigo/BeSuccess-Deploy
⏳ À faire : Créer le Web Service sur Render
🎯 Objectif : Application accessible publiquement

**Prêt à déployer ! 🚀**
