const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const { validateEmail, validatePassword, validateUsername, sanitizeInput } = require('../utils/validation');
const { t } = require('../utils/i18n');

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
    const lang = req.headers['accept-language']?.startsWith('en') ? 'en' : 'fr';
    
    try {
        const { email, password, username } = req.body;
        
        // Validation
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Email invalide' });
        }
        
        if (!validatePassword(password)) {
            return res.status(400).json({ 
                error: 'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre' 
            });
        }
        
        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Le nom d\'utilisateur doit contenir entre 3 et 50 caractères' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier si l'email existe
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            db.close();
            return res.status(400).json({ error: t('auth.email_exists', lang) });
        }
        
        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Créer l'utilisateur
        const result = db.prepare(`
            INSERT INTO users (email, password_hash, username)
            VALUES (?, ?, ?)
        `).run(email, passwordHash, sanitizeInput(username));
        
        const userId = result.lastInsertRowid;
        
        // Générer le token JWT
        const token = jwt.sign(
            { id: userId, email, username: sanitizeInput(username) },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        db.close();
        
        res.json({
            message: t('auth.register_success', lang),
            token,
            user: {
                id: userId,
                email,
                username: sanitizeInput(username)
            }
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Connexion
router.post('/login', async (req, res) => {
    const lang = req.headers['accept-language']?.startsWith('en') ? 'en' : 'fr';
    
    try {
        const { email, password } = req.body;
        
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Email invalide' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const user = db.prepare(`
            SELECT id, email, password_hash, username, is_admin, is_banned, total_points
            FROM users WHERE email = ?
        `).get(email);
        
        if (!user) {
            db.close();
            return res.status(401).json({ error: t('auth.invalid_credentials', lang) });
        }
        
        // Vérifier si banni
        if (user.is_banned) {
            db.close();
            return res.status(403).json({ error: t('auth.banned', lang) });
        }
        
        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            db.close();
            return res.status(401).json({ error: t('auth.invalid_credentials', lang) });
        }
        
        // Mettre à jour last_login
        db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
        
        db.close();
        
        // Générer le token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                username: user.username,
                isAdmin: user.is_admin === 1
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            message: t('auth.login_success', lang),
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                isAdmin: user.is_admin === 1,
                totalPoints: user.total_points
            }
        });
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
