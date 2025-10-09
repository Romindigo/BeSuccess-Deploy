const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../middleware/auth');
const { sanitizeInput } = require('../utils/validation');

const router = express.Router();

// Récupérer les commentaires d'une photo/vidéo
router.get('/photo/:photoId', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const comments = db.prepare(`
            SELECT 
                c.id,
                c.content,
                c.created_at,
                c.updated_at,
                c.parent_id,
                u.id as user_id,
                u.username,
                u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.photo_id = ? AND c.status = 'visible'
            ORDER BY c.created_at ASC
        `).all(req.params.photoId);
        
        db.close();
        
        res.json(comments);
    } catch (error) {
        console.error('Erreur récupération commentaires:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Ajouter un commentaire
router.post('/photo/:photoId', authMiddleware, (req, res) => {
    try {
        const { content, parent_id } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Le commentaire ne peut pas être vide' });
        }
        
        if (content.length > 500) {
            return res.status(400).json({ error: 'Le commentaire est trop long (max 500 caractères)' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que la photo existe
        const photo = db.prepare('SELECT id FROM challenge_photos WHERE id = ?').get(req.params.photoId);
        if (!photo) {
            db.close();
            return res.status(404).json({ error: 'Photo non trouvée' });
        }
        
        // Vérifier le commentaire parent si fourni
        if (parent_id) {
            const parentComment = db.prepare('SELECT id FROM comments WHERE id = ? AND photo_id = ?').get(parent_id, req.params.photoId);
            if (!parentComment) {
                db.close();
                return res.status(404).json({ error: 'Commentaire parent non trouvé' });
            }
        }
        
        // Insérer le commentaire
        const result = db.prepare(`
            INSERT INTO comments (photo_id, user_id, content, parent_id)
            VALUES (?, ?, ?, ?)
        `).run(req.params.photoId, req.user.id, sanitizeInput(content), parent_id || null);
        
        const commentId = result.lastInsertRowid;
        
        // Récupérer le commentaire créé
        const comment = db.prepare(`
            SELECT 
                c.id,
                c.content,
                c.created_at,
                c.updated_at,
                c.parent_id,
                u.id as user_id,
                u.username,
                u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `).get(commentId);
        
        db.close();
        
        res.status(201).json(comment);
    } catch (error) {
        console.error('Erreur ajout commentaire:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Modifier un commentaire
router.put('/:commentId', authMiddleware, (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Le commentaire ne peut pas être vide' });
        }
        
        if (content.length > 500) {
            return res.status(400).json({ error: 'Le commentaire est trop long (max 500 caractères)' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const comment = db.prepare('SELECT id, user_id FROM comments WHERE id = ?').get(req.params.commentId);
        
        if (!comment) {
            db.close();
            return res.status(404).json({ error: 'Commentaire non trouvé' });
        }
        
        // Vérifier que l'utilisateur est le propriétaire
        if (comment.user_id !== req.user.id) {
            db.close();
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        db.prepare(`
            UPDATE comments 
            SET content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(sanitizeInput(content), req.params.commentId);
        
        // Récupérer le commentaire mis à jour
        const updatedComment = db.prepare(`
            SELECT 
                c.id,
                c.content,
                c.created_at,
                c.updated_at,
                c.parent_id,
                u.id as user_id,
                u.username,
                u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `).get(req.params.commentId);
        
        db.close();
        
        res.json(updatedComment);
    } catch (error) {
        console.error('Erreur modification commentaire:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un commentaire
router.delete('/:commentId', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const comment = db.prepare('SELECT id, user_id FROM comments WHERE id = ?').get(req.params.commentId);
        
        if (!comment) {
            db.close();
            return res.status(404).json({ error: 'Commentaire non trouvé' });
        }
        
        // Vérifier que l'utilisateur est le propriétaire ou admin
        const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.id);
        
        if (comment.user_id !== req.user.id && !user.is_admin) {
            db.close();
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        // Masquer le commentaire au lieu de le supprimer
        db.prepare(`
            UPDATE comments 
            SET status = 'hidden'
            WHERE id = ?
        `).run(req.params.commentId);
        
        db.close();
        
        res.json({ message: 'Commentaire supprimé' });
    } catch (error) {
        console.error('Erreur suppression commentaire:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Liker/Unliker une photo
router.post('/photo/:photoId/like', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que la photo existe
        const photo = db.prepare('SELECT id FROM challenge_photos WHERE id = ?').get(req.params.photoId);
        if (!photo) {
            db.close();
            return res.status(404).json({ error: 'Photo non trouvée' });
        }
        
        // Vérifier si déjà liké
        const existingLike = db.prepare('SELECT id FROM photo_likes WHERE photo_id = ? AND user_id = ?')
            .get(req.params.photoId, req.user.id);
        
        if (existingLike) {
            // Unliker
            db.prepare('DELETE FROM photo_likes WHERE id = ?').run(existingLike.id);
            const likesCount = db.prepare('SELECT COUNT(*) as count FROM photo_likes WHERE photo_id = ?')
                .get(req.params.photoId).count;
            db.close();
            return res.json({ liked: false, likes_count: likesCount });
        } else {
            // Liker
            db.prepare('INSERT INTO photo_likes (photo_id, user_id) VALUES (?, ?)')
                .run(req.params.photoId, req.user.id);
            const likesCount = db.prepare('SELECT COUNT(*) as count FROM photo_likes WHERE photo_id = ?')
                .get(req.params.photoId).count;
            db.close();
            return res.json({ liked: true, likes_count: likesCount });
        }
    } catch (error) {
        console.error('Erreur like/unlike:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Vérifier si l'utilisateur a liké une photo
router.get('/photo/:photoId/liked', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const like = db.prepare('SELECT id FROM photo_likes WHERE photo_id = ? AND user_id = ?')
            .get(req.params.photoId, req.user.id);
        
        db.close();
        
        res.json({ liked: !!like });
    } catch (error) {
        console.error('Erreur vérification like:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
