// Module d'édition de profil

const ProfileEditor = {
    // Afficher le formulaire d'édition de profil
    showEditProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'editProfileModal';
        modal.style.display = 'flex';
        
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>✏️ Modifier mon profil</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Photo de profil -->
                    <div class="profile-avatar-section" style="text-align: center; margin-bottom: 30px;">
                        <div class="avatar-preview" style="width: 150px; height: 150px; border-radius: 50%; margin: 0 auto 15px; overflow: hidden; border: 3px solid var(--primary-color);">
                            <img id="avatarPreviewImg" src="${currentUser.avatar_url || '/images/default-avatar.png'}" 
                                 style="width: 100%; height: 100%; object-fit: cover;" alt="Avatar">
                        </div>
                        <input type="file" id="avatarInput" accept="image/*" style="display: none;">
                        <button class="btn btn-secondary" onclick="document.getElementById('avatarInput').click()">
                            📷 Changer la photo
                        </button>
                        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                            JPG, PNG ou GIF • Max 5MB
                        </p>
                    </div>

                    <!-- Formulaire -->
                    <form id="editProfileForm">
                        <div class="form-group">
                            <label for="editUsername">Nom d'utilisateur</label>
                            <input type="text" id="editUsername" class="form-input" 
                                   value="${currentUser.username || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editBio">Bio</label>
                            <textarea id="editBio" class="form-input" rows="3" 
                                      placeholder="Parlez-nous de vous..." 
                                      maxlength="200">${currentUser.bio || ''}</textarea>
                            <small style="color: var(--text-secondary);">Max 200 caractères</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="editLocation">Localisation</label>
                            <input type="text" id="editLocation" class="form-input" 
                                   placeholder="Ville, Pays" 
                                   value="${currentUser.location || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="editWebsite">Site web</label>
                            <input type="url" id="editWebsite" class="form-input" 
                                   placeholder="https://..." 
                                   value="${currentUser.website || ''}">
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block">
                            💾 Enregistrer
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        this.setupProfileEditorEvents(modal);
    },

    setupProfileEditorEvents(modal) {
        // Preview de l'avatar
        const avatarInput = modal.querySelector('#avatarInput');
        const avatarPreview = modal.querySelector('#avatarPreviewImg');
        
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Vérifier la taille
            if (file.size > 5242880) {
                alert('❌ Fichier trop volumineux (max 5MB)');
                return;
            }
            
            // Preview local
            const reader = new FileReader();
            reader.onload = (event) => {
                avatarPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
            
            // Upload immédiat
            await this.uploadAvatar(file);
        });
        
        // Soumission du formulaire
        const form = modal.querySelector('#editProfileForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateProfile(modal);
        });
    },

    async uploadAvatar(file) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/me/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error);
            }
            
            // Mettre à jour le user dans localStorage
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            currentUser.avatar_url = result.avatar_url;
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Mettre à jour l'avatar dans la page
            document.querySelectorAll('.profile-avatar, .user-avatar').forEach(avatar => {
                if (avatar.tagName === 'IMG') {
                    avatar.src = result.avatar_url;
                } else {
                    avatar.style.backgroundImage = `url(${result.avatar_url})`;
                }
            });
            
            this.showToast('✅ Photo de profil mise à jour !', 'success');
        } catch (error) {
            console.error('Erreur upload avatar:', error);
            this.showToast('❌ Erreur: ' + error.message, 'error');
        }
    },

    async updateProfile(modal) {
        try {
            const username = modal.querySelector('#editUsername').value.trim();
            const bio = modal.querySelector('#editBio').value.trim();
            const location = modal.querySelector('#editLocation').value.trim();
            const website = modal.querySelector('#editWebsite').value.trim();
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, bio, location, website })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error);
            }
            
            // Mettre à jour le user dans localStorage
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            currentUser.username = username;
            currentUser.bio = bio;
            currentUser.location = location;
            currentUser.website = website;
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            this.showToast('✅ Profil mis à jour !', 'success');
            
            // Fermer le modal
            modal.remove();
            
            // Recharger la page profil si on est dessus
            if (window.loadProfile) {
                window.loadProfile();
            }
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            this.showToast('❌ Erreur: ' + error.message, 'error');
        }
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

window.ProfileEditor = ProfileEditor;
console.log('✅ Module d\'édition de profil chargé');
