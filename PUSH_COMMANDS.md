# 🚀 Commandes pour pousser sur GitHub

## Exécute ces commandes dans l'ordre :

```bash
# 1. Ajouter l'URL de ton repo GitHub (remplace TON_USERNAME par ton vrai username)
git remote add origin https://github.com/TON_USERNAME/besuccess.git

# 2. Vérifier que c'est bien ajouté
git remote -v

# 3. Pousser le code
git push -u origin main
```

## Si tu as une erreur "remote origin already exists" :

```bash
# Supprimer l'ancien remote
git remote remove origin

# Puis refaire l'étape 1
git remote add origin https://github.com/TON_USERNAME/besuccess.git
git push -u origin main
```

## Exemple avec ton username :

Si ton username GitHub est "romainlimare" :

```bash
git remote add origin https://github.com/romainlimare/besuccess.git
git push -u origin main
```

---

**Une fois poussé, ton code sera visible sur GitHub ! 🎉**
