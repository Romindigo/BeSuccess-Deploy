// Configuration
const API_URL = window.location.origin;
let adminToken = null;
let currentFilter = 'all';

// Init
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupEventListeners();
});

function setupEventListeners() {
    // Login
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    
    // Navigation
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', () => switchSection(item.dataset.section));
    });
    
    // Logout
    document.getElementById('adminLogout')?.addEventListener('click', logout);
    
    // Users search
    document.getElementById('userSearch')?.addEventListener('input', filterUsers);
    
    // Photos filters
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentFilter = tab.dataset.filter;
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadPhotos();
        });
    });
    
    // Content tabs
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const content = tab.dataset.content;
            document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${content}Content`).classList.add('active');
            
            // Charger le contenu correspondant
            if (content === 'themes') {
                loadThemes();
            } else if (content === 'challenges') {
                loadChallengesAdmin();
            }
        });
    });
    
    // Content buttons
    document.getElementById('addThemeBtn')?.addEventListener('click', showCreateThemeModal);
    document.getElementById('addChallengeBtn')?.addEventListener('click', showCreateChallengeModal);
    
    // Add group button
    document.getElementById('addGroupBtn')?.addEventListener('click', showCreateGroupModal);
}

// Auth
function checkAdminAuth() {
    adminToken = localStorage.getItem('adminToken');
    
    if (adminToken) {
        showDashboard();
    } else {
        document.getElementById('adminLogin').classList.remove('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        const response = await fetch(API_URL + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        if (!data.user.isAdmin) {
            throw new Error('Accès refusé - Droits admin requis');
        }
        
        adminToken = data.token;
        localStorage.setItem('adminToken', adminToken);
        
        document.getElementById('adminLogin').classList.add('hidden');
        showDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    location.reload();
}

// Dashboard
async function showDashboard() {
    document.getElementById('adminDashboard').classList.remove('hidden');
    await loadStats();
    await loadUsers();
    await loadPhotos();
    await loadThemes();
    await loadChallenges();
    await loadAudit();
}

function switchSection(section) {
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}Section`).classList.add('active');
    
    // Charger le contenu si section content
    if (section === 'content') {
        loadThemes();
    }
    
    // Charger les groupes si section groups
    if (section === 'groups') {
        loadGroups();
    }
}

// Fonction pour charger l'éditeur de couleurs
async function loadColorEditor() {
    const container = document.getElementById('colorEditorContainer');
    if (!container) return;
    
    try {
        await ColorSettings.loadSettings();
        ColorSettings.renderColorEditor(container);
    } catch (error) {
        console.error('Erreur chargement éditeur:', error);
        container.innerHTML = '<p style="color: var(--danger-color); padding: 40px; text-align: center;">❌ Erreur de chargement</p>';
    }
}

// Stats
async function loadStats() {
    try {
        const response = await fetch(API_URL + '/api/admin/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const stats = await response.json();
        
        document.getElementById('totalUsers').textContent = stats.users;
        document.getElementById('totalChallenges').textContent = stats.challenges;
        document.getElementById('totalPhotos').textContent = stats.photos;
        document.getElementById('flaggedPhotos').textContent = stats.flagged_photos;
        
        // Load activity
        const activityResponse = await fetch(API_URL + '/api/admin/dashboard/activity', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const activity = await activityResponse.json();
        renderActivity(activity);
    } catch (error) {
        showToast('Erreur de chargement des statistiques', 'error');
    }
}

function renderActivity(activity) {
    const container = document.getElementById('recentActivity');
    container.innerHTML = '';
    
    if (activity.recentCompletions.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-light);">Aucune activité récente</p>';
        return;
    }
    
    activity.recentCompletions.forEach(completion => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 0.75rem; border-bottom: 1px solid var(--gray-medium);';
        item.innerHTML = `
            <strong style="color: var(--gold);">${completion.username}</strong> 
            a complété <strong>${completion.challenge_title}</strong>
            <span style="color: var(--gray-light); font-size: 0.85rem;">
                (+${completion.points} points)
            </span>
        `;
        container.appendChild(item);
    });
}

