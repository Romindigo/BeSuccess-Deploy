// Module de gestion des commentaires et likes
const CommentsModule = {
    // Afficher les commentaires d'une photo/vidéo
    async loadComments(photoId, container) {
        try {
            const response = await fetch(`/api/comments/photo/${photoId}`);
            const comments = await response.json();
            
            if (!response.ok) throw new Error(comments.error);
            
            container.innerHTML = this.renderComments(comments, photoId);
            this.attachCommentEventListeners(photoId);
        } catch (error) {
            console.error('Erreur chargement commentaires:', error);
            container.innerHTML = '<p class="error">Erreur de chargement des commentaires</p>';
        }
    },

    // Rendre les commentaires en HTML
    renderComments(comments, photoId) {
        if (comments.length === 0) {
            return `<p class="no-comments">Aucun commentaire pour le moment. Soyez le premier !</p>`;
        }

        // Organiser les commentaires par thread (parent/enfant)
        const commentsByParent = {};
        comments.forEach(comment => {
            const parentId = comment.parent_id || 'root';
            if (!commentsByParent[parentId]) {
                commentsByParent[parentId] = [];
            }
            commentsByParent[parentId].push(comment);
        });

        const renderThread = (parentId = 'root', depth = 0) => {
            const threadComments = commentsByParent[parentId] || [];
            return threadComments.map(comment => `
                <div class="comment ${depth > 0 ? 'comment-reply' : ''}" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <img src="${comment.avatar_url || '/images/default-avatar.png'}" 
                             alt="${comment.username}" 
                             class="comment-avatar">
                        <div class="comment-info">
                            <strong class="comment-username">${comment.username}</strong>
                            <span class="comment-date">${this.formatDate(comment.created_at)}</span>
                            ${comment.updated_at ? '<span class="comment-edited">(modifié)</span>' : ''}
                        </div>
                        ${this.isOwnComment(comment.user_id) ? `
                            <div class="comment-actions">
                                <button class="btn-icon edit-comment" data-comment-id="${comment.id}">
                                    ✏️
                                </button>
                                <button class="btn-icon delete-comment" data-comment-id="${comment.id}">
                                    🗑️
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                    <div class="comment-footer">
                        <button class="btn-reply" data-comment-id="${comment.id}" data-username="${comment.username}">
                            Répondre
                        </button>
                    </div>
                    <div class="comment-replies">
                        ${renderThread(comment.id, depth + 1)}
                    </div>
                </div>
            `).join('');
        };

        return `
            <div class="comments-list">
                ${renderThread()}
            </div>
        `;
    },

    // Ajouter un commentaire
    async addComment(photoId, content, parentId = null) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/comments/photo/${photoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content, parent_id: parentId })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            return result;
        } catch (error) {
            console.error('Erreur ajout commentaire:', error);
            throw error;
        }
    },

    // Modifier un commentaire
    async updateComment(commentId, content) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            return result;
        } catch (error) {
            console.error('Erreur modification commentaire:', error);
            throw error;
        }
    },

    // Supprimer un commentaire
    async deleteComment(commentId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            return result;
        } catch (error) {
            console.error('Erreur suppression commentaire:', error);
            throw error;
        }
    },

    // Like/Unlike une photo
    async toggleLike(photoId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/comments/photo/${photoId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            return result;
        } catch (error) {
            console.error('Erreur toggle like:', error);
            throw error;
        }
    },

    // Vérifier si la photo est likée
    async checkLiked(photoId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/comments/photo/${photoId}/liked`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            return result.liked;
        } catch (error) {
            console.error('Erreur vérification like:', error);
            return false;
        }
    },

    // Attacher les event listeners
    attachCommentEventListeners(photoId) {
        // Boutons de réponse
        document.querySelectorAll('.btn-reply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.dataset.commentId;
                const username = e.target.dataset.username;
                this.showReplyForm(photoId, commentId, username);
            });
        });

        // Boutons d'édition
        document.querySelectorAll('.edit-comment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.dataset.commentId;
                this.showEditForm(commentId);
            });
        });

        // Boutons de suppression
        document.querySelectorAll('.delete-comment').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const commentId = e.target.dataset.commentId;
                if (confirm('Supprimer ce commentaire ?')) {
                    await this.deleteComment(commentId);
                    this.loadComments(photoId, document.querySelector('.comments-container'));
                }
            });
        });
    },

    // Afficher le formulaire de réponse
    showReplyForm(photoId, parentId, username) {
        const form = document.getElementById('comment-form');
        const input = form.querySelector('textarea');
        input.value = `@${username} `;
        input.focus();
        
        // Stocker l'ID parent temporairement
        form.dataset.parentId = parentId;
    },

    // Afficher le formulaire d'édition
    showEditForm(commentId) {
        const commentEl = document.querySelector(`[data-comment-id="${commentId}"]`);
        const contentEl = commentEl.querySelector('.comment-content');
        const currentContent = contentEl.textContent;

        contentEl.innerHTML = `
            <textarea class="edit-textarea">${currentContent}</textarea>
            <div class="edit-actions">
                <button class="btn-save">Enregistrer</button>
                <button class="btn-cancel">Annuler</button>
            </div>
        `;

        const saveBtn = contentEl.querySelector('.btn-save');
        const cancelBtn = contentEl.querySelector('.btn-cancel');

        saveBtn.addEventListener('click', async () => {
            const newContent = contentEl.querySelector('textarea').value;
            await this.updateComment(commentId, newContent);
            contentEl.textContent = newContent;
        });

        cancelBtn.addEventListener('click', () => {
            contentEl.textContent = currentContent;
        });
    },

    // Utilitaires
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;
        
        return date.toLocaleDateString('fr-FR');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    isOwnComment(userId) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        return currentUser.id === userId;
    }
};

// Export pour utilisation globale
window.CommentsModule = CommentsModule;
