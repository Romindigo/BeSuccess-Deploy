const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../../middleware/auth');
const { adminMiddleware, auditLog } = require('../../middleware/admin');
const { sanitizeInput } = require('../../utils/validation');

const router = express.Router();

// Toutes les routes nécessitent auth + admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Créer une nouvelle thématique
router.post('/themes', auditLog('CREATE_THEME', 'theme'), (req, res) => {
    try {
        const { name, description, color, icon } = req.body;
        
        if (!name || !color || !icon) {
            return res.status(400).json({ error: 'Champs requis manquants' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const result = db.prepare(`
            INSERT INTO themes (name, description, color, icon)
            VALUES (?, ?, ?, ?)
        `).run(
            sanitizeInput(name),
            sanitizeInput(description),
            sanitizeInput(color),
            sanitizeInput(icon)
        );
        
        db.close();
        
        res.json({
            message: 'Thématique créée avec succès',
            theme: {
                id: result.lastInsertRowid,
                name: sanitizeInput(name),
                description: sanitizeInput(description),
                color: sanitizeInput(color),
                icon: sanitizeInput(icon)
            }
        });
    } catch (error) {
        console.error('Erreur création thématique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Créer un nouveau défi
router.post('/challenges', auditLog('CREATE_CHALLENGE', 'challenge'), (req, res) => {
    try {
        const { theme_id, title, description, difficulty, points } = req.body;
        
        if (!theme_id || !title || !description || !difficulty || !points) {
            return res.status(400).json({ error: 'Champs requis manquants' });
        }
        
        if (difficulty < 1 || difficulty > 5) {
            return res.status(400).json({ error: 'La difficulté doit être entre 1 et 5' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que la thématique existe
        const theme = db.prepare('SELECT id FROM themes WHERE id = ?').get(theme_id);
        if (!theme) {
            db.close();
            return res.status(404).json({ error: 'Thématique non trouvée' });
        }
        
        const result = db.prepare(`
            INSERT INTO challenges (theme_id, title, description, difficulty, points)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            theme_id,
            sanitizeInput(title),
            sanitizeInput(description),
            difficulty,
            points
        );
        
        db.close();
        
        res.json({
            message: 'Défi créé avec succès',
            challenge: {
                id: result.lastInsertRowid,
                theme_id,
                title: sanitizeInput(title),
                description: sanitizeInput(description),
                difficulty,
                points
            }
        });
    } catch (error) {
        console.error('Erreur création défi:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Modifier une thématique
router.patch('/themes/:themeId', auditLog('UPDATE_THEME', 'theme'), (req, res) => {
    try {
        const { name, description, color, icon } = req.body;
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const theme = db.prepare('SELECT id FROM themes WHERE id = ?').get(req.params.themeId);
        if (!theme) {
            db.close();
            return res.status(404).json({ error: 'Thématique non trouvée' });
        }
        
        db.prepare(`
            UPDATE themes 
            SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                color = COALESCE(?, color),
                icon = COALESCE(?, icon)
            WHERE id = ?
        `).run(
            name ? sanitizeInput(name) : null,
            description ? sanitizeInput(description) : null,
            color ? sanitizeInput(color) : null,
            icon ? sanitizeInput(icon) : null,
            req.params.themeId
        );
        
        db.close();
        
        res.json({ message: 'Thématique mise à jour' });
    } catch (error) {
        console.error('Erreur mise à jour thématique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Modifier un défi
router.patch('/challenges/:challengeId', auditLog('UPDATE_CHALLENGE', 'challenge'), (req, res) => {
    try {
        const { title, description, difficulty, points } = req.body;
        
        if (difficulty && (difficulty < 1 || difficulty > 5)) {
            return res.status(400).json({ error: 'La difficulté doit être entre 1 et 5' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const challenge = db.prepare('SELECT id FROM challenges WHERE id = ?').get(req.params.challengeId);
        if (!challenge) {
            db.close();
            return res.status(404).json({ error: 'Défi non trouvé' });
        }
        
        db.prepare(`
            UPDATE challenges 
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                difficulty = COALESCE(?, difficulty),
                points = COALESCE(?, points)
            WHERE id = ?
        `).run(
            title ? sanitizeInput(title) : null,
            description ? sanitizeInput(description) : null,
            difficulty || null,
            points || null,
            req.params.challengeId
        );
        
        db.close();
        
        res.json({ message: 'Défi mis à jour' });
    } catch (error) {
        console.error('Erreur mise à jour défi:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer une thématique
router.delete('/themes/:themeId', auditLog('DELETE_THEME', 'theme'), (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const theme = db.prepare('SELECT id FROM themes WHERE id = ?').get(req.params.themeId);
        if (!theme) {
            db.close();
            return res.status(404).json({ error: 'Thématique non trouvée' });
        }
        
        // Vérifier s'il y a des défis associés
        const challengeCount = db.prepare('SELECT COUNT(*) as count FROM challenges WHERE theme_id = ?').get(req.params.themeId).count;
        
        if (challengeCount > 0) {
            db.close();
            return res.status(400).json({ error: 'Impossible de supprimer une thématique contenant des défis' });
        }
        
        db.prepare('DELETE FROM themes WHERE id = ?').run(req.params.themeId);
        
        db.close();
        
        res.json({ message: 'Thématique supprimée' });
    } catch (error) {
        console.error('Erreur suppression thématique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un défi
router.delete('/challenges/:challengeId', auditLog('DELETE_CHALLENGE', 'challenge'), (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const challenge = db.prepare('SELECT id FROM challenges WHERE id = ?').get(req.params.challengeId);
        if (!challenge) {
            db.close();
            return res.status(404).json({ error: 'Défi non trouvé' });
        }
        
        db.prepare('DELETE FROM challenges WHERE id = ?').run(req.params.challengeId);
        
        db.close();
        
        res.json({ message: 'Défi supprimé' });
    } catch (error) {
        console.error('Erreur suppression défi:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