// Users
let allUsers = [];

async function loadUsers() {
    try {
        const response = await fetch(API_URL + '/api/admin/users', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        allUsers = await response.json();
        renderUsers(allUsers);
    } catch (error) {
        showToast('Erreur de chargement des utilisateurs', 'error');
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--gray-light);">Aucun utilisateur</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        const isAdmin = user.is_admin === 1;
        
        tr.innerHTML = `
            <td>
                <strong>${user.username}</strong>
                ${isAdmin ? '<span class="badge badge-warning" style="margin-left: 8px;">ADMIN</span>' : ''}
            </td>
            <td>${user.email}</td>
            <td>${user.total_points}</td>
            <td>${user.challenges_completed}</td>
            <td>${user.photos_uploaded}</td>
            <td>
                <span class="badge ${user.is_banned ? 'badge-danger' : 'badge-success'}">
                    ${user.is_banned ? 'Banni' : 'Actif'}
                </span>
            </td>
            <td>
                ${!isAdmin ? `
                    <button class="btn btn-sm ${user.is_banned ? 'btn-success' : 'btn-danger'}" 
                            onclick="toggleBan(${user.id}, ${user.is_banned})">
                        ${user.is_banned ? 'Débannir' : 'Bannir'}
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="resetProgress(${user.id})">
                        Réinitialiser
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                        Supprimer
                    </button>
                ` : '<span style="color: var(--gold);">Protégé</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterUsers(e) {
    const search = e.target.value.toLowerCase();
    const filtered = allUsers.filter(user => 
        user.username.toLowerCase().includes(search) || 
        user.email.toLowerCase().includes(search)
    );
    renderUsers(filtered);
}

async function toggleBan(userId, currentlyBanned) {
    if (!confirm(`Confirmer ${currentlyBanned ? 'le débannissement' : 'le bannissement'} ?`)) return;
    
    try {
        const response = await fetch(API_URL + `/api/admin/users/${userId}/ban`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ banned: !currentlyBanned })
        });
        
        if (!response.ok) throw new Error('Erreur');
        
        showToast(currentlyBanned ? 'Utilisateur débanni' : 'Utilisateur banni', 'success');
        await loadUsers();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function resetProgress(userId) {
    if (!confirm('Réinitialiser la progression de cet utilisateur ?')) return;
    
    try {
        const response = await fetch(API_URL + `/api/admin/users/${userId}/reset`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (!response.ok) throw new Error('Erreur');
        
        showToast('Progression réinitialisée', 'success');
        await loadUsers();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return;
    
    try {
        const response = await fetch(API_URL + `/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (!response.ok) throw new Error('Erreur');
        
        showToast('Utilisateur supprimé', 'success');
        await loadUsers();
        await loadStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Photos Moderation
async function loadPhotos() {
    try {
        const response = await fetch(API_URL + `/api/admin/photos?status=${currentFilter}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const photos = await response.json();
        renderPhotos(photos);
    } catch (error) {
        showToast('Erreur de chargement des photos', 'error');
    }
}

function renderPhotos(photos) {
    const grid = document.getElementById('photosGrid');
    grid.innerHTML = '';
    
    if (photos.length === 0) {
        grid.innerHTML = '<p style="color: var(--gray-light);">Aucune photo</p>';
        return;
    }
    
    photos.forEach(photo => {
        const card = document.createElement('div');
        card.className = `photo-admin-card ${photo.flag_count > 0 ? 'flagged' : ''}`;
        
        card.innerHTML = `
            <img src="/uploads/${photo.filename}" alt="${photo.caption || 'Photo'}">
            <div class="photo-admin-info">
                <div class="photo-admin-meta">
                    <strong>${photo.username}</strong> - ${photo.challenge_title}
                    ${photo.flag_count > 0 ? `<br><span style="color: var(--error);">🚩 ${photo.flag_count} signalement(s)</span>` : ''}
                    ${photo.flag_reason ? `<br><small>${photo.flag_reason}</small>` : ''}
                </div>
                ${photo.caption ? `<p style="font-size: 0.9rem;">${photo.caption}</p>` : ''}
                <div class="photo-admin-actions">
                    ${photo.status === 'hidden' ? 
                        `<button class="btn btn-sm btn-success" onclick="moderatePhoto(${photo.id}, 'visible')">Approuver</button>` :
                        `<button class="btn btn-sm btn-warning" onclick="moderatePhoto(${photo.id}, 'hidden')">Masquer</button>`
                    }
                    <button class="btn btn-sm btn-danger" onclick="deletePhoto(${photo.id})">Supprimer</button>
                    ${photo.flag_count > 0 ? 
                        `<button class="btn btn-sm btn-secondary" onclick="resetFlags(${photo.id})">Reset flags</button>` : ''
                    }
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

async function moderatePhoto(photoId, status) {
    try {
        const response = await fetch(API_URL + `/api/admin/photos/${photoId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Erreur');
        
        showToast(status === 'visible' ? 'Photo approuvée' : 'Photo masquée', 'success');
        await loadPhotos();
        await loadStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deletePhoto(photoId) {
    if (!confirm('Supprimer définitivement cette photo ?')) return;
    
    try {
        const response = await fetch(API_URL + `/api/admin/photos/${photoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (!response.ok) throw new Error('Erreur');
        
        showToast('Photo supprimée', 'success');
        await loadPhotos();
        await loadStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function resetFlags(photoId) {
    try {
        const response = await fetch(API_URL + `/api/admin/photos/${photoId}/reset-flags`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (!response.ok) throw new Error('Erreur');
        
        showToast('Signalements réinitialisés', 'success');
        await loadPhotos();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Themes & Challenges
async function loadThemes() {
    try {
        const response = await fetch(API_URL + '/api/challenges/themes');
        const themes = await response.json();
        
        const container = document.getElementById('themesList');
        container.innerHTML = '';
        
        themes.forEach(theme => {
            const card = document.createElement('div');
            card.className = 'theme-card';
            card.style.borderColor = theme.color;
            
            card.innerHTML = `
                <div class="theme-icon">${theme.icon}</div>
                <h4 style="color: ${theme.color}; margin-bottom: 0.5rem;">${theme.name}</h4>
                <p style="color: var(--gray-light); font-size: 0.85rem;">${theme.challenge_count} défis</p>
            `;
            
            container.appendChild(card);
        });
    } catch (error) {
        showToast('Erreur de chargement des thématiques', 'error');
    }
}

async function loadChallenges() {
    try {
        // Récupérer les thématiques
        const themesResponse = await fetch(API_URL + '/api/challenges/themes');
        const themes = await themesResponse.json();
        
        // Récupérer tous les défis (avec un token temporaire si nécessaire)
        const challengesResponse = await fetch(API_URL + '/api/challenges', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const allChallenges = await challengesResponse.json();
        
        const container = document.getElementById('challengesList');
        container.innerHTML = '';
        
        // Grouper les défis par thématique
        themes.forEach(theme => {
            const themeChallenges = allChallenges.filter(c => c.theme_id === theme.id);
            
            if (themeChallenges.length === 0) return;
            
            const section = document.createElement('div');
            section.style.cssText = 'margin-bottom: 2rem; background: var(--gray-dark); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--gray-medium);';
            
            let challengesHTML = '';
            themeChallenges.forEach(challenge => {
                const stars = '★'.repeat(challenge.difficulty) + '☆'.repeat(5 - challenge.difficulty);
                challengesHTML += `
                    <div style="background: var(--gray-medium); padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border-left: 3px solid ${theme.color};">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <strong style="color: var(--gold); font-size: 1.1rem;">${challenge.title}</strong>
                            <span style="color: ${theme.color};">${stars}</span>
                        </div>
                        <p style="color: var(--gray-light); font-size: 0.9rem; margin-bottom: 0.5rem;">${challenge.description}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--gold); font-weight: 600;">${challenge.points} points</span>
                            <span style="color: var(--gray-light); font-size: 0.85rem;">📸 ${challenge.photo_count || 0} photos</span>
                        </div>
                    </div>
                `;
            });
            
            section.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid ${theme.color};">
                    <span style="font-size: 2rem;">${theme.icon}</span>
                    <div>
                        <h4 style="color: ${theme.color}; margin-bottom: 0.25rem;">${theme.name}</h4>
                        <p style="color: var(--gray-light); font-size: 0.9rem;">${theme.description || ''} - ${themeChallenges.length} défis</p>
                    </div>
                </div>
                ${challengesHTML}
            `;
            
            container.appendChild(section);
        });
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur de chargement des défis', 'error');
    }
}

// Audit
async function loadAudit() {
    try {
        const response = await fetch(API_URL + '/api/admin/dashboard/audit', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const logs = await response.json();
        const tbody = document.getElementById('auditTable');
        tbody.innerHTML = '';
        
        logs.forEach(log => {
            const tr = document.createElement('tr');
            const date = new Date(log.created_at).toLocaleString('fr-FR');
            
            tr.innerHTML = `
                <td>${date}</td>
                <td>${log.admin_username}</td>
                <td><span class="badge badge-warning">${log.action}</span></td>
                <td>${log.target_type}</td>
                <td><small>${log.details || '-'}</small></td>
            `;
            
            tbody.appendChild(tr);
        });
    } catch (error) {
        showToast('Erreur de chargement de l\'audit', 'error');
    }
}

// Groups Management
function showCreateGroupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Créer un nouveau groupe</h2>
            <form id="createGroupForm">
                <div class="form-group">
                    <label>Nom du groupe *</label>
                    <input type="text" class="form-input" name="name" required placeholder="Ex: Motivation quotidienne">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea class="form-input" name="description" rows="3" placeholder="Description du groupe..."></textarea>
                </div>
                <div class="form-group">
                    <label>Icône</label>
                    <input type="text" class="form-input" name="icon" value="💬" placeholder="💬">
                    <small style="color: var(--gray-light);">Utilisez un emoji pour l'icône du groupe</small>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="is_public" checked>
                        Groupe public (accessible à tous)
                    </label>
                </div>
                <div class="form-group">
                    <label>Nombre maximum de membres (0 = illimité)</label>
                    <input type="number" class="form-input" name="max_members" value="0" min="0">
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button type="submit" class="btn btn-primary">✨ Créer le groupe</button>
                    <button type="button" class="btn" onclick="this.closest('.modal').remove()">Annuler</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    document.getElementById('createGroupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(API_URL + '/api/admin/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    description: formData.get('description'),
                    icon: formData.get('icon'),
                    color: '#D4AF37',
                    is_public: formData.get('is_public') === 'on',
                    max_members: parseInt(formData.get('max_members'))
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);
            
            showToast('Groupe créé avec succès', 'success');
            modal.remove();
            loadGroups();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

async function loadGroups() {
    try {
        const response = await fetch(API_URL + '/api/admin/groups', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const groups = await response.json();
        renderGroups(groups);
        
        // Load stats
        const statsResponse = await fetch(API_URL + '/api/admin/groups/stats/overview', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const stats = await statsResponse.json();
        renderGroupStats(stats);
    } catch (error) {
        showToast('Erreur de chargement des groupes', 'error');
    }
}

function renderGroupStats(stats) {
    const container = document.getElementById('groupsStats');
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">💬</div>
            <div class="stat-info">
                <div class="stat-value">${stats.total_groups}</div>
                <div class="stat-label">Groupes totaux</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
                <div class="stat-value">${stats.total_members}</div>
                <div class="stat-label">Membres</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📨</div>
            <div class="stat-info">
                <div class="stat-value">${stats.total_messages}</div>
                <div class="stat-label">Messages</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🌍</div>
            <div class="stat-info">
                <div class="stat-value">${stats.public_groups}</div>
                <div class="stat-label">Publics</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🔒</div>
            <div class="stat-info">
                <div class="stat-value">${stats.private_groups}</div>
                <div class="stat-label">Privés</div>
            </div>
        </div>
    `;
}

function renderGroups(groups) {
    const container = document.getElementById('groupsList');
    
    if (groups.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-light); padding: 2rem; text-align: center;">Aucun groupe créé</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Groupe</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Membres</th>
                        <th>Messages</th>
                        <th>Créateur</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${groups.map(group => `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="font-size: 1.5rem;">${group.icon}</span>
                                    <strong style="color: ${group.color};">${group.name}</strong>
                                </div>
                            </td>
                            <td><small>${group.description || '-'}</small></td>
                            <td>
                                <span class="badge ${group.is_public ? 'badge-success' : 'badge-warning'}">
                                    ${group.is_public ? '🌍 Public' : '🔒 Privé'}
                                </span>
                            </td>
                            <td>${group.members_count}${group.max_members > 0 ? `/${group.max_members}` : ''}</td>
                            <td>${group.messages_count}</td>
                            <td>${group.creator_name}</td>
                            <td>
                                <button class="btn btn-sm" onclick="viewGroupDetails(${group.id})">👁️ Voir</button>
                                <button class="btn btn-sm" onclick="editGroup(${group.id})">✏️ Éditer</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteGroup(${group.id}, '${group.name.replace(/'/g, "\\'")}')">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function viewGroupDetails(groupId) {
    try {
        const response = await fetch(API_URL + `/api/admin/groups/${groupId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const group = await response.json();
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0;">
                        <span style="font-size: 2rem; margin-right: 0.5rem;">${group.icon}</span>
                        ${group.name}
                    </h2>
                    <button class="btn btn-sm" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <p><strong>Description:</strong> ${group.description || 'Aucune description'}</p>
                    <p><strong>Type:</strong> ${group.is_public ? '🌍 Public' : '🔒 Privé'}</p>
                    <p><strong>Créateur:</strong> ${group.creator_name}</p>
                    <p><strong>Créé le:</strong> ${new Date(group.created_at).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Membres:</strong> ${group.members_count}${group.max_members > 0 ? `/${group.max_members}` : ''}</p>
                    <p><strong>Messages:</strong> ${group.messages_count}</p>
                </div>
                
                <h3>Membres (${group.members.length})</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Rôle</th>
                                <th>Rejoint le</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group.members.map(member => `
                                <tr>
                                    <td>${member.username}</td>
                                    <td><span class="badge ${member.role === 'admin' ? 'badge-danger' : member.role === 'moderator' ? 'badge-warning' : 'badge-info'}">${member.role}</span></td>
                                    <td>${new Date(member.joined_at).toLocaleDateString('fr-FR')}</td>
                                    <td>
                                        <button class="btn btn-sm btn-danger" onclick="removeGroupMember(${groupId}, ${member.id}, '${member.username.replace(/'/g, "\\'")}')">Retirer</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    } catch (error) {
        showToast('Erreur de chargement des détails', 'error');
    }
}

async function editGroup(groupId) {
    try {
        const response = await fetch(API_URL + `/api/admin/groups/${groupId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const group = await response.json();
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Modifier le groupe</h2>
                <form id="editGroupForm">
                    <div class="form-group">
                        <label>Nom du groupe</label>
                        <input type="text" class="form-input" name="name" value="${group.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea class="form-input" name="description" rows="3">${group.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Icône</label>
                        <input type="text" class="form-input" name="icon" value="${group.icon}" placeholder="💬">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="is_public" ${group.is_public ? 'checked' : ''}>
                            Groupe public
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Nombre maximum de membres (0 = illimité)</label>
                        <input type="number" class="form-input" name="max_members" value="${group.max_members}" min="0">
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="btn btn-primary">💾 Sauvegarder</button>
                        <button type="button" class="btn" onclick="this.closest('.modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        document.getElementById('editGroupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch(API_URL + `/api/admin/groups/${groupId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({
                        name: formData.get('name'),
                        description: formData.get('description'),
                        icon: formData.get('icon'),
                        is_public: formData.get('is_public') === 'on',
                        max_members: parseInt(formData.get('max_members'))
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error);
                
                showToast('Groupe modifié avec succès', 'success');
                modal.remove();
                loadGroups();
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    } catch (error) {
        showToast('Erreur de chargement du groupe', 'error');
    }
}

async function deleteGroup(groupId, groupName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${groupName}" ?\nToutes les données associées seront supprimées.`)) {
        return;
    }
    
    try {
        const response = await fetch(API_URL + `/api/admin/groups/${groupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        showToast('Groupe supprimé', 'success');
        loadGroups();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function removeGroupMember(groupId, memberId, username) {
    if (!confirm(`Retirer ${username} du groupe ?`)) return;
    
    try {
        const response = await fetch(API_URL + `/api/admin/groups/${groupId}/members/${memberId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        showToast('Membre retiré', 'success');
        
        // Fermer et rouvrir le modal pour rafraîchir
        document.querySelector('.modal')?.remove();
        viewGroupDetails(groupId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Toast
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
        <span style="font-size: 1.5rem;">${icons[type]}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== GESTION DES THÉMATIQUES ET DÉFIS ==========

// Charger les thématiques
async function loadThemes() {
    try {
        const response = await fetch(API_URL + '/api/challenges/themes');
        const themes = await response.json();
        renderThemes(themes);
    } catch (error) {
        showToast('Erreur de chargement des thématiques', 'error');
    }
}

// Afficher les thématiques
function renderThemes(themes) {
    const container = document.getElementById('themesList');
    if (!container) return;
    
    if (themes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-light); padding: 2rem;">Aucune thématique</p>';
        return;
    }
    
    container.innerHTML = themes.map(theme => `
        <div class="challenge-card" style="border-color: ${theme.color};">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="color: ${theme.color}; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.5rem; margin-right: 0.5rem;">${theme.icon}</span>
                        ${theme.name}
                    </h3>
                    <p style="color: var(--gray-light); margin-bottom: 1rem;">${theme.description || 'Aucune description'}</p>
                    <small style="color: var(--gray-light);">Couleur: ${theme.color}</small>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="editTheme(${theme.id})" title="Modifier">✏️</button>
                    <button class="btn btn-secondary" onclick="deleteTheme(${theme.id}, '${theme.name}')" title="Supprimer" style="background: var(--error);">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Modal création thématique
function showCreateThemeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Créer une thématique</h2>
            <form id="createThemeForm">
                <div class="form-group">
                    <label>Nom *</label>
                    <input type="text" class="form-input" name="name" required placeholder="Ex: Aventure">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea class="form-input" name="description" rows="3" placeholder="Description de la thématique..."></textarea>
                </div>
                <div class="form-group">
                    <label>Icône (emoji) *</label>
                    <input type="text" class="form-input" name="icon" required placeholder="🎯" maxlength="2">
                </div>
                <div class="form-group">
                    <label>Couleur *</label>
                    <input type="color" class="form-input" name="color" value="#D4AF37">
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button type="submit" class="btn btn-primary">✨ Créer</button>
                    <button type="button" class="btn" onclick="this.closest('.modal').remove()">Annuler</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    document.getElementById('createThemeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(API_URL + '/api/admin/content/themes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    description: formData.get('description'),
                    icon: formData.get('icon'),
                    color: formData.get('color')
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);
            
            showToast('Thématique créée avec succès', 'success');
            modal.remove();
            loadThemes();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

// Modifier une thématique
async function editTheme(themeId) {
    try {
        const response = await fetch(API_URL + `/api/challenges/themes`);
        const themes = await response.json();
        const theme = themes.find(t => t.id === themeId);
        
        if (!theme) throw new Error('Thématique non trouvée');
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Modifier la thématique</h2>
                <form id="editThemeForm">
                    <div class="form-group">
                        <label>Nom *</label>
                        <input type="text" class="form-input" name="name" value="${theme.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea class="form-input" name="description" rows="3">${theme.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Icône (emoji) *</label>
                        <input type="text" class="form-input" name="icon" value="${theme.icon}" required maxlength="2">
                    </div>
                    <div class="form-group">
                        <label>Couleur *</label>
                        <input type="color" class="form-input" name="color" value="${theme.color}">
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="btn btn-primary">💾 Sauvegarder</button>
                        <button type="button" class="btn" onclick="this.closest('.modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        document.getElementById('editThemeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch(API_URL + `/api/admin/content/themes/${themeId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({
                        name: formData.get('name'),
                        description: formData.get('description'),
                        icon: formData.get('icon'),
                        color: formData.get('color')
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error);
                
                showToast('Thématique modifiée avec succès', 'success');
                modal.remove();
                loadThemes();
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    } catch (error) {
        showToast('Erreur de chargement de la thématique', 'error');
    }
}

// Supprimer une thématique
async function deleteTheme(themeId, themeName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la thématique "${themeName}" ?\nCette action est irréversible.`)) {
        return;
    }
    
    try {
        const response = await fetch(API_URL + `/api/admin/content/themes/${themeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        showToast('Thématique supprimée', 'success');
        loadThemes();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Charger les défis
async function loadChallengesAdmin() {
    try {
        const [challengesRes, themesRes] = await Promise.all([
            fetch(API_URL + '/api/challenges'),
            fetch(API_URL + '/api/challenges/themes')
        ]);
        
        const challenges = await challengesRes.json();
        const themes = await themesRes.json();
        
        renderChallenges(challenges, themes);
    } catch (error) {
        showToast('Erreur de chargement des défis', 'error');
    }
}

// Afficher les défis
function renderChallenges(challenges, themes) {
    const container = document.getElementById('challengesList');
    if (!container) return;
    
    if (challenges.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-light); padding: 2rem;">Aucun défi</p>';
        return;
    }
    
    // Grouper par thématique
    const byTheme = {};
    challenges.forEach(challenge => {
        if (!byTheme[challenge.theme_id]) {
            byTheme[challenge.theme_id] = [];
        }
        byTheme[challenge.theme_id].push(challenge);
    });
    
    container.innerHTML = Object.entries(byTheme).map(([themeId, themeChallenges]) => {
        const theme = themes.find(t => t.id == themeId);
        if (!theme) return '';
        
        return `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: ${theme.color}; margin-bottom: 1rem;">
                    <span style="font-size: 1.5rem; margin-right: 0.5rem;">${theme.icon}</span>
                    ${theme.name}
                </h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Titre</th>
                                <th>Description</th>
                                <th>Difficulté</th>
                                <th>Points</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${themeChallenges.map(challenge => `
                                <tr>
                                    <td>${challenge.title}</td>
                                    <td><small>${challenge.description}</small></td>
                                    <td>
                                        <span class="badge" style="background: ${getDifficultyColor(challenge.difficulty)};">
                                            ${'⭐'.repeat(challenge.difficulty)}
                                        </span>
                                    </td>
                                    <td>${challenge.points} pts</td>
                                    <td>
                                        <button class="btn btn-secondary" onclick="editChallenge(${challenge.id})" title="Modifier">✏️</button>
                                        <button class="btn btn-secondary" onclick="deleteChallenge(${challenge.id}, '${challenge.title}')" title="Supprimer" style="background: var(--error);">🗑️</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }).join('');
}

function getDifficultyColor(difficulty) {
    const colors = {
        1: '#10B981',
        2: '#3B82F6',
        3: '#F59E0B',
        4: '#EF4444',
        5: '#8B5CF6'
    };
    return colors[difficulty] || '#666';
}

// Modal création défi
async function showCreateChallengeModal() {
    try {
        const response = await fetch(API_URL + '/api/challenges/themes');
        const themes = await response.json();
        
        if (themes.length === 0) {
            showToast('Créez d\'abord une thématique', 'warning');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Créer un défi</h2>
                <form id="createChallengeForm">
                    <div class="form-group">
                        <label>Thématique *</label>
                        <select class="form-input" name="theme_id" required>
                            ${themes.map(theme => `
                                <option value="${theme.id}">${theme.icon} ${theme.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Titre *</label>
                        <input type="text" class="form-input" name="title" required placeholder="Ex: Parler à un inconnu">
                    </div>
                    <div class="form-group">
                        <label>Description *</label>
                        <textarea class="form-input" name="description" rows="3" required placeholder="Description du défi..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Difficulté (1-5) *</label>
                        <input type="number" class="form-input" name="difficulty" min="1" max="5" value="1" required>
                    </div>
                    <div class="form-group">
                        <label>Points *</label>
                        <input type="number" class="form-input" name="points" min="1" value="10" required>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="btn btn-primary">✨ Créer</button>
                        <button type="button" class="btn" onclick="this.closest('.modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        document.getElementById('createChallengeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch(API_URL + '/api/admin/content/challenges', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({
                        theme_id: parseInt(formData.get('theme_id')),
                        title: formData.get('title'),
                        description: formData.get('description'),
                        difficulty: parseInt(formData.get('difficulty')),
                        points: parseInt(formData.get('points'))
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error);
                
                showToast('Défi créé avec succès', 'success');
                modal.remove();
                loadChallengesAdmin();
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    } catch (error) {
        showToast('Erreur de chargement des thématiques', 'error');
    }
}

// Modifier un défi
async function editChallenge(challengeId) {
    try {
        const [challengesRes, themesRes] = await Promise.all([
            fetch(API_URL + '/api/challenges'),
            fetch(API_URL + '/api/challenges/themes')
        ]);
        
        const challenges = await challengesRes.json();
        const themes = await themesRes.json();
        const challenge = challenges.find(c => c.id === challengeId);
        
        if (!challenge) throw new Error('Défi non trouvé');
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Modifier le défi</h2>
                <form id="editChallengeForm">
                    <div class="form-group">
                        <label>Thématique *</label>
                        <select class="form-input" name="theme_id" required disabled>
                            ${themes.map(theme => `
                                <option value="${theme.id}" ${theme.id == challenge.theme_id ? 'selected' : ''}>
                                    ${theme.icon} ${theme.name}
                                </option>
                            `).join('')}
                        </select>
                        <small style="color: var(--gray-light);">La thématique ne peut pas être modifiée</small>
                    </div>
                    <div class="form-group">
                        <label>Titre *</label>
                        <input type="text" class="form-input" name="title" value="${challenge.title}" required>
                    </div>
                    <div class="form-group">
                        <label>Description *</label>
                        <textarea class="form-input" name="description" rows="3" required>${challenge.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Difficulté (1-5) *</label>
                        <input type="number" class="form-input" name="difficulty" min="1" max="5" value="${challenge.difficulty}" required>
                    </div>
                    <div class="form-group">
                        <label>Points *</label>
                        <input type="number" class="form-input" name="points" min="1" value="${challenge.points}" required>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="btn btn-primary">💾 Sauvegarder</button>
                        <button type="button" class="btn" onclick="this.closest('.modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        document.getElementById('editChallengeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch(API_URL + `/api/admin/content/challenges/${challengeId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({
                        title: formData.get('title'),
                        description: formData.get('description'),
                        difficulty: parseInt(formData.get('difficulty')),
                        points: parseInt(formData.get('points'))
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error);
                
                showToast('Défi modifié avec succès', 'success');
                modal.remove();
                loadChallengesAdmin();
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    } catch (error) {
        showToast('Erreur de chargement du défi', 'error');
    }
}

// Supprimer un défi
async function deleteChallenge(challengeId, challengeTitle) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le défi "${challengeTitle}" ?\nCette action est irréversible.`)) {
        return;
    }
    
    try {
        const response = await fetch(API_URL + `/api/admin/content/challenges/${challengeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        showToast('Défi supprimé', 'success');
        loadChallengesAdmin();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Rendre les fonctions accessibles globalement pour les onclick
window.viewGroupDetails = viewGroupDetails;
window.editGroup = editGroup;
window.deleteGroup = deleteGroup;
window.removeGroupMember = removeGroupMember;
window.editTheme = editTheme;
window.deleteTheme = deleteTheme;
window.editChallenge = editChallenge;
window.deleteChallenge = deleteChallenge;
