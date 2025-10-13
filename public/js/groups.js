// Gestion des groupes de discussion

let currentGroupId = null;

// Charger les groupes quand l'onglet est activé
function initGroups() {
    loadAllGroups();
    loadMyGroups();
}

// Charger tous les groupes publics
async function loadAllGroups() {
    try {
        const token = localStorage.getItem('userToken');
        if (!token) return;

        const response = await fetch(API_URL + '/api/groups', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erreur de chargement');

        const groups = await response.json();
        renderGroupsSection(groups);
    } catch (error) {
        console.error('Erreur chargement groupes:', error);
    }
}

// Charger mes groupes
async function loadMyGroups() {
    try {
        const token = localStorage.getItem('userToken');
        if (!token) return;

        const response = await fetch(API_URL + '/api/groups/my-groups', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erreur de chargement');

        const myGroups = await response.json();
        return myGroups;
    } catch (error) {
        console.error('Erreur chargement mes groupes:', error);
        return [];
    }
}

// Afficher les groupes
async function renderGroupsSection(allGroups) {
    const container = document.getElementById('groupsContainer');
    if (!container) return;

    const myGroups = await loadMyGroups();
    const myGroupIds = new Set(myGroups.map(g => g.id));

    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--gold); margin-bottom: 1rem;">Mes groupes (${myGroups.length})</h3>
            <div class="challenges-grid" id="myGroupsGrid">
                ${myGroups.length === 0 ? '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Vous n\'avez rejoint aucun groupe</p>' : 
                    myGroups.map(group => renderGroupCard(group, true)).join('')}
            </div>
        </div>

        <div>
            <h3 style="color: var(--gold); margin-bottom: 1rem;">Tous les groupes publics (${allGroups.filter(g => !myGroupIds.has(g.id)).length})</h3>
            <div class="challenges-grid" id="allGroupsGrid">
                ${allGroups.filter(g => !myGroupIds.has(g.id)).length === 0 ? 
                    '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Aucun autre groupe disponible</p>' : 
                    allGroups.filter(g => !myGroupIds.has(g.id)).map(group => renderGroupCard(group, false)).join('')}
            </div>
        </div>
    `;
}

// Créer une carte de groupe
function renderGroupCard(group, isMember) {
    return `
        <div class="challenge-card" style="cursor: pointer; border-color: ${group.color}20;" onclick="openGroupModal(${group.id})">
            <div class="challenge-difficulty" style="background: ${group.color};">
                <span style="font-size: 2rem;">${group.icon}</span>
            </div>
            <div class="challenge-content">
                <h3 class="challenge-title" style="color: ${group.color};">${group.name}</h3>
                <p class="challenge-description">${group.description || 'Aucune description'}</p>
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                    <span class="badge" style="background: ${group.is_public ? '#10B981' : '#F59E0B'}; color: #000; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem;">
                        ${group.is_public ? '🌍 Public' : '🔒 Privé'}
                    </span>
                    ${isMember ? '<span class="badge" style="background: #3B82F6; color: #fff; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem;">✓ Membre</span>' : ''}
                    <span style="color: var(--text-secondary); font-size: 0.9rem;">👥 ${group.members_count} membre(s)</span>
                </div>
            </div>
            <button class="btn ${isMember ? 'btn-primary' : 'btn-secondary'}" style="margin-top: 1rem;" onclick="event.stopPropagation(); ${isMember ? `openGroupModal(${group.id})` : `joinGroup(${group.id})`}">
                ${isMember ? '💬 Ouvrir' : '➕ Rejoindre'}
            </button>
        </div>
    `;
}

// Rejoindre un groupe
async function joinGroup(groupId) {
    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(API_URL + `/api/groups/${groupId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        showToastNotification('✅ Vous avez rejoint le groupe !');
        loadAllGroups();
    } catch (error) {
        showToastNotification(error.message, 'error');
    }
}

// Ouvrir modal du groupe
async function openGroupModal(groupId) {
    currentGroupId = groupId;

    try {
        const token = localStorage.getItem('userToken');

        const [groupRes, membersRes, messagesRes] = await Promise.all([
            fetch(API_URL + `/api/groups/${groupId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(API_URL + `/api/groups/${groupId}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(API_URL + `/api/groups/${groupId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const group = await groupRes.json();
        const members = await membersRes.json();
        const messages = await messagesRes.json();

        showGroupModal(group, members, messages);
    } catch (error) {
        showToastNotification('Erreur de chargement du groupe', 'error');
    }
}

// Afficher modal du groupe
function showGroupModal(group, members, messages) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.id = 'groupModal';

    const canPost = group.my_role !== null;

    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2 style="color: ${group.color};">
                    <span style="font-size: 2rem; margin-right: 0.5rem;">${group.icon}</span>
                    ${group.name}
                </h2>
                <button class="modal-close" onclick="closeGroupModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${group.description || 'Aucune description'}</p>
                
                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <span class="badge" style="background: ${group.is_public ? '#10B981' : '#F59E0B'}; color: #000;">
                        ${group.is_public ? '🌍 Public' : '🔒 Privé'}
                    </span>
                    ${group.my_role ? `<span class="badge" style="background: #EF4444; color: #fff;">${group.my_role}</span>` : ''}
                    <span style="color: var(--text-secondary);">👥 ${group.members_count} membre(s)</span>
                </div>

                ${canPost ? `
                    <div style="background: var(--card-background); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                        <h3 style="color: var(--gold); margin-bottom: 1rem;">💬 Messages</h3>
                        <div id="messagesContainer" style="max-height: 300px; overflow-y: auto; margin-bottom: 1rem;">
                            ${messages.length === 0 ? '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Aucun message pour le moment</p>' : 
                                messages.map(msg => `
                                    <div style="background: var(--gray-dark); padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                            <strong style="color: var(--gold);">${msg.username}</strong>
                                            <span style="color: var(--text-secondary); font-size: 0.8rem;">${new Date(msg.created_at).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                        <p style="color: var(--white);">${msg.content}</p>
                                        <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                                            ${['👍', '❤️', '😊', '🎉'].map(emoji => `
                                                <button onclick="reactToMessage(${msg.id}, '${emoji}')" style="background: var(--gray-medium); border: none; padding: 0.25rem 0.5rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.9rem;">${emoji}</button>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" id="messageInput" placeholder="Écrire un message..." class="form-input" style="flex: 1;" onkeypress="if(event.key==='Enter') sendGroupMessage()">
                            <button class="btn btn-primary" onclick="sendGroupMessage()">Envoyer</button>
                        </div>
                    </div>
                ` : '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Rejoignez ce groupe pour participer aux discussions</p>'}

                <h3 style="color: var(--gold); margin-bottom: 1rem;">👥 Membres (${members.length})</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
                    ${members.map(member => `
                        <div style="background: var(--card-background); padding: 0.75rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span>${member.username}</span>
                            <span class="badge" style="background: ${member.role === 'admin' ? '#EF4444' : member.role === 'moderator' ? '#F59E0B' : '#3B82F6'}; color: #fff; font-size: 0.75rem;">
                                ${member.role}
                            </span>
                        </div>
                    `).join('')}
                </div>

                ${group.my_role ? `
                    <button class="btn btn-secondary" onclick="leaveGroup(${group.id})" style="background: #EF4444;">
                        ❌ Quitter le groupe
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Fermer modal
function closeGroupModal() {
    const modal = document.getElementById('groupModal');
    if (modal) {
        modal.remove();
    }
    currentGroupId = null;
}

// Envoyer un message
async function sendGroupMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content || !currentGroupId) return;

    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(API_URL + `/api/groups/${currentGroupId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        input.value = '';
        showToastNotification('✅ Message envoyé !');
        
        // Recharger le modal
        closeGroupModal();
        setTimeout(() => openGroupModal(currentGroupId), 300);
    } catch (error) {
        showToastNotification(error.message, 'error');
    }
}

// Réagir à un message
async function reactToMessage(messageId, emoji) {
    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(API_URL + `/api/groups/messages/${messageId}/react`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ emoji })
        });

        if (!response.ok) throw new Error('Erreur réaction');

        showToastNotification(emoji);
    } catch (error) {
        console.error('Erreur réaction:', error);
    }
}

// Quitter un groupe
async function leaveGroup(groupId) {
    if (!confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) return;

    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(API_URL + `/api/groups/${groupId}/leave`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        showToastNotification('✅ Vous avez quitté le groupe');
        closeGroupModal();
        loadAllGroups();
    } catch (error) {
        showToastNotification(error.message, 'error');
    }
}

// Rendre les fonctions accessibles globalement
window.initGroups = initGroups;
window.joinGroup = joinGroup;
window.openGroupModal = openGroupModal;
window.closeGroupModal = closeGroupModal;
window.sendGroupMessage = sendGroupMessage;
window.reactToMessage = reactToMessage;
window.leaveGroup = leaveGroup;
