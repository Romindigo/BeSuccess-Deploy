const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

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
                avatar_url,
                bio,
                location,
                website,
                created_at,
                last_login,
                (SELECT COUNT(*) FROM user_progress WHERE user_id = users.id AND completed = 1) as challenges_completed,
                (SELECT COUNT(*) FROM challenges) as total_challenges
            FROM users
            WHERE id = ?
        `).get(req.user.id);
        
        db.close();
        
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Calculer la progression sur 100 défis
        const TARGET_CHALLENGES = 100;
        user.progress_percentage = Math.min(100, Math.round((user.challenges_completed / TARGET_CHALLENGES) * 100));
        user.target_challenges = TARGET_CHALLENGES;
        user.bonus_challenges = user.challenges_completed > TARGET_CHALLENGES ? user.challenges_completed - TARGET_CHALLENGES : 0;
        
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

// Upload photo de profil
router.post('/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Récupérer l'ancien avatar pour le supprimer
        const user = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(req.user.id);
        
        // Redimensionner l'image en 200x200 pour l'avatar
        const avatarPath = req.file.path.replace(path.extname(req.file.path), '_avatar' + path.extname(req.file.path));
        
        await sharp(req.file.path)
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toFile(avatarPath);
        
        // Supprimer l'original
        fs.unlinkSync(req.file.path);
        
        // Générer l'URL de l'avatar
        const avatarUrl = '/uploads/' + path.basename(avatarPath);
        
        // Mettre à jour dans la base de données
        db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);
        
        // Supprimer l'ancien avatar si existant
        if (user.avatar_url && user.avatar_url !== '/images/default-avatar.png') {
            const oldAvatarPath = path.join(__dirname, '../../uploads', path.basename(user.avatar_url));
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }
        
        db.close();
        
        res.json({ 
            message: 'Photo de profil mise à jour',
            avatar_url: avatarUrl
        });
    } catch (error) {
        console.error('Erreur upload avatar:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Mettre à jour le profil
router.put('/me', authMiddleware, (req, res) => {
    try {
        const { username, bio, location, website } = req.body;
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que le username n'est pas déjà pris
        if (username) {
            const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id);
            if (existing) {
                db.close();
                return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
            }
        }
        
        // Mettre à jour
        db.prepare(`
            UPDATE users 
            SET username = COALESCE(?, username),
                bio = ?,
                location = ?,
                website = ?
            WHERE id = ?
        `).run(username, bio || null, location || null, website || null, req.user.id);
        
        db.close();
        
        res.json({ message: 'Profil mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
