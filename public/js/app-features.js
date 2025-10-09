// Intégration des nouvelles fonctionnalités

// Attendre que l'app principale soit chargée
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeNewFeatures();
    }, 100);
});

function initializeNewFeatures() {
    // 1. Initialiser les onglets Social et Classement
    initializeSocialTab();
    initializeLeaderboardTab();
    
    // 2. Gérer le support vidéo dans l'upload
    enhanceUploadModal();
    
    // 3. Ajouter les commentaires et likes aux photos
    enhancePhotoDisplay();
}

// ===== ONGLET SOCIAL =====
function initializeSocialTab() {
    const searchInput = document.getElementById('userSearchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchResults.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">🔍 Tapez au moins 2 caractères</p>';
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                searchResults.innerHTML = '<p style="text-align: center; padding: 40px;">⏳ Recherche...</p>';
                const users = await SocialModule.searchUsers(query);
                SocialModule.renderSearchResults(users, searchResults);
            } catch (error) {
                searchResults.innerHTML = '<p style="text-align: center; color: var(--danger-color); padding: 40px;">❌ Erreur de recherche</p>';
            }
        }, 500);
    });
}

// ===== ONGLET CLASSEMENT =====
async function initializeLeaderboardTab() {
    const leaderboardTab = document.querySelector('[data-tab="leaderboard"]');
    
    if (!leaderboardTab) return;
    
    leaderboardTab.addEventListener('click', async () => {
        const container = document.getElementById('leaderboardContainer');
        if (!container) return;
        
        try {
            container.innerHTML = '<p style="text-align: center; padding: 40px;">⏳ Chargement du classement...</p>';
            const leaderboard = await SocialModule.getLeaderboard();
            SocialModule.renderLeaderboard(leaderboard, container);
        } catch (error) {
            container.innerHTML = '<p style="text-align: center; color: var(--danger-color); padding: 40px;">❌ Erreur de chargement</p>';
        }
    });
}

// ===== SUPPORT VIDÉO =====
function enhanceUploadModal() {
    const photoFile = document.getElementById('photoFile');
    const photoPreview = document.getElementById('photoPreview');
    const videoPreview = document.getElementById('videoPreview');
    const uploadZone = document.getElementById('uploadZone');
    
    if (!photoFile) return;
    
    // Gérer la sélection de fichier
    photoFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Vérifier la taille (50MB max)
        if (file.size > 52428800) {
            alert('❌ Fichier trop volumineux (max 50MB)');
            photoFile.value = '';
            return;
        }
        
        const fileType = file.type;
        const reader = new FileReader();
        
        reader.onload = (event) => {
            if (fileType.startsWith('video/')) {
                // C'est une vidéo
                videoPreview.src = event.target.result;
                videoPreview.classList.remove('hidden');
                photoPreview.classList.add('hidden');
                uploadZone.querySelector('.upload-placeholder')?.classList.add('hidden');
            } else {
                // C'est une image
                photoPreview.src = event.target.result;
                photoPreview.classList.remove('hidden');
                videoPreview.classList.add('hidden');
                uploadZone.querySelector('.upload-placeholder')?.classList.add('hidden');
            }
        };
        
        reader.readAsDataURL(file);
    });
}

// ===== COMMENTAIRES ET LIKES =====
function enhancePhotoDisplay() {
    // Observer pour détecter quand la galerie s'ouvre
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList?.contains('photo-card')) {
                    addInteractiveFeatures(node);
                }
            });
        });
    });
    
    // Observer la galerie
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
        observer.observe(galleryGrid, { childList: true, subtree: true });
    }
}

function addInteractiveFeatures(photoCard) {
    const photoId = photoCard.dataset.photoId;
    if (!photoId) return;
    
    // Ajouter bouton like
    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-button';
    likeBtn.innerHTML = `
        <span class="like-icon">❤️</span>
        <span class="like-count">0</span>
    `;
    
    // Ajouter section commentaires
    const commentsSection = document.createElement('div');
    commentsSection.className = 'comments-container';
    commentsSection.innerHTML = `
        <div class="comments-header">
            <h3>💬 Commentaires</h3>
        </div>
        <div class="comments-list-wrapper"></div>
        <form class="comment-form" id="comment-form-${photoId}">
            <textarea 
                class="form-input" 
                placeholder="Ajouter un commentaire..." 
                rows="2" 
                maxlength="500"
                required></textarea>
            <button type="submit" class="btn btn-primary">Envoyer</button>
        </form>
    `;
    
    // Insérer après l'image
    const photoImg = photoCard.querySelector('img, video');
    if (photoImg && photoImg.parentElement) {
        photoImg.parentElement.insertAdjacentElement('afterend', likeBtn);
        photoCard.appendChild(commentsSection);
    }
    
    // Charger les données
    loadPhotoInteractions(photoId, likeBtn, commentsSection);
    
    // Event listeners
    likeBtn.addEventListener('click', () => handleLikeClick(photoId, likeBtn));
    
    const form = commentsSection.querySelector('form');
    form.addEventListener('submit', (e) => handleCommentSubmit(e, photoId, commentsSection));
}

