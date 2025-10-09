const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rechercher des utilisateurs
router.get('/users/search', authMiddleware, (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Recherche trop courte (min 2 caractères)' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const users = db.prepare(`
            SELECT 
                id,
                username,
                avatar_url,
                bio,
                total_points,
                followers_count,
                following_count,
                (SELECT COUNT(*) FROM user_progress WHERE user_id = users.id AND completed = 1) as completed_challenges
            FROM users
            WHERE username LIKE ? AND is_banned = 0 AND id != ?
            ORDER BY total_points DESC
            LIMIT 20
        `).all(`%${q}%`, req.user.id);
        
        db.close();
        
        res.json(users);
    } catch (error) {
        console.error('Erreur recherche utilisateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Profil d'un utilisateur
router.get('/users/:userId', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const user = db.prepare(`
            SELECT 
                id,
                username,
                avatar_url,
                bio,
                location,
                website,
                total_points,
                followers_count,
                following_count,
                created_at,
                (SELECT COUNT(*) FROM user_progress WHERE user_id = users.id AND completed = 1) as completed_challenges
            FROM users
            WHERE id = ? AND is_banned = 0
        `).get(req.params.userId);
        
        if (!user) {
            db.close();
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Vérifier si l'utilisateur connecté suit cet utilisateur
        const isFollowing = db.prepare(`
            SELECT id FROM user_follows 
            WHERE follower_id = ? AND following_id = ?
        `).get(req.user.id, req.params.userId);
        
        user.is_following = !!isFollowing;
        
        // Récupérer les badges
        const badges = db.prepare(`
            SELECT badge_type, badge_name, badge_description, earned_at
            FROM user_badges
            WHERE user_id = ?
            ORDER BY earned_at DESC
        `).all(req.params.userId);
        
        user.badges = badges;
        
        db.close();
        
        res.json(user);
    } catch (error) {
        console.error('Erreur profil utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Progression d'un utilisateur
router.get('/users/:userId/progress', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const progress = db.prepare(`
            SELECT 
                c.id as challenge_id,
                c.title,
                c.difficulty,
                c.points,
                t.name as theme_name,
                t.color as theme_color,
                t.icon as theme_icon,
                up.completed,
                up.completed_at,
                cp.id as photo_id,
                cp.filename,
                cp.media_type
            FROM user_progress up
            JOIN challenges c ON up.challenge_id = c.id
            JOIN themes t ON c.theme_id = t.id
            LEFT JOIN challenge_photos cp ON up.photo_id = cp.id
            WHERE up.user_id = ?
            ORDER BY up.completed_at DESC
        `).all(req.params.userId);
        
        db.close();
        
        res.json(progress);
    } catch (error) {
        console.error('Erreur progression utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Suivre/Ne plus suivre un utilisateur
router.post('/users/:userId/follow', authMiddleware, (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        
        if (targetUserId === req.user.id) {
            return res.status(400).json({ error: 'Vous ne pouvez pas vous suivre vous-même' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que l'utilisateur cible existe
        const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
        if (!targetUser) {
            db.close();
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Vérifier si déjà suivi
        const existingFollow = db.prepare(`
            SELECT id FROM user_follows 
            WHERE follower_id = ? AND following_id = ?
        `).get(req.user.id, targetUserId);
        
        if (existingFollow) {
            // Ne plus suivre
            db.prepare('DELETE FROM user_follows WHERE id = ?').run(existingFollow.id);
            
            // Mettre à jour les compteurs
            db.prepare('UPDATE users SET followers_count = followers_count - 1 WHERE id = ?').run(targetUserId);
            db.prepare('UPDATE users SET following_count = following_count - 1 WHERE id = ?').run(req.user.id);
            
            db.close();
            return res.json({ following: false });
        } else {
            // Suivre
            db.prepare(`
                INSERT INTO user_follows (follower_id, following_id)
                VALUES (?, ?)
            `).run(req.user.id, targetUserId);
            
            // Mettre à jour les compteurs
            db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(targetUserId);
            db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(req.user.id);
            
            db.close();
            return res.json({ following: true });
        }
    } catch (error) {
        console.error('Erreur follow/unfollow:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Liste des abonnés
router.get('/users/:userId/followers', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const followers = db.prepare(`
            SELECT 
                u.id,
                u.username,
                u.avatar_url,
                u.total_points,
                uf.created_at as followed_at
            FROM user_follows uf
            JOIN users u ON uf.follower_id = u.id
            WHERE uf.following_id = ? AND u.is_banned = 0
            ORDER BY uf.created_at DESC
        `).all(req.params.userId);
        
        db.close();
        
        res.json(followers);
    } catch (error) {
        console.error('Erreur liste abonnés:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Liste des abonnements
router.get('/users/:userId/following', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const following = db.prepare(`
            SELECT 
                u.id,
                u.username,
                u.avatar_url,
                u.total_points,
                uf.created_at as followed_at
            FROM user_follows uf
            JOIN users u ON uf.following_id = u.id
            WHERE uf.follower_id = ? AND u.is_banned = 0
            ORDER BY uf.created_at DESC
        `).all(req.params.userId);
        
        db.close();
        
        res.json(following);
    } catch (error) {
        console.error('Erreur liste abonnements:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Classement global
router.get('/leaderboard', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const leaderboard = db.prepare(`
            SELECT 
                id,
                username,
                avatar_url,
                total_points,
                followers_count,
                (SELECT COUNT(*) FROM user_progress WHERE user_id = users.id AND completed = 1) as completed_challenges
            FROM users
            WHERE is_banned = 0 AND is_admin = 0
            ORDER BY total_points DESC
            LIMIT 50
        `).all();
        
        db.close();
        
        res.json(leaderboard);
    } catch (error) {
        console.error('Erreur classement:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
