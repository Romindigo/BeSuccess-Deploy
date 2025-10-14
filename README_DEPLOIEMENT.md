# 🚀 Guide Rapide de Déploiement BeSuccess

## 📋 Résumé Ultra-Rapide

1. **Commandez un VPS Hostinger** (KVM 1 minimum)
2. **Connectez-vous via SSH**
3. **Installez Node.js + PM2**
4. **Clonez le projet**
5. **Configurez Nginx**
6. **Installez SSL**
7. **Démarrez avec PM2**

**Temps estimé** : 30-45 minutes

---

## 🎯 Prérequis

- VPS Hostinger avec Ubuntu 22.04
- Domaine configuré (ex: besuccess.com)
- Accès SSH

---

## ⚡ Installation Express (Copier-Coller)

### 1. Connexion et préparation

```bash
# Connexion SSH
ssh root@VOTRE_IP

# Mise à jour système
apt update && apt upgrade -y

# Installer outils essentiels
apt install -y curl git build-essential nginx

# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Installer PM2
npm install -g pm2

# Créer utilisateur
adduser besuccess
usermod -aG sudo besuccess
su - besuccess
```

### 2. Déployer le code

```bash
# Créer dossier
sudo mkdir -p /var/www/besuccess
sudo chown -R besuccess:besuccess /var/www/besuccess
cd /var/www/besuccess

# Cloner le projet
git clone https://github.com/Romindigo/BeSuccess-Deploy.git .

# Installer dépendances
npm ci --production

# Créer dossiers
mkdir -p uploads/photos uploads/videos uploads/profiles
mkdir -p server/database logs
```

### 3. Configuration

```bash
# Copier template .env
cp .env.production.example .env

# Éditer .env
nano .env
# Changez JWT_SECRET et SESSION_SECRET !
# Générer avec: openssl rand -base64 32
```

### 4. Base de données

```bash
# Initialiser la base
node server/database/init-db.js

# Migration groupes
node server/database/migrate-groups.js

# Créer comptes de test
node server/scripts/create-test-users.js
```

### 5. Nginx

```bash
# Créer config
sudo nano /etc/nginx/sites-available/besuccess
```

Collez (remplacez par votre domaine) :

```nginx
server {
    listen 80;
    server_name besuccess.com www.besuccess.com;
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name admin.besuccess.com;
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez :

```bash
sudo ln -s /etc/nginx/sites-available/besuccess /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 6. DNS Hostinger

Sur le panel Hostinger :
1. Domaines → Gérer DNS
2. Ajouter :
   - Type **A**, Nom **@**, Valeur **VOTRE_IP**
   - Type **A**, Nom **www**, Valeur **VOTRE_IP**
   - Type **A**, Nom **admin**, Valeur **VOTRE_IP**

Attendez 5-30 minutes.

### 7. SSL (HTTPS)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir certificats
sudo certbot --nginx -d besuccess.com -d www.besuccess.com -d admin.besuccess.com
```

### 8. Démarrer l'application

```bash
cd /var/www/besuccess

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la config
pm2 save

# Démarrage auto
pm2 startup
# Exécutez la commande affichée

# Vérifier
pm2 status
pm2 logs
```

---

## ✅ Vérification

Ouvrez votre navigateur :
- ✅ **https://besuccess.com** → Site utilisateur
- ✅ **https://admin.besuccess.com** → Interface admin

**Comptes de test** :
- Admin : `admin@besuccess.com` / `Admin123!`
- User : `user@test.com` / `User123!`

---

## 🔧 Commandes Utiles

```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs
pm2 logs besuccess-user
pm2 logs besuccess-admin

# Redémarrer
pm2 restart all

# Déployer une mise à jour
cd /var/www/besuccess
git pull origin main
npm ci --production
pm2 restart all
```

---

## 🔥 Problèmes Fréquents

### Site inaccessible
```bash
pm2 status  # Vérifier que les apps tournent
sudo systemctl status nginx  # Vérifier Nginx
```

### Erreur 502 Bad Gateway
```bash
pm2 restart all  # Redémarrer les apps
pm2 logs  # Voir les erreurs
```

### Upload ne marche pas
```bash
# Vérifier permissions
sudo chown -R besuccess:besuccess /var/www/besuccess/uploads
chmod -R 775 /var/www/besuccess/uploads
```

---

## 📚 Documentation Complète

Pour le guide complet avec toutes les options :
👉 **Voir `GUIDE_DEPLOIEMENT_HOSTINGER.md`**

---

## 💰 Coûts

- **VPS KVM 1** : ~4€/mois
- **Domaine .com** : ~10€/an
- **SSL Let's Encrypt** : GRATUIT

**Total** : ~4-8€/mois

---

## 📞 Support

- **Hostinger** : https://www.hostinger.fr (Chat 24/7)
- **GitHub** : https://github.com/Romindigo/BeSuccess-Deploy

---

## 🎉 Félicitations !

Votre application est maintenant en ligne ! 🚀

**Prochaines étapes** :
1. Tester toutes les fonctionnalités
2. Configurer les sauvegardes automatiques
3. Activer le firewall
4. Monitorer avec PM2

**Bon succès ! 💪**
