// Améliorations du profil utilisateur

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        enhanceProfileTab();
    }, 500);
});

function enhanceProfileTab() {
    // Ajouter le bouton d'édition du profil
    addEditProfileButton();
    
    // Intercepter le chargement du profil pour afficher la progression correctement
    enhanceProfileDisplay();
}

function addEditProfileButton() {
    const profileHeader = document.querySelector('.profile-header');
    if (!profileHeader) return;
    
    // Vérifier si le bouton existe déjà
    if (document.getElementById('editProfileBtn')) return;
    
    const editButton = document.createElement('button');
    editButton.id = 'editProfileBtn';
    editButton.className = 'btn btn-secondary';
    editButton.innerHTML = '✏️ Modifier le profil';
    editButton.style.marginTop = '15px';
    
    editButton.addEventListener('click', () => {
        ProfileEditor.showEditProfileModal();
    });
    
    profileHeader.appendChild(editButton);
}

function enhanceProfileDisplay() {
    // Observer les changements dans le profil
    const observer = new MutationObserver(() => {
        updateProgressDisplay();
    });
    
    const profileTab = document.getElementById('profileTab');
    if (profileTab) {
        observer.observe(profileTab, { childList: true, subtree: true });
    }
    
    // Mise à jour immédiate
    updateProgressDisplay();
}

async function updateProgressDisplay() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Récupérer les données utilisateur
        const response = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return;
        
        const user = await response.json();
        
        // Mettre à jour les statistiques
        const statChallenges = document.getElementById('statChallenges');
        const statPoints = document.getElementById('statPoints');
        const statProgress = document.getElementById('statProgress');
        const progressFill = document.getElementById('progressFill');
        
        if (statChallenges) {
            // Afficher défis complétés avec bonus
            if (user.bonus_challenges > 0) {
                statChallenges.innerHTML = `
                    ${user.challenges_completed}
                    <span style="font-size: 14px; display: block; color: var(--primary-color);">
                        (100 + ${user.bonus_challenges} bonus)
                    </span>
                `;
            } else {
                statChallenges.textContent = user.challenges_completed;
            }
        }
        
        if (statPoints) {
            statPoints.textContent = user.total_points;
        }
        
        if (statProgress) {
            statProgress.textContent = user.progress_percentage + '%';
        }
        
        if (progressFill) {
            progressFill.style.width = user.progress_percentage + '%';
            
            // Ajouter un effet visuel si l'objectif est atteint
            if (user.progress_percentage >= 100) {
                progressFill.style.background = 'linear-gradient(90deg, var(--success-color), var(--primary-color))';
            }
        }
        
        // Ajouter un badge si l'objectif de 100 est atteint
        if (user.challenges_completed >= 100 && !document.getElementById('completionBadge')) {
            const profileStats = document.querySelector('.profile-stats');
            if (profileStats) {
                const badge = document.createElement('div');
                badge.id = 'completionBadge';
                badge.style.cssText = `
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 15px;
                    background: linear-gradient(135deg, var(--primary-color), var(--success-color));
                    border-radius: 12px;
                    margin-top: 10px;
                `;
                badge.innerHTML = `
                    <div style="font-size: 32px; margin-bottom: 5px;">🏆</div>
                    <div style="font-size: 18px; font-weight: bold; color: white;">
                        OBJECTIF ATTEINT !
                    </div>
                    <div style="font-size: 14px; color: white; opacity: 0.9;">
                        Vous avez complété les 100 défis principaux !
                    </div>
                `;
                profileStats.appendChild(badge);
            }
        }
        
        // Mettre à jour l'avatar
        if (user.avatar_url) {
            const avatarElements = document.querySelectorAll('#profileAvatar, #userAvatar');
            avatarElements.forEach(avatar => {
                if (avatar.tagName === 'IMG') {
                    avatar.src = user.avatar_url;
                } else {
                    avatar.style.backgroundImage = `url(${user.avatar_url})`;
                }
            });
        }
        
        // Mettre à jour les infos de profil
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileName) profileName.textContent = user.username;
        if (profileEmail) profileEmail.textContent = user.email;
        
        // Afficher la bio et autres infos si disponibles
        displayProfileInfo(user);
        
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
    }
}

function displayProfileInfo(user) {
    // Vérifier si une section info existe déjà
    let infoSection = document.getElementById('profileInfoSection');
    
    if (!infoSection && (user.bio || user.location || user.website)) {
        const profileCard = document.querySelector('.profile-card');
        if (!profileCard) return;
        
        infoSection = document.createElement('div');
        infoSection.id = 'profileInfoSection';
        infoSection.style.cssText = `
            padding: 20px;
            margin-top: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
        `;
        
        profileCard.insertBefore(infoSection, profileCard.querySelector('.profile-stats'));
    }
    
    if (infoSection) {
        let html = '';
        
        if (user.bio) {
            html += `
                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--primary-color);">Bio</strong>
                    <p style="color: var(--text-primary); margin-top: 5px;">${user.bio}</p>
                </div>
            `;
        }
        
        if (user.location) {
            html += `
                <div style="margin-bottom: 10px; color: var(--text-secondary);">
                    📍 ${user.location}
                </div>
            `;
        }
        
        if (user.website) {
            html += `
                <div style="margin-bottom: 10px;">
                    <a href="${user.website}" target="_blank" 
                       style="color: var(--primary-color); text-decoration: none;">
                        🔗 ${user.website}
                    </a>
                </div>
            `;
        }
        
        infoSection.innerHTML = html;
    }
}

// Export pour utilisation globale
window.updateProgressDisplay = updateProgressDisplay;

console.log('✅ Améliorations du profil chargées');
