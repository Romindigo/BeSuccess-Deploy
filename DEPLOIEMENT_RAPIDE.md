# 🚀 Déploiement GitHub - Guide Rapide

## Étape 1 : Créer le repository GitHub

1. Allez sur **https://github.com/new**
2. Remplissez :
   - **Nom du repository** : `besuccess` (ou autre nom)
   - **Description** : `BeSuccess - Application de défis communautaires`
   - **Visibilité** : Public ou Private
   - ⚠️ **NE COCHEZ RIEN** (pas de README, .gitignore, license)
3. Cliquez sur **"Create repository"**

## Étape 2 : Pousser votre code

### Option A - Script automatique (recommandé)
```bash
./PUSH_TO_GITHUB.sh
```

### Option B - Commandes manuelles
```bash
# Remplacez NOM_DU_REPO par le nom que vous avez choisi
git remote add origin https://github.com/Romindigo/NOM_DU_REPO.git
git push -u origin main
```

## Exemple avec le nom "besuccess"
```bash
git remote add origin https://github.com/Romindigo/besuccess.git
git push -u origin main
```

## ✅ C'est tout !

Après le push, votre projet sera disponible sur :
`https://github.com/Romindigo/NOM_DU_REPO`

---

## 📌 À propos du Project Board

Le lien que vous avez partagé (`https://github.com/users/Romindigo/projects/2`) est un **tableau de projet** pour organiser vos tâches.

Pour y lier votre repository après le push :
1. Allez sur votre repository
2. Cliquez sur **"Projects"** en haut
3. Cliquez sur **"Add project"** et sélectionnez votre project board
