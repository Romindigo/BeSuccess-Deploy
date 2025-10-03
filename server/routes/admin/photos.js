const express = require('express');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../../middleware/auth');
const { adminMiddleware, auditLog } = require('../../middleware/admin');

const router = express.Router();

// Toutes les routes nécessitent auth + admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Récupérer toutes les photos avec filtres
router.get('/', (req, res) => {
    try {
        const { status = 'all' } = req.query;
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        let query = `
            SELECT 
                cp.*,
                u.username,
                u.email,
                c.title as challenge_title,
                t.name as theme_name
            FROM challenge_photos cp
            JOIN users u ON cp.user_id = u.id
            JOIN challenges c ON cp.challenge_id = c.id
            JOIN themes t ON c.theme_id = t.id
        `;
        
        if (status === 'flagged') {
            query += ' WHERE cp.flag_count > 0';
        } else if (status === 'hidden') {
            query += ' WHERE cp.status = "hidden"';
        } else if (status === 'visible') {
            query += ' WHERE cp.status = "visible"';
        }
        
        query += ' ORDER BY cp.created_at DESC';
        
        const photos = db.prepare(query).all();
        
        db.close();
        
        res.json(photos);
    } catch (error) {
        console.error('Erreur récupération photos admin:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Modifier le statut d'une photo (masquer/approuver)
router.patch('/:photoId', auditLog('MODERATE_PHOTO', 'photo'), (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['visible', 'hidden'].includes(status)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const photo = db.prepare('SELECT id FROM challenge_photos WHERE id = ?').get(req.params.photoId);
        
        if (!photo) {
            db.close();
            return res.status(404).json({ error: 'Photo non trouvée' });
        }
        
        db.prepare(`
            UPDATE challenge_photos 
            SET status = ?,
                moderated_by = ?,
                moderated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(status, req.user.id, req.params.photoId);
        
        db.close();
        
        res.json({ 
            message: status === 'visible' ? 'Photo approuvée' : 'Photo masquée',
            photo: { id: req.params.photoId, status }
        });
    } catch (error) {
        console.error('Erreur modération photo:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer une photo
router.delete('/:photoId', auditLog('DELETE_PHOTO', 'photo'), (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const photo = db.prepare('SELECT id, filename, user_id FROM challenge_photos WHERE id = ?').get(req.params.photoId);
        
        if (!photo) {
            db.close();
            return res.status(404).json({ error: 'Photo non trouvée' });
        }
        
        // Supprimer le fichier physique
        const photoPath = path.join(process.env.UPLOAD_DIR || './uploads', photo.filename);
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }
        
        // Supprimer de la base
        db.prepare('DELETE FROM challenge_photos WHERE id = ?').run(req.params.photoId);
        
        // Mettre à jour user_progress si c'était la photo associée
        db.prepare('UPDATE user_progress SET photo_id = NULL WHERE photo_id = ?').run(req.params.photoId);
        
        db.close();
        
        res.json({ message: 'Photo supprimée avec succès' });
    } catch (error) {
        console.error('Erreur suppression photo:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Réinitialiser les signalements d'une photo
router.post('/:photoId/reset-flags', auditLog('RESET_FLAGS', 'photo'), (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const photo = db.prepare('SELECT id FROM challenge_photos WHERE id = ?').get(req.params.photoId);
        
        if (!photo) {
            db.close();
            return res.status(404).json({ error: 'Photo non trouvée' });
        }
        
        db.prepare(`
            UPDATE challenge_photos 
            SET flag_count = 0,
                flagged_at = NULL,
                flag_reason = NULL
            WHERE id = ?
        `).run(req.params.photoId);
        
        db.close();
        
        res.json({ message: 'Signalements réinitialisés' });
    } catch (error) {
        console.error('Erreur réinitialisation signalements:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
