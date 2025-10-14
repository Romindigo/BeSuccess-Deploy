#!/bin/bash

# Script de sauvegarde automatique BeSuccess
# Usage: ./backup.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/besuccess/backups"
APP_DIR="/var/www/besuccess"

# Créer le dossier de backup s'il n'existe pas
mkdir -p $BACKUP_DIR

echo "🔄 Sauvegarde BeSuccess - $DATE"
echo ""

# Backup de la base de données
echo "📊 Sauvegarde de la base de données..."
cp $APP_DIR/server/database/challenges.db $BACKUP_DIR/challenges_$DATE.db

# Backup des uploads
echo "📸 Sauvegarde des fichiers uploadés..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $APP_DIR uploads/

# Backup du fichier .env
echo "⚙️  Sauvegarde de la configuration..."
cp $APP_DIR/.env $BACKUP_DIR/env_$DATE.txt

# Afficher la taille des backups
echo ""
echo "📦 Taille des sauvegardes:"
ls -lh $BACKUP_DIR/*$DATE*

# Nettoyage des anciens backups (garder 7 jours)
echo ""
echo "🧹 Nettoyage des anciennes sauvegardes (> 7 jours)..."
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.txt" -mtime +7 -delete

echo ""
echo "✅ Sauvegarde terminée: $DATE"
echo "📁 Dossier: $BACKUP_DIR"
