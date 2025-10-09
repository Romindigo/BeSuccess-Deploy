// Module social - Recherche utilisateurs, profils, suivis
const SocialModule = {
    // Rechercher des utilisateurs
    async searchUsers(query) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/social/users/search?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await response.json();
            if (!response.ok) throw new Error(users.error);
            return users;
        } catch (error) {
            console.error('Erreur recherche:', error);
            throw error;
        }
    },

    // Afficher les résultats de recherche
    renderSearchResults(users, container) {
        if (users.length === 0) {
            container.innerHTML = '<p class="no-results">Aucun utilisateur trouvé</p>';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="user-card" data-user-id="${user.id}">
                <img src="${user.avatar_url || '/images/default-avatar.png'}" 
                     alt="${user.username}" 
                     class="user-avatar">
                <div class="user-info">
                    <h3 class="user-name">${user.username}</h3>
                    <p class="user-stats">
                        🏆 ${user.total_points} pts • 
                        ✅ ${user.completed_challenges} défis
                    </p>
                    <p class="user-followers">
                        ${user.followers_count} abonnés • 
                        ${user.following_count} abonnements
                    </p>
                </div>
                <button class="btn-view-profile" data-user-id="${user.id}">
                    Voir profil
                </button>
            </div>
        `).join('');

        // Attacher les événements
        container.querySelectorAll('.btn-view-profile').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showUserProfile(e.target.dataset.userId);
            });
        });
    },

    // Afficher le profil d'un utilisateur
    async showUserProfile(userId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/social/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const user = await response.json();
            if (!response.ok) throw new Error(user.error);

            // Charger la progression
            const progressResponse = await fetch(`/api/social/users/${userId}/progress`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const progress = await progressResponse.json();

            this.renderUserProfile(user, progress);
        } catch (error) {
            console.error('Erreur profil:', error);
            alert('Erreur lors du chargement du profil');
        }
    },

    // Rendre le profil utilisateur
    renderUserProfile(user, progress) {
        const modal = document.createElement('div');
        modal.className = 'modal-profile';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <div class="profile-header">
                    <img src="${user.avatar_url || '/images/default-avatar.png'}" 
                         alt="${user.username}" 
                         class="profile-avatar">
                    <div class="profile-info">
                        <h2>${user.username}</h2>
                        ${user.bio ? `<p class="profile-bio">${user.bio}</p>` : ''}
                        ${user.location ? `<p class="profile-location">📍 ${user.location}</p>` : ''}
                        ${user.website ? `<p class="profile-website">🔗 <a href="${user.website}" target="_blank">${user.website}</a></p>` : ''}
                    </div>
                    <button class="btn-follow" data-user-id="${user.id}" data-following="${user.is_following}">
                        ${user.is_following ? 'Ne plus suivre' : 'Suivre'}
                    </button>
                </div>
                
                <div class="profile-stats">
                    <div class="stat">
                        <div class="stat-value">${user.total_points}</div>
                        <div class="stat-label">Points</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${user.completed_challenges}</div>
                        <div class="stat-label">Défis réussis</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${user.followers_count}</div>
                        <div class="stat-label">Abonnés</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${user.following_count}</div>
                        <div class="stat-label">Abonnements</div>
                    </div>
                </div>

                ${user.badges && user.badges.length > 0 ? `
                    <div class="profile-badges">
                        <h3>🏅 Badges</h3>
                        <div class="badges-list">
                            ${user.badges.map(badge => `
                                <div class="badge" title="${badge.badge_description}">
                                    ${badge.badge_name}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="profile-progress">
                    <h3>📊 Progression</h3>
                    ${this.renderProgress(progress)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Événements
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.btn-follow').addEventListener('click', async (e) => {
            await this.toggleFollow(user.id);
            modal.remove();
            this.showUserProfile(user.id);
        });
    },

    // Rendre la progression
    renderProgress(progress) {
        if (progress.length === 0) {
            return '<p class="no-progress">Aucun défi complété</p>';
        }

        // Grouper par thème
        const byTheme = {};
        progress.forEach(p => {
            if (!byTheme[p.theme_name]) {
                byTheme[p.theme_name] = {
                    name: p.theme_name,
                    color: p.theme_color,
                    icon: p.theme_icon,
                    challenges: []
                };
            }
            byTheme[p.theme_name].challenges.push(p);
        });

        return `
            <div class="progress-themes">
                ${Object.values(byTheme).map(theme => `
                    <div class="theme-progress">
                        <h4 style="color: ${theme.color}">
                            ${theme.icon} ${theme.name} 
                            (${theme.challenges.length})
                        </h4>
                        <div class="challenges-grid">
                            ${theme.challenges.map(c => `
                                <div class="challenge-card completed">
                                    <div class="challenge-title">${c.title}</div>
                                    <div class="challenge-points">${c.points} pts</div>
                                    ${c.photo_id ? `
                                        <div class="challenge-media">
                                            ${c.media_type === 'video' 
                                                ? '🎥 Vidéo' 
                                                : '📷 Photo'}
                                        </div>
                                    ` : ''}
                                    <div class="challenge-date">
                                        ${new Date(c.completed_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Suivre/Ne plus suivre
    async toggleFollow(userId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/social/users/${userId}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            return result;
        } catch (error) {
            console.error('Erreur follow:', error);
            throw error;
        }
    },

    // Classement global
    async getLeaderboard() {
        try {
            const response = await fetch('/api/social/leaderboard');
            const leaderboard = await response.json();
            if (!response.ok) throw new Error(leaderboard.error);
            return leaderboard;
        } catch (error) {
            console.error('Erreur classement:', error);
            throw error;
        }
    },

    // Afficher le classement
    renderLeaderboard(users, container) {
        container.innerHTML = `
            <div class="leaderboard">
                <h2>🏆 Classement</h2>
                <div class="leaderboard-list">
                    ${users.map((user, index) => `
                        <div class="leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}">
                            <div class="rank">${index + 1}</div>
                            <img src="${user.avatar_url || '/images/default-avatar.png'}" 
                                 alt="${user.username}" 
                                 class="user-avatar-small">
                            <div class="user-details">
                                <div class="username">${user.username}</div>
                                <div class="user-info-small">
                                    ✅ ${user.completed_challenges} défis • 
                                    👥 ${user.followers_count} abonnés
                                </div>
                            </div>
                            <div class="user-points">${user.total_points} pts</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

window.SocialModule = SocialModule;
