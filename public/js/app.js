// Configuration
const API_URL = window.location.origin;
let currentUser = null;
let currentLang = 'fr';
let challenges = [];
let themes = [];
let currentThemeId = null; // null = tous les défis
let currentPhotoIndex = 0;
let currentPhotos = [];
let currentChallengeId = null;

// Traductions
const translations = {
    fr: {
        'challenges': 'Défis',
        'profile': 'Profil',
        'login': 'Connexion',
        'register': 'Inscription',
        'logout': 'Déconnexion',
        'upload_photo': 'Uploader une photo',
        'view_gallery': 'Voir la galerie',
        'completed': 'Complété',
        'points': 'points',
        'difficulty': 'Difficulté',
        'share': 'Partager',
        'flag': 'Signaler',
        'no_account': 'Pas encore de compte ?',
        'have_account': 'Déjà un compte ?',
        'challenges_completed': 'Défis complétés',
        'total_points': 'Points totaux',
        'progress': 'Progression',
        'my_photos': 'Mes photos',
        'all_challenges': 'Tous les défis',
        'choose_challenge': 'Choisissez un défi et partagez votre exploit !',
        'upload_success': 'Photo uploadée avec succès !',
        'upload_error': 'Erreur lors de l\'upload',
        'login_success': 'Connexion réussie !',
        'register_success': 'Inscription réussie !',
        'photo_flagged': 'Photo signalée',
        'link_copied': 'Lien copié !',
        'max_size': 'Fichier trop volumineux (max 5MB)',
        'invalid_format': 'Format de fichier non autorisé'
    },
    en: {
        'challenges': 'Challenges',
        'profile': 'Profile',
        'login': 'Login',
        'register': 'Sign up',
        'logout': 'Logout',
        'upload_photo': 'Upload photo',
        'view_gallery': 'View gallery',
        'completed': 'Completed',
        'points': 'points',
        'difficulty': 'Difficulty',
        'share': 'Share',
        'flag': 'Report',
        'no_account': 'No account yet?',
        'have_account': 'Already have an account?',
        'challenges_completed': 'Challenges completed',
        'total_points': 'Total points',
        'progress': 'Progress',
        'my_photos': 'My photos',
        'all_challenges': 'All challenges',
        'choose_challenge': 'Choose a challenge and share your achievement!',
        'upload_success': 'Photo uploaded successfully!',
        'upload_error': 'Upload error',
        'login_success': 'Login successful!',
        'register_success': 'Registration successful!',
        'photo_flagged': 'Photo reported',
        'link_copied': 'Link copied!',
        'max_size': 'File too large (max 5MB)',
        'invalid_format': 'Invalid file format'
    }
};