async function loadPhotoInteractions(photoId, likeBtn, commentsSection) {
    try {
        // Charger les commentaires
        const commentsList = commentsSection.querySelector('.comments-list-wrapper');
        await CommentsModule.loadComments(photoId, commentsList);
        
        // Charger le statut like
        const isLiked = await CommentsModule.checkLiked(photoId);
        if (isLiked) {
            likeBtn.classList.add('liked');
        }
        
        // Charger le nombre de likes (depuis l'API photos)
        const response = await fetch(`/api/photos/${photoId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const photo = await response.json();
            const likeCount = likeBtn.querySelector('.like-count');
            if (likeCount) {
                // Compter les likes via l'API
                const likesResponse = await fetch(`/api/photos/challenge/${photo.challenge_id}`);
                const photos = await likesResponse.json();
                const currentPhoto = photos.find(p => p.id == photoId);
                if (currentPhoto) {
                    likeCount.textContent = currentPhoto.likes_count || 0;
                }
            }
        }
    } catch (error) {
        console.error('Erreur chargement interactions:', error);
    }
}

async function handleLikeClick(photoId, likeBtn) {
    try {
        const result = await CommentsModule.toggleLike(photoId);
        
        if (result.liked) {
            likeBtn.classList.add('liked');
        } else {
            likeBtn.classList.remove('liked');
        }
        
        const likeCount = likeBtn.querySelector('.like-count');
        if (likeCount) {
            likeCount.textContent = result.likes_count;
        }
    } catch (error) {
        console.error('Erreur like:', error);
        alert('❌ Erreur lors du like');
    }
}

async function handleCommentSubmit(e, photoId, commentsSection) {
    e.preventDefault();
    
    const form = e.target;
    const textarea = form.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) return;
    
    try {
        const parentId = form.dataset.parentId || null;
        await CommentsModule.addComment(photoId, content, parentId);
        
        // Recharger les commentaires
        const commentsList = commentsSection.querySelector('.comments-list-wrapper');
        await CommentsModule.loadComments(photoId, commentsList);
        
        // Réinitialiser le formulaire
        textarea.value = '';
        delete form.dataset.parentId;
    } catch (error) {
        console.error('Erreur ajout commentaire:', error);
        alert('❌ Erreur lors de l\'ajout du commentaire');
    }
}

// ===== GESTION DES VIDÉOS DANS LA GALERIE =====
// Observer les changements dans la lightbox pour gérer les vidéos
const lightbox = document.getElementById('lightbox');
if (lightbox) {
    const lightboxObserver = new MutationObserver(() => {
        const lightboxImage = document.getElementById('lightboxImage');
        if (lightboxImage && lightboxImage.src && lightboxImage.src.includes('.mp4')) {
            // Convertir l'img en video si c'est une vidéo
            const video = document.createElement('video');
            video.src = lightboxImage.src;
            video.controls = true;
            video.autoplay = true;
            video.style.maxWidth = '100%';
            video.style.maxHeight = '80vh';
            lightboxImage.replaceWith(video);
        }
    });
    
    lightboxObserver.observe(lightbox, { attributes: true, attributeFilter: ['class'] });
}

// ===== RENDU DES VIDÉOS DANS LES CARTES DE DÉFI =====
// Améliorer l'affichage des photos/vidéos dans les galeries
function renderMediaCard(media) {
    const isVideo = media.media_type === 'video';
    
    return `
        <div class="photo-card" data-photo-id="${media.id}">
            ${isVideo ? `
                <video 
                    src="/uploads/${media.filename}" 
                    class="photo-image"
                    controls
                    preload="metadata">
                    Votre navigateur ne supporte pas les vidéos.
                </video>
                <div class="video-badge">🎥 Vidéo</div>
            ` : `
                <img 
                    src="/uploads/${media.filename}" 
                    alt="${media.caption || 'Photo'}"
                    class="photo-image">
            `}
            <div class="photo-info">
                <p class="photo-user">${media.username}</p>
                ${media.caption ? `<p class="photo-caption">${media.caption}</p>` : ''}
            </div>
        </div>
    `;
}

// Export pour utilisation globale
window.initializeNewFeatures = initializeNewFeatures;
window.renderMediaCard = renderMediaCard;

console.log('✅ Nouvelles fonctionnalités chargées');
