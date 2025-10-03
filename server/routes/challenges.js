const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Récupérer toutes les thématiques avec leurs défis
router.get('/themes', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const themes = db.prepare(`
            SELECT t.*, COUNT(c.id) as challenge_count
            FROM themes t
            LEFT JOIN challenges c ON t.id = c.theme_id
            GROUP BY t.id
            ORDER BY t.id
        `).all();
        
        db.close();
        
        res.json(themes);
    } catch (error) {
        console.error('Erreur récupération thématiques:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer tous les défis avec progression utilisateur
router.get('/', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const challenges = db.prepare(`
            SELECT 
                c.*,
                t.name as theme_name,
                t.color as theme_color,
                t.icon as theme_icon,
                up.completed,
                up.completed_at,
                (SELECT COUNT(*) FROM challenge_photos WHERE challenge_id = c.id AND status = 'visible') as photo_count
            FROM challenges c
            JOIN themes t ON c.theme_id = t.id
            LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = ?
            ORDER BY c.theme_id, c.difficulty
        `).all(req.user.id);
        
        db.close();
        
        res.json(challenges);
    } catch (error) {
        console.error('Erreur récupération défis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer un défi spécifique
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const challenge = db.prepare(`
            SELECT 
                c.*,
                t.name as theme_name,
                t.color as theme_color,
                t.icon as theme_icon,
                up.completed,
                up.completed_at,
                (SELECT COUNT(*) FROM challenge_photos WHERE challenge_id = c.id AND status = 'visible') as photo_count
            FROM challenges c
            JOIN themes t ON c.theme_id = t.id
            LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = ?
            WHERE c.id = ?
        `).get(req.user.id, req.params.id);
        
        db.close();
        
        if (!challenge) {
            return res.status(404).json({ error: 'Défi non trouvé' });
        }
        
        res.json(challenge);
    } catch (error) {
        console.error('Erreur récupération défi:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Marquer un défi comme complété
router.post('/:id/complete', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier si le défi existe
        const challenge = db.prepare('SELECT id, points FROM challenges WHERE id = ?').get(req.params.id);
        if (!challenge) {
            db.close();
            return res.status(404).json({ error: 'Défi non trouvé' });
        }
        
        // Vérifier si déjà complété
        const existing = db.prepare(`
            SELECT id FROM user_progress 
            WHERE user_id = ? AND challenge_id = ?
        `).get(req.user.id, req.params.id);
        
        if (existing) {
            db.close();
            return res.status(400).json({ error: 'Défi déjà complété' });
        }
        
        // Marquer comme complété
        db.prepare(`
            INSERT INTO user_progress (user_id, challenge_id, completed, completed_at)
            VALUES (?, ?, 1, CURRENT_TIMESTAMP)
        `).run(req.user.id, req.params.id);
        
        // Mettre à jour les points de l'utilisateur
        db.prepare(`
            UPDATE users 
            SET total_points = total_points + ?
            WHERE id = ?
        `).run(challenge.points, req.user.id);
        
        const updatedUser = db.prepare('SELECT total_points FROM users WHERE id = ?').get(req.user.id);
        
        db.close();
        
        res.json({
            message: 'Défi complété avec succès',
            points_earned: challenge.points,
            total_points: updatedUser.total_points
        });
    } catch (error) {
        console.error('Erreur complétion défi:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