const t = (key) => translations[currentLang][key] || key;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Vérifier le token
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            await loadUser();
            showApp();
        } catch (error) {
            localStorage.removeItem('token');
            showAuthModal();
        }
    } else {
        showAuthModal();
    }
    
    // Event listeners
    setupEventListeners();
    
    // Masquer le loader
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1000);
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Auth modal
    document.getElementById('authSwitchBtn').addEventListener('click', toggleAuthMode);
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.getElementById('closeAuthModal').addEventListener('click', () => {
        if (currentUser) closeModal('authModal');
    });
    
    // Upload modal
    document.getElementById('closeUploadModal').addEventListener('click', () => closeModal('uploadModal'));
    document.getElementById('uploadZone').addEventListener('click', () => document.getElementById('photoFile').click());
    document.getElementById('photoFile').addEventListener('change', handleFileSelect);
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
    
    // Drag & drop
    const uploadZone = document.getElementById('uploadZone');
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', handleFileDrop);
    
    // Gallery modal
    document.getElementById('closeGalleryModal').addEventListener('click', () => closeModal('galleryModal'));
    
    // Lightbox
    document.getElementById('closeLightbox').addEventListener('click', () => closeLightbox());
    document.getElementById('lightboxPrev').addEventListener('click', () => navigateLightbox(-1));
    document.getElementById('lightboxNext').addEventListener('click', () => navigateLightbox(1));
    document.getElementById('shareBtn').addEventListener('click', sharePhoto);
    document.getElementById('flagBtn').addEventListener('click', flagPhoto);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox');
        if (lightbox.classList.contains('active')) {
            if (e.key === 'ArrowLeft') navigateLightbox(-1);
            if (e.key === 'ArrowRight') navigateLightbox(1);
            if (e.key === 'Escape') closeLightbox();
        }
    });
    
    // User menu
    document.getElementById('userAvatar')?.addEventListener('click', () => {
        document.getElementById('userDropdown').classList.toggle('hidden');
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Language toggle
    document.getElementById('langToggle').addEventListener('click', toggleLanguage);
}

// Auth
function showAuthModal() {
    document.getElementById('authModal').classList.add('active');
}

function toggleAuthMode() {
    const isLogin = document.getElementById('authTitle').textContent === t('login');
    
    if (isLogin) {
        document.getElementById('authTitle').textContent = t('register');
        document.getElementById('usernameGroup').style.display = 'block';
        document.getElementById('authSubmit').textContent = t('register');
        document.getElementById('authSwitchText').textContent = t('have_account');
        document.getElementById('authSwitchBtn').textContent = t('login');
    } else {
        document.getElementById('authTitle').textContent = t('login');
        document.getElementById('usernameGroup').style.display = 'none';
        document.getElementById('authSubmit').textContent = t('login');
        document.getElementById('authSwitchText').textContent = t('no_account');
        document.getElementById('authSwitchBtn').textContent = t('register');
    }
}

async function handleAuth(e) {
    e.preventDefault();
    
    const isLogin = document.getElementById('authTitle').textContent === t('login');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    
    try {
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin ? { email, password } : { email, password, username };
        
        const response = await fetch(API_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }
        
        localStorage.setItem('token', data.token);
        currentUser = data.user;
        
        showToast(isLogin ? t('login_success') : t('register_success'), 'success');
        closeModal('authModal');
        showApp();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadUser() {
    const response = await fetch(API_URL + '/api/users/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) throw new Error('Session expirée');
    
    currentUser = await response.json();
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    location.reload();
}

// App
async function showApp() {
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('userMenu').classList.remove('hidden');
    
    // Afficher l'avatar
    const initials = currentUser.username.substring(0, 2).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('profileAvatar').textContent = initials;
    
    // Charger les données
    await loadChallenges();
    await loadProfile();
}

function switchTab(tab) {
    // Update nav
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    if (tab === 'profile') {
        loadProfile();
        loadUserPhotos();
    }
    
    if (tab === 'groups' && typeof initGroups === 'function') {
        initGroups();
    }
}

// Challenges
async function loadChallenges() {
    try {
        // Charger les thèmes d'abord
        const themesResponse = await fetch(API_URL + '/api/challenges/themes');
        themes = await themesResponse.json();
        
        // Charger les défis
        const response = await fetch(API_URL + '/api/challenges', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        challenges = await response.json();
        
        // Afficher les filtres et les défis
        renderCategoryFilters();
        renderChallenges();
    } catch (error) {
        showToast('Erreur de chargement des défis', 'error');
    }
}

function renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    container.innerHTML = '';
    
    // Bouton "Tous"
    const allButton = document.createElement('button');
    allButton.className = `category-filter ${currentThemeId === null ? 'active' : ''}`;
    allButton.innerHTML = `
        <span>✨ Tous</span>
        <span class="count">${challenges.length}</span>
    `;
    allButton.onclick = () => filterByTheme(null);
    container.appendChild(allButton);
    
    // Boutons pour chaque catégorie
    themes.forEach(theme => {
        const count = challenges.filter(c => c.theme_id === theme.id).length;
        const button = document.createElement('button');
        button.className = `category-filter ${currentThemeId === theme.id ? 'active' : ''}`;
        button.innerHTML = `
            <span>${theme.icon} ${theme.name}</span>
            <span class="count">${count}</span>
        `;
        button.onclick = () => filterByTheme(theme.id);
        container.appendChild(button);
    });
}

function filterByTheme(themeId) {
    currentThemeId = themeId;
    renderCategoryFilters();
    renderChallenges();
}

function renderChallenges() {
    const container = document.getElementById('challengesList');
    const countContainer = document.getElementById('challengesCount');
    container.innerHTML = '';
    
    // Filtrer les défis selon la catégorie sélectionnée
    const filteredChallenges = currentThemeId === null 
        ? challenges 
        : challenges.filter(c => c.theme_id === currentThemeId);
    
    // Afficher le compteur
    const themeName = currentThemeId === null 
        ? 'Tous les défis' 
        : themes.find(t => t.id === currentThemeId)?.name || '';
    countContainer.textContent = `${filteredChallenges.length} défi${filteredChallenges.length > 1 ? 's' : ''} ${themeName ? 'dans "' + themeName + '"' : 'disponibles'}`;
    
    // Si aucun défi, afficher un message
    if (filteredChallenges.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Aucun défi dans cette catégorie.</p>';
        return;
    }
    
    filteredChallenges.forEach(challenge => {
        const card = document.createElement('div');
        card.className = `challenge-card ${challenge.completed ? 'completed' : ''}`;
        
        const stars = '★'.repeat(challenge.difficulty) + '☆'.repeat(5 - challenge.difficulty);
        
        card.innerHTML = `
            <div class="challenge-header">
                <span class="challenge-theme" style="background: ${challenge.theme_color}20; color: ${challenge.theme_color}">
                    ${challenge.theme_icon} ${challenge.theme_name}
                </span>
                <span class="challenge-status">${challenge.completed ? '✅' : ''}</span>
            </div>
            <h3 class="challenge-title">${challenge.title}</h3>
            <p class="challenge-description">${challenge.description}</p>
            <div class="challenge-meta">
                <div class="difficulty" title="${t('difficulty')}: ${challenge.difficulty}/5">
                    ${stars}
                </div>
                <span class="points">${challenge.points} ${t('points')}</span>
            </div>
            <div class="challenge-actions">
                <button class="btn btn-primary btn-sm" onclick="openUploadModal(${challenge.id})">
                    📸 ${t('upload_photo')}
                </button>
                <button class="btn btn-secondary btn-sm" onclick="openGallery(${challenge.id})">
                    🖼️ ${t('view_gallery')} (${challenge.photo_count})
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Upload
function openUploadModal(challengeId) {
    currentChallengeId = challengeId;
    const challenge = challenges.find(c => c.id === challengeId);
    
    document.getElementById('uploadChallengeInfo').innerHTML = `
        <h4 style="color: var(--gold); margin-bottom: 0.5rem;">${challenge.title}</h4>
        <p style="color: var(--gray-light); font-size: 0.9rem;">${challenge.description}</p>
    `;
    
    document.getElementById('uploadModal').classList.add('active');
    document.getElementById('photoFile').value = '';
    document.getElementById('caption').value = '';
    document.getElementById('photoPreview').classList.add('hidden');
    document.querySelector('.upload-placeholder').style.display = 'block';
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) previewFile(file);
}

function handleFileDrop(e) {
    e.preventDefault();
    document.getElementById('uploadZone').classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        document.getElementById('photoFile').files = e.dataTransfer.files;
        previewFile(file);
    }
}

function previewFile(file) {
    // Validation
    if (file.size > 5242880) {
        showToast(t('max_size'), 'error');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showToast(t('invalid_format'), 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('photoPreview').src = e.target.result;
        document.getElementById('photoPreview').classList.remove('hidden');
        document.querySelector('.upload-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

async function handleUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('photoFile');
    const caption = document.getElementById('caption').value;
    
    if (!fileInput.files[0]) {
        showToast('Veuillez sélectionner une photo', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('photo', fileInput.files[0]);
    formData.append('caption', caption);
    
    try {
        const response = await fetch(API_URL + `/api/photos/upload/${currentChallengeId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        showToast(t('upload_success'), 'success');
        closeModal('uploadModal');
        await loadChallenges();
        await loadProfile();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Gallery
async function openGallery(challengeId) {
    currentChallengeId = challengeId;
    const challenge = challenges.find(c => c.id === challengeId);
    
    document.getElementById('galleryTitle').textContent = challenge.title;
    
    try {
        const response = await fetch(API_URL + `/api/photos/challenge/${challengeId}`);
        currentPhotos = await response.json();
        
        const grid = document.getElementById('galleryGrid');
        grid.innerHTML = '';
        
        if (currentPhotos.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: var(--gray-light);">Aucune photo pour ce défi</p>';
        } else {
            currentPhotos.forEach((photo, index) => {
                const card = document.createElement('div');
                card.className = 'photo-card';
                card.onclick = () => openLightbox(index);
                
                card.innerHTML = `
                    <img src="/uploads/${photo.filename}" alt="${photo.caption || challenge.title}">
                    <div class="photo-overlay">
                        <strong>${photo.username}</strong>
                        ${photo.caption ? `<p>${photo.caption}</p>` : ''}
                    </div>
                `;
                
                grid.appendChild(card);
            });
        }
        
        document.getElementById('galleryModal').classList.add('active');
    } catch (error) {
        showToast('Erreur de chargement de la galerie', 'error');
    }
}

// Lightbox
function openLightbox(index) {
    currentPhotoIndex = index;
    updateLightbox();
    document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

function navigateLightbox(direction) {
    currentPhotoIndex += direction;
    if (currentPhotoIndex < 0) currentPhotoIndex = currentPhotos.length - 1;
    if (currentPhotoIndex >= currentPhotos.length) currentPhotoIndex = 0;
    updateLightbox();
}

function updateLightbox() {
    const photo = currentPhotos[currentPhotoIndex];
    document.getElementById('lightboxImage').src = `/uploads/${photo.filename}`;
    document.getElementById('lightboxUser').textContent = `Par ${photo.username}`;
    document.getElementById('lightboxDate').textContent = new Date(photo.created_at).toLocaleDateString('fr-FR');
    document.getElementById('lightboxCaption').textContent = photo.caption || '';
}

// Partage social
async function sharePhoto() {
    const photo = currentPhotos[currentPhotoIndex];
    const shareUrl = `${window.location.origin}/p/${photo.id}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: `100 Challenges - ${photo.username}`,
                text: photo.caption || 'Découvrez ce défi relevé !',
                url: shareUrl
            });
        } catch (error) {
            copyToClipboard(shareUrl);
        }
    } else {
        copyToClipboard(shareUrl);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(t('link_copied'), 'success');
    });
}

// Signalement
async function flagPhoto() {
    const photo = currentPhotos[currentPhotoIndex];
    const reason = prompt('Raison du signalement (optionnel):');
    
    try {
        const response = await fetch(API_URL + `/api/photos/${photo.id}/flag`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        if (!response.ok) throw new Error('Erreur de signalement');
        
        showToast(t('photo_flagged'), 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Profile
async function loadProfile() {
    try {
        const response = await fetch(API_URL + '/api/users/me', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        const profile = await response.json();
        
        document.getElementById('profileName').textContent = profile.username;
        document.getElementById('profileEmail').textContent = profile.email;
        document.getElementById('userName').textContent = profile.username;
        document.getElementById('statChallenges').textContent = profile.challenges_completed;
        document.getElementById('statPoints').textContent = profile.total_points;
        document.getElementById('statProgress').textContent = profile.progress_percentage + '%';
        document.getElementById('progressFill').style.width = profile.progress_percentage + '%';
    } catch (error) {
        showToast('Erreur de chargement du profil', 'error');
    }
}

async function loadUserPhotos() {
    try {
        const response = await fetch(API_URL + '/api/photos/user/me', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        const photos = await response.json();
        const container = document.getElementById('userPhotos');
        container.innerHTML = '';
        
        if (photos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray-light);">Aucune photo uploadée</p>';
        } else {
            photos.forEach(photo => {
                const card = document.createElement('div');
                card.className = 'photo-card';
                
                card.innerHTML = `
                    <img src="/uploads/${photo.filename}" alt="${photo.caption || photo.challenge_title}">
                    <div class="photo-overlay">
                        <strong>${photo.challenge_title}</strong>
                        ${photo.caption ? `<p>${photo.caption}</p>` : ''}
                    </div>
                `;
                
                container.appendChild(card);
            });
        }
    } catch (error) {
        showToast('Erreur de chargement des photos', 'error');
    }
}

// Language
function toggleLanguage() {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
    document.getElementById('currentLang').textContent = currentLang.toUpperCase();
    document.documentElement.lang = currentLang;
    
    // Recharger l'interface avec la nouvelle langue
    if (currentUser) {
        renderChallenges();
    }
    
    showToast(currentLang === 'fr' ? 'Langue: Français' : 'Language: English', 'info');
}

// Utilities
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
