#!/bin/bash

# 🚀 Script de déploiement GitHub - BeSuccess
# Auteur: BeSuccess
# Date: 3 octobre 2025

echo "🎯 Déploiement GitHub - BeSuccess"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Initialiser Git
echo -e "${BLUE}📦 Étape 1: Initialisation Git${NC}"
git init
echo ""

# 2. Ajouter tous les fichiers
echo -e "${BLUE}📝 Étape 2: Ajout des fichiers${NC}"
git add .
echo ""

# 3. Premier commit
echo -e "${BLUE}💾 Étape 3: Premier commit${NC}"
git commit -m "🎉 Initial commit - BeSuccess

✨ Fonctionnalités:
- Authentification JWT sécurisée
- 25 défis en 5 thématiques
- Upload photos (5MB, auto-resize)
- Galerie publique
- Partage social avec OG tags
- Modération complète (flag, hide, approve, delete)
- Dashboard admin temps réel
- i18n FR/EN
- Branding or/blanc/noir (#D4AF37)

🔒 Sécurité:
- JWT + Bcrypt
- Rate limiting
- Helmet headers
- Validation stricte

🗄️ Stack:
- Backend: Node.js + Express + SQLite
- Frontend: HTML5 + CSS3 + Vanilla JS
- Images: Sharp (resize)
"
echo ""

# 4. Branche main
echo -e "${BLUE}🌿 Étape 4: Création branche main${NC}"
git branch -M main
echo ""

# 5. Instructions finales
echo -e "${YELLOW}⚠️  DERNIÈRE ÉTAPE: Push sur GitHub${NC}"
echo ""
echo "📋 Deux options:"
echo ""
echo "OPTION 1 - Créer un nouveau repo:"
echo "  1. Va sur https://github.com/new"
echo "  2. Nom du repo: besuccess"
echo "  3. Description: BeSuccess - Application de défis communautaires"
echo "  4. Visibilité: Public ou Private"
echo "  5. ❌ Ne coche rien (pas de README, .gitignore, etc.)"
echo "  6. Clique 'Create repository'"
echo "  7. Exécute:"
echo ""
echo "     git remote add origin https://github.com/TON_USERNAME/besuccess.git"
echo "     git push -u origin main"
echo ""
echo "OPTION 2 - Utiliser un repo existant:"
echo "  git remote add origin https://github.com/TON_USERNAME/besuccess.git"
echo "  git push -u origin main"
echo ""
echo "=================================="
echo ""
echo -e "${GREEN}✅ Git configuré et prêt à push !${NC}"
