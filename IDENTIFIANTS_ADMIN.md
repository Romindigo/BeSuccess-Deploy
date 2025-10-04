# 🔐 Identifiants Admin - BeSuccess

## Accès au Backoffice

**URL** : http://localhost:3001/admin.html

### Identifiants par défaut

- **Email** : `admin@besuccess.com`
- **Mot de passe** : `Admin123!`

⚠️ **Important** : Le mot de passe contient :
- Une majuscule (A)
- Des chiffres (123)
- Un caractère spécial (!)

---

## ⚙️ Changer le mot de passe admin

Pour changer le mot de passe admin, modifiez le fichier `.env` :

```env
ADMIN_EMAIL=admin@besuccess.com
ADMIN_PASSWORD=VotreNouveauMotDePasse
```

Puis réinitialisez la base de données :
```bash
npm run init-db
```

---

## 🎨 Branding

- **Logo** : 💎 (diamant - symbole de succès et d'excellence)
- **Couleurs** : 
  - Or : #D4AF37
  - Blanc : #FFFFFF
  - Noir : #000000

---

## 🔒 Sécurité

En production :
1. ✅ Changez immédiatement le mot de passe admin
2. ✅ Utilisez un mot de passe fort (12+ caractères)
3. ✅ Activez HTTPS
4. ✅ Configurez les variables d'environnement
5. ✅ Ne commitez JAMAIS le fichier `.env`
