const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../../middleware/auth');
const { adminMiddleware } = require('../../middleware/admin');

const router = express.Router();

// Toutes les routes nécessitent auth + admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Statistiques générales
router.get('/stats', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const stats = {
            users: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 0').get().count,
            challenges: db.prepare('SELECT COUNT(*) as count FROM challenges').get().count,
            photos: db.prepare('SELECT COUNT(*) as count FROM challenge_photos').get().count,
            flagged_photos: db.prepare('SELECT COUNT(*) as count FROM challenge_photos WHERE flag_count > 0').get().count,
            active_users: db.prepare(`
                SELECT COUNT(DISTINCT user_id) as count 
                FROM user_progress 
                WHERE completed_at >= datetime('now', '-7 days')
            `).get().count,
            total_points: db.prepare('SELECT COALESCE(SUM(total_points), 0) as total FROM users').get().total
        };
        
        db.close();
        
        res.json(stats);
    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Activité récente
router.get('/activity', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Dernières inscriptions
        const recentUsers = db.prepare(`
            SELECT id, username, email, created_at
            FROM users
            WHERE is_admin = 0
            ORDER BY created_at DESC
            LIMIT 10
        `).all();
        
        // Dernières photos
        const recentPhotos = db.prepare(`
            SELECT 
                cp.id,
                cp.filename,
                cp.created_at,
                u.username,
                c.title as challenge_title
            FROM challenge_photos cp
            JOIN users u ON cp.user_id = u.id
            JOIN challenges c ON cp.challenge_id = c.id
            ORDER BY cp.created_at DESC
            LIMIT 10
        `).all();
        
        // Derniers défis complétés
        const recentCompletions = db.prepare(`
            SELECT 
                up.completed_at,
                u.username,
                c.title as challenge_title,
                c.points
            FROM user_progress up
            JOIN users u ON up.user_id = u.id
            JOIN challenges c ON up.challenge_id = c.id
            WHERE up.completed = 1
            ORDER BY up.completed_at DESC
            LIMIT 10
        `).all();
        
        db.close();
        
        res.json({
            recentUsers,
            recentPhotos,
            recentCompletions
        });
    } catch (error) {
        console.error('Erreur récupération activité:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Logs d'audit
router.get('/audit', (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const logs = db.prepare(`
            SELECT 
                aa.*,
                u.username as admin_username
            FROM admin_audit aa
            JOIN users u ON aa.admin_id = u.id
            ORDER BY aa.created_at DESC
            LIMIT ?
        `).all(parseInt(limit));
        
        db.close();
        
        res.json(logs);
    } catch (error) {
        console.error('Erreur récupération audit:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
