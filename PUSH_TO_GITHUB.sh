#!/bin/bash

# 🚀 Script de push vers GitHub - BeSuccess
# Username GitHub: Romindigo

echo "🎯 Push vers GitHub"
echo "==================="
echo ""

# Demander le nom du repository
read -p "📝 Entrez le nom de votre repository GitHub (par défaut: besuccess): " REPO_NAME
REPO_NAME=${REPO_NAME:-besuccess}

echo ""
echo "🔗 Configuration du remote..."
git remote add origin https://github.com/Romindigo/$REPO_NAME.git

echo "📤 Push vers GitHub..."
git push -u origin main

echo ""
echo "✅ Terminé !"
echo "🌐 Votre projet est maintenant sur: https://github.com/Romindigo/$REPO_NAME"
