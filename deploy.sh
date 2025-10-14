#!/bin/bash

# Script de déploiement automatique BeSuccess
# Usage: ./deploy.sh

set -e

echo "🚀 Déploiement BeSuccess en cours..."
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Êtes-vous dans le bon répertoire ?"
    exit 1
fi

# Pull les dernières modifications
echo -e "${YELLOW}📥 Récupération des modifications...${NC}"
git pull origin main

# Installer les dépendances
echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
npm ci --production

# Redémarrer les applications avec PM2
echo -e "${YELLOW}🔄 Redémarrage des applications...${NC}"
pm2 restart all

# Attendre que les apps démarrent
sleep 2

# Afficher le statut
echo ""
echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo ""
pm2 status

echo ""
echo "📊 Pour voir les logs:"
echo "  pm2 logs besuccess-user"
echo "  pm2 logs besuccess-admin"
