const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Récupérer le profil de l'utilisateur connecté
router.get('/me', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const user = db.prepare(`
            SELECT 
                id,
                email,
                username,
                total_points,
                created_at,
                last_login,
                (SELECT COUNT(*) FROM user_progress WHERE user_id = users.id AND completed = 1) as challenges_completed,
                (SELECT COUNT(DISTINCT challenge_id) FROM challenges) as total_challenges
            FROM users
            WHERE id = ?
        `).get(req.user.id);
        
        db.close();
        
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Calculer la progression en pourcentage
        user.progress_percentage = user.total_challenges > 0 
            ? Math.round((user.challenges_completed / user.total_challenges) * 100)
            : 0;
        
        res.json(user);
    } catch (error) {
        console.error('Erreur récupération profil:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer l'historique des défis complétés
router.get('/me/history', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const history = db.prepare(`
            SELECT 
                up.*,
                c.title as challenge_title,
                c.points,
                c.difficulty,
                t.name as theme_name,
                t.color as theme_color,
                t.icon as theme_icon
            FROM user_progress up
            JOIN challenges c ON up.challenge_id = c.id
            JOIN themes t ON c.theme_id = t.id
            WHERE up.user_id = ? AND up.completed = 1
            ORDER BY up.completed_at DESC
        `).all(req.user.id);
        
        db.close();
        
        res.json(history);
    } catch (error) {
        console.error('Erreur récupération historique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer les statistiques par thématique
router.get('/me/stats', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const stats = db.prepare(`
            SELECT 
                t.id,
                t.name,
                t.color,
                t.icon,
                COUNT(DISTINCT c.id) as total_challenges,
                COUNT(DISTINCT CASE WHEN up.completed = 1 THEN c.id END) as completed_challenges,
                COALESCE(SUM(CASE WHEN up.completed = 1 THEN c.points ELSE 0 END), 0) as points_earned
            FROM themes t
            LEFT JOIN challenges c ON t.id = c.theme_id
            LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = ?
            GROUP BY t.id
            ORDER BY t.id
        `).all(req.user.id);
        
        db.close();
        
        res.json(stats);
    } catch (error) {
        console.error('Erreur récupération statistiques:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
