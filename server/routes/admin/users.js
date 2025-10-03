const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../../middleware/auth');
const { adminMiddleware, auditLog } = require('../../middleware/admin');

const router = express.Router();

// Toutes les routes nécessitent auth + admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Récupérer tous les utilisateurs
router.get('/', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const users = db.prepare(`
            SELECT 
                u.id,
                u.email,
                u.username,
                u.is_admin,
                u.is_banned,
                u.total_points,
                u.created_at,
                u.last_login,
                (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND completed = 1) as challenges_completed,
                (SELECT COUNT(*) FROM challenge_photos WHERE user_id = u.id) as photos_uploaded
            FROM users u
            ORDER BY u.created_at DESC
        `).all();
        
        db.close();
        
        res.json(users);
    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer un utilisateur spécifique
router.get('/:userId', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const user = db.prepare(`
            SELECT 
                u.*,
                (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND completed = 1) as challenges_completed,
                (SELECT COUNT(*) FROM challenge_photos WHERE user_id = u.id) as photos_uploaded
            FROM users u
            WHERE u.id = ?
        `).get(req.params.userId);
        
        if (!user) {
            db.close();
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Récupérer l'historique des défis
        const history = db.prepare(`
            SELECT 
                up.*,
                c.title as challenge_title,
                c.points,
                t.name as theme_name
            FROM user_progress up
            JOIN challenges c ON up.challenge_id = c.id
            JOIN themes t ON c.theme_id = t.id
            WHERE up.user_id = ? AND up.completed = 1
            ORDER BY up.completed_at DESC
        `).all(req.params.userId);
        
        user.history = history;
        
        db.close();
        
        res.json(user);
    } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Bannir/Débannir un utilisateur
router.patch('/:userId/ban', auditLog('BAN_USER', 'user'), (req, res) => {
    try {
        const { banned } = req.body;
        const userId = parseInt(req.params.userId);
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que l'utilisateur existe
        const user = db.prepare('SELECT id, is_admin, email FROM users WHERE id = ?').get(userId);
        
        if (!user) {
            db.close();
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Empêcher de bannir un admin
        if (user.is_admin) {
            db.close();
            return res.status(403).json({ error: 'Impossible de bannir un administrateur' });
        }
        
        // Empêcher de se bannir soi-même
        if (userId === req.user.id) {
            db.close();
            return res.status(403).json({ error: 'Impossible de se bannir soi-même' });
        }
        
        db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(banned ? 1 : 0, userId);
        
        db.close();
        
        res.json({ 
            message: banned ? 'Utilisateur banni' : 'Utilisateur débanni',
            user: { id: userId, is_banned: banned }
        });
    } catch (error) {
        console.error('Erreur ban utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Réinitialiser la progression d'un utilisateur
router.post('/:userId/reset', auditLog('RESET_PROGRESS', 'user'), (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que l'utilisateur existe
        const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(userId);
        
        if (!user) {
            db.close();
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Empêcher de réinitialiser un admin
        if (user.is_admin) {
            db.close();
            return res.status(403).json({ error: 'Impossible de réinitialiser un administrateur' });
        }
        
        // Supprimer la progression
        db.prepare('DELETE FROM user_progress WHERE user_id = ?').run(userId);
        
        // Réinitialiser les points
        db.prepare('UPDATE users SET total_points = 0 WHERE id = ?').run(userId);
        
        db.close();
        
        res.json({ message: 'Progression réinitialisée avec succès' });
    } catch (error) {
        console.error('Erreur réinitialisation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un utilisateur
router.delete('/:userId', auditLog('DELETE_USER', 'user'), (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que l'utilisateur existe
        const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(userId);
        
        if (!user) {
            db.close();
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Empêcher de supprimer un admin
        if (user.is_admin) {
            db.close();
            return res.status(403).json({ error: 'Impossible de supprimer un administrateur' });
        }
        
        // Empêcher de se supprimer soi-même
        if (userId === req.user.id) {
            db.close();
            return res.status(403).json({ error: 'Impossible de se supprimer soi-même' });
        }
        
        // Supprimer les photos physiques
        const photos = db.prepare('SELECT filename FROM challenge_photos WHERE user_id = ?').all(userId);
        const fs = require('fs');
        const path = require('path');
        
        photos.forEach(photo => {
            const photoPath = path.join(process.env.UPLOAD_DIR || './uploads', photo.filename);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        });
        
        // Supprimer l'utilisateur (cascade supprimera les relations)
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        
        db.close();
        
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
