#!/bin/bash

# 🧪 Script de test de connexion GitHub
# Username: Romindigo

echo "🧪 Test de connexion GitHub"
echo "============================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Connexion Internet
echo -e "${BLUE}📡 Test 1: Connexion Internet...${NC}"
if ping -c 1 github.com &> /dev/null; then
    echo -e "${GREEN}✅ Connexion Internet OK${NC}"
else
    echo -e "${RED}❌ Pas de connexion Internet${NC}"
    exit 1
fi
echo ""

# Test 2: Accès au profil GitHub
echo -e "${BLUE}👤 Test 2: Profil GitHub...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://github.com/Romindigo)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Profil GitHub accessible (Romindigo)${NC}"
else
    echo -e "${RED}❌ Profil non accessible (Code: $HTTP_CODE)${NC}"
    exit 1
fi
echo ""

# Test 3: Vérifier les repositories existants
echo -e "${BLUE}📦 Test 3: Repositories existants...${NC}"
REPOS=$(curl -s https://api.github.com/users/Romindigo/repos | grep -o '"name": "[^"]*"' | cut -d'"' -f4)
if [ -z "$REPOS" ]; then
    echo -e "${YELLOW}⚠️  Aucun repository public trouvé${NC}"
else
    echo -e "${GREEN}✅ Repositories trouvés:${NC}"
    echo "$REPOS" | while read repo; do
        echo "   - $repo"
    done
fi
echo ""

# Test 4: Vérifier si 'besuccess' existe
echo -e "${BLUE}🔍 Test 4: Repository 'besuccess'...${NC}"
REPO_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://github.com/Romindigo/besuccess)
if [ "$REPO_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Repository 'besuccess' existe déjà${NC}"
    REPO_EXISTS=true
elif [ "$REPO_CODE" == "404" ]; then
    echo -e "${YELLOW}⚠️  Repository 'besuccess' n'existe pas encore${NC}"
    REPO_EXISTS=false
else
    echo -e "${RED}❌ Erreur lors de la vérification (Code: $REPO_CODE)${NC}"
fi
echo ""

# Test 5: Configuration Git locale
echo -e "${BLUE}⚙️  Test 5: Configuration Git locale...${NC}"
if git config user.name &> /dev/null && git config user.email &> /dev/null; then
    echo -e "${GREEN}✅ Git configuré:${NC}"
    echo "   Nom: $(git config user.name)"
    echo "   Email: $(git config user.email)"
else
    echo -e "${YELLOW}⚠️  Git pas complètement configuré${NC}"
    echo "   Exécutez:"
    echo "   git config --global user.name \"Votre Nom\""
    echo "   git config --global user.email \"votre@email.com\""
fi
echo ""

# Test 6: État du repository local
echo -e "${BLUE}📁 Test 6: Repository local...${NC}"
if [ -d .git ]; then
    echo -e "${GREEN}✅ Repository Git initialisé${NC}"
    BRANCH=$(git branch --show-current)
    echo "   Branche actuelle: $BRANCH"
    COMMITS=$(git rev-list --count HEAD)
    echo "   Nombre de commits: $COMMITS"
    
    # Vérifier si un remote existe
    REMOTE=$(git remote -v | grep origin)
    if [ -z "$REMOTE" ]; then
        echo -e "${YELLOW}   ⚠️  Aucun remote configuré${NC}"
    else
        echo -e "${GREEN}   ✅ Remote configuré:${NC}"
        echo "   $REMOTE"
    fi
else
    echo -e "${RED}❌ Pas de repository Git${NC}"
fi
echo ""

# Résumé
echo "=================================="
echo -e "${BLUE}📊 RÉSUMÉ${NC}"
echo "=================================="
echo ""

if [ "$REPO_EXISTS" = false ]; then
    echo -e "${YELLOW}📝 PROCHAINES ÉTAPES:${NC}"
    echo ""
    echo "1. Créez le repository sur GitHub:"
    echo "   👉 https://github.com/new"
    echo "   Nom: besuccess"
    echo "   Visibilité: Public ou Private"
    echo "   ⚠️  Ne cochez RIEN (pas de README, .gitignore, license)"
    echo ""
    echo "2. Puis exécutez:"
    echo "   git remote add origin https://github.com/Romindigo/besuccess.git"
    echo "   git push -u origin main"
    echo ""
else
    echo -e "${GREEN}✅ Le repository existe déjà !${NC}"
    echo ""
    echo "Pour pousser votre code:"
    echo "   git remote add origin https://github.com/Romindigo/besuccess.git"
    echo "   git push -u origin main"
    echo ""
fi

echo -e "${GREEN}✅ Tests de connexion terminés !${NC}"
