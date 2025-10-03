const translations = {
    fr: {
        // Auth
        'auth.login': 'Connexion',
        'auth.register': 'Inscription',
        'auth.logout': 'Déconnexion',
        'auth.email': 'Email',
        'auth.password': 'Mot de passe',
        'auth.username': 'Nom d\'utilisateur',
        'auth.login_success': 'Connexion réussie',
        'auth.register_success': 'Inscription réussie',
        'auth.invalid_credentials': 'Email ou mot de passe incorrect',
        'auth.email_exists': 'Cet email est déjà utilisé',
        'auth.banned': 'Votre compte a été banni',
        
        // Challenges
        'challenges.title': 'Défis',
        'challenges.completed': 'Complété',
        'challenges.difficulty': 'Difficulté',
        'challenges.points': 'points',
        'challenges.upload_photo': 'Uploader une photo',
        'challenges.view_gallery': 'Voir la galerie',
        
        // Upload
        'upload.title': 'Uploader une photo',
        'upload.caption': 'Légende (optionnelle)',
        'upload.drag_drop': 'Glissez-déposez ou cliquez pour sélectionner',
        'upload.max_size': 'Taille max: 5MB',
        'upload.success': 'Photo uploadée avec succès',
        'upload.error': 'Erreur lors de l\'upload',
        'upload.size_exceeded': 'Fichier trop volumineux (max 5MB)',
        
        // Profile
        'profile.title': 'Mon Profil',
        'profile.stats': 'Statistiques',
        'profile.challenges_completed': 'Défis complétés',
        'profile.total_points': 'Points totaux',
        'profile.progress': 'Progression',
        
        // Gallery
        'gallery.title': 'Galerie Communautaire',
        'gallery.no_photos': 'Aucune photo pour ce défi',
        'gallery.by': 'par',
        'gallery.share': 'Partager',
        'gallery.flag': 'Signaler',
        'gallery.flagged': 'Photo signalée',
        
        // Moderation
        'moderation.title': 'Modération',
        'moderation.approve': 'Approuver',
        'moderation.hide': 'Masquer',
        'moderation.delete': 'Supprimer',
        'moderation.flagged_photos': 'Photos signalées',
        'moderation.reason': 'Raison du signalement',
        
        // Admin
        'admin.dashboard': 'Tableau de bord',
        'admin.users': 'Utilisateurs',
        'admin.themes': 'Thématiques',
        'admin.challenges': 'Défis',
        'admin.photos': 'Photos',
        'admin.audit': 'Audit',
        
        // Common
        'common.save': 'Enregistrer',
        'common.cancel': 'Annuler',
        'common.delete': 'Supprimer',
        'common.edit': 'Modifier',
        'common.close': 'Fermer',
        'common.confirm': 'Confirmer',
        'common.loading': 'Chargement...',
        'common.error': 'Erreur',
        'common.success': 'Succès'
    },
    en: {
        // Auth
        'auth.login': 'Login',
        'auth.register': 'Sign up',
        'auth.logout': 'Logout',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.username': 'Username',
        'auth.login_success': 'Login successful',
        'auth.register_success': 'Registration successful',
        'auth.invalid_credentials': 'Invalid email or password',
        'auth.email_exists': 'Email already in use',
        'auth.banned': 'Your account has been banned',
        
        // Challenges
        'challenges.title': 'Challenges',
        'challenges.completed': 'Completed',
        'challenges.difficulty': 'Difficulty',
        'challenges.points': 'points',
        'challenges.upload_photo': 'Upload photo',
        'challenges.view_gallery': 'View gallery',
        
        // Upload
        'upload.title': 'Upload a photo',
        'upload.caption': 'Caption (optional)',
        'upload.drag_drop': 'Drag & drop or click to select',
        'upload.max_size': 'Max size: 5MB',
        'upload.success': 'Photo uploaded successfully',
        'upload.error': 'Upload error',
        'upload.size_exceeded': 'File too large (max 5MB)',
        
        // Profile
        'profile.title': 'My Profile',
        'profile.stats': 'Statistics',
        'profile.challenges_completed': 'Challenges completed',
        'profile.total_points': 'Total points',
        'profile.progress': 'Progress',
        
        // Gallery
        'gallery.title': 'Community Gallery',
        'gallery.no_photos': 'No photos for this challenge',
        'gallery.by': 'by',
        'gallery.share': 'Share',
        'gallery.flag': 'Report',
        'gallery.flagged': 'Photo reported',
        
        // Moderation
        'moderation.title': 'Moderation',
        'moderation.approve': 'Approve',
        'moderation.hide': 'Hide',
        'moderation.delete': 'Delete',
        'moderation.flagged_photos': 'Flagged photos',
        'moderation.reason': 'Report reason',
        
        // Admin
        'admin.dashboard': 'Dashboard',
        'admin.users': 'Users',
        'admin.themes': 'Themes',
        'admin.challenges': 'Challenges',
        'admin.photos': 'Photos',
        'admin.audit': 'Audit',
        
        // Common
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.close': 'Close',
        'common.confirm': 'Confirm',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success'
    }
};

const t = (key, lang = 'fr') => {
    return translations[lang]?.[key] || translations.fr[key] || key;
};

module.exports = { translations, t };
