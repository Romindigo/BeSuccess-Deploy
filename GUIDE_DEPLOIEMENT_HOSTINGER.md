# 🚀 Guide de Déploiement BeSuccess sur Hostinger

**Date** : 14 Octobre 2025  
**Plateforme** : Hostinger VPS ou Cloud Hosting  
**Application** : BeSuccess - Sortie de zone de confort

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Choix de l'hébergement](#choix-hébergement)
3. [Préparation du code](#préparation-code)
4. [Configuration du serveur](#configuration-serveur)
5. [Déploiement](#déploiement)
6. [Configuration DNS](#configuration-dns)
7. [SSL/HTTPS](#ssl-https)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Prérequis

### Ce dont vous avez besoin

- ✅ Compte Hostinger actif
- ✅ Nom de domaine (ex: besuccess.com)
- ✅ Accès SSH au serveur
- ✅ Code source prêt sur GitHub

### Recommandations Hostinger

Pour une application Node.js, vous avez besoin de :

**Option 1 : VPS Hosting** (Recommandé) ⭐
- KVM 1 ou supérieur
- 1 GB RAM minimum (2 GB recommandé)
- 20 GB SSD
- Ubuntu 20.04 ou 22.04
- **Prix** : ~4-8€/mois

**Option 2 : Cloud Hosting**
- Cloud Startup ou supérieur
- Support Node.js intégré
- **Prix** : ~10-15€/mois

**Option 3 : Hébergement Partagé** ❌
- Ne supporte PAS Node.js
- Ne convient PAS pour cette application

---

## 🏗️ Choix de l'Hébergement

### Étape 1 : Commander un VPS

1. Allez sur https://www.hostinger.fr
2. Cliquez sur **VPS Hosting**
3. Choisissez **KVM 1** ou supérieur
4. Sélectionnez :
   - OS : **Ubuntu 22.04 64-bit**
   - Localisation : **Europe** (pour performance)
   - Période : Au choix
5. Validez la commande

### Étape 2 : Accéder au VPS

Après l'activation (quelques minutes), vous recevrez :
```
IP du serveur : 123.456.789.012
Utilisateur SSH : root
Mot de passe SSH : xxxxxxxxxx
```

---

## 🛠️ Préparation du Code

### 1. Créer un fichier de configuration production

Créez `.env.production` :

```bash
# Configuration Production
NODE_ENV=production
PORT=3000
ADMIN_PORT=3001

# Database
DB_PATH=/var/www/besuccess/database/challenges.db

# JWT
JWT_SECRET=VOTRE_SECRET_SUPER_SECURISE_ICI_CHANGEZ_MOI

# URLs
DOMAIN=https://besuccess.com
ADMIN_DOMAIN=https://admin.besuccess.com

# Uploads
MAX_FILE_SIZE=52428800
UPLOAD_PATH=/var/www/besuccess/uploads

# Session
SESSION_SECRET=AUTRE_SECRET_SUPER_SECURISE_CHANGEZ_MOI
```

### 2. Créer scripts de démarrage

Créez `package.json` scripts :

```json
{
  "scripts": {
    "start": "node server/index.js",
    "start:admin": "node server/admin.js",
    "start:prod": "pm2 start ecosystem.config.js",
    "stop:prod": "pm2 stop all",
    "restart:prod": "pm2 restart all",
    "logs": "pm2 logs"
  }
}
```

### 3. Créer fichier PM2

Créez `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [
    {
      name: 'besuccess-user',
      script: './server/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'besuccess-admin',
      script: './server/admin.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
```

### 4. Créer .gitignore

Assurez-vous d'avoir :

```
node_modules/
.env
.env.production
uploads/*
!uploads/.gitkeep
server/database/*.db
server/database/*.db-*
*.log
.DS_Store
```

### 5. Commit et push

```bash
git add .
git commit -m "🚀 Préparation déploiement production"
git push origin main
```

---

## 🖥️ Configuration du Serveur

### Étape 1 : Connexion SSH

```bash
ssh root@VOTRE_IP_SERVEUR
# Entrer le mot de passe reçu par email
```

### Étape 2 : Mise à jour du système

```bash
# Mettre à jour les paquets
apt update && apt upgrade -y

# Installer les outils essentiels
apt install -y curl git build-essential nginx
```

### Étape 3 : Installer Node.js

```bash
# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Vérifier l'installation
node --version  # Devrait afficher v20.x.x
npm --version   # Devrait afficher 10.x.x
```

### Étape 4 : Installer PM2

```bash
# PM2 pour gérer les processus Node.js
npm install -g pm2

# Vérifier
pm2 --version
```

### Étape 5 : Créer utilisateur non-root

```bash
# Créer utilisateur pour l'application
adduser besuccess
usermod -aG sudo besuccess

# Basculer sur cet utilisateur
su - besuccess
```

### Étape 6 : Créer structure de dossiers

```bash
# Créer dossiers
sudo mkdir -p /var/www/besuccess
sudo chown -R besuccess:besuccess /var/www/besuccess
cd /var/www/besuccess
```

---

## 📦 Déploiement

### Méthode 1 : Avec Git (Recommandé)

```bash
# Cloner le repository
cd /var/www/besuccess
git clone https://github.com/Romindigo/BeSuccess-Deploy.git .

# Installer les dépendances
npm ci --production

# Créer dossiers nécessaires
mkdir -p uploads/photos uploads/videos uploads/profiles
mkdir -p server/database

# Copier et configurer .env
nano .env.production
# Coller la configuration et modifier les secrets

# Renommer en .env
mv .env.production .env
```

### Méthode 2 : Upload manuel (Alternative)

```bash
# Sur votre machine locale
cd /Users/romainlimare/CascadeProjects/windsurf-project
tar -czf besuccess.tar.gz --exclude='node_modules' --exclude='.git' .

# Upload via SCP
scp besuccess.tar.gz besuccess@VOTRE_IP:/var/www/besuccess/

# Sur le serveur
cd /var/www/besuccess
tar -xzf besuccess.tar.gz
rm besuccess.tar.gz
npm ci --production
```

### Étape 7 : Initialiser la base de données

```bash
cd /var/www/besuccess

# Créer la base de données
node server/database/init-db.js

# Exécuter migrations
node server/database/migrate-groups.js

# Créer comptes de test
node server/scripts/create-test-users.js
```

### Étape 8 : Définir les permissions

```bash
# Permissions correctes
sudo chown -R besuccess:besuccess /var/www/besuccess
chmod -R 755 /var/www/besuccess
chmod -R 775 /var/www/besuccess/uploads
chmod 600 /var/www/besuccess/.env
```

---

## 🌐 Configuration Nginx

### Étape 1 : Créer configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/besuccess
```

Collez :

```nginx
# Configuration pour le site utilisateur
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /uploads {
        alias /var/www/besuccess/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Configuration pour l'admin
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Étape 2 : Activer la configuration

```bash
# Créer lien symbolique
sudo ln -s /etc/nginx/sites-available/besuccess /etc/nginx/sites-enabled/

# Supprimer config par défaut
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## 🔒 Configuration DNS

### Sur Hostinger Panel

1. Allez dans **Domaines** → Votre domaine
2. Cliquez sur **Gérer les DNS**
3. Ajoutez ces enregistrements :

```
Type    Nom     Valeur                  TTL
A       @       VOTRE_IP_SERVEUR        3600
A       www     VOTRE_IP_SERVEUR        3600
A       admin   VOTRE_IP_SERVEUR        3600
```

4. Sauvegardez et attendez propagation (5-30 minutes)

### Vérifier DNS

```bash
# Sur votre machine
nslookup besuccess.com
nslookup admin.besuccess.com
```

---

## 🔐 SSL/HTTPS avec Let's Encrypt

### Étape 1 : Installer Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Étape 2 : Obtenir certificats SSL

```bash
# Pour les deux domaines
sudo certbot --nginx -d besuccess.com -d www.besuccess.com -d admin.besuccess.com

# Suivre les instructions :
# - Entrer email
# - Accepter les conditions
# - Choisir redirection HTTPS (option 2)
```

### Étape 3 : Renouvellement automatique

```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Le renouvellement automatique est déjà configuré
# Vérifie : /etc/cron.d/certbot
```

---

## 🚀 Démarrage de l'Application

### Étape 1 : Démarrer avec PM2

```bash
cd /var/www/besuccess

# Démarrer les applications
pm2 start ecosystem.config.js

# Vérifier le statut
pm2 status

# Voir les logs
pm2 logs
```

### Étape 2 : Configuration démarrage automatique

```bash
# Sauvegarder la configuration PM2
pm2 save

# Créer script de démarrage
pm2 startup

# Copier et exécuter la commande affichée
# Elle ressemblera à :
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u besuccess --hp /home/besuccess
```

### Étape 3 : Tester

Ouvrez votre navigateur :
- **Site utilisateur** : https://besuccess.com
- **Admin** : https://admin.besuccess.com

---

## 📊 Commandes Utiles

### PM2

```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs
pm2 logs besuccess-user
pm2 logs besuccess-admin

# Redémarrer
pm2 restart all
pm2 restart besuccess-user

# Arrêter
pm2 stop all

# Informations détaillées
pm2 info besuccess-user

# Monitoring
pm2 monit
```

### Nginx

```bash
# Tester la configuration
sudo nginx -t

# Redémarrer
sudo systemctl restart nginx

# Status
sudo systemctl status nginx

# Voir les logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Système

```bash
# Espace disque
df -h

# Utilisation RAM
free -h

# Processus
htop

# Logs système
journalctl -xe
```

---

## 🔄 Mises à Jour

### Déployer une mise à jour

```bash
# Se connecter au serveur
ssh besuccess@VOTRE_IP

# Aller dans le dossier
cd /var/www/besuccess

# Récupérer les modifications
git pull origin main

# Installer nouvelles dépendances
npm ci --production

# Redémarrer les applications
pm2 restart all

# Vérifier
pm2 status
pm2 logs
```

### Script de déploiement automatique

Créez `deploy.sh` :

```bash
#!/bin/bash
echo "🚀 Déploiement en cours..."

cd /var/www/besuccess
git pull origin main
npm ci --production
pm2 restart all

echo "✅ Déploiement terminé!"
pm2 status
```

Rendez-le exécutable :

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 💾 Sauvegardes

### Script de sauvegarde base de données

Créez `backup.sh` :

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/besuccess/backups"
mkdir -p $BACKUP_DIR

# Backup database
cp /var/www/besuccess/server/database/challenges.db $BACKUP_DIR/challenges_$DATE.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/besuccess/uploads

# Garder seulement les 7 derniers jours
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup terminé: $DATE"
```

### Cron pour sauvegardes automatiques

```bash
# Editer crontab
crontab -e

# Ajouter (backup tous les jours à 2h du matin)
0 2 * * * /var/www/besuccess/backup.sh >> /var/log/besuccess-backup.log 2>&1
```

---

## 🔥 Troubleshooting

### Problème 1 : Site inaccessible

```bash
# Vérifier PM2
pm2 status
pm2 logs

# Vérifier Nginx
sudo systemctl status nginx
sudo nginx -t

# Vérifier ports
sudo netstat -tulpn | grep -E '(3000|3001|80|443)'
```

### Problème 2 : Erreur 502 Bad Gateway

```bash
# Les applications Node.js ne tournent pas
pm2 restart all

# Vérifier les logs
pm2 logs

# Vérifier Nginx
sudo tail -f /var/log/nginx/error.log
```

### Problème 3 : Upload ne fonctionne pas

```bash
# Vérifier permissions
ls -la /var/www/besuccess/uploads

# Corriger si nécessaire
sudo chown -R besuccess:besuccess /var/www/besuccess/uploads
chmod -R 775 /var/www/besuccess/uploads

# Vérifier Nginx client_max_body_size
sudo nano /etc/nginx/sites-available/besuccess
# Doit avoir : client_max_body_size 50M;
```

### Problème 4 : Base de données verrouillée

```bash
# Vérifier processus utilisant la DB
lsof /var/www/besuccess/server/database/challenges.db

# Redémarrer applications
pm2 restart all
```

### Problème 5 : Certificat SSL expiré

```bash
# Renouveler manuellement
sudo certbot renew

# Forcer renouvellement
sudo certbot renew --force-renewal

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## 📈 Monitoring et Performance

### Installer monitoring

```bash
# Installer monitoring PM2
pm2 install pm2-logrotate

# Configurer rotation des logs
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Monitoring avec PM2 Plus (Optionnel)

```bash
# Créer compte sur https://app.pm2.io
# Puis connecter
pm2 link PRIVATE_KEY PUBLIC_KEY
```

---

## 🔐 Sécurité

### Firewall

```bash
# Installer UFW
sudo apt install -y ufw

# Configurer
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer
sudo ufw enable

# Vérifier
sudo ufw status
```

### Fail2Ban

```bash
# Installer
sudo apt install -y fail2ban

# Configurer
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Activer
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Mises à jour automatiques

```bash
# Installer
sudo apt install -y unattended-upgrades

# Configurer
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## ✅ Checklist de Déploiement

### Avant déploiement
- [ ] Code testé en local
- [ ] `.env.production` configuré
- [ ] Secrets JWT/Session changés
- [ ] Code pushé sur GitHub
- [ ] VPS Hostinger commandé
- [ ] Domaine configuré

### Pendant déploiement
- [ ] Serveur mis à jour
- [ ] Node.js installé
- [ ] PM2 installé
- [ ] Code déployé
- [ ] Dépendances installées
- [ ] Base de données initialisée
- [ ] Nginx configuré
- [ ] DNS configuré
- [ ] SSL installé
- [ ] Applications démarrées

### Après déploiement
- [ ] Site accessible (https://besuccess.com)
- [ ] Admin accessible (https://admin.besuccess.com)
- [ ] Upload photos/vidéos fonctionnel
- [ ] Connexion/inscription OK
- [ ] Défis affichés
- [ ] Groupes fonctionnels
- [ ] Sauvegardes configurées
- [ ] Monitoring actif
- [ ] Firewall configuré

---

## 💰 Coûts Estimés

### Hostinger VPS
- **KVM 1** : ~4€/mois
- **KVM 2** : ~8€/mois (recommandé si > 100 utilisateurs)
- **KVM 4** : ~15€/mois (pour forte audience)

### Domaine
- **.com** : ~10€/an
- **.fr** : ~10€/an

### SSL
- **Let's Encrypt** : GRATUIT

### Total
- **Minimum** : ~4€/mois + 10€/an domaine
- **Recommandé** : ~8€/mois + 10€/an domaine

---

## 📞 Support

### Hostinger Support
- Chat 24/7 : https://www.hostinger.fr
- Documentation : https://support.hostinger.com
- Tutoriels VPS : https://www.hostinger.fr/tutoriels/vps

### Ressources
- PM2 Doc : https://pm2.keymetrics.io/docs
- Nginx Doc : https://nginx.org/en/docs
- Let's Encrypt : https://letsencrypt.org/docs

---

## 🎉 Félicitations !

Votre application **BeSuccess** est maintenant en ligne et accessible au monde entier ! 🚀

**URLs** :
- 🌐 **Site principal** : https://besuccess.com
- 👨‍💼 **Administration** : https://admin.besuccess.com

---

**Date de création** : 14 Octobre 2025  
**Version** : 1.0  
**Auteur** : Guide de déploiement BeSuccess
